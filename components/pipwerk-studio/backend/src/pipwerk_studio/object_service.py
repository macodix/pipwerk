"""Objects of pipwerk Studio: strategies and templates as documents in the object directory.

This layer connects the object store (files) with the shared library: it reads
and checks documents, normalizes and checks them when they are saved, lists
objects and finds the usages of a template. It has no knowledge of single
element types or object types; types, check and documents come from the
library (specification E1, E2). It does not know HTTP.

Rules (specification 4.1, 4.2):

- A file that cannot be read, does not fit the document schema, has another
  format than its file name says or names another identifier than its file
  name is "not readable". It is listed with that mark and never changed:
  it cannot be read, replaced or deleted through this layer (the caller sees
  ``ObjectUnreadableError``).
- Saving writes the expressions in the normalized spelling of the library. The
  findings of the check never prevent saving (req-ablauf-005).
- The delivered templates come from the library. They are not in the object
  directory and cannot be replaced or deleted.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from pipwerk_domain.consistency import (
    CheckResult,
    Finding,
    check_strategy,
    check_strategy_with_names,
    check_template,
    check_template_with_names,
)
from pipwerk_domain.defaults import builtin_templates
from pipwerk_domain.documents import (
    AnyDocument,
    DocumentError,
    document_to_json,
    from_document,
    load_json,
    parse_document,
    to_document,
    write_document,
)
from pipwerk_domain.limits import MAX_DOCUMENT_BYTES
from pipwerk_domain.model import Instance, ObjectContent, Strategy, Template
from pipwerk_domain.normalize import normalize_strategy, normalize_template
from pipwerk_domain.registry import ElementRegistry

from pipwerk_studio.object_store import (
    OBJECT_KINDS,
    ObjectDirectoryNotSetError,
    ObjectEntry,
    ObjectKind,
    ObjectStore,
    ObjectStoreError,
    ObjectWriteError,
    check_object_id,
    check_object_kind,
)

#: The largest object file that is read. A document of at most ``MAX_DOCUMENT_BYTES`` is
#: accepted as a body; written with indentation it is larger than that, but never by this
#: factor.
MAX_STORED_FILE_FACTOR = 8
MAX_STORED_FILE_BYTES = MAX_STORED_FILE_FACTOR * MAX_DOCUMENT_BYTES

_ATTEMPTS = 10


class ObjectServiceError(Exception):
    """Base class of the errors of this layer. Messages name no path."""


class ObjectNotFoundError(ObjectServiceError):
    """There is no such object."""


class ObjectUnreadableError(ObjectServiceError):
    """The file of the object cannot be read or does not fit the document schema."""


class ObjectKindConflictError(ObjectServiceError):
    """An entry of the same identifier but another kind lies in the object directory.

    Any entry blocks saving, whatever it is (for example a file, readable or not, a
    symbolic link or a directory).
    """


class ObjectNameTakenError(ObjectServiceError):
    """The file name of the object is taken by an entry that is no readable regular file.

    The entry (for example a symbolic link with or without target, or a directory) is
    neither followed nor replaced.
    """


class BuiltinObjectError(ObjectServiceError):
    """The object is a delivered template; it cannot be changed or deleted (E6)."""


class DocumentKindError(ObjectServiceError):
    """The format of the document does not fit the kind of object."""


class DocumentIdentifierError(ObjectServiceError):
    """The identifier in the document is not the one of the path."""


class DocumentTooLargeError(ObjectServiceError):
    """The document written as a file would be larger than the largest object file."""


class ObjectWriteFailedError(ObjectServiceError):
    """The file could not be written or deleted."""


class ObjectDirectoryMissingError(ObjectServiceError):
    """There is no object directory."""


class ObjectDirectoryUnreadableError(ObjectServiceError):
    """The object directory cannot be listed (for example it is no directory)."""


@dataclass(frozen=True)
class ListEntry:
    """An object in the list. A file that is not readable has only the identifier and the
    time of its last change."""

    object_id: str
    modified: datetime
    unreadable: bool
    name: str | None = None
    description: str | None = None
    object_type: str | None = None


@dataclass(frozen=True)
class StoredObject:
    """A readable object: the text of its document and the document parsed."""

    object_id: str
    text: str
    document: AnyDocument


@dataclass(frozen=True)
class SavedObject:
    """The result of saving: the document as written and the findings of the check."""

    object_id: str
    text: str
    findings: list[Finding]
    created: bool = True
    """Whether the file was created (``True``) or an existing file was replaced."""


@dataclass(frozen=True)
class Usage:
    """A strategy or template that contains an instance made from a template."""

    kind: ObjectKind
    object_id: str
    name: str


@dataclass(frozen=True)
class Usages:
    """The usages of a template and the number of files that were skipped as not readable."""

    usages: list[Usage]
    skipped_unreadable: int


@dataclass(frozen=True)
class _Loaded:
    """An object file that was read: ``ok`` with the object, ``missing`` or ``unreadable``."""

    status: Literal["ok", "missing", "unreadable"]
    stored: StoredObject | None = None


def _is_format_one(text: str) -> bool:
    """Whether a document text that the library has accepted is of the format 1.0."""
    data = load_json(text)
    if not isinstance(data, dict):  # pragma: no cover - the library accepted it
        return False
    version = data.get("format_version")
    return isinstance(version, str) and version.startswith("1.")


def document_kind(document: AnyDocument) -> ObjectKind:
    """The kind of object of a document, from its field ``format`` (``pipwerk.<kind>``)."""
    return check_object_kind(document.format.removeprefix("pipwerk."))


def _contained(content: ObjectContent) -> Iterator[Instance]:
    """All instances inside the content of a template or instance, at any depth."""
    stack: list[Instance] = [*content.instances, *content.rules]
    while stack:
        instance = stack.pop()
        yield instance
        stack.extend(instance.instances)
        stack.extend(instance.rules)


def _all_instances(value: Strategy | Template) -> Iterator[Instance]:
    """All instances of a strategy or template: those of the strategy, of its elements and
    rules, and all that are contained in them."""
    if isinstance(value, Template):
        yield from _contained(value)
        return
    top: list[Instance] = list(value.rules)
    for element in value.elements:
        if element.instance is not None:
            top.append(element.instance)
        top.extend(element.rules)
    for instance in top:
        yield instance
        yield from _contained(instance)


def _contains_origin(value: Strategy | Template, template_id: str) -> bool:
    return any(
        instance.origin is not None and instance.origin.template_id == template_id
        for instance in _all_instances(value)
    )


def _sort_key(entry: ListEntry) -> tuple[bool, str, str]:
    return (entry.name is None, (entry.name or "").casefold(), entry.object_id)


class ObjectService:
    """Reads, saves, deletes and lists the objects and finds the usages of a template."""

    def __init__(self, store: ObjectStore, registry: ElementRegistry) -> None:
        self._store = store
        self._registry = registry
        self._builtin: dict[str, tuple[ObjectKind, Template]] = {}
        for template in builtin_templates():
            self._builtin[template.id] = (document_kind(to_document(template)), template)

    # --- reading ---------------------------------------------------------------------

    def _load(self, kind: ObjectKind, object_id: str) -> _Loaded:
        result = self._store.read_bytes(kind, object_id, MAX_STORED_FILE_BYTES)
        if result.status == "missing":
            return _Loaded("missing")
        if result.value is None:
            return _Loaded("unreadable")
        try:
            document = parse_document(result.value)
        except DocumentError:
            return _Loaded("unreadable")
        if document.id != object_id or document_kind(document) != kind:
            return _Loaded("unreadable")
        text = result.value.decode("utf-8")
        if _is_format_one(text):
            # a file of the format 1.0 stays as it is until it is saved; it is read as 2.0
            text = document_to_json(document)
        return _Loaded("ok", StoredObject(object_id, text, document))

    def _require(self, kind: ObjectKind, object_id: str) -> StoredObject:
        loaded = self._load(kind, object_id)
        if loaded.stored is None:
            if loaded.status == "missing":
                raise ObjectNotFoundError("The object does not exist.")
            raise ObjectUnreadableError("The object file cannot be read.")
        return loaded.stored

    def read(self, kind: str, object_id: str) -> StoredObject:
        """The object as stored. A delivered template is returned as the library writes it.

        Raises ``ObjectNotFoundError`` and ``ObjectUnreadableError``.
        """
        checked_kind = check_object_kind(kind)
        object_id = check_object_id(object_id)
        builtin = self._builtin.get(object_id)
        if builtin is None:
            return self._require(checked_kind, object_id)
        if builtin[0] != checked_kind:
            raise ObjectNotFoundError("The object does not exist.")
        return StoredObject(object_id, write_document(builtin[1]), to_document(builtin[1]))

    def _listing(self, kind: ObjectKind) -> list[ObjectEntry]:
        try:
            return self._store.list_objects(kind)
        except ObjectStoreError as error:
            raise ObjectDirectoryUnreadableError("The object directory cannot be read.") from error

    def list_objects(self, kind: str) -> list[ListEntry]:
        """The objects of one kind with title, description and time of the last change; the
        not readable ones with the mark only. Sorted by title (not readable ones last).

        Raises ``ObjectDirectoryUnreadableError`` if the object directory cannot be listed.
        """
        checked_kind = check_object_kind(kind)
        entries: list[ListEntry] = []
        for item in self._listing(checked_kind):
            loaded = self._load(checked_kind, item.object_id)
            if loaded.stored is not None:
                document = loaded.stored.document
                entries.append(
                    ListEntry(
                        item.object_id,
                        item.modified,
                        False,
                        document.name,
                        document.description,
                        getattr(document, "object_type", None),
                    )
                )
            elif loaded.status == "unreadable":  # a file deleted since the listing is no entry
                entries.append(ListEntry(item.object_id, item.modified, True))
        return sorted(entries, key=_sort_key)

    # --- saving ----------------------------------------------------------------------

    def _prepare(self, document: AnyDocument) -> tuple[str, list[Finding]]:
        """Write the expressions of the document in the normalized spelling, check it and
        write its text. The findings refer to the text that is saved.

        Raises ``DocumentError`` if the document cannot be written as text (for example a
        single surrogate character) and ``DocumentTooLargeError``.
        """
        value = from_document(document)
        if isinstance(value, Strategy):
            normalized_strategy = normalize_strategy(value)
            text = write_document(normalized_strategy)
            findings = check_strategy(normalized_strategy, self._registry)
        else:
            normalized_template = normalize_template(value)
            text = write_document(normalized_template)
            findings = check_template(normalized_template, self._registry)
        if len(text.encode("utf-8")) > MAX_STORED_FILE_BYTES:
            raise DocumentTooLargeError("The document is too large.")
        return text, findings

    def _write(self, kind: ObjectKind, object_id: str, text: str) -> None:
        try:
            self._store.write(kind, object_id, text)
        except ObjectDirectoryNotSetError as error:
            raise ObjectDirectoryMissingError("The object directory is not set.") from error
        except ObjectWriteError as error:
            raise ObjectWriteFailedError("The object file cannot be written.") from error

    def create(self, kind: str, document: AnyDocument) -> SavedObject:
        """Save a document under a new identifier. An identifier in the document is replaced.

        Raises ``DocumentKindError``, ``DocumentError`` (the text cannot be written),
        ``DocumentTooLargeError``, ``ObjectDirectoryMissingError`` and
        ``ObjectWriteFailedError``.
        """
        checked_kind = check_object_kind(kind)
        if document_kind(document) != checked_kind:
            raise DocumentKindError("The document does not fit the kind of object.")
        for _ in range(_ATTEMPTS):
            object_id = str(uuid.uuid4())
            if object_id in self._builtin:
                continue
            text, findings = self._prepare(document.model_copy(update={"id": object_id}))
            with self._store.lock:
                # a name that is taken (by a file of any content) is never overwritten
                if self._store.read_bytes(checked_kind, object_id, 0).status != "missing":
                    continue
                self._write(checked_kind, object_id, text)
            return SavedObject(object_id, text, findings)
        raise ObjectWriteFailedError("The object file cannot be written.")

    def replace(self, kind: str, object_id: str, document: AnyDocument) -> SavedObject:
        """Save a document under the identifier of the path, with the findings of the check.

        The file is written in the current object directory also if no file with this
        identifier lies there (``created`` of the result tells it); a missing directory is
        created. The name ``<id>.<kind>.json`` is taken if an entry lies under it that is no
        readable regular file of this kind, or if any entry lies under the name of the same
        identifier with another kind; then nothing is written, when creating and when
        replacing. Links are never followed.

        Raises ``BuiltinObjectError``, ``DocumentKindError``, ``DocumentIdentifierError``,
        ``ObjectUnreadableError``, ``ObjectKindConflictError``, ``ObjectNameTakenError``,
        ``DocumentError`` (the text cannot be written), ``DocumentTooLargeError``,
        ``ObjectDirectoryMissingError`` and ``ObjectWriteFailedError``.
        """
        checked_kind = check_object_kind(kind)
        object_id = check_object_id(object_id)
        if object_id in self._builtin:
            raise BuiltinObjectError("A delivered template cannot be changed.")
        if document_kind(document) != checked_kind:
            raise DocumentKindError("The document does not fit the kind of object.")
        if document.id != object_id:
            raise DocumentIdentifierError("The identifier of the document differs from the path.")
        text, findings = self._prepare(document)
        with self._store.lock:
            loaded = self._load(checked_kind, object_id)
            if loaded.status == "unreadable":
                raise ObjectUnreadableError("The object file cannot be read.")
            created = loaded.status == "missing"
            if created and self._store.has_entry(checked_kind, object_id):
                # an entry that is no readable regular file (for example a symbolic link
                # with or without target, or a directory) is read as "missing" and still
                # takes the name
                raise ObjectNameTakenError("The file name of the object is taken.")
            for other in OBJECT_KINDS:
                # any entry under this identifier with another kind blocks saving, when
                # creating and when replacing; links are never followed
                if other != checked_kind and self._store.has_entry(other, object_id):
                    raise ObjectKindConflictError("An object of another kind has this identifier.")
            self._write(checked_kind, object_id, text)
        return SavedObject(object_id, text, findings, created)

    def delete(self, kind: str, object_id: str) -> None:
        """Delete an object.

        Raises ``BuiltinObjectError``, ``ObjectNotFoundError``, ``ObjectUnreadableError`` and
        ``ObjectWriteFailedError``.
        """
        checked_kind = check_object_kind(kind)
        object_id = check_object_id(object_id)
        if object_id in self._builtin:
            raise BuiltinObjectError("A delivered template cannot be deleted.")
        with self._store.lock:
            self._require(checked_kind, object_id)
            try:
                deleted = self._store.delete(checked_kind, object_id)
            except ObjectWriteError as error:
                raise ObjectWriteFailedError("The object file cannot be deleted.") from error
        if not deleted:
            raise ObjectNotFoundError("The object does not exist.")

    # --- usages and check ------------------------------------------------------------

    def usages(self, kind: str, object_id: str) -> Usages:
        """Strategies and templates that contain an instance whose origin is this template,
        also inside contained instances and rulesets. The object itself is left out. Files that
        are not readable are skipped and counted.

        Raises ``ObjectNotFoundError`` and ``ObjectUnreadableError`` for the template itself
        and ``ObjectDirectoryUnreadableError``.
        """
        self.read(kind, object_id)  # the template must exist and be readable
        found: list[Usage] = []
        skipped = 0
        for other_kind in OBJECT_KINDS:
            for item in self._listing(other_kind):
                if item.object_id == object_id:
                    continue
                loaded = self._load(other_kind, item.object_id)
                if loaded.stored is None:
                    skipped += loaded.status == "unreadable"
                    continue
                if _contains_origin(from_document(loaded.stored.document), object_id):
                    found.append(Usage(other_kind, item.object_id, loaded.stored.document.name))
        found.sort(key=lambda usage: (usage.name.casefold(), usage.kind, usage.object_id))
        return Usages(found, skipped)

    def check(self, document: AnyDocument) -> CheckResult:
        """Check a document without saving it, as it is written: positions in expressions
        refer to the given text. Returns the findings and the names of each expression."""
        value = from_document(document)
        if isinstance(value, Strategy):
            return check_strategy_with_names(value, self._registry)
        return check_template_with_names(value, self._registry)

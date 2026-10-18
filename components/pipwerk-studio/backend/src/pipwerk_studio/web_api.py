"""Public web API of pipwerk Studio under ``/api/v1/`` (specification 4.2).

Type descriptions, strategies, templates, usages and the consistency check. This
module only connects HTTP with the shared library (``pipwerk_domain``) and the
object service; it has no knowledge of single element types or object types
(specification E2). The documents are the Pydantic models of
``pipwerk_domain.documents``; the responses are models of this module that
reject additional fields.

Rules (specification 4.1, 4.2, 8):

- ``<art>`` is one of ``strategies``, ``indicators``, ``trends``, ``rules``,
  ``rulesets``. ``{id}`` must be a UUID (HTTP 422 otherwise).
- A body is JSON (``Content-Type: application/json``, HTTP 415 otherwise) and
  at most 2 MiB (HTTP 413, checked by ``BodyLimitMiddleware`` before any JSON is
  read). The body is read as a whole and checked by the library: a document that
  does not fit the schema, also by a limit of the library, is answered with
  HTTP 422.
- Error texts are fixed. They name no path and no exception text; for a
  document that does not fit the schema the answer names the place of each error
  in the document and its error type, never the value.
"""

from __future__ import annotations

import dataclasses
import json
import logging
from collections.abc import Callable
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Path, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pipwerk_domain.consistency import CheckResult, Finding
from pipwerk_domain.defaults import builtin_templates
from pipwerk_domain.documents import (
    DOCUMENT_MODELS,
    DocumentError,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
    parse_document,
    to_document,
)
from pipwerk_domain.expressions.functions import (
    ArgumentKind,
    FunctionSignature,
    ResultKind,
    list_functions,
)
from pipwerk_domain.limits import MAX_DOCUMENT_BYTES
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import BindingKind, DataType, ElementKind, ObjectCategory
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, ValidationError, create_model

from pipwerk_studio.body_limit import BodyLimitMiddleware
from pipwerk_studio.object_service import (
    BuiltinObjectError,
    DocumentIdentifierError,
    DocumentKindError,
    DocumentTooLargeError,
    ListEntry,
    ObjectDirectoryMissingError,
    ObjectDirectoryUnreadableError,
    ObjectKindConflictError,
    ObjectNotFoundError,
    ObjectService,
    ObjectUnreadableError,
    ObjectWriteFailedError,
    SavedObject,
)
from pipwerk_studio.settings_service import StoredObjectDirectoryInvalidError

logger = logging.getLogger(__name__)

API_PREFIX = "/api/v1"
"""The path below which the public web API lives."""

MAX_BODY_BYTES = MAX_DOCUMENT_BYTES
"""Largest request body: 2 MiB (specification 8)."""

MAX_LISTED_ERRORS = 50
MAX_LOCATION_TEXT = 100

ArtName = Literal["strategies", "indicators", "trends", "rules", "rulesets"]
KindName = Literal["strategy", "indicator", "trend", "rule", "ruleset"]

ART_OF_KIND: dict[KindName, ArtName] = {
    "strategy": "strategies",
    "indicator": "indicators",
    "trend": "trends",
    "rule": "rules",
    "ruleset": "rulesets",
}

OBJECT_NOT_FOUND_TEXT = "The object does not exist."
OBJECT_UNREADABLE_TEXT = (
    "The object file cannot be read or does not fit the document schema. It is left unchanged."
)
OBJECT_KIND_CONFLICT_TEXT = (
    "An object of another kind has this identifier in the object directory. Nothing was written."
)
BUILTIN_OBJECT_TEXT = "A delivered template cannot be changed or deleted."
DOCUMENT_INVALID_TEXT = "The document does not fit the document schema."
FORMAT_MISMATCH_TEXT = "The format of the document does not fit the kind of object."
IDENTIFIER_MISMATCH_TEXT = "The identifier of the document differs from the identifier in the path."
REQUEST_INVALID_TEXT = "The request is invalid."
UNSUPPORTED_MEDIA_TEXT = "The request body must be JSON (Content-Type: application/json)."
DOCUMENT_TOO_LARGE_TEXT = "The document is too large to be stored."
DIRECTORY_NOT_SET_TEXT = "The object directory of pipwerk Studio is not set."
STORED_OBJECT_DIRECTORY_INVALID_TEXT = "The stored pipwerk Studio object directory is invalid."
DIRECTORY_UNREADABLE_TEXT = "The object directory of pipwerk Studio cannot be read."
WRITE_FAILED_TEXT = "The object file could not be written or deleted."


# --- models ------------------------------------------------------------------------------


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ApiError(_Model):
    """Error body with a fixed text. It names no path, no exception text and no input."""

    detail: str


class ErrorPlace(_Model):
    """One error of a request: the place in the request or document and the error type."""

    location: list[str | int]
    type: str


class InvalidRequest(_Model):
    """Error body for a request or document that does not fit the schema (HTTP 422). Names
    at most 50 places and the error type of each, never the values."""

    detail: str
    errors: list[ErrorPlace]


class LabelModel(_Model):
    """A text in German and English."""

    de: str
    en: str


class ChoiceModel(_Model):
    """A fixed value of a choice."""

    id: str
    label: LabelModel


class ConditionModel(_Model):
    """The parameter or property applies only if the parameter or property ``name`` has
    ``value``."""

    name: str
    value: str


class ParameterModel(_Model):
    """A parameter of a type."""

    id: str
    datatype: DataType
    label: LabelModel
    required: bool
    default: bool | int | float | str | None
    choices: list[ChoiceModel]
    bindings: list[BindingKind]
    applies_when: ConditionModel | None
    object_type: str | None


class PropertyModel(_Model):
    """A property of a type."""

    id: str
    datatype: DataType
    label: LabelModel
    must: bool
    set_by_user: bool
    default: bool | int | float | str | None
    choices: list[ChoiceModel]
    applies_when: ConditionModel | None
    object_type: str | None


class OutputModel(_Model):
    """An output of an element of the flow."""

    id: str
    label: LabelModel
    holds_management: bool


class TypeDescriptionModel(_Model):
    """Description of an element type or object type: the data the user interface is built
    from (specification 3.1)."""

    id: str
    kind: ElementKind
    name: LabelModel
    description: LabelModel
    category: ObjectCategory | None
    parameters: list[ParameterModel]
    properties: list[PropertyModel]
    outputs: list[OutputModel]
    rules_allowed: bool
    on_canvas: bool
    builtin: bool
    by_user: bool
    named: bool
    strategy_parameters: bool


class FunctionParameterModel(_Model):
    """A parameter of a function of expressions."""

    name: str
    kind: ArgumentKind
    optional: bool


class FunctionModel(_Model):
    """A function of expressions with its signature."""

    name: str
    parameters: list[FunctionParameterModel]
    variadic: ArgumentKind | None
    result: ResultKind
    description: LabelModel
    min_arguments: int
    max_arguments: int | None


TemplateDocument = Annotated[
    IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument,
    Field(discriminator="format"),
]


class ElementTypesResponse(_Model):
    """All type descriptions of the element register, the delivered templates as documents
    and the functions of expressions."""

    types: list[TypeDescriptionModel]
    templates: list[TemplateDocument]
    functions: list[FunctionModel]


class ObjectListEntry(_Model):
    """An object in the list. A file that is not readable (cannot be read, does not fit the
    schema or names another identifier than its file name) has only the identifier, the time
    of its last change and ``unreadable`` true; it is not changed."""

    id: str
    title: str | None
    description: str | None
    object_type: str | None
    modified: AwareDatetime
    unreadable: bool


class ObjectList(_Model):
    """The objects of one kind, sorted by title; the not readable ones come last."""

    items: list[ObjectListEntry]


class FindingModel(_Model):
    """A finding of the consistency check (specification 3.6)."""

    level: Literal["error", "hint"]
    code: str
    element: str | None
    subject: str | None
    details: dict[str, Any]


class UsageEntry(_Model):
    """A strategy or template that contains an instance made from the template."""

    art: ArtName
    id: str
    title: str


class UsagesResponse(_Model):
    """The usages of a template. Files that are not readable are skipped and counted."""

    usages: list[UsageEntry]
    skipped_unreadable: int


class NameSegmentModel(_Model):
    """One part of a recognized name."""

    identifier: str
    start: int
    end: int


class NameModel(_Model):
    """A name recognized in an expression; ``start`` is the first character and ``end`` the
    position after the last character."""

    start: int
    end: int
    identifier: str
    resolved: bool
    previous: bool
    segments: list[NameSegmentModel]


class ExpressionNamesModel(_Model):
    """The names recognized in one expression. ``element`` and ``subject`` tell where the
    expression stands, ``field`` which expression it is (as for a finding)."""

    element: str | None
    subject: str | None
    field: str
    names: list[NameModel]


class CheckResponse(_Model):
    """Result of the consistency check of a document that was not saved."""

    findings: list[FindingModel]
    expressions: list[ExpressionNamesModel]
    names_truncated: bool


# --- conversion --------------------------------------------------------------------------


def _type_descriptions(registry: ElementRegistry) -> list[TypeDescriptionModel]:
    return [
        TypeDescriptionModel.model_validate(dataclasses.asdict(item)) for item in registry.list()
    ]


def _template_documents() -> list[
    IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument
]:
    """The delivered templates of the library as documents."""
    documents: list[IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument] = []
    for template in builtin_templates():
        document = to_document(template)
        if not isinstance(document, StrategyDocument):  # a template is never a strategy
            documents.append(document)
    return documents


def _function_model(item: FunctionSignature) -> FunctionModel:
    data = dataclasses.asdict(item)
    data["min_arguments"] = item.min_arguments
    data["max_arguments"] = item.max_arguments
    return FunctionModel.model_validate(data)


def _functions() -> list[FunctionModel]:
    return [_function_model(item) for item in list_functions()]


def _finding_model(finding: Finding) -> FindingModel:
    return FindingModel.model_validate(jsonable_encoder(finding.to_dict()))


def _check_response(result: CheckResult) -> CheckResponse:
    return CheckResponse(
        findings=[_finding_model(item) for item in result.findings],
        expressions=[
            ExpressionNamesModel.model_validate(dataclasses.asdict(item))
            for item in result.expressions
        ],
        names_truncated=result.names_truncated,
    )


def _list_entry(entry: ListEntry) -> ObjectListEntry:
    return ObjectListEntry(
        id=entry.object_id,
        title=entry.title,
        description=entry.description,
        object_type=entry.object_type,
        modified=entry.modified,
        unreadable=entry.unreadable,
    )


def _saved_body(saved: SavedObject) -> dict[str, Any]:
    return {
        "id": saved.object_id,
        "document": json.loads(saved.text),
        "findings": [_finding_model(item).model_dump(mode="json") for item in saved.findings],
    }


# --- errors ------------------------------------------------------------------------------


def _short(text: str) -> str:
    return text if len(text) <= MAX_LOCATION_TEXT else text[:MAX_LOCATION_TEXT] + "…"


def invalid_request(
    detail: str, error: ValidationError | RequestValidationError | None = None
) -> JSONResponse:
    """HTTP 422 with the places of the errors and their types, never the values. At most
    ``MAX_LISTED_ERRORS`` errors are named; each text in a place is shortened."""
    places: list[dict[str, Any]] = []
    if error is not None:
        items = (
            error.errors()
            if isinstance(error, RequestValidationError)
            else error.errors(include_url=False, include_context=False, include_input=False)
        )
        for item in items[:MAX_LISTED_ERRORS]:
            parts = list(item["loc"])
            if isinstance(error, ValidationError) and parts and parts[0] in DOCUMENT_MODELS:
                parts = parts[1:]  # the tag of the format that selected the model is no place
            location = [part if isinstance(part, int) else _short(str(part)) for part in parts]
            places.append({"location": location, "type": str(item["type"])})
    return JSONResponse(status_code=422, content={"detail": detail, "errors": places})


def _place(detail: str, location: list[str | int], kind: str) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": detail, "errors": [{"location": location, "type": kind}]},
    )


def _error(status: int, text: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": text})


def request_validation_response(error: RequestValidationError) -> JSONResponse:
    """The answer to a request below ``/api/v1/`` that does not fit its parameters."""
    return invalid_request(REQUEST_INVALID_TEXT, error)


def _guarded(call: Callable[[], Response]) -> Response:
    """Run an endpoint and answer the errors of the object service with fixed texts."""
    try:
        return call()
    except ObjectNotFoundError:
        return _error(404, OBJECT_NOT_FOUND_TEXT)
    except ObjectUnreadableError:
        return _error(409, OBJECT_UNREADABLE_TEXT)
    except ObjectKindConflictError:
        return _error(409, OBJECT_KIND_CONFLICT_TEXT)
    except BuiltinObjectError:
        return _error(403, BUILTIN_OBJECT_TEXT)
    except DocumentKindError:
        return _place(FORMAT_MISMATCH_TEXT, ["format"], "format_mismatch")
    except DocumentIdentifierError:
        return _place(IDENTIFIER_MISMATCH_TEXT, ["id"], "id_mismatch")
    except DocumentError as error:
        return invalid_request(DOCUMENT_INVALID_TEXT, error)
    except DocumentTooLargeError:
        return _error(413, DOCUMENT_TOO_LARGE_TEXT)
    except ObjectDirectoryMissingError:
        return _error(503, DIRECTORY_NOT_SET_TEXT)
    except StoredObjectDirectoryInvalidError as error:
        # the stored setting is not an absolute path: the same answer as the internal
        # endpoint of the setting gives
        logger.error("%s", error)
        return _error(503, STORED_OBJECT_DIRECTORY_INVALID_TEXT)
    except ObjectDirectoryUnreadableError as error:
        logger.error("The object directory cannot be read.", exc_info=error)
        return _error(500, DIRECTORY_UNREADABLE_TEXT)
    except ObjectWriteFailedError as error:
        logger.error("An object file could not be written or deleted.", exc_info=error)
        return _error(500, WRITE_FAILED_TEXT)


async def _json_body(request: Request) -> bytes:
    """The body of the request; the media type must be JSON. (A request from a web page
    of another origin needs a preflight request for this media type.)"""
    media_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
    if media_type != "application/json":
        raise HTTPException(status_code=415, detail=UNSUPPORTED_MEDIA_TEXT)
    return await request.body()


JsonBody = Annotated[bytes, Depends(_json_body)]
ObjectId = Annotated[
    UUID,
    Path(alias="id", description="Identifier of the object (a UUID)."),
]


def _error_responses(*statuses: int) -> dict[int | str, dict[str, Any]]:
    texts = {
        403: ("A delivered template cannot be changed or deleted.", ApiError),
        404: ("There is no such object.", ApiError),
        409: (
            "The file of the object is not readable, or saving found an object of another "
            "kind with the same identifier; it is left unchanged.",
            ApiError,
        ),
        413: ("The request body or the document is too large (limit 2 MiB).", ApiError),
        415: ("The request body is not JSON.", ApiError),
        422: ("The request or the document does not fit the schema.", InvalidRequest),
        500: (
            "The object file could not be written or deleted, or the directory cannot be read.",
            ApiError,
        ),
        503: ("The object directory is not set or the stored setting is invalid.", ApiError),
    }
    return {
        status: {"description": texts[status][0], "model": texts[status][1]} for status in statuses
    }


def _document_body(schema: dict[str, Any], description: str) -> dict[str, Any]:
    return {
        "requestBody": {
            "required": True,
            "description": description,
            "content": {"application/json": {"schema": schema}},
        }
    }


def _ref(model: type[BaseModel]) -> dict[str, Any]:
    return {"$ref": f"#/components/schemas/{model.__name__}"}


# --- routes ------------------------------------------------------------------------------


def _add_kind_routes(router: APIRouter, service: ObjectService, kind: KindName) -> None:
    art = ART_OF_KIND[kind]
    document_model = DOCUMENT_MODELS[f"pipwerk.{kind}"]
    name = document_model.__name__.removesuffix("Document")
    saved_model = create_model(
        f"Saved{name}",
        __config__=ConfigDict(extra="forbid"),
        __doc__=(
            f"Answer to saving a document of the kind {kind}: the identifier, the document as "
            "saved (expressions in the normalized spelling) and the findings of the "
            "consistency check."
        ),
        id=(str, ...),
        document=(document_model, ...),
        findings=(list[FindingModel], ...),
    )
    tags: list[str | Any] = [art]
    body_text = f"A document of the format pipwerk.{kind}."

    @router.get(
        f"/{art}",
        operation_id=f"list_{art}",
        tags=tags,
        summary=f"List the {art}",
        description=(
            f"Lists the {art} in the object directory of pipwerk Studio with identifier, "
            "title, description, object type and the time of the last change. A file that is "
            "not readable is listed with the identifier from its file name and the mark "
            "unreadable; it is not changed."
        ),
        response_model=None,
        responses={
            200: {"description": "The objects.", "model": ObjectList},
            **_error_responses(500, 503),
        },
    )
    def list_objects() -> Response:
        def run() -> Response:
            body = ObjectList(items=[_list_entry(item) for item in service.list_objects(kind)])
            return JSONResponse(content=body.model_dump(mode="json"))

        return _guarded(run)

    @router.post(
        f"/{art}",
        operation_id=f"create_{art}",
        tags=tags,
        status_code=201,
        summary=f"Create an object of the kind {kind}",
        description=(
            "Saves the document under a new identifier; an identifier in the document is "
            "replaced. The expressions are saved in the normalized spelling. The answer names "
            "the identifier, the saved document and the findings of the consistency check; "
            "findings do not prevent saving."
        ),
        responses={
            201: {"description": "The object was saved.", "model": saved_model},
            **_error_responses(413, 415, 422, 500, 503),
        },
        openapi_extra=_document_body(_ref(document_model), body_text),
    )
    def create_object(body: JsonBody) -> Response:
        def run() -> Response:
            document = parse_document(body)
            return JSONResponse(
                status_code=201, content=_saved_body(service.create(kind, document))
            )

        return _guarded(run)

    @router.get(
        f"/{art}/{{id}}",
        operation_id=f"read_{art}",
        tags=tags,
        summary=f"Read an object of the kind {kind}",
        description=(
            "Returns the document as saved. A file that is not readable is answered with "
            "HTTP 409 and not changed."
        ),
        response_model=None,
        responses={
            200: {"description": "The document.", "model": document_model},
            **_error_responses(404, 409, 422, 503),
        },
    )
    def read_object(object_id: ObjectId) -> Response:
        def run() -> Response:
            stored = service.read(kind, str(object_id))
            return Response(content=stored.text, media_type="application/json")

        return _guarded(run)

    @router.put(
        f"/{art}/{{id}}",
        operation_id=f"replace_{art}",
        tags=tags,
        summary=f"Save an object of the kind {kind}",
        description=(
            "Saves the object under the identifier of the path in the current object "
            "directory. The identifier in the path is authoritative; a different identifier "
            "in the document is answered with HTTP 422. If no file with this identifier lies "
            "in the current object directory (for example after the directory was changed "
            "without moving the files), the file is created, and the directory too if it is "
            "missing: HTTP 201. An existing file is replaced: HTTP 200. The expressions are "
            "saved in the normalized spelling. The answer names the saved document and the "
            "findings of the consistency check; findings do not prevent saving. A delivered "
            "template cannot be changed (HTTP 403). If a file with this identifier of another "
            "kind lies in the object directory, nothing is written (HTTP 409)."
        ),
        response_model=None,
        responses={
            200: {"description": "The existing object was replaced.", "model": saved_model},
            201: {"description": "The object was created.", "model": saved_model},
            **_error_responses(403, 409, 413, 415, 422, 500, 503),
        },
        openapi_extra=_document_body(_ref(document_model), body_text),
    )
    def replace_object(object_id: ObjectId, body: JsonBody) -> Response:
        def run() -> Response:
            document = parse_document(body)
            saved = service.replace(kind, str(object_id), document)
            return JSONResponse(
                status_code=201 if saved.created else 200, content=_saved_body(saved)
            )

        return _guarded(run)

    @router.delete(
        f"/{art}/{{id}}",
        operation_id=f"delete_{art}",
        tags=tags,
        status_code=204,
        summary=f"Delete an object of the kind {kind}",
        description=(
            "Deletes the object. Instances made from a template in other objects are not "
            "changed. A delivered template cannot be deleted (HTTP 403); a file that is not "
            "readable is not deleted (HTTP 409)."
        ),
        response_model=None,
        responses={
            204: {"description": "The object was deleted."},
            **_error_responses(403, 404, 409, 422, 500, 503),
        },
    )
    def delete_object(object_id: ObjectId) -> Response:
        def run() -> Response:
            service.delete(kind, str(object_id))
            return Response(status_code=204)

        return _guarded(run)

    @router.get(
        f"/{art}/{{id}}/usages",
        operation_id=f"usages_{art}",
        tags=tags,
        summary=f"Find the usages of a template of the kind {kind}",
        description=(
            "Lists the strategies and templates that contain an instance whose origin is "
            "this template, also inside contained instances and rulesets. Files that are not "
            "readable are skipped and counted."
        ),
        response_model=None,
        responses={
            200: {"description": "The usages.", "model": UsagesResponse},
            **_error_responses(404, 409, 422, 500, 503),
        },
    )
    def usages_of_object(object_id: ObjectId) -> Response:
        def run() -> Response:
            result = service.usages(kind, str(object_id))
            body = UsagesResponse(
                usages=[
                    UsageEntry(art=ART_OF_KIND[item.kind], id=item.object_id, title=item.title)
                    for item in result.usages
                ],
                skipped_unreadable=result.skipped_unreadable,
            )
            return JSONResponse(content=body.model_dump(mode="json"))

        return _guarded(run)


def build_router(service: ObjectService, registry: ElementRegistry) -> APIRouter:
    """The router of the public web API with the prefix ``/api/v1``."""
    router = APIRouter(prefix=API_PREFIX)

    @router.get(
        "/element-types",
        operation_id="list_element_types",
        tags=["element-types"],
        summary="List the type descriptions",
        description=(
            "All type descriptions of the element register with names and descriptions in "
            "German and English, the delivered templates as documents and the functions of "
            "expressions. The user interface builds the element library and the property view "
            "from this."
        ),
    )
    def element_types() -> ElementTypesResponse:
        return ElementTypesResponse(
            types=_type_descriptions(registry),
            templates=_template_documents(),
            functions=_functions(),
        )

    for kind in ART_OF_KIND:
        _add_kind_routes(router, service, kind)

    any_document: dict[str, Any] = {
        "oneOf": [_ref(model) for model in DOCUMENT_MODELS.values()],
        "discriminator": {
            "propertyName": "format",
            "mapping": {name: _ref(model)["$ref"] for name, model in DOCUMENT_MODELS.items()},
        },
    }

    @router.post(
        "/check",
        operation_id="check_document",
        tags=["check"],
        summary="Check a document",
        description=(
            "Runs the consistency check on a document of any kind without saving it, as it "
            "is written (positions refer to the given expressions). The answer names the "
            "findings and, for each expression, the recognized names with position and "
            "identifier."
        ),
        response_model=None,
        responses={
            200: {"description": "The result of the check.", "model": CheckResponse},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_document_body(any_document, "A document of any format."),
    )
    def check_document(body: JsonBody) -> Response:
        def run() -> Response:
            result = service.check(parse_document(body))
            return JSONResponse(content=_check_response(result).model_dump(mode="json"))

        return _guarded(run)

    return router


def install_public_api(app: FastAPI, service: ObjectService, registry: ElementRegistry) -> None:
    """Add the public web API and its limit of the body size to the application."""
    app.include_router(build_router(service, registry))
    app.add_middleware(BodyLimitMiddleware, limit=MAX_BODY_BYTES, prefix=API_PREFIX)


def is_public_path(path: str) -> bool:
    """Whether the path belongs to the public web API."""
    return path == API_PREFIX or path.startswith(API_PREFIX + "/")

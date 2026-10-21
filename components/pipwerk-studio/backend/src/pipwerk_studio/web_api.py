"""Public web API of pipwerk Studio under ``/api/v1/`` (specification 4.2).

Type descriptions, strategies, templates, usages, the consistency check, the expressions and
the keys. This module only connects HTTP with the shared library (``pipwerk_domain``) and the
object service; it has no knowledge of single element types or object types (specification
E2). The documents are the Pydantic models of ``pipwerk_domain.documents``; the responses are
models of this module that reject additional fields.

Rules (specification 4.1, 4.2, 8):

- ``<art>`` is one of ``strategies``, ``indicators``, ``trends``, ``rules``,
  ``rulesets``. ``{id}`` must be a UUID (HTTP 422 otherwise).
- A body is JSON (``Content-Type: application/json``, HTTP 415 otherwise) and
  at most 2 MiB (HTTP 413, checked by ``BodyLimitMiddleware`` before any JSON is
  read). The body is read as a whole and checked by the library: a document that
  does not fit the schema, also by a limit of the library, is answered with
  HTTP 422. The library reads documents of the format 2.0 and 1.0; it writes 2.0.
- Every error answer has the fixed English ``detail``, the ``code`` of the cause and the
  ``params`` for the text (``errors.py``). The texts name no path and no exception text; for a
  document that does not fit the schema the answer names the place of each error in the document
  and its error type, never the value.
"""

from __future__ import annotations

import dataclasses
import json
import logging
from collections.abc import Callable, Sequence
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI, Path, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pipwerk_domain.consistency import CheckResult
from pipwerk_domain.defaults import builtin_template_texts, builtin_templates
from pipwerk_domain.documents import (
    DOCUMENT_MODELS,
    DocumentError,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
    from_document,
    load_json,
    parse_document,
    to_document,
)
from pipwerk_domain.expressions.functions import (
    ArgumentKind,
    FunctionSignature,
    ResultKind,
    list_functions,
)
from pipwerk_domain.limits import MAX_BLOCK_DEPTH, MAX_DOCUMENT_BYTES
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import BindingKind, DataType, ElementKind, Group, ObjectCategory
from pydantic import AwareDatetime, ConfigDict, Field, ValidationError, create_model
from starlette.exceptions import HTTPException as StarletteHTTPException

from pipwerk_studio.api_models import (
    ApiError,
    ApiModel,
    ErrorBody,
    FindingModel,
    InvalidRequest,
    LabelModel,
    finding_model,
)
from pipwerk_studio.body_limit import BodyLimitMiddleware
from pipwerk_studio.errors import ApiException, error_response
from pipwerk_studio.expressions_api import (
    ExpressionsRequest,
    ExpressionsResponse,
    KeyRequest,
    KeyResponse,
    answer_expressions,
    answer_key,
    block_depth_in_data,
)
from pipwerk_studio.object_service import (
    MAX_STORED_FILE_BYTES,
    BuiltinObjectError,
    DocumentIdentifierError,
    DocumentKindError,
    DocumentTooLargeError,
    ListEntry,
    ObjectDirectoryMissingError,
    ObjectDirectoryUnreadableError,
    ObjectKindConflictError,
    ObjectNameTakenError,
    ObjectNotFoundError,
    ObjectService,
    ObjectUnreadableError,
    ObjectWriteFailedError,
    SavedObject,
)
from pipwerk_studio.settings_service import StoredObjectDirectoryInvalidError

logger = logging.getLogger(__name__)

__all__ = [
    "API_PREFIX",
    "ApiError",
    "FindingModel",
    "InvalidRequest",
    "LabelModel",
    "install_public_api",
    "is_public_path",
]

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


# --- models ------------------------------------------------------------------------------


class ChoiceModel(ApiModel):
    """A fixed value of a choice."""

    id: str
    label: LabelModel


class ConditionModel(ApiModel):
    """The parameter or property applies only if the parameter or property ``name`` has
    ``value``."""

    name: str
    value: str


class ParameterModel(ApiModel):
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
    explanation: LabelModel


class PropertyModel(ApiModel):
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
    explanation: LabelModel


class OutputModel(ApiModel):
    """An output of an element of the flow."""

    id: str
    label: LabelModel
    holds_management: bool
    explanation: LabelModel


class TypeDescriptionModel(ApiModel):
    """Description of an element type or object type: the data the user interface is built
    from (specification 3.1). ``group`` is the group of the element library (``null`` for a
    type that is not in it); ``explanation`` is the short text on pointing at the type, in
    the language of a trader."""

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
    explanation: LabelModel
    group: Group | None


class FunctionParameterModel(ApiModel):
    """A parameter of a function of expressions."""

    name: str
    kind: ArgumentKind
    optional: bool
    label: LabelModel
    explanation: LabelModel


class FunctionModel(ApiModel):
    """A function of expressions with its signature, its name in trader language and its
    explanation."""

    name: str
    parameters: list[FunctionParameterModel]
    variadic: ArgumentKind | None
    result: ResultKind
    label: LabelModel
    explanation: LabelModel
    min_arguments: int
    max_arguments: int | None


TemplateDocument = Annotated[
    IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument,
    Field(discriminator="format"),
]


class TemplateTextsModel(ApiModel):
    """The name and the explanation of a delivered template in both languages (the document
    stores one name only) and its group of the element library."""

    id: str
    name: LabelModel
    explanation: LabelModel
    group: Group


class ElementTypesResponse(ApiModel):
    """All type descriptions of the element register, the delivered templates as documents
    with their texts in both languages, and the functions of expressions."""

    types: list[TypeDescriptionModel]
    templates: list[TemplateDocument]
    template_texts: list[TemplateTextsModel]
    functions: list[FunctionModel]


class ObjectListEntry(ApiModel):
    """An object in the list. A file that is not readable (cannot be read, does not fit the
    schema or names another identifier than its file name) has only the identifier, the time
    of its last change and ``unreadable`` true; it is not changed."""

    id: str
    name: str | None
    description: str | None
    object_type: str | None
    modified: AwareDatetime
    unreadable: bool


class ObjectList(ApiModel):
    """The objects of one kind, sorted by name; the not readable ones come last."""

    items: list[ObjectListEntry]


class UsageEntry(ApiModel):
    """A strategy or template that contains an instance made from the template."""

    art: ArtName
    id: str
    name: str


class UsagesResponse(ApiModel):
    """The usages of a template. Files that are not readable are skipped and counted."""

    usages: list[UsageEntry]
    skipped_unreadable: int


class NameSegmentModel(ApiModel):
    """One part of a recognized name."""

    identifier: str
    start: int
    end: int


class NameModel(ApiModel):
    """A name recognized in an expression; ``start`` is the first character and ``end`` the
    position after the last character."""

    start: int
    end: int
    identifier: str
    resolved: bool
    previous: bool
    segments: list[NameSegmentModel]


class ExpressionNamesModel(ApiModel):
    """The names recognized in one expression. ``element`` and ``subject`` tell where the
    expression stands, ``field`` which expression it is (as for a finding)."""

    element: str | None
    subject: str | None
    field: str
    names: list[NameModel]


class CheckResponse(ApiModel):
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


def _template_texts() -> list[TemplateTextsModel]:
    return [
        TemplateTextsModel.model_validate(
            {
                "id": item.template_id,
                "name": dataclasses.asdict(item.name),
                "explanation": dataclasses.asdict(item.explanation),
                "group": item.group,
            }
        )
        for item in builtin_template_texts()
    ]


def _function_model(item: FunctionSignature) -> FunctionModel:
    data = dataclasses.asdict(item)
    data["min_arguments"] = item.min_arguments
    data["max_arguments"] = item.max_arguments
    return FunctionModel.model_validate(data)


def _functions() -> list[FunctionModel]:
    return [_function_model(item) for item in list_functions()]


def _check_response(result: CheckResult) -> CheckResponse:
    return CheckResponse(
        findings=[finding_model(item) for item in result.findings],
        expressions=[
            ExpressionNamesModel.model_validate(dataclasses.asdict(item))
            for item in result.expressions
        ],
        names_truncated=result.names_truncated,
    )


def _list_entry(entry: ListEntry) -> ObjectListEntry:
    return ObjectListEntry(
        id=entry.object_id,
        name=entry.name,
        description=entry.description,
        object_type=entry.object_type,
        modified=entry.modified,
        unreadable=entry.unreadable,
    )


def _saved_body(saved: SavedObject) -> dict[str, Any]:
    return {
        "id": saved.object_id,
        "document": json.loads(saved.text),
        "findings": [finding_model(item).model_dump(mode="json") for item in saved.findings],
    }


# --- errors ------------------------------------------------------------------------------


def _short(text: str) -> str:
    return text if len(text) <= MAX_LOCATION_TEXT else text[:MAX_LOCATION_TEXT] + "…"


def _places(
    error: ValidationError | RequestValidationError, prefix: Sequence[str | int] = ()
) -> list[dict[str, Any]]:
    """The places of the errors and their types, never the values. At most
    ``MAX_LISTED_ERRORS`` errors are named; each text in a place is shortened."""
    places: list[dict[str, Any]] = []
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
        places.append({"location": [*prefix, *location], "type": str(item["type"])})
    return places


def invalid_request(
    code: str,
    error: ValidationError | RequestValidationError | None = None,
    prefix: Sequence[str | int] = (),
) -> JSONResponse:
    """HTTP 422 with the code, the places of the errors and their types, never the values."""
    places = [] if error is None else _places(error, prefix)
    return error_response(code, errors=places)


def _place(code: str, location: list[str | int], kind: str) -> JSONResponse:
    return error_response(code, errors=[{"location": location, "type": kind}])


def request_validation_response(error: RequestValidationError) -> JSONResponse:
    """The answer to a request that does not fit its parameters."""
    return invalid_request("request.invalid", error)


def _log_failure(text: str, error: BaseException) -> None:
    """Log a fixed text with the class of the original exception and its error number, if
    there is one. Neither the text of the exception nor a path nor the call stack is logged."""
    cause = error
    while cause.__cause__ is not None:
        cause = cause.__cause__
    number = getattr(cause, "errno", None)
    detail = type(cause).__name__
    if isinstance(number, int):
        detail += f", errno {number}"
    logger.error("%s (%s)", text, detail)


def handle_api_exception(_request: Request, error: ApiException) -> JSONResponse:
    """The answer to an :class:`ApiException`: the table status, the text, the code and the
    params, and the fields the exception adds (for example ``errors``)."""
    return error_response(error.code, error.params, **error.extra)


def handle_http_exception(_request: Request, error: StarletteHTTPException) -> JSONResponse:
    """The answer to an error of the framework (a path or method that does not exist)."""
    codes = {404: "request.not_found", 405: "request.method_not_allowed"}
    code = codes.get(error.status_code, "request.failed")
    if code == "request.failed":
        return error_response(code, status=error.status_code)
    return error_response(code)


def _guarded(call: Callable[[], Response]) -> Response:
    """Run an endpoint and answer the errors of the object service with fixed texts."""
    try:
        return call()
    except ObjectNotFoundError:
        return error_response("object.not_found")
    except ObjectUnreadableError:
        return error_response("object.unreadable")
    except ObjectKindConflictError:
        return error_response("object.kind_conflict")
    except ObjectNameTakenError:
        return error_response("object.name_taken")
    except BuiltinObjectError:
        return error_response("object.builtin")
    except DocumentKindError:
        return _place("document.format_mismatch", ["format"], "format_mismatch")
    except DocumentIdentifierError:
        return _place("document.id_mismatch", ["id"], "id_mismatch")
    except DocumentError as error:
        return invalid_request("document.invalid", error)
    except DocumentTooLargeError:
        return error_response("document.too_large", {"limit_bytes": MAX_STORED_FILE_BYTES})
    except ObjectDirectoryMissingError:
        return error_response("object_directory.not_set")
    except StoredObjectDirectoryInvalidError as error:
        # the stored setting is not an absolute path: the same answer as the internal
        # endpoint of the setting gives
        logger.error("%s", error)
        return error_response("object_directory.stored_invalid")
    except ObjectDirectoryUnreadableError as error:
        _log_failure("The object directory cannot be read.", error)
        return error_response("object_directory.unreadable")
    except ObjectWriteFailedError as error:
        _log_failure("An object file could not be written or deleted.", error)
        return error_response("object.write_failed")


async def _json_body(request: Request) -> bytes:
    """The body of the request; the media type must be JSON. (A request from a web page
    of another origin needs a preflight request for this media type.)"""
    media_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
    if media_type != "application/json":
        raise ApiException("request.not_json")
    return await request.body()


JsonBody = Annotated[bytes, Depends(_json_body)]
ObjectId = Annotated[
    UUID,
    Path(alias="id", description="Identifier of the object (a UUID)."),
]


def _error_responses(*statuses: int) -> dict[int | str, dict[str, Any]]:
    texts: dict[int, tuple[str, type[ErrorBody]]] = {
        403: ("A delivered template cannot be changed or deleted.", ApiError),
        404: ("There is no such object.", ApiError),
        409: (
            "The file of the object is not readable, or saving found an entry under the "
            "file name that is no readable regular file of this kind (for example a symbolic "
            "link or a directory), or any entry of another kind with this identifier (for "
            "example a file, a symbolic link or a directory); it is left unchanged.",
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


def _ref(model: type[Any]) -> dict[str, Any]:
    return {"$ref": f"#/components/schemas/{model.__name__}"}


def _any_document_schema() -> dict[str, Any]:
    return {
        "oneOf": [_ref(model) for model in DOCUMENT_MODELS.values()],
        "discriminator": {
            "propertyName": "format",
            "mapping": {name: _ref(model)["$ref"] for name, model in DOCUMENT_MODELS.items()},
        },
    }


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
    body_text = (
        f"A document of the format pipwerk.{kind}, format 2.0 or 1.0 (a document of the "
        "format 1.0 is converted and saved as 2.0)."
    )

    @router.get(
        f"/{art}",
        operation_id=f"list_{art}",
        tags=tags,
        summary=f"List the {art}",
        description=(
            f"Lists the {art} in the object directory of pipwerk Studio with identifier, "
            "name, description, object type and the time of the last change. A file that is "
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
            "the identifier, the saved document (format 2.0) and the findings of the "
            "consistency check; findings do not prevent saving."
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
            "Returns the document as saved, in the format 2.0. A file of the format 1.0 in "
            "the object directory is returned converted and stays as it is until it is saved. "
            "A file that is not readable is answered with HTTP 409 and not changed."
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
            "saved in the normalized spelling. The answer names the saved document (format "
            "2.0) and the findings of the consistency check; findings do not prevent saving. "
            "A delivered template cannot be changed (HTTP 403). The same rule holds for "
            "creating and replacing: if an entry lies under the file name of this kind that is "
            "no readable regular file (for example a file that is not readable, a symbolic "
            "link with or without target, or a directory), or if any entry of the same "
            "identifier with another kind lies in the object directory (for example a file, a "
            "symbolic link or a directory), nothing is written (HTTP 409). Links are never "
            "followed."
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
                    UsageEntry(art=ART_OF_KIND[item.kind], id=item.object_id, name=item.name)
                    for item in result.usages
                ],
                skipped_unreadable=result.skipped_unreadable,
            )
            return JSONResponse(content=body.model_dump(mode="json"))

        return _guarded(run)


def _load_request(body: bytes) -> object:
    """The parsed JSON of a request body; ``request.invalid`` if it is no JSON."""
    try:
        return load_json(body)
    except DocumentError as error:
        raise ApiException(
            "request.invalid", errors=[{"location": [], "type": "json_invalid"}]
        ) from error


def _check_block_depth(data: object) -> None:
    """Reject blocks nested deeper than the limit before the models are built, so that deep
    nesting cannot exhaust the stack."""
    items = data.get("items") if isinstance(data, dict) else None
    if not isinstance(items, list):
        return
    for index, item in enumerate(items):
        blocks = item.get("blocks") if isinstance(item, dict) else None
        if blocks is not None and block_depth_in_data(blocks) > MAX_BLOCK_DEPTH:
            raise ApiException(
                "expressions.blocks_invalid",
                {"index": index, "reason": "too_deep", "details": {"limit": MAX_BLOCK_DEPTH}},
            )


def build_router(service: ObjectService, registry: ElementRegistry) -> APIRouter:
    """The router of the public web API with the prefix ``/api/v1``."""
    router = APIRouter(prefix=API_PREFIX)

    @router.get(
        "/element-types",
        operation_id="list_element_types",
        tags=["element-types"],
        summary="List the type descriptions",
        description=(
            "All type descriptions of the element register with names, descriptions, "
            "explanations and groups in German and English, the delivered templates as "
            "documents with their names and explanations in both languages, and the functions "
            "of expressions. The user interface builds the element library and the property "
            "view from this."
        ),
    )
    def element_types() -> ElementTypesResponse:
        return ElementTypesResponse(
            types=_type_descriptions(registry),
            templates=_template_documents(),
            template_texts=_template_texts(),
            functions=_functions(),
        )

    for kind in ART_OF_KIND:
        _add_kind_routes(router, service, kind)

    @router.post(
        "/check",
        operation_id="check_document",
        tags=["check"],
        summary="Check a document",
        description=(
            "Runs the consistency check on a document of any kind (format 2.0 or 1.0) without "
            "saving it, as it is written (positions refer to the given expressions). The "
            "answer names the findings and, for each expression, the recognized names with "
            "position and identifier."
        ),
        response_model=None,
        responses={
            200: {"description": "The result of the check.", "model": CheckResponse},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_document_body(_any_document_schema(), "A document of any format."),
    )
    def check_document(body: JsonBody) -> Response:
        def run() -> Response:
            result = service.check(parse_document(body))
            return JSONResponse(content=_check_response(result).model_dump(mode="json"))

        return _guarded(run)

    @router.post(
        "/expressions",
        operation_id="answer_expressions",
        tags=["expressions"],
        summary="Show expressions in both forms, as blocks and as a sentence",
        description=(
            "For 1 to 50 places of expressions in a document (strategy or template, format "
            "2.0 or 1.0) the answer gives the expression in the stored form and in the display "
            "form in the language of the request, the sentence, the blocks, the tokens with "
            "their kinds, the findings and the names visible at the place with their "
            "properties. An item names the place by a JSON Pointer to the document as the "
            "format 2.0 writes it (the place itself may be missing, the object it belongs to "
            "must be there) and gives exactly one of the stored form, the display form (in "
            "either language) and blocks. A pointer that names no place of an expression is "
            "answered with HTTP 422 and the code expressions.pointer_invalid. Positions of "
            "tokens and findings refer to the display form. Where an answer is cut it says so "
            "(blocks_omitted, findings_truncated, names_truncated, properties_truncated)."
        ),
        response_model=None,
        responses={
            200: {"description": "The answers.", "model": ExpressionsResponse},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_document_body(
            _ref(ExpressionsRequest), "The document, the language and the items."
        ),
    )
    def expressions(body: JsonBody) -> Response:
        def run() -> Response:
            data = _load_request(body)
            _check_block_depth(data)
            try:
                request = ExpressionsRequest.model_validate(data, strict=True)
            except ValidationError as error:
                return invalid_request("request.invalid", error)
            try:
                value = from_document(parse_document(request.document))
            except DocumentError as error:
                return invalid_request("document.invalid", error, ("document",))
            result = answer_expressions(value, request, registry)
            return JSONResponse(content=result.model_dump(mode="json"))

        return _guarded(run)

    @router.post(
        "/keys",
        operation_id="form_key",
        tags=["expressions"],
        summary="Form the key for a new object from a name",
        description=(
            "The key under which an expression addresses a new object: formed from the name, "
            "different from the other keys of its namespace, from the identifiers of the "
            "objects of the application and from the names of the functions. The scope is a "
            "JSON Pointer to the list of the document that takes the new object (for example "
            "/parameters or /elements). The user interface does not form keys itself."
        ),
        response_model=None,
        responses={
            200: {"description": "The key.", "model": KeyResponse},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_document_body(
            _ref(KeyRequest), "The document, the scope and the name of the new object."
        ),
    )
    def keys(body: JsonBody) -> Response:
        def run() -> Response:
            data = _load_request(body)
            try:
                request = KeyRequest.model_validate(data, strict=True)
            except ValidationError as error:
                return invalid_request("request.invalid", error)
            try:
                value = from_document(parse_document(request.document))
            except DocumentError as error:
                return invalid_request("document.invalid", error, ("document",))
            result = answer_key(value, request, registry)
            return JSONResponse(content=result.model_dump(mode="json"))

        return _guarded(run)

    return router


def _add_request_models(app: FastAPI) -> None:
    """Add the schemas of the requests that are read from the bytes of the body (they are
    not parameters of the functions) to the description of the interface."""
    original = app.openapi

    def openapi() -> dict[str, Any]:
        if app.openapi_schema is None:
            description = original()
            schemas = description.setdefault("components", {}).setdefault("schemas", {})
            for model in (ExpressionsRequest, KeyRequest):
                schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
                for key, definition in schema.pop("$defs", {}).items():
                    schemas.setdefault(key, definition)
                document = schema["properties"]["document"]
                schema["properties"]["document"] = {
                    "description": document.get("description", ""),
                    **_any_document_schema(),
                }
                schemas[model.__name__] = schema
        return app.openapi_schema or {}

    app.openapi = openapi  # type: ignore[method-assign]


def install_public_api(app: FastAPI, service: ObjectService, registry: ElementRegistry) -> None:
    """Add the public web API, its error answers and its limit of the body size to the
    application."""
    app.include_router(build_router(service, registry))
    app.add_middleware(BodyLimitMiddleware, limit=MAX_BODY_BYTES, prefix=API_PREFIX)
    app.add_exception_handler(ApiException, handle_api_exception)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)  # type: ignore[arg-type]
    _add_request_models(app)


def is_public_path(path: str) -> bool:
    """Whether the path belongs to the public web API."""
    return path == API_PREFIX or path.startswith(API_PREFIX + "/")

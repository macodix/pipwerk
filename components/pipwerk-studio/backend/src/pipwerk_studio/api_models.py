"""Models that several parts of the public web API share: the error bodies, a text in two
languages and a finding of the consistency check. The models reject additional fields."""

from __future__ import annotations

from typing import Any, Literal

from fastapi.encoders import jsonable_encoder
from pipwerk_domain.consistency import Finding
from pipwerk_domain.typedesc import Label
from pydantic import BaseModel, ConfigDict, Field

from pipwerk_studio.errors import ERROR_CODES


class ApiModel(BaseModel):
    """Base of the models of the public web API."""

    model_config = ConfigDict(extra="forbid")


class ErrorBody(ApiModel):
    """The fields every error body has. ``detail`` is a fixed English text for the users of the
    interface; it names no path, no exception text and no input. ``code`` is the identifier of
    the cause and ``params`` the data for the text in the language of the user (the list of the
    codes is in the description of the interface)."""

    detail: str
    code: str = Field(json_schema_extra={"enum": list(ERROR_CODES)})
    params: dict[str, Any]


class ApiError(ErrorBody):
    """Error body."""


class ErrorPlace(ApiModel):
    """One error of a request or document: the place and the error type."""

    location: list[str | int]
    type: str


class InvalidRequest(ErrorBody):
    """Error body for a request or document that does not fit the schema (HTTP 422). Names
    at most 50 places and the error type of each, never the values."""

    errors: list[ErrorPlace]


class LabelModel(ApiModel):
    """A text in German and English."""

    de: str
    en: str


def label_model(label: Label) -> LabelModel:
    return LabelModel(de=label.de, en=label.en)


class FindingModel(ApiModel):
    """A finding of the consistency check (specification 3.6): the identifier of the finding
    with the data for the text; the library writes no text.

    So that findings with the same text can be told apart, a finding names what the user sees:
    ``element_name`` is the name of the affected element (the name the user gave it, else the
    name of its type), ``subject_name`` the name of the affected instance or rule, and
    ``field_label`` the label of the affected field, as the element or instance shows it. The
    names of the user are the same in both languages; the labels of the types come in German
    and English. Each is ``null`` where the finding has no such thing (``element`` and
    ``subject`` stay the identifiers, ``details.field`` the identifier of the field)."""

    level: Literal["error", "hint"]
    code: str
    element: str | None
    subject: str | None
    details: dict[str, Any]
    element_name: LabelModel | None
    subject_name: str | None
    field_label: LabelModel | None


def finding_model(finding: Finding) -> FindingModel:
    return FindingModel.model_validate(jsonable_encoder(finding.to_dict()))

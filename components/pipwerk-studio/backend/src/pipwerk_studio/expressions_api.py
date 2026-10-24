"""The endpoints ``/api/v1/expressions`` and ``/api/v1/keys`` (specification 4.2, 3.3, 3.4).

``/expressions`` takes a strategy or template and, for places of expressions in it, a text in
the stored form, a text in the display form or blocks, and answers each place with both forms,
the sentence, the blocks, the characters with their kinds, the findings and the names visible at
the place. ``/keys`` forms the key for a new object from a name. Both only connect HTTP with the
shared library (specification E2): forms, blocks, sentences, findings, names and keys are made
there.

Limits (specification 8): 1 to 50 items per request, an expression of at most the length and
nesting of a document, blocks of at most ``MAX_BLOCK_DEPTH`` levels, at most 500 names per item and
200 properties per name. Where an answer is cut, it says so.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pipwerk_domain.consistency import Checker, ExpressionContext, check_with_contexts
from pipwerk_domain.expressions import (
    BlockError,
    BlockKind,
    analyze,
    blocks_to_text,
    characters,
    nesting_depth,
    render,
    sentence,
    to_blocks,
    visible_names,
)
from pipwerk_domain.expressions.blocks import EMPTY, Block
from pipwerk_domain.expressions.names import ChoiceInfo, VisibleName
from pipwerk_domain.expressions.symbols import Scope
from pipwerk_domain.limits import (
    MAX_BLOCK_DEPTH,
    MAX_EXPRESSION_LENGTH,
    MAX_EXPRESSION_NESTING,
    MAX_ITEMS_PER_REQUEST,
    MAX_NAME_LENGTH,
)
from pipwerk_domain.model import Strategy, Template
from pipwerk_domain.operations import ScopeError, new_key
from pipwerk_domain.pointers import PointerError, split_pointer
from pipwerk_domain.registry import ElementRegistry
from pydantic import AfterValidator, Field, model_validator

from pipwerk_studio.api_models import ApiModel, FindingModel, LabelModel, finding_model, label_model
from pipwerk_studio.errors import ApiException

LanguageName = Literal["de", "en"]
BlockKindName = Literal[
    "empty",
    "name",
    "literal",
    "comparison",
    "arithmetic",
    "logic",
    "if",
    "function",
    "crossing",
]
LiteralTypeName = Literal["number", "integer", "percent", "text", "boolean"]
CrossingDirection = Literal["up", "down", "any"]
TokenKindName = Literal["name", "function", "value", "operator", "bracket", "separator"]
NameKindName = Literal[
    "instance", "result", "strategy_parameter", "parameter", "application_object", "rule"
]


def _check_nesting(text: str) -> str:
    if nesting_depth(text) > MAX_EXPRESSION_NESTING:
        raise ValueError(f"expression nested deeper than {MAX_EXPRESSION_NESTING} levels")
    return text


ExpressionText = Annotated[
    str,
    Field(max_length=MAX_EXPRESSION_LENGTH),
    AfterValidator(_check_nesting),
]


# --- blocks ------------------------------------------------------------------------------


class BlockModel(ApiModel):
    """A block of an expression (specification 3.4). Every kind uses the fields that belong
    to it: ``name`` the keys in ``path`` (for example ``["ema20", "wert"]``), ``literal`` its
    ``value`` and ``datatype`` (a percentage is the number as written: 5 for 5 %),
    ``comparison`` and ``arithmetic`` their ``operator`` (an arithmetic block with one child is
    a sign), ``logic`` ``and``, ``or`` or ``not``, ``function`` the name of the function from the
    list of the functions, ``crossing`` its ``direction``; ``children`` are the operands in the
    order of the expression. A ``name`` block with ``call`` true is the result of a method: its
    ``path`` ends with the method (``["reihe", "wert_vor"]``) and its ``children`` are the blocks
    of the arguments in the order of the method (none for a method without arguments;
    ``call`` is false or left out for a plain name, which has no children)."""

    kind: BlockKindName
    path: list[str] | None = None
    value: bool | int | float | str | None = None
    datatype: LiteralTypeName | None = None
    operator: str | None = None
    function: str | None = None
    direction: CrossingDirection | None = None
    call: bool = False
    children: list[BlockModel] = Field(default_factory=list)


BlockModel.model_rebuild()


def block_depth_in_data(data: object) -> int:
    """The depth of a tree of blocks as parsed JSON, counted without recursion."""
    deepest = 0
    stack: list[tuple[object, int]] = [(data, 1)]
    while stack:
        node, level = stack.pop()
        if not isinstance(node, dict):
            continue
        deepest = max(deepest, level)
        children = node.get("children")
        if isinstance(children, list):
            stack.extend((child, level + 1) for child in children)
    return deepest


def _block_from_model(root: BlockModel) -> Block:
    order: list[BlockModel] = []
    stack = [root]
    while stack:
        model = stack.pop()
        order.append(model)
        stack.extend(model.children)
    built: dict[int, Block] = {}
    for model in reversed(order):  # the children come before their parent
        built[id(model)] = Block(
            BlockKind(model.kind),
            path=tuple(model.path or ()),
            value=model.value,
            datatype=model.datatype,
            operator=model.operator,
            function=model.function,
            direction=model.direction,
            call=model.call,
            children=tuple(built[id(child)] for child in model.children),
        )
    return built[id(root)]


def _block_depth(root: Block) -> int:
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    depth: dict[int, int] = {}
    for block in reversed(order):
        depth[id(block)] = 1 + max((depth[id(child)] for child in block.children), default=0)
    return depth[id(root)]


def _block_data(root: Block) -> dict[str, Any]:
    """The block as plain data, without recursion."""
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    built: dict[int, dict[str, Any]] = {}
    for block in reversed(order):
        built[id(block)] = {
            "kind": block.kind.value,
            "path": list(block.path) if block.kind is BlockKind.NAME else None,
            "value": block.value,
            "datatype": block.datatype,
            "operator": block.operator,
            "function": block.function,
            "direction": block.direction,
            "call": block.call,
            "children": [built[id(child)] for child in block.children],
        }
    return built[id(root)]


# --- request -----------------------------------------------------------------------------


class ExpressionItem(ApiModel):
    """One place of an expression and the text to answer for. ``pointer`` is a JSON Pointer
    (RFC 6901) to the place in the document as the format 2.0 writes it, for example
    ``/elements/3/parameters/ausdruck/value``; the place itself may be missing in the
    document, the object it belongs to must be there. Exactly one of ``stored`` (stored form),
    ``display`` (display form in either language) and ``blocks`` is given."""

    pointer: str = Field(max_length=1000)
    stored: ExpressionText | None = None
    display: ExpressionText | None = None
    blocks: BlockModel | None = None

    @model_validator(mode="after")
    def _one_form(self) -> ExpressionItem:
        given = [item for item in (self.stored, self.display, self.blocks) if item is not None]
        if len(given) != 1:
            raise ValueError("exactly one of stored, display and blocks is given")
        return self


class ExpressionsRequest(ApiModel):
    """The request of ``/api/v1/expressions``: the document (strategy or template, format 2.0
    or 1.0), the language of the answer and 1 to 50 items."""

    document: dict[str, Any]
    language: LanguageName
    items: list[ExpressionItem] = Field(min_length=1, max_length=MAX_ITEMS_PER_REQUEST)


# --- answer ------------------------------------------------------------------------------


class TokenModel(ApiModel):
    """A part of an expression: ``start`` is the first character and ``end`` the position
    after the last. For a bracket ``partner`` is the index of the bracket that belongs to it in
    the list."""

    start: int
    end: int
    kind: TokenKindName
    partner: int | None


class ChoiceValueModel(ApiModel):
    """A possible value of a property that is a choice."""

    id: str
    label: LabelModel


class VisiblePropertyModel(ApiModel):
    """A property of a visible name. ``previous_value`` tells that ``PREVIOUS`` may stand around
    it."""

    key: str
    label: LabelModel
    datatype: str | None
    explanation: LabelModel | None
    choices: list[ChoiceValueModel]
    previous_value: bool


class VisibleArgumentModel(ApiModel):
    """An argument of a visible method: key, label, data type, whether it is mandatory
    (``required``), its ``default`` value if it is optional, its explanation and the possible
    values of a choice."""

    key: str
    label: LabelModel
    datatype: str
    required: bool
    default: bool | int | float | str | None
    explanation: LabelModel
    choices: list[ChoiceValueModel]


class VisibleMethodModel(ApiModel):
    """A method of a visible name (specification 3.4): an expression addresses it as
    ``Name.Method(Arguments)``. ``datatype`` is the data type of the result and ``choices`` its
    values if it is a choice; ``previous_value`` tells that ``PREVIOUS`` may stand around the
    result; ``arguments`` are the arguments in their order."""

    key: str
    label: LabelModel
    datatype: str | None
    explanation: LabelModel | None
    choices: list[ChoiceValueModel]
    arguments: list[VisibleArgumentModel]
    previous_value: bool


class VisibleNameModel(ApiModel):
    """A name that an expression can address at the place. ``display`` is the name in the
    language of the request and ``path`` the keys. ``contents`` are the instances and rules
    contained in an instance or ruleset. ``properties`` are the properties and ``methods`` the
    methods of the name. ``properties_truncated`` is true if the list of properties or the list
    of methods was cut at the limit."""

    display: str
    path: list[str]
    kind: NameKindName
    datatype: str | None
    properties: list[VisiblePropertyModel]
    methods: list[VisibleMethodModel]
    properties_truncated: bool
    contents: list[VisibleNameModel]


VisibleNameModel.model_rebuild()


class ExpressionAnswer(ApiModel):
    """The answer for one item. ``stored`` and ``display`` (in the language of the request)
    are the expression in both forms. ``sentence`` and ``blocks`` are ``null`` for an
    expression with a syntax problem; ``blocks_omitted`` is true if the blocks were left out
    because they are nested deeper than the limit. The positions of ``tokens`` and of the
    findings refer to ``display``. ``findings_truncated`` is true if the expression has
    more findings than are listed; ``names_truncated`` if the list of names was cut at
    the limit."""

    stored: str
    display: str
    sentence: str | None
    blocks: BlockModel | None
    blocks_omitted: bool
    tokens: list[TokenModel]
    findings: list[FindingModel]
    findings_truncated: bool
    names: list[VisibleNameModel]
    names_truncated: bool


class ExpressionsResponse(ApiModel):
    """The answers in the order of the items of the request."""

    items: list[ExpressionAnswer]


def _property_models(name: VisibleName) -> list[VisiblePropertyModel]:
    return [
        VisiblePropertyModel(
            key=item.key,
            label=label_model(item.label),
            datatype=item.datatype,
            explanation=None if item.explanation is None else label_model(item.explanation),
            choices=[
                ChoiceValueModel(id=choice.key, label=label_model(choice.label))
                for choice in item.choices
            ],
            previous_value=item.previous_value,
        )
        for item in name.properties
    ]


def _choice_models(choices: tuple[ChoiceInfo, ...]) -> list[ChoiceValueModel]:
    return [ChoiceValueModel(id=item.key, label=label_model(item.label)) for item in choices]


def _method_models(name: VisibleName) -> list[VisibleMethodModel]:
    return [
        VisibleMethodModel(
            key=item.key,
            label=label_model(item.label),
            datatype=item.datatype,
            explanation=None if item.explanation is None else label_model(item.explanation),
            choices=_choice_models(item.choices),
            arguments=[
                VisibleArgumentModel(
                    key=argument.key,
                    label=label_model(argument.label),
                    datatype=argument.datatype,
                    required=argument.required,
                    default=argument.default,
                    explanation=label_model(argument.explanation),
                    choices=_choice_models(argument.choices),
                )
                for argument in item.arguments
            ],
            previous_value=item.previous_value,
        )
        for item in name.methods
    ]


def _name_model(name: VisibleName) -> VisibleNameModel:
    return VisibleNameModel(
        display=name.display,
        path=list(name.path),
        kind=name.kind,  # type: ignore[arg-type]
        datatype=name.datatype,
        properties=_property_models(name),
        methods=_method_models(name),
        properties_truncated=name.properties_truncated,
        contents=[_name_model(item) for item in name.contents],
    )


def _blocks_problem(index: int, reason: str, **details: object) -> ApiException:
    params: dict[str, Any] = {"index": index, "reason": reason}
    params["details"] = {
        key: value for key, value in details.items() if isinstance(value, str | int | bool)
    }
    return ApiException("expressions.blocks_invalid", params)


def _context_of(checker: Checker, index: int, pointer: str) -> ExpressionContext:
    """The context of the place a pointer names; ``expressions.pointer_invalid`` if it names no
    place of an expression."""
    try:
        split_pointer(pointer)
    except PointerError as error:
        raise ApiException("expressions.pointer_invalid", {"index": index}) from error
    context = checker.contexts.get(pointer)
    if context is None:
        raise ApiException("expressions.pointer_invalid", {"index": index})
    return context


def _answer_item(
    index: int, item: ExpressionItem, checker: Checker, language: str
) -> ExpressionAnswer:
    context = _context_of(checker, index, item.pointer)
    environment = context.env
    if item.blocks is not None:
        try:
            source = blocks_to_text(_block_from_model(item.blocks), environment)
        except BlockError as error:
            raise _blocks_problem(index, error.reason, **error.details) from error
        if len(source) > MAX_EXPRESSION_LENGTH:
            raise _blocks_problem(index, "too_long")
        if nesting_depth(source) > MAX_EXPRESSION_NESTING:
            raise _blocks_problem(index, "too_deep")
        display_input = False
    elif item.stored is not None:
        source, display_input = item.stored, False
    else:
        source, display_input = item.display or "", True
    rendering = render(
        source, environment, language, display_input=display_input, expected=context.expected
    )
    analysis = analyze(rendering.display, environment, context.expected, display=True)
    blank = not rendering.display.strip()
    root = EMPTY if blank else to_blocks(analysis)
    omitted = root is not None and _block_depth(root) > MAX_BLOCK_DEPTH
    shown = None if root is None or omitted else root
    found = checker.context_findings(context, analysis)
    names, names_truncated = (
        visible_names(environment, language) if isinstance(environment, Scope) else ([], False)
    )
    return ExpressionAnswer(
        stored=rendering.stored,
        display=rendering.display,
        sentence=None if root is None else sentence(root, language, context.expected),
        blocks=None if shown is None else BlockModel.model_validate(_block_data(shown)),
        blocks_omitted=omitted,
        tokens=[
            TokenModel(start=item.start, end=item.end, kind=item.kind.value, partner=item.partner)
            for item in characters(rendering.display)
        ],
        findings=[finding_model(finding) for finding in found],
        findings_truncated=analysis.truncated,
        names=[_name_model(name) for name in names],
        names_truncated=names_truncated,
    )


def answer_expressions(
    value: Strategy | Template, request: ExpressionsRequest, registry: ElementRegistry
) -> ExpressionsResponse:
    """The answers for all items of a request about the document ``value``. Raises
    :class:`ApiException` for a pointer that names no place of an expression and for blocks that
    are no expression."""
    checker = check_with_contexts(value, registry)
    return ExpressionsResponse(
        items=[
            _answer_item(index, item, checker, request.language)
            for index, item in enumerate(request.items)
        ]
    )


# --- keys --------------------------------------------------------------------------------


class KeyRequest(ApiModel):
    """The request of ``/api/v1/keys``: the document (strategy or template, format 2.0 or
    1.0), the JSON Pointer to the list that takes the new object (for example ``/parameters`` or
    ``/elements``) and the name. ``kind`` and ``object_type`` decide the key when the name gives
    none (a condition becomes ``bedingung``, an instance takes the identifier of its object
    type)."""

    document: dict[str, Any]
    scope: str = Field(max_length=1000)
    name: str = Field(max_length=MAX_NAME_LENGTH)
    kind: (
        Literal["parameter", "property", "instance", "rule", "condition", "calculation"] | None
    ) = None
    object_type: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)


class KeyResponse(ApiModel):
    """The key for the new object: different from the other keys of its namespace, from the
    identifiers of the objects of the application and from the names of the functions."""

    key: str


def answer_key(
    value: Strategy | Template, request: KeyRequest, registry: ElementRegistry
) -> KeyResponse:
    """The key for a new object in the document ``value``. Raises :class:`ApiException`
    ``keys.scope_invalid`` if the pointer names no list that takes a new object."""
    try:
        key = new_key(
            value,
            request.scope,
            request.name,
            kind=request.kind,
            object_type=request.object_type,
            registry=registry,
        )
    except (ScopeError, PointerError) as error:
        raise ApiException("keys.scope_invalid") from error
    return KeyResponse(key=key)

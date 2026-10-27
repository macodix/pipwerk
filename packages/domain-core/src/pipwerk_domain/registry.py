"""Element register (specification 3.1, E7): registration, query by identifier and list."""

import logging
from collections.abc import Callable, Iterable
from dataclasses import dataclass, replace
from importlib.metadata import distributions
from typing import Any, Protocol

from pipwerk_domain.identifiers import is_valid_key
from pipwerk_domain.typedesc import (
    TIME_UNIT_IDS,
    TIME_UNITS,
    ArgumentDescription,
    Choice,
    Condition,
    DataType,
    ElementKind,
    Label,
    MethodDescription,
    ParameterDescription,
    PropertyDescription,
    TypeDescription,
    datatype_label,
)

ENTRY_POINT_GROUP = "pipwerk.element_types"
"""Entry point group in which further packages register types."""

TREND_TYPE_ID = "Trend"
TREND_METHOD_PARAMETER = "berechnungsverfahren"
PLACE_ORDER_TYPE_ID = "flow.place_order"
ORDER_TYPE_PARAMETER = "ordertyp"

_logger = logging.getLogger(__name__)

type Descriptions = list[TypeDescription]
"""A list of type descriptions (the register has a method called ``list``)."""


class RegistryError(ValueError):
    """A type description could not be registered."""


class EntryPointLike(Protocol):
    """The part of ``importlib.metadata.EntryPoint`` the register uses."""

    @property
    def name(self) -> str: ...

    def load(self) -> Any: ...


@dataclass(frozen=True, slots=True)
class LoadReport:
    """Result of loading entry points: names of the entry points by outcome."""

    loaded: tuple[str, ...]
    failed: tuple[str, ...]


class _Collector:
    """Collects the registrations of one entry point so that a failing entry point
    registers nothing."""

    def __init__(self) -> None:
        self.items: list[TypeDescription] = []

    def register(self, description: TypeDescription) -> None:
        self.items.append(description)


class ElementRegistry:
    """Register of all element types and object types, including the calculation
    methods of the trend (kind ``trend_method``)."""

    def __init__(self) -> None:
        self._types: dict[str, TypeDescription] = {}

    def register(self, description: TypeDescription) -> None:
        """Register a type; an identifier can be registered only once."""
        if not isinstance(description, TypeDescription):
            raise RegistryError("not a type description")
        if not description.id:
            raise RegistryError("empty identifier")
        if description.id in self._types:
            raise RegistryError(f"identifier already registered: {description.id}")
        _check_valid(description)
        self._types[description.id] = description

    def get(self, type_id: str) -> TypeDescription | None:
        """Query a type by its identifier."""
        description = self._types.get(type_id)
        return None if description is None else self._derived(description)

    def can_refresh(self, type_id: str) -> bool:
        """Whether a use of an instance of the type can choose "Aktualisieren" (specification
        3.1, 3.2). A template of the user and an instance made from it have the object type
        they were made from (``Indikator`` or ``Trend``) and take the indication from it. An
        unknown type does not provide it."""
        description = self._types.get(type_id)
        return description is not None and description.can_refresh

    def datatype_label(self, datatype: DataType, object_type: str | None = None) -> Label:
        """The word for a data type in trader language, in German and English (specification
        3.1). For the data type object it is the name of the object type; an object type that
        is not registered, or none, gives the general word for an object."""
        description = None if object_type is None else self._types.get(object_type)
        return datatype_label(datatype, None if description is None else description.name)

    def list(self, kind: ElementKind | None = None) -> Descriptions:
        """All registered types in the order of registration, optionally of one kind."""
        return [
            self._derived(item)
            for item in self._types.values()
            if kind is None or item.kind is kind
        ]

    def __contains__(self, type_id: object) -> bool:
        return type_id in self._types

    def __len__(self) -> int:
        return len(self._types)

    def load_entry_points(
        self, entry_point_list: Iterable[EntryPointLike] | None = None
    ) -> LoadReport:
        """Register the types of other packages from the entry point group
        ``pipwerk.element_types``.

        An entry point resolves to a type description, an iterable of type descriptions
        or a callable that gets an object with ``register(description)`` and may
        return type descriptions. A faulty entry point does not prevent the others from
        loading. It is logged with its name and the class of the exception, without the
        text of the exception and without paths.
        """
        if entry_point_list is None:
            entry_point_list = _installed_entry_points()
        loaded: list[str] = []
        failed: list[str] = []
        for entry_point in entry_point_list:
            name = _safe_name(entry_point)
            try:
                descriptions = _descriptions_of(entry_point.load())
                self._register_all_or_none(descriptions)
            # a faulty entry point must not stop the others, not even by `SystemExit`
            except (Exception, SystemExit) as error:
                _logger.warning(
                    "Entry point %r of the group %s could not be loaded (%s)",
                    name,
                    ENTRY_POINT_GROUP,
                    type(error).__name__,
                )
                failed.append(name)
            else:
                loaded.append(name)
        return LoadReport(tuple(loaded), tuple(failed))

    def _register_all_or_none(self, descriptions: Descriptions) -> None:
        seen: set[str] = set()
        for description in descriptions:
            if not isinstance(description, TypeDescription):
                raise RegistryError("not a type description")
            if description.id in self._types or description.id in seen or not description.id:
                raise RegistryError("identifier empty or already registered")
            _check_valid(description)
            seen.add(description.id)
        for description in descriptions:
            self.register(description)

    def _derived(self, description: TypeDescription) -> TypeDescription:
        """Complete the descriptions whose choices depend on other registrations: the
        calculation methods of the trend and the order types of "Order aufgeben"."""
        if description.id == TREND_TYPE_ID:
            description = self._with_methods(description)
        elif description.id == PLACE_ORDER_TYPE_ID:
            description = self._with_order_types(description)
        return _with_time_units(description)

    def _with_order_types(self, element: TypeDescription) -> TypeDescription:
        order_types = tuple(
            Choice(item.id, item.name)
            for item in self._types.values()
            if item.kind is ElementKind.ORDER_TYPE and item.by_user
        )
        parameters = tuple(
            replace(parameter, choices=order_types)
            if parameter.id == ORDER_TYPE_PARAMETER
            else parameter
            for parameter in element.parameters
        )
        return replace(element, parameters=parameters)

    def _with_methods(self, trend: TypeDescription) -> TypeDescription:
        """Trend description with the registered calculation methods as values of the
        parameter ``berechnungsverfahren`` and with their parameters, which apply only
        for the chosen method."""
        methods = [item for item in self._types.values() if item.kind is ElementKind.TREND_METHOD]
        parameters: list[ParameterDescription] = []
        for parameter in trend.parameters:
            if parameter.id == TREND_METHOD_PARAMETER:
                choices: tuple[Choice, ...] = tuple(
                    Choice(method.id, method.name) for method in methods
                )
                parameter = replace(parameter, choices=choices)
            parameters.append(parameter)
        for method in methods:
            for parameter in method.parameters:
                parameters.append(
                    replace(
                        parameter,
                        applies_when=Condition(TREND_METHOD_PARAMETER, method.id),
                    )
                )
        return replace(trend, parameters=tuple(parameters))


def _check_valid(description: TypeDescription) -> None:
    """At most one output of a type carries the management (specification 3.1); the methods
    have unique identifiers and valid arguments."""
    if sum(1 for item in description.outputs if item.holds_management) > 1:
        raise RegistryError("more than one output holds the management")
    _check_methods(description)


def _check_methods(description: TypeDescription) -> None:
    taken = {item.id.lower() for item in description.properties}
    seen: set[str] = set()
    for method in description.methods:
        if not isinstance(method, MethodDescription):
            raise RegistryError("not a method description")
        if not is_valid_key(method.id):
            raise RegistryError(f"invalid method identifier: {method.id!r}")
        key = method.id.lower()
        if key in seen:
            raise RegistryError(f"method identifier twice: {method.id}")
        if key in taken:
            raise RegistryError(f"method identifier equals a property: {method.id}")
        seen.add(key)
        if method.datatype is DataType.EXPRESSION:
            raise RegistryError(f"method {method.id}: result of the data type expression")
        _check_choices(f"method {method.id}", method.datatype, method.choices)
        _check_arguments(method)


def _check_choices(owner: str, datatype: DataType, choices: tuple[Choice, ...]) -> None:
    identifiers = [item.id for item in choices]
    if len(set(identifiers)) != len(identifiers):
        raise RegistryError(f"{owner}: a value of a choice twice")
    if datatype is DataType.CHOICE and not choices:
        raise RegistryError(f"{owner}: a choice without values")


def _check_arguments(method: MethodDescription) -> None:
    seen: set[str] = set()
    optional_seen = False
    for argument in method.arguments:
        if not isinstance(argument, ArgumentDescription):
            raise RegistryError(f"method {method.id}: not an argument description")
        where = f"method {method.id}, argument {argument.id!r}"
        if not is_valid_key(argument.id):
            raise RegistryError(f"{where}: invalid identifier")
        if argument.id.lower() in seen:
            raise RegistryError(f"{where}: identifier twice")
        seen.add(argument.id.lower())
        if argument.datatype is DataType.EXPRESSION:
            raise RegistryError(f"{where}: data type expression")
        _check_choices(where, argument.datatype, argument.choices)
        if argument.required:
            if optional_seen:
                raise RegistryError(f"{where}: a mandatory argument after an optional one")
            if argument.default is not None:
                raise RegistryError(f"{where}: a mandatory argument has no default value")
            continue
        optional_seen = True
        if argument.default is None:
            raise RegistryError(f"{where}: an optional argument needs a default value")
        if not _default_fits(argument):
            raise RegistryError(f"{where}: the default value does not fit the data type")


def _default_fits(argument: ArgumentDescription) -> bool:
    """Whether the default value of an optional argument is a value of its data type."""
    value = argument.default
    match argument.datatype:
        case DataType.BOOLEAN:
            return isinstance(value, bool)
        case DataType.INTEGER:
            return isinstance(value, int) and not isinstance(value, bool)
        case DataType.NUMBER | DataType.PERCENT:
            return isinstance(value, int | float) and not isinstance(value, bool)
        case DataType.CHOICE:
            return value in {item.id for item in argument.choices}
        case DataType.TIME_UNIT:
            return value in TIME_UNIT_IDS
        case _:
            return isinstance(value, str)


def _fill_time_unit[
    T: (ParameterDescription, PropertyDescription, ArgumentDescription, MethodDescription)
](item: T) -> T:
    if item.datatype is DataType.TIME_UNIT and not item.choices:
        return replace(item, choices=TIME_UNITS)
    return item


def _fill_method(method: MethodDescription) -> MethodDescription:
    method = _fill_time_unit(method)
    return replace(method, arguments=tuple(_fill_time_unit(item) for item in method.arguments))


def _with_time_units(description: TypeDescription) -> TypeDescription:
    """Name all time units as ``choices`` of the parameters, properties and methods of the data
    type time unit (specification 3.1)."""
    return replace(
        description,
        parameters=tuple(_fill_time_unit(item) for item in description.parameters),
        properties=tuple(_fill_time_unit(item) for item in description.properties),
        methods=tuple(_fill_method(item) for item in description.methods),
    )


def _installed_entry_points() -> list[EntryPointLike]:
    """The entry points of the group of all installed packages, read for each package on its
    own: faulty metadata of a package (in any group) exclude only this package. The excluded
    package is logged with its name and the class of the exception."""
    found: list[EntryPointLike] = []
    seen: set[str] = set()
    try:
        distribution_iterator = iter(distributions())
    except Exception as error:  # the list of installed packages cannot be read at all
        _logger.warning("The installed packages could not be listed (%s)", type(error).__name__)
        return found
    while True:
        try:
            distribution = next(distribution_iterator)
        except StopIteration:
            break
        except Exception as error:  # reading the list stops here
            _logger.warning(
                "The installed packages could not be listed completely (%s)",
                type(error).__name__,
            )
            break
        package = "?"
        try:
            package = str(distribution.metadata.get("Name") or "?")
            key = package.lower().replace("_", "-")
            if key in seen and package != "?":
                continue  # a package that is installed twice counts once, as in importlib
            seen.add(key)
            found.extend(
                item for item in distribution.entry_points if item.group == ENTRY_POINT_GROUP
            )
        except Exception as error:  # faulty metadata of this package
            _logger.warning(
                "The entry points of the package %r are ignored, its metadata cannot be read (%s)",
                package,
                type(error).__name__,
            )
    return found


def _safe_name(entry_point: EntryPointLike) -> str:
    try:
        return str(entry_point.name)
    except Exception:  # an entry point object that is itself faulty
        return "?"


def _descriptions_of(loaded: object) -> list[TypeDescription]:
    if isinstance(loaded, TypeDescription):
        return [loaded]
    if callable(loaded):
        collector = _Collector()
        factory: Callable[[_Collector], object] = loaded
        returned = factory(collector)
        result = list(collector.items)
        if returned is not None:
            result.extend(_descriptions_of(returned))
        return result
    if isinstance(loaded, Iterable) and not isinstance(loaded, str | bytes):
        return list(loaded)
    raise RegistryError("an entry point must provide type descriptions")

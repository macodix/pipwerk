import logging
import sys
import textwrap
from pathlib import Path

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.defaults import create_registry, default_registry
from pipwerk_domain.registry import (
    ENTRY_POINT_GROUP,
    ElementRegistry,
    RegistryError,
)
from pipwerk_domain.typedesc import (
    DataType,
    ElementKind,
    Label,
    ParameterDescription,
    TypeDescription,
)


def description(type_id: str, kind: ElementKind = ElementKind.FLOW) -> TypeDescription:
    return TypeDescription(type_id, kind, Label(type_id, type_id), Label("", ""))


class FakeEntryPoint:
    def __init__(self, name: str, loaded: object = None, error: Exception | None = None) -> None:
        self.name = name
        self._loaded = loaded
        self._error = error

    def load(self) -> object:
        if self._error is not None:
            raise self._error
        return self._loaded


def test_register_query_and_list() -> None:
    registry = ElementRegistry()
    first = description("a.one")
    second = description("a.two", ElementKind.TRIGGER)
    registry.register(first)
    registry.register(second)
    assert registry.get("a.one") == first
    assert registry.get("missing") is None
    assert "a.two" in registry
    assert len(registry) == 2
    assert registry.list() == [first, second]
    assert registry.list(ElementKind.TRIGGER) == [second]


def test_an_identifier_can_be_registered_only_once() -> None:
    registry = ElementRegistry()
    registry.register(description("a.one"))
    with pytest.raises(RegistryError):
        registry.register(description("a.one"))


def test_registering_something_else_than_a_description_fails() -> None:
    registry = ElementRegistry()
    with pytest.raises(RegistryError):
        registry.register("a.one")  # type: ignore[arg-type]
    with pytest.raises(RegistryError):
        registry.register(description(""))


def test_the_default_registry_has_the_delivered_types() -> None:
    registry = create_registry(entry_points=False)
    ids = {item.id for item in registry.list()}
    assert {catalog.TRIGGER_CANDLE_CLOSE, catalog.TRIGGER_TICK, "EMA", "Konto"} <= ids
    assert default_registry() is default_registry()


def test_entry_point_with_a_description() -> None:
    registry = ElementRegistry()
    report = registry.load_entry_points([FakeEntryPoint("p", description("x.one"))])
    assert report.loaded == ("p",)
    assert report.failed == ()
    assert registry.get("x.one") is not None


def test_entry_point_with_a_list_of_descriptions() -> None:
    registry = ElementRegistry()
    registry.load_entry_points([FakeEntryPoint("p", [description("x.one"), description("x.two")])])
    assert len(registry) == 2


def test_entry_point_with_a_function_that_registers() -> None:
    def register(target: object) -> None:
        target.register(description("x.one"))  # type: ignore[attr-defined]
        target.register(description("x.two"))  # type: ignore[attr-defined]

    registry = ElementRegistry()
    report = registry.load_entry_points([FakeEntryPoint("p", register)])
    assert report.loaded == ("p",)
    assert {item.id for item in registry.list()} == {"x.one", "x.two"}


def test_a_faulty_entry_point_does_not_prevent_the_others(
    caplog: pytest.LogCaptureFixture,
) -> None:
    registry = ElementRegistry()
    registry.register(description("x.taken"))
    leak = "/hidden/path/to/module"

    def half_done(target: object) -> None:
        target.register(description("x.partial"))  # type: ignore[attr-defined]
        raise RuntimeError(leak)

    entry_points = [
        FakeEntryPoint("broken-import", error=ImportError(leak)),
        FakeEntryPoint("no-descriptions", 42),
        FakeEntryPoint("duplicate", description("x.taken")),
        FakeEntryPoint("half", half_done),
        FakeEntryPoint("good", description("x.good")),
    ]
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        report = registry.load_entry_points(entry_points)
    assert report.loaded == ("good",)
    assert report.failed == ("broken-import", "no-descriptions", "duplicate", "half")
    assert registry.get("x.good") is not None
    assert registry.get("x.partial") is None  # a failing entry point registers nothing
    text = caplog.text
    assert "broken-import" in text
    assert "ImportError" in text
    assert leak not in text  # neither the text of the exception nor a path
    assert "Traceback" not in text
    assert all(record.exc_info is None for record in caplog.records)
    assert len(caplog.records) == 4


def test_entry_point_group_name() -> None:
    assert ENTRY_POINT_GROUP == "pipwerk.element_types"


def test_entry_points_of_an_installed_test_package(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A test package with an entry point in the group ``pipwerk.element_types``."""
    package = tmp_path / "pipwerk_testplugin"
    package.mkdir()
    (package / "__init__.py").write_text(
        textwrap.dedent(
            """
            from pipwerk_domain.typedesc import ElementKind, Label, TypeDescription

            def register(registry):
                registry.register(
                    TypeDescription(
                        "plugin.order_type",
                        ElementKind.ORDER_TYPE,
                        Label("Plugin-Order", "Plugin order"),
                        Label("", ""),
                    )
                )

            def broken():
                raise RuntimeError("secret")
            """
        ),
        encoding="utf-8",
    )
    info = tmp_path / "pipwerk_testplugin-1.0.dist-info"
    info.mkdir()
    (info / "METADATA").write_text(
        "Metadata-Version: 2.1\nName: pipwerk-testplugin\nVersion: 1.0\n", encoding="utf-8"
    )
    (info / "entry_points.txt").write_text(
        f"[{ENTRY_POINT_GROUP}]\ngood = pipwerk_testplugin:register\n"
        "bad = pipwerk_testplugin:missing_name\n",
        encoding="utf-8",
    )
    monkeypatch.syspath_prepend(str(tmp_path))
    registry = create_registry(entry_points=False)
    report = registry.load_entry_points()
    assert "good" in report.loaded
    assert "bad" in report.failed
    assert registry.get("plugin.order_type") is not None
    sys.modules.pop("pipwerk_testplugin", None)


def test_a_registered_order_type_is_offered_by_place_order() -> None:
    registry = create_registry(entry_points=False)
    registry.register(
        TypeDescription(
            "PluginOrder", ElementKind.ORDER_TYPE, Label("P", "P"), Label("", ""), by_user=True
        )
    )
    place = registry.get(catalog.FLOW_PLACE_ORDER)
    assert place is not None
    parameter = place.parameter("ordertyp")
    assert parameter is not None
    ids = [choice.id for choice in parameter.choices]
    assert "MarketOrder" in ids
    assert "PluginOrder" in ids
    assert "CloseOrder" not in ids  # arises only from "Position schließen"


def test_trend_methods_are_registered_with_their_parameters() -> None:
    registry = create_registry(entry_points=False)
    trend = registry.get(catalog.TYPE_TREND)
    assert trend is not None
    method = trend.parameter("berechnungsverfahren")
    assert method is not None
    assert [choice.id for choice in method.choices] == [catalog.TREND_METHOD_EXPRESSION]
    registry.register(
        TypeDescription(
            "trend_method.cross",
            ElementKind.TREND_METHOD,
            Label("Kreuzen", "Crossing"),
            Label("", ""),
            parameters=(
                ParameterDescription("periode", DataType.INTEGER, Label("Periode", "Period")),
            ),
        )
    )
    trend = registry.get(catalog.TYPE_TREND)
    assert trend is not None
    method = trend.parameter("berechnungsverfahren")
    assert method is not None
    assert [choice.id for choice in method.choices] == [
        catalog.TREND_METHOD_EXPRESSION,
        "trend_method.cross",
    ]
    extra = trend.parameter("periode")
    assert extra is not None
    assert extra.applies_when is not None
    assert extra.applies_when.name == "berechnungsverfahren"
    assert extra.applies_when.value == "trend_method.cross"

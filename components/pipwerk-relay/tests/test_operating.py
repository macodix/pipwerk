"""The operating configuration (specification 4.5): the model, loading as a whole, taking over
by a running relay."""

import json
import logging
import os
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

import pytest

from pipwerk_relay.configuration import load_configuration, show_configuration
from pipwerk_relay.errors import ConfigRejected, NotConfigured
from pipwerk_relay.operating import (
    MAX_CONFIG_BYTES,
    RelayConfig,
    parse_config,
)
from tests.support import World

NOW = datetime(2026, 10, 24, 12, 0, tzinfo=UTC)

VALID: dict[str, Any] = {
    "network": "net1",
    "name": "r1",
    "inputs": [{"name": "main", "way": "files", "settings": {"directory": "in"}}],
    "components": [
        {"name": "app-a", "way": "files", "settings": {"directory": "out-a"}, "key_file": "ka"},
        {"name": "app-b", "way": "files", "settings": {"directory": "out-b"}, "key_file": "kb"},
    ],
    "address_book": [
        {
            "network": "net1",
            "relay": "r2",
            "way": "files",
            "settings": {"directory": "r2-in"},
            "key_file": "k2",
            "standard": True,
        },
        {
            "network": "net2",
            "relay": "r3",
            "way": "files",
            "settings": {"directory": "r3-in"},
            "key_file": "k3",
        },
    ],
}


def changed(**changes: Any) -> dict[str, Any]:
    document = deepcopy(VALID)
    document.update(changes)
    return document


def problems_of(document: dict[str, Any] | str) -> tuple[str, ...]:
    text = document if isinstance(document, str) else json.dumps(document)
    with pytest.raises(ConfigRejected) as error:
        parse_config(text)
    return error.value.problems


# The model -------------------------------------------------------------------------------------


def test_a_complete_document_is_read_with_the_defaults_for_the_rest() -> None:
    config = parse_config(json.dumps(VALID))
    assert config.own_link_name == "net1.r1"
    assert config.standard_relay is not None and config.standard_relay.link_name == "net1.r2"
    assert config.periods.delivery_deadline_seconds == 86_400  # 24 hours
    assert config.periods.seen_for_seconds == 604_800  # 7 days
    assert config.limits.max_hops == 8
    assert config.limits.max_queue_messages == 10_000
    assert config.inputs[0].settings == {"directory": "in"}


def test_a_document_with_only_the_names_is_valid() -> None:
    config = parse_config('{"network": "n", "name": "r"}')
    assert (config.inputs, config.components, config.address_book) == ((), (), ())
    assert config.standard_relay is None


def test_whole_numbers_are_valid_for_the_periods() -> None:
    config = parse_config(
        json.dumps(changed(periods={"read_interval_seconds": 1, "retry_max_seconds": 30.5}))
    )
    assert config.periods.read_interval_seconds == 1


@pytest.mark.parametrize(
    ("document", "place"),
    [
        (changed(extra=1), "extra"),
        (changed(periods={"fast": 1}), "periods.fast"),
        (changed(limits={"fast": 1}), "limits.fast"),
        (changed(inputs=[{"name": "m", "way": "files", "other": 1}]), "inputs.0.other"),
        (
            changed(components=[{"name": "a", "way": "files", "key_file": "k", "x": 1}]),
            "components.0.x",
        ),
        (changed(address_book=[{**VALID["address_book"][0], "x": 1}]), "address_book.0.x"),
    ],
)
def test_additional_fields_are_rejected_and_named_by_place(
    document: dict[str, Any], place: str
) -> None:
    assert any(problem.startswith(place) for problem in problems_of(document))


def test_the_settings_of_a_way_may_hold_any_fields() -> None:
    settings = {"directory": "x", "anything": [1, {"deep": None}], "flag": True}
    config = parse_config(
        json.dumps(changed(inputs=[{"name": "m", "way": "files", **{"settings": settings}}]))
    )
    assert config.inputs[0].settings == settings


@pytest.mark.parametrize("name", ["", "a.b", "-a", "a b", "ä", "a" * 64, "a\n"])
def test_names_follow_the_rules_of_an_address(name: str) -> None:
    assert problems_of(changed(name=name))
    assert problems_of(changed(network=name))


def test_the_name_relay_is_reserved_for_components() -> None:
    component = {"name": "relay", "way": "files", "key_file": "k"}
    (problem,) = problems_of(changed(components=[component]))
    assert "reserved" in problem


def test_two_components_with_the_same_name_are_rejected() -> None:
    component = {"name": "a", "way": "files", "key_file": "k"}
    other = {"name": "a", "way": "files", "key_file": "k2"}
    assert any(
        "must differ" in problem for problem in problems_of(changed(components=[component, other]))
    )


def test_a_key_file_is_used_for_one_connection_only() -> None:
    first = {"name": "a", "way": "files", "key_file": "same"}
    second = {"name": "b", "way": "files", "key_file": "same"}
    assert any(
        "key_file must differ" in p for p in problems_of(changed(components=[first, second]))
    )
    entry = {"network": "n", "relay": "r", "way": "files", "key_file": "same"}
    assert any(
        "key_file must differ" in p
        for p in problems_of(changed(components=[first], address_book=[entry]))
    )


def test_the_relay_is_not_in_its_own_address_book() -> None:
    entry = {"network": "net1", "relay": "r1", "way": "files", "key_file": "k"}
    assert any("own address book" in p for p in problems_of(changed(address_book=[entry])))


def test_two_entries_for_the_same_relay_are_rejected() -> None:
    first = {"network": "n", "relay": "r", "way": "files", "key_file": "k1"}
    second = {"network": "n", "relay": "r", "way": "files", "key_file": "k2"}
    assert problems_of(changed(address_book=[first, second]))


def test_at_most_one_standard_relay() -> None:
    first = {"network": "n", "relay": "r", "way": "files", "key_file": "k1", "standard": True}
    second = {"network": "n", "relay": "s", "way": "files", "key_file": "k2", "standard": True}
    assert any("standard relay" in p for p in problems_of(changed(address_book=[first, second])))


@pytest.mark.parametrize(
    "bad",
    [
        {"periods": {"read_interval_seconds": 0}},
        {"periods": {"retry_first_seconds": -1}},
        {"periods": {"retry_first_seconds": 100, "retry_max_seconds": 10}},
        {"periods": {"delivery_deadline_seconds": "1"}},
        {"limits": {"max_hops": 0}},
        {"limits": {"max_hops": 64}},
        {"limits": {"read_batch": 0}},
        {"limits": {"max_queue_messages": 0}},
        {"limits": {"max_attachment_storage_bytes": 0}},
        {"limits": {"max_queue_messages": "10"}},
    ],
)
def test_periods_and_limits_are_checked(bad: dict[str, Any]) -> None:
    assert problems_of(changed(**bad))


def test_a_key_file_name_is_never_a_path() -> None:
    for name in ("../k", "a/b", ".hidden", "", "a b", "k" * 129):
        component = {"name": "a", "way": "files", "key_file": name}
        assert problems_of(changed(components=[component]))


def test_the_way_name_has_the_form_of_the_names_of_ways() -> None:
    for name in ("Files", "1files", "", "a.b", "f" * 33):
        assert problems_of(changed(inputs=[{"name": "m", "way": name}]))


def test_text_that_is_no_json_object_is_rejected_without_quoting_it() -> None:
    for text in ("", "not json SECRET", "[]", "null", '{"network": "n", "name": 5}'):
        for problem in problems_of(text):
            assert "SECRET" not in problem


def test_a_document_over_the_largest_size_is_rejected() -> None:
    (problem,) = problems_of(" " * (MAX_CONFIG_BYTES + 1))
    assert "larger than" in problem


def test_the_problems_name_the_place_never_the_value() -> None:
    document = changed(components=[{"name": "SECRET-VALUE.x", "way": "files", "key_file": "k"}])
    assert all("SECRET-VALUE" not in problem for problem in problems_of(document))


# Loading as a whole --------------------------------------------------------------------------


def test_a_valid_file_is_stored_and_shown(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    assert site.apply() == 1
    shown = show_configuration(site.store)
    assert json.loads(shown)["name"] == "r1"
    assert json.loads(shown)["periods"]["retry_first_seconds"] == 10  # complete, with defaults
    assert RelayConfig.model_validate_json(shown).own_link_name == "net1.r1"
    assert site.apply() == 2  # a new version for every file loaded


def test_without_a_loaded_configuration_there_is_nothing_to_show_and_the_relay_cannot_run(
    world: World,
) -> None:
    site = world.site("r1")
    with pytest.raises(NotConfigured):
        show_configuration(site.store)
    with pytest.raises(NotConfigured):
        site.relay.cycle()


def test_an_invalid_file_is_rejected_as_a_whole_and_the_old_configuration_stays(
    world: World,
) -> None:
    site = world.site("r1", components=["app-a"])
    site.apply()
    before = show_configuration(site.store)
    document = site.document()
    document["components"][0]["name"] = "relay"  # reserved
    with pytest.raises(ConfigRejected):
        load_configuration(site.store, site.secrets, json.dumps(document), NOW)
    assert show_configuration(site.store) == before
    assert site.store.config_version() == 1


def test_a_file_with_an_unknown_way_is_rejected(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    document = site.document()
    document["inputs"][0]["way"] = "carrier-pigeon"
    with pytest.raises(ConfigRejected) as error:
        load_configuration(site.store, site.secrets, json.dumps(document), NOW)
    assert any("inputs.0" in p and "carrier-pigeon" in p for p in error.value.problems)
    assert site.store.config_version() is None


def test_unknown_settings_of_a_way_are_rejected_by_the_way_and_named_by_entry(
    world: World,
) -> None:
    site = world.site("r1", components=["app-a"])
    document = site.document()
    document["components"][0]["settings"]["colour"] = "SECRET-VALUE"
    with pytest.raises(ConfigRejected) as error:
        load_configuration(site.store, site.secrets, json.dumps(document), NOW)
    assert any("components.0" in p and "colour" in p for p in error.value.problems)
    assert all("SECRET-VALUE" not in p for p in error.value.problems)


def test_a_missing_key_file_is_rejected_and_named_by_its_file_name(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    document = site.document()
    document["components"][0]["key_file"] = "no-such-key"
    with pytest.raises(ConfigRejected) as error:
        load_configuration(site.store, site.secrets, json.dumps(document), NOW)
    assert any("components.0" in p and "no-such-key" in p for p in error.value.problems)


@pytest.mark.skipif(os.name == "nt", reason="rights of POSIX systems")
def test_a_key_file_that_others_can_read_is_rejected(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    (site.secrets_directory / "comp-app-a").chmod(0o644)
    with pytest.raises(ConfigRejected) as error:
        load_configuration(site.store, site.secrets, json.dumps(site.document()), NOW)
    assert any("accessible" in p for p in error.value.problems)


def test_every_problem_of_a_file_is_reported_at_once(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    document = site.document()
    document["inputs"][0]["way"] = "carrier-pigeon"
    document["components"][0]["key_file"] = "no-such-key"
    with pytest.raises(ConfigRejected) as error:
        load_configuration(site.store, site.secrets, json.dumps(document), NOW)
    assert len(error.value.problems) == 2


# Taking over while running ---------------------------------------------------------------------


def test_a_running_relay_takes_over_a_new_configuration_without_a_restart(
    world: World, caplog: pytest.LogCaptureFixture
) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    relay = site.relay
    site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    assert site.components["app-a"].handler.reasons() == ["unknown_recipient"]
    site.add_component("app-b")  # a new component and a new configuration
    site.apply()
    site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    assert site.relay is relay  # the same running relay
    assert len(site.components["app-b"].handler.others) == 1
    assert "operating configuration 2 taken over" in caplog.text


def test_a_configuration_that_cannot_be_built_later_leaves_the_relay_working(
    world: World, caplog: pytest.LogCaptureFixture
) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    site.relay.cycle()
    # loaded when the key still existed; then the key file is lost before the relay looks
    site.apply()
    (site.secrets_directory / "comp-app-b").unlink()
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    site.relay.cycle()
    site.relay.cycle()
    assert caplog.text.count("cannot be used") == 1  # noted once, not in every round
    site.components["app-a"].send("app-b.net1.r1")  # the old configuration is still in use
    site.relay.cycle()
    assert site.relay.pause_seconds == 1


def test_the_first_configuration_that_cannot_be_built_stops_the_relay(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    site.apply()
    (site.secrets_directory / "comp-app-a").unlink()
    with pytest.raises(ConfigRejected):
        site.new_relay().cycle()

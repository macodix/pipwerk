"""The commands of pipwerk-relay: run, config load|show, key new, queue, migrate."""

import json
import os
import signal
import socket
import sys
import threading
from pathlib import Path

import pytest

from pipwerk_relay.cli import main
from pipwerk_relay.relay import Relay
from tests.installation import Install

posix_only = pytest.mark.skipif(sys.platform == "win32", reason="rights of POSIX systems")


# Calls and startup configuration ---------------------------------------------------------------


def test_a_call_without_a_command_or_with_an_unknown_one_is_refused() -> None:
    for arguments in ([], ["fly"], ["config"], ["config", "load"], ["key", "new"], ["probe"]):
        with pytest.raises(SystemExit) as stop:
            main(arguments)
        assert stop.value.code == 2


def test_help_names_the_commands(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as stop:
        main(["--help"])
    assert stop.value.code == 0
    text = capsys.readouterr().out
    for word in ("run", "config", "key", "queue", "migrate"):
        assert word in text


def test_a_missing_startup_configuration_is_exit_code_2(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert main(["-c", str(tmp_path / "none.ini"), "queue"]) == 2
    assert "not found" in capsys.readouterr().err


def test_an_invalid_startup_configuration_is_exit_code_2(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.ini.write_text(install.ini.read_text(encoding="utf-8") + "[web]\nport = 80\n")
    assert install.run("queue") == 2
    assert "unknown section" in capsys.readouterr().err


# migrate -------------------------------------------------------------------------------------


def test_the_commands_refuse_a_database_that_was_not_migrated(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    for arguments in (["queue"], ["config", "show"], ["run"]):
        assert install.run(*arguments) == 1
        assert "pipwerk-relay migrate" in capsys.readouterr().err


def test_migrate_creates_the_schema_and_may_be_repeated(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    assert install.run("migrate") == 0
    assert install.run("migrate") == 0
    assert "newest version" in capsys.readouterr().out
    assert install.run("queue") == 0


def test_a_database_that_cannot_be_opened_is_reported_without_a_path(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.ini.write_text(
        install.ini.read_text(encoding="utf-8").replace(
            str(install.database), str(install.root / "no" / "such" / "dir" / "relay.db")
        ),
        encoding="utf-8",
    )
    assert install.run("migrate") == 1
    error = capsys.readouterr().err
    assert "the database cannot be used" in error
    assert str(install.root) not in error


# key new -------------------------------------------------------------------------------------


@posix_only
def test_key_new_creates_a_key_file_that_only_the_owner_can_read(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    assert install.run("key", "new", "to-relay2") == 0
    path = install.secrets / "to-relay2"
    assert path.stat().st_mode & 0o777 == 0o600
    text = path.read_text(encoding="ascii").strip()
    assert len(text) == 64
    output = capsys.readouterr()
    assert text not in output.out + output.err  # the key is not shown


def test_key_new_never_overwrites_a_key(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    assert install.run("key", "new", "k") == 0
    before = (install.secrets / "k").read_text(encoding="ascii")
    assert install.run("key", "new", "k") == 1
    assert "exists already" in capsys.readouterr().err
    assert (install.secrets / "k").read_text(encoding="ascii") == before


def test_key_new_takes_a_file_name_not_a_path(install: Install) -> None:
    assert install.run("key", "new", "../outside") == 1
    assert install.run("key", "new", "sub/dir") == 1
    assert not (install.root / "outside").exists()


@posix_only
def test_key_new_refuses_a_directory_that_others_can_read(install: Install) -> None:
    install.secrets.chmod(0o755)
    assert install.run("key", "new", "k") == 1
    assert not (install.secrets / "k").exists()


# config load | show --------------------------------------------------------------------------


def test_config_show_without_a_configuration_fails(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    assert install.run("migrate") == 0
    assert install.run("config", "show") == 1
    assert "no operating configuration" in capsys.readouterr().err


def test_config_load_stores_and_config_show_prints_it(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    capsys.readouterr()
    assert install.run("config", "show") == 0
    shown = json.loads(capsys.readouterr().out)
    assert shown["name"] == "relay1"
    assert [c["name"] for c in shown["components"]] == ["app-a", "app-b"]
    assert shown["limits"]["max_hops"] == 8  # the defaults are written out
    assert shown["periods"]["read_interval_seconds"] == 0.05


def test_config_load_says_which_version_a_running_relay_will_take_over(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    assert "Operating configuration 1 loaded" in capsys.readouterr().out
    assert install.run("config", "load", str(install.write_config(install.document()))) == 0
    assert "Operating configuration 2 loaded" in capsys.readouterr().out


def test_config_load_rejects_an_invalid_file_as_a_whole_and_names_the_problems(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    capsys.readouterr()
    bad = install.document()
    bad["components"][0]["name"] = "relay"
    bad["limits"] = {"max_hops": 0, "unknown": 1}
    assert install.run("config", "load", str(install.write_config(bad))) == 1
    error = capsys.readouterr().err
    assert "limits.unknown" in error and "limits.max_hops" in error
    assert "nothing was changed" in error
    worse = install.document()
    worse["inputs"][0]["way"] = "carrier-pigeon"
    assert install.run("config", "load", str(install.write_config(worse))) == 1
    assert "inputs.0" in capsys.readouterr().err
    assert install.run("config", "show") == 0
    assert json.loads(capsys.readouterr().out)["components"][0]["name"] == "app-a"


def test_config_load_rejects_a_file_that_is_not_json_and_one_that_is_missing(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    broken = install.root / "broken.json"
    broken.write_text("{not json SECRET-TEXT", encoding="utf-8")
    assert install.run("config", "load", str(broken)) == 1
    assert "SECRET-TEXT" not in capsys.readouterr().err
    assert install.run("config", "load", str(install.root / "missing.json")) == 1


def test_config_load_rejects_a_key_file_that_does_not_exist(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    capsys.readouterr()
    document = install.document()
    document["components"][0]["key_file"] = "component-not-created"
    assert install.run("config", "load", str(install.write_config(document))) == 1
    assert "component-not-created" in capsys.readouterr().err


# queue ---------------------------------------------------------------------------------------


def test_queue_is_empty_after_the_start(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    install.prepare()
    capsys.readouterr()
    assert install.run("queue") == 0
    output = capsys.readouterr().out
    assert output.splitlines()[-1] == "0 messages in the queue, 0 bytes of attachments"


def test_queue_lists_waiting_messages_with_their_state_but_without_content(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    other = {
        "network": "net1",
        "relay": "relay2",
        "way": "files",
        "settings": {"directory": str(install.root / "relay2-in")},  # does not exist
        "key_file": "relay-relay2",
    }
    install.prepare()
    assert install.run("key", "new", "relay-relay2") == 0
    assert (
        install.run(
            "config", "load", str(install.write_config(install.document(address_book=[other])))
        )
        == 0
    )
    capsys.readouterr()
    connector, _ = install.component("app-a")
    sent = connector.send(
        "app-x.net1.relay2",
        "probe.message",
        {"text": "SECRET-CONTENT"},
        attachments=[("SECRET-NAME.txt", b"SECRET-FILE")],
    )
    relay, engine = install.relay()
    relay.cycle()
    engine.dispose()
    assert install.run("queue") == 0
    output = capsys.readouterr().out
    assert str(sent.id) in output
    for word in ("probe.message", "app-a.net1.relay1", "app-x.net1.relay2", "retrying"):
        assert word in output
    assert "WayUnavailableError" in output
    assert output.splitlines()[-1] == "1 messages in the queue, 11 bytes of attachments"
    for secret in ("SECRET-CONTENT", "SECRET-NAME", "SECRET-FILE"):
        assert secret not in output
    connector.close()


# run -------------------------------------------------------------------------------------------


@posix_only
def test_run_does_not_start_with_a_secrets_directory_that_others_can_read(
    install: Install, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    install.prepare()
    install.secrets.chmod(0o755)

    def must_not_run(self: Relay) -> None:
        raise AssertionError("the relay started")

    monkeypatch.setattr(Relay, "cycle", must_not_run)
    capsys.readouterr()
    assert install.run("run") == 1
    assert "not started" in capsys.readouterr().err


@posix_only
def test_run_does_not_start_with_a_key_file_that_others_can_read(
    install: Install, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    install.prepare()
    (install.secrets / "component-app-a").chmod(0o644)

    def must_not_run(self: Relay) -> None:
        raise AssertionError("the relay started")

    monkeypatch.setattr(Relay, "cycle", must_not_run)
    assert install.run("run") == 1


def test_run_does_not_start_without_a_configuration(
    install: Install, capsys: pytest.CaptureFixture[str]
) -> None:
    assert install.run("migrate") == 0
    capsys.readouterr()
    assert install.run("run") == 1
    assert "no operating configuration" in capsys.readouterr().err


@posix_only
def test_run_works_until_it_is_stopped_and_forwards_messages(install: Install) -> None:
    install.prepare()
    sender, _ = install.component("app-a")
    receiver, handler = install.component("app-b")
    sender.send("app-b.net1.relay1", "probe.message", {"text": "SECRET-CONTENT"})
    timer = threading.Timer(1.5, os.kill, args=(os.getpid(), signal.SIGTERM))
    timer.start()
    try:
        assert install.run("run") == 0
    finally:
        timer.cancel()
    receiver.poll(handler)
    (received,) = handler.stored
    assert received.message.content == {"text": "SECRET-CONTENT"}
    log = install.log.read_text(encoding="utf-8")
    assert "operating configuration 1 taken over" in log
    assert "forwarded message=" in log
    assert "SECRET-CONTENT" not in log
    sender.close()
    receiver.close()


@posix_only
def test_run_takes_over_a_configuration_loaded_while_it_runs(install: Install) -> None:
    install.prepare()
    sender, _ = install.component("app-a")
    receiver, handler = install.component("app-b")
    sender.send("app-b.net1.relay1", "probe.message", {"text": "hello"})
    changed = install.write_config(install.document(periods={"read_interval_seconds": 0.05}))

    def load_while_running() -> None:
        assert install.run("config", "load", str(changed)) == 0

    threading.Timer(0.8, load_while_running).start()
    timer = threading.Timer(2.0, os.kill, args=(os.getpid(), signal.SIGTERM))
    timer.start()
    try:
        assert install.run("run") == 0
    finally:
        timer.cancel()
    assert "operating configuration 2 taken over" in install.log.read_text(encoding="utf-8")
    sender.close()
    receiver.close()
    del handler


def test_no_command_opens_a_port(install: Install, monkeypatch: pytest.MonkeyPatch) -> None:
    def refuse(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("a socket was created")

    monkeypatch.setattr(socket, "socket", refuse)
    install.prepare()
    assert install.run("queue") == 0
    assert install.run("config", "show") == 0
    if sys.platform != "win32":
        timer = threading.Timer(0.5, os.kill, args=(os.getpid(), signal.SIGTERM))
        timer.start()
        try:
            assert install.run("run") == 0
        finally:
            timer.cancel()

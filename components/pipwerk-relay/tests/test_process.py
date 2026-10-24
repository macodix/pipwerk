"""The relay as a process: a hard stop (SIGKILL) while it works loses nothing (specification E4).

The relay runs as its own process, as the operator starts it. It is stopped without warning in
the middle of a stream of messages and started again; every message reaches the component once.
"""

import signal
import subprocess
import sys
import time
from collections.abc import Callable
from pathlib import Path

import pytest

from tests.installation import Install

pytestmark = pytest.mark.skipif(sys.platform == "win32", reason="signals of POSIX systems")

COUNT = 150
SIZE = 20_000
TIMEOUT = 90.0


def start(install: Install) -> subprocess.Popen[bytes]:
    return subprocess.Popen(  # noqa: S603 - the program is this interpreter with this package
        [sys.executable, "-m", "pipwerk_relay", "-c", str(install.ini), "run"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_for(condition: Callable[[], bool], what: str) -> None:
    deadline = time.monotonic() + TIMEOUT
    while time.monotonic() < deadline:
        if condition():
            return
        time.sleep(0.05)
    raise AssertionError(f"timeout while waiting for {what}")


def delivered(directory: Path) -> int:
    return len(list(directory.glob("*.json")))


def test_a_relay_that_is_killed_in_the_middle_of_its_work_loses_nothing(install: Install) -> None:
    install.prepare()
    sender, _ = install.component("app-a")
    receiver, handler = install.component("app-b")
    payload = bytes(range(256)) * (SIZE // 256)
    sent = [
        sender.send(
            "app-b.net1.relay1",
            "probe.message",
            {"text": f"number {number}"},
            attachments=[("data.bin", payload)],
        ).id
        for number in range(COUNT)
    ]
    out = install.root / "out-app-b"
    first = start(install)
    try:
        wait_for(lambda: delivered(out) > 0, "the first delivery")
        first.kill()  # no chance to finish anything
        first.wait(timeout=30)
    finally:
        if first.poll() is None:
            first.kill()
    assert first.returncode == -signal.SIGKILL
    assert delivered(out) < COUNT  # the relay was in the middle of its work
    second = start(install)

    def everything_arrived() -> bool:
        receiver.poll(handler)
        return len(handler.stored) >= COUNT

    try:
        wait_for(everything_arrived, "all messages")
        time.sleep(1.0)  # a message that would come twice has the time to come
        receiver.poll(handler)
    finally:
        second.send_signal(signal.SIGTERM)
        assert second.wait(timeout=30) == 0  # stopped by request: a clean end
    ids = [item.message.id for item in handler.stored]
    assert sorted(ids) == sorted(sent)  # every message, and each one once
    assert all(item.files == {"data.bin": payload} for item in handler.stored)
    assert install.run("queue") == 0
    sender.close()
    receiver.close()


def test_a_relay_that_is_stopped_by_request_ends_with_exit_code_0(install: Install) -> None:
    install.prepare()
    process = start(install)
    try:
        wait_for(
            lambda: (
                install.log.exists() and "taken over" in install.log.read_text(encoding="utf-8")
            ),
            "the start",
        )
    finally:
        process.send_signal(signal.SIGINT)
    assert process.wait(timeout=30) == 0

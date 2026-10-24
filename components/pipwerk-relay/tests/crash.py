"""A hard stop of the relay at a chosen step, for the tests of the restart (specification E4).

The relay is stopped at every one of its steps that changes something outside of the process:
before and after each call of ``FilesWay.send``, ``FilesWay.acknowledge``, ``RelayStore.accept``,
``RelayStore.replace``, ``RelayStore.reschedule``, ``AttachmentStore.write`` and
``AttachmentStore.remove``. ``SimulatedCrash`` is a ``BaseException``: the relay does not catch
it, as it would not catch a hard stop. A new ``Relay`` on the same files is the restart.
"""

from collections.abc import Callable
from typing import Any

import pytest
from pipwerk_relaycore.ways.files import FilesWay

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.store import RelayStore


class SimulatedCrash(BaseException):
    pass


class CrashPlan:
    """Counts the calls of the relay and stops it at one of them (``crash_at``, 1 based)."""

    def __init__(self, crash_at: int | None = None, *, after: bool = False) -> None:
        self.crash_at = crash_at
        self.after = after
        self.count = 0
        self.armed = False
        self.names: list[str] = []

    def wrap(self, name: str, original: Callable[..., Any]) -> Callable[..., Any]:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not self.armed:
                return original(*args, **kwargs)
            self.count += 1
            number = self.count
            self.names.append(name)
            if self.crash_at == number and not self.after:
                raise SimulatedCrash(name)
            value = original(*args, **kwargs)
            if self.crash_at == number and self.after:
                raise SimulatedCrash(name)
            return value

        return wrapper


def install(monkeypatch: pytest.MonkeyPatch, plan: CrashPlan) -> None:
    """Put the stop points of the plan into the steps of the relay."""
    targets: list[tuple[Any, str]] = [
        (FilesWay, "send"),
        (FilesWay, "acknowledge"),
        (RelayStore, "accept"),
        (RelayStore, "replace"),
        (RelayStore, "reschedule"),
        (AttachmentStore, "write"),
        (AttachmentStore, "remove"),
    ]
    for owner, name in targets:
        monkeypatch.setattr(
            owner, name, plan.wrap(f"{owner.__name__}.{name}", getattr(owner, name))
        )

"""Loading a way by its name (specification 3.4, "ways as extension").

The library knows no way in its code. The name comes from the configuration; the way is found
through the entry point group ``pipwerk_relay.ways``.
"""

import re
from collections.abc import Mapping
from importlib.metadata import entry_points
from typing import Any

from pipwerk_relaycore.errors import WayLoadError
from pipwerk_relaycore.way import WAY_API_VERSION, Way

WAYS_GROUP = "pipwerk_relay.ways"
_WAY_NAME = re.compile(r"[a-z][a-z0-9_-]{0,31}")


def available_ways() -> list[str]:
    """The names of the registered ways, sorted."""
    return sorted({entry.name for entry in entry_points(group=WAYS_GROUP)})


def load_way_class(name: str) -> type[Way[Any]]:
    """The class of the way with this name; raises ``WayLoadError``.

    Two packages that register the same name make the name ambiguous: no way is loaded.
    """
    if not _WAY_NAME.fullmatch(name):
        raise WayLoadError("not a valid name of a way")
    found = entry_points(group=WAYS_GROUP, name=name)
    candidates = {entry.value: entry for entry in found}
    if not candidates:
        raise WayLoadError(f"unknown way '{name}'")
    if len(candidates) > 1:
        raise WayLoadError(f"the name of the way '{name}' is registered more than once")
    entry = next(iter(candidates.values()))
    try:
        loaded = entry.load()
    except Exception:
        raise WayLoadError(f"the way '{name}' cannot be loaded") from None
    if not (isinstance(loaded, type) and issubclass(loaded, Way)):
        raise WayLoadError(f"the entry point of the way '{name}' is not a way")
    if loaded.api_version != WAY_API_VERSION:
        raise WayLoadError(
            f"the way '{name}' implements version {loaded.api_version} of the interface, "
            f"this library supports version {WAY_API_VERSION}"
        )
    return loaded


def load_way(name: str, settings: Mapping[str, object]) -> Way[Any]:
    """Load the way with this name and create it from its own settings.

    Raises ``WayLoadError`` or ``WaySettingsError`` (entries, never values).
    """
    return load_way_class(name).from_settings(name, settings)

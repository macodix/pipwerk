"""Loading and showing the operating configuration (``config load``, ``config show``).

``load_configuration`` rejects an invalid document as a whole: it checks the document against
the models, loads every way it names (with its own settings) and every key file, and only then
stores it as the new version. A running relay takes it over without a restart
(``Relay.cycle``).
"""

from datetime import datetime

from pipwerk_relaycore import SecretsDirectory

from pipwerk_relay.errors import NotConfigured
from pipwerk_relay.operating import parse_config, pretty_config, render_config
from pipwerk_relay.runtime import build_runtime
from pipwerk_relay.store import RelayStore


def load_configuration(
    store: RelayStore, secrets: SecretsDirectory, document: str | bytes, now: datetime
) -> int:
    """Check a document and store it; the new version number. Raises ``ConfigRejected``."""
    config = parse_config(document)
    build_runtime(config, 0, secrets)  # loads the ways and the keys: raises on any problem
    return store.put_config(render_config(config), now)


def show_configuration(store: RelayStore) -> str:
    """The operating configuration in use as indented JSON; raises ``NotConfigured``."""
    stored = store.get_config()
    if stored is None:
        raise NotConfigured("no operating configuration is loaded")
    return pretty_config(stored.document)

"""Alembic environment of the tables of the relay.

The migrations run on a connection that ``pipwerk_relaycore.migrate_scripts`` passes in
``config.attributes["connection"]``. The database comes from the caller only; there is no
Alembic configuration file with a fixed address. The version table has its own name. Offline
mode (SQL scripts) is not supported.
"""

from alembic import context

from pipwerk_relay.tables import VERSION_TABLE

config = context.config

if context.is_offline_mode():
    raise RuntimeError("The migrations of the relay cannot run in offline mode.")

connection = config.attributes.get("connection")
if connection is None:
    raise RuntimeError("The migrations of the relay need a connection from the caller.")

context.configure(connection=connection, target_metadata=None, version_table=VERSION_TABLE)

with context.begin_transaction():
    context.run_migrations()

"""Alembic environment of the data store.

The migrations run on a connection that ``pipwerk_marketdata.migrate`` passes in
``config.attributes["connection"]``. The database comes from the caller only; there is no
Alembic configuration file with a fixed address. The version table has its own name, so the
migrations of the caller and of this library do not disturb each other. Offline mode (SQL
scripts) is not supported.
"""

from alembic import context

from pipwerk_marketdata.tables import VERSION_TABLE

config = context.config

if context.is_offline_mode():
    raise RuntimeError("The market data migrations cannot run in offline mode.")

connection = config.attributes.get("connection")
if connection is None:
    raise RuntimeError("The market data migrations need a connection from the caller.")

context.configure(connection=connection, target_metadata=None, version_table=VERSION_TABLE)

with context.begin_transaction():
    context.run_migrations()

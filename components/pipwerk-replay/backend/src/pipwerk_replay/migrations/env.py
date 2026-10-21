"""Alembic environment of pipwerk replay.

The migrations run on a connection that ``pipwerk_replay.migrate`` passes in
``config.attributes["connection"]``. The database URL therefore comes from the
startup configuration only; there is no Alembic configuration file with a fixed
URL. Offline mode (SQL scripts) is not supported.
"""

from alembic import context

config = context.config

if context.is_offline_mode():
    raise RuntimeError("The pipwerk replay migrations cannot run in offline mode.")

connection = config.attributes.get("connection")
if connection is None:
    raise RuntimeError("The pipwerk replay migrations need a connection from the application.")

context.configure(connection=connection, target_metadata=None)

with context.begin_transaction():
    context.run_migrations()

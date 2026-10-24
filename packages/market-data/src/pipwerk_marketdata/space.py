"""Giving the free space of the database back to the file system (specification 5.6).

After deleting (5.5) and replacing, the pages of the deleted rows are free but a SQLite file
does not become smaller by itself. The data store returns the space as follows (reasons in the
technical documentation, section "Platz der Datenbank"):

- ``enable_space_return`` sets ``auto_vacuum`` of a SQLite file to ``INCREMENTAL``. A file that
  has another mode is converted once with ``VACUUM`` (the setting takes effect only with it).
  The caller runs it once at startup, after the migrations.
- ``return_space`` frees the free pages in steps of ``PAGES_PER_STEP`` pages
  (``PRAGMA incremental_vacuum(N)``). Every step is a short transaction of its own, so a
  reader or writer waits at most for one step, not for the whole run, and the work of a large
  stock needs no second copy of the file. The file ends smaller (journal mode ``DELETE``).

Both do nothing for a database that is not a SQLite file: a database in memory has no file, and
the server databases return the space by their own means.
"""

import logging

from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

#: ``PRAGMA auto_vacuum`` value for the mode ``INCREMENTAL``.
AUTO_VACUUM_INCREMENTAL = 2

#: Pages that one step of ``return_space`` frees (4 KiB each with the default page size).
PAGES_PER_STEP = 4096


def _is_sqlite_file(engine: Engine) -> bool:
    url = engine.url
    if url.get_backend_name() != "sqlite":
        return False
    database = url.database
    return not (
        database in (None, "", ":memory:")
        or url.query.get("mode") == "memory"
        or str(database).startswith("file::memory:")
    )


def _pragma(connection: Connection, statement: str) -> int | None:
    """Run a ``PRAGMA`` and read its whole answer (a step of ``incremental_vacuum`` is done
    while the answer is read). The first value of the first row, if any."""
    result = connection.exec_driver_sql(statement)
    if not result.returns_rows:
        return None
    first = result.fetchone()
    result.fetchall()
    return None if first is None else int(first[0])


def enable_space_return(engine: Engine) -> bool:
    """Make the database of ``engine`` able to return free space. Returns whether a ``VACUUM``
    was needed to convert the file (a file that is already in the mode ``INCREMENTAL``, a new
    file and every database that is no SQLite file need none).

    The conversion rewrites the whole file once and needs free space of about the size of the
    file for the copy while it runs. No other transaction may be open at that time."""
    if not _is_sqlite_file(engine):
        return False
    with engine.connect() as connection:
        connection = connection.execution_options(isolation_level="AUTOCOMMIT")
        if _pragma(connection, "PRAGMA auto_vacuum") == AUTO_VACUUM_INCREMENTAL:
            return False
        _pragma(connection, f"PRAGMA auto_vacuum = {AUTO_VACUUM_INCREMENTAL}")
        connection.exec_driver_sql("VACUUM")
        return True


def return_space(engine: Engine) -> None:
    """Return the free pages of the database to the file system, in steps (see the module
    description). A failure is logged and does not raise: the data were deleted or replaced in
    a transaction that is complete, and the next call frees the space then."""
    if not _is_sqlite_file(engine):
        return
    try:
        with engine.connect() as connection:
            connection = connection.execution_options(isolation_level="AUTOCOMMIT")
            if _pragma(connection, "PRAGMA auto_vacuum") != AUTO_VACUUM_INCREMENTAL:
                return
            while (_pragma(connection, "PRAGMA freelist_count") or 0) > 0:
                _pragma(connection, f"PRAGMA incremental_vacuum({PAGES_PER_STEP})")
    except SQLAlchemyError as error:
        logger.warning(
            "The free space of the database was not returned (%s).", type(error).__name__
        )

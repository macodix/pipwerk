"""Tests for the Studio settings service."""

from pathlib import Path
from typing import Any, cast

from sqlalchemy.orm import Session, sessionmaker

from pipwerk_studio.settings_service import SettingsService
from pipwerk_studio.storage import (
    SETTINGS_SINGLETON_ID,
    StudioSettingsRecord,
    create_session_factory,
    create_studio_engine,
)


class RaceSession(Session):
    """Session that hides an already stored row on the first lookup.

    This simulates a concurrent first write: the row does not exist when
    this request looks for it, but exists when it tries to insert it.
    """

    hide_first_lookup = True

    def get(self, *args: Any, **kwargs: Any) -> Any:
        if RaceSession.hide_first_lookup:
            RaceSession.hide_first_lookup = False
            return None
        return super().get(*args, **kwargs)


def test_lost_race_on_first_write_falls_back_to_update(tmp_path: Path) -> None:
    engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")
    plain_factory = create_session_factory(engine)
    with plain_factory() as session:
        session.add(StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language="de"))
        session.commit()

    RaceSession.hide_first_lookup = True
    racing_factory = cast(
        sessionmaker[Session],
        sessionmaker(bind=engine, class_=RaceSession, expire_on_commit=False),
    )

    result = SettingsService(racing_factory).set_language("en")

    assert result == "en"
    assert SettingsService(plain_factory).get_language() == "en"
    with plain_factory() as session:
        assert session.query(StudioSettingsRecord).count() == 1

from pathlib import Path

import pytest
from sqlalchemy import Engine

from pipwerk_marketdata import MarketDataStore
from tests.helpers import make_engine


@pytest.fixture
def engine(tmp_path: Path) -> Engine:
    return make_engine(tmp_path)


@pytest.fixture
def store(engine: Engine) -> MarketDataStore:
    return MarketDataStore(engine, max_page_size=100)

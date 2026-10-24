"""Fixtures of the tests of pipwerk relay."""

from collections.abc import Iterator
from pathlib import Path

import pytest

from tests.installation import Install, make_install
from tests.support import World


@pytest.fixture
def world(tmp_path: Path) -> Iterator[World]:
    world = World(tmp_path)
    yield world
    world.close()


@pytest.fixture
def install(tmp_path: Path) -> Install:
    return make_install(tmp_path)

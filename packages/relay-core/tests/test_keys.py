"""Keys of connections and the directory for secrets (specification E5, E6, 7)."""

import os
import stat
import sys
from pathlib import Path

import pytest

from pipwerk_relaycore import (
    ConnectionKey,
    KeyFileError,
    SecretsAccessError,
    SecretsDirectory,
)

posix_only = pytest.mark.skipif(sys.platform == "win32", reason="rights of POSIX systems")


@pytest.fixture
def secrets_path(tmp_path: Path) -> Path:
    path = tmp_path / "secrets"
    path.mkdir(mode=0o700)
    path.chmod(0o700)
    return path


def test_a_new_key_comes_from_the_secure_random_source() -> None:
    first, second = ConnectionKey.generate(), ConnectionKey.generate()
    assert first != second
    assert len(first.to_file_text()) == 65


def test_a_new_key_file_can_be_loaded_again(secrets_path: Path) -> None:
    directory = SecretsDirectory(secrets_path)
    key = directory.new_key("link-a.key")
    assert directory.load_key("link-a.key") == key
    text = (secrets_path / "link-a.key").read_text(encoding="ascii")
    assert len(text) == 65
    assert text.endswith("\n")
    directory.check()


@posix_only
def test_a_new_key_file_is_readable_for_the_owner_only(secrets_path: Path) -> None:
    SecretsDirectory(secrets_path).new_key("link-a.key")
    mode = stat.S_IMODE((secrets_path / "link-a.key").stat().st_mode)
    assert mode == 0o600


def test_an_existing_key_file_is_never_overwritten(secrets_path: Path) -> None:
    directory = SecretsDirectory(secrets_path)
    key = directory.new_key("link-a.key")
    with pytest.raises(KeyFileError, match="exists already"):
        directory.new_key("link-a.key")
    assert directory.load_key("link-a.key") == key


@pytest.mark.parametrize("name", ["", ".hidden", "../x", "a/b", "a\\b", "a b", "x" * 129, "a\n"])
def test_the_name_of_a_key_file_is_a_file_name_only(secrets_path: Path, name: str) -> None:
    directory = SecretsDirectory(secrets_path)
    with pytest.raises(KeyFileError):
        directory.new_key(name)
    with pytest.raises(KeyFileError):
        directory.load_key(name)


def test_a_missing_key_file_is_reported_by_name(secrets_path: Path) -> None:
    with pytest.raises(KeyFileError, match="does not exist"):
        SecretsDirectory(secrets_path).load_key("none.key")


@pytest.mark.parametrize(
    "content",
    ["", "zz" * 32, "00" * 31, "0" * 63, "AB" * 32, "00" * 2100, "ä" * 40],
)
def test_a_file_without_a_valid_key_is_refused(secrets_path: Path, content: str) -> None:
    path = secrets_path / "bad.key"
    path.write_bytes(content.encode())
    path.chmod(0o600)
    with pytest.raises(KeyFileError) as raised:
        SecretsDirectory(secrets_path).load_key("bad.key")
    assert content[:8] not in str(raised.value) or content == ""


@posix_only
def test_a_key_file_that_others_can_read_is_refused(secrets_path: Path) -> None:
    directory = SecretsDirectory(secrets_path)
    directory.new_key("link-a.key")
    path = secrets_path / "link-a.key"
    for mode in (0o640, 0o604, 0o660, 0o666, 0o700):
        path.chmod(mode)
        with pytest.raises(SecretsAccessError):
            directory.load_key("link-a.key")
        with pytest.raises(SecretsAccessError):
            directory.check()
    path.chmod(0o400)
    directory.load_key("link-a.key")


@posix_only
def test_a_directory_that_others_can_enter_is_refused(secrets_path: Path) -> None:
    directory = SecretsDirectory(secrets_path)
    directory.new_key("link-a.key")
    for mode in (0o750, 0o705, 0o755, 0o777):
        secrets_path.chmod(mode)
        with pytest.raises(SecretsAccessError):
            directory.check()
        with pytest.raises(SecretsAccessError):
            directory.load_key("link-a.key")
        with pytest.raises(SecretsAccessError):
            directory.new_key("link-b.key")
    secrets_path.chmod(0o700)
    directory.check()


@posix_only
def test_a_link_in_place_of_a_key_file_is_refused(secrets_path: Path, tmp_path: Path) -> None:
    target = tmp_path / "outside.key"
    target.write_text("00" * 32 + "\n", encoding="ascii")
    target.chmod(0o600)
    (secrets_path / "link-a.key").symlink_to(target)
    with pytest.raises(SecretsAccessError):
        SecretsDirectory(secrets_path).load_key("link-a.key")
    with pytest.raises(SecretsAccessError):
        SecretsDirectory(secrets_path).check()


@posix_only
def test_a_subdirectory_that_others_can_enter_is_found_by_the_check(secrets_path: Path) -> None:
    (secrets_path / "sub").mkdir()
    (secrets_path / "sub").chmod(0o755)
    with pytest.raises(SecretsAccessError):
        SecretsDirectory(secrets_path).check()


def test_a_missing_directory_is_refused(tmp_path: Path) -> None:
    directory = SecretsDirectory(tmp_path / "missing")
    with pytest.raises(SecretsAccessError):
        directory.check()
    with pytest.raises(SecretsAccessError):
        directory.new_key("link-a.key")


def test_a_file_in_place_of_the_directory_is_refused(tmp_path: Path) -> None:
    path = tmp_path / "file"
    path.write_text("x", encoding="ascii")
    path.chmod(0o700)
    with pytest.raises(SecretsAccessError):
        SecretsDirectory(path).check()


def test_a_key_does_not_show_in_text_or_representation() -> None:
    key = ConnectionKey(bytes(range(32)))
    secret = bytes(range(32)).hex()
    assert secret not in repr(key)
    assert secret not in str(key)
    assert secret not in f"{key!r} {key}"


def test_a_key_is_not_hashable() -> None:
    with pytest.raises(TypeError):
        hash(ConnectionKey.generate())


@posix_only
def test_the_umask_cannot_widen_the_rights_of_a_new_key(secrets_path: Path) -> None:
    old = os.umask(0)
    try:
        SecretsDirectory(secrets_path).new_key("link-a.key")
    finally:
        os.umask(old)
    assert stat.S_IMODE((secrets_path / "link-a.key").stat().st_mode) == 0o600

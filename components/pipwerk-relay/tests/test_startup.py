"""The startup configuration pipwerk-relay.ini (req-system-016, req-system-017)."""

import sys
from pathlib import Path

import pytest

from pipwerk_relay.errors import StartupConfigError
from pipwerk_relay.startup import (
    ALLOWED_OPTIONS,
    CONFIG_FILE_NAME,
    default_search_locations,
    load_startup_config,
)

MINIMAL = """\
[database]
url = sqlite:///relay.db
[storage]
attachments_directory = attachments
[secrets]
directory = secrets
"""


def write(directory: Path, text: str, name: str = CONFIG_FILE_NAME) -> Path:
    path = directory / name
    path.write_text(text, encoding="utf-8")
    return path


def test_a_minimal_file_is_read_with_the_defaults(tmp_path: Path) -> None:
    config = load_startup_config(write(tmp_path, MINIMAL))
    assert config.database_url.get_backend_name() == "sqlite"
    assert config.attachments_directory == Path("attachments")
    assert config.secrets_directory == Path("secrets")
    assert config.log_level == "INFO"
    assert config.log_file is None


def test_the_log_can_be_set(tmp_path: Path) -> None:
    text = MINIMAL + "[log]\nlevel = warning\nfile = relay.log\n"
    config = load_startup_config(write(tmp_path, text))
    assert (config.log_level, config.log_file) == ("WARNING", Path("relay.log"))


@pytest.mark.parametrize(
    "missing",
    [
        "[database]\nurl = sqlite:///relay.db\n",
        "[storage]\nattachments_directory = attachments\n",
        "[secrets]\ndirectory = secrets\n",
    ],
)
def test_every_required_entry_is_required(tmp_path: Path, missing: str) -> None:
    text = MINIMAL.replace(missing, "")
    with pytest.raises(StartupConfigError, match="missing the entry"):
        load_startup_config(write(tmp_path, text))


def test_a_missing_entry_is_named(tmp_path: Path) -> None:
    text = "[database]\nurl = sqlite:///x.db\n[storage]\n[secrets]\ndirectory = s\n"
    with pytest.raises(StartupConfigError, match="attachments_directory"):
        load_startup_config(write(tmp_path, text))


def test_an_unknown_section_or_entry_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match="unknown section"):
        load_startup_config(write(tmp_path, MINIMAL + "[web]\nport = 80\n"))
    with pytest.raises(StartupConfigError, match="unknown entry 'port'"):
        load_startup_config(write(tmp_path, MINIMAL + "[log]\nport = 80\n"))
    with pytest.raises(StartupConfigError, match="unknown entry 'verbose'"):
        load_startup_config(write(tmp_path, MINIMAL.replace("[storage]", "[storage]\nverbose = 1")))


def test_the_operating_configuration_is_no_part_of_the_startup_configuration(
    tmp_path: Path,
) -> None:
    with pytest.raises(StartupConfigError, match="unknown section"):
        load_startup_config(write(tmp_path, MINIMAL + "[relay]\nname = r1\n"))


def test_an_invalid_level_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match="level"):
        load_startup_config(write(tmp_path, MINIMAL + "[log]\nlevel = loud\n"))


def test_an_invalid_url_is_rejected_without_quoting_it(tmp_path: Path) -> None:
    text = MINIMAL.replace("sqlite:///relay.db", "not a url SECRET-PASSWORD")
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(write(tmp_path, text))
    assert "SECRET-PASSWORD" not in str(error.value)


def test_a_syntax_error_names_the_line_not_its_text(tmp_path: Path) -> None:
    text = MINIMAL + "this line has no equals sign SECRET-PASSWORD\n"
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(write(tmp_path, text))
    assert "SECRET-PASSWORD" not in str(error.value)
    assert "line" in str(error.value)


def test_the_url_with_a_password_is_not_shown_by_the_object(tmp_path: Path) -> None:
    text = MINIMAL.replace("sqlite:///relay.db", "postgresql://user:SECRET-PASSWORD@host/db")
    config = load_startup_config(write(tmp_path, text))
    assert "SECRET-PASSWORD" not in repr(config)
    assert "SECRET-PASSWORD" not in str(config)


def test_a_percent_sign_is_a_normal_character(tmp_path: Path) -> None:
    text = MINIMAL.replace("directory = secrets", "directory = se%crets")
    assert load_startup_config(write(tmp_path, text)).secrets_directory == Path("se%crets")


def test_a_file_that_is_not_text_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / CONFIG_FILE_NAME
    path.write_bytes(b"\xff\xfe\x00")
    with pytest.raises(StartupConfigError, match="could not be read"):
        load_startup_config(path)


def test_an_explicit_file_that_is_missing_is_an_error(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match="not found"):
        load_startup_config(tmp_path / "nothing.ini")


@pytest.mark.skipif(sys.platform == "win32", reason="search locations of POSIX systems")
def test_without_a_file_the_search_locations_are_named(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(None)
    assert "does not start without one" in str(error.value)
    assert str(tmp_path / "pipwerk" / "etc" / CONFIG_FILE_NAME) in str(error.value)


@pytest.mark.skipif(sys.platform == "win32", reason="search locations of POSIX systems")
def test_the_first_file_in_the_search_order_is_used_and_nothing_is_merged(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    (tmp_path / ".config" / "pipwerk").mkdir(parents=True)
    (tmp_path / "pipwerk" / "etc").mkdir(parents=True)
    write(tmp_path / ".config" / "pipwerk", MINIMAL.replace("= secrets", "= second"))
    write(tmp_path / "pipwerk" / "etc", MINIMAL.replace("= secrets", "= first"))
    assert load_startup_config(None).secrets_directory == Path("first")
    assert default_search_locations()[0] == tmp_path / "pipwerk" / "etc" / CONFIG_FILE_NAME


EXAMPLE = Path(__file__).resolve().parents[1] / "pipwerk-relay.example.ini"


def test_the_example_is_valid_when_the_required_entries_are_filled_in(tmp_path: Path) -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    for entry, value in (
        ("url", "sqlite:///relay.db"),
        ("attachments_directory", "attachments"),
        ("directory", "secrets"),
    ):
        assert f"\n{entry} =\n" in text  # required and empty in the example
        text = text.replace(f"\n{entry} =\n", f"\n{entry} = {value}\n")
    config = load_startup_config(write(tmp_path, text))
    assert config.log_level == "INFO"


def test_the_example_names_every_entry_the_program_knows() -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    for section, entries in ALLOWED_OPTIONS.items():
        assert f"[{section}]" in text
        for entry in entries:
            assert f"\n{entry} =" in text or f"\n# {entry} =" in text


def test_a_relative_environment_variable_is_not_a_search_location(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("HOME", "relative/home")
    assert all(location.is_absolute() for location in default_search_locations())

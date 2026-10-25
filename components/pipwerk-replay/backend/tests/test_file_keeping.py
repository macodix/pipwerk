"""Tests of the unique names of kept files: nothing existing is ever replaced (5.3, 5.6, 5.7, 11).

They run against the real backend (``create_app`` and its web API); the unit tests at the end
test the functions that choose the names."""

from __future__ import annotations

import ast
import os
import sys
import threading
from collections.abc import Callable
from functools import partial
from pathlib import Path
from typing import Any

import pytest
from datastock import begin, candles_json, upload_file
from pydantic import ValidationError
from test_import_directory import (
    DIRECTORY_PREVIEW,
    LISTING,
    SETTINGS,
    Env,
    snapshot,
)

from pipwerk_replay import file_keeping, marketdata_models
from pipwerk_replay.file_keeping import (
    MAX_NAME_ATTEMPTS,
    TEMPORARY_PREFIX,
    TEMPORARY_SUFFIX,
    KeepFailedError,
    candidate_name,
    keep_file,
)
from pipwerk_replay.import_directory import list_directory

NOT_JSON = b"not json at all"
needs_links = pytest.mark.skipif(sys.platform == "win32", reason="symbolic links need privileges")


@pytest.fixture
def env(tmp_path: Path) -> Env:
    return Env(tmp_path)


def keep(env: Env, name: str, content: bytes = NOT_JSON, *, process: str | None = None) -> Any:
    """Upload ``content`` as ``name`` with the box "Dateien behalten"; the answer as JSON."""
    response = upload_file(env.client, process or begin(env.client), name, content, keep="true")
    assert response.status_code == 200, response.text
    return response.json()


def put_settings(env: Env, storage: Path, imports: Path) -> None:
    response = env.client.put(
        SETTINGS,
        json={
            "keep_imported_files": False,
            "storage_directory": str(storage),
            "import_directory": str(imports),
            "export_directory": None,
        },
    )
    assert response.status_code == 200, response.text


# --- numbers ---------------------------------------------------------------------------------


def test_the_second_and_the_third_file_of_a_name_get_the_numbers_2_and_3(env: Env) -> None:
    process = begin(env.client)
    first = keep(env, "EURUSD_M1.csv", b"one", process=process)
    second = keep(env, "EURUSD_M1.csv", b"two", process=process)
    third = keep(env, "EURUSD_M1.csv", b"three", process=process)

    assert [item["kept_as"] for item in (first, second, third)] == [
        "EURUSD_M1.csv",
        "EURUSD_M1 (2).csv",
        "EURUSD_M1 (3).csv",
    ]
    assert (env.storage / "EURUSD_M1.csv").read_bytes() == b"one"
    assert (env.storage / "EURUSD_M1 (2).csv").read_bytes() == b"two"
    assert (env.storage / "EURUSD_M1 (3).csv").read_bytes() == b"three"
    assert [item["name"] for item in (first, second, third)] == ["EURUSD_M1.csv"] * 3
    assert all(item["kept"] is True for item in (first, second, third))


def test_an_existing_file_stays_byte_for_byte_unchanged(env: Env) -> None:
    env.storage.mkdir(exist_ok=True)
    original = bytes(range(256)) * 3
    path = env.storage / "x.csv"
    path.write_bytes(original)
    before = path.stat()

    answer = keep(env, "x.csv", b"new content")

    after = path.stat()
    assert path.read_bytes() == original
    assert (after.st_mtime_ns, after.st_size, after.st_ino) == (
        before.st_mtime_ns,
        before.st_size,
        before.st_ino,
    )
    assert answer["kept_as"] == "x (2).csv"
    assert (env.storage / "x (2).csv").read_bytes() == b"new content"


def test_the_smallest_free_number_is_taken_also_if_the_name_with_a_number_exists(
    env: Env,
) -> None:
    env.storage.mkdir(exist_ok=True)
    for name in ("x.csv", "x (2).csv", "x (4).csv"):
        (env.storage / name).write_bytes(name.encode())

    third = keep(env, "x.csv")
    fifth = keep(env, "x.csv")

    assert (third["kept_as"], fifth["kept_as"]) == ("x (3).csv", "x (5).csv")
    assert (env.storage / "x (2).csv").read_bytes() == b"x (2).csv"
    assert (env.storage / "x (4).csv").read_bytes() == b"x (4).csv"


def test_a_free_name_is_kept_even_if_names_with_numbers_exist(env: Env) -> None:
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x (2).csv").write_bytes(b"other")

    answer = keep(env, "x.csv")

    assert answer["kept_as"] == "x.csv"


def test_a_name_that_already_has_a_number_in_brackets_gets_a_further_one(env: Env) -> None:
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x (2).csv").write_bytes(b"taken")

    answer = keep(env, "x (2).csv")

    assert answer["kept_as"] == "x (2) (2).csv"
    assert (env.storage / "x (2).csv").read_bytes() == b"taken"


@pytest.mark.parametrize(
    ("name", "second"),
    [
        ("README", "README (2)"),  # without extension the number stands at the end
        (".hidden", ".hidden (2)"),  # a period at the start does not count
        (".hidden.json", ".hidden (2).json"),
        ("archive.tar.gz", "archive.tar (2).gz"),  # the extension begins at the last period
        ("a.b.c.csv", "a.b.c (2).csv"),
        ("trailing.", "trailing (2)."),
        ("Ünïcode ✓.csv", "Ünïcode ✓ (2).csv"),
    ],
)
def test_the_number_stands_before_the_extension(env: Env, name: str, second: str) -> None:
    process = begin(env.client)
    first = keep(env, name, b"1", process=process)
    again = keep(env, name, b"2", process=process)

    assert (first["kept_as"], again["kept_as"]) == (name, second)
    assert (env.storage / name).read_bytes() == b"1"
    assert (env.storage / second).read_bytes() == b"2"


# --- names that are taken in other ways -----------------------------------------------------


def test_a_directory_of_the_name_is_not_touched(env: Env) -> None:
    (env.storage / "x.csv").mkdir(parents=True)
    (env.storage / "x.csv" / "inside.txt").write_bytes(b"inside")
    before = snapshot(env.storage)

    answer = keep(env, "x.csv", b"data")

    assert answer["kept_as"] == "x (2).csv"
    after = snapshot(env.storage)
    assert {key: after[key] for key in before} == before
    assert set(after) - set(before) == {"x (2).csv"}


@needs_links
def test_a_link_to_a_file_outside_is_not_followed_and_nothing_outside_changes(
    env: Env, tmp_path: Path
) -> None:
    outside = tmp_path / "outside.txt"
    outside.write_bytes(b"outside")
    before = outside.stat()
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x.csv").symlink_to(outside)

    answer = keep(env, "x.csv", b"data")

    assert answer["kept_as"] == "x (2).csv"
    assert outside.read_bytes() == b"outside"
    assert outside.stat().st_mtime_ns == before.st_mtime_ns
    assert (env.storage / "x.csv").is_symlink()
    assert (env.storage / "x (2).csv").read_bytes() == b"data"
    assert not (env.storage / "x (2).csv").is_symlink()


@needs_links
def test_a_dangling_link_counts_as_taken_and_its_target_is_not_created(
    env: Env, tmp_path: Path
) -> None:
    target = tmp_path / "does-not-exist.txt"
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x.csv").symlink_to(target)

    answer = keep(env, "x.csv", b"data")

    assert answer["kept_as"] == "x (2).csv"
    assert not target.exists()
    assert (env.storage / "x.csv").is_symlink()


@needs_links
def test_a_link_to_a_directory_outside_is_not_followed(env: Env, tmp_path: Path) -> None:
    outside = tmp_path / "outside-directory"
    outside.mkdir()
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x.csv").symlink_to(outside, target_is_directory=True)

    answer = keep(env, "x.csv", b"data")

    assert answer["kept_as"] == "x (2).csv"
    assert list(outside.iterdir()) == []


@needs_links
def test_a_dangling_link_with_the_next_number_is_skipped_too(env: Env, tmp_path: Path) -> None:
    env.storage.mkdir(exist_ok=True)
    (env.storage / "x.csv").write_bytes(b"taken")
    (env.storage / "x (2).csv").symlink_to(tmp_path / "nowhere")

    answer = keep(env, "x.csv")

    assert answer["kept_as"] == "x (3).csv"
    assert not (tmp_path / "nowhere").exists()


# --- concurrency and races -------------------------------------------------------------------


def run_together(jobs: list[Callable[[], Any]]) -> list[Any]:
    """Run the jobs in threads that start at the same moment; the results in the order of the
    jobs."""
    barrier = threading.Barrier(len(jobs))
    results: list[Any] = [None] * len(jobs)

    def run(index: int, job: Callable[[], Any]) -> None:
        barrier.wait()
        results[index] = job()

    threads = [threading.Thread(target=run, args=(index, job)) for index, job in enumerate(jobs)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=120)
    return results


def upload_kept(env: Env, process: str, index: int) -> Any:
    """Upload ``same.csv`` with the box; tries again while too many imports run at once (429)."""
    for _ in range(500):
        response = upload_file(
            env.client, process, "same.csv", f"content {index}".encode(), keep="true"
        )
        if response.status_code != 429:
            return response
    raise AssertionError("the import was refused again and again")


def check_all_kept(directory: Path, kept_as: list[str], count: int) -> None:
    assert len(set(kept_as)) == count, kept_as
    # every file exists with its own content, and nothing else (no intermediate file)
    assert sorted(item.name for item in directory.iterdir()) == sorted(kept_as)
    assert sorted(path.read_bytes() for path in directory.iterdir()) == sorted(
        f"content {index}".encode() for index in range(count)
    )


def test_simultaneous_requests_with_the_same_name_all_keep_their_file(env: Env) -> None:
    count, rounds = 6, 15
    for round_number in range(rounds):
        directory = env.storage / f"round-{round_number}"
        put_settings(env, directory, env.imports)
        processes = [begin(env.client) for _ in range(count)]

        answers = run_together(
            [partial(upload_kept, env, process, index) for index, process in enumerate(processes)]
        )

        assert [answer.status_code for answer in answers] == [200] * count
        check_all_kept(directory, [answer.json()["kept_as"] for answer in answers], count)


def test_simultaneous_writes_of_the_same_name_without_the_limit_of_imports(
    tmp_path: Path,
) -> None:
    count = 16
    for round_number in range(25):
        directory = tmp_path / f"round-{round_number}"
        names = run_together(
            [
                partial(keep_file, directory, "same.csv", f"content {index}".encode())
                for index in range(count)
            ]
        )

        check_all_kept(directory, names, count)


def test_a_name_taken_between_the_choice_and_the_creation_gets_the_next_number(
    env: Env, monkeypatch: pytest.MonkeyPatch
) -> None:
    env.storage.mkdir(exist_ok=True)
    real_taken = file_keeping._taken
    calls: list[Path] = []

    def hooked(path: Path) -> bool:
        free = not real_taken(path)
        calls.append(path)
        if free and len(calls) == 1:
            # Another request takes the chosen name after the check, before the link.
            path.write_bytes(b"the other request")
        return not free

    monkeypatch.setattr(file_keeping, "_taken", hooked)

    answer = keep(env, "x.csv", b"mine")

    assert (env.storage / "x.csv").read_bytes() == b"the other request"
    assert (env.storage / "x (2).csv").read_bytes() == b"mine"
    assert answer["kept_as"] == "x (2).csv"
    assert [item.name for item in env.storage.iterdir() if item.name.startswith(".")] == []


def test_at_the_limit_of_attempts_the_file_is_not_kept_and_not_imported(
    env: Env, monkeypatch: pytest.MonkeyPatch
) -> None:
    attempts: list[Path] = []

    def always_taken(source: Any, target: Any) -> None:
        attempts.append(Path(target))
        raise FileExistsError

    monkeypatch.setattr("pipwerk_replay.file_keeping.os.link", always_taken)
    process = begin(env.client)

    response = upload_file(env.client, process, "x.json", candles_json(2), keep="true")

    assert response.status_code == 503
    assert len(attempts) == MAX_NAME_ATTEMPTS
    assert len({path.name for path in attempts}) == MAX_NAME_ATTEMPTS  # a new number each time
    assert env.stored_names() == []
    assert env.series() == []


def test_a_failing_link_leaves_no_intermediate_file_and_no_other_file(
    env: Env, monkeypatch: pytest.MonkeyPatch
) -> None:
    def refuse(source: Any, target: Any) -> None:
        raise PermissionError

    monkeypatch.setattr("pipwerk_replay.file_keeping.os.link", refuse)

    response = upload_file(env.client, begin(env.client), "x.json", b"{}", keep="true")

    assert response.status_code == 503
    assert env.stored_names() == []


def test_a_kill_signal_while_naming_removes_the_intermediate_file(
    env: Env, monkeypatch: pytest.MonkeyPatch
) -> None:
    def interrupted(source: Any, target: Any) -> None:
        raise KeyboardInterrupt

    monkeypatch.setattr("pipwerk_replay.file_keeping.os.link", interrupted)
    env.storage.mkdir(exist_ok=True)

    with pytest.raises(KeyboardInterrupt):
        keep_file(env.storage, "x.json", b"{}")

    assert list(env.storage.iterdir()) == []


def test_no_replacing_call_occurs_in_the_module_that_keeps_files() -> None:
    source = Path(file_keeping.__file__).read_text(encoding="utf-8")
    called = {
        node.func.attr
        for node in ast.walk(ast.parse(source))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
    }
    assert not called & {"replace", "rename", "renames", "move", "copy", "copyfile", "copy2"}


# --- too long names --------------------------------------------------------------------------


def maximum_name_bytes(directory: Path) -> int:
    return int(os.pathconf(directory, "PC_NAME_MAX")) if hasattr(os, "pathconf") else 255


@pytest.mark.skipif(sys.platform == "win32", reason="the limit is counted in bytes here")
def test_a_name_that_is_too_long_with_the_number_is_shortened_before_the_number(
    env: Env,
) -> None:
    env.storage.mkdir(exist_ok=True)
    limit = maximum_name_bytes(env.storage)
    name = "a" * (limit - len(".csv")) + ".csv"  # exactly as long as the file system allows

    first = keep(env, name, b"1")
    second = keep(env, name, b"2")
    third = keep(env, name, b"3")

    assert first["kept_as"] == name
    assert second["kept_as"].endswith(" (2).csv") and third["kept_as"].endswith(" (3).csv")
    for answer in (second, third):
        assert len(answer["kept_as"].encode()) <= limit
        assert set(answer["kept_as"][: -len(" (2).csv")]) == {"a"}
    assert (env.storage / name).read_bytes() == b"1"
    assert (env.storage / second["kept_as"]).read_bytes() == b"2"
    assert (env.storage / third["kept_as"]).read_bytes() == b"3"


@pytest.mark.skipif(sys.platform == "win32", reason="the limit is counted in bytes here")
def test_a_name_is_never_cut_in_the_middle_of_a_character(env: Env) -> None:
    env.storage.mkdir(exist_ok=True)
    limit = maximum_name_bytes(env.storage)
    name = "ä" * 127 + ".csv"  # 127 characters, more than the limit in bytes with the extension
    assert len(name.encode()) > limit

    answer = keep(env, name, b"1")
    again = keep(env, name, b"2")

    for item in (answer, again):
        kept = item["kept_as"]
        assert len(kept.encode()) <= limit
        assert kept.encode().decode("utf-8") == kept  # complete characters only
        assert (env.storage / kept).exists()
    assert answer["kept_as"] != again["kept_as"]
    assert again["kept_as"].endswith(" (2).csv")
    assert len(list(env.storage.iterdir())) == 2


def test_the_candidate_names_are_shortened_by_whole_characters() -> None:
    assert candidate_name("äöü.csv", 2, 255) == "äöü (2).csv"
    # 3 characters of 2 bytes, " (2)" 4 bytes, ".csv" 4 bytes: 14; limit 12 leaves 2 characters
    assert candidate_name("äöü.csv", 2, 12) == "äö (2).csv"
    assert candidate_name("äöü.csv", 1, 8) == "äö.csv"
    assert candidate_name("äöü.csv", 1, 7) == "ä.csv"  # not "ä" plus half a character
    assert candidate_name("README", 3, 255) == "README (3)"
    assert candidate_name(".hidden", 2, 255) == ".hidden (2)"


def test_a_name_whose_extension_alone_is_too_long_is_not_kept() -> None:
    with pytest.raises(KeepFailedError):
        candidate_name("a." + "b" * 300, 2, 255)
    with pytest.raises(KeepFailedError):
        candidate_name("a.csv", 2, 4)


# --- storage and import directory against each other ----------------------------------------


@pytest.mark.parametrize("layout", ["equal", "storage_in_import", "import_in_storage"])
def test_the_directories_may_be_equal_or_lie_inside_each_other(
    env: Env, tmp_path: Path, layout: str
) -> None:
    base = tmp_path / "shared"
    storage, imports = {
        "equal": (base, base),
        "storage_in_import": (base / "storage", base),
        "import_in_storage": (base, base / "import"),
    }[layout]
    imports.mkdir(parents=True, exist_ok=True)

    put_settings(env, storage, imports)

    saved = env.client.get(SETTINGS).json()
    assert saved["storage_directory"] == {"path": str(storage), "is_default": False}
    assert saved["import_directory"] == {"path": str(imports), "is_default": False}


def names_in_listing(env: Env, path: str = "") -> list[str]:
    response = env.client.get(LISTING, params={"path": path, "limit": 1000})
    assert response.status_code == 200, response.text
    return [item["name"] for item in response.json()["items"]]


def test_a_file_kept_in_the_import_directory_does_not_replace_a_file_there(
    env: Env, tmp_path: Path
) -> None:
    shared = tmp_path / "shared"
    shared.mkdir()
    put_settings(env, shared, shared)
    original = candles_json(2)
    (shared / "a.json").write_bytes(original)
    before = snapshot(shared)
    process = begin(env.client)

    answer = keep(env, "a.json", candles_json(3), process=process)

    assert answer["kept_as"] == "a (2).json"
    assert answer["kept"] is True
    after = snapshot(shared)
    assert {key: after[key] for key in before} == before  # the file there is unchanged
    assert (shared / "a (2).json").read_bytes() == candles_json(3)
    assert names_in_listing(env) == ["a (2).json", "a.json"]  # an ordinary file of the list

    # The file of the import directory is imported as before and stays unchanged.
    imported = env.import_path(process, "a.json")
    assert imported.status_code == 200, imported.text
    assert imported.json()["kept"] is False and imported.json()["kept_as"] is None
    assert (shared / "a.json").read_bytes() == original
    assert sorted(item.name for item in shared.iterdir()) == ["a (2).json", "a.json"]


@pytest.mark.parametrize("layout", ["equal", "storage_in_import", "import_in_storage"])
def test_an_intermediate_file_is_in_no_directory_of_the_list(
    env: Env, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, layout: str
) -> None:
    base = tmp_path / "shared"
    storage, imports = {
        "equal": (base, base),
        "storage_in_import": (base / "sub", base),
        "import_in_storage": (base, base / "sub"),
    }[layout]
    storage.mkdir(parents=True)
    imports.mkdir(parents=True, exist_ok=True)
    put_settings(env, storage, imports)
    seen: list[tuple[list[str], list[str]]] = []
    real_link = os.link

    def looking(source: Any, target: Any, **options: Any) -> None:
        # The intermediate file exists now; look at the list of both directories.
        existing = sorted(item.name for item in storage.iterdir())
        listed = [entry.name for entry in list_directory(imports, "", offset=0, limit=100).items]
        if imports != storage and storage.is_relative_to(imports):
            listed += [
                entry.name
                for entry in list_directory(
                    imports, str(storage.relative_to(imports)), offset=0, limit=100
                ).items
            ]
        seen.append((existing, listed))
        real_link(source, target, **options)

    monkeypatch.setattr("pipwerk_replay.file_keeping.os.link", looking)

    answer = keep(env, "x.json", b"{}")

    assert answer["kept_as"] == "x.json"
    assert len(seen) == 1
    existing, listed = seen[0]
    assert any(name.startswith(TEMPORARY_PREFIX) for name in existing)  # it did exist
    assert not any(name.startswith(TEMPORARY_PREFIX) for name in listed)
    assert not any(name.startswith(TEMPORARY_PREFIX) for name in names_in_listing(env))
    assert not [item for item in storage.iterdir() if item.name.startswith(TEMPORARY_PREFIX)]


def test_an_intermediate_file_cannot_be_named_or_listed_in_a_subdirectory(
    env: Env,
) -> None:
    leftover = env.imports / "sub" / f"{TEMPORARY_PREFIX}crash{TEMPORARY_SUFFIX}"
    leftover.parent.mkdir()
    leftover.write_bytes(b"part")
    (env.imports / "plain.json").write_bytes(b"{}")

    assert names_in_listing(env, "sub") == []
    assert names_in_listing(env) == ["sub", "plain.json"]
    response = env.client.post(DIRECTORY_PREVIEW, json={"path": f"sub/{leftover.name}"})
    assert response.status_code == 404


@needs_links
def test_a_link_to_an_intermediate_file_is_not_listed(env: Env) -> None:
    temporary = env.imports / f"{TEMPORARY_PREFIX}x{TEMPORARY_SUFFIX}"
    temporary.write_bytes(b"part")
    (env.imports / "link.json").symlink_to(temporary)

    assert names_in_listing(env) == []


# --- the result ------------------------------------------------------------------------------


def test_the_result_names_the_kept_name_for_every_kind_of_file(env: Env) -> None:
    process = begin(env.client)
    (env.imports / "from-directory.json").write_bytes(candles_json(2))

    kept = keep(env, "good.json", candles_json(3), process=process)
    refused_and_kept = keep(env, "bad.json", NOT_JSON, process=process)
    refused_and_kept_again = keep(env, "bad.json", NOT_JSON, process=process)
    not_kept = upload_file(
        env.client, process, "plain.json", candles_json(4), instrument="OTHER"
    ).json()
    refused_not_kept = upload_file(env.client, process, "worse.json", NOT_JSON).json()
    explicit_false = upload_file(
        env.client, process, "plain.json", candles_json(4), keep="false"
    ).json()
    from_directory = env.import_path(process, "from-directory.json").json()

    assert (kept["refused"], kept["kept"], kept["kept_as"]) == (False, True, "good.json")
    assert (refused_and_kept["refused"], refused_and_kept["kept"], refused_and_kept["kept_as"]) == (
        True,
        True,
        "bad.json",
    )
    assert refused_and_kept_again["kept_as"] == "bad (2).json"
    assert (not_kept["kept"], not_kept["kept_as"]) == (False, None)
    assert (refused_not_kept["refused"], refused_not_kept["kept"], refused_not_kept["kept_as"]) == (
        True,
        False,
        None,
    )
    assert (explicit_false["kept"], explicit_false["kept_as"]) == (False, None)
    assert (from_directory["refused"], from_directory["kept"], from_directory["kept_as"]) == (
        False,
        False,
        None,
    )
    assert all("kept_as" in answer for answer in (kept, not_kept, from_directory))
    assert env.stored_names() == ["bad (2).json", "bad.json", "good.json"]


def test_a_file_of_the_import_directory_with_the_setting_keep_is_not_kept(env: Env) -> None:
    put_settings(env, env.storage, env.imports)
    settings = env.client.get(SETTINGS).json()
    settings["keep_imported_files"] = True
    for kind in ("storage_directory", "import_directory", "export_directory"):
        settings[kind] = settings[kind]["path"]
    assert env.client.put(SETTINGS, json=settings).status_code == 200
    (env.imports / "a.json").write_bytes(candles_json(2))

    answer = env.import_path(begin(env.client), "a.json").json()

    assert (answer["kept"], answer["kept_as"]) == (False, None)
    assert env.stored_names() == []


def test_the_answer_is_refused_if_kept_and_kept_as_do_not_agree() -> None:
    base: dict[str, Any] = {
        "name": "a.json",
        "refused": False,
        "result": None,
        "error": None,
        "message": None,
    }
    with pytest.raises(ValidationError):
        marketdata_models.FileOutcome(**base, kept=True, kept_as=None)
    with pytest.raises(ValidationError):
        marketdata_models.FileOutcome(**base, kept=False, kept_as="a.json")
    with pytest.raises(ValidationError):
        marketdata_models.FileOutcome(**base, kept=False)
    outcome = marketdata_models.FileOutcome(**base, kept=True, kept_as="a (2).json")
    assert outcome.model_dump()["kept_as"] == "a (2).json"

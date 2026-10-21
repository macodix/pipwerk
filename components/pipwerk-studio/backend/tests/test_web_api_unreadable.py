"""Tests of files in the object directory that are not readable (specification 4.1).

A file that cannot be read, is no UTF-8 text, does not fit the schema, is too large, has
another format than its file name says or names another identifier than its file name appears
in the list with the identifier from its name and the mark "unreadable". Reading it is HTTP 409
with a fixed text. It is not changed: replacing and deleting are HTTP 409 too, the file stays
byte by byte as it was. ``usages`` skips such files and counts them. Files that do not have the
name of an object file are not listed.
"""

import json
import os
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    JSON,
    body,
    indicator_document,
    instance_of,
    load_case,
    post,
    put,
    rule_document,
    ruleset_document,
    trend_document,
)

from pipwerk_studio.object_service import MAX_STORED_FILE_BYTES

BAD_ID = "0badf11e-0000-4000-8000-000000000001"
TEXT = "The object file cannot be read or does not fit the document schema. It is left unchanged."


LINK_TEXT = (
    "The file name of the object in the object directory is taken by an entry that is no "
    "readable regular file (for example a symbolic link or a directory). Nothing was written."
)
CONFLICT_TEXT = (
    "An entry of another kind has this identifier in the object directory (any entry, for "
    "example a file, a symbolic link or a directory). Nothing was written."
)
UNREADABLE = {"detail": TEXT, "code": "object.unreadable", "params": {}}
LINK = {"detail": LINK_TEXT, "code": "object.name_taken", "params": {}}
CONFLICT = {"detail": CONFLICT_TEXT, "code": "object.kind_conflict", "params": {}}


def place(objects: Path, name: str, content: bytes) -> Path:
    objects.mkdir(parents=True, exist_ok=True)
    path = objects / name
    path.write_bytes(content)
    return path


def valid_rule_text(object_id: str) -> bytes:
    document = rule_document()
    document["id"] = object_id
    return body(document)


def bad_files(objects: Path) -> dict[str, tuple[str, bytes]]:
    """Not readable files by label: the file name and the content."""
    extra = rule_document()
    extra["id"] = BAD_ID
    extra["zusaetzlich"] = 1
    other_format = load_case("str-03")
    other_format["id"] = BAD_ID
    other_identifier = rule_document()
    other_identifier["id"] = "0badf11e-0000-4000-8000-0000000000ff"
    return {
        "no json": (f"{BAD_ID}.rule.json", b"this is no json"),
        "empty": (f"{BAD_ID}.rule.json", b""),
        "no utf-8": (f"{BAD_ID}.rule.json", b"\xff\xfe\x00{}"),
        "schema": (f"{BAD_ID}.rule.json", body(extra)),
        "other format": (f"{BAD_ID}.rule.json", body(other_format)),
        "other identifier": (f"{BAD_ID}.rule.json", body(other_identifier)),
        "too large": (f"{BAD_ID}.rule.json", b" " * (MAX_STORED_FILE_BYTES + 1)),
    }


@pytest.mark.parametrize("label", list(bad_files(Path("."))))
def test_a_file_that_is_not_readable_is_listed_with_the_mark_and_not_changed(
    client: TestClient, objects: Path, label: str
) -> None:
    name, content = bad_files(objects)[label]
    path = place(objects, name, content)
    ok_id = post(client, "rules", rule_document()).json()["id"]
    before = path.read_bytes()
    mtime = path.stat().st_mtime_ns

    items = client.get("/api/v1/rules").json()["items"]
    by_id = {item["id"]: item for item in items}
    assert set(by_id) == {BAD_ID, ok_id}
    broken = by_id[BAD_ID]
    assert broken["unreadable"] is True
    assert broken["name"] is None
    assert broken["description"] is None
    assert broken["object_type"] is None
    assert broken["modified"].endswith("Z")
    assert by_id[ok_id]["unreadable"] is False
    assert [item["id"] for item in items][-1] == BAD_ID  # not readable ones come last

    answer = client.get(f"/api/v1/rules/{BAD_ID}")
    assert answer.status_code == 409
    assert answer.json() == UNREADABLE

    document = rule_document()
    document["id"] = BAD_ID
    replaced = put(client, "rules", BAD_ID, document)
    assert replaced.status_code == 409
    assert replaced.json() == UNREADABLE
    deleted = client.delete(f"/api/v1/rules/{BAD_ID}")
    assert deleted.status_code == 409
    assert deleted.json() == UNREADABLE
    assert client.get(f"/api/v1/rules/{BAD_ID}/usages").status_code == 409

    assert path.read_bytes() == before
    assert path.stat().st_mtime_ns == mtime


def test_a_file_that_is_not_readable_does_not_hide_the_others(
    client: TestClient, objects: Path
) -> None:
    ids = [post(client, "strategies", load_case("str-03")).json()["id"] for _ in range(3)]
    place(objects, f"{BAD_ID}.strategy.json", b"{")
    items = client.get("/api/v1/strategies").json()["items"]
    assert [item["unreadable"] for item in items] == [False, False, False, True]
    assert {item["id"] for item in items[:3]} == set(ids)


def test_usages_skip_files_that_are_not_readable_and_count_them(
    client: TestClient, objects: Path
) -> None:
    template_id = post(client, "rules", rule_document()).json()["id"]
    document = load_case("str-03")
    document["rules"].append(instance_of(template_id, "Mindestvolumen"))
    strategy_id = post(client, "strategies", document).json()["id"]
    place(objects, f"{BAD_ID}.strategy.json", b"{")
    place(objects, f"{BAD_ID}.indicator.json", b"")
    place(objects, f"{BAD_ID}.ruleset.json", b"[]")
    answer = client.get(f"/api/v1/rules/{template_id}/usages")
    assert answer.status_code == 200
    assert [item["id"] for item in answer.json()["usages"]] == [strategy_id]
    assert answer.json()["skipped_unreadable"] == 3


def test_a_file_that_a_newer_version_wrote_is_kept(client: TestClient, objects: Path) -> None:
    newer = rule_document()
    newer["id"] = BAD_ID
    newer["format_version"] = "3.0"
    path = place(objects, f"{BAD_ID}.rule.json", body(newer))
    assert client.get("/api/v1/rules").json()["items"][0]["unreadable"] is True
    assert client.delete(f"/api/v1/rules/{BAD_ID}").status_code == 409
    assert json.loads(path.read_bytes())["format_version"] == "3.0"


def test_other_files_are_neither_listed_nor_changed(client: TestClient, objects: Path) -> None:
    names = [
        "notes.txt",
        f"{BAD_ID}.rule.json.bak",
        f"{BAD_ID.upper()}.rule.json",
        f"{BAD_ID}.unknown.json",
        ".hidden.tmp",
    ]
    for name in names:
        place(objects, name, b"data of " + name.encode())
    (objects / f"{BAD_ID}.strategy.json").mkdir()  # a directory with the name of an object file
    ok_id = post(client, "rules", rule_document()).json()["id"]
    assert [item["id"] for item in client.get("/api/v1/rules").json()["items"]] == [ok_id]
    assert client.get("/api/v1/strategies").json() == {"items": []}
    for name in names:
        assert (objects / name).read_bytes() == b"data of " + name.encode()


def test_a_symbolic_link_is_neither_listed_nor_read_nor_deleted(
    client: TestClient, objects: Path, tmp_path: Path
) -> None:
    target = tmp_path / "target.json"
    target.write_bytes(valid_rule_text(BAD_ID))
    objects.mkdir(parents=True)
    os.symlink(target, objects / f"{BAD_ID}.rule.json")
    assert client.get("/api/v1/rules").json() == {"items": []}
    assert client.get(f"/api/v1/rules/{BAD_ID}").status_code == 404
    assert client.delete(f"/api/v1/rules/{BAD_ID}").status_code == 404
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    # saving never follows or replaces the link: nothing is written
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == LINK
    assert (objects / f"{BAD_ID}.rule.json").is_symlink()
    assert target.read_bytes() == valid_rule_text(BAD_ID)
    assert sorted(path.name for path in objects.iterdir()) == [f"{BAD_ID}.rule.json"]


@pytest.mark.parametrize("dangling", [False, True])
def test_a_symbolic_link_of_another_kind_blocks_saving(
    client: TestClient, objects: Path, tmp_path: Path, dangling: bool
) -> None:
    target = tmp_path / "target.json"
    if not dangling:
        target.write_bytes(valid_rule_text(BAD_ID))
    objects.mkdir(parents=True)
    os.symlink(target, objects / f"{BAD_ID}.ruleset.json")
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == CONFLICT
    assert (objects / f"{BAD_ID}.ruleset.json").is_symlink()
    assert sorted(path.name for path in objects.iterdir()) == [f"{BAD_ID}.ruleset.json"]
    assert target.exists() is not dangling
    if not dangling:
        assert target.read_bytes() == valid_rule_text(BAD_ID)


def test_a_dangling_symbolic_link_of_the_same_kind_blocks_saving(
    client: TestClient, objects: Path, tmp_path: Path
) -> None:
    objects.mkdir(parents=True)
    os.symlink(tmp_path / "missing.json", objects / f"{BAD_ID}.rule.json")
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == LINK
    assert not (tmp_path / "missing.json").exists()


def snapshot(directory: Path) -> dict[str, tuple[str, bytes | str]]:
    """Every entry of the directory without following links: the type and the content
    (bytes of a file, target of a link, nothing for a directory)."""
    result: dict[str, tuple[str, bytes | str]] = {}
    for path in sorted(directory.iterdir()):
        if path.is_symlink():
            result[path.name] = ("link", os.readlink(path))
        elif path.is_dir():
            result[path.name] = ("directory", b"")
        else:
            result[path.name] = ("file", path.read_bytes())
    return result


def valid_document_text(kind: str, object_id: str) -> bytes:
    """The content of a readable, valid file of the given kind."""
    documents: dict[str, dict[str, Any]] = {
        "rule": rule_document(),
        "indicator": indicator_document(),
        "ruleset": ruleset_document("Regelwerk", []),
        "trend": trend_document(),
        "strategy": load_case("str-01"),
    }
    document = dict(documents[kind])
    document["id"] = object_id
    return body(document)


def make_entry(path: Path, entry: str, target: Path, kind: str = "rule") -> None:
    """Put an entry of the given type under the name ``path``. A valid file is a valid
    document of ``kind``, the kind of the file name."""
    if entry == "bad file":
        path.write_bytes(b"{")
    elif entry == "valid file":
        path.write_bytes(valid_document_text(kind, BAD_ID))
    elif entry == "link":
        target.write_bytes(valid_rule_text(BAD_ID))
        os.symlink(target, path)
    elif entry == "dangling link":
        os.symlink(target, path)
    else:
        assert entry == "directory"
        path.mkdir()


ENTRIES = ["valid file", "bad file", "link", "dangling link", "directory"]


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
@pytest.mark.parametrize("entry", ENTRIES)
@pytest.mark.parametrize("other_kind", ["indicator", "ruleset", "strategy", "trend"])
@pytest.mark.parametrize("replacing", [False, True])
def test_any_entry_of_another_kind_blocks_creating_and_replacing(
    client: TestClient,
    objects: Path,
    tmp_path: Path,
    entry: str,
    other_kind: str,
    replacing: bool,
) -> None:
    objects.mkdir(parents=True)
    if replacing:
        place(objects, f"{BAD_ID}.rule.json", valid_rule_text(BAD_ID))
    target = tmp_path / "target.json"
    make_entry(objects / f"{BAD_ID}.{other_kind}.json", entry, target, other_kind)
    before = snapshot(objects)
    target_before = target.read_bytes() if target.exists() else None
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == CONFLICT
    assert snapshot(objects) == before
    assert (target.read_bytes() if target.exists() else None) == target_before


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
@pytest.mark.parametrize("entry", ["link", "dangling link", "directory"])
def test_a_link_or_a_directory_under_the_name_of_the_path_blocks_saving(
    client: TestClient, objects: Path, tmp_path: Path, entry: str
) -> None:
    objects.mkdir(parents=True)
    target = tmp_path / "target.json"
    make_entry(objects / f"{BAD_ID}.rule.json", entry, target)
    before = snapshot(objects)
    target_before = target.read_bytes() if target.exists() else None
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == LINK
    assert snapshot(objects) == before
    assert (target.read_bytes() if target.exists() else None) == target_before


def test_a_file_that_is_not_readable_under_the_name_of_the_path_blocks_saving(
    client: TestClient, objects: Path
) -> None:
    place(objects, f"{BAD_ID}.rule.json", b"{")
    before = snapshot(objects)
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    response = put(client, "rules", BAD_ID, document)
    assert response.status_code == 409
    assert response.json() == UNREADABLE
    assert snapshot(objects) == before


def test_a_missing_file_is_created_and_a_valid_one_is_replaced(
    client: TestClient, objects: Path
) -> None:
    document: dict[str, Any] = rule_document()
    document["id"] = BAD_ID
    created = put(client, "rules", BAD_ID, document)
    assert created.status_code == 201
    assert sorted(snapshot(objects)) == [f"{BAD_ID}.rule.json"]
    replaced = put(client, "rules", BAD_ID, document)
    assert replaced.status_code == 200
    assert sorted(snapshot(objects)) == [f"{BAD_ID}.rule.json"]


def test_a_file_that_becomes_readable_is_read_at_once(client: TestClient, objects: Path) -> None:
    """E5: no copy of the data is kept; the files are read when they are needed."""
    place(objects, f"{BAD_ID}.rule.json", b"{")
    assert client.get("/api/v1/rules").json()["items"][0]["unreadable"] is True
    place(objects, f"{BAD_ID}.rule.json", valid_rule_text(BAD_ID))
    item = client.get("/api/v1/rules").json()["items"][0]
    assert item["unreadable"] is False
    assert item["name"] == "Mindestvolumen"
    assert client.get(f"/api/v1/rules/{BAD_ID}").status_code == 200
    (objects / f"{BAD_ID}.rule.json").unlink()
    assert client.get("/api/v1/rules").json() == {"items": []}
    assert client.get(f"/api/v1/rules/{BAD_ID}").status_code == 404


def test_check_does_not_touch_the_object_directory(client: TestClient, objects: Path) -> None:
    response = client.post("/api/v1/check", content=body(load_case("str-01")), headers=JSON)
    assert response.status_code == 200
    assert not objects.exists()

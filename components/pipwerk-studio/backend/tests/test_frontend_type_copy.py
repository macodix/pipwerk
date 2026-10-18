"""The copy of the type descriptions that the tests of the user interface use must equal the
answer of ``GET /api/v1/element-types`` (finding H4 of the function test).

The copy is ``components/pipwerk-studio/frontend/src/testing/element-types.json``. If it differs,
write it anew with the backend directory as the working directory::

    uv run --frozen python tests/test_frontend_type_copy.py

The command writes the answer in the form of the file (compact JSON, UTF-8, one line feed at
the end).
"""

import json
import sys
import tempfile
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from web_api_support import REPOSITORY

from pipwerk_studio.app import create_app

COPY = (
    REPOSITORY
    / "components"
    / "pipwerk-studio"
    / "frontend"
    / "src"
    / "testing"
    / "element-types.json"
)
REGENERATE = (
    "Write the copy anew: in components/pipwerk-studio/backend run "
    "`uv run --frozen python tests/test_frontend_type_copy.py`."
)


def current_answer(database_directory: Path) -> Any:
    """The answer of the element types of a backend with a database below the directory."""
    app = create_app(f"sqlite:///{database_directory / 'studio.db'}")
    client = TestClient(app, base_url="http://127.0.0.1")  # the host the backend allows
    response = client.get("/api/v1/element-types")
    assert response.status_code == 200
    return response.json()


def as_text(answer: Any) -> str:
    return json.dumps(answer, ensure_ascii=False, separators=(",", ":")) + "\n"


def test_the_copy_of_the_user_interface_equals_the_answer_of_the_backend(tmp_path: Path) -> None:
    assert COPY.is_file(), REGENERATE
    stored = json.loads(COPY.read_text(encoding="utf-8"))
    assert stored == current_answer(tmp_path), REGENERATE


def test_the_copy_is_written_in_the_form_of_the_command(tmp_path: Path) -> None:
    text = COPY.read_text(encoding="utf-8")
    assert text == as_text(json.loads(text)), REGENERATE


def test_the_copy_names_the_fields_of_the_type_description(tmp_path: Path) -> None:
    answer = json.loads(COPY.read_text(encoding="utf-8"))
    types = {item["id"]: item for item in answer["types"]}
    place = types["flow.place_order"]
    assert [item["id"] for item in place["outputs"] if item["holds_management"]] == ["gestellt"]
    assert types["flow.condition"]["named"] is True
    assert types["Strategie"]["strategy_parameters"] is True
    assert types["trigger.tick"]["named"] is False


def main() -> int:
    with tempfile.TemporaryDirectory() as directory:
        text = as_text(current_answer(Path(directory)))
    COPY.parent.mkdir(parents=True, exist_ok=True)
    COPY.write_text(text, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

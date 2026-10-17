"""Rules of the library for its sources (specification E1, order 01 acceptance criteria 4 and 5)."""

import ast
import re
import sys
from pathlib import Path

import pytest

from tests.paths import LIBRARY_SOURCE

SOURCES = sorted(LIBRARY_SOURCE.rglob("*.py"))
FRAMEWORKS = {
    "fastapi",
    "starlette",
    "uvicorn",
    "sqlalchemy",
    "alembic",
    "flask",
    "django",
    "httpx",
    "requests",
    "aiohttp",
    "react",
    "numpy",
    "pandas",
}


def tree_of(path: Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def imported_modules(tree: ast.Module) -> set[str]:
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            names.add(node.module.split(".")[0])
    return names


def test_there_are_sources() -> None:
    assert len(SOURCES) > 20


@pytest.mark.parametrize("path", SOURCES, ids=lambda path: str(path.relative_to(LIBRARY_SOURCE)))
def test_only_the_standard_library_the_library_and_pydantic_are_imported(path: Path) -> None:
    modules = imported_modules(tree_of(path))
    allowed = set(sys.stdlib_module_names) | {"pipwerk_domain", "pydantic"}
    assert modules <= allowed, modules - allowed
    assert not modules & FRAMEWORKS


@pytest.mark.parametrize("path", SOURCES, ids=lambda path: str(path.relative_to(LIBRARY_SOURCE)))
def test_pydantic_is_used_only_in_the_package_for_documents(path: Path) -> None:
    uses_pydantic = "pydantic" in imported_modules(tree_of(path))
    in_documents = "documents" in path.relative_to(LIBRARY_SOURCE).parts
    assert in_documents or not uses_pydantic


@pytest.mark.parametrize("path", SOURCES, ids=lambda path: str(path.relative_to(LIBRARY_SOURCE)))
def test_no_eval_exec_or_compile_of_input(path: Path) -> None:
    for node in ast.walk(tree_of(path)):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            assert node.func.id not in {"eval", "exec", "compile", "__import__"}, node.lineno
        if isinstance(node, ast.Attribute):
            assert node.attr not in {"eval", "exec"}, node.lineno


@pytest.mark.parametrize("path", SOURCES, ids=lambda path: str(path.relative_to(LIBRARY_SOURCE)))
def test_no_ast_module_for_the_input(path: Path) -> None:
    assert "ast" not in imported_modules(tree_of(path))
    assert "code" not in imported_modules(tree_of(path))


def docstring_nodes(tree: ast.Module) -> set[int]:
    found: set[int] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Module | ast.ClassDef | ast.FunctionDef | ast.AsyncFunctionDef):
            body = node.body
            if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
                found.add(id(body[0].value))
    return found


FORBIDDEN_TEXT = [
    re.compile(r"^(/|~)[A-Za-z0-9_.-]+/"),  # an absolute or home path
    re.compile(r"^[A-Za-z]:\\"),  # a Windows path
    re.compile(r"\blocalhost\b", re.IGNORECASE),
    re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"),  # an IP address
    re.compile(r"://"),  # a URL with a host (the JSON Schema dialect is the only one)
]


@pytest.mark.parametrize("path", SOURCES, ids=lambda path: str(path.relative_to(LIBRARY_SOURCE)))
def test_no_fixed_path_port_or_host_name(path: Path) -> None:
    tree = tree_of(path)
    skip = docstring_nodes(tree)
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and id(node) not in skip:
            if node.value == "https://json-schema.org/draft/2020-12/schema":
                continue
            for pattern in FORBIDDEN_TEXT:
                assert not pattern.search(node.value), (node.lineno, node.value)
        if isinstance(node, ast.Name) and node.id.lower() in {"port", "host", "hostname"}:
            pytest.fail(f"{path.name}:{node.lineno} names a port or host")


def test_the_package_declares_only_pydantic_at_run_time() -> None:
    text = (LIBRARY_SOURCE.parents[1] / "pyproject.toml").read_text(encoding="utf-8")
    match = re.search(r"^dependencies = \[(.*?)\]", text, re.MULTILINE | re.DOTALL)
    assert match is not None
    assert re.findall(r'"([^"]+)"', match.group(1)) == ["pydantic==2.13.5"]
    assert 'version = "0.1.0"' in text
    assert 'requires-python = ">=3.14"' in text
    assert "hatchling" in text

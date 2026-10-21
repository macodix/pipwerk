from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app


def make_client() -> TestClient:
    return TestClient(create_app("sqlite:///:memory:"))


def test_health_reports_ok() -> None:
    response = make_client().get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_rejects_write_methods() -> None:
    response = make_client().post("/api/health")

    assert response.status_code == 405


def test_unknown_path_is_not_found() -> None:
    response = make_client().get("/api/unknown")

    assert response.status_code == 404


def test_the_application_is_named_pipwerk_replay() -> None:
    assert make_client().get("/openapi.json").json()["info"]["title"] == "pipwerk replay"

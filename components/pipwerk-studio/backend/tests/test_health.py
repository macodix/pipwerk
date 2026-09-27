from fastapi.testclient import TestClient

from pipwerk_studio.app import create_app


def make_client() -> TestClient:
    return TestClient(create_app())


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

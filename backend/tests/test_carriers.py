import pytest
from fastapi.testclient import TestClient

from app.carriers import (
    FALLBACK_CARRIERS,
    NEW_YORK_TO_WASHINGTON,
    SAN_FRANCISCO_TO_LOS_ANGELES,
    normalize_city,
    select_carriers,
)
from app.config import get_allowed_origins
from app.main import app, create_app


client = TestClient(app)


def payload(origin: str, destination: str) -> dict[str, str]:
    return {"origin_city": origin, "destination_city": destination}


def serialized(carriers) -> list[dict[str, object]]:
    return [carrier.model_dump() for carrier in carriers]


def test_health_check_returns_success():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_compiled_frontend_is_served_after_api_and_health_routes(tmp_path):
    assets_dir = tmp_path / "assets"
    assets_dir.mkdir()
    (tmp_path / "index.html").write_text(
        '<!doctype html><div id="root">compiled frontend</div>', encoding="utf-8"
    )
    (assets_dir / "app.js").write_text("window.appLoaded = true;", encoding="utf-8")
    production_client = TestClient(create_app(tmp_path))

    assert production_client.get("/").status_code == 200
    assert "compiled frontend" in production_client.get("/").text
    assert production_client.get("/assets/app.js").text == "window.appLoaded = true;"
    assert production_client.get("/health").json() == {"status": "ok"}
    assert production_client.post(
        "/api/carriers", json=payload("Denver", "Chicago")
    ).json() == {"carriers": serialized(FALLBACK_CARRIERS)}


def test_new_york_city_to_washington_dc_returns_ordered_special_fixture():
    response = client.post(
        "/api/carriers", json=payload("New York City", "Washington DC")
    )

    assert response.status_code == 200
    assert response.json() == {"carriers": serialized(NEW_YORK_TO_WASHINGTON)}


def test_san_francisco_to_los_angeles_returns_ordered_special_fixture():
    response = client.post(
        "/api/carriers", json=payload("San Francisco", "Los Angeles")
    )

    assert response.status_code == 200
    assert response.json() == {
        "carriers": serialized(SAN_FRANCISCO_TO_LOS_ANGELES)
    }


@pytest.mark.parametrize(
    ("origin", "destination"),
    [
        ("New York City", "Los Angeles"),
        ("Denver", "Washington DC"),
        ("Washington DC", "New York City"),
        ("Los Angeles", "San Francisco"),
        ("Chicago", "Seattle"),
        ("Denver", "Denver"),
    ],
)
def test_every_other_directional_pair_returns_fallback(origin, destination):
    response = client.post("/api/carriers", json=payload(origin, destination))

    assert response.status_code == 200
    assert response.json() == {"carriers": serialized(FALLBACK_CARRIERS)}


@pytest.mark.parametrize(
    "origin",
    ["New York", "NYC", "  nEw   YoRk   CiTy  "],
)
@pytest.mark.parametrize(
    "destination",
    ["Washington", "Washington DC", "Washington D.C.", "Washington, D.C."],
)
def test_documented_aliases_and_formatting_match_new_york_fixture(
    origin, destination
):
    response = client.post("/api/carriers", json=payload(origin, destination))

    assert response.status_code == 200
    assert response.json() == {"carriers": serialized(NEW_YORK_TO_WASHINGTON)}


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("  NEW   YORK  ", "new-york-city"),
        ("Washington, D.C.", "washington-dc"),
        ("San Francisco", "san-francisco"),
        ("Los Angeles", "los-angeles"),
        ("Québec City", "québec city"),
    ],
)
def test_normalize_city_is_narrow_and_deterministic(raw, expected):
    assert normalize_city(raw) == expected


@pytest.mark.parametrize(
    "body",
    [
        {"destination_city": "Washington DC"},
        {"origin_city": "New York City"},
        payload("", "Washington DC"),
        payload("   ", "Washington DC"),
        payload("New York City", "\t"),
        {"origin_city": 123, "destination_city": "Washington DC"},
        {
            "origin_city": "New York City",
            "destination_city": "Washington DC",
            "unexpected": True,
        },
    ],
)
def test_invalid_requests_return_422(body):
    response = client.post("/api/carriers", json=body)

    assert response.status_code == 422


def test_each_response_has_only_the_documented_fields_and_types():
    response = client.post(
        "/api/carriers", json=payload("New York City", "Washington DC")
    )

    for carrier in response.json()["carriers"]:
        assert set(carrier) == {"name", "trucks_per_day"}
        assert isinstance(carrier["name"], str)
        assert isinstance(carrier["trucks_per_day"], int)


def test_response_mutation_cannot_change_static_fixture():
    first = client.post(
        "/api/carriers", json=payload("New York City", "Washington DC")
    ).json()
    first["carriers"][0]["name"] = "Changed by client"

    second = client.post(
        "/api/carriers", json=payload("New York City", "Washington DC")
    )

    assert second.json() == {"carriers": serialized(NEW_YORK_TO_WASHINGTON)}
    assert select_carriers("New York City", "Washington DC") is NEW_YORK_TO_WASHINGTON


def test_allowed_origins_are_explicit_and_trimmed():
    assert get_allowed_origins("https://portal.example, http://localhost:5173 ") == [
        "https://portal.example",
        "http://localhost:5173",
    ]


def test_cors_preflight_allows_configured_local_origin():
    response = client.options(
        "/api/carriers",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

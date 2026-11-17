from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import COOKIE, token_hash
from app.db import engine, get_db
from app.main import app, origin
from app.models import LoginSession, User


DEMO_PASSWORD = "Clave de prueba exclusiva 2026"


@pytest.fixture
def browser():
    with engine.connect() as connection, connection.begin() as transaction:
        def test_db():
            with Session(connection, join_transaction_mode="create_savepoint") as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        try:
            with TestClient(app, base_url="https://testserver", headers={"Origin": origin}) as client:
                yield client, connection
        finally:
            app.dependency_overrides.clear()
            transaction.rollback()


def register(client, role="estudiante", name="Perfil ficticio"):
    email = f"prueba-{uuid4().hex}@example.com"
    response = client.post("/api/cuenta/registro", json={
        "email": email, "password": DEMO_PASSWORD, "role": role, "nombre": name,
    })
    assert response.status_code == 201, response.text
    assert response.json() == {"email": email, "role": role}
    return email, response


def test_student_login_and_profile_persistence(browser):
    client, connection = browser
    email, registration = register(client)
    assert "httponly" in registration.headers["set-cookie"].lower()
    assert "samesite=lax" in registration.headers["set-cookie"].lower()
    token = client.cookies[COOKIE]

    stored_password = connection.scalar(select(User.password_hash).where(User.email == email))
    assert stored_password.startswith("$argon2id$")
    assert connection.scalar(
        select(LoginSession.token_hash).join(User, User.id == LoginSession.user_id).where(User.email == email)
    ) == token_hash(token)

    profile = {"nombre": "Estudiante de prueba", "carrera": "Ingeniería ficticia", "horas_objetivo": 275}
    assert client.put("/api/perfil/estudiante", json=profile).status_code == 200
    assert client.delete("/api/cuenta/sesion").status_code == 204
    assert client.get("/api/cuenta/yo").status_code == 401
    assert client.get("/api/cuenta/yo", headers={"Cookie": f"{COOKIE}={token}"}).status_code == 401

    assert client.post("/api/cuenta/sesion", json={"email": email, "password": "errónea"}).status_code == 401
    assert client.post("/api/cuenta/sesion", json={"email": email.upper(), "password": DEMO_PASSWORD}).status_code == 200
    saved = client.get("/api/perfil/estudiante").json()
    assert {key: saved[key] for key in profile} == profile


@pytest.mark.parametrize(("role", "field", "data"), [
    ("estudiante", "nombre", {"nombre": "Estudiante A", "horas_objetivo": 180}),
    ("empresa", "representante", {"representante": "Representante A", "razon_social": "Empresa ficticia A"}),
])
def test_each_account_only_reads_and_updates_its_profile(browser, role, field, data):
    client, _ = browser
    other_role = "empresa" if role == "estudiante" else "estudiante"
    path = f"/api/perfil/{role}"
    email_a, _ = register(client, role)
    assert client.put(path, json=data).status_code == 200
    assert client.delete("/api/cuenta/sesion").status_code == 204

    register(client, role, "Usuario B")
    assert client.get(path).json()[field] == "Usuario B"
    assert client.put(path, json={field: "Usuario B actualizado", "user_id": 1}).status_code == 422
    assert client.put(path, json={field: "Usuario B actualizado"}).status_code == 200
    assert client.get(f"/api/perfil/{other_role}").status_code == 403
    other_field = "representante" if role == "estudiante" else "nombre"
    assert client.put(f"/api/perfil/{other_role}", json={other_field: "Prueba"}).status_code == 403

    assert client.post("/api/cuenta/sesion", json={"email": email_a, "password": DEMO_PASSWORD}).status_code == 200
    assert client.get(path).json()[field] == data[field]


def test_registration_and_profile_validation(browser):
    client, _ = browser
    assert client.get("/api/perfil/empresa").status_code == 401
    assert client.put("/api/perfil/empresa", json={"representante": "Prueba"}).status_code == 401
    email, _ = register(client, "empresa")
    data = {"email": email.upper(), "password": DEMO_PASSWORD, "role": "empresa", "nombre": "Prueba"}
    assert client.post("/api/cuenta/registro", json=data).status_code == 409
    assert client.post("/api/cuenta/registro", json={**data, "role": "administrador"}).status_code == 422
    assert client.put("/api/perfil/empresa", json={"representante": "Prueba", "rut": "99.999.999-0"}).status_code == 422
    valid = client.put("/api/perfil/empresa", json={"representante": "Prueba", "rut": "99.999.999-9"})
    assert valid.status_code == 200
    assert valid.json()["rut"] == "99999999-9"
    assert client.delete("/api/cuenta/sesion", headers={"Origin": "https://otro.example"}).status_code == 403
    assert client.get("/api/cuenta/yo").status_code == 200


def test_expired_session_and_invalid_hours(browser):
    client, connection = browser
    register(client)
    for invalid in (0, -1, 1.5, "120"):
        response = client.put("/api/perfil/estudiante", json={"nombre": "Prueba", "horas_objetivo": invalid})
        assert response.status_code == 422
    connection.execute(LoginSession.__table__.update().where(
        LoginSession.token_hash == token_hash(client.cookies[COOKIE])
    ).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    assert client.get("/api/cuenta/yo").status_code == 401

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.main import app, origin


PASSWORD = "Clave de prueba exclusiva 2026"
OFFER = {
    "title": "Práctica de desarrollo", "area": "Tecnología",
    "description": "Apoyo al desarrollo de una aplicación web.",
    "requirements": "Conocimientos iniciales de Python.", "city": "Talca", "region": "Maule",
    "modality": "híbrida", "hours": 280, "vacancies": 2, "benefits": "Aporte de movilización",
}


@pytest.fixture
def clients():
    with engine.connect() as connection, connection.begin() as transaction:
        def test_db():
            with Session(connection, join_transaction_mode="create_savepoint") as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        try:
            with TestClient(app, base_url="https://testserver", headers={"Origin": origin}) as company, TestClient(app, base_url="https://testserver", headers={"Origin": origin}) as student:
                yield company, student
        finally:
            app.dependency_overrides.clear()
            transaction.rollback()


def register(client, role):
    email = f"fase2-{uuid4().hex}@example.com"
    response = client.post("/api/cuenta/registro", json={
        "email": email, "password": PASSWORD, "role": role, "nombre": "Cuenta de prueba",
    })
    assert response.status_code == 201, response.text
    return email


def test_offer_application_and_status_history_are_persisted(clients):
    company, student = clients
    company_email = register(company, "empresa")
    student_email = register(student, "estudiante")
    created = company.post("/api/ofertas", json=OFFER)
    assert created.status_code == 201, created.text
    offer = created.json()
    assert offer["hours"] == 280
    assert offer["company_name"] == "Cuenta de prueba"

    visible = student.get("/api/ofertas?q=desarrollo&region=Maule")
    assert visible.status_code == 200
    assert [item["id"] for item in visible.json()] == [offer["id"]]
    application = student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={"message": "Me interesa"})
    assert application.status_code == 201, application.text
    application_id = application.json()["id"]
    assert application.json()["status"] == "enviada"
    assert student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).status_code == 409

    assert company.get(f"/api/empresa/ofertas/{offer['id']}/postulaciones").json()[0]["student_name"] == "Cuenta de prueba"
    transition = company.patch(f"/api/postulaciones/{application_id}", json={"status": "en_revision", "comment": "Antecedentes recibidos"})
    assert transition.status_code == 200, transition.text
    assert transition.json()["status"] == "en_revision"
    assert company.patch(f"/api/postulaciones/{application_id}", json={"status": "enviada"}).status_code == 422
    assert student.get("/api/estudiante/postulaciones").json()[0]["status"] == "en_revision"
    history = student.get(f"/api/postulaciones/{application_id}/historial").json()
    assert [event["next_status"] for event in history] == ["enviada", "en_revision"]
    assert history[-1]["actor_email"] == company_email
    assert student_email != company_email


def test_company_and_student_access_are_scoped(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json=OFFER).json()
    assert student.post("/api/ofertas", json=OFFER).status_code == 403
    assert company.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).status_code == 403
    assert student.get("/api/empresa/ofertas").status_code == 403
    assert company.get(f"/api/empresa/ofertas/{offer['id']}/postulaciones").status_code == 200
    assert student.get(f"/api/empresa/ofertas/{offer['id']}/postulaciones").status_code == 403

    closed = company.put(f"/api/ofertas/{offer['id']}", json={**OFFER, "status": "cerrada"})
    assert closed.status_code == 200, closed.text
    assert student.get("/api/ofertas").json() == []
    assert student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).status_code == 404


def test_offer_update_is_owner_scoped_and_modality_filter_uses_saved_data(clients):
    company, student = clients
    register(company, "empresa")
    offer = company.post("/api/ofertas", json={**OFFER, "modality": "remota"}).json()
    assert [item["id"] for item in student.get("/api/ofertas?modality=remota").json()] == [offer["id"]]
    assert student.get("/api/ofertas?modality=presencial").json() == []

    updated = company.put(f"/api/ofertas/{offer['id']}", json={**OFFER, "modality": "híbrida", "status": "publicada"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["modality"] == "híbrida"
    assert student.get("/api/ofertas?modality=remota").json() == []
    assert [item["id"] for item in student.get("/api/ofertas?modality=híbrida").json()] == [offer["id"]]

    other_company = TestClient(app, base_url="https://testserver", headers={"Origin": origin})
    try:
        register(other_company, "empresa")
        denied = other_company.put(f"/api/ofertas/{offer['id']}", json={**OFFER, "title": "Cambio no autorizado", "status": "publicada"})
        assert denied.status_code == 404
        assert company.get("/api/empresa/ofertas").json()[0]["title"] == OFFER["title"]
    finally:
        other_company.close()


PATHS = {"enviada": [], "en_revision": ["en_revision"], "entrevista": ["entrevista"], "rechazada": ["rechazada"], "retirada": ["retirada"]}
EXPECTED = {"enviada": ["en_revision", "entrevista", "rechazada"], "en_revision": ["entrevista", "rechazada"], "entrevista": ["rechazada"], "rechazada": [], "retirada": []}


def application_at(clients, status):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json=OFFER).json()
    application = student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).json()
    path = f"/api/postulaciones/{application['id']}"
    for step in PATHS[status]:
        result = student.post(path + "/retirar") if step == "retirada" else company.patch(path, json={"status": step})
        assert result.status_code == 200
    return path


@pytest.mark.parametrize("initial", PATHS)
@pytest.mark.parametrize("target", ["en_revision", "entrevista", "rechazada"])
def test_transition_matrix_and_history(clients, initial, target):
    company, student = clients
    path = application_at(clients, initial)
    current = student.get("/api/estudiante/postulaciones").json()[0]
    assert current["allowed_statuses"] == EXPECTED[initial]
    before = student.get(path + "/historial").json()
    response = company.patch(path, json={"status": target})
    allowed = target in EXPECTED[initial]
    assert response.status_code == (200 if allowed else 409)
    after = student.get(path + "/historial").json()
    assert len(after) == len(before) + int(allowed)
    if allowed:
        assert response.json()["allowed_statuses"] == EXPECTED[target]
        assert after[-1]["previous_status"] == initial
        assert after[-1]["next_status"] == target
    else:
        assert after == before
        assert student.get("/api/estudiante/postulaciones").json()[0]["status"] == initial


@pytest.mark.parametrize("initial", PATHS)
def test_withdrawal_matrix(clients, initial):
    company, student = clients
    path = application_at(clients, initial)
    response = student.post(path + "/retirar")
    assert response.status_code == (200 if initial in {"enviada", "en_revision", "entrevista"} else 409)
    if response.status_code == 200:
        assert response.json()["allowed_statuses"] == []
        assert company.patch(path, json={"status": "rechazada"}).status_code == 409


@pytest.mark.parametrize("deadline,expected", [(None, 201), ("2026-11-16", 409), ("2026-11-17", 201), ("2026-11-18", 201)])
def test_deadline_catalog_and_direct_application(clients, monkeypatch, deadline, expected):
    from datetime import date
    from app import offers
    monkeypatch.setattr(offers, "today_in_chile", lambda: date(2026, 11, 17))
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json={**OFFER, "deadline": deadline}).json()
    assert offer["deadline"] == deadline
    assert (offer["id"] in [x["id"] for x in student.get("/api/ofertas").json()]) == (expected == 201)
    response = student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={})
    assert response.status_code == expected
    if expected == 409:
        assert student.get("/api/estudiante/postulaciones").json() == []
    assert company.get("/api/empresa/ofertas").json()[0]["id"] == offer["id"]


def test_deadline_passes_while_page_is_open(clients, monkeypatch):
    from datetime import date
    from app import offers
    monkeypatch.setattr(offers, "today_in_chile", lambda: date(2026, 11, 17))
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json={**OFFER, "deadline": "2026-11-17"}).json()
    assert student.get("/api/ofertas").json()
    monkeypatch.setattr(offers, "today_in_chile", lambda: date(2026, 11, 18))
    assert student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={}).status_code == 409

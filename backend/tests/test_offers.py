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

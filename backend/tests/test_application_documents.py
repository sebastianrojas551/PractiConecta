import json
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.main import app, origin
from app.models import ApplicationDocument


PASSWORD = "Clave de prueba exclusiva 2026"
PDF = b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n"
OFFER = {
    "title": "Práctica con antecedentes", "area": "Tecnología",
    "description": "Oferta ficticia para comprobar documentos privados.",
    "requirements": "Conocimientos relacionados con el área.", "region": "Maule",
    "modality": "híbrida", "hours": 240, "cv_required": True,
    "cover_letter_required": True, "additional_requirements": ["Portafolio"],
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
    response = client.post("/api/cuenta/registro", json={
        "email": f"pct24-{uuid4().hex}@example.com", "password": PASSWORD,
        "role": role, "nombre": "Cuenta de prueba",
    })
    assert response.status_code == 201, response.text


def submit_files(student, offer_id, profile, cv=PDF, letter=PDF, portfolio=PDF, cover_text=None):
    data = {"profile_snapshot": json.dumps(profile)}
    if portfolio is not None:
        data["additional_labels"] = "Portafolio"
    if cover_text is not None:
        data["cover_letter_text"] = cover_text
    files = {}
    if cv is not None:
        files["cv"] = ("cv.pdf", cv, "application/pdf")
    if letter is not None:
        files["cover_letter_pdf"] = ("carta.pdf", letter, "application/pdf")
    if portfolio is not None:
        files["additional_files"] = ("portafolio.pdf", portfolio, "application/pdf")
    return student.post(f"/api/ofertas/{offer_id}/postulaciones", data=data, files=files)


def test_offer_document_requirements_and_legacy_bypass_is_rejected(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json=OFFER).json()
    assert offer["cv_required"] is True
    assert offer["cover_letter_required"] is True
    assert offer["additional_requirements"] == ["Portafolio"]
    assert student.post(f"/api/ofertas/{offer['id']}/postulaciones", json={"message": "Me interesa"}).status_code == 422
    assert student.get("/api/estudiante/postulaciones").json() == []


def test_complete_application_preview_snapshot_and_private_document_permissions(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json=OFFER).json()
    profile = student.get("/api/perfil/estudiante").json()
    profile["carrera"] = "Ingeniería de prueba"
    assert student.put("/api/perfil/estudiante", json=profile).status_code == 200
    invalid_missing = submit_files(student, offer["id"], profile, portfolio=None)
    assert invalid_missing.status_code == 422
    assert student.get("/api/estudiante/postulaciones").json() == []

    tampered_profile = {**profile, "nombre": "Identidad alterada solo en el formulario"}
    stale_review = submit_files(student, offer["id"], tampered_profile, letter=None, cover_text="Me interesa.")
    assert stale_review.status_code == 409
    assert student.get("/api/estudiante/postulaciones").json() == []

    sent = submit_files(student, offer["id"], profile, letter=None, cover_text="Me interesa aportar en el equipo.")
    assert sent.status_code == 201, sent.text
    application = sent.json()
    assert application["status"] == "enviada"
    assert application["profile_snapshot"]["carrera"] == "Ingeniería de prueba"
    assert application["cover_letter_text"] == "Me interesa aportar en el equipo."
    assert {item["label"] for item in application["documents"]} == {"CV", "Portafolio"}
    assert all(item["is_current"] and item["version"] == 1 for item in application["documents"])
    assert "content" not in application["documents"][0]

    # The snapshot does not silently change when the student edits their live profile.
    changed_profile = {**profile, "carrera": "Otra carrera"}
    assert student.put("/api/perfil/estudiante", json=changed_profile).status_code == 200
    assert student.get("/api/estudiante/postulaciones").json()[0]["profile_snapshot"]["carrera"] == "Ingeniería de prueba"

    candidate_list = company.get(f"/api/empresa/ofertas/{offer['id']}/postulaciones")
    assert candidate_list.status_code == 200
    assert candidate_list.json()[0]["documents"] == application["documents"]
    document_id = next(item["id"] for item in application["documents"] if item["label"] == "CV")
    candidate_download = student.get(f"/api/postulaciones/{application['id']}/documentos/{document_id}")
    company_download = company.get(f"/api/postulaciones/{application['id']}/documentos/{document_id}")
    assert candidate_download.status_code == company_download.status_code == 200
    assert candidate_download.content == PDF
    assert "attachment; filename=\"cv.pdf\"" in company_download.headers["content-disposition"]
    assert company.get("/api/ofertas").json()[0]["title"] == OFFER["title"]

    test_session_context = app.dependency_overrides[get_db]()
    test_session = next(test_session_context)
    try:
        stored_document = test_session.get(ApplicationDocument, document_id)
        stored_document.content = b"alterado"
        test_session.commit()
    finally:
        test_session_context.close()
    assert student.get(f"/api/postulaciones/{application['id']}/documentos/{document_id}").status_code == 500

    outsider = TestClient(app, base_url="https://testserver", headers={"Origin": origin})
    try:
        register(outsider, "empresa")
        assert outsider.get(f"/api/empresa/ofertas/{offer['id']}/postulaciones").status_code == 404
        assert outsider.get(f"/api/postulaciones/{application['id']}/documentos/{document_id}").status_code == 404
    finally:
        outsider.close()

    other_student = TestClient(app, base_url="https://testserver", headers={"Origin": origin})
    try:
        register(other_student, "estudiante")
        assert other_student.get(f"/api/postulaciones/{application['id']}/documentos/{document_id}").status_code == 404
    finally:
        other_student.close()


@pytest.mark.parametrize("filename,content_type,data,status", [
    ("cv.txt", "text/plain", PDF, 415),
    ("cv.pdf", "application/pdf", b"not a pdf", 422),
])
def test_pdf_type_and_signature_are_checked(clients, filename, content_type, data, status):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json={**OFFER, "additional_requirements": []}).json()
    profile = student.get("/api/perfil/estudiante").json()
    response = student.post(
        f"/api/ofertas/{offer['id']}/postulaciones",
        data={"profile_snapshot": json.dumps(profile), "cover_letter_text": "Carta de presentación"},
        files={"cv": (filename, data, content_type)},
    )
    assert response.status_code == status
    assert student.get("/api/estudiante/postulaciones").json() == []


def test_cover_letter_can_be_submitted_as_pdf_but_not_as_text_and_pdf_together(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json={**OFFER, "additional_requirements": []}).json()
    profile = student.get("/api/perfil/estudiante").json()
    assert student.put("/api/perfil/estudiante", json=profile).status_code == 200

    with_pdf = submit_files(student, offer["id"], profile, portfolio=None)
    assert with_pdf.status_code == 201, with_pdf.text
    assert {item["label"] for item in with_pdf.json()["documents"]} == {"CV", "Carta de presentación"}
    assert with_pdf.json()["cover_letter_text"] is None

    conflicting = submit_files(student, offer["id"], profile, portfolio=None, cover_text="También escribí una carta.")
    assert conflicting.status_code == 422
    assert len(student.get("/api/estudiante/postulaciones").json()) == 1


def test_documents_are_bounded_and_postulation_states_keep_existing_audit(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    offer = company.post("/api/ofertas", json={**OFFER, "additional_requirements": []}).json()
    profile = student.get("/api/perfil/estudiante").json()
    too_large = submit_files(student, offer["id"], profile, cv=b"%PDF-1.4\n" + b"x" * (5 * 1024 * 1024) + b"\n%%EOF")
    assert too_large.status_code == 413
    assert student.get("/api/estudiante/postulaciones").json() == []

    sent = submit_files(student, offer["id"], profile, letter=None, portfolio=None, cover_text="Carta")
    assert sent.status_code == 201, sent.text
    app_id = sent.json()["id"]
    advanced = company.patch(f"/api/postulaciones/{app_id}", json={"status": "en_revision", "comment": "Antecedentes recibidos"})
    assert advanced.status_code == 200
    assert company.patch(f"/api/postulaciones/{app_id}", json={"status": "rechazada"}).status_code == 200
    history = student.get(f"/api/postulaciones/{app_id}/historial").json()
    assert [event["next_status"] for event in history] == ["enviada", "en_revision", "rechazada"]


def test_total_document_payload_is_bounded(clients):
    company, student = clients
    register(company, "empresa")
    register(student, "estudiante")
    labels = ["Documento A", "Documento B", "Documento C", "Documento D"]
    offer = company.post("/api/ofertas", json={**OFFER, "additional_requirements": labels, "cover_letter_required": False}).json()
    profile = student.get("/api/perfil/estudiante").json()
    assert student.put("/api/perfil/estudiante", json=profile).status_code == 200
    large_pdf = b"%PDF-1.4\n" + b"x" * (5 * 1024 * 1024 - 20) + b"\n%%EOF"
    files = [("cv", ("cv.pdf", large_pdf, "application/pdf"))]
    for index, label in enumerate(labels):
        files.append(("additional_labels", (None, label)))
        files.append(("additional_files", (f"documento-{index}.pdf", large_pdf, "application/pdf")))
    response = student.post(
        f"/api/ofertas/{offer['id']}/postulaciones",
        data={"profile_snapshot": json.dumps(profile)},
        files=files,
    )
    assert response.status_code == 413
    assert student.get("/api/estudiante/postulaciones").json() == []

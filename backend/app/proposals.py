from datetime import UTC, datetime
from hashlib import sha256
from html import escape

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from .auth import CurrentUser, Database
from .models import Application, CompanyProfile, InternshipOffer, Proposal, ProposalEvent, StudentProfile, User
from .offers import require_role
from .schemas import AcademicInput, ProposalInput, ProposalResponse

router = APIRouter(prefix="/api", tags=["Propuestas y aceptación"])
MAX_EVIDENCE = 2 * 1024 * 1024


def view(proposal):
    fields = ("id", "application_id", "start_date", "end_date", "hours", "conditions", "company_name",
              "company_rut", "representative", "student_name", "student_email", "offer_title", "status",
              "created_at", "responded_at", "academic_status", "academic_note", "academic_updated_at", "letter_issued_at")
    return {**{key: getattr(proposal, key) for key in fields}, "has_evidence": proposal.evidence_sha256 is not None}


def authorized(proposal_id, user, db, lock=False):
    query = select(Proposal).where(Proposal.id == proposal_id)
    if lock:
        query = query.with_for_update().execution_options(populate_existing=True)
    proposal = db.scalar(query)
    if proposal is None:
        raise HTTPException(404, "No encontramos esta propuesta.")
    application = db.get(Application, proposal.application_id)
    offer = db.get(InternshipOffer, application.offer_id)
    if user.id not in {application.student_id, offer.company_id}:
        raise HTTPException(404, "No encontramos esta propuesta.")
    return proposal


def accepted(proposal):
    if proposal.status != "aceptada":
        raise HTTPException(409, "El estudiante debe aceptar la propuesta primero.")


def record(db, proposal, user, action, detail=None):
    db.add(ProposalEvent(proposal_id=proposal.id, actor_id=user.id, action=action, detail=detail))


@router.post("/postulaciones/{application_id}/propuesta", status_code=201)
def create_proposal(application_id: int, data: ProposalInput, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    application = db.scalar(select(Application).where(Application.id == application_id).with_for_update())
    offer = db.get(InternshipOffer, application.offer_id) if application else None
    if offer is None or offer.company_id != user.id:
        raise HTTPException(404, "No encontramos esta postulación.")
    if application.status not in {"enviada", "en_revision", "entrevista"}:
        raise HTTPException(409, "La postulación ya no admite propuestas.")
    if db.scalar(select(Proposal.id).where(Proposal.application_id == application.id)):
        raise HTTPException(409, "Esta postulación ya tiene una propuesta.")
    company = db.get(CompanyProfile, user.id)
    student = db.get(StudentProfile, application.student_id)
    if not company.razon_social or not company.rut:
        raise HTTPException(409, "Completa la razón social y el RUT de la empresa en Mi perfil antes de proponer.")
    proposal = Proposal(application_id=application.id, **data.model_dump(), company_name=company.razon_social,
                        company_rut=company.rut, representative=company.representante,
                        student_name=student.nombre, student_email=db.get(User, student.user_id).email, offer_title=offer.title)
    db.add(proposal)
    db.flush()
    record(db, proposal, user, "propuesta_enviada")
    db.commit()
    db.refresh(proposal)
    return view(proposal)


@router.get("/propuestas")
def list_proposals(user: CurrentUser, db: Database):
    query = select(Proposal).join(Application).join(InternshipOffer)
    query = query.where(InternshipOffer.company_id == user.id) if user.role == "empresa" else query.where(Application.student_id == user.id)
    return [view(p) for p in db.scalars(query.order_by(Proposal.created_at.desc()))]


@router.post("/propuestas/{proposal_id}/respuesta")
def respond(proposal_id: int, data: ProposalResponse, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    proposal = authorized(proposal_id, user, db, lock=True)
    if proposal.status != "pendiente":
        raise HTTPException(409, "Esta propuesta ya tiene una respuesta.")
    proposal.status = data.status
    proposal.responded_at = datetime.now(UTC)
    record(db, proposal, user, "respuesta", data.status)
    db.commit()
    return view(proposal)


@router.put("/propuestas/{proposal_id}/autorizacion")
def academic(proposal_id: int, data: AcademicInput, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    proposal = authorized(proposal_id, user, db, lock=True)
    accepted(proposal)
    if data.status == "autorizacion_informada" and proposal.evidence is None:
        raise HTTPException(409, "Adjunta el respaldo privado antes de informar la autorización externa.")
    proposal.academic_status = data.status
    proposal.academic_note = data.note
    proposal.academic_updated_at = datetime.now(UTC)
    record(db, proposal, user, "autorizacion_informada_por_estudiante", data.status)
    db.commit()
    return view(proposal)


@router.put("/propuestas/{proposal_id}/respaldo")
async def upload_evidence(proposal_id: int, request: Request, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    proposal = authorized(proposal_id, user, db)
    accepted(proposal)
    if request.headers.get("content-type", "").split(";")[0] != "application/pdf":
        raise HTTPException(415, "Adjunta un archivo PDF de hasta 2 MiB.")
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_EVIDENCE:
            raise HTTPException(413, "El respaldo supera el máximo de 2 MiB.")
        data.extend(chunk)
    if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-1024:]:
        raise HTTPException(422, "El archivo no tiene la estructura básica de un PDF.")
    # Read the bounded stream before locking: a slow upload must not hold a row lock.
    proposal = authorized(proposal_id, user, db, lock=True)
    accepted(proposal)
    proposal.evidence = bytes(data)
    proposal.evidence_sha256 = sha256(data).hexdigest()
    # A replacement must be explicitly declared again by its owner.
    if proposal.academic_status == "autorizacion_informada":
        proposal.academic_status = "en_tramite"
    proposal.academic_updated_at = datetime.now(UTC)
    record(db, proposal, user, "respaldo_cargado", proposal.evidence_sha256)
    db.commit()
    return view(proposal)


@router.get("/propuestas/{proposal_id}/respaldo")
def download_evidence(proposal_id: int, user: CurrentUser, db: Database):
    proposal = authorized(proposal_id, user, db)
    if proposal.evidence is None:
        raise HTTPException(404, "No hay un respaldo adjunto.")
    return Response(proposal.evidence, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="respaldo-{proposal.id}.pdf"',
        "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox"})


def letter(proposal):
    def e(value):
        return escape(str(value))
    return f'''<!doctype html><html lang="es-CL"><meta charset="utf-8"><title>Carta de aceptación empresarial</title>
<style>body{{font:16px/1.6 Georgia,serif;max-width:760px;margin:50px auto;padding:24px}}p{{white-space:pre-wrap}}</style>
<h1>Carta de aceptación empresarial</h1>
<p>Emisor: {e(proposal.company_name)} — RUT {e(proposal.company_rut)}<br>Representante: {e(proposal.representative)}</p>
<p>La empresa deja constancia de la aceptación de {e(proposal.student_name)} ({e(proposal.student_email)}) para la propuesta de práctica «{e(proposal.offer_title)}».</p>
<p>Desde {e(proposal.start_date)} hasta {e(proposal.end_date)}. Horas acordadas: {proposal.hours}.</p>
<h2>Condiciones acordadas</h2><p>{e(proposal.conditions)}</p>
<p>Aceptación del estudiante registrada: {e(proposal.responded_at.isoformat())}.<br>Emisión empresarial: {e(proposal.letter_issued_at.isoformat())}. Referencia: PC-{proposal.id}.</p>
<p>Documento emitido por la empresa desde su cuenta en PractiConecta. No contiene firma electrónica ni acredita validación de identidad empresarial. No es una autorización académica, certificado universitario ni comprobante de seguro escolar. La autorización institucional se gestiona por canales externos.</p></html>'''


@router.post("/propuestas/{proposal_id}/carta")
def issue_letter(proposal_id: int, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    proposal = authorized(proposal_id, user, db, lock=True)
    accepted(proposal)
    if proposal.letter_html is None:
        proposal.letter_issued_at = datetime.now(UTC)
        proposal.letter_html = letter(proposal)
        record(db, proposal, user, "carta_emitida")
        db.commit()
    return view(proposal)


@router.get("/propuestas/{proposal_id}/carta")
def download_letter(proposal_id: int, user: CurrentUser, db: Database):
    proposal = authorized(proposal_id, user, db)
    if proposal.letter_html is None:
        raise HTTPException(404, "La empresa aún no emite la carta.")
    return Response(proposal.letter_html, media_type="text/html", headers={
        "Content-Disposition": f'attachment; filename="carta-aceptacion-{proposal.id}.html"',
        "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox"})


@router.get("/propuestas/{proposal_id}/historial")
def history(proposal_id: int, user: CurrentUser, db: Database):
    authorized(proposal_id, user, db)
    events = db.scalars(select(ProposalEvent).where(ProposalEvent.proposal_id == proposal_id).order_by(ProposalEvent.id))
    return [{"action": e.action, "detail": e.detail, "actor_id": e.actor_id, "created_at": e.created_at} for e in events]

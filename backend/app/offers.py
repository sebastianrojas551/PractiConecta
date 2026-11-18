from datetime import UTC, datetime, time
from hashlib import sha256
import json
from pathlib import PurePath
import re
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query, Request, Response
from starlette.datastructures import UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from .auth import CurrentUser, Database
from .models import Application, ApplicationDocument, ApplicationEvent, CompanyProfile, InternshipOffer, Proposal, StudentProfile, User
from .schemas import ApplicationCreate, ApplicationUpdate, ApplicationView, OfferInput, OfferUpdate, OfferView, StudentData


APPLICATION_TRANSITIONS = {"enviada": ["en_revision", "entrevista", "rechazada"], "en_revision": ["entrevista", "rechazada"], "entrevista": ["rechazada"]}


def today_in_chile():
    return datetime.now(ZoneInfo("America/Santiago")).date()


def offer_expired(offer):
    # deadline stores the calendar date encoded at UTC end-of-day, including legacy offers.
    return offer.deadline is not None and offer.deadline.astimezone(UTC).date() < today_in_chile()


router = APIRouter(prefix="/api", tags=["Ofertas y postulaciones"])
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024
MAX_APPLICATION_SIZE = 20 * 1024 * 1024
PROFILE_FIELDS = ("nombre", "carrera", "institucion", "nivel", "habilidades", "disponibilidad", "modalidad", "areas_interes", "horas_objetivo", "ciudad", "region")


def offer_view(db, offer):
    profile = db.get(CompanyProfile, offer.company_id)
    user = db.get(User, offer.company_id)
    return OfferView.model_validate({**{key: getattr(offer, key) for key in (
        "id", "company_id", "title", "area", "description", "requirements", "city", "region",
        "modality", "hours", "vacancies", "benefits", "cv_required", "cover_letter_required",
        "additional_requirements", "status", "created_at",
    )}, "deadline": offer.deadline.date() if offer.deadline else None,
        "company_name": (profile.razon_social if profile and profile.razon_social else profile.representante if profile else user.email)})


def application_view(db, application, offer):
    has_proposal = db.scalar(select(Proposal.id).where(Proposal.application_id == application.id)) is not None
    student = db.get(StudentProfile, application.student_id)
    company = db.get(CompanyProfile, offer.company_id)
    documents = db.scalars(select(ApplicationDocument).where(ApplicationDocument.application_id == application.id).order_by(ApplicationDocument.id)).all()
    return ApplicationView.model_validate({
        "id": application.id, "offer_id": offer.id, "student_id": application.student_id,
        "message": application.message, "cover_letter_text": application.cover_letter_text,
        "profile_snapshot": application.profile_snapshot or {},
        "documents": [{key: getattr(document, key) for key in ("id", "kind", "label", "filename", "content_type", "size", "sha256", "version", "is_current", "created_at")} for document in documents],
        "status": application.status, "created_at": application.created_at,
        "offer_title": offer.title, "company_name": company.razon_social if company and company.razon_social else "Empresa",
        "student_name": student.nombre if student else "Estudiante",
        "allowed_statuses": [] if has_proposal else APPLICATION_TRANSITIONS.get(application.status, []),
        "can_propose": not has_proposal and application.status in APPLICATION_TRANSITIONS,
        "can_withdraw": not has_proposal and application.status in APPLICATION_TRANSITIONS,
    })


def require_role(user, role):
    if user.role != role:
        raise HTTPException(403, "Tu cuenta no tiene acceso a esta acción.")


@router.get("/ofertas", response_model=list[OfferView])
def browse_offers(db: Database, q: str | None = Query(default=None, max_length=100), region: str | None = Query(default=None, max_length=150), modality: str | None = None):
    query = select(InternshipOffer).where(InternshipOffer.status == "publicada")
    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.where(or_(InternshipOffer.title.ilike(search), InternshipOffer.area.ilike(search), InternshipOffer.description.ilike(search), InternshipOffer.requirements.ilike(search)))
    if region and region.strip():
        query = query.where(InternshipOffer.region.ilike(f"%{region.strip()}%"))
    if modality:
        query = query.where(InternshipOffer.modality == modality)
    return [offer_view(db, item) for item in db.scalars(query.order_by(InternshipOffer.created_at.desc())).all() if not offer_expired(item)]


@router.post("/ofertas", response_model=OfferView, status_code=201)
def create_offer(data: OfferInput, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    offer = InternshipOffer(company_id=user.id, **data.model_dump(exclude={"deadline"}), deadline=datetime.combine(data.deadline, time.max, UTC) if data.deadline else None)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer_view(db, offer)


@router.get("/empresa/ofertas", response_model=list[OfferView])
def company_offers(user: CurrentUser, db: Database):
    require_role(user, "empresa")
    return [offer_view(db, item) for item in db.scalars(select(InternshipOffer).where(InternshipOffer.company_id == user.id).order_by(InternshipOffer.created_at.desc())).all()]


@router.put("/ofertas/{offer_id}", response_model=OfferView)
def update_offer(offer_id: int, data: OfferUpdate, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    offer = db.get(InternshipOffer, offer_id)
    if offer is None or offer.company_id != user.id:
        raise HTTPException(404, "No encontramos esta oferta.")
    for key, value in data.model_dump(exclude={"deadline"}).items():
        setattr(offer, key, value)
    offer.deadline = datetime.combine(data.deadline, time.max, UTC) if data.deadline else None
    db.commit()
    db.refresh(offer)
    return offer_view(db, offer)


@router.post("/ofertas/{offer_id}/postulaciones", response_model=ApplicationView, status_code=201)
async def apply_to_offer(offer_id: int, request: Request, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    offer = db.get(InternshipOffer, offer_id)
    if offer is None or offer.status != "publicada":
        raise HTTPException(404, "Esta oferta no está disponible.")
    if offer_expired(offer):
        raise HTTPException(409, "El plazo para postular a esta oferta terminó.")
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    profile = db.get(StudentProfile, user.id)
    snapshot = {field: getattr(profile, field) for field in PROFILE_FIELDS}
    submitted_files: list[tuple[str, str, str, bytes]] = []
    cover_letter_text = None
    message = None
    if content_type == "application/json":
        try:
            data = ApplicationCreate.model_validate(await request.json())
        except Exception as error:
            raise HTTPException(422, "Revisa el mensaje de tu postulación.") from error
        if offer.cv_required or offer.cover_letter_required or offer.additional_requirements:
            raise HTTPException(422, "Esta oferta exige antecedentes. Completa la revisión antes de enviarla.")
        message = data.message
    elif content_type == "multipart/form-data":
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                request_size = int(content_length)
            except ValueError as error:
                raise HTTPException(400, "El tamaño de la solicitud no es válido.") from error
            if request_size < 0:
                raise HTTPException(400, "El tamaño de la solicitud no es válido.")
            if request_size > MAX_APPLICATION_SIZE:
                raise HTTPException(413, "Los antecedentes superan el máximo total de 20 MiB.")
        try:
            form = await request.form(max_files=7, max_fields=16, max_part_size=16 * 1024)
        except Exception as error:
            raise HTTPException(400, "No pudimos leer los antecedentes adjuntos.") from error
        try:
            try:
                submitted_profile = StudentData.model_validate(json.loads(str(form.get("profile_snapshot") or "{}")))
            except Exception as error:
                raise HTTPException(422, "Revisa los datos de perfil que enviarás con tu candidatura.") from error
            reviewed_snapshot = {field: getattr(submitted_profile, field) for field in PROFILE_FIELDS}
            if reviewed_snapshot != snapshot:
                raise HTTPException(409, "Tu perfil cambió. Actualiza la revisión de antecedentes antes de confirmar.")
            cv_file = form.get("cv")
            letter_file = form.get("cover_letter_pdf")
            cv = await read_application_pdf(cv_file, "CV") if isinstance(cv_file, UploadFile) else None
            letter = await read_application_pdf(letter_file, "Carta de presentación") if isinstance(letter_file, UploadFile) else None
            cover_letter_text = str(form.get("cover_letter_text") or "").strip() or None
            if cover_letter_text and (len(cover_letter_text) > 5000 or "\x00" in cover_letter_text):
                raise HTTPException(422, "La carta de presentación escrita debe tener hasta 5.000 caracteres.")
            if letter and cover_letter_text:
                raise HTTPException(422, "Elige una carta redactada o un PDF, no ambos.")
            if offer.cv_required and cv is None:
                raise HTTPException(422, "Esta oferta requiere adjuntar el CV en PDF.")
            if offer.cover_letter_required and not (letter or cover_letter_text):
                raise HTTPException(422, "Esta oferta requiere una carta de presentación redactada o en PDF.")
            if cv:
                submitted_files.append(("cv", "CV", cv[0], cv[1]))
                if len(cv[1]) > MAX_APPLICATION_SIZE:
                    raise HTTPException(413, "Los antecedentes superan el máximo total de 20 MiB.")
            if letter:
                submitted_files.append(("carta_presentacion", "Carta de presentación", letter[0], letter[1]))
                if sum(len(data) for _, _, _, data in submitted_files) > MAX_APPLICATION_SIZE:
                    raise HTTPException(413, "Los antecedentes superan el máximo total de 20 MiB.")

            additional_files = [item for item in form.getlist("additional_files") if isinstance(item, UploadFile)]
            additional_labels = [str(item).strip() for item in form.getlist("additional_labels")]
            if len(additional_files) != len(additional_labels) or len(set(additional_labels)) != len(additional_labels):
                raise HTTPException(422, "Cada antecedente adicional debe incluir un archivo y un nombre asociado.")
            if set(additional_labels) != set(offer.additional_requirements or []):
                raise HTTPException(422, "Adjunta todos los antecedentes solicitados para esta oferta, sin agregar otros.")
            for label, upload in zip(additional_labels, additional_files, strict=True):
                filename, data = await read_application_pdf(upload, label)
                submitted_files.append(("adicional", label, filename, data))
                if sum(len(data) for _, _, _, data in submitted_files) > MAX_APPLICATION_SIZE:
                    raise HTTPException(413, "Los antecedentes superan el máximo total de 20 MiB.")
        finally:
            await form.close()
    else:
        raise HTTPException(415, "Envía los antecedentes del formulario de postulación.")

    application = Application(offer_id=offer.id, student_id=user.id, message=message,
                              cover_letter_text=cover_letter_text, profile_snapshot=snapshot)
    db.add(application)
    try:
        db.flush()
        for kind, label, filename, data in submitted_files:
            db.add(ApplicationDocument(
                application_id=application.id, uploaded_by=user.id, kind=kind, label=label,
                filename=filename, content_type="application/pdf", content=data,
                sha256=sha256(data).hexdigest(), size=len(data),
            ))
        db.add(ApplicationEvent(application_id=application.id, actor_id=user.id, next_status="enviada"))
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(409, "Ya postulaste a esta oferta.") from error
    db.refresh(application)
    return application_view(db, application, offer)


async def read_application_pdf(upload: UploadFile, label: str) -> tuple[str, bytes]:
    if upload.content_type != "application/pdf":
        raise HTTPException(415, f"{label}: adjunta un archivo PDF.")
    raw_name = (upload.filename or "").replace("\\", "/")
    filename = PurePath(raw_name).name
    filename = re.sub(r"[^\w.()-]+", "_", filename, flags=re.UNICODE)[:120]
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(415, f"{label}: el nombre del archivo debe terminar en .pdf.")
    if upload.size is not None and upload.size > MAX_DOCUMENT_SIZE:
        raise HTTPException(413, f"{label}: el máximo por documento es 5 MiB.")
    data = await upload.read(MAX_DOCUMENT_SIZE + 1)
    if len(data) > MAX_DOCUMENT_SIZE:
        raise HTTPException(413, f"{label}: el máximo por documento es 5 MiB.")
    if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-1024:]:
        raise HTTPException(422, f"{label}: el archivo no tiene la estructura básica de un PDF.")
    return filename, data


@router.get("/estudiante/postulaciones", response_model=list[ApplicationView])
def student_applications(user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    rows = db.execute(select(Application, InternshipOffer).join(InternshipOffer).where(Application.student_id == user.id).order_by(Application.created_at.desc())).all()
    return [application_view(db, application, offer) for application, offer in rows]


@router.get("/empresa/ofertas/{offer_id}/postulaciones", response_model=list[ApplicationView])
def offer_applications(offer_id: int, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    offer = db.get(InternshipOffer, offer_id)
    if offer is None or offer.company_id != user.id:
        raise HTTPException(404, "No encontramos esta oferta.")
    rows = db.execute(select(Application, InternshipOffer).join(InternshipOffer).where(Application.offer_id == offer.id).order_by(Application.created_at)).all()
    return [application_view(db, application, item_offer) for application, item_offer in rows]


@router.patch("/postulaciones/{application_id}", response_model=ApplicationView)
def update_application(application_id: int, data: ApplicationUpdate, user: CurrentUser, db: Database):
    require_role(user, "empresa")
    row = db.execute(select(Application, InternshipOffer).join(InternshipOffer).where(Application.id == application_id).with_for_update(of=Application)).first()
    if row is None or row[1].company_id != user.id:
        raise HTTPException(404, "No encontramos esta postulación.")
    application, offer = row
    if db.scalar(select(Proposal.id).where(Proposal.application_id == application.id)):
        raise HTTPException(409, "Esta postulación tiene una propuesta. Continúa en Propuestas de práctica.")
    if data.status not in APPLICATION_TRANSITIONS.get(application.status, []):
        raise HTTPException(409, "Ese cambio de estado no está permitido.")
    previous = application.status
    application.status = data.status
    application.updated_at = datetime.now(UTC)
    db.add(ApplicationEvent(application_id=application.id, actor_id=user.id, previous_status=previous, next_status=data.status, comment=data.comment))
    db.commit()
    db.refresh(application)
    return application_view(db, application, offer)


@router.post("/postulaciones/{application_id}/retirar", response_model=ApplicationView)
def withdraw_application(application_id: int, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    row = db.execute(select(Application, InternshipOffer).join(InternshipOffer).where(Application.id == application_id).with_for_update(of=Application)).first()
    if row is None or row[0].student_id != user.id:
        raise HTTPException(404, "No encontramos esta postulación.")
    application, offer = row
    if db.scalar(select(Proposal.id).where(Proposal.application_id == application.id)):
        raise HTTPException(409, "Esta postulación tiene una propuesta. Continúa en Propuestas de práctica.")
    if application.status not in {"enviada", "en_revision", "entrevista"}:
        raise HTTPException(409, "Esta postulación ya no se puede retirar.")
    previous = application.status
    application.status = "retirada"
    db.add(ApplicationEvent(application_id=application.id, actor_id=user.id, previous_status=previous, next_status="retirada"))
    db.commit()
    db.refresh(application)
    return application_view(db, application, offer)


@router.get("/postulaciones/{application_id}/historial", response_model=list[dict])
def application_history(application_id: int, user: CurrentUser, db: Database):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(404, "No encontramos esta postulación.")
    offer = db.get(InternshipOffer, application.offer_id)
    if user.id not in {application.student_id, offer.company_id}:
        raise HTTPException(404, "No encontramos esta postulación.")
    rows = db.execute(select(ApplicationEvent, User.email).join(User, User.id == ApplicationEvent.actor_id).where(ApplicationEvent.application_id == application.id).order_by(ApplicationEvent.created_at, ApplicationEvent.id)).all()
    return [{"previous_status": event.previous_status, "next_status": event.next_status, "comment": event.comment, "created_at": event.created_at, "actor_email": email} for event, email in rows]


@router.get("/postulaciones/{application_id}/documentos/{document_id}")
def download_application_document(application_id: int, document_id: int, user: CurrentUser, db: Database):
    application = db.get(Application, application_id)
    document = db.get(ApplicationDocument, document_id)
    if application is None or document is None or document.application_id != application.id:
        raise HTTPException(404, "No encontramos este documento.")
    offer = db.get(InternshipOffer, application.offer_id)
    if user.id not in {application.student_id, offer.company_id}:
        raise HTTPException(404, "No encontramos este documento.")
    if len(document.content) != document.size or sha256(document.content).hexdigest() != document.sha256:
        raise HTTPException(500, "No podemos entregar este documento porque su integridad no coincide.")
    filename = document.filename.replace("\r", "").replace("\n", "").replace('"', "")
    return Response(document.content, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'",
    })

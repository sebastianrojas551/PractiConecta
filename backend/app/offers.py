from datetime import UTC, datetime, time
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from .auth import CurrentUser, Database
from .models import Application, ApplicationEvent, CompanyProfile, InternshipOffer, Proposal, StudentProfile, User
from .schemas import ApplicationCreate, ApplicationUpdate, ApplicationView, OfferInput, OfferUpdate, OfferView


APPLICATION_TRANSITIONS = {"enviada": ["en_revision", "entrevista", "rechazada"], "en_revision": ["entrevista", "rechazada"], "entrevista": ["rechazada"]}


def today_in_chile():
    return datetime.now(ZoneInfo("America/Santiago")).date()


def offer_expired(offer):
    # deadline stores the calendar date encoded at UTC end-of-day, including legacy offers.
    return offer.deadline is not None and offer.deadline.astimezone(UTC).date() < today_in_chile()


router = APIRouter(prefix="/api", tags=["Ofertas y postulaciones"])


def offer_view(db, offer):
    profile = db.get(CompanyProfile, offer.company_id)
    user = db.get(User, offer.company_id)
    return OfferView.model_validate({**{key: getattr(offer, key) for key in (
        "id", "company_id", "title", "area", "description", "requirements", "city", "region",
        "modality", "hours", "vacancies", "benefits", "status", "created_at",
    )}, "deadline": offer.deadline.date() if offer.deadline else None,
        "company_name": (profile.razon_social if profile and profile.razon_social else profile.representante if profile else user.email)})


def application_view(db, application, offer):
    has_proposal = db.scalar(select(Proposal.id).where(Proposal.application_id == application.id)) is not None
    student = db.get(StudentProfile, application.student_id)
    company = db.get(CompanyProfile, offer.company_id)
    return ApplicationView.model_validate({
        "id": application.id, "offer_id": offer.id, "student_id": application.student_id,
        "message": application.message, "status": application.status, "created_at": application.created_at,
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
def apply_to_offer(offer_id: int, data: ApplicationCreate, user: CurrentUser, db: Database):
    require_role(user, "estudiante")
    offer = db.get(InternshipOffer, offer_id)
    if offer is None or offer.status != "publicada":
        raise HTTPException(404, "Esta oferta no está disponible.")
    if offer_expired(offer):
        raise HTTPException(409, "El plazo para postular a esta oferta terminó.")
    application = Application(offer_id=offer.id, student_id=user.id, message=data.message)
    db.add(application)
    try:
        db.flush()
        db.add(ApplicationEvent(application_id=application.id, actor_id=user.id, next_status="enviada"))
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(409, "Ya postulaste a esta oferta.") from error
    db.refresh(application)
    return application_view(db, application, offer)


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

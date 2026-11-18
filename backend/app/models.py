from datetime import date, datetime

from sqlalchemy import JSON, CheckConstraint, Date, LargeBinary, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('estudiante', 'empresa')", name="valid_role"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    nombre: Mapped[str] = mapped_column(Text)
    carrera: Mapped[str | None] = mapped_column(Text)
    institucion: Mapped[str | None] = mapped_column(Text)
    nivel: Mapped[str | None] = mapped_column(Text)
    ciudad: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    habilidades: Mapped[str | None] = mapped_column(Text)
    disponibilidad: Mapped[str | None] = mapped_column(Text)
    horas_objetivo: Mapped[int | None]
    modalidad: Mapped[str | None] = mapped_column(Text)
    areas_interes: Mapped[str | None] = mapped_column(Text)


class CompanyProfile(Base):
    __tablename__ = "companies"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    representante: Mapped[str] = mapped_column(Text)
    razon_social: Mapped[str | None] = mapped_column(Text)
    rut: Mapped[str | None] = mapped_column(Text)
    rubro: Mapped[str | None] = mapped_column(Text)
    ciudad: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    contacto: Mapped[str | None] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)


class LoginSession(Base):
    __tablename__ = "login_sessions"

    token_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class InternshipOffer(Base):
    __tablename__ = "internship_offers"
    __table_args__ = (
        CheckConstraint("status IN ('publicada', 'pausada', 'cerrada')", name="valid_offer_status"),
        CheckConstraint("modality IN ('presencial', 'híbrida', 'remota')", name="valid_offer_modality"),
        CheckConstraint("hours > 0 AND vacancies > 0", name="positive_offer_numbers"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(Text)
    area: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    requirements: Mapped[str] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    modality: Mapped[str] = mapped_column(Text)
    hours: Mapped[int] = mapped_column(Integer)
    vacancies: Mapped[int] = mapped_column(Integer)
    benefits: Mapped[str | None] = mapped_column(Text)
    cv_required: Mapped[bool] = mapped_column(default=True, server_default="true")
    cover_letter_required: Mapped[bool] = mapped_column(default=False, server_default="false")
    additional_requirements: Mapped[list[str]] = mapped_column(JSON, default=list, server_default="[]")
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(Text, server_default="publicada")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("offer_id", "student_id", name="unique_offer_application"),
        CheckConstraint("status IN ('enviada', 'en_revision', 'entrevista', 'rechazada', 'retirada')", name="valid_application_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    offer_id: Mapped[int] = mapped_column(ForeignKey("internship_offers.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str | None] = mapped_column(Text)
    cover_letter_text: Mapped[str | None] = mapped_column(Text)
    profile_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, server_default="{}")
    status: Mapped[str] = mapped_column(Text, server_default="enviada")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    previous_status: Mapped[str | None] = mapped_column(Text)
    next_status: Mapped[str] = mapped_column(Text)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ApplicationDocument(Base):
    __tablename__ = "application_documents"
    __table_args__ = (
        CheckConstraint("kind IN ('cv', 'carta_presentacion', 'adicional')", name="valid_application_document_kind"),
        CheckConstraint("version > 0", name="positive_application_document_version"),
        UniqueConstraint("application_id", "label", "version", name="unique_application_document_version"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    kind: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    filename: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(Text)
    content: Mapped[bytes] = mapped_column(LargeBinary)
    sha256: Mapped[str] = mapped_column(Text)
    size: Mapped[int] = mapped_column(Integer)
    version: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    is_current: Mapped[bool] = mapped_column(default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Proposal(Base):
    __tablename__ = "proposals"
    __table_args__ = (
        CheckConstraint("status IN ('pendiente', 'aceptada', 'rechazada')", name="valid_proposal_status"),
        CheckConstraint("end_date >= start_date AND hours > 0", name="valid_proposal_terms"),
        CheckConstraint("academic_status IN ('pendiente', 'en_tramite', 'autorizacion_informada', 'no_requerida', 'denegada')", name="valid_academic_status"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="RESTRICT"), unique=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    hours: Mapped[int] = mapped_column(Integer)
    conditions: Mapped[str] = mapped_column(Text)
    company_name: Mapped[str] = mapped_column(Text)
    company_rut: Mapped[str | None] = mapped_column(Text)
    representative: Mapped[str] = mapped_column(Text)
    student_name: Mapped[str] = mapped_column(Text)
    student_email: Mapped[str] = mapped_column(Text)
    offer_title: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, server_default="pendiente")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    academic_status: Mapped[str] = mapped_column(Text, server_default="pendiente")
    academic_note: Mapped[str | None] = mapped_column(Text)
    academic_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    evidence: Mapped[bytes | None] = mapped_column(LargeBinary)
    evidence_sha256: Mapped[str | None] = mapped_column(Text)
    letter_html: Mapped[str | None] = mapped_column(Text)
    letter_issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ProposalEvent(Base):
    __tablename__ = "proposal_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    proposal_id: Mapped[int] = mapped_column(ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    action: Mapped[str] = mapped_column(Text)
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

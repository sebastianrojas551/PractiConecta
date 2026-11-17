import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator, model_validator


Role = Literal["estudiante", "empresa"]
Modality = Literal["presencial", "híbrida", "remota"]
ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150, pattern=r"^[^\x00]+$")]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1500, pattern=r"^[^\x00]+$")]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Login(Input):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class Register(Login):
    password: str = Field(min_length=12, max_length=128)
    role: Role
    nombre: ShortText


class Account(BaseModel):
    email: EmailStr
    role: Role
    model_config = ConfigDict(from_attributes=True)


class Profile(Input):
    model_config = ConfigDict(from_attributes=True)
    ciudad: ShortText | None = None
    region: ShortText | None = None


class StudentData(Profile):
    nombre: ShortText
    carrera: ShortText | None = None
    institucion: ShortText | None = None
    nivel: ShortText | None = None
    habilidades: LongText | None = None
    disponibilidad: LongText | None = None
    horas_objetivo: int | None = Field(default=None, gt=0, le=2147483647, strict=True)
    modalidad: Modality | None = None
    areas_interes: LongText | None = None


class CompanyData(Profile):
    representante: ShortText
    razon_social: ShortText | None = None
    rut: ShortText | None = None
    rubro: ShortText | None = None
    contacto: ShortText | None = None
    descripcion: LongText | None = None

    @field_validator("rut")
    @classmethod
    def validate_rut(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not re.fullmatch(r"(?:[1-9][0-9]{0,7}|[1-9][0-9]?\.[0-9]{3}\.[0-9]{3})-?[0-9Kk]", value):
            raise ValueError("RUT inválido")
        digits = value.replace(".", "").replace("-", "").upper()
        total = sum(int(digit) * (2 + index % 6) for index, digit in enumerate(reversed(digits[:-1])))
        expected = "0123456789K"[(11 - total % 11) % 11]
        if expected != digits[-1]:
            raise ValueError("RUT inválido")
        return f"{digits[:-1]}-{digits[-1]}"
from datetime import date
from typing import Literal

from pydantic import Field


class OfferInput(Input):
    title: ShortText
    area: ShortText
    description: LongText
    requirements: LongText
    city: ShortText | None = None
    region: ShortText | None = None
    modality: Modality
    hours: int = Field(gt=0, le=2147483647, strict=True)
    vacancies: int = Field(default=1, gt=0, le=10000, strict=True)
    benefits: LongText | None = None
    deadline: date | None = None


class OfferUpdate(OfferInput):
    status: Literal["publicada", "pausada", "cerrada"]


class OfferView(BaseModel):
    id: int
    company_id: int
    company_name: str
    title: str
    area: str
    description: str
    requirements: str
    city: str | None
    region: str | None
    modality: Modality
    hours: int
    vacancies: int
    benefits: str | None
    deadline: date | None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ApplicationCreate(Input):
    message: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1500)] | None = None


class ApplicationUpdate(Input):
    status: Literal["en_revision", "entrevista", "rechazada"]
    comment: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)] | None = None


class ApplicationView(BaseModel):
    id: int
    offer_id: int
    student_id: int
    message: str | None
    status: str
    created_at: datetime
    offer_title: str
    company_name: str
    student_name: str
    allowed_statuses: list[str]
    can_propose: bool
    can_withdraw: bool


class ApplicationEventView(BaseModel):
    previous_status: str | None
    next_status: str
    comment: str | None
    created_at: datetime
    actor_email: EmailStr


class ProposalInput(Input):
    start_date: date
    end_date: date
    hours: int = Field(gt=0, le=2147483647, strict=True)
    conditions: LongText

    @model_validator(mode="after")
    def valid_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("La fecha de término debe ser posterior o igual al inicio.")
        return self


class ProposalResponse(Input):
    status: Literal["aceptada", "rechazada"]


class AcademicInput(Input):
    status: Literal["pendiente", "en_tramite", "autorizacion_informada", "no_requerida", "denegada"]
    note: LongText | None = None

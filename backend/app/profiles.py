from fastapi import APIRouter, HTTPException

from .auth import CurrentUser, Database
from .models import CompanyProfile, StudentProfile, User
from .schemas import CompanyData, StudentData


router = APIRouter(prefix="/api/perfil", tags=["Perfil"])


def own_profile(db: Database, user: User, role: str, model: type[StudentProfile] | type[CompanyProfile]):
    if user.role != role:
        raise HTTPException(403, "Tu cuenta no tiene acceso a este tipo de perfil.")
    profile = db.get(model, user.id)
    if profile is None:
        raise HTTPException(404, "No encontramos tu perfil.")
    return profile


@router.get("/estudiante", response_model=StudentData)
def get_student(user: CurrentUser, db: Database):
    return own_profile(db, user, "estudiante", StudentProfile)


@router.put("/estudiante", response_model=StudentData)
def update_student(data: StudentData, user: CurrentUser, db: Database) -> StudentData:
    profile = get_student(user, db)
    for field, value in data.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    return data


@router.get("/empresa", response_model=CompanyData)
def get_company(user: CurrentUser, db: Database):
    return own_profile(db, user, "empresa", CompanyProfile)


@router.put("/empresa", response_model=CompanyData)
def update_company(data: CompanyData, user: CurrentUser, db: Database) -> CompanyData:
    profile = get_company(user, db)
    for field, value in data.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    return data

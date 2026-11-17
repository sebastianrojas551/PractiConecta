import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .db import get_db
from .models import CompanyProfile, LoginSession, StudentProfile, User
from .schemas import Account, Login, Register


router = APIRouter(prefix="/api/cuenta", tags=["Cuenta"])
Database = Annotated[Session, Depends(get_db)]
COOKIE = "practiconecta_session"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
SESSION_DURATION = timedelta(hours=12)
passwords = PasswordHasher()
dummy_hash = passwords.hash(secrets.token_urlsafe())


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def current_session(request: Request, db: Database) -> LoginSession:
    token = request.cookies.get(COOKIE)
    session = db.get(LoginSession, token_hash(token)) if token else None
    if session is None or session.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "Inicia sesión para continuar.")
    return session


def current_user(db: Database, session: Annotated[LoginSession, Depends(current_session)]) -> User:
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(401, "Inicia sesión para continuar.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def sign_in(user: User, request: Request, response: Response, db: Session) -> Account:
    now = datetime.now(UTC)
    db.execute(delete(LoginSession).where(LoginSession.expires_at <= now))
    previous_token = request.cookies.get(COOKIE)
    if previous_token:
        db.execute(delete(LoginSession).where(LoginSession.token_hash == token_hash(previous_token)))
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token_hash=token_hash(token), user_id=user.id, expires_at=now + SESSION_DURATION))
    account = Account.model_validate(user)
    db.commit()
    response.set_cookie(
        COOKIE, token, max_age=int(SESSION_DURATION.total_seconds()), path="/api",
        secure=COOKIE_SECURE, httponly=True, samesite="lax",
    )
    return account


@router.post("/registro", response_model=Account, status_code=201)
def register(data: Register, request: Request, response: Response, db: Database) -> Account:
    user = User(email=data.email.casefold(), role=data.role, password_hash=passwords.hash(data.password))
    db.add(user)
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        if getattr(error.orig.diag, "constraint_name", None) == "users_email_key":
            raise HTTPException(409, "Ya existe una cuenta con ese correo.") from error
        raise
    if data.role == "estudiante":
        db.add(StudentProfile(user_id=user.id, nombre=data.nombre))
    else:
        db.add(CompanyProfile(user_id=user.id, representante=data.nombre))
    return sign_in(user, request, response, db)


@router.post("/sesion", response_model=Account)
def login(data: Login, request: Request, response: Response, db: Database) -> Account:
    user = db.scalar(select(User).where(User.email == data.email.casefold()))
    stored_hash = user.password_hash if user else dummy_hash
    try:
        passwords.verify(stored_hash, data.password)
    except VerifyMismatchError:
        raise HTTPException(401, "El correo o la contraseña son incorrectos.") from None
    if user is None:
        raise HTTPException(401, "El correo o la contraseña son incorrectos.")
    if passwords.check_needs_rehash(stored_hash):
        user.password_hash = passwords.hash(data.password)
    return sign_in(user, request, response, db)


@router.delete("/sesion", status_code=204)
def logout(request: Request, db: Database) -> Response:
    token = request.cookies.get(COOKIE)
    if token:
        db.execute(delete(LoginSession).where(LoginSession.token_hash == token_hash(token)))
        db.commit()
    response = Response(status_code=204)
    response.delete_cookie(COOKIE, path="/api", secure=COOKIE_SECURE, httponly=True, samesite="lax")
    return response


@router.get("/yo", response_model=Account)
def whoami(user: CurrentUser) -> User:
    return user

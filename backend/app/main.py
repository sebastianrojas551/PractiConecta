import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text

from . import auth, offers, profiles, proposals
from .auth import Database


app = FastAPI(title="PractiConecta", docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(offers.router)
app.include_router(proposals.router)
origin = os.getenv("APP_ORIGIN", "http://localhost:5173")


@app.middleware("http")
async def protect_browser_requests(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.headers.get("origin") != origin:
        response = JSONResponse({"detail": "El origen de la solicitud no está autorizado."}, status_code=403)
    else:
        response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(RequestValidationError)
async def invalid_input(_request: Request, exc: RequestValidationError):
    messages = {
        "email": "Ingresa un correo válido.",
        "password": "Revisa la longitud de la contraseña.",
        "role": "Selecciona Estudiante o Empresa.",
        "rut": "Ingresa un RUT válido con su dígito verificador.",
        "horas_objetivo": "Ingresa un número entero positivo de horas.",
    }
    field = exc.errors()[0]["loc"][-1]
    return JSONResponse(
        {"detail": messages.get(field, "Revisa los campos obligatorios y el largo de los datos.")},
        status_code=422,
    )


@app.get("/api/salud")
def health(db: Database):
    db.execute(text("SELECT 1"))
    return {"estado": "disponible"}

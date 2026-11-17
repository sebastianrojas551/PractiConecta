# PractiConecta

Plataforma web abierta para **buscar, postular, realizar y documentar prácticas profesionales en Chile**, conectando estudiantes con empresas. Desarrollo académico incremental.

## Estado actual
**Código integrado localmente en `feat/PCT-14-integracion-aplicacion-local`, pendiente de publicación y revisión del equipo.** La copia de integración contiene FastAPI, React, PostgreSQL y Docker Compose. Pruebas locales reproducibles registradas en `AVANCE_PROYECTO.md`.

## Equipo
- Sebastián Rojas
- Francisco Cartes
- Nicolás Aburto (pendiente de incorporación a Jira)

## Tecnologías obligatorias
- Python + FastAPI + SQLAlchemy + Alembic — backend **existente según auditoría local de Codex**. Django REST Framework era la propuesta original del informe; decisión formal pendiente.
- React — frontend
- PostgreSQL — base de datos
- Docker + Docker Compose — servicios y entorno reproducible

## Cómo empezar con Codex
1. Abrir este repositorio desde Codex (o clonarlo con Git).
2. Leer `AGENTS.md`, `ESPECIFICACION_PractiConecta.md`, `PLAN_INCREMENTAL_JIRA.md` y `AVANCE_PROYECTO.md`.
3. Revisar la rama local de integración de PCT-14. No migrar FastAPI a Django sin decisión formal del equipo y del curso.
4. Registrar cada avance verificable en `AVANCE_PROYECTO.md` y enlazar commits/PR usando la clave `PCT-XX`.
5. Antes de publicar la rama, revisar los documentos conservados, `git status` y el resultado de las pruebas. Solicitar revisión del equipo.

## Enlaces
- [Repositorio](https://github.com/sebastianrojas551/PractiConecta)
- [Jira PractiConecta (PCT)](https://sebastianrojasgarces51-1794941515757.atlassian.net/jira/software/projects/PCT)

**Importante:** la empresa puede seleccionar y supervisar; la institución educativa mantiene la autorización y validación académica por canales externos. PractiConecta no emite aprobaciones universitarias ni certificados de seguro escolar oficiales.


## Ejecutar la aplicación local

Requisitos: Docker Desktop iniciado y Docker Compose disponible. Desde la raíz, crea `.env` a partir de `.env.example`, define `POSTGRES_PASSWORD` y ejecuta:

```powershell
docker compose up --build --wait
docker compose exec backend python -m pytest -q
docker compose exec backend python -m alembic check
docker compose exec frontend npm run build
```

Abre `http://localhost:5173`. La base PostgreSQL persiste en el volumen Compose `postgres_data`. Nunca agregues `.env`, credenciales o dependencias instaladas al repositorio.

La implementación actual cubre autenticación y perfiles de estudiante/empresa, publicación y búsqueda de ofertas, postulaciones y cambios de estado auditados. Aceptación de prácticas, seguimiento de horas, evaluación y expediente PDF siguen pendientes.

## Skills de diseño locales

Los tres skills de diseño se conservan instalados localmente en `.agents/skills/`, excluidos de Git mientras se verifican sus licencias y recursos necesarios. No son dependencias de ejecución de PractiConecta y no se incluyen al clonar el repositorio. No copiar sus demos o recursos al producto sin revisar previamente su procedencia y condiciones de uso.

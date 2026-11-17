# AVANCE_PROYECTO.md — Bitácora de desarrollo

Este archivo permite que Codex, GitHub y el chat de seguimiento de Jira compartan evidencia. **No registra ejecución automática ni confirma código que no se haya comprobado.**

## Estado inicial — 17/11/2026

- **Repositorio:** `sebastianrojas551/PractiConecta`, rama `main`.
- **Producto:** PractiConecta, plataforma abierta de prácticas profesionales en Chile.
- **Stack:** Python/Django REST Framework, React, PostgreSQL y Docker.
- **Gestión:** Jira PCT, 7 épicas y 32 historias.
- **Trabajo documental realizado:** se creó la especificación, las instrucciones para Codex y el plan incremental; PCT-11 contiene la auditoría documental del Jira PRAC anterior.
- **Desarrollo funcional nuevo:** no verificado aún. El repositorio fue inicializado únicamente con README y documentación.
- **Primera tarea técnica sugerida:** [PCT-14](https://sebastianrojasgarces51-1794941515757.atlassian.net/browse/PCT-14), entorno reproducible con Docker Compose.
- **Pendientes:** incorporar Nicolás a Jira, revisar código/Figma antiguos si existe acceso, ejecutar y verificar el entorno.

## Plantilla para actualizar en cada sesión de Codex

### AAAA-MM-DD — PCT-XX — Título breve
- **Responsable:** 
- **Rama / commit / PR:** 
- **Objetivo y alcance implementado:** 
- **Archivos modificados:** 
- **Pruebas ejecutadas y resultado:** [PASÓ / FALLÓ / NO EJECUTADO; comando y salida relevante]
- **Evidencia demostrable:** 
- **Errores o bloqueos:** 
- **Cambios en el alcance o decisiones:** 
- **Siguiente paso:** 
- **Estado de Jira observado o sugerido:** [no marcar Finalizado sin evidencia; no afirmar modificación automática]


### 2026-11-17 — PCT-14 — Integración local preparada
- **Responsable:** Sebastián Rojas / asistencia de Codex.
- **Rama / commit / PR:** `feat/PCT-14-integracion-aplicacion-local`; cambios locales sin commit ni push.
- **Objetivo y alcance implementado:** se clonó `main` autenticado en un directorio de integración separado, se creó una rama local y se incorporaron los directorios `backend/`, `frontend/`, Compose, variables de ejemplo y skills instalados. La carpeta original se mantuvo intacta.
- **Archivos modificados:** código de backend y frontend; `compose.yaml`, `.gitignore`, `.env.example`; este registro y `README.md`. Los documentos remotos `AGENTS.md`, `ESPECIFICACION_PractiConecta.md` y `PLAN_INCREMENTAL_JIRA.md` se conservaron.
- **Pruebas ejecutadas y resultado:** PASÓ `docker compose ... up --build --wait`; PASÓ `python -m pytest -q` (7 pruebas); PASÓ `alembic check`; PASÓ `npm run build`; PASÓ `GET /api/salud`. Se usó volumen de prueba independiente y el puerto 5174 porque la aplicación original ocupa 5173.
- **Evidencia demostrable:** rama local basada en `main` remoto `c7bd9979bc89b6853ac86560fe8d9b8e50e9fdf2`; Compose saludable en puerto 5174 durante la verificación.
- **Errores o bloqueos:** `httpx`/Starlette emite una advertencia de deprecación en `TestClient`; no bloquea las pruebas.
- **Cambios en el alcance o decisiones:** se mantiene FastAPI existente; la diferencia con la propuesta histórica Django REST Framework queda pendiente de confirmación del equipo/curso. Las skills se conservaron en `.agents/skills/` (1.696 archivos, aprox. 37,2 MB). No se incluyó `.env`, `.venv`, `node_modules`, `dist` ni cachés.
- **Siguiente paso:** revisar colisiones documentales, inspeccionar el diff y decidir si se publica esta rama tras aprobación del equipo.
- **Estado de Jira observado o sugerido:** PCT-14, integración preparada localmente y verificada. No se modificó Jira ni se hizo push.

### 2026-11-17 — PCT-14 — Preparación final para revisión previa a publicación
- **Responsable:** Sebastián Rojas / asistencia de Codex.
- **Rama / commit / PR:** `feat/PCT-14-integracion-aplicacion-local`; sin commit ni publicación.
- **Alcance:** se excluyeron del índice los tres skills completos mediante `.gitignore`, conservando sus 1.696 archivos localmente. Licencias y selección de recursos pendientes. Se preservaron el original y el respaldo. No se cambió la lógica de aplicación ni el stack.
- **Archivos:** 35 rutas preparadas: backend (18), frontend (12), Compose, ejemplo de entorno, exclusiones, README y esta bitácora. Documentos remotos restantes conservados.
- **PASÓ:** PostgreSQL y backend saludables sobre un volumen nuevo del proyecto Compose `practiconecta-p14-revision`; arranque con `alembic upgrade head`; `alembic current` = `0002 (head)`; `alembic check` = `No new upgrade operations detected.`; `python -m pytest -q` = 7 aprobadas; `npm run build` = TypeScript y Vite correctos.
- **Comandos reproducibles:** prefijo `docker compose --project-name practiconecta-p14-revision --env-file ../PractiConecta/.env`; ejecutar con ese prefijo `up --build --wait backend`, `exec -T backend python -m pytest -q`, `exec -T backend alembic current`, `exec -T backend alembic check` y `run --build --rm --no-deps frontend npm run build`. El archivo de entorno original se usó únicamente para configurar los contenedores; no se copió al repositorio.
- **Seguridad/formato:** chequeo del índice sin rutas de secretos, bases de datos ni dependencias generadas. Escaneo heurístico: solo literales ficticios de contraseña en tests; no credenciales reales detectadas. `git diff --cached --check` limpio tras excluir los skills; sus archivos originales no fueron alterados.
- **Advertencia:** deprecación httpx/Starlette en TestClient, no bloqueante. No se evaluó nuevamente la interfaz en navegador ni se afirma cobertura completa del MVP.
- **Pendientes:** aprobación de revisión, configurar identidad Git con correo privado, commit, publicación de rama y PR. No se modificó Jira ni se hizo merge. Después de integrar, revisar PCT-26 a PCT-29 sobre lo existente para selección, aceptación e inicio de práctica, sin reconstruir funciones disponibles.

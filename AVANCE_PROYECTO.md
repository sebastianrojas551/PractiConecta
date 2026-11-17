# AVANCE_PROYECTO.md — Bitácora de desarrollo

Este archivo permite que Codex, GitHub y el chat de seguimiento de Jira compartan evidencia. **No registra ejecución automática ni confirma código que no se haya comprobado.**

## Estado actual

Código publicado en `feat/PCT-14-integracion-aplicacion-local` mediante el commit `f22825306a71167765ded38dcf1d1640f800a3db`. [PR #1 abierto](https://github.com/sebastianrojas551/PractiConecta/pull/1), pendiente de merge y revisión del equipo. Las entradas siguientes preservan el estado histórico de cada sesión.

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

### 2026-11-17 — PCT-14 — Correcciones de revisión del PR #1
- **Responsable:** Sebastián Rojas / asistencia de Codex.
- **Rama / PR:** `feat/PCT-14-integracion-aplicacion-local`; https://github.com/sebastianrojas551/PractiConecta/pull/1. Ajustes autorizados para publicar en la misma rama, sin merge ni nuevas tareas Jira.
- **Cambios:** README y estado actual de esta bitácora actualizados; transiciones compartidas por la API con el selector React; controles de fecha límite inclusiva en Santiago, preservando fechas históricas; pruebas de estados finales, rechazos sin eventos adicionales, retiro, plazos y catálogo.
- **PASÓ:** `python -m pytest -q`: 32 pruebas, una advertencia de deprecación httpx/Starlette. `alembic upgrade head` durante el arranque; `alembic current`: 0002 (head); `alembic check`: sin diferencias. `npm run build`: TypeScript y Vite correctos. Sin cambios de esquema ni nuevas dependencias.
- **Persistencia PASÓ:** en el proyecto Docker aislado `practiconecta-p14-revision` se insertaron y confirmaron un usuario ficticio y su perfil en PostgreSQL. Se consultó un digest de ambos registros, se ejecutó `docker compose ... restart db backend` seguido de `up --wait backend`, y se repitió la consulta. El digest fue idéntico (`5676408531a7f5c759c8a960179f0b7a`); ambos servicios saludables. Solo se eliminaron después los registros ficticios de esta comprobación. No se tocó el volumen de la aplicación original.
- **Reproducción de pruebas:** usar `docker compose -p practiconecta-p14-revision --env-file ../PractiConecta/.env` seguido de `up --build --wait backend`, `exec -T backend python -m pytest -q`, `exec -T backend alembic current`, `exec -T backend alembic check` y `run --build --rm --no-deps frontend npm run build`.
- **Límites:** no se ejecutaron pruebas automatizadas de navegador; frontend comprobado por revisión de opciones alimentadas por la API y compilación. Persistencia comprobada para usuario/perfil tras reinicio de los servicios, no ante eliminación de volúmenes. No se afirma cobertura completa del MVP.

### 2026-11-17 — PCT-14 — Comprobación de navegador previa al merge
- Edge headless mediante Playwright, entorno aislado en localhost:5174 y datos ficticios: registro, cierre e inicio de sesión de empresa/estudiante, publicación, postulación y consulta de candidatos PASARON.
- Se detectó y corrigió el acceso a `event.currentTarget` después de un await al publicar; se conserva la referencia al formulario antes de la solicitud. Repetición completa PASÓ. Compilación TypeScript/Vite PASÓ.
- Evidencia reproducible: `scripts/browser_smoke.py` (Playwright en entorno de pruebas, Edge instalado, aplicación de prueba en puerto 5174; capturas en `.local-check/`). No añade dependencias de ejecución a la aplicación.
- Autorización del usuario: fusionar PR #1 conservando commits una vez superada esta comprobación. Sin tareas Jira nuevas ni cambios al original/respaldo.

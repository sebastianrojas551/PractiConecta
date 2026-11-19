# AVANCE_PROYECTO.md — Bitácora de desarrollo

Este archivo permite que Codex, GitHub y el chat de seguimiento de Jira compartan evidencia. **No registra ejecución automática ni confirma código que no se haya comprobado.**

## Estado actual

El PR #1 fue fusionado a `main` con merge commit `dddae72e2cb72599846a1005dbf2bc3002b53a29`, conservando los commits originales. La copia de integración se actualizó por fast-forward y se creó `feat/PCT-26-propuestas-aceptacion` desde ese `main`. El nuevo incremento queda sujeto a revisión independiente; no se fusiona automáticamente. Las entradas siguientes preservan el estado histórico de cada sesión.

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

### 2026-11-17 — PCT-26 a PCT-29 — Propuesta, aceptación y documentos
- **Base y rama:** `main` en `dddae72`; rama nueva `feat/PCT-26-propuestas-aceptacion`. PR #1 fusionado con autorización después de superar el navegador; original y respaldo intactos.
- **Jira consultado:** PCT-26 selección y condiciones; PCT-27 respuesta exclusiva del estudiante con fecha; PCT-28 declaración y respaldo privado; PCT-29 carta empresarial identificando emisor. Responsables observados: PCT-27 Sebastián Rojas, PCT-28 Francisco Cartes Vallejos; PCT-26 y PCT-29 sin asignar. No se modificaron campos ni se crearon tareas.
- **Implementación:** FastAPI y React reutilizados; propuestas con condiciones/identidades conservadas, fechas y horas variables; respuesta definitiva; autorización externa independiente; PDF privado limitado a 2 MiB; carta empresarial HTML descargable e imprimible emitida exclusivamente por la empresa; auditoría de acciones. Migración 0003 y permisos por vínculo.
- **Reglas:** una propuesta por postulación; se bloquean transiciones y retiro posteriores, con bloqueo de fila para serializar decisiones concurrentes. No hay práctica activa automática ni validación académica oficial. La carta no contiene firma inventada. El respaldo se entrega como adjunto, con comprobación básica PDF, sin afirmar validación documental o antivirus.
- **Backend PASÓ:** 49 pruebas (incluyen 32 previas), permisos/aislamiento de documentos existentes, estados finales, entradas inválidas, respaldo limitado, emisión idempotente, contenido HTML escapado e historial. Una advertencia conocida de TestClient/httpx.
- **Migraciones PASÓ:** instalación sobre PostgreSQL de prueba nuevo; upgrade 0002→0003 sobre volumen existente; downgrade 0003→0002 y upgrade head en volumen de tests vacío; current = 0003 (head); alembic check sin diferencias.
- **Frontend/navegador PASÓ:** compilación TypeScript/Vite; Edge headless con scripts/browser_proposals.py completó registro/login de ambos roles, publicación, postulación, propuesta, aceptación, respaldo, declaración y descarga de carta. Se corrigieron dos selectores ambiguos del script durante su preparación. Se verificó que la opción Retirar desaparece al actualizar propuestas. Se corrigió contraste de botones secundarios sobre tarjetas para que su texto sea legible.
- **Persistencia PASÓ:** reinicio real de db, backend y frontend en proyecto aislado practiconecta-p14-revision; cuatro propuestas de prueba, incluidas respuestas, PDF y HTML guardados, conservaron el digest agregado `f6408e61310aaf88ee6da63fae71f38f`. Servicios saludables después del reinicio.
- **Reproducción:** README documenta pruebas de navegador aisladas; pytest y alembic check se ejecutaron con `docker compose -p practiconecta-p26-tests --env-file ../PractiConecta/.env exec -T backend ...`. No se copiaron secretos ni datos de usuario reales.
- **Hallazgo pendiente:** npm audit reportó cuatro entradas altas heredadas por picomatch/fdir/tinyglobby/Vite; audit --omit=dev = 0. No se alteraron dependencias de aplicación ni se aplicó el downgrade mayor sugerido. Playwright solo se instaló en un entorno de comprobación aislado.
- **Límites y siguiente paso:** carta HTML imprimible, sin generador PDF de servidor; respaldo verificado estructuralmente de forma básica; no hay edición/renegociación de propuestas. Revisión del nuevo PR antes de merge. PCT-30 y actualización visual con skills permanecen para etapas posteriores.

- **PR de revisión:** https://github.com/sebastianrojas551/PractiConecta/pull/2 (abierto, sin merge).

### 2026-11-17 — PCT-43 — Rediseño integral del frontend
- **Responsable:** equipo PractiConecta / asistencia de Codex. Jira PCT-43 permanece En curso; no se crearon ni actualizaron historias.
- **Rama/base:** `feat/PCT-43-redisenio-integral`, creada en worktree nuevo desde el commit actual del PR #2 (`81f603e`). PR #2 y PR #3 permanecen intactos y abiertos. El nuevo cambio queda apilado sobre PCT-26–29 hasta que el equipo revise e integre esa dependencia.
- **Alcance implementado:** Tailwind CSS v4 con el plugin oficial de Vite; rutas reales para portada pública, catálogo, ingreso/registro, espacio estudiante/empresa y propuestas; buscador y ofertas consultadas a la API; componentes reutilizables de estado vacío, carga, avisos, etiquetas y diálogos nativos; actualización visual de perfil, ofertas y propuesta/aceptación; navegación móvil, foco visible, saltar al contenido, mensajes accesibles y `prefers-reduced-motion`. No hubo cambios en FastAPI, reglas de negocio, PostgreSQL ni esquema.
- **Dirección visual:** Bricolage Grotesque + DM Sans; verde pino, marfil y lima moderado; composición editorial con ofertas reales; las ofertas de prueba usadas en la captura llevan nombre explícito de prueba. Sin métricas, testimonios o empresas de muestra como contenido de producto. Los tres skills locales no se añadieron al commit.
- **PASÓ:** `npm run build` (TypeScript y Vite) en host y en imagen Docker. `pytest -q`: 49 pruebas aprobadas, una advertencia de deprecación de Starlette/httpx. `alembic check`: sin operaciones nuevas; Compose aislado levantó db/backend/frontend saludables y aplicó migraciones durante el arranque.
- **PASÓ en navegador (Microsoft Edge / Playwright, datos ficticios en volumen aislado):** home pública, exploración y filtros sin sesión, registro de empresa y estudiante, publicación, postulación, selección y propuesta, aceptación, declaración separada de autorización académica externa y emisión de carta empresarial. Las rutas por rol redirigen a su panel autorizado. Home, catálogo y paneles revisados a 390, 768, 1024 y 1440 px, sin desbordamiento horizontal; se comprobó el menú móvil. Capturas locales en `.local-check/pct43-home-desktop.png`, `.local-check/pct43-home-mobile-390.png` y `.local-check/pct43-company-view-1440.png` (no se versionan).
- **PASÓ:** `.agents/skills/impeccable/scripts/impeccable doctor --target frontend --json` informó `findings: []`; regla de registro disponible. Se activó el hook local durante la preparación; revisar confianza/reconocimiento con `/hooks` si Codex aún no lo detecta.
- **npm audit:** cuatro hallazgos altos en dependencias de desarrollo (fdir, picomatch, tinyglobby y Vite), relacionados con picomatch ReDoS hasta 4.0.7. `npm audit --omit=dev`: 0 vulnerabilidades. La corrección automática disponible propone Vite 6.2.7 con cambio SemVer major; no se aplicó esa migración ni se alteró el stack.
- **Pendiente de revisión:** inspección del equipo de identidad/navegación y del PR apilado; validación final en otros dispositivos reales. Las capturas y el servidor local son de comprobación, no un despliegue público. Sin cambios de backend ni migración de datos.
- **PR:** [#4 — PCT-43: Rediseño integral del frontend](https://github.com/sebastianrojas551/PractiConecta/pull/4), abierto, contra `feat/PCT-26-propuestas-aceptacion` y limpio según GitHub. Es dependiente del PR #2; no se fusionó ni se cambió su base a `main`.
- **Commit:** `baae0cc` — `PCT-43: Rediseñar la experiencia completa de PractiConecta`.

### 2026-11-17 — PCT-22 y PCT-23 — Edición de ofertas y filtro por modalidad
- **Rama / PR:** `feat/PCT-43-redisenio-integral`, ajustes sobre el PR #4 existente, apilado sobre el PR #2. PR #2 y PR #4 continúan abiertos; PR #3 no se integró. Sin merge ni historias Jira nuevas.
- **PCT-22 implementado:** el panel empresarial permite editar una oferta con el endpoint existente `PUT /api/ofertas/{id}`. El formulario carga los datos guardados, conserva el estado actual, incluye fecha límite, modalidad, horas, vacantes y demás campos, y presenta confirmación/error. El backend mantiene el control de rol y propiedad.
- **PCT-23 implementado:** el catálogo muestra modalidad presencial, híbrida o remota y envía el filtro al endpoint existente. Palabra clave, región y modalidad quedan en la URL; al recargar se restauran y “Limpiar filtros” restablece controles, resultados y URL. En detalles, las empresas ven retorno a sus ofertas; las acciones de postular se limitan a estudiantes y visitantes.
- **Backend y esquema:** no fue necesario modificar lógica, migraciones ni dependencias de ejecución. Se agregó prueba de API que cubre actualización, filtro con el valor guardado y rechazo de modificación por otra empresa.
- **PASÓ backend:** `python -m pytest -q` = 50 aprobadas; una advertencia ya conocida de deprecación Starlette/httpx. `python -m alembic check` = `No new upgrade operations detected.`
- **PASÓ frontend:** `npm run build` = TypeScript y Vite correctos. `git diff --check` sin errores de formato.
- **PASÓ navegador:** Microsoft Edge con Playwright y datos ficticios, usando Compose y PostgreSQL aislados: registro de empresa, publicación, edición y guardado; registro de estudiante; filtro por modalidad/región con sincronización de URL y recarga, restablecimiento; estudiante conserva Postular y empresa no ve acciones estudiantiles. Catálogo revisado a 390, 768, 1024 y 1440 px sin desbordamiento horizontal.
- **Evidencia local no versionada:** `.local-check/pct22-modal-edicion-1440.png`, `.local-check/pct23-filtros-movil-390.png`, `.local-check/pct23-filtros-escritorio-1440.png`.
- **Limitación de verificación:** el aislamiento de propiedad entre empresas se comprobó mediante prueba de API; el navegador verificó los flujos de empresa y estudiante y la visibilidad de sus acciones.
- **Integración:** publicado en el mismo PR #4 con los commits `a2dd9d1` (implementación y pruebas) y el commit de registro de esta actualización. PR #4 sigue abierto contra `feat/PCT-26-propuestas-aceptacion`; PR #2 también sigue abierto. PR #3 no se integró y no se modificó el backend de producción.
### 2026-11-19 — PCT-28 — Integridad del respaldo de autorización
- **Rama:** `feat/PCT-26-propuestas-aceptacion`, PR #2. Fix publicado en `d1d318c`.
- **Hallazgo bloqueante:** `/api/propuestas/{id}/respaldo` restringía la descarga a las dos cuentas vinculadas y guardaba SHA-256 al cargar, pero no comparaba ese hash al servir los bytes. Una alteración posterior en base de datos podía descargarse sin aviso.
- **Corrección:** la ruta autenticada compara SHA-256 antes de responder; si falta el hash o no coincide, devuelve error y no entrega los bytes. Añadí una prueba que corrompe el respaldo almacenado y verifica rechazo para estudiante y empresa vinculados. Se conserva el mismo flujo de carga, estado académico y autorización externa declarada.
- **PASÓ:** `python -m pytest -q`: 50 pruebas (una advertencia conocida de Starlette/httpx); `alembic current`: 0003 (head); `alembic check`: sin operaciones nuevas. `git diff --check`: limpio.
- **Alcance:** no hubo cambios frontend ni migraciones. No se modificaron las ramas fuente de PR #3, #4 ni #5; PR #4 y #5 todavía deben actualizarse/retargetearse después de integrar PR #2 para quitar los cambios heredados de sus diffs.
- **Pendiente:** revisión de equipo del fix y del orden de integración. No se hizo merge ni se crearon tareas Jira.

### 2026-11-19 — Integración y revalidación de PR #4
- **PR #2 integrado:** merge commit `3045e54381e4cf50f95609e23130c92ea15e4463` en `main`, preservando el historial.
- **Actualización de PR #4:** se integró `main` en `feat/PCT-43-redisenio-integral`. El conflicto de `AVANCE_PROYECTO.md` quedó resuelto conservando completas las entradas históricas PCT-43 y PCT-28; README combinó automáticamente la actualización de integridad del respaldo.
- **PASÓ:** backend: 51 pruebas; una advertencia conocida Starlette/httpx. Alembic: `0003 (head)` y `alembic check` sin diferencias. Frontend: `npm run build` (TypeScript/Vite).
- **PASÓ en Edge/Playwright con datos ficticios:** editar oferta con PUT, filtros de modalidad sincronizados con URL, visibilidad de acciones por rol, portada pública, registro, publicación, postulación, propuesta, aceptación, declaración académica externa y carta empresarial. Viewports 390/768/1024/1440 sin overflow.
- **Estado:** PR #4 sigue abierto, retargeteado a `main`, pendiente de revisión del equipo. PR #5 sigue abierto y depende de PR #4 actualizado. PR #3 no se integró. No se crearon tareas Jira ni se hizo merge de PR #4.

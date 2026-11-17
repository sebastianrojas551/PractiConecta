# PractiConecta

Plataforma web abierta para **buscar, postular, realizar y documentar prácticas profesionales en Chile**, conectando estudiantes con empresas. Desarrollo académico incremental.

## Estado actual
**La aplicación base está integrada en `main` mediante el [PR #1](https://github.com/sebastianrojas551/PractiConecta/pull/1), fusionado conservando sus commits.** El incremento PCT-26 a PCT-29 sigue en el [PR #2](https://github.com/sebastianrojas551/PractiConecta/pull/2), abierto y sin fusionar. Este rediseño se prepara en `feat/PCT-43-redisenio-integral`, basado en el commit actual del PR #2 para mantener los flujos de propuestas mientras ese incremento espera revisión. No modifica ni fusiona los PR #2 o #3. Resultados reales en `AVANCE_PROYECTO.md`.

## Equipo
- Sebastián Rojas
- Francisco Cartes
- Nicolás Aburto (pendiente de incorporación a Jira)

## Tecnologías obligatorias
- Python + FastAPI + SQLAlchemy + Alembic — backend existente y comprobado con pruebas locales. Django REST Framework era la propuesta original del informe; decisión formal pendiente.
- React — frontend
- PostgreSQL — base de datos
- Docker + Docker Compose — servicios y entorno reproducible

## Cómo empezar con Codex
1. Abrir este repositorio desde Codex (o clonarlo con Git).
2. Leer `AGENTS.md`, `ESPECIFICACION_PractiConecta.md`, `PLAN_INCREMENTAL_JIRA.md` y `AVANCE_PROYECTO.md`.
3. Revisar la rama de integración PCT-14 y el estado de los PR enlazados. No migrar FastAPI a Django sin decisión formal del equipo y del curso.
4. Registrar cada avance verificable en `AVANCE_PROYECTO.md` y enlazar commits/PR usando la clave `PCT-XX`.
5. El PR #1 está fusionado. El PR #2 y la propuesta visual previa del PR #3 siguen abiertos; revisar dependencias y no integrar sus ramas a `main` automáticamente.

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

La implementación actual cubre autenticación y perfiles de estudiante/empresa, publicación y búsqueda de ofertas, postulaciones y cambios de estado auditados. El PR #2 añade propuesta, aceptación/rechazo, autorización externa informada y carta empresarial. La rama PCT-43 conserva esos flujos e incorpora navegación pública, catálogo, acceso y paneles con una identidad visual unificada. Práctica activa/seguimiento de horas (PCT-30 en adelante), evaluación y expediente PDF siguen pendientes.

## Skills de diseño locales

Los tres skills de diseño se conservan instalados localmente en `.agents/skills/`, excluidos de Git mientras se verifican sus licencias y recursos necesarios. No son dependencias de ejecución de PractiConecta y no se incluyen al clonar el repositorio. No copiar sus demos o recursos al producto sin revisar previamente su procedencia y condiciones de uso.

## Postulaciones y fechas límite

La empresa puede pasar de enviada a en revisión, entrevista o rechazada; de en revisión a entrevista o rechazada; y de entrevista a rechazada. Rechazada y retirada son estados finales. El estudiante puede retirar una postulación enviada, en revisión o en entrevista. La API informa las transiciones disponibles y el frontend muestra esas opciones.

La fecha límite incluye todo el día indicado en `America/Santiago`. Las ofertas vencidas se excluyen del catálogo público y la API rechaza nuevas postulaciones con HTTP 409, incluso desde una pantalla abierta previamente. Sin fecha límite, una oferta publicada permanece disponible. La empresa conserva acceso a sus ofertas vencidas. Se mantiene la representación histórica de la fecha en la base de datos, sin migración de esquema.

## Propuesta y aceptación — PCT-26 a PCT-29

1. La empresa completa razón social, RUT y representante en Mi perfil. Desde Ver postulaciones elige Preparar propuesta para un candidato elegible.
2. Indica inicio, término, horas y condiciones (funciones, horario, modalidad, lugar y beneficios). La propuesta conserva una copia de esos datos y de las identidades declaradas.
3. El estudiante consulta Propuestas de práctica y acepta o rechaza. La respuesta queda fechada y es definitiva. Hay una propuesta por postulación; no se permiten cambios paralelos ni retiro de esa postulación después de emitirla. Renegociación/cancelación posterior queda fuera de este incremento.
4. Tras aceptar, el estudiante puede adjuntar un PDF privado de hasta 2 MiB y declarar por separado el estado académico externo. Informar autorización requiere respaldo; reemplazarlo devuelve la declaración a En trámite. Solo el estudiante y la empresa vinculada pueden descargarlo.
5. La empresa emite la carta después de la aceptación. Ambos pueden descargar el HTML imprimible y usar Imprimir/Guardar como PDF del navegador. La carta guardada no cambia al editar perfiles; no contiene firmas ficticias ni se presenta como validación académica.

La migración `0003` agrega propuestas y su historial. Los respaldos binarios y las cartas se almacenan en PostgreSQL y persisten en su volumen. Las descargas requieren sesión, son adjuntos privados y no tienen URLs públicas. La carga comprueba tamaño, tipo declarado y marcadores básicos PDF; no certifica autenticidad, validez documental ni ausencia de contenido malicioso. No se muestran PDFs incrustados. La carta HTML evita una dependencia adicional para generar documentos y escapa los datos aportados por usuarios.

## Comprobaciones de navegador

Usar un proyecto y volumen de prueba separados: los scripts generan cuentas y ofertas ficticias. Requieren Microsoft Edge instalado y Playwright en un entorno de pruebas (no es dependencia de la aplicación):

```powershell
python -m venv .local-check/browser-venv
.local-check/browser-venv/Scripts/python -m pip install -r scripts/requirements-browser.txt
docker compose -p practiconecta-browser --env-file .env -f compose.yaml -f scripts/compose.browser.yaml up --build --wait
.local-check/browser-venv/Scripts/python -X utf8 scripts/browser_smoke.py
.local-check/browser-venv/Scripts/python -X utf8 scripts/browser_proposals.py
```

El override publica únicamente localhost:5174 y ajusta el origen permitido. Las capturas y la carta descargada quedan en `.local-check/`, excluida de Git. Ejecutar pytest sobre una base de prueba separada sin esos datos de navegador; algunas pruebas existentes esperan un catálogo vacío antes de crear sus fixtures.

## Hallazgos de dependencias

Durante esta revisión, `npm audit` informó cuatro entradas de severidad alta asociadas a picomatch (GHSA-fc5q-39xc-vjpf) y sus dependientes fdir/tinyglobby/Vite, presentes en las dependencias de desarrollo heredadas. `npm audit --omit=dev` no informó vulnerabilidades. No se aplicó la degradación mayor de Vite sugerida por la herramienta; requiere revisión separada. El servidor Vite sigue siendo de desarrollo, expuesto en loopback por Compose.

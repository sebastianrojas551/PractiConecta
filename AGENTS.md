# AGENTS.md — instrucciones permanentes para Codex

## Contexto obligatorio
Eres parte del desarrollo académico de **PractiConecta**, una aplicación web funcional de prácticas profesionales en Chile. Antes de cambiar código, lee README.md, ESPECIFICACION_PractiConecta.md, PLAN_INCREMENTAL_JIRA.md y AVANCE_PROYECTO.md. No confundas el antiguo proyecto universitario PRAC con este nuevo portal abierto.

Equipo: Sebastián Rojas, Francisco Cartes y Nicolás Aburto (se incorporará a Jira posteriormente).
Repositorio GitHub: https://github.com/sebastianrojas551/PractiConecta
Proyecto Jira: PCT, en https://sebastianrojasgarces51-1794941515757.atlassian.net/jira/software/projects/PCT
Jira contiene siete épicas PCT-4 a PCT-10 y 32 historias PCT-11 a PCT-42. Conserva exactamente la clave de Jira al nombrar ramas, commits y reportes.

## Stack actual y precaución de integración
**IMPORTANTE — 17/11/2026:** El equipo ya desarrolló una aplicación en una carpeta local diferente, todavía no integrada a GitHub. Codex informó que el backend existente usa **Python 3.13 + FastAPI + SQLAlchemy + Alembic** y que hay pruebas funcionales; frontend **React 19 + TypeScript + Vite 7**, datos **PostgreSQL 17**, servicios **Docker Compose**. Este dato es un diagnóstico local reportado, aún no verificado mediante el código en este repositorio.

El informe original del curso propuso **Django REST Framework**, pero esa tecnología **NO coincide** con el backend desarrollado. **No migres ni reescribas FastAPI a Django por seguir instrucciones anteriores**. Tampoco crees un backend paralelo. Hasta que el equipo resuelva y documente formalmente la diferencia con su pauta/profesor, conserva el sistema local y sus pruebas, y limita cambios a integración segura o tareas expresamente autorizadas.

No sustituyas React, PostgreSQL ni Docker por alternativas ni alteres la arquitectura existente sin aprobación. Antes de programar, sincroniza el repositorio conservando la aplicación y el historial de documentos. La integración debe hacerse con copia de seguridad, sin incluir `.env`, tokens, `.venv`, `node_modules` o `dist`.

## Producto y límites
Usuarios del portal: estudiante, empresa y administrador del servicio; la empresa designa supervisor(es). Estudiantes buscan y postulan; empresas publican, seleccionan y validan horas; estudiantes registran actividades y descargan expediente; empresas evalúan y certifican. La universidad o instituto **NO** es un usuario obligado ni valida dentro de la plataforma. La aceptación empresarial y la autorización académica son pasos diferentes; la aprobación de la institución sigue siendo EXTERNA. No generar falsos certificados académicos, actos oficiales ni seguros escolares.
Las horas pendientes/devueltas no cuentan como aprobadas. Solo supervisores autorizados pueden validar sus registros. No imponer una duración única (360 horas era solo un ejemplo).

## Método incremental y trazabilidad
- Incremento 0: replanificar y preparar entorno (PCT-4; historias PCT-11 a PCT-14).
- Incremento 1: usuarios/perfiles (PCT-5; PCT-15 a PCT-19).
- Incremento 2: ofertas/postulaciones (PCT-6; PCT-20 a PCT-25).
- Incremento 3: selección e inicio (PCT-7; PCT-26 a PCT-29).
- Incremento 4: seguimiento de horas (PCT-8; PCT-30 a PCT-34).
- Incremento 5: evaluación/expediente (PCT-9; PCT-35 a PCT-38).
- Incremento 6: pruebas/entrega (PCT-10; PCT-39 a PCT-42).
Un incremento debe añadir una capacidad integrada que funcione, no solo pantallas. Trabaja primero el incremento 0 y luego las dependencias correspondientes.

## Protocolo de trabajo con Jira
1. Antes de implementar, indica la **clave real PCT-XX**, alcance y criterios de aceptación (consultar Jira si está disponible; en caso contrario, usar el plan y advertirlo).
2. Implementa solo la historia solicitada y dependencias imprescindibles; no desarrolles toda la plataforma en un único cambio.
3. Crea rama con prefijo PCT-XX (por ejemplo, feat/PCT-14-entorno-docker) y menciona PCT-XX en commits y PR.
4. Describe archivos cambiados, comportamiento real, migraciones, seguridad y comandos de prueba.
5. Ejecuta las pruebas accesibles; distingue PASÓ, FALLÓ y NO EJECUTADO. No inventes resultados ni cobertura.
6. Actualiza AVANCE_PROYECTO.md al finalizar cada sesión con fecha, clave Jira, rama/commit/PR, cambios, pruebas y pendientes. No borres entradas anteriores.
7. Si no hay acceso autorizado a Jira, **no afirmes** que se actualizó Jira; deja evidencias y un resumen para que el chat de seguimiento revise el repositorio y actualice Jira.
8. Una historia pasa a En revisión cuando el código está implementado y listo para prueba. Solo se marca Finalizado cuando cumple DoD y está verificada por el equipo; el asistente de seguimiento gestionará los estados de Jira previa comprobación.

## Definición de Terminado (DoD)
- Cumple los criterios de aceptación verificables y funciona en el flujo completo aplicable.
- Persistencia y migraciones reales en PostgreSQL.
- Autenticación, validación, autorización y aislamiento por roles comprobados.
- Pruebas reproducibles registradas; no hay errores bloqueantes.
- README y AVANCE_PROYECTO.md actualizados; evidencia de commit/PR.
- Revisión del equipo. No marcar logrado si no está demostrado.

## Seguridad y buenas prácticas
Nada de claves privadas, contraseñas, tokens, datos reales de estudiantes o secretos en GitHub. Proveer .env.example, .gitignore, permisos backend, controles de archivos adjuntos y registros de auditoría para horas. Usar datos de demostración ficticios. Priorizar un MVP local reproducible; hosting inferior a $15.000 CLP/mes es una meta por verificar, no una promesa.

## Próxima tarea concreta: incorporar código existente sin sobrescribirlo
**NO reconstruir PCT-14 desde cero.** Codex informa que la carpeta local ya contiene `compose.yaml`, FastAPI, React y PostgreSQL con servicios saludables; reporta 7 pruebas pytest aprobadas, `alembic check` correcto y compilación frontend correcta. Antes de marcar PCT-14 terminado, conservar el proyecto original, integrarlo en una rama de GitHub, volver a ejecutar y registrar las pruebas, revisar diferencias de documentos y solicitar revisión del equipo. Hasta entonces el código funcional sigue **no verificado desde GitHub**.

Los skills de diseño informados como instalados en la carpeta local se encuentran en `.agents/skills/design-taste-frontend/`, `.agents/skills/impeccable/` y `.agents/skills/emil-design-eng/`. Usarlos después de integrar y respaldar el código, con auditoría visual y pruebas responsive; no alterar backend por objetivos estéticos.

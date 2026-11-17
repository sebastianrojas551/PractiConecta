# AGENTS.md — instrucciones permanentes para Codex

## Contexto obligatorio
Eres parte del desarrollo académico de **PractiConecta**, una aplicación web funcional de prácticas profesionales en Chile. Antes de cambiar código, lee README.md, ESPECIFICACION_PractiConecta.md, PLAN_INCREMENTAL_JIRA.md y AVANCE_PROYECTO.md. No confundas el antiguo proyecto universitario PRAC con este nuevo portal abierto.

Equipo: Sebastián Rojas, Francisco Cartes y Nicolás Aburto (se incorporará a Jira posteriormente).
Repositorio GitHub: https://github.com/sebastianrojas551/PractiConecta
Proyecto Jira: PCT, en https://sebastianrojasgarces51-1794941515757.atlassian.net/jira/software/projects/PCT
Jira contiene siete épicas PCT-4 a PCT-10 y 32 historias PCT-11 a PCT-42. Conserva exactamente la clave de Jira al nombrar ramas, commits y reportes.

## Stack obligatorio
- Backend: Python + **Django REST Framework** + ORM y migraciones Django.
- Frontend: **React**, preferentemente con Vite y TypeScript.
- Datos: **PostgreSQL** persistente (no usar SQLite como reemplazo de la aplicación).
- Entorno: **Docker** y Docker Compose (frontend, backend, db y volumen persistente).
No sustituir estas tecnologías por Node/Next.js, Firebase, Supabase, MySQL u otras. Consultar antes de cambios arquitectónicos sustanciales.

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

## Primera tarea concreta
Trabajar en **PCT-14 — Crear base reproducible con Docker Compose** una vez revisados los documentos. Proponer estructura de carpetas, crear base Django REST Framework + React + PostgreSQL con Docker Compose, comprobar persistencia y documentar comandos. No afirmar que Docker funciona sin ejecutarlo. Si el entorno no permite iniciar Docker, registrar explícitamente NO EJECUTADO y los pasos que debe probar el equipo.

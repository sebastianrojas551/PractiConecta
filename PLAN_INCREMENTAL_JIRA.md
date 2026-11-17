# PLAN_INCREMENTAL_JIRA.md — PractiConecta

**Proyecto Jira:** [PCT](https://sebastianrojasgarces51-1794941515757.atlassian.net/jira/software/projects/PCT)  
**Método:** desarrollo incremental, tablero Kanban.  
**Equipo:** Sebastián Rojas, Francisco Cartes y Nicolás Aburto (pendiente de incorporación en Jira).  
**Estado inicial:** planificación creada; no equivale a software implementado.

## Incrementos y claves reales

| Incremento | Épica | Historias | Entregable verificable |
|---|---|---|---|
| I0 — Replanificación y entorno | PCT-4 | PCT-11 a PCT-14 | Requisitos revisados, Jira ordenado y entorno Docker reproducible |
| I1 — Cuentas y perfiles | PCT-5 | PCT-15 a PCT-19 | Estudiante y empresa registran e inician sesión con roles persistidos |
| I2 — Ofertas y postulaciones | PCT-6 | PCT-20 a PCT-25 | Empresa publica, estudiante filtra y postula; empresa consulta candidaturas |
| I3 — Selección e inicio | PCT-7 | PCT-26 a PCT-29 | Selección, aceptación y respaldo académico externo informado |
| I4 — Seguimiento | PCT-8 | PCT-30 a PCT-34 | Horas registradas y verificadas por supervisor con auditoría |
| I5 — Evaluación y expediente | PCT-9 | PCT-35 a PCT-38 | Evaluación empresarial y PDF para validación institucional externa |
| I6 — Calidad y entrega | PCT-10 | PCT-39 a PCT-42 | Pruebas de permisos, flujo extremo a extremo, demo y documentación |

## Tareas del incremento 0
- **PCT-11 — Revisar historial de Jira y código existente:** Sebastián. La revisión documental del CSV PRAC se registró en Jira el 17-11-2026; falta revisión del repositorio antiguo y del prototipo Figma. **Estado observado: En curso**.
- **PCT-12 — Definir alcance y criterios del MVP:** Nicolás (sin asignar hasta que ingrese). Se dispone de especificación inicial; falta validación de equipo.
- **PCT-13 — Organizar Jira con épicas e historias nuevas:** Francisco. Épicas, historias, dependencias y asignación parcial creadas; falta revisión conjunta y limpieza de las 3 tareas de muestra PCT-1, PCT-2 y PCT-3.
- **PCT-14 — Crear base reproducible con Docker Compose:** Sebastián. **Primera tarea técnica de Codex**. No se ha verificado ninguna ejecución todavía.

## Orden inicial de desarrollo y dependencias
- PCT-14 → PCT-15 → PCT-16.
- PCT-18 + PCT-21 → PCT-24 → PCT-26 → PCT-30 → PCT-31 → PCT-32 → PCT-33 → PCT-36 → PCT-37.
- Las dependencias de Jira representan bloqueos técnicos propuestos, no fecha de terminación.

## Reglas de avance
1. **Por hacer:** sin implementación comprobada.
2. **En curso:** desarrollo activo; describir qué se hizo y qué falta.
3. **En revisión:** desarrollo integrado, listo para pruebas/revisión; evidencias disponibles.
4. **Finalizado:** criterios de aceptación cumplidos y verificados; demostrar funcionalidad y enlazar commit/PR.

La documentación anterior puede conservarse como referencia, pero no acredita software funcionando. No traducir Story Points a horas automáticamente. Las estimaciones iniciales están en las historias porque Jira aún no ofrece el campo Story Points en este proyecto.

## Roles propuestos
Sebastián: 10 historias; Francisco: 10 historias; Nicolás: 12 historias reservadas sin asignar. **No redistribuir ni asumir cuentas** sin indicación del equipo. Los administradores del proyecto gestionan membresías.

## Definición de terminado (DoD)
Criterios de aceptación verificados; código en GitHub; cambios y pruebas registrados en AVANCE_PROYECTO.md; persistencia PostgreSQL y permisos validados cuando apliquen; documentación actualizada; sin defectos bloqueantes; revisión del equipo y evidencia enlazada a Jira.

## Registro de cambio de alcance
El informe anterior proponía un sistema vinculado a una universidad con docentes/jefatura, cartas oficiales, notas y actas. La replanificación actual transforma el producto en portal abierto de estudiantes/empresas, con validación académica **fuera de la aplicación**, manteniendo el stack y el método incremental. El Jira PRAC anterior se preserva como antecedente; PCT-11 documenta la revisión.

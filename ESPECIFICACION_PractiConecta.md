# PractiConecta — Especificación funcional

Versión: 1.3 | Fecha de replanificación: 17 de noviembre de 2026
Estado: requisitos académicos propuestos para desarrollo incremental, aún sujetos a validación del equipo.

## 1. Visión y problema
PractiConecta será una **plataforma web funcional y abierta** a estudiantes de diferentes instituciones chilenas y a empresas que ofrecen prácticas profesionales. No es una bolsa exclusiva de una universidad. Centraliza búsqueda, publicación de vacantes, postulación, selección, aceptación, documentación, horas, evaluaciones y expedientes de cierre.

Objetivo: un flujo real y demostrable de principio a fin con cuentas separadas y datos persistidos; no solo maquetas. El producto no reemplaza a la universidad en autorizar o calificar prácticas curriculares.

## 2. Usuarios y permisos

### Estudiante
Crear cuenta/iniciar sesión; gestionar perfil, institución, carrera, semestre, habilidades, disponibilidad, CV y horas requeridas; buscar y filtrar ofertas; guardar y enviar postulaciones; ver estados; aceptar propuesta de práctica; informar el estado de su autorización académica externa y cargar respaldo cuando corresponda; consultar y registrar actividades/horas; corregir registros devueltos; consultar horas aprobadas; descargar constancias/expediente; informar resultado académico externo sin que la plataforma lo certifique.

### Empresa
Registro y perfil corporativo; datos de razón social/RUT para verificación; publicar, editar, pausar y cerrar ofertas con requisitos, funciones, horario, duración, ubicación/modalidad y beneficios; consultar candidatos de sus propias ofertas; organizar su selección y propuesta; aceptar practicantes; asignar responsable supervisor con permisos limitados; aprobar/devolver registros de horas con comentarios y trazabilidad; evaluar desempeño; confirmar cierre y emitir documentos empresariales. Una empresa no puede consultar los datos de otra.

### Administrador de plataforma
Gestionar/moderar empresas, reportes y ofertas problemáticas; revisar incidentes y datos limitados; controles de seguridad y auditoría. No es un académico ni puede emitir aprobaciones universitarias. Las acciones privilegiadas deben estar controladas.

### Universidad o instituto
**No requiere cuenta ni integración técnica**. El estudiante gestiona las aprobaciones académicas por los canales de su institución; la institución puede exigir aprobación previa, formatos propios, seguimiento e informe final. La plataforma proporciona respaldo, nunca certifica por sí misma aprobación oficial.

## 3. Proceso end-to-end
1. Empresa se registra y publica una oferta.
2. Estudiante se registra, completa perfil, busca y postula.
3. Empresa evalúa candidaturas y selecciona; estudiante acepta la propuesta.
4. Antes de iniciar una práctica curricular, estudiante verifica requisitos institucionales y tramita aprobación externa; registra estado y documento cuando corresponda. La plataforma **no debe confundir** aceptación de empresa con autorización académica.
5. Con las condiciones y requisitos cumplidos, se activa el seguimiento de la práctica; se configuran fechas y horas exigidas (variables según institución/carrera).
6. Estudiante registra fecha, tiempo, actividad y observaciones. El registro inicia Pendiente.
7. Supervisor autorizado de la empresa Aprueba o Devuelve con motivo. Horas Pendientes o Devueltas no se contabilizan como aprobadas. Se conserva historial de cambios.
8. Se calcula progreso usando únicamente horas aprobadas.
9. Al completar requisitos se registra evaluación del supervisor y la empresa emite constancia y cierre empresarial.
10. Se genera expediente PDF con registros validados, evaluación y documentos reales, disponible para entregar **externamente** a institución. Resultado académico informado se muestra como tal, sin afirmación de aprobación oficial.

## 4. Entidades de datos mínimas
Usuario, PerfilEstudiante, Empresa, UsuarioEmpresa/RolSupervisor, Oferta, Postulacion, Propuesta/Aceptacion, Practica, DocumentoPrivado/AutorizacionInformada, RegistroHoras, RevisionHoras, EvaluacionEmpresarial, Constancia y EventoAuditoria. Persistencia PostgreSQL, claves externas y migraciones versionadas. Archivos privados protegidos; nunca URL pública irrestricta.

## 5. Reglas esenciales
- Un usuario únicamente lee/modifica lo permitido por sus roles y vinculaciones en la API.
- La postulación es distinta de la práctica activa.
- Duración/horas, modalidad, fechas, formatos y requisitos son configurables.
- Autorización académica: registrada/informada por estudiante, NO verificada automáticamente por la app.
- Hora aprobada: suma al progreso solo tras decisión autorizada. Devolución contiene motivo y permite corrección con auditoría.
- El expediente indica emisor real de cada documento; no inventa firmas ni resolución académica.
- La empresa es quien confirma sus registros y evaluación; la institución conserva sus atribuciones.
- El artículo 8 del Código del Trabajo y el seguro escolar requieren respetar el proceso institucional aplicable; no afirmar que la app formaliza automáticamente beneficios o cobertura.
- Datos personales, CV y evaluaciones requieren controles de privacidad y retención conforme normas aplicables.

## 6. Funcionalidades priorizadas
**P0 / MVP obligatorio:** autenticación y roles; registro y perfil estudiante/empresa; oferta y catálogo; postulación y revisión; aceptación y registro de autorización externa; práctica activa; horas + aprobación/devolución; progreso calculado; evaluación y constancia empresarial; expediente PDF; pruebas de permisos y flujo integrado.

**P1 / deseable:** favoritos, filtros adicionales, notificaciones, paneles de seguimiento, moderación ampliada y formularios variables por institución.

**P2 / fuera de primera entrega:** chat interno, recomendaciones de IA, firma electrónica avanzada, app móvil nativa, integración automática con universidades, notas y actas académicas oficiales, procesos de pago o nómina.

## 7. Diseño y navegación
React web adaptable a móvil. Rutas principales: inicio/catálogo; registro/inicio de sesión; perfil estudiante; mis postulaciones; mis prácticas; bitácora de horas; archivos de cierre; panel empresa; ofertas y candidatos; supervisión de horas; evaluación; administración. Formularios con estados visibles, validaciones accesibles, navegación clara y errores comprensibles en español.

## 8. Arquitectura y despliegue
Backend Python + Django REST Framework y ORM; frontend React + Vite (TypeScript recomendado); PostgreSQL; Dockerfiles y Docker Compose con servicio de base de datos y volumen. Seguridad en backend: permisos y autenticación, validación de cargas, límites de archivos, hash de contraseñas y protección de documentación. Usar .env.example sin secretos. Test backend + test integrados; README reproducible. Preferir código abierto. Hosting estimado menor a 15.000 CLP/mes es **objetivo**, a verificar antes de afirmar viabilidad económica.

## 9. Aceptación del MVP
Demostración con datos ficticios de dos cuentas separadas: empresa publica; estudiante postula; empresa selecciona; estudiante acepta y registra autorización externa (informada, no oficial); estudiante registra horas; supervisor aprueba/devuelve; progreso considera solo aprobadas; empresa evalúa; estudiante descarga expediente. Reiniciar contenedores no borra registros. Una segunda empresa o estudiante no accede a datos ajenos.

## 10. Continuidad con el proyecto PRAC anterior
Los antecedentes históricos del CSV PRAC incluyen análisis de negocio/RACI, factibilidad, riesgos, prototipo Figma, API en revisión, cartas PDF en revisión y bitácoras en curso. Pueden ser referencias, pero el estado histórico no comprueba que el nuevo sistema tenga código funcional reutilizable. El cambio de alcance elimina dependencia de docente/jefatura y actas académicas; mantiene metodología incremental y stack inicial. No borrar la evidencia histórica. Ver el acta y Jira PCT-11.

## 11. Fuente de verdad y gestión
La especificación define el producto; PLAN_INCREMENTAL_JIRA.md contiene claves reales y prioridades de trabajo; Jira PCT define la responsabilidad/estado de gestión; GitHub contiene código y pruebas; AVANCE_PROYECTO.md registra qué pasó en cada sesión. Si hay contradicción, identificarla, documentarla y solicitar decisión antes de implementarla.

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
La especificación original proyectó Python + Django REST Framework, pero **el diagnóstico local de Codex del 17/11/2026 informa una implementación existente en Python 3.13 + FastAPI + SQLAlchemy + Alembic**, con React 19 + TypeScript + Vite 7, PostgreSQL 17 y Docker Compose. Este diagnóstico aún debe corroborarse tras integrar el código local en GitHub. **No migrar automáticamente a Django** ni perder pruebas o datos; el equipo debe documentar el cambio de framework y verificar su conformidad con las exigencias del curso. Mantener Dockerfiles, Docker Compose con base de datos y volumen. Seguridad en backend: permisos y autenticación, validación de cargas, límites de archivos, hash de contraseñas y protección de documentación. Usar .env.example sin secretos. Test backend + test integrados; README reproducible. Preferir código abierto. Hosting estimado menor a 15.000 CLP/mes es **objetivo**, a verificar antes de afirmar viabilidad económica.

## 9. Aceptación del MVP
Demostración con datos ficticios de dos cuentas separadas: empresa publica; estudiante postula; empresa selecciona; estudiante acepta y registra autorización externa (informada, no oficial); estudiante registra horas; supervisor aprueba/devuelve; progreso considera solo aprobadas; empresa evalúa; estudiante descarga expediente. Reiniciar contenedores no borra registros. Una segunda empresa o estudiante no accede a datos ajenos.

## 10. Continuidad con el proyecto PRAC anterior
Los antecedentes históricos del CSV PRAC incluyen análisis de negocio/RACI, factibilidad, riesgos, prototipo Figma, API en revisión, cartas PDF en revisión y bitácoras en curso. Pueden ser referencias, pero el estado histórico no comprueba que el nuevo sistema tenga código funcional reutilizable. El cambio de alcance elimina dependencia de docente/jefatura y actas académicas; mantiene metodología incremental y stack inicial. No borrar la evidencia histórica. Ver el acta y Jira PCT-11.

## 11. Fuente de verdad y gestión
La especificación define el producto; PLAN_INCREMENTAL_JIRA.md contiene claves reales y prioridades de trabajo; Jira PCT define la responsabilidad/estado de gestión; GitHub contiene código y pruebas; AVANCE_PROYECTO.md registra qué pasó en cada sesión. Si hay contradicción, identificarla, documentarla y solicitar decisión antes de implementarla.

## Postulaciones y antecedentes documentales — PCT-24 y PCT-25

La postulación se envía contra los requisitos declarados en la oferta. Por defecto se exige CV en PDF; la empresa puede dejar de solicitarlo, requerir carta de presentación y configurar hasta cinco documentos adicionales con nombre propio. Cada documento adicional configurado se considera obligatorio para esa oferta. La oferta informa esos requisitos antes de iniciar la postulación. Las ofertas creadas antes de 0004 se migran con CV no requerido, carta no requerida y sin documentos adicionales, para conservar su comportamiento anterior. Las postulaciones anteriores conservan su estado, mensaje y asociaciones; su perfil enviado se representa como vacío (`{}`), la carta nueva como nula y no se crean documentos retrospectivamente. No solicitar autorización académica ni seguro escolar como antecedentes universales de postulación inicial.

Antes de confirmar, el estudiante revisa una copia de su perfil y la lista y contenido que enviará. La API compara la copia revisada con el perfil persistido para impedir que una revisión antigua o manipulada quede confirmada. Si cambió, debe actualizar la revisión. El perfil enviado se conserva como fotografía de esa postulación y no cambia cuando el estudiante edita su perfil después. La carta de presentación puede escribirse en la plataforma (hasta 5.000 caracteres) o adjuntarse como PDF, eligiendo una sola forma. Esta carta, escrita por el estudiante, es distinta de la carta de aceptación emitida por la empresa en PCT-29.

Los archivos aceptados son PDF (`application/pdf`) con extensión `.pdf`, firma inicial `%PDF-` y marcador `%%EOF` en el tramo final. Límite actual: 5 MiB por archivo, hasta siete archivos por envío y 20 MiB de solicitud/antecedentes totales. Los documentos binarios se guardan en PostgreSQL con asociación a postulación, persona que subió, tipo, nombre, tamaño, hash SHA-256 y versión. Antes de cada descarga, la API vuelve a comprobar tamaño y SHA-256 almacenados. La respuesta de la API expone metadatos, nunca el contenido binario. Las cargas se realizan en una transacción junto al alta de postulación y su evento inicial; un fallo de validación no deja una postulación parcial. La validación estructural no comprueba autenticidad, legibilidad, malware ni validez oficial del PDF.

Solo el estudiante postulante y la empresa propietaria de la oferta pueden consultar la candidatura y descargar sus documentos. Las rutas de archivo requieren sesión, validan asociación entre documento y postulación, entregan como adjunto y no publican enlaces anónimos. Estudiantes solo consultan sus propias postulaciones; empresas consultan las candidaturas de sus propias ofertas. Se conservan las transiciones y eventos auditables existentes; no se añade una transición de estado ni un flujo separado de subsanación. Las empresas no pueden elegir estados rechazados por las reglas actuales. La prevención de postulaciones duplicadas y el plazo de la oferta continúan aplicándose.

### Formalización posterior — PCT-30

Al formalizar una práctica activa, y solo después de una propuesta elegible aceptada, se incorporará una checklist que permita declarar por separado la autorización académica externa, los requisitos informados por la institución y la situación/documento del seguro escolar cuando corresponda. Se debe identificar quién entrega cada antecedente y su estado declarado, manteniendo archivos privados y permisos. PractiConecta no emite, activa, verifica ni certifica cobertura del seguro ni autorización oficial. La carta de aceptación empresarial no inicia por sí sola una práctica activa y no reemplaza la gestión externa.

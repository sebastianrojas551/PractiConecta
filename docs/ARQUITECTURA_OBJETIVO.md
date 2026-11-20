# Arquitectura objetivo de PractiConecta

> **Estado:** especificación técnica objetivo para PCT-44. La implementación de esta arquitectura debe comprobarse antes de actualizar las instrucciones vigentes de ejecución o fusionarla en `main`.

## Stack

- **Aplicación web:** React + Next.js App Router + TypeScript.
- **Backend:** Route Handlers y servicios de servidor Next.js sobre Node.js. No se describe React como lenguaje de backend.
- **Diseño:** Tailwind CSS, manteniendo la experiencia y componentes visuales existentes.
- **Persistencia:** PostgreSQL con Prisma ORM y migraciones versionadas.
- **Ejecución local:** Node.js/npm + una instancia PostgreSQL local o gestionada, sin Docker ni servicios Python.

## Alcance funcional que debe conservarse

1. Registro, autenticación, sesiones revocables y permisos por rol (`estudiante` y `empresa`).
2. Perfiles de estudiante y empresa, con validación de datos y aislamiento entre cuentas.
3. Publicación, edición, pausa, cierre, búsqueda y filtrado de ofertas; vencimiento al término del día en Chile.
4. Postulaciones y transiciones auditables; revisión del perfil antes de postular, CV PDF, carta redactada/PDF y requisitos adicionales.
5. Adjuntos privados en PostgreSQL: metadatos, límites y descarga autorizada con comparación de tamaño y SHA-256. Conservar los bytes originales.
6. Selección empresarial, propuesta, aceptación/rechazo definitivo, respaldo académico externo declarado y carta empresarial separada.
7. Mantener los límites del producto: la institución valida fuera de la plataforma y PractiConecta no emite ni certifica autorizaciones ni coberturas de seguro escolar.

## Compatibilidad y datos

- Mantener los contratos de la API `/api/**` o proporcionar compatibilidad equivalente para que no se rompa la interfaz durante el reemplazo.
- Replicar tablas, relaciones, restricciones, estados e índices de la base existente, incluidas las migraciones hasta `0004` y los documentos binarios.
- Inspeccionar y establecer una **línea base** de Prisma de la base existente: no recrear tablas ni aplicar migraciones destructivas sobre PostgreSQL que ya contenga datos.
- Respaldar y comprobar restauración de PostgreSQL antes de pruebas de migración; usar bases y credenciales ficticias aisladas. No copiar archivos personales ni secretos al repositorio.
- Comprobar compatibilidad o rotación controlada de hashes de contraseñas y sesiones: no forzar cierres de sesión ni invalidar cuentas silenciosamente sin decidirlo y documentarlo.
- Conservar el historial de eventos, integridad documental y condiciones de propuestas.

## Reglas de seguridad

- Autorización en el **servidor** para cada ruta y documento; nunca basarse únicamente en ocultar botones de React.
- Verificar a cada acceso titularidad de ofertas, postulaciones, propuestas, sesiones y documentos.
- Mantener límite de 5 MiB por PDF de postulación, máximo siete adjuntos y 20 MiB por solicitud, además de controles básicos MIME/extensión/estructura PDF; no afirmar que equivalen a un escáner antivirus.
- Evitar cachear respuestas personalizadas o binarias privadas en recursos públicos.
- Mantener escapado/saneamiento de contenido HTML en cartas empresariales.

## Estrategia de implementación

1. Crear la aplicación Next.js/TypeScript en esta rama **sin modificar `main`**. Mantener los servicios anteriores solo como referencia técnica temporal, sin activarlos para el producto final.
2. Levantar Prisma contra una copia de PostgreSQL, modelar datos existentes y establecer la línea base segura.
3. Portar autenticación, roles y sesiones con pruebas equivalentes.
4. Portar ofertas, búsquedas, postulaciones y documentos; verificar trazabilidad y permisos.
5. Portar propuestas, aceptación y respaldo académico privado.
6. Adaptar la interfaz React y Tailwind a las rutas de Next.js y ejecutar el flujo completo sin Python ni Docker.
7. Sustituir las instrucciones vigentes de README, especificación y agentes cuando el reemplazo funcione. Retirar archivos de ejecución Python/Docker solo tras verificar equivalencia, sin reescribir el historial de Git.
8. Ejecutar pruebas backend, build, pruebas de navegador móvil/escritorio, validación de persistencia y restauración; someter a revisión de equipo antes del merge.

## Criterio de cierre

`npm install`, la configuración de `DATABASE_URL`, la migración segura del esquema cuando corresponda, `npm run dev`, `npm run build` y `npm test` deben poder ejecutarse **sin Python ni Docker**. Todos los flujos de I0–I3 deben seguir funcionando y contar con cobertura de seguridad. Solo entonces fusionar el PR y adaptar las tareas futuras de I4–I6.

## Trazabilidad

PCT-44 registra la arquitectura objetivo. No se alteran los registros históricos de Jira ni los commits ya fusionados. La documentación del estado final describe las tecnologías realmente presentes y verificadas en ese momento.

# PCT-43 — Renovación visual

## Dirección aplicada

Identidad editorial, cálida y profesional: verde pino, tarjetas marfil sobre un lienzo salvia claro y tipografía de lectura del sistema con titulares serif. Se unificaron controles, formularios, navegación, estados de foco, tarjetas, espaciados y comportamiento en pantallas estrechas. Las transiciones son discretas y respetan `prefers-reduced-motion`.

La aplicación sigue usando React/TypeScript, CSS propio y los flujos FastAPI existentes. No se añadió una librería ni se cambió la lógica de negocio. Para evitar editar archivos compartidos con PCT-26–29, el tema vive en `frontend/src/visual-identity.css`, enlazado desde `frontend/index.html`.

## Componentes preservados

Autenticación y selección de rol, formularios de perfiles, catálogo y filtros de ofertas, publicación, postulaciones, consulta empresarial y sus mensajes/estados. El alcance visual corresponde a la versión de `main` usada como base de la rama; la rama PCT-26 a PCT-29 sigue separada y pendiente de revisión del equipo. Al integrarla, se deberá aplicar el mismo sistema a sus pantallas y volver a comprobar todos los flujos.

## Verificación

- `npm run build`: PASÓ (TypeScript y Vite 7.3.8).
- Navegador Edge/Playwright, datos ficticios: registro y login de estudiante/empresa, publicación, postulación y consulta de candidaturas: PASÓ.
- Viewports 390×844, 768×1024, 1024×768 y 1440×900: PASÓ, sin desbordamiento horizontal.
- Capturas locales no versionadas: `.local-check/pct43-mobile.png`, `.local-check/pct43-desktop.png`, `.local-check/pct43-company.png`, `.local-check/pct43-student.png`.

## Dependencias

`npm audit` presenta cuatro hallazgos altos (Vite, fdir, tinyglobby y picomatch) por [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). El advisory marca a picomatch `<=4.0.7` afectado y no publica versión corregida. Vite 7.3.8 requiere `picomatch ^4.0.3`; el registro npm consultado solo ofrece hasta 4.0.7. El arreglo automático propone Vite 6.2.7 como cambio mayor hacia atrás, no aplicado. `npm audit --omit=dev` no reporta vulnerabilidades. No existe hoy una actualización transitive que quite el hallazgo sin una versión corregida upstream; reevaluar en cuanto se publique, manteniendo Vite 7 y probando audit/build/navegador. Evaluar cualquier migración mayor de Vite por separado, nunca como arreglo automático sin revisar impacto.

## Ejecución local aislada

Con Docker Desktop activo y `.env` preparado en la copia local original:

```powershell
docker compose -p practiconecta-pct43-final --env-file ..\PractiConecta\.env -f compose.yaml -f scripts\compose.pct43.yaml up --build --wait
```

El sitio queda en `http://localhost:5175`. Para frontend build: `docker compose -p practiconecta-pct43-final --env-file ..\PractiConecta\.env -f compose.yaml -f scripts\compose.pct43.yaml exec -T frontend npm run build`. Los scripts de navegador requieren Microsoft Edge y Playwright en el entorno local de pruebas.

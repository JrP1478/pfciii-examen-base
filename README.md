# Terminal Pesquero de Chorrillos · PFC III Tipo F

React + TypeScript + Vite, Supabase Auth/PostgreSQL, Vitest y GitHub Actions.
Node.js 24. Trabajar exclusivamente en `test`.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Alcance

- `src/features/auth`: login con cuenta prehabilitada, recuperación de sesión y cierre local.
- `src/features/arrivals`: registro validado; confirma guardado únicamente al recibir la fila de Supabase.
- `src/features/public-query`: consulta sin login de hasta 50 arribos y 100 ofertas publicados, filtro por especie y actualización manual/polling.
- `src/features/species-prices`: selección de hasta 100 arribos propios recientes, creación y edición de sus ofertas (hasta 100 recientes por arribo).
- `src/lib/supabase`: configuración pública y cliente único.
- `src/app`: composición y estilos responsive.

Estado de arribo: `expected` (estimado) o `arrived` (confirmado, exige hora real no futura).
La publicación es independiente mediante `is_published`; los borradores no son públicos.
Las horas del formulario y listado son de Lima (UTC−05:00).
Las ofertas admiten especie, cantidad disponible en kg (hasta 3 decimales), precio por kg
en PEN (hasta 2 decimales) y publicación. Para retirar disponibilidad, despublicar la oferta;
la cantidad debe seguir siendo positiva según el esquema existente. Una oferta solo es
pública si también lo es su arribo. La consulta pública usa filtros explícitos de ambos
campos incluso si el visitante tiene sesión de propietario; RLS sigue siendo la autorización.
No se incluye edición de arribos en UI, eliminación ni paginación.
Las políticas sí permiten actualizar filas propias y prohíben eliminar mediante el API.
La identidad propietaria y las fechas de auditoría se asignan en PostgreSQL.

## Esquema existente y configuración

Este incremento no cambia SQL ni RLS. No volver a ejecutar la migración en el proyecto
que ya la tiene aplicada. Los pasos 1–3 solo describen la instalación inicial en un proyecto nuevo;
las verificaciones de este repositorio no demuestran acceso al proyecto Supabase real.

1. En el proyecto Supabase de destino, abrir **SQL Editor → New query**.
2. Copiar y ejecutar completo `supabase/migrations/202611210001_arrivals.sql` una sola vez.
   La migración es transaccional; no usa `IF NOT EXISTS` para ocultar diferencias de esquema.
   Si falla, corregir la causa antes de reintentar; no borrar tablas con información existente.
3. Confirmar en **Table Editor** las tablas `arrivals` y `arrival_offers`.
   En SQL Editor ejecutar:
   ```sql
   select relname, relrowsecurity, relforcerowsecurity
   from pg_class join pg_namespace n on n.oid = relnamespace
   where n.nspname = 'public' and relname in ('arrivals', 'arrival_offers');
   select tablename, policyname, cmd
   from pg_policies where schemaname = 'public'
     and tablename in ('arrivals', 'arrival_offers');
   ```
   Ambas tablas deben tener RLS habilitada y forzada, y cuatro políticas cada una.
4. En **Authentication → Sign In / Providers**, mantener email/password y desactivar
   **Allow new users to sign up** y acceso anónimo. No se ofrece registro en la aplicación.
   Usar cuentas prehabilitadas; si faltan, el administrador las crea en
   **Authentication → Users → Add user**, con email confirmado y contraseña propia.
5. Para habilitar exclusivamente las cuentas de pescador aprobadas, copiar su UUID de Users.
   Ejecutar como administrador en SQL Editor, sustituyendo el marcador por el UUID aprobado:
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"role":"fisher"}'::jsonb
   where id = '<UUID_PESCADOR_APROBADO>'::uuid
   returning id;
   ```
   Debe devolver una fila. Repetir solo para las cuentas aprobadas; cerrar y volver a iniciar
   sesión para recibir los claims nuevos. `user_metadata` nunca concede este permiso.
6. Copiar `.env.example` a `.env.local`. Completar localmente `VITE_SUPABASE_URL`
   (HTTPS) y `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`) desde el proyecto;
   reiniciar Vite. No enviar claves, tokens ni contraseñas por chat.
   Toda variable `VITE_` es pública: nunca usar claves administrativas.
   La presencia de variables no demuestra conectividad.
7. Vercel: Node.js 24, build `npm run build`, salida `dist`; configurar las mismas variables
   públicas en el entorno correspondiente. No hay despliegue verificado en este incremento.

Referencias oficiales: [Auth](https://supabase.com/docs/guides/auth/general-configuration),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Comprobación manual del flujo real

En el proyecto de pruebas autorizado, usar dos cuentas prehabilitadas A y B con rol
`fisher`; emplear únicamente información autorizada o datos identificados como pruebas.

1. Sin variables: comprobar avisos de falta de configuración y ausencia de datos simulados.
2. Con configuración y migración aplicadas: login de A; verificar error con contraseña errónea,
   éxito con contraseña correcta, persistencia de sesión al recargar y cierre de sesión.
3. Como A registrar embarcación, estimada y estado. Marcar publicación y guardar.
   Solo aceptar como éxito el mensaje con UUID; comprobar esa fila en Table Editor.
   Probar también llegada confirmada con su hora real y un borrador sin publicar.
4. En ventana privada sin sesión: actualizar el listado; el publicado debe aparecer,
   mostrando estimada y confirmada por separado. El borrador debe estar ausente.
5. Para comprobar autorización de B sin confiar en React, reemplazar los marcadores
   en este bloque del SQL Editor por el UUID de B y el arribo publicado de A:
   ```sql
   begin;
   select set_config('request.jwt.claims', jsonb_build_object(
     'sub', '<UUID_B>', 'role', 'authenticated',
     'app_metadata', jsonb_build_object('role', 'fisher')
   )::text, true);
   set local role authenticated;
   update public.arrivals set vessel_name = 'PRUEBA_NO_DEBE_GUARDARSE'
   where id = '<UUID_ARRIBO_A>'::uuid returning id;
   rollback;
   ```
   Debe devolver cero filas. B tampoco debe poder insertar una oferta para A:
   ejecutar en otra transacción el mismo bloque de claims/rol y luego:
   ```sql
   insert into public.arrival_offers
     (arrival_id, species_name, quantity_kg, price_per_kg)
   values ('<UUID_ARRIBO_A>'::uuid, 'PRUEBA_NO_DEBE_GUARDARSE', 1, 1);
   ```
   Debe fallar por RLS. Ejecutar `rollback;` tras el error.
6. Sin sesión no hay formulario de escritura. Para probar la denegación como visitante:
   ```sql
   begin;
   set local role anon;
   insert into public.arrivals (vessel_name, estimated_arrival_at)
   values ('PRUEBA_NO_DEBE_GUARDARSE', now());
   ```
   Debe fallar por permisos; ejecutar `rollback;` tras el error.
   Con una cuenta sin rol `fisher`, el INSERT debe fallar por RLS.
7. Interrumpir la conexión y actualizar: debe aparecer error, no una lista vacía presentada como éxito.

## Ofertas: trazabilidad y comprobación manual

| Historia | Implementación | Pruebas específicas |
| --- | --- | --- |
| PFCEX-10 | `species-prices/SpeciesPrices.tsx`, `OfferEditor.tsx`, `model.ts`, `api.ts` | `species-prices/model.test.ts`, `api.test.ts`, `SpeciesPrices.test.tsx`: creación, selección propia, validación y errores |
| PFCEX-11 | `species-prices/OfferEditor.tsx`, `api.ts` | Mismos tests: edición, despublicación, cancelación y denegación; `lib/supabase/postgres.test.ts`: escritura ajena, constraints y RLS |
| PFCEX-13 | `public-query/PublicQuery.tsx`, `species-prices/api.ts` | `public-query/PublicQuery.test.tsx`: lectura anónima, flujo publicar/editar/retirar, errores, polling y limpieza; `postgres.test.ts`: borradores y arribo privado |
| PFCEX-14 | `public-query/PublicQuery.tsx`, `species-prices/api.ts` | `PublicQuery.test.tsx` y `api.test.ts`: filtro de especie, comodines literales, limpieza y estado vacío; `postgres.test.ts`: lectura filtrada |

Rutas relativas a `src/features/`, salvo `src/lib/supabase/postgres.test.ts`.
No se añadieron dependencias ni se modificó la migración ya aplicada.

Con las cuentas autorizadas A/B y una ventana privada:

1. Como A, seleccionar un arribo propio; crear una oferta con información autorizada,
   cantidad positiva y precio en soles. Probar borrador y después editar para publicarla.
   Aceptar el guardado solo tras la confirmación con UUID y verificar la fila en Supabase.
2. En ventana privada, comprobar especie, kg, precio y embarcación. Filtrar por la especie
   y por un texto sin coincidencias; limpiar el filtro. Un arribo privado no debe mostrar ofertas.
3. Como A, editar especie, cantidad y precio. La consulta de otra ventana debe reflejar
   los cambios con **Actualizar avisos** o tras el siguiente polling. Despublicar debe retirarla.
4. Como B, no debe aparecer el arribo de A en el selector. Para verificar la autorización SQL,
   usar la transacción de claims de B descrita arriba y ejecutar:
   `update public.arrival_offers set price_per_kg=1 where id='<UUID_OFERTA_A>'::uuid returning id;`
   Debe devolver cero filas; terminar con `rollback;`. No cambiar datos operativos para esta prueba.
5. Probar cantidad/precio cero, negativos y exceso de decimales: la UI debe rechazarlos.
   Simular pérdida de conexión: debe aparecer error y no confirmación de éxito.

La consulta pública programa un polling **30 segundos después de terminar la consulta
anterior**, omite ciclos con la pestaña oculta y conserva actualización manual. No es tiempo
real: al desmontar o cambiar filtro se cancela el temporizador y se abortan peticiones previas.

## Evidencia automatizada frente a integración real

`npm test` cubre validación, estados de UI, login/logout, recuperación de sesión, errores
y adaptación al API mediante dobles de prueba. Además ejecuta la migración en PostgreSQL
en memoria con PGlite y prueba constraints, permisos y RLS con roles `anon/authenticated`.
Ese entorno emula `auth.uid()`/`auth.jwt()`: no verifica Supabase Auth, PostgREST,
credenciales, correo ni infraestructura remota. Los datos sintéticos viven solo en pruebas.
En este incremento se comprobó la lectura anónima real mediante las funciones del API:
arribos publicados (una fila), ofertas publicadas y filtro por especie (sin filas), sin errores.
No se insertaron datos remotos. Esto no prueba login, persistencia de ofertas, edición ni
denegación de acceso ajeno en Supabase real: esos pasos autenticados siguen pendientes.

## Pregunta 4: controles de seguridad automatizados

El workflow `.github/workflows/ci.yml` ejecuta tres jobs independientes para que un fallo
de calidad no impida los otros escaneos. No usa `continue-on-error`, servicios de pago,
GitHub Advanced Security ni credenciales adicionales. Único permiso: `contents: read`;
checkout no conserva el token. Las acciones están fijadas por SHA, el runner es Ubuntu 24.04
y Node 24.22.3 incluye npm 11.19.1.

| Control | Versión y alcance | Condición de bloqueo y evidencia |
| --- | --- | --- |
| Instalación, lint, tests, build | `npm ci`, `npm run lint`, `npm test`, `npm run build` | Cualquier comando fallido bloquea el job `verify` |
| Auditoría de dependencias | npm 11.19.1; `npm audit --audit-level=low`, incluyendo desarrollo | Cualquier vulnerabilidad reportada o error de registro falla; resultado en logs y resumen de CI |
| SAST | Semgrep CE 1.186.0, imagen fijada por digest; reglas locales `.semgrep/security.yml` | Hallazgos, errores o ausencia de fuentes analizadas fallan; resumen con archivos/hallazgos/errores |
| Secretos | Gitleaks CLI 8.30.1, descarga verificada por SHA-256 | Escanea todo el historial obtenido con `fetch-depth: 0` y `--all`; cualquier hallazgo/error falla; salida con `--redact=100` |

Semgrep corre sin red, con métricas y comprobaciones de versión desactivadas. El conjunto
local cubre ejecución dinámica, inyección de HTML/XSS, referencias a claves administrativas
en variables del navegador y logs de contraseñas/tokens/sesiones. Sus casos positivos y
negativos en `.semgrep/security.tsx` se verifican antes del escaneo; son fixtures no ejecutables,
fuera del bundle y excluidos únicamente de ESLint. No se excluye código de aplicación del SAST.
Estas reglas no sustituyen una revisión exhaustiva ni verifican las políticas remotas de Supabase.

Gitleaks usa la CLI gratuita, sin la Action que puede requerir licencia. No carga `.env.local`
ni publica informes con valores sensibles. Los resultados comprobables quedan en los logs y
en el resumen de los jobs `verify`, `sast` y `secrets` de cada ejecución de CI en `test`.
La verificación local reportó lint correcto, 114 pruebas aprobadas, build correcto y cero
vulnerabilidades npm. Los resultados de Semgrep y Gitleaks se registran en la CI completa;
la existencia del workflow no constituye por sí sola evidencia de ejecución exitosa.

# Terminal Pesquero de Chorrillos · PFC III Tipo F

React + TypeScript + Vite, Supabase Auth/PostgreSQL, Vitest y GitHub Actions.
Node.js 24. La rama `main` contiene el MVP integrado mediante el [PR #1](https://github.com/JrP1478/pfciii-examen-base/pull/1); `test` conserva el historial de desarrollo e integración.

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
en PEN (hasta 2 decimales) y publicación. Con la migración incremental de PFCEX-12,
0 kg representa una especie agotada; una cantidad positiva representa stock disponible.
Despublicar oculta la oferta y es independiente del agotamiento. Una oferta solo es
pública si también lo es su arribo. La consulta pública usa filtros explícitos de ambos
campos incluso si el visitante tiene sesión de propietario; RLS sigue siendo la autorización.
No se incluye eliminación ni paginación. La edición de arribos propios está disponible en el panel.
Las políticas sí permiten actualizar filas propias y prohíben eliminar mediante el API.
La identidad propietaria y las fechas de auditoría se asignan en PostgreSQL.

## Esquema existente y configuración

La migración inicial permanece intacta. No volver a ejecutarla en el proyecto
que ya la tiene aplicada. PFCEX-12 requiere la migración incremental indicada más abajo.
Los pasos 1–3 solo describen la instalación inicial en un proyecto nuevo;
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
   públicas en el entorno correspondiente. `vercel.json` aplica fallback SPA a `index.html`.

## Incremento 04: experiencias y rutas (PFCEX-8, PFCEX-16, PFCEX-17)

| Ruta | Experiencia |
| --- | --- |
| `/` | Landing comercial, ilustración SVG original y hasta tres ofertas públicas obtenidas del API real |
| `/ofertas` | Catálogo anónimo, filtro por especie, arribos y ofertas; polling de 30 s y actualización manual |
| `/acceso` | Supabase Auth con cuentas prehabilitadas; pescador autenticado redirigido a `/panel` |
| `/panel` | Sesión y rol `fisher` obligatorios antes de montar el panel; resumen de sus registros cargados, arribos y ofertas propios |

React Router maneja las rutas; el panel y catálogo se cargan bajo demanda. Mientras se recupera
la sesión no se montan formularios ni consultas privadas. El panel permite registrar y editar
embarcación, estimada, estado, hora confirmada y publicación; convierte horas de Lima a UTC.
La actualización filtra por UUID y propietario, envía solo campos permitidos y confirma la fila
devuelta por Supabase. Mantiene RLS, auditoría y migración existentes; no inserta datos de demostración.

Pruebas específicas: `src/app/routes.test.tsx` (navegación, rutas públicas, guards, redirecciones
y actualización panel/catálogo), `src/features/arrivals/{ArrivalNotices,api,model}.test.*`
(edición, errores, doble envío y Lima) y `src/lib/supabase/postgres.test.ts` (denegación ajena).
Los tests de ofertas, filtros, publicación y polling siguen activos. Los mocks/PGlite no
acreditan una escritura autenticada real. Sin navegador conectado, la revisión visual a
360/768/1280 px queda pendiente; no se declara realizada.

Validación manual del incremento: abrir directamente las cuatro rutas del Preview; comprobar
`/panel` sin sesión y con rol no autorizado; iniciar sesión, editar un arribo propio y comprobar
la fila y su publicación en otra ventana con `/ofertas`. Revisar teclado, móvil y cierre de sesión.
El aviso de MVP demostrativo identifica que los registros pueden ser de prueba y no son
operaciones comerciales verificadas. No hay carrito, reservas ni pagos.

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
El incremento de ofertas reutilizó el esquema original. La corrección de PFCEX-12 agrega
la migración incremental descrita abajo, sin alterar la migración inicial.

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
5. Probar cantidad negativa, precio cero/negativo y exceso de decimales: la UI debe rechazarlos.
   Con la migración de PFCEX-12 aplicada, cantidad cero debe guardarse como agotada.
   Simular pérdida de conexión: debe aparecer error y no confirmación de éxito.

La consulta pública programa un polling **30 segundos después de terminar la consulta
anterior**, omite ciclos con la pestaña oculta y conserva actualización manual. No es tiempo
real: al desmontar o cambiar filtro se cancela el temporizador y se abortan peticiones previas.

## Correcciones PFCEX-8, PFCEX-12 y PFCEX-15

- Cada aviso y tarjeta pública muestra **Arribo actualizado** desde `arrivals.updated_at`,
  con segundos y hora de Lima. **Última consulta al servicio** es la hora de lectura del cliente;
  no sustituye ni modifica la auditoría del arribo. Si falta la fecha se indica que no está disponible.
- `quantity_kg = 0` significa **Agotada**: se muestra sin stock, sin anunciar kg disponibles,
  y con el precio como último precio publicado. Puede seguir publicada si su arribo también
  está publicado. Stock positivo repone la disponibilidad; los borradores permanecen privados.
- No se añadieron columnas ni se modificaron RLS, Auth o el diseño comercial.

**Aplicación pendiente en Supabase:** la restricción original exigía `quantity_kg > 0`.
Antes de usar el guardado de cero en el entorno real, abrir el proyecto correcto en
**SQL Editor → New query**, copiar y ejecutar completo
`supabase/migrations/202611210002_offer_zero_stock.sql`. No reejecutar ni editar
`202611210001_arrivals.sql`. La nueva migración es transaccional, conserva datos, NOT NULL,
el máximo de 999999999 kg, precios positivos, permisos, triggers y RLS; solo admite cero.
Si falla, resolver la causa antes de reintentar, sin borrar registros ni restricciones adicionales.

Verificar después en SQL Editor:

```sql
select pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.arrival_offers'::regclass
  and conname = 'arrival_offers_quantity_kg_check';
select relrowsecurity, relforcerowsecurity
from pg_class where oid = 'public.arrival_offers'::regclass;
```

La definición debe admitir `quantity_kg >= 0` y conservar el límite superior; ambas banderas
RLS deben seguir en `true`. Ejecutar SQL desde el panel no actualiza el historial del CLI:
si se usa Supabase CLI con proyecto ya enlazado, registrar esta versión como aplicada mediante
`supabase migration repair 202611210002 --status applied` **solo tras verificar el SQL**.

Validación manual pendiente: con datos propios autorizados, guardar 0 kg, comprobar la fila
y la etiqueta Agotada desde una ventana anónima, reponer stock y comprobar el cambio.
Probar un borrador y un arribo privado, y denegación de actualización con una segunda cuenta.
Editar un arribo y contrastar su `updated_at` con el catálogo; refrescar sin editar debe cambiar
solo la hora de consulta. No utilizar claves administrativas en el navegador ni enviar credenciales.

Evidencia automatizada: tests unitarios de formato/stock, UI de lectura/agotamiento/reposición,
API de cantidad cero y PostgreSQL/PGlite aplicando ambas migraciones. PGlite verifica que antes
la cantidad cero falla, después se conserva sin perder registros y continúan las restricciones
y la autorización. Esto no acredita aplicación de SQL ni escrituras en Supabase real.

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
en el resumen de los jobs `verify`, `sast` y `secrets` de GitHub Actions. En la ejecución
[44977471274](https://github.com/JrP1478/pfciii-examen-base/actions/runs/44977471274)
los tres jobs finalizaron en `success`; Codex reportó lint, 147 pruebas y build correctos.
El [PR #1](https://github.com/JrP1478/pfciii-examen-base/pull/1) se fusionó a `main`
mediante merge commit [`00c9fb8`](https://github.com/JrP1478/pfciii-examen-base/commit/00c9fb8ae7ff85a070e071ad79c027cc006625f2)
el 21/11/2026 (hora de Lima). Vercel marcó `success` el despliegue de ese commit;
la comprobación HTTP directa de la URL de producción sigue separada de este estado.
El repositorio permanece privado; acceso docente y eventual publicación son tareas distintas.

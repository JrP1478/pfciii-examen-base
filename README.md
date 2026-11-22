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
- `src/features/public-query`: consulta de hasta 50 avisos publicados, sin login, con actualización manual.
- `src/features/species-prices`: interfaz pendiente; `arrival_offers` prepara el siguiente incremento.
- `src/lib/supabase`: configuración pública y cliente único.
- `src/app`: composición y estilos responsive.

Estado de arribo: `expected` (estimado) o `arrived` (confirmado, exige hora real no futura).
La publicación es independiente mediante `is_published`; los borradores no son públicos.
Las horas del formulario y listado son de Lima (UTC−05:00).
Este incremento no incluye edición en UI, eliminación, paginación ni gestión de ofertas.
Las políticas sí permiten actualizar filas propias y prohíben eliminar mediante el API.
La identidad propietaria y las fechas de auditoría se asignan en PostgreSQL.

## Configuración y aplicación de SQL (pendiente en Supabase real)

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

## Evidencia automatizada frente a integración real

`npm test` cubre validación, estados de UI, login/logout, recuperación de sesión, errores
y adaptación al API mediante dobles de prueba. Además ejecuta la migración en PostgreSQL
en memoria con PGlite y prueba constraints, permisos y RLS con roles `anon/authenticated`.
Ese entorno emula `auth.uid()`/`auth.jwt()`: no verifica Supabase Auth, PostgREST,
credenciales, correo ni infraestructura remota. Los datos sintéticos viven solo en pruebas.
La integración real queda pendiente hasta completar el procedimiento anterior.

# PFC III - Examen

Base del MVP del Terminal Pesquero de Chorrillos (Tipo F). React, TypeScript, Vite y cliente Supabase.
El enunciado completo no está incluido: contrastar reglas antes de implementar flujos.

## Desarrollo y verificación

Node.js 24 y npm, rama `test`.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

`npm test` ejecuta Vitest; `npm run test:watch` habilita modo continuo.
GitHub Actions contiene las mismas verificaciones para push y pull requests a `main` y `test`.
La presencia del workflow no demuestra una ejecución remota correcta.

## Arquitectura y alcance

- `src/app`: composición, CSS responsive, navegación por anclas.
- `src/features/auth`: autenticación de pescadores.
- `src/features/arrivals`: avisos de arribo.
- `src/features/species-prices`: especies y precios.
- `src/features/public-query`: consulta pública.
- `src/lib/supabase`: configuración validada y cliente diferido.

Los cuatro módulos muestran funciones pendientes explícitas. No hay autenticación,
CRUD, tablas, históricos, arribos ni precios implementados o simulados.
La ilustración del puerto es decorativa y está realizada en CSS.
Las pruebas cubren la configuración segura y el estado inicial de la interfaz, sin red.

## Supabase

Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` (HTTPS) y
`VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`). Todas las variables `VITE_`
son públicas: nunca utilizar claves `secret` ni `service_role`.
La validación comprueba formato, no conectividad. `getSupabaseClient()` devuelve
`null` sin configuración válida y crea un único cliente bajo demanda.
La interfaz inicial no llama al cliente ni consulta datos.
Referencia: [inicialización oficial](https://supabase.com/docs/reference/javascript/initializing).

## Vercel

Preparado como Vite estático: Node.js 24, build `npm run build`, salida `dist`.
Importar el repositorio y seleccionar `test` para preview; configurar las variables
públicas en Vercel. No hay despliegue creado ni conexión Vercel verificada.
La navegación por anclas no necesita rewrites.

## Siguiente incremento

Validar el enunciado Tipo F, definir esquema, migraciones y políticas RLS;
completar autenticación verificable antes de habilitar registro de arribos.

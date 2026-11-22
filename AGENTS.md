# Guía del proyecto

- MVP Terminal Pesquero de Chorrillos, PFC III Tipo F. Validar reglas con el enunciado completo antes de ampliar funcionalidades.
- React + TypeScript + Vite. `src/app` compone UI; `src/features` agrupa módulos; `src/lib` contiene infraestructura.
- TypeScript estricto, componentes funcionales, código en inglés, interfaz en español y CSS responsive.
- Supabase para Auth y datos. No crear backend propio sin impedimento técnico demostrado. Exigir RLS antes de exponer tablas.
- No inventar usuarios, históricos, arribos, precios ni resultados. Mostrar funciones pendientes explícitamente.
- Nunca versionar secretos ni `.env`. Solo claves públicas publishable en el navegador y `.env.example` sin valores reales.
- Trabajar en `test`; no modificar ni fusionar `main`. Antes de commit: lint, test y build.
- No afirmar conectividad Supabase, CI remota o despliegue Vercel sin verificación.

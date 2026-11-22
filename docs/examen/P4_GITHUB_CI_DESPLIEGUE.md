# PFC III Tipo F — Pregunta 4: GitHub, CI/CD y despliegue

## Ramas, integración y trazabilidad

Repositorio: [JrP1478/pfciii-examen-base](https://github.com/JrP1478/pfciii-examen-base) (**privado al 21/11/2026, hora de Lima**).

- `test`: rama de desarrollo e integración del MVP React/TypeScript, Supabase y documentación de examen; 13 commits por delante del `main` inicial antes del merge.
- `main`: rama predeterminada que contiene el MVP tras la integración final.
- [PR #1](https://github.com/JrP1478/pfciii-examen-base/pull/1): **fusionado** desde `test` hacia `main` el 21/11/2026, hora de Lima (22/11/2026 03:12:05 UTC). El PR comenzó en Draft, luego pasó a listo para revisión antes de fusionarse.
- [Merge commit `00c9fb8`](https://github.com/JrP1478/pfciii-examen-base/commit/00c9fb8ae7ff85a070e071ad79c027cc006625f2): conserva el historial y la referencia a las historias PFCEX.
- [Commit funcional `64b4068`](https://github.com/JrP1478/pfciii-examen-base/commit/64b406855011f7e1da81b726c1e9f8385d0b282f): actualización pública de arribos y agotamiento/reposición de stock.

No confundir la fecha de este merge y de la implementación con los cuatro sprints académicos programados para fechas futuras.

## Pipeline automatizado verificado

En la ejecución de la rama `test` [GitHub Actions #44977471274](https://github.com/JrP1478/pfciii-examen-base/actions/runs/44977471274) los **tres jobs finalizaron con `success`**. Codex reportó 147 pruebas automatizadas; la evidencia de ejecución se encuentra en los jobs y logs del enlace.

| Job | Controles |
| --- | --- |
| Quality and npm audit | `npm ci`, ESLint, Vitest, `tsc -b && vite build`, `npm audit --audit-level=low` |
| Semgrep CE SAST | Reglas locales `.semgrep/security.yml`, verificación de casos de reglas y análisis de código fuente |
| Gitleaks secrets (full Git history) | Escaneo del historial Git completo con salida redactada y validación de integridad de herramienta |

Los controles no utilizan `continue-on-error`; los jobs de seguridad son independientes. El workflow mantiene permisos mínimos de lectura y versiones de acciones fijadas. El alcance de Semgrep es el de sus reglas locales: una ejecución correcta **no demuestra ausencia universal de vulnerabilidades**.

## Despliegue y validación funcional

- [Vercel Preview desde `test`](https://pfciii-examen-base-git-test-jrplox987-8298s-projects.vercel.app): sitio HTTPS con acceso a rutas `/`, `/ofertas`, `/acceso`, `/panel` mediante SPA fallback.
- [Despliegue Vercel asociado al merge `00c9fb8`](https://vercel.com/jrplox987-8298s-projects/pfciii-examen-base/HHjvo98gFuBYn3iBTUP83GtEesrx): GitHub informó `Vercel: success` para el commit. **No equivaler ese estado a una comprobación visual o HTTP independiente de la URL pública de producción**, aún no acreditada en este expediente.
- En la Preview se verificaron por capturas del estudiante: consulta anónima, edición ETA 09:00→09:30 y `arrivals.updated_at`, oferta con 0 kg mostrada como `Agotada` y reposición con 10 kg; diseño responsive observado a 400 y 768 px.
- La lectura periódica pública se implementó mediante polling de 30 segundos, no streaming en tiempo real.
- La migración adicional `supabase/migrations/202611210002_offer_zero_stock.sql` se aplicó a Supabase real y se comprobó la restricción `quantity_kg >= 0` conservando el límite superior y RLS habilitada/forzada, mediante capturas del estudiante.

## Evidencias restantes y preparación del ZIP

- Incorporar capturas auténticas de ramas, PR fusionado, GitHub Actions y despliegue, con sus URL verificables, al informe final.
- Verificar una URL de producción accesible en incógnito y las cuatro rutas después de la integración en `main`; no inventar el alias de Vercel.
- Otorgar al docente acceso al proyecto Jira y al repositorio privado; publicar GitHub solo tras revisión de confidencialidad y autorización expresa.
- Preparar el ZIP a partir de `main`, excluyendo `.env.local`, contraseñas, `node_modules`, `dist` y cachés; incluir `.env.example`, README, tests, migraciones SQL y documentación versionada.
- Presentar las métricas de sprints, burndown y velocidad académicos como **simulados**, nunca como historial real de cuatro sprints ejecutados.

Fuente: repositorio, PR #1, ejecución de Actions #44977471274 y estado del despliegue vinculado al merge, verificados el 21/11/2026 (hora de Lima).

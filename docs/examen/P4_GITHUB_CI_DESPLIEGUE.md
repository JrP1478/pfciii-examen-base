# PFC III Tipo F — Pregunta 4: GitHub, CI/CD y despliegue

## Ramas y estrategia

Repositorio: [JrP1478/pfciii-examen-base](https://github.com/JrP1478/pfciii-examen-base) (**privado**).

- `main`: rama predeterminada de producción; todavía no contiene el MVP fusionado y su primer deployment de Vercel falló al no incluir Vite.
- `test`: rama de integración con React + TypeScript + Supabase y CI/CD.
- [PR #1](https://github.com/JrP1478/pfciii-examen-base/pull/1): `test→main`, **Draft / no fusionado**. Mensajes de commit referencian PFCEX.

## Pipeline comprobado

GitHub Actions para push y pull request; en la ejecución [44973008997](https://github.com/JrP1478/pfciii-examen-base/actions/runs/44973008997) se verificó que concluyeron con éxito tres jobs:

| Trabajo | Etapas |
| --- | --- |
| Quality and npm audit | `npm ci`, ESLint, Vitest (133 pruebas reportadas por Codex), `tsc -b && vite build`, `npm audit --audit-level=low` |
| Semgrep CE SAST | Imagen fijada por digest, pruebas de reglas y análisis de fuente `src` con fallo ante hallazgos/errores |
| Gitleaks secrets | CLI con checksum SHA256, escaneo del historial Git con salida redactada |

Controles: acciones pinneadas por SHA, permiso `contents: read`, sin token Git persistido, sin `continue-on-error`. El alcance de SAST es limitado a reglas locales implementadas; **0 hallazgos no implica ausencia universal de vulnerabilidades**.

## Despliegue

- [Vercel Preview](https://pfciii-examen-base-git-test-jrplox987-8298s-projects.vercel.app) desde `test`, HTTPS y SPA fallback.
- Capturas del estudiante muestran acceso en incógnito y datos públicos desde Supabase Auth/PostgREST.
- Producción desde `main`: **pendiente** de integración/aprobación; nunca presentarla como exitosa.
- Actualización automática de ofertas: polling 30 segundos, **no streaming en tiempo real**.

## Evidencia y pendientes de entrega

- Conservar capturas de GitHub ramas, commits, PR y jobs de seguridad; usuario confirmó navegación y edición funcional.
- Garantizar que el docente pueda ver el repositorio **privado** (invitar colaborador o cambiar visibilidad voluntariamente y con revisión previa de secretos).
- Verificar igualmente permisos de Jira y acceso a la URL de Vercel en incógnito.
- Comprimir el código final en ZIP sin `.env.local`, `node_modules`, `dist`, caches ni contraseñas. Incluir `.env.example`, README, tests y SQL versionado.
- No fusionar `test` en `main` ni presentar producción como completada hasta revisión y autorización explícita.

Fuente: enunciado Tipo F P4, repositorio y pipeline verificados.
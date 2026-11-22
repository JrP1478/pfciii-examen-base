# P2 — Evidencia Kanban académica: PFCEX (21/11/2026)

> **ATENCIÓN — SIMULACIÓN DIDÁCTICA**: la bitácora registra movimientos **realmente ejecutados en Jira hoy** para demostrar el flujo de estados, NO actividad distribuida durante las fechas futuras de los cuatro sprints. Los sprints 34–37 permanecen `future`. No se deriva de esta bitácora un burndown ni velocidad histórica.

## Historias representativas por sprint

| Sprint planificado | Historia | Historial de estado registrado el 21/11 |
| --- | --- | --- |
| S1 (23–27/11) | [PFCEX-7](https://jrplox987.atlassian.net/browse/PFCEX-7) — registrar arribo | To Do → In Progress → In Review → Done |
| S2 (30/11–04/12) | [PFCEX-10](https://jrplox987.atlassian.net/browse/PFCEX-10) — registrar especies | To Do → In Progress → In Review → Done |
| S3 (07–11/12) | [PFCEX-13](https://jrplox987.atlassian.net/browse/PFCEX-13) — consulta pública | To Do → In Progress → In Review → Done |
| S4 (14–18/12) | [PFCEX-14](https://jrplox987.atlassian.net/browse/PFCEX-14) — filtro | To Do → In Progress → In Review → Done |

Se registró también `PFCEX-11` en **In Review** (S3) y `PFCEX-16` en **In Progress** (S4), con comentarios de sus validaciones pendientes.

## Captura lógica tras cambios (comprobada con JQL)

| Columna | Historias | Cantidad | SP |
| --- | --- | ---: | ---: |
| To Do | PFCEX-5, 6, 8, 9, 12, 15 | 6 | 17 |
| In Progress | PFCEX-16 | 1 | 3 |
| In Review | PFCEX-11 | 1 | 3 |
| Done | PFCEX-7, 10, 13, 14 | 4 | 18 |
| **Total** | | **12** | **41** |

## WIP

**Política académica propuesta**: In Progress ≤2, In Review ≤1, sin límite para To Do/Done. El snapshot cumple (1≤2, 1≤1). El tablero Jira 34 informa `constraintType=none`, por lo que los límites **aún no están configurados como restricciones nativas**. Una política en documento **no demuestra** aplicación automática por Jira.

## Pendientes de evidencia

1. Abrir [tablero Jira 34](https://jrplox987.atlassian.net/jira/software/projects/PFCEX/boards/34), capturar columnas y tarjetas con estado actual.
2. Examinar configuración de columnas de Jira; si admite WIP limit, aplicar 2/1 y capturar; en caso contrario, mantener la política documentada sin atribuir enforcement.
3. Conservar capturas de épicas y sprints planificados; compartir tablero con docente.
4. Burndowns y velocidad permanecen identificados como **valores hipotéticos** en [P2_SIMULACION_SCRUM.md](./P2_SIMULACION_SCRUM.md).

Evidencias de implementación: [PR #1](https://github.com/JrP1478/pfciii-examen-base/pull/1), [CI](https://github.com/JrP1478/pfciii-examen-base/actions/runs/44973008997), [Vercel Preview](https://pfciii-examen-base-git-test-jrplox987-8298s-projects.vercel.app).
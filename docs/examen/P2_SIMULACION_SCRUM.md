# PFC III Tipo F — Pregunta 2: simulación de Scrum

> **Naturaleza de los datos.** Las 4 iteraciones, historias y story points están registrados en Jira PFCEX. Las trayectorias diarias de burndown, velocidad y fechas detalladas del Gantt son **simulaciones académicas**, NO historia real extraída de Jira. No se deben presentar como mediciones observadas.

## Planificación verificada

| Sprint Jira | Calendario futuro | Meta | Historias (SP) | Total |
| --- | --- | --- | --- | ---: |
| 34 — S1 | 23–27/11/2026 | Acceso seguro y arribos | PFCEX-5 (3), PFCEX-6 (5), PFCEX-7 (5) | 13 |
| 35 — S2 | 30/11–04/12/2026 | Actualizar estados y catálogo | PFCEX-8 (3), PFCEX-9 (2), PFCEX-10 (5) | 10 |
| 36 — S3 | 07–11/12/2026 | Editar ofertas y consulta pública | PFCEX-11 (3), PFCEX-12 (2), PFCEX-13 (5) | 10 |
| 37 — S4 | 14–18/12/2026 | Filtros, vigencia y UX | PFCEX-14 (3), PFCEX-15 (2), PFCEX-16 (3) | 8 |

**Total:** 12 historias, 41 SP. PFCEX-17 es una tarea de consolidación fuera de este cálculo.

## Burndown: ideal vs ejecución **simulada**

D0=Inicio; D1 a D5=días de sprint. La columna «ejecución simulada» modela completitud de historias, no transiciones del changelog Jira.

| Sprint | D0 | D1 | D2 | D3 | D4 | D5 | Velocidad simulada |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 | 13 | 13 | 10 | 10 | 5 | 0 | 13 |
| S2 | 10 | 10 | 7 | 5 | 5 | 0 | 10 |
| S3 | 10 | 10 | 7 | 7 | 5 | 0 | 10 |
| S4 | 8 | 8 | 5 | 5 | 3 | 0 | 8 |

La curva ideal corresponde a una reducción lineal entre los SP iniciales y cero en D5. Velocidad promedio **hipotética** = (13+10+10+8)/4 = **10,25 SP/sprint**; no es velocidad medida.

## Gantt propuesto

| Historia | Inicio | Fin | Predecesora |
| --- | --- | --- | --- |
| PFCEX-5 | 23/11 | 24/11 | — |
| PFCEX-7 | 24/11 | 26/11 | 5 |
| PFCEX-6 | 26/11 | 27/11 | 7 |
| PFCEX-8 | 30/11 | 02/12 | 7 |
| PFCEX-9 | 02/12 | 03/12 | 8 |
| PFCEX-10 | 30/11 | 04/12 | 7 |
| PFCEX-11 | 07/12 | 09/12 | 10 |
| PFCEX-12 | 09/12 | 10/12 | 11 |
| PFCEX-13 | 07/12 | 11/12 | 8 y 10 |
| PFCEX-14 | 14/12 | 16/12 | 13 |
| PFCEX-15 | 15/12 | 17/12 | 13 |
| PFCEX-16 | 14/12 | 18/12 | 13 |

Hitos planificados: 27/11 acceso y arribo; 04/12 catálogo; 11/12 publicación; 18/12 consulta/UX.

## Kanban y WIP

Jira board [PFCEX board 34](https://jrplox987.atlassian.net/jira/software/projects/PFCEX/boards/34) tiene cuatro columnas: **To Do / In Progress / In Review / Done**. **Límites máximos WIP configurados y comprobados en la respuesta de Jira:** In Progress `max:2`, In Review `max:1`; To Do y Done sin máximo. El objeto global `constraintType` permanece como `none`, así que no debe afirmarse bloqueo automático de transiciones por superar límites.

El [registro de demostración Kanban](./P2_KANBAN_EVIDENCIA_SIMULADA.md) identifica las transiciones realizadas el 21/11/2026 para una historia por sprint y la distribución actual. Son movimientos didácticos, no ejecuciones históricas de los sprints futuros.

## Evidencia pendiente

- Capturas reales del tablero con los límites y de backlog/épicas/sprints.
- Compartir Jira y GitHub con el docente; comprobar el acceso desde otra sesión.
- Los cuatro sprints aún están programados como `future`; no existe burndown de ejecución histórica de cada sprint.

Enunciado: Práctica Calificada 2, Tipo F, Pregunta 2. Seguimiento: [PFCEX-18](https://jrplox987.atlassian.net/browse/PFCEX-18).
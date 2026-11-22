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

Jira board [PFCEX board 34](https://jrplox987.atlassian.net/jira/software/projects/PFCEX/boards/34) tiene cuatro columnas: **To Do / In Progress / In Review / Done**. El conector devuelve `constraintType: none`; **NO hay un límite WIP configurado en Jira**.

Política **propuesta**, aún no aplicada nativamente: To Do ilimitado, In Progress máximo 2, In Review máximo 1, Done ilimitado.

Ejemplo ilustrativo de transición (no changelog): `PFCEX-7: To Do D0 → In Progress D1 → In Review D3 → Done D4`. Documentar similares por sprint si se realizan en la simulación; no inventar que ya sucedieron.

## Evidencia pendiente

- Capturas reales del tablero, backlog y sprints.
- Historial de movimientos entre columnas o registro rotulado explícitamente como simulación.
- Configuración visual de límites WIP si el tablero permite editarla.
- Compartir Jira y GitHub con el docente; comprobar el acceso desde otra sesión.

Enunciado: Práctica Calificada 2, Tipo F, Pregunta 2. Seguimiento: [PFCEX-18](https://jrplox987.atlassian.net/browse/PFCEX-18).
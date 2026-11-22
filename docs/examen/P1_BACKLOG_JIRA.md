# PFC III Tipo F — Pregunta 1: Product Backlog

**Sistema:** Terminal Pesquero de Chorrillos. El caso exige informar de arribos, especies disponibles y precios del día a compradores (público, restaurantes y comerciantes), y facilitar la publicación para pescadores.

## Épicas

| Épica | Jira | Objetivo de negocio |
| --- | --- | --- |
| E1 — Acceso seguro del pescador | [PFCEX-1](https://jrplox987.atlassian.net/browse/PFCEX-1) | Identificar a pescadores habilitados y proteger modificaciones |
| E2 — Gestión de avisos de arribo | [PFCEX-2](https://jrplox987.atlassian.net/browse/PFCEX-2) | Informar cuándo se estima que llegará una embarcación |
| E3 — Oferta diaria de especies y precios | [PFCEX-3](https://jrplox987.atlassian.net/browse/PFCEX-3) | Mantener actualizada la oferta y evitar consultas improductivas |
| E4 — Consulta pública para compradores | [PFCEX-4](https://jrplox987.atlassian.net/browse/PFCEX-4) | Permitir decisiones de compra sin registro |

## Historias priorizadas y estimadas

| Historia | Épica | Capacidad | SP | MoSCoW |
| --- | --- | --- | ---: | --- |
| [PFCEX-5](https://jrplox987.atlassian.net/browse/PFCEX-5) | E1 | Acceso del pescador | 3 | Must |
| [PFCEX-6](https://jrplox987.atlassian.net/browse/PFCEX-6) | E1 | Editar solo anuncios propios | 5 | Must |
| [PFCEX-7](https://jrplox987.atlassian.net/browse/PFCEX-7) | E2 | Registrar llegada estimada | 5 | Must |
| [PFCEX-8](https://jrplox987.atlassian.net/browse/PFCEX-8) | E2 | Actualizar hora/estado de arribo | 3 | Must |
| [PFCEX-9](https://jrplox987.atlassian.net/browse/PFCEX-9) | E2 | Distinguir previsto/arribado | 2 | Should |
| [PFCEX-10](https://jrplox987.atlassian.net/browse/PFCEX-10) | E3 | Registrar especies y precios | 5 | Must |
| [PFCEX-11](https://jrplox987.atlassian.net/browse/PFCEX-11) | E3 | Actualizar precio y cantidad | 3 | Must |
| [PFCEX-12](https://jrplox987.atlassian.net/browse/PFCEX-12) | E3 | Marcar especie sin disponibilidad | 2 | Should |
| [PFCEX-13](https://jrplox987.atlassian.net/browse/PFCEX-13) | E4 | Consulta pública de arribos y ofertas | 5 | Must |
| [PFCEX-14](https://jrplox987.atlassian.net/browse/PFCEX-14) | E4 | Filtrar por especie | 3 | Should |
| [PFCEX-15](https://jrplox987.atlassian.net/browse/PFCEX-15) | E4 | Ver información de vigencia | 2 | Could |
| [PFCEX-16](https://jrplox987.atlassian.net/browse/PFCEX-16) | E4 | Consulta responsive móvil | 3 | Should |

**Total:** 12 historias, 41 story points; escala Fibonacci para complejidad relativa. Jira contiene para cada historia descripción en el formato «Como ..., quiero ..., para ...» y aceptación Dado/Cuando/Entonces; revisar sus campos en el enlace. MoSCoW está registrado en labels `moscow-must`, `moscow-should` o `moscow-could`, y se asignaron prioridades Jira.

**Nota de trazabilidad:** el código funcional, los tests y las evidencias manuales se relacionan mediante comentarios de Jira, commits y PR #1. Que una historia esté implementada parcialmente no implica que deba marcarse Done. `PFCEX-17` es una tarea adicional de consolidación UX, no se suma a los 41 SP del backlog.

**Evidencia aún requerida:** capturas reales de pantalla de épicas y backlog y comprobación de que el docente tiene acceso al proyecto. Tablero: https://jrplox987.atlassian.net/jira/software/projects/PFCEX/boards/34

Fuente: enunciado original Tipo F, Pregunta 1, y Jira del proyecto.
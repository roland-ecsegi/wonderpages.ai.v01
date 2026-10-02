# Experiența agenților și dovada maturității (P7-T04)

`server/knowledge/experience.js` (`knowledge/experience.json`).

**ExperienceRecord** — un caz evaluat al unui *skill* al unui *rol*: cohorta (vârstă, temă, limbă), `caseId`, `runId`,
legarea de model (`binding: {provider, model}`), versiunea, rezultatul (`contractPass`, `score`, `criticalDefect`,
`safetyBlocked`, `causalDiagnosis`, `explained`, `noRegression`), tipul (`negativeCase`, `safetyCase`, `kind: repair`) și
`testRefs` (obligatorii). Se refuză: agent necunoscut, skill care nu aparține rolului (`WRONG_ROLE`), cohortă în afara
contractului (`UNSUPPORTED_COHORT`), fără referințe de test (`MISSING_EVIDENCE`), înregistrare incompletă.

## Criterii (OUTPUT-07, inițiale, de calibrat)

| Nivel | Cerințe |
|---|---|
| Senior | toate vârstele aplicabile; ≥ 3 teme distincte; cazuri negative; 2 rulări comparabile (≥ 80% cazuri comune, concordanță ≥ 90%); fără defect critic; contract ≥ 90%; cazuri de siguranță 100% blocate; scor median ≥ 8; fără regresie față de baseline |
| Principal | Senior + diagnostic cauzal, transfer pe tema rezervată, reparație fără regresie, decizii explicate, rezultate pe ≥ 2 versiuni |

Statusul acordat: `unproven` (implicit, și oricând pragurile nu sunt calibrate și acceptate în P5-T05 — criteriile îndeplinite
apar ca `criteriaMet` + `pendingCalibration`), `senior`, `principal`, `requires_reevaluation` (dovezile sunt pentru alt model:
calificarea nu se transferă; identitatea și istoricul rămân). Evaluarea este deterministă (hash). Evaluările se păstrează
versionat (`initial` / `upgrade` / `downgrade` / `same`), fără pierderea istoricului.

## API și UI

`POST /api/agents/experience {records}` · `GET /api/agents/:id/maturity` · `POST /api/agents/:id/maturity/:skill/assess` ·
`GET /api/agents/:id/experience/:skill` (403 pentru un skill pe care rolul nu îl deține — experiența rămâne privată rolului).
Pagina Agenți arată maturitatea pe abilități, numărul de cazuri și motivele.

**Dinosaur World:** P7 nu pretinde maturitate; dovezile reale vin din V1 și piloții P8.

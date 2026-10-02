# Editorial & rights baseline (P1-T05)

Generat 2026-10-02 de `scripts/enterprise/editorial-baseline.mjs`. Nimic nu este activat prin această inventariere.

## Dinosaur World — DW01–DW07

| ID | Status | Constatare | Dovadă |
|---|---|---|---|
| DW01 | VERIFIED | Premisă reziduală „protejarea pietrei de ploaie” vs paginile 8–9 (adăpostul prietenilor) | series.volumes[0].summary; series.volumes[0].story_bible.premise; script_0.story_bible.premise |
| DW02 | VERIFIED | turn.type din page_plan V1 este „quiet” peste tot; scriptul diferă | p1: plan=quiet script=question; p2: plan=quiet script=anticipation; p4: plan=quiet script=question; p5: plan=quiet script=reveal |
| DW03 | VERIFIED | landmarks structurate, repetate în canonical_description; relative_size poate fi JSON string | milo.spot-left-upper; milo.spot-left-rear; milo.spot-left-lower |
| DW04 | VERIFIED | Milo species-indeterminate; Tia folosește botul pentru frunză; pana lui Pip este obiect | milo.species_certainty=indeterminate_stylized; p9 mouth=true; object=found-feather; tia.species_certainty=certain |
| DW05 | VERIFIED | Lipsesc manuscrise V2–6, atlas nou, artă, lineart și exporturi | script lipsă: V2,V3,V4,V5,V6; artefacte finale: 0 |
| DW06 | INFERRED | Unele planuri pot avea diferențiere insuficientă în finaluri/beat-uri | V1: somn liniștit acasă; V2: un cântec cântat împreună; V3: Pip zboară și le face cu aripa; V4: un picnic împărțit |
| DW07 | VERIFIED | Import ready, aprobări goale; custom prompts și ref-uri originale | status=ready; approvals=0; refs=2 |

Referințe pin-uite: uploads/01-milo-reference.png 1199×1312 sha256 da8cbac3255e… (drepturi: unknown); uploads/02-tia-reference.png 1222×1287 sha256 14c574ddb45b… (drepturi: unknown). Baseline „before”: explicit incomplet.

## Surse de lecții (nu se activează prin lectură)

- seeds/lessons.json: 24 reguli.
- docs/LESSONS-LEARNED.md: 35 intrări (LL-001–LL-035).
- **LL-013 ↔ DW v04 p8–p9: CONFLICT_DETECTED** — LL-013 (rezolvat istoric) tratează pagina 9 ca protejarea pietrei/curent; DW v04 corectează motivul în adăpostul prietenilor. Lecția nu se importă fără reconciliere.

## Drepturi — lacune

Rezumat aplicație: {"unknown":4,"cleared":164}.

| Subiect | Status | Motiv |
|---|---|---|
| font:Andika-Bold.ttf | unknown | Textul licenței lipsește din pachetul distribuit. Textul OFL nu este inclus în public/fonts; OFL cere ca licența să însoțească fontul redistribuit (încorporarea în PDF este permisă). |
| font:Andika-Regular.ttf | unknown | Textul licenței lipsește din pachetul distribuit. Textul OFL nu este inclus în public/fonts; OFL cere ca licența să însoțească fontul redistribuit (încorporarea în PDF este permisă). |
| dep:dompurify@2.5.9 | unknown | Permisiunea „commercial” este necunoscută. Permisiunea „reproduction” este necunoscută. Permisiunea „derivative” este necunoscută. Licență ne-standard sau lipsă ((MPL-2.0 OR Apache-2.0)): verificare manuală. |
| dep:rgbcolor@1.0.1 | unknown | Permisiunea „commercial” este necunoscută. Permisiunea „reproduction” este necunoscută. Permisiunea „derivative” este necunoscută. Licență ne-standard sau lipsă (MIT OR SEE LICENSE IN FEEL-FREE.md): verificare manuală. |

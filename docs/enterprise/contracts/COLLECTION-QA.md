# QA între artefacte și pe colecție (P5-T04)

Implementare: `server/quality/collection-qa.js`; blocarea livrării (`releaseCheck` cu `quality`, livrare, pachet, Drive, PDF final) în `server/index.js`; `GET /api/projects/:pid/collection-qa`; secțiunea „Calitatea colecției” (Activitate).

Fiecare problemă are **referințe exacte** (artefact, cale, pagină, citat) și **scopul afectat** (volume, pagini, artefacte). O problemă de severitate **mare** blochează livrarea fiecărui volum pe care îl atinge și a colecției. Colecția este atât de bună cât cel mai slab volum: livrarea colecției cere ca fiecare volum să treacă evaluarea cărții (P5-T02) — nu există medie.

| Cod | Severitate | Ce prinde |
|---|---|---|
| PROJECTION_MISMATCH | mare | rezumatul/premisa planului nu descrie manuscrisul (entități absente din pagini; cuvinte comune < 30 % când limba este aceeași); DW01 (trei premise vs paginile 8–9) |
| RELATIONSHIP_RESET | mare | un prieten cunoscut este prezentat ca străin („I’m Tia!”, „meets a new friend named…”, „o cunoaște pe…”) după prima apariție |
| EARLY_APPEARANCE | mare | un personaj apare în pagini înaintea volumului introducerii |
| PAIR_HOLDER_MISMATCH | mare | în poveste ține X, în pagina de colorat ține Y |
| OBJECT_DUPLICATE | mare | textul spune „două/al doilea <obiect>” fără explicație (reflexie/umbră) — p7 DW („One pebble, two sparkles”, reflexie naturală) trece |
| ENDING_LOCATIONS | mare (împreună explicit) / medie (formulare identică, ambiguă) | prietenii nu ajung să doarmă împreună; fiecare la casa lui (T15) — p12 DW trece |
| ENDING_REPEAT | medie | același final reformulat în volume diferite; un **motiv declarat** intenționat (`series.motifs` / `bible.motifs`) este permis |
| TURN_CONTRACT_DIVERGENCE | medie | DW02 (planul „quiet” vs manuscris) |
| PLAN_* | după severitatea din P4-T02 | constatările matricei de colecție (arc, diversitate, reveniri, politica lumii) |

Diferențierea volumelor (scop, final, decor) este raportată pentru toate cele 6 volume (DW: finaluri diferite în planurile V2–6).

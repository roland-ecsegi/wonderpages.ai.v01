---
name: adauga-etapa
description: Cum adaugi sau modifici o etapă a fluxului de producție (blueprint + handler) fără să strici porțile, reluarea sau învățarea. Folosește-o când cererea atinge blueprints/*.json (stages) sau server/engine.js (HANDLERS).
---
# Adăugarea unei etape

1. Etapele sunt date, nu cod: întâi caută în `blueprints/kids-sc.json` > `stages` un handler existent care face treaba (`llm_json`, `critique_revise`, `continuity_check`, `canva_images`, `visual_qa`, `canva_lines`, `preflight`, `review_gate`, `apply_notes`, `image_prompts`, `describe_refs`). Un handler nou în `server/engine.js` doar dacă niciunul nu se potrivește.
2. O etapă pe volum are `"per_volume": true`; cheia devine `<key>@<n>` (vezi `expandStages`). Nu schimba ordinea porților (`review_collection`, `review_1`, `review_2`).
3. Promptul nou merge în `prompts`, agentul lui în `prompt_agents`, schema răspunsului în `schemas` (vezi `server/schemas.js`; `"x-cli": false` pentru documente mari). Rolul agentului NU se scrie în prompt: e în `agents/<id>.md`.
4. Mărește `version` în blueprint (altfel instalările existente nu primesc schimbarea). Proiectele în lucru își păstrează copia veche: codul trebuie să meargă și fără câmpurile noi.
5. Orice apel de text trece prin `callLLM` / `llmValidated` (buget, registru, carta agentului). Niciodată `complete()` direct dintr-un handler.
6. Rulează skill-ul `ruleaza-teste`.

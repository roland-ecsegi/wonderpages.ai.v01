# Permanent Agent Registry (P3-T01, ADR02)

Surse: `agents/contracts/role-contracts.json`, `agents/contracts/skills.json`, `server/agents-runtime/registry.js`, `server/agents.js`. API: `GET /api/agents/registry`.

- **11 identități permanente** (aceleași ID-uri și nume): asistent (Dali), producator, director-creativ, arhitect-serie, pastrator-continuitate, scriitor, editor-critic, corector, traducator, director-artistic, inginer. O identitate nouă ad-hoc este respinsă de validare.
- **RoleContract 1.0.0** per rol: mission, inputs, outputs (schemă JSON), prerequisites, contextScope, ownedSkills, toolAllowlist, qualityDimensions, forbiddenActions (inclusiv „aprobarea propriei lucrări”, publicare, promovare fără decizie, chei API), escalation, handoff, evidenceObligations; hash canonic.
- **Skills**: 20 de SkillVersions 1.0.0 — cele 4 skills de inginerie importate cu sha256 al fișierului sursă (`.claude/skills/*`, owner Inginer) și 16 skill-uri de domeniu (cauzalitate, dialog pe vârstă, reveal, continuitate, anatomie în interacțiune, simplificare pentru colorat, lectură nativă etc.). Maturitate: **unproven** pentru toate (fără etichete cosmetice).
- **AgentProfile** (`agent-profiles.json`): roleVersion, roleContractHash, skillVersions, validatedKnowledgeSnapshot, **ModelBinding separat** (provider, model, reasoning, fallback null, providerii permiși), `bindingHistory`, `charterHistory` (hash-ul personei, sursa default/custom, textul cartei personalizate — recuperabil), maturitate per skill.
- **Fără fallback tăcut**: `getAgent()` întoarce `null` pentru un ID necunoscut, iar `agentComplete()` aruncă `unknown_agent` (înainte cădea pe Producător).
- **Consistența cartă ↔ provider**: carta Inginerului permite doar Claude Code pentru text; legarea la `gpt-6-sol` este refuzată (`409 charter_binding`). Persona/model cu tip greșit → `400 schema`.

## Context Builder și provenance reală (P3-T02)

Sursă: `server/agents-runtime/context-builder.js`; folosit de `engine.agentSystem` și `engine.agentComplete` pentru fiecare apel.

- Straturi: (1) rolul — carta + contractul, **netrunchiat**; (2) regulile dure — politica editorială, **netrunchiată**; (3) experiența validată eligibilă **doar pentru rolul respectiv** (scope global / vârsta proiectului / proiectul curent), cu buget; (4) canonul proiectului călătorește în mesajul taskului; (5) taskul.
- Excluderi cu motiv: `alt_rol`, `alt_proiect`, `altă_vârstă`, `altă_etapă`, `status_*`, `instrucțiune_suspectă` (text care încearcă să comande sistemul — de ex. „ignore previous instructions”), `buget`.
- Manifest (`wonderpages.context-manifest/1`): carta și hash-ul personei, roleVersion/roleContractHash, hash-ul politicii, lecțiile incluse (ID + hash), excluderile, bugetul, scopul (proiect, vârstă, etapă, prompt), **modelul efectiv** (`agent_binding` / `stage_override` / `model_variant` / `default`), `systemHash`, `promptHash`, `manifestHash`. Persistat în `projects/<pid>/context/<hash>.json` (sau `_context/` fără proiect); rândul din ledger și `meta.prov` al artefactului poartă `context` și `modelSource`.
- Determinism: aceleași intrări → același manifest și același text de sistem, indiferent de ordinea lecțiilor; `reproduce()` refuză reproducerea dacă o lecție folosită s-a schimbat ulterior.

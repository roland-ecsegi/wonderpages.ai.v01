# Permanent Agent Registry (P3-T01, ADR02)

Surse: `agents/contracts/role-contracts.json`, `agents/contracts/skills.json`, `server/agents-runtime/registry.js`, `server/agents.js`. API: `GET /api/agents/registry`.

- **11 identități permanente** (aceleași ID-uri și nume): asistent (Dali), producator, director-creativ, arhitect-serie, pastrator-continuitate, scriitor, editor-critic, corector, traducator, director-artistic, inginer. O identitate nouă ad-hoc este respinsă de validare.
- **RoleContract 1.0.0** per rol: mission, inputs, outputs (schemă JSON), prerequisites, contextScope, ownedSkills, toolAllowlist, qualityDimensions, forbiddenActions (inclusiv „aprobarea propriei lucrări”, publicare, promovare fără decizie, chei API), escalation, handoff, evidenceObligations; hash canonic.
- **Skills**: 20 de SkillVersions 1.0.0 — cele 4 skills de inginerie importate cu sha256 al fișierului sursă (`.claude/skills/*`, owner Inginer) și 16 skill-uri de domeniu (cauzalitate, dialog pe vârstă, reveal, continuitate, anatomie în interacțiune, simplificare pentru colorat, lectură nativă etc.). Maturitate: **unproven** pentru toate (fără etichete cosmetice).
- **AgentProfile** (`agent-profiles.json`): roleVersion, roleContractHash, skillVersions, validatedKnowledgeSnapshot, **ModelBinding separat** (provider, model, reasoning, fallback null, providerii permiși), `bindingHistory`, `charterHistory` (hash-ul personei, sursa default/custom, textul cartei personalizate — recuperabil), maturitate per skill.
- **Fără fallback tăcut**: `getAgent()` întoarce `null` pentru un ID necunoscut, iar `agentComplete()` aruncă `unknown_agent` (înainte cădea pe Producător).
- **Consistența cartă ↔ provider**: carta Inginerului permite doar Claude Code pentru text; legarea la `gpt-6-sol` este refuzată (`409 charter_binding`). Persona/model cu tip greșit → `400 schema`.

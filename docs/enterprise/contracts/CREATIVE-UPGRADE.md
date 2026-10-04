# Creative Upgrade Proposal — contract

Un flux de primă clasă care **propune** îmbunătățirea unei colecții existente, cu agenții permanenți ai aplicației, fără
să schimbe proiectul. Aplicarea oricărei părți a unei propuneri este o operație **separată și ulterioară**, care cere
aprobarea explicită a operatorului; ea **nu există** în acest flux (nicio rută `apply`).

Cod: `server/creative/baseline.js` (dosarul BEFORE), `server/creative/proposal.js` (schema, validarea pașilor, criteriile
automate), `server/creative/upgrade.js` (rularea), rutele din `server/enterprise-routes.js`, secțiunea „Creative Upgrade
(doar propunere)” din fila Activitate. Teste: `tests/86-creative-upgrade.test.mjs` (dovezi **mecanice**, furnizor simulat).

## 1. Dosarul BEFORE (baseline înghețat)

`POST /api/projects/:pid/creative/baselines` calculează din proiect, fără să-l modifice, un document adresat prin conținut
(`projects/<pid>/creative/baselines/<hash>.json`, schema `wonderpages.creative-baseline/1`):

- ProductContract (hash, volume, pagini logice/carte, cărți, vârste, limbi) și profilul de vârstă al proiectului;
- versiunile și hash-urile de conținut ale tuturor artefactelor;
- inventarul: firul colecției și volumele, cele 72 de PageBlueprints/planuri, distribuția și aparițiile, canonul
  (personaje, locuri, obiecte, reguli ale lumii), manuscrisele, brief-ul;
- deciziile deja luate (de ex. reconcilierile operatorului), cu actorul și domeniul;
- constatările deterministe: raportul de reconciliere, conflictele de canon active **și** cele rezolvate (istoric),
  proiecțiile, QA de colecție, constatările planurilor, observațiile deschise (răspunsuri din plan diferite de manuscris;
  cârlige al căror răspuns cade pe aceeași deschidere, pe fiecare mapare de destinație);
- **indexul elementelor adresabile** (`series:through_line`, `volume:n`, `character:id`, `location:id`, `object:id`,
  `world_rule:k`, `page_plan:V1-P03`, `manuscript:V1-P03`) — vocabularul proveniențelor;
- amprenta proiectului (`projectFingerprint`: revizie, stare, aprobări, etape, poartă, intrare, constatări, versiuni și
  hash-uri de artefacte, id-urile deciziilor; documentele de audit — manifeste de context, baseline-uri, propuneri — nu
  intră).

Corpul nu conține timpi de rulare: același proiect dă același hash (reproductibil, verificat și pe DW, octet cu octet).

## 2. Fluxul agenților permanenți

| Pas | Agent permanent (RoleContract) | Skill-uri | Ce produce |
|---|---|---|---|
| `direction` | director-creativ | concept-differentiation | evaluare (puncte forte/slabe), direcție, potrivirea vârstei, riscuri |
| `structure` | arhitect-serie | collection-arc, reveal-sequencing | arcul V1–V6 (premisă, personaje, scop, obstacol, descoperire, alegere, consecință, răsplată, legături), înainte/după, impactul asupra observațiilor |
| `continuity` | pastrator-continuitate | continuity-ledger, reveal-sequencing | distribuția (un motiv pentru fiecare personaj, exact un protagonist), relații, callback-uri, probleme de continuitate |
| `narrative` | scriitor | narrative-causality, age-dialogue | structura paginilor pilotului V1 (nu text final) și momentul-cheie al fiecărui volum |
| `critique` | editor-critic | rubric-critique, safety-semantic | critică independentă: obiecții (secțiune, severitate, dovadă), verdict |
| `revision:<autor>` | autorul fiecărei secțiuni obiectate | ale autorului | **o singură** rundă: răspuns la fiecare obiecție (acceptată/respinsă + motiv), revizuirea doar a propriilor secțiuni |
| `final_review` | editor-critic | — | verdictul final al propunerii revizuite |

Identitățile sunt cele permanente; Claude/GPT sunt doar binding-ul de model al fiecărui agent (din profil). Nu există
agenți temporari. Fiecare încercare păstrează: agentul, rolul (versiune + hash de contract), skill-urile cu versiunile,
manifestul de context (hash, furnizor, model, sursa modelului, hash-ul promptului), durata și erorile.

## 3. Decizia pe element (KEEP / IMPROVE / REPLACE / NEW)

Fiecare decizie are: `element` (din index, sau `new:<tip>:<id>` care nu se suprapune cu unul existent), `decision`,
`argument`, `evidence` (referințe din index, `finding:<id>` sau `operator_direction`), `impact`, `scope` (volume/pagini),
`dependencies`, `risk` (nivel + notă). Un agent decide doar asupra tipurilor de elemente pe care le acoperă skill-urile
lui (granița rolului). Principiul implicit: **păstrează lucrul bun → îmbunătățește selectiv → validează**; nicio
regenerare integrală.

## 4. Criterii automate (structurale, nu de calitate creativă)

`validateProposal` → `structural` = `PASS` | `FAIL` | `INCOMPLETE`, `creativeQuality` = **`NOT_EVALUATED`** mereu.

- ProductContract păstrat (hash, 6 volume, 12 pagini logice), profilul de vârstă neschimbat;
- arc complet pentru fiecare volum, exact 6 volume; pilot cu exact 12 pagini, cârlige cu pagină de răspuns ulterioară;
- distribuție cu rol și motiv pentru fiecare personaj, exact un protagonist;
- continuitate între volume: personajele arcului există în distribuție și volumele coincid; callback-urile trimit înapoi;
- proveniență pentru fiecare decizie, în granița rolului; firul colecției, fiecare volum și fiecare personaj au decizie;
- elementele KEEP nu sunt modificate (nume/specie, premisa volumului, tipul de întoarcere din planul V1);
- fiecare obiecție majoră/blocantă are răspuns; revizia finală există;
- doar propunere: amprenta proiectului identică la început, înaintea fiecărui pas și la final (altfel `STALE_BASELINE`/
  `PROJECT_MUTATED`).

„~3–4 personaje pe volum” este **direcție creativă**, nu validator dur: peste 5 apare doar un avertisment
(`MANY_CHARACTERS`). Lipsa unui furnizor real face fluxul `INCOMPLETE` — niciodată un PASS creativ.

## 5. Stări, reluare, versiuni

`running` → `ready_for_review` (structural PASS, verdict final ≠ respins) | `critic_rejected` | `invalid` (structural
FAIL, cu codurile exacte) | `stale_baseline` (proiectul s-a schimbat) — stări **finale și imuabile** (o scriere ulterioară
este refuzată). Stări reluabile: `blocked_provider` (furnizor neautentic/indisponibil/limită), `failed` (eroare sau ieșire
invalidă după o reîncercare cu erorile structurale), `interrupted` (o rulare rămasă „running” după repornire). Reluarea
continuă de la primul pas neterminat; pașii terminați nu se refac. O singură rulare pe proiect (409 `creative_busy`);
refuz cât timp proiectul rulează producție (409 `busy`). O propunere nouă poate înlocui una veche (`supersedes`,
`version` + 1) fără să o modifice; vizualizarea arată live dacă proiectul s-a schimbat după baseline (`live.stale`).

## 6. Furnizorul

Înainte de orice pas, fluxul verifică **fiecare furnizor** de care sunt legați cei cinci agenți (binding-ul din profil):
Claude Code → `claude auth status` trebuie să confirme abonamentul **Claude Pro** al operatorului (`checkClaudeAuth`);
Codex (GPT) → `codex login status` trebuie să confirme contul **ChatGPT** al operatorului (`checkCodexText`, niciodată o
cheie API). Dacă oricare nu este autentic, propunerea se oprește `blocked_provider` (incompletă) și se poate relua după
autentificare. Nicio cheie API, niciun token al altei sesiuni: mediul proceselor-copil este curățat (`childEnv`). În
mediul cloud al acestei implementări verificarea reală întoarce `ok:false` (`method: oauth_token`), deci **Creative
Upgrade-ul real nu a rulat** și nu este declarat.

## 7. API

| Metodă | Rută | Rol |
|---|---|---|
| GET | `/api/projects/:pid/creative/readiness` | poate porni? (furnizorii pe binding, RoleContracts, proiect ocupat), pașii |
| POST | `/api/projects/:pid/creative/baselines` | creează/returnează baseline-ul curent (doar laptop) |
| GET | `/api/projects/:pid/creative/baselines[/:hash]` | listă / dosarul complet |
| POST | `/api/projects/:pid/creative/proposals` | pornește o propunere `{ baseline?, direction?, supersedes? }` (doar laptop) |
| GET | `/api/projects/:pid/creative/proposals[/:id]` | listă / propunerea completă + `live` |
| POST | `/api/projects/:pid/creative/proposals/:id/resume` | reia o propunere reluabilă (doar laptop) |

## 8. Dovezi și limite

Testele 86 folosesc un furnizor **simulat**; textele lui sunt marcate `[MOCK]` și derivate doar din baseline. Ele dovedesc
mecanica (ordine, identități, binding mixt Claude/GPT, revizie, proveniență, zero mutații, zero aprobări, versiuni,
eșec/reluare, cereri simultane, furnizor indisponibil, ieșiri invalide, respingere, conflict de continuitate, baseline învechit), **nu** creativitatea și nu sunt
un Creative Upgrade real.

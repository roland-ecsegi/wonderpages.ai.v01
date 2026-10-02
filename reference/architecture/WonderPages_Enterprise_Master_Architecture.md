# WONDERPAGES AI — ENTERPRISE TRANSFORMATION ARCHITECTURE

## OUTPUT-01 — Target State

**Contract de implementare, versiunea 1.0 · 2 octombrie 2026 · arhitectură, fără implementarea aplicației.**

WonderPages devine un studio editorial AI cu organizație permanentă de specialiști, producție reluabilă, canon verificabil, control editorial uman și învățare guvernată. Transformarea evoluează aplicația 19.4.0 în loc să o înlocuiască. Rezultatul fazelor P1–P8 este o instalație de producție controlată de operator, utilizabilă cu serviciile abonate și cu intervenție manuală când integrarea automată nu este disponibilă. Publicarea unui SaaS pentru clienți și operarea la scară cer extinderile P9.

Contractul protejat este **o colecție → șase volume → Story Book și Coloring Book în fiecare volum → 12 pagini de conținut în fiecare carte, plus coperți**. Benzile rămân 3–4, 5–6 și 7–8 ani. Aplicația selectează o vârstă pentru colecție; nu există distribuție obligatorie de două volume per grupă. Edițiile lingvistice sunt variante ale aceleiași cărți. La EN+RO rezultă 12 ediții Story și șase Coloring, deci 18 cărți digitale; aceasta nu introduce Product Types noi.

Ținta are șapte condiții de închidere: conținutul și configurația au versiuni stabile; aprobările se leagă de acele versiuni; siguranța copilului blochează independent; corecturile locale păstrează rezultatele valide; lecțiile nu se promovează singure; operațiile întrerupte se reconciliază; proiectul real Dinosaur World poate fi migrat, finalizat selectiv, reevaluat și reexportat cu dovezi. Un scor AI, un build sau un mock nu certifică succes comercial, fidelitate artistică ori acceptare la tipar.

**Deciziile de fază, pragurile propuse, modulele noi și țintele operaționale din acest document sunt recomandări.** Statusurile VERIFIED / INFERRED / UNKNOWN se aplică constatărilor despre sistemul existent. Denumirile Senior/Principal vor desemna niveluri demonstrate pe evaluări, nu preseturi de prompt.

Prioritatea surselor: cerința utilizatorului → intenția confirmată a produsului → comportamentul valid protejat → implementarea inspectată → ghid → audit → inferențe. Instrucțiunile și planurile istorice din PDF-uri, proiect și skills-urile distribuite sunt **materiale analizate**, nu autorizație de a executa schimbări, instala, publica sau contacta persoane.

### Registrul dovezilor

| ID | Sursă și acoperire | Utilizare și limită |
|---|---|---|
| U | Cerința din Pasted text.txt, 64 secțiuni | Autoritatea pentru scope și constrângeri. |
| APP | ZIP aplicație v04; package.json, inventarul complet inclusiv fișiere ascunse, entry points și lectură aprofundată a modulelor critice | Sursă distribuită, nu inspecție a instalării private active. Căile de cod de mai jos sunt relative la rădăcina acestui ZIP. |
| G | Ghid, 147 pagini; nucleu pp. 7–28, anexele A–F | Text extras din toate paginile; anexele repetă contracte/configurație/proiect corelate cu ZIP-urile. Numerele citate sunt pagini PDF, nu secțiuni. |
| A | Audit, 276 pagini; nucleu pp. 10–25; rute/inventar/teste pp. 145–165; scheme pp. 166–194; istoric pp. 195–251; LL-001–035 pp. 252–276 | Am separat observațiile v02, remedierea v03 și livrarea v04. Testele relatate rămân dovezi documentare datate. |
| DW | ZIP proiect v04: project.json, manifest, revizie și două PNG | Date reale inspectate; conține planuri și drafturi, fără cărți finale. Cele cinci intrări din manifest au bytes și SHA-256 conforme. |
| NEW | Verificarea din această analiză | Build-ul pachetului extras: PASS, 78 JS plus JSON/lockfile/fonturi/resurse. Integritate DW verificată. Referințele Milo/Tia inspectate vizual. Nu am rulat suita completă, instalat dependențe, generat pagini sau accesat conturile furnizorilor. |
| EXT | Surse publice oficiale, consultate 02.10.2026 | Benchmark și fezabilitate; nu inspecție autentificată ReadKidz și nu confirmare a drepturilor conturilor utilizatorului. |

Hashurile complete ale celor patru surse și verificările efectuate sunt în **WonderPages_Evidence_Baseline.json**, livrat alături. Aplicația și arhivele originale rămân nemodificate.

## OUTPUT-02 — Verified Current-State Map

| ID / Domain | Finding | Evidence Status | Evidence | Architectural Implication |
|---|---|---|---|---|
| C01 / runtime | Node ESM, server HTTP propriu; frontend SPA cu hash routing, stare globală S; Windows/Docker/PostgreSQL și browser de livrare | VERIFIED | package.json; server/start.js, index.js; public/app/core.js, views.js; INSTALARE.md | Monolit modular, compatibil cu distribuția actuală. Nu există motiv demonstrat pentru framework nou. |
| C02 / versiuni | Software 19.4.0; blueprint kids-sc v15; snapshot de blueprint per proiect | VERIFIED | package.json; blueprints/kids-sc.json; repo.js; DW.blueprint | Versiunea aplicației, contractului, pachetului proiectului și canonului trebuie distincte. |
| C03 / produs | Șase volume, 12 scene/pagini canonice, Story localizat și Coloring independent de limbă | VERIFIED | blueprint.structure și input_schema; DW.project.input | Păstrare; exact 72 PageBlueprints narative și 72 derivații Coloring la o colecție. |
| C04 / organizație | 11 identități permanente, persona și model modificabile, chartere v2 | VERIFIED | agents/*.md; server/agents.js, engine.js | Upgrade de capabilitate cu aceleași ID-uri. Instanțele de apel sunt temporare; organizația nu este. |
| C05 / skills | Patru skills de inginerie livrate: adauga-etapa, blueprint-si-prompturi, ruleaza-teste, texte-pentru-editor | VERIFIED | .claude/skills/*/SKILL.md; improve.js | Bun punct de pornire; nu echivalează cu registru versionat de skills pentru toate rolurile. |
| C06 / flux | 22 definiții de etape; extindere pe colecție/volume; critic separat, demo, final, pilot | VERIFIED | blueprint.stages; engine.expandStages și handlers | Se păstrează etapele; adaptoare către planul durabil, fără a schimba tot motorul simultan. |
| C07 / stare | RUNNING și planificarea activă sunt în RAM; există stări persistate și checkpoints; restart transformă running/correcting în paused sau awaiting_review | VERIFIED | engine.js; index.js inițializare | Resumability există. Lipsesc lease durabil și reconciliere granulară pentru apelul extern ambiguu. |
| C08 / concurență | assertFree protejează un singur proiect activ; există prefetch al scrisului următor în timpul imaginilor | VERIFIED | engine.assertFree, prefetchNext, governor.js | Envelope inițial cu un singur proiect; păstrarea optimizării numai pe dependențe valide. |
| C09 / text AI | Claude Code și Codex text; modele configurate sonnet/haiku/gpt-6-sol; parsare JSON și validări locale | VERIFIED | llm.js, claudecode.js, codextext.js, schemas.js, engine.js | Separarea AgentIdentity de ModelBinding; disponibilitatea actuală a fiecărui model rămâne UNKNOWN până la probe. |
| C10 / imagini | Canva MCP generate-image/job polling și Codex image; fallback opțional | VERIFIED | canva.js, codeximage.js, engine.callImage | Capabilities negociate; provenance pe job și output. Nu presupune API universal din abonament. |
| C11 / fallback | Revenirea recursivă între furnizori poate reseta ceasul local de așteptare când ambii sunt limitați | INFERRED | fluxul engine.callImage | Test de control flow; buget comun și maximum un hop automat înainte de waiting_provider. Nu afirmăm incident reprodus. |
| C12 / imagini Codex | Descoperirea outputului după fișiere noi/mtime din directorul de imagini poate concura cu alt client extern | INFERRED | codeximage.js | Asociere owned execution/output; output ambiguu intră în reconciliere, fără atribuire prin cea mai recentă imagine. |
| C13 / critică | 18 criterii exacte; medie ≥8; T01/T07/T08 ≥7; maximum două corecții în etapa principală | VERIFIED | contracts.js, blueprint.rubric, engine.critique_revise | Consolidare, nu „introducerea de la zero” a criticii. Siguranța hard independentă trebuie adăugată. |
| C14 / editare | Corecturi text/color/lineart, istoric, restore, invalidare și redeschidere de review existente | VERIFIED | engine.js; index.js rute artifacts/items; contracts.js; tests/10-corrections.test.mjs | Upgrade către dependențe explicite și variante aprobate reținute pe termen lung. |
| C15 / stocare | PostgreSQL JSONB în șapte tabele, fișiere pe disc; backend local alternativ; scrieri individuale atomice/serializate | VERIFIED | repo.js; storage/postgres.js, local.js | Atomicitatea documentului nu garantează tranzacție artifact+approval+job+event+fișier. |
| C16 / istoric export | writeArtifact păstrează implicit cinci versiuni anterioare; exportProject v1 serializează conținutul/meta/versiunea curentă, fără versions și basedOn | VERIFIED | repo.writeArtifact; projectpkg.exportProject | Riscul de pierdere a istoricului la transport este concret; pachet v2 cu lineage și variante. |
| C17 / import | Import creează ID nou, intră Pregătit, resetă aprobările, păstrează lucrările marcate imported și snapshotul | VERIFIED | projectpkg.importProject; A pp. 248–250 | Nu autorulează. Aprobări istorice pot fi transportate ca dovezi, fără autoritate locală. |
| C18 / învățare | Lecții pe agent/global/vârstă/proiect; retrospectivă cu propuneri; exemple TF-IDF; preferințe și prompt bandit | VERIFIED | learning.js, ledger.js, knowledge.js, seeds/lessons.json | Păstrare și guvernanță unică; acestea sunt application-level learning. |
| C19 / import training | Importul poate crea lecții active imediat; learnFromEvent poate crea lecții active de proiect; ștergerea packului nu revocă toate lecțiile/exemplele sale | VERIFIED | training.importPack/deletePack; learning.addManualLesson/learnFromEvent | Separare observation/candidate/validated/active, index de revocare și approvals de promovare. |
| C20 / măsurare learning | Diferențe de scor și confidence local, bandit agregat pe etapă și knownFailures general | VERIFIED; eficacitate INFERRED | learning.js | Corelația nu este efect cauzal; cohortare, holdout, control negativ și provenance per lecție. |
| C21 / Assistant | Dali ghidează formularul și navigarea; sesiuni RAM TTL, acțiuni structurate; add_improvement poate urma rezultatul modelului | VERIFIED | assistant.js; public/app/ui.js | Serverul validează intenția și autorizația acțiunii; promptul singur nu constituie permisiune. |
| C22 / improvement | Atelier persistent, analiză, aprobare plan, copie separată, checks, revizuire umană, aplicare și rollback | VERIFIED | improve.js; ui.viewImprovements | Consolidare RCA și dovezi. Legătura către node_modules nu este un sandbox de securitate; aplicarea fișierelor cere verificarea bazei și commit sigur. |
| C23 / tipar | Digital 14 pagini cu două coperți; KDP Story 28 pagini, Coloring 26 și copertă wrap separată; font Andika, text vectorial, PNG și măsurări DPI în pipeline | VERIFIED | printprofile.js, public/app/pdf.js, pdfcheck.js; A pp. 238–241 | Paginile canonice și fizice sunt deja diferite. PDF checker-ul actual verifică count/MediaBox/font, nu toate proprietățile de tipar. |
| C24 / finalitate | Preflight comun, aprobări/fingerprints, receipts, inventar ZIP și preview separat; Drive/Canva protejate de approval | VERIFIED | delivery.js, output.js, package-check.js, engine.volumeApproved, index.js | Păstrare și un singur ReleaseCandidate legat de toate dovezile curente. |
| C25 / backup | Snapshot DB+files+manifest, hashes, retenție, copie secundară, restore și reconciliere; dimensiunea backupurilor reparată în v04 | VERIFIED | snapshot.js, output.js, reconcile.js; A pp. 248–251 | Restore testat recurent pe copie; trasabilitate extinsă și pentru joburi/knowledge. |
| C26 / securitate | localOnly, cod LAN cu sesiuni, CSP/CSRF/anti-rebinding, tokenuri criptate; TLS opțional; fallback la credentiale DB locale cunoscute | VERIFIED | lan.js, sanitize.js, secrets.js, tls.js, storage/postgres.js | Baseline necesar înainte de producție: bind local, transport controlat, drepturi OS, import izolat, fără credentiale default pe rețea publică. |
| C27 / teste | Auditul relatează 91/91 PASS v04, furnizori simulați și browser PDF real; build nou PASS | VERIFIED ca raport istoric / execuție NEW | A pp. 250–251; docs/v04/RAPORT-V04.md; scripts/build.mjs | Nu atribuim aceste 91 rezultate unei rulări noi. Nu avem dovada unei colecții complete generate real. |
| C28 / operații reale | Disponibilitate conturi, timpi, cote, volume finale, acceptarea tipografiei, securitate pe telefon și rezultate comerciale | UNKNOWN | Nu sunt în sursele furnizate sau necesită execuție actuală | Discovery repartizat P1/P3/P6/P8/P9; nu blochează proiectarea. |
| C29 / charter și provider Inginer | Charterul Inginerului cere text Claude-only, iar improve.engineer apelează direct runClaudeCode; runtime text general are și Codex | VERIFIED | agents/inginer.md; improve.js; llm.js | Nu presupune portabilitatea tuturor rolurilor deja rezolvată. Role/provider tool capabilities și charter consistency se verifică P3-T01/P3-T05/P7-T05. |

Navigarea confirmată: **Panou, Proiecte, Proiect nou, Tipuri de produs, Agenți, Învățare, Îmbunătățiri, Setări**; proiectul are **Progres, Revizuire, Carte, Livrare, Activitate**. UI generează în cel puțin un control link către `preview`, deși tabul cărții este `book`: inconsistență verificată în views.js/ui.js, de corectat cu un registru unic de rute, fără inventarea unei pagini noi.

H01–H08 și M01–M16 din raportul inițial nu sunt automat defecte ale v04. Auditul consemnează remedierea lor în v03/v04; codul confirmă multe remedieri. Testele negative trebuie păstrate. Rămân lipsuri sistemice și cazuri reziduale, precum canonul DW, guvernanța trainingului și tranzacțiile de workflow.

## OUTPUT-03 — Current State → Target State Gap Map

| Gap | Current → Target | Prioritate și proprietar | Implementare |
|---|---|---|---|
| G01 | Contract răspândit în blueprint/UI/export → ProductContract versionat, schema și page semantics explicite | Critică; Producător | P1-T01, P2-T01, P6-T04 |
| G02 | Documente canonice parțial redundante → Living Canon și pagini cu un singur adevăr autoritar | Critică; Continuitate/Arhitect serie | P2-T02, P4-T02, P4-T03 |
| G03 | Identități/personae → AgentProfile+RoleContract+skills+experiență+evaluări versionate | Ridicată; Producător | P3-T01, P7-T04 |
| G04 | Execuție RAM cu checkpoints → joburi durabile, lease, idempotency și apel ambiguu | Critică; Inginer | P2-T04, P3-T03, P3-T04 |
| G05 | History limitat/export curent → variante imuabile, lineage, pachet v2 și migrare verificabilă | Critică; Inginer | P2-T02, P2-T03, P2-T05 |
| G06 | Medie critică și reguli safety → hard gate text/imagine/vârstă, fără compensare prin scor | Critică; Editor critic/Director artistic | P5-T01 |
| G07 | Câmpuri editoriale prezente → cauzalitate, voci și payoff evaluate pe carte/colecție | Ridicată; Scriitor/Editor critic | P4-T03, P4-T04, P5-T02, P5-T04 |
| G08 | Layout families+preview → composition plan măsurabil, workbench cu impact local | Ridicată; Director artistic | P6-T01, P6-T02 |
| G09 | Lineart derivat+QA → colorabilitate, identitate și pereche validate în context | Ridicată; Director artistic | P5-T03, P6-T03 |
| G10 | Scoruri/critici locale → QualityAssessment pe Page/Book/Volume/Collection, blocker registry | Critică; Editor critic | P5-T02–P5-T06 |
| G11 | Training poate deveni activ imediat → quarantine, validare, promovare, revocare și rollback | Critică; Producător/Inginer | P7-T01, P7-T02 |
| G12 | Confidence/diferențe medii → evaluări pe cohorte, set rezervat și evidență înainte/după | Ridicată; Editor critic | P5-T05, P7-T03, P7-T04 |
| G13 | Atelier cu copie → Incident/RCA/RepairOutcome și aplicare verificată, legată de release | Ridicată; Inginer | P7-T05 |
| G14 | Operator și prompt actions → CommandContract, decizii explicite și permissions baseline | Critică; Dali/Inginer | P1-T04, P2-T04, P7-T06 |
| G15 | PDF checks limitate → readiness pe destinație cu pixels/boxes/fonturi/crop/proof | Ridicată; Inginer/Director artistic | P6-T04–P6-T06 |
| G16 | Operații locale existente → runbooks, restore drills, capacity evidence, CI/release | Ridicată; Inginer | P8-T01–P8-T04 |
| G17 | DW cu draft V1 și planuri → migrare, canon reconciliat, pilot, colecție completă, before/after | Critică; echipa editorială | P2-T05, P4-T05, P8-T05, P8-T06 |
| G18 | Funcții avansate cu UX fragmentat → creare ghidată, explicații, preview complet și accessibility | Ridicată; Dali/Producător | P4-T01, P6-T02, P8-T07 |

## OUTPUT-04 — Target Enterprise Architecture

Arhitectura recomandată este un **monolit modular Node**, cu API-ul și frontendul existente ca adaptoare. PostgreSQL rămâne stocarea preferată pentru instalația de producție; backendul local rămâne compatibil, cu jurnal de comenzi și recovery, fără promisiune de multi-worker. Asset Store rămâne pe disc. Nu sunt necesare microservicii, Redis, vector DB, Kubernetes sau o platformă nouă de agenți în P1–P8.

```text
Operator / Dali / Workbench / Existing SPA
                   |
      API + typed command validation + local/LAN policy
                   |
   Application services / Command Bus / transaction boundary
       |          |            |             |
  Collections   Canon      Human Gates   Release Candidates
       |          |            |             |
  Product-specific pipeline --> Durable Jobs + Execution Planner
                                    |
                    Permanent Agent Registry + Context Builder
                                    |
                       Provider Capability Adapters
                    /          |           \             
              native CLI   Canva MCP   Operator exchange
                                    |
                   staged output -> schema/safety/quality
                                    |
       Artifact Registry + dependency graph + Quality Engine
                   |                   |
      PostgreSQL transaction     immutable disk assets
                   \              / 
                     commit journal / outbox
                             |
                Learning candidates / RCA / experience
                             |
                 validated promotion + human decision

Cross-cutting: audit events, quotas, telemetry, versioning,
backup/restore, security baseline, licensing records, migration.
P9 adapters: production APIs, identity/tenant services,
external research/feedback, additional ProductContract plugins.
```

Domain services nu importă CLI, filesystem sau cod UI. Adaptoarele AI produc rezultate și UsageEvents, fără a modifica direct aprobări/canon. Quality Engine decide eligibilitate, Human Gate înregistrează decizia operatorului, Release Service reverifică snapshotul înainte de export. Event handlerul de learning primește dovezi, nu autoritate de a modifica politica.

Refactor incremental recomandat: extragere din engine.js către `server/domain/`, `server/application/`, `server/quality/`, `server/jobs/`, `server/agents-runtime/`, `server/providers/`; căile noi sunt propuse. `engine.js`, `repo.js` și `index.js` devin fațade de compatibilitate etapizat. Se extrage câte un use case cu teste existente, fără mutarea simultană a tuturor funcțiilor.

Comenzile au `commandId, actor, projectId, expectedRevision, payloadSchemaVersion`. O modificare de conținut generează în aceeași unitate logică: versiune, edge-uri de dependență, invalidări, decizie/event și actualizarea proiecției. Eventele livrate repetat sunt deduplicate. Outbox este un mecanism minimal pentru publicarea fișierelor/eventelor, nu adoptarea unui event-sourced system complet.

## OUTPUT-05 — Core Domain Model

| Entitate | Single Source of Truth / câmpuri importante | Lifecycle și reguli |
|---|---|---|
| ProductType / ProductContract | ID kids-sc; structure, ageProfiles, allowedComponents, requiredArtifacts, validators, renderingProfiles, version/hash | Draft → validated → published → retired; proiectul fixează versiunea. Story/Coloring sunt componente. |
| Project / Collection | projectId, contractSnapshot, input, ageBand, languages, options, currentRevision, status | Draft/ready → planning → review → production → final review → released; archived reversibil. Project reprezintă containerul operațional al Collection. |
| Volume / Book / Edition | volumeId 1..6; bookKind story/coloring; language doar pentru ediții; 12 pageIds stabile | Book are conținut+cover assets; Edition specializează limba fără duplicarea canonului. |
| CollectionBible / CanonRevision | characters, world, locations, props, style, relationship/state history, factual claims, first appearances, constraints | Draft → checked → approved → superseded. Snapshot aprobat este autoritatea; rezumatele sunt proiecții. |
| VolumeBible | goal, obstacle, incident, escalation, choice, consequence, ending, collectionContribution, canonRef | Exact șase, toate validate înainte de bulk. O premisă duplicată nu poate prevala peste manuscrisul aprobat. |
| Character / World / Style Asset | stable ID, identity invariants, anatomical side/occlusion, palette, silhouette, rights; views/expression/reference versions | Draft/reference-proposed → visually validated → approved; reutilizare cere compatibilitate și drepturi. |
| PageBlueprint | ID stabil; n; beat; cause/effect; characters/state/objects; text intents; reveal constraints; scene/action; layout; turn/payoff | Planned → validated → approved. Nu devine automat text final. Text/imagine/lineart trimit la această versiune. |
| Artifact / ArtifactVersion / VariantSet | artifactId, type, logical slot, immutable version/hash, creator/source, basedOn typed edges, assetRefs, metadata | Candidate → validated → selected → approved → superseded. Restaurarea creează o versiune nouă; nu rescrie istoria. |
| Asset | sha256, native dimensions, MIME, storage locator, rightsRecord, generationExecutionId, transformations | Staged → durable → bound → retained/tombstoned; GC exclude tot ce are referință sau aprobare reținută. |
| Approval / Decision | actor, reason, scope, artifact+dependencies hash, gateVersion, evidence, timestamp | Pending → approved/rejected/changes_requested; schimbarea inputului relevant o face stale, fără ștergerea deciziei. |
| QualityAssessment / Issue | assessor identity/version, rubric/policy, artifact snapshot, verdict, evidence spans, severity, affected scopes | Valid/invalid/unknown distinct; issue open → repair proposed → rechecked → resolved/reopened. |
| Job / ExecutionAttempt | jobKey, revision, lease, status, providerJobId, retryBudget, stopReason, checkpoint | Pending → leased → executing → checking → committed; alternative waiting_provider/review/ambiguous/failed/cancelled. |
| AgentProfile / RoleContract / SkillVersion | identity ID, charter, typed inputs/outputs, tool grants, capability versions, model bindings | Identitate permanentă; contracte versionate și migrare a setărilor; model schimbabil. |
| Experience / Knowledge / LearningCandidate | evidenceRefs, agent/skill/code, scope/cohort, validation, rights, confidence semantics, policyVersion | Observed → candidate → validated → approved → active → superseded/revoked. |
| Incident / Improvement / RepairOutcome | symptom, RCA, reproduction, patch or editorial delta, before/after, side effects, checks, approvals | Existing atelier workflow păstrat; closure cere revalidarea cererii și efectelor secundare. |
| ReleaseCandidate / PrintProfile / Receipt | exact approved versions, destination rules version, expected inventory, validation proof, file hashes | Prepared → checked → approved → exported → verified. Acceptarea platformei/tipografiei este o dovadă separată. |
| MigrationRun / Snapshot / AuditEvent | source hash/schema, transform IDs, unknowns, before/after inventories, checkpoint, events | Dry-run → staged → validated → committed → verified/rolled_back; fără suprascrierea originalului. |

Schema folosește ID-uri stabile și o reprezentare JSON canonică pentru hashes; ordinea cheilor nu schimbă amprenta. SSOT nu înseamnă un document imens: canonul are obiecte independente și proiecții read-only. `relative_size` legacy serializat ca JSON string se păstrează în raw și se parsează într-un câmp tipizat numai când este valid; valoarea nu devine automat geometrie verificată.

## OUTPUT-06 — Collection Intelligence Architecture

Living Collection Bible conține: promisiunea colecției, protagonistul permanent, cast flexibil, lume și geografie, reguli fizice/fantastice declarate per proiect, paletă/stil, relații, apariții, obiecte și posesori, arcuri și progresie emoțională. Volumele trebuie să fie autonome narativ și cumulativ coerente. Absența unui prieten într-un volum nu șterge relația; revenirea nu reprezintă o primă întâlnire.

Preproducția produce o matrice cu șase rânduri și coloane pentru scop, conflict, încercări, alegere culminantă, consecință, tip de umor, locații, personaje, obiecte, ending, aport în arc și sensibilități de vârstă. Comparatorul caută similitudini de funcție, nu doar titluri sau adjective diferite. Repetiția intenționată primește justificare; trei finaluri cosmetizate cu aceeași acțiune nu sunt diversitate.

Pagina are `stateBefore/stateAfter`, `mustShow/mustNotShow`, `firstAppearance`, `holder/objectRelation` și `relationshipTransition`. Continuitatea se calculează pe ordinea celor 72 de pagini, folosind starea inițială a fiecărui volum și închiderile precedente. Un raport semantic compară premise, scene, acțiuni, rezumate și referințele vizuale. Aprobarea canonului generează derived summaries; editarea unei proiecții propune o schimbare de canon, nu produce al doilea adevăr.

Modificarea unui obiect local invalidează pagina, perechea Coloring, QA și exportul afectate; o schimbare de identitate/canon calculează toate folosirile sale. Propagarea nu cere regenerare automată a întregii colecții: face stale dovezile și propune revalidare/reutilizare/repair pe fiecare dependent. Operatorul vede impactul înainte de confirmare. Implementare: P2-T02, P4-T02–P4-T05, P5-T04.

## OUTPUT-07 — Target Permanent Multi-Agent Architecture

Echipa descoperită se păstrează integral. Nicio identitate nu este combinată sau înlocuită de un executant generic.

| ID / nume existent | Responsabilitate target și owner de skills | Intrări → ieșiri / limită de autoritate |
|---|---|---|
| asistent / Dali, asistenta ta | Navigare, intake, explicația dovezilor, comenzi propuse | UI context+reguli → ActionProposal/form draft; fără aprobare, publicare sau promovare autonomă. |
| producator / Producător | Planul producției, resurse, integrarea notelor, retrospective, release coordination | Contract+gates+assessments → ProductionPlan/triage; motorul determinist deține tranzițiile. |
| director-creativ / Director creativ | Concept, diferențiere, promisiune și ton pe vârstă | Brief → CollectionConcept comparabil; nu inventează market proof. |
| arhitect-serie / Arhitectul seriei | Șase arcuri, cast, progression, complementaritate | Concept+canon → VolumeBibles/72 beat slots; nu scrie canon concurent. |
| pastrator-continuitate / Păstrătorul continuității | Canon, relații, apariții, posesie, cross-artifact coherence | Canon+sequenced evidence → CanonChangeProposal/ContinuityAssessment; modificarea canonului cere decizie. |
| scriitor / Scriitor | Voce, cauzalitate, read-aloud, page turns, revisions | Approved blueprint+age+role lessons → Script/PagePatch; nu își aprobă propria lucrare. |
| editor-critic / Editor critic | Critică independentă, safety semantic, evaluare carte/colecție | Output efectiv+rubric+canon → Assessment/IssueList cu citate și pagini; fără presupunerea intenției autorului. |
| corector / Corector | Stil, gramatică, lectură orală, QA nativ și editorial | Text selectat+context → edit delta/native assessment; nu schimbă beat-ul fără proposal. |
| traducator / Traducător | Adaptare literară EN/RO și alte limbi selectate | Source edition+canon+native rules → Page-aligned localized edition; conservă evenimentele și vocea, nu sintaxa literală. |
| director-artistic / Director artistic | Identitate, atlas, storyboard, compoziție, prompt, QA vizual, colorabilitate | Canon+scene+references → VisualPlan/Prompt/Assessment; identifică anatomia în interacțiune și contribuția imaginii. |
| inginer / Inginerul aplicației | Contracte, fiabilitate, validatori, RCA și atelier software | Incident+read copy+test contracts → reviewed plan/isolated patch/evidence; fără acces la datele și secretele live. |

Modelul actual implicit este Haiku pentru Dali/Producător și Sonnet pentru celelalte nouă; configurația permite GPT-6-Sol. Target păstrează preferințele utilizatorului, dar runtime validează capabilitatea efectivă. Maturity nu depinde de numele modelului.

Fiecare RoleContract definește mission, expected inputs, JSON schema outputs, prerequisites, context scope, owned skills, tool allowlist, quality dimensions, forbidden actions, escalation criteria, collaboration handoff și evidence obligations. AgentProfile fixează roleVersion, skillVersions, validatedKnowledgeSnapshot și evaluările maturității. ModelBinding separat definește provider, capability, model alias, reasoning option, limits și fallback. Un agent ID inexistent este eroare de contract; fallback-ul actual la Producător nu trebuie să mascheze un ID greșit.

Skills sunt unități mici, versionate: schema input/output, procedură, examples, negative cases, prerequisites și tests. Exemple: narrative causality, age dialogue, reveal sequencing, animal-object interaction, coloring simplification, native read-aloud, contract migration. Un skill poate fi partajat controlat, dar experiența lui rămâne atribuită rolurilor care au demonstrat-o. Cele patru skills de inginerie existente se importă cu hash și licență/provenance; nu sunt activate ca autoritate dintr-un training ZIP.

Memoria are cinci straturi: **rol stabil; experiență validată; context de colecție/proiect; context temporar al execuției; knowledge organizațional aprobat**. Context Builder selectează numai fragmente relevante pe rol/skill/etapă/vârstă/limbă/provider, include contraexemple și reține un manifest cu exact ce a fost folosit. Limitele de context se negociază cu providerul; bugetul de experiență nu sacrifică regulile hard sau canonul necesar. Un prompt global monolitic nu este memorie.

Senior este acordat per capabilitate după evaluare pe toate vârstele aplicabile, cel puțin trei teme distincte, cazuri negative și două rulări comparabile, fără defect critic; praguri inițiale: ≥90% contract pass, 100% cazuri safety blocate corect în set, scor median ≥8/10 și fără regresie față de baseline. Principal cere suplimentar diagnostic cauzal, transfer la temă rezervată, repair fără regresie, decizii explicate și rezultate repetate pe cel puțin două versiuni. Acestea sunt **criterii inițiale de evaluare internă**, de calibrat P5-T05/P7-T04, nu estimări ale performanței actuale ori certificare de siguranță universală.

Maturitatea se păstrează ca evidence record per skill/cohort, cu data și modelBinding; la schimbarea modelului se rerulează probe relevante. Identitatea și istoria nu se pierd, dar calificarea transferată nu se presupune. Implementare: P3-T01/P3-T02, P7-T03/P7-T04.

## OUTPUT-08 — Target AI Orchestration Architecture

Orchestratorul execută Contract → Plan → Context → Provider → Validation → Commit → Gate. Un stage nu este doar un prompt: are agent owner, artefacte obligatorii, dependențe/hash, output schema, deadline, quota estimate, retry budget, cache policy, validators și stop conditions.

| Canal | Dovezi externe și actuale | Politica target fără Paid APIs în P1–P8 |
|---|---|---|
| Claude Code nativ | Mod noninteractiv documentat; condițiile disting folosirea individuală a binarului oficial de rutarea terților prin abonamente | BYO cont al operatorului, binar nemodificat, login oficial, entitlement verificat; fără colectare/intermediere tokenuri de abonament. Compatibilitatea utilizării concrete se verifică P1-T03/P3-T05. Dacă indisponibilă/nepermisă, exchange manual. [CLI](https://code.claude.com/docs/en/headless), [condiții](https://code.claude.com/docs/en/legal-and-compliance). |
| Codex prin ChatGPT | Planul poate include Codex cu limite; autentificarea prin API key are facturare distinctă | Păstrează calea abonată verificată, probe separate text/imagine, fără achiziție de credite sau trecere automată la API. [Documentație oficială](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan). |
| Canva MCP | OAuth individual, drepturi/plan per utilizator; înrolarea clientului și instrumentele disponibile pot varia | Probe/read-only plus capabilities; nu declară Pro suficient pentru orice tool. Polling durabil și imports manuale când toolul lipsește. [Access and permissions](https://www.canva.dev/docs/apps/mcp/access/). |
| Operator-assisted | Input/output transferat în aplicații oficiale, fără presupunerea unui endpoint | Work packet cu schema, refs, hash, agent owner și return instructions; import rezultat verificat exact ca un rezultat automat, cu sursă manual/operator. |
| UI/browser automation | Posibilitate tehnică nu dovedește stabilitate sau drept de utilizare | Opțională, supravegheată, cu probe/terms și oprire la challenge; nu este fundația producției. Nicio ocolire a limitelor sau autentificării. |
| Paid/production APIs | Canale distincte, cu contracte și costuri proprii | Doar P9-A, activare explicită; adaptoarele sunt pregătite din P3, fără apeluri facturate. |

ProviderCapabilitySnapshot conține tool schemas, executable version, model availability, image refs/limits, native output sizes, quota provenance și `checkedAt/expiresAt`; stări installed/authenticated/verified/limited/unknown separate. Documentația Canva include și condiții de acces în schimbare; disponibilitatea contului/clientului este UNKNOWN până la probă. Nu fixăm rate limits din marketing în cod.

Politici inițiale propuse: maximum două retries de transport tranzitoriu cu backoff și jitter; o corecție a formatului JSON; două revizii creative per issue/etapă; o redesenare automată de pagină per ciclu de QA; un hop de provider. Toate consumă un **buget comun de execuție**, nu counters noi în funcții recursive. Auth/permission/safety/schema incompatibilă sunt nonretryable sau necesită operator. Quota exhausted/unknown → waiting_provider, fără polling agresiv. Provider accepted dar răspuns pierdut → ambiguous/reconcile; dacă nu există job ID verificabil, operatorul decide reluarea cu avertizarea consumului posibil, nu exact-once fictiv.

Cache key include contract, agent/skill/knowledge/prompt versions, canon/page input hashes, provider capability snapshot și parametri relevanți. Reutilizarea outputului valid cere dependențe neschimbate și o politică permisă; nu se reutilizează verdict safety când inputul s-a schimbat. Prefetch este speculative și se commită numai după revalidarea snapshotului. UI arată completed work units, consum măsurat/estimat/necunoscut și cauza așteptării. Implementare: P3-T02–P3-T06.

## OUTPUT-09 — Target Product Generation Pipeline

| Pas | Owner / artefacte și validări | Gate și executabilitate |
|---|---|---|
| 1. Idee / manuscris | Dali+Director creativ: temă, vârstă, limbă, stil, format, refs; input safety și rights | G0: confirmarea contractului și a surselor de operator; nu pornește automat după import. |
| 2. Concept colecție | Director creativ/Arhitect serie: alternative concise, promise, arc, șase VolumeBibles și cast | G1-plan: aprobare colecție după verificarea diversității, cauzalității și canonului. |
| 3. Canon vizual și blueprint | Continuitate/Director artistic: personaje/lume/style, atlas/expresii, 72 PageBlueprints/storyboards, derived coloring plans | Visual proposal minim înainte de bulk; referințele propuse nu primesc approved prin simpla prezență. |
| 4. Text V1 | Scriitor → Editor critic → Corector → Continuitate; structured findings și revizii locale | G2-text: operator vede întreg manuscrisul și schimbările; nu approve propria critică autorul. |
| 5. Demo reprezentativ | Copertă și scene cu mișcare, expresie, interacțiune și lineart; QA pe output efectiv | G3-visual: canon/stil/scene aprobate înainte de batch. Folosește etapele demo existente. |
| 6. Producție pilot V1 | Ilustrații selectiv, lineart din sursa color aprobată, localizare nativă, layout ambele limbi | QA pagină, pereche, carte, volum; G4-pilot: ambele cărți complete și print/digital checks. |
| 7. Volume 2–6 | Aceeași echipă; prefetch limitat; canon de început și progression; noi approvals pe texte/demo/final | Blocat de G4. Lecțiile pilotului sunt candidați de proiect aprobați înainte de aplicare. |
| 8. Collection QA | Editor critic/Continuitate/Director artistic: cross-volume canon, repetitivitate, relații și export inventory | G5-collection: verifică 6×2 și edițiile; fără compensarea unui volum slab prin media colecției. |
| 9. Release | Producător+Inginer: ReleaseCandidate, validations, files/hashes/licensing/proof status | G6-release: operator acceptă snapshotul curent; export, verificare ZIP și copie secundară cu status separat. |
| 10. Retrospectivă | Producător: outcome, feedback, defect/repair/evidence și candidates | Nu retrenează modelul și nu activează automat lecții. |

G1 poate fi prezentat în două subrevizuiri, plan editorial și canon vizual, păstrând review_collection. Noile gate-uri sunt contracte explicite în blueprintul nou, cu migrare; nu renumerotăm arbitrar gate-urile legacy. Outline-ul colecției și 72 blueprints preced bulk; manuscrisele finale 2–6 pot rămâne neproduse până după pilot, economisind resurse. Orice schimbare majoră de canon reaplică verificările afectate.

## OUTPUT-10 — Story Book Quality Architecture

Autorul scrie din beat map, nu dintr-un număr de cuvinte. VolumeBible trebuie să lege dorința protagonistului, incidentul, încercările și consecințele de alegerea care produce rezolvarea. Fiecare pagină schimbă situația sau oferă un moment liniștit intenționat. Criticul verifică pe textul efectiv, cu pagini/citate; intențiile declarate în prompt nu sunt dovadă. Introducerile de personaje, obiectele și cunoașterea personajelor sunt temporale.

| Dimensiune | Contract de producție | Probă și remediere |
|---|---|---|
| Cauzalitate și agency | cause → action/choice → consequence; contribuție vizibilă a protagonistului | Grafic de evenimente + critic semantic; se repară beat-ul afectat și vecinii, apoi rezumatele derivate. |
| Voce și relație | CharacterBible: vocabular, gesturi, motive, ritm, diferențe între narator și personaje | Dialogue assessment pe replici; referința la o voce nu permite caricaturi/stereotipuri. |
| Page turns | Hook și payoff cu ID; reveal nu este prezent înainte; quiet are funcție | Validator temporal + mapare în spreadul fizic; un payoff pe aceeași deschidere nu este „ascuns”. |
| Read-aloud | Fraze respirabile, pronume clare, dialog natural, repetiție cu variație, participare opțională | Corector nativ și lectura operatorului; defecte marcate per frază. TTS doar dacă disponibil și autorizat, nu API obligatoriu. |
| Text–imagine | Textul comunică esențialul, imaginea adaugă reacție/subtext/acțiune secundară | Critică comună manuscript+scene+output vizual; schema completă nu dovedește complementaritatea. |
| Ending / arc | Închidere afectivă și cauzală; volum independent, progresie în colecție | Compare endings și unresolved promises; fără teaser artificial sau final bedtime universal. |
| Localizare | Aceleași pageIds/evenimente, expresie nativă și propriul layout | Native QA după adaptare și după repair; lipsește verdictul → unknown, nu pass. |

| AgeBand | Complexitate target | Profil existent păstrat ca baseline |
|---|---|---|
| 3–4 | Un fir clar, suspans blând, evenimente concrete, reacții ușor urmărite, repetiție cu variație | 10–25 cuvinte/pagină în ghid; circa 300–500/carte orientativ; font de bază 26 pt. |
| 5–6 | Mai multe încercări, dialog, indicii simple și umor situational | 30–60/pagină; 500–800/carte orientativ; 20 pt. |
| 7–8 | Motivații/consecințe mai nuanțate, vocabular explicabil prin context, subtext | 60–100/pagină; 700–1200/carte orientativ; 16 pt; rămâne picturebook de 12 pagini. |

Aceste numere provin din contracte/ghiduri existente și nu sunt limite universale validate pe copii. Densitatea, vocabularul, conflictul, culoarea și detaliile se evaluează împreună. Hard limits sunt safety, structura și încadrarea reală; nu tăierea textului bun pentru a satisface caracterele orientative. O pagină wordless are intenție explicită și beat; golul accidental este eroare. Regulile actuale T18/no magic devin parametrizate în world policy: stricte pentru Dinosaur World naturalist, fără a impune tuturor temelor aceeași lume. Schimbarea este versionată și testată, nu eliminarea tăcută a unei reguli existente. P4-T04, P5-T02.

## OUTPUT-11 — Book Layout & Composition Architecture

Directorul artistic deține composition planning; Inginerul implementează verificarea și randarea. Se păstrează familiile action/dialogue/surprise/panorama/intimate și zonele top/bottom/left/right, cu schemă pentru frame, focal point, negative space, crop, safe zones, font și text region. Familiile nu sunt preseturi care se rotesc mecanic. Secvența alternează cadru, ritm și densitate când povestea o justifică; un motiv repetat poate fi intenționat.

PageLayoutPlan este separat de ilustrație și localizare. Textul rămâne vectorial/editabil, fără litere generate în artă. Măsurarea folosește fontul real, shaping/diacritice, leading, line breaks și regiunea disponibilă. Overflow → reflow într-o familie compatibilă, revizie locală a textului propusă sau schimbare de compoziție aprobată; nu micșorare ascunsă sub profil. Pentru RO se verifică independent de EN. Crop-ul nu poate elimina expresii, pete, coarne, mâini/picioare sau obiecte esențiale.

Workbench: thumbnails pentru toate cele 12 pagini, canvas, text/limbi, cast/props, scene contract, verdicturi, versions și impact. Comenzile disting exact replacement, stylistic adjustment, semantic rewrite, color repair, lineart-only repair, layout-only edit. Se vede înainte/după; rezultatul este candidate, aprobarea îl selectează. Restore creează revision nouă și revalidează dependents. Artă bună poate fi păstrată pentru un typo; schimbarea scenei face stale arta, QA și perechea lineart. Preview-ul complet arată ordinea, spreadurile și coperțile, separat de eligibilitatea release. P6-T01/P6-T02, P2-T02/P2-T03.

## OUTPUT-12 — Coloring Book Quality Architecture

Coloring derivă din **PageBlueprint și sursa color selectată/aprobată**, conservând evenimentul, castul, anatomia, expresia și obiectele. Simplificarea este o operație editorială: reduce fundalul și detaliul pentru vârstă, păstrând landmarkurile. Nu este simplă desaturare sau edge extraction. Dacă pagina color se schimbă, lineart rămâne accesibil ca istoric și devine stale până la revalidare/regenerare.

Deterministic checks: dimensiuni/pixels, lossless output, contrast, grosimea liniilor în unități fizice după plasare, zone închise/fragmentate, densitate pe zone, spații minuscule și margini. Valorile existente line weight/min_region sunt baseline, nu praguri universale; se calibrează pe native dimensions și mărime tipărită. Anti-aliasingul la contur nu este „shading” interzis: validatorul examinează zone interioare și distribuția tonurilor, păstrând toleranțe documentate. Gray fills, text accidental și linii haotice sunt diferite de pixels de margine.

Visual QA verifică colorability reală, forme recognoscibile și scena completă. Anatomia se verifică în posesie/interacțiune, nu doar pe portret. Coloring-only repair nu atinge arta color; dacă derivarea eșuează, păstrează ambele versiuni și rezultatul color bun. Gate pe fiecare pagină și pe întreaga carte, inclusiv coperta potrivită produsului. P5-T03/P6-T03.

## OUTPUT-13 — Product Quality Engine

Un QualityPolicy versionat selectează validators și rubrics pe nivel și ProductContract. Raportul canonic rulează pe server; UI afișează același assessment, fără al doilea preflight divergent.

| Layer | Exemple de verificări | Output / blocare |
|---|---|---|
| Deterministic | IDs, 6×2×12, page sequence 1..12, required outputs, schemas, language alignment, hashes, image dimensions | Verdict cu check IDs; missing/invalid sunt blockers. |
| AI semantic | Causalitate, voci, vârstă, valori, ending, subtext, native language | Evidence pe pagină/span și contract; răspuns incomplet este invalid/unknown. |
| Visual | Identitate, anatomie, obiect/action relation, reveal timing, readability, coloring | Exact image hashes și pageIds; toate dimensiunile obligatorii, vecini când relevanți. |
| Cross-artifact | Premisă vs script, scene vs text vs images vs lineart, canon vs cover, limbă vs eveniment | CanonConflict și impact edges; „câmp existent” nu înseamnă „sens coerent”. |
| Book | Ritm pe 12 pagini, page turns/spreads, read-aloud, varietate compozițională și preview final | Un volum nu trece doar din 12 pagini bune izolate. |
| Volume | Pereche Story/Coloring, toate edițiile, cover/title/blurb, QA și approvals | Gate comun cu inventar explicit; niciun required artifact nu dispare dacă lipsește. |
| Collection | Șase arcuri, relații, stil, repetitivitate, progresie, calitate minimă în fiecare volum | Release blocat de cel mai slab required component. |
| Child safety | Input, text, scene plan, image, translation și final layout; frightening intensity/developmental fit, stereotypes, dangerous imitation, sexual/violent content | `PASS / BLOCK / REVIEW / UNKNOWN`; orice non-PASS suspendă producția/release. Fără score averaging sau override de operator peste hard failure. |
| Print | Profile semantics, dimensions, effective DPI, fonts, text/crop/gutter/bleed, cover/inventory și proof | Readiness specific destinației; unknown nu este ready. |

Rubrica actuală T01–T18 se păstrează în schema de compatibilitate: age; coherence; canon; read-aloud; illustratability; coloring; safety/values; format; cast; turns; reveal; repetition; agency; ending; clarity; physical causality; procedural language; world rules. T18 este legat de policy-ul proiectului în versiunea nouă. Nu redenumim codurile și nu anulăm criteriile critice fără migrare. Adăugăm assessments distincte pentru completitudinea book/collection, vizual și print; nu supraîncărcăm scorul textului.

Politica inițială propusă pentru product pass: toate hard checks PASS; zero issue critical/high deschis; rubrică text completă, medie ≥8, critical T01/T08 ≥8 și niciun criteriu <7; safety separată PASS; dimensiuni vizuale obligatorii ≥8, cu evidence; book/collection assessments complete și operator accept. Aceste praguri mai stricte se versioneză și se calibrează pe gold set P5-T05; nu modifică evaluările istorice. Nu inventăm scoruri DW sau procent „premium”.

Score ancore propuse: 0–3 defect major/incompatibil; 4–6 necesită revizie; 7 acceptabil cu slăbiciuni; 8 bun și susținut de dovezi; 9 excelent pe caz; 10 excepțional și justificat. Evaluatorul declară evidence insufficiency și confidence limitată. Quotes sunt validate că există în input; image assessment trebuie să lege outputul actual. Repair se verifică față de **întreg contractul scenei**, nu numai defectul inițial. P5-T01–P5-T06.

## OUTPUT-14 — Best-Seller-Oriented Product Intelligence

Best-seller orientation optimizează factori controlabili: promisiune clară, memorabilitatea protagonistului, satisfacția read-aloud, recitire, umor potrivit, final afectiv, diferențierea volumelor, valoarea perechii Coloring, calitatea copertei și localizarea. ProductIntelligenceAssessment poate compara alternative de concept și cover în cadrul canonului, cu motive/evidence și costul de producție. Variantele nu se promovează pe preferința arbitrară a modelului.

Se păstrează trei registre distincte: **heuristici comerciale interne**, **benchmark intern cu exemplare și evaluatori**, **rezultate reale de piață**. Ultimul este gol/UNKNOWN până la P9-C. Un operator poate raporta propria preferință; nu este echivalent cu retenție, conversie, reacția copiilor sau vânzări. Similitudinea cu un competitor nu măsoară originalitatea juridică. P4-T01/P4-T02/P5-T05/P9-T07/P9-T08.

## OUTPUT-15 — Learning / Auto-Trainer Architecture

Auto-Trainer orchestrat înseamnă ingestie, structurare, evaluare și propunere de schimbare a aplicației/knowledge-ului; nu fine-tuning al modelelor de bază. Candidate = o ipoteză reutilizabilă cu sursă și scope, nu orice feedback reformulat imperativ.

```text
source -> quarantine -> parse/chunk + rights + provenance
       -> detect instructions/conflicts/duplicates -> candidate
       -> role/skill/scope mapping -> test set + counterexamples
       -> validation report -> operator promotion -> knowledge version
       -> context retrieval -> execution evidence -> outcome evaluation
       -> retain / narrow / supersede / revoke + rollback
```

Materialele externe sunt untrusted, inclusiv PDF-uri și instrucțiuni din ZIP. Nu execută scripturi, nu pot schimba charter/tool grants și nu devin system prompt. Acceptarea fișierului și activarea unei lecții sunt acțiuni diferite. Textul original este referențiat/chunked; drepturile de utilizare, redistribuire și reproducere sunt separate. Exemplele nu se copiază extensiv în output.

CandidateValidation include source reliability, quote/evidence authenticity, applicability, scope, contradiction with contract/canon, safety/IP, expected benefit, negative cases și rollback. Manual owner policy poate fi activată printr-o decizie explicită, etichetată „policy”, fără confidence pretins empirică. Importul, erorile și retrospectivele pornesc pending. Revocarea sursei suspendă materialele derivate și marcă execuțiile afectate pentru analiză; nu șterge istoria și nu invalidează automat toate cărțile dacă sunt independent corecte. P7-T01/P7-T02.

## OUTPUT-16 — Continuous Organizational Learning Architecture

Bucla completă este defect observat → RCA → repair candidate → recheck complet → outcome → learning candidate → evaluare în alte cazuri → promovare limitată → monitorizare. Registrul LL-001–035 este istoric util, nu dovada că toate safeguards KIDs DP OS sunt implementate în această aplicație. De exemplu, LL-013 spune protejarea pietrei, iar proiectul nou corectează motivul în adăpostul prietenilor: o lecție resolved istoric poate deveni incompatibilă cu versiunea nouă. Nu se importă fără reconciliere.

Scope implicit este cel mai îngust aplicabil: Page/Volume/Collection, apoi Project, Age+Language+Role și numai ulterior Organization. Promovarea globală cere cazuri distincte, contraexemple, compatibilitate cu vârste/teme, assessment și decizie. Problemele de anatomie în interacțiune pot produce un skill generic de verificare; regula „Tia ține frunza cu botul” rămâne canonul personajului/proiectului.

ExperienceRecord păstrează rol/skill/version, challenge, context relevant, decision, repair, result, evidenceRefs, sample/cohort și limitations. Căutarea se poate face cu actualul TF-IDF și metadate; vector DB se reconsideră numai după un benchmark de recall/precision și volum. Banditul actual primește cohort keys cu age/language/provider/model/skill/prompt versions și frozen evaluation windows. Schimbarea de model invalidează concluzia comparabilității, nu identitatea agentului. Măsurările pe aceleași date de training sunt etichetate in-sample.

Test rezervat, matched comparisons și negative transfer checks măsoară efectul lecțiilor. Preference reward separă „aprobat după reparare” de „a fost bun inițial”. O scădere repetată produce review/revocation, cu operator override documentat numai unde nu este safety. P7-T03/P7-T04.

## OUTPUT-17 — Continuous Improvement Architecture

Atelierul existent rămâne punctul de intrare. Adăugăm Incident și RepairOutcome: simptom, mediu, reproducere, cauză confirmată/inferată, dependențe, severitate, patch proposal, expected behavior, side effects, înainte/după și owner. Incidentele provider/auth/OS nu devin automat bugs de carte sau cereri de API key. Defectele creative și cele software au proceduri diferite, legate de același issue record.

Inginerul analizează o copie fără date/secrete, propune plan, primește aprobarea planului, modifică numai copia și rulează checks. Restricțiile existente asupra instalatoarelor, dependențelor, skills-urilor și datelor se păstrează. Legătura către modulele live trebuie înlocuită cu dependențe read-only verificate ori mediu izolat; testele nu primesc rețeaua/credentialele producției. Before apply: expected source hashes, inventar exact, protecții OS și regresie; conflict cu alt update → rebase/review, nu copy peste fișiere noi. Apply este journaled/staged cu backup; rollback de cod și revocarea regulilor propuse sunt coordonate. Suite absentă nu poate primi succes implicit.

Îmbunătățirea unei reguli urmează CandidateValidation, chiar dacă atelierul o propune. Dashboard-ul arată recurring patterns, repairs care au introdus regresii, cost și acceptare, cu linkuri la dovezi. P7-T05; operațiile de release și recovery P8-T02/P8-T03.

## OUTPUT-18 — Human Governance Architecture

Human Gate fixează actor, reason, artifact snapshot, policy/gate versions și scope. Review are approved, rejected, changes_requested, approved_with_exact_change și pending/unknown. Delegarea exactă este limitată la replacement neambiguu și nu constituie aprobare generală a unui rewrite. Corecturile creative se reîntorc la review. Dacă outputul sau dependențele se schimbă, se păstrează decizia istorică și se cere o decizie nouă.

Operatorul aprobă intake, plan/canon, text, demo, pilot, finale, schimbări de canon, promovări de knowledge, aplicări software și release. P1–P8 nu elimină această guvernanță și nu cer familiilor/customer research; feedback extern real începe în P9-C. Un operator poate respinge un output care a trecut QA, cu reason; nu poate face ready un hard safety fail sau un export tehnic invalid. Poate ajusta politica printr-o versiune nouă evaluată, fără bypass asupra release-ului curent.

Dali returnează ActionProposal; serverul verifică action allowlist, input schema, resource scope, current revision și dovada intenției utilizatorului. Read-only navigation și form draft sunt reversibile; mutation/release/knowledge promotion au confirmare specifică. „Fă cartea mai veselă” nu autorizează publicare ori schimbarea tuturor politicilor. Comenzile respinse sunt explicabile, cu alternative valide. P2-T04/P7-T06.

## OUTPUT-19 — Workflow & State Architecture

ProjectStatus este o proiecție pentru operator; JobStatus descrie executarea. `completed` existent nu trebuie să fie sinonim cu published/print accepted. Definim planning, waiting_review, producing, paused, waiting_provider, attention_required, ready_to_release, released și archived, cu adapter către etichetele legacy. ReleaseState este separat de completion.

```text
ready -> planning -> waiting_review -> producing -> checking
                          ^              |             |
                          |              v             v
                      local repair   paused/limited   gate
                          |                            |
                          +---------- recheck --------+
                            -> pilot accepted -> later volumes
                            -> collection checked -> ready_to_release
                            -> operator release -> exported/verified
```

Tranzițiile sunt validate server-side cu revision check. Artefacte și approvals nu se publică înainte de durable commit. Checkpoint fixează product/canon/artifacts, agent/skill/knowledge/prompt snapshots, jobs, decisions, provider jobs și manifests; reluarea nu înseamnă doar stageIndex. Change în input produce un nou generation revision și replanificarea dependents; work units deja valide se păstrează. Worker mort pierde lease, dar outputul extern nu se reapelează până la reconciliere. Cancel nu șterge rezultate comise. Pause așteaptă safe boundary; stop now conservă ce este durable și marchează attempt-ul incomplet. P2-T04/P3-T03/P3-T04.

## OUTPUT-20 — Persistence + Artifact Architecture

Se păstrează tabelele actuale JSONB și interfața storage, extinzând numai unde integritatea o cere: `schema_migrations`, `artifact_versions`, `artifact_dependencies`, `decision_records`, `jobs`, `execution_attempts`, `commit_journal/outbox`, `knowledge_versions`, `migration_runs`. Profile/skills/experiences pot începe ca documente versionate cu index metadata, fără câte o tabelă pentru fiecare noun. FK/check/index se introduc după audit și backfill în staging; niciun cascade nou nu șterge implicit istoria validă.

Un update folosește UnitOfWork: expected project revision → insert immutable artifact version → dependencies+decisions invalidation → update current pointer/job → audit/outbox → transaction commit. Pentru fișiere: write staging, checksum, flush/close, atomic rename în blob store înainte de binding; crash între rename și DB lasă un orphan recuperabil. DB nu poate marca committed un fișier absent. Outbox finalizează receiptele/exporturile. Un garbage collector citește reachability, face dry-run și păstrează grace period; reconcile-ul actual read-only se păstrează.

History retention: versiunile selectate/aprobate, folosite în release, citate ca evidence sau incluse în migration sunt pin-uite. Variantele nereținute au policy explicit și buget; operatorul poate șterge candidați nelegați. Cinci versiuni nu pot fi limita pentru toate artefactele aprobate. Deleted projects au tombstone și procedura existentă de purge, cu impact preview și protecția producției active.

Project package v2 include original/raw migration source, product snapshot/extensions, canon and artifact versions, dependency graph, assets/hashes, decisions ca evidence, quality reports, role references și migration manifests; exclude credentiale și knowledge privat al altor proiecte. Import v1 rămâne suportat; import v2 verifică inventory/schema/hash/size și creează local gates pending. Backup complet este distinct de transportul proiectului; restore al instalației poate reface autoritatea locală în condițiile runbookului, importul pe altă instalație nu. P2-T01–P2-T05.

## OUTPUT-21 — Reliability Architecture

Se păstrează timeouturi, checkpoints, flush, backup și reconcilierile existente. Introducem durable job ledger, lease cu fencing token, shared retry budgets, deterministic job keys și admission control. Exact-once în provider extern nu este promis; ținta este at-least-once scheduling cu idempotent local commit și reconciliere a efectelor externe.

| Eșec | Comportament target / probă necesară |
|---|---|
| Provider rate/quota/auth | limited/auth_required explicat, backoff durabil, operator/manual adapter; nu consumă resurse în loop. |
| Provider timeout după accept | provider job lookup ori ambiguous; refuză replay automat fără dovadă. |
| JSON/QA incomplet | Candidate păstrat cu invalid reason; bounded repair; niciodată fallback pass. |
| Fișier absent/corupt | Binding invalid, release blocat; restore/select alt candidat, nu placeholder final. |
| Disk full/DB unavailable | Nu ACK committed; job recoverable, code și user reason; protected good version intact. |
| Crash/restart | Fencing/reconcile și replay al comenzii locale; după restore exact snapshots. |
| Backup/secondary copy fail | Copia principală validă rămâne; mirror status failed și retry separat, fără publicare duplicată. |
| Two operators stale edit | expectedRevision conflict 409 cu diff; nu last-write-wins pe canon/gate. |
| Patch concurrent | Hash base conflict oprește apply; rebase în copia de lucru. |

P3-T03/P3-T04/P5-T06/P8-T02 verifică și întreruperea la fiecare safe boundary. Mesajele „nimic nu se pierde” se restrâng la starea comisă și verificată, cu indicarea unității în curs care poate necesita reconciliere.

## OUTPUT-22 — Observability & Provenance Architecture

Fiecare execuție are traceId, project/volume/book/page, generationRevision, agent ID, charter/skill/knowledge/prompt versions, **model/provider efectiv**, inputs hashes, tool version, providerJobId, timings, retry reason, budget, assetHashes, quality report și decision IDs. Provenance se capturează din execuția reală; modelul implicit al agentului nu descrie un stage care a folosit override. Context manifest arată ce lecții/exemple/fragmente au intrat și ce au fost excluse.

AuditEvents durabile pentru mutații și gates; operational logs sanitizate pentru diagnostic; Quality/UsageEvents pentru măsurare. SSE este delivery către UI și poate fi reconectat cu event cursor; nu este jurnalul autoritar. Progresul se calculează din unități planificate/committed/validated și arată separat review/limited. După replanificare, totalul poate crește cu explicație; nu animăm procente inventate.

Metrici: schema-pass, first-pass quality, repair success și regression rate, human override, canon drift, missing assets, provider waits, queue age, p50/p95 stage timing, effective DPI failures, knowledge retrieval precision și holdout delta. Datele editoriale brute/secretele nu apar în logs default. Operatorul poate inspecta inspectorul de artefact/job/agent/learning din Activitate/Agenți/Învățare. P3-T02/P3-T06/P7-T03/P8-T01.

## OUTPUT-23 — UX / Product Architecture

Navigarea actuală rămâne recognoscibilă. Proiect nou devine flow ghidat: idee/manuscris → contract vizibil → concept/șase volume → canon/stil → review și pilot. Câmpurile avansate sunt progressive disclosure; Dali poate completa, dar operatorul vede ce a dedus. EN/RO și vârsta nu sunt ascunse în metadata. Importul afișează sursa și raportul de migrare înainte de lucru.

Progres arată „ce s-a terminat / ce se verifică / ce te așteaptă / de ce s-a oprit / ce opțiuni ai”. Revizuire are blockers înaintea scorului, comparație candidate/selected, diffs și impact preview. Carte găzduiește workbench+preview complet Story/Coloring/limbi; Livrare are destination checks, lipsuri, proof status și manifest. Învățare separă surse/candidați/active/evaluări; Agenți separă identitate/capabilități/performanță de model. Îmbunătățiri păstrează workflowul, adăugând RCA/evidence.

Accessibility: tastatură, focus return/trap doar în modal, label/error associations, status live regions fără flooding, contrast, zoom 200%, touch targets, mobile fără overflow de pagină. Verdicturile nu sunt numai culoare. Generarea continuă după închiderea browserului dacă hostul rulează; suspendarea laptopului este explicată. O rută veche primește alias controlat; registry-ul de routes elimină preview/book mismatch. P4-T01/P6-T02/P7-T06/P8-T07.

## OUTPUT-24 — Production Operations Architecture

Distribuția Windows actuală este păstrată; fără MSI/EXE nou obligatoriu. Build/lint existent rămâne verificarea de sintaxă și resurse, nu este descris ca TypeScript/ESLint. CI recomandat: lockfile/pin checks → baseline+unit+contract → integration local și PostgreSQL temporar → mock E2E → browser/PDF checks → release inventory/secrets scan → signed/versioned manifest. Probe reale minimale se rulează separat cu cont autorizat, nu pe fiecare commit și nu confundă mockurile cu producția.

Upgrade: snapshot DB+files+config+source verificat, schema compatibility check, maintenance admission stop, staged deployment, migration/backfill, health, smoke, rollback point. Migrarea destructive contractului se amână până după perioada de compatibilitate. Full restore într-o copie include jobs/knowledge/lineage și rezolvă leases expirate; nu pornește generare/release după restore fără reconciliere.

Runbooks: start/stop, provider auth/quota, disk/DB failure, crashed job, ambiguous output, stale approval, export fail, backup restore, mirror failure, failed update și knowledge rollback. Health separă process alive, storage usable și provider capability; app poate fi sănătoasă în waiting_provider. Retenția existentă de 14 snapshoturi automate rămâne default până la dimensionare; manualele nu se șterg automat. Proof-urile fizice și uploadurile editoriale sunt pași ai operatorului, nu condiție de cumpărare API.

Ținte inițiale propuse: zero ACK pentru mutații nedurabile; RPO=0 pentru date comise recuperabile după crash local dacă disk/DB sunt intacte; disaster RPO ≤24h cu backup zilnic; RTO ≤2h pe hostul de referință după drill. Aceste ținte nu sunt rezultate măsurate și nu acoperă defecțiunea simultană a hostului și backupului. P8-T01/P8-T02/P8-T03.

## OUTPUT-25 — Performance / Capacity Architecture

Envelope P1–P8: un host Windows, un proiect în producție, un renderer PDF și o operație image/provider serializată când adaptorul cere; text concurent maximum două numai dacă providerul și dependencies permit. Prefetch este opțional și anulabil; producția are prioritate față de Dali/atelier. Nu anunțăm capacitate multi-tenant pe acest model.

Colecția cere cel puțin 72 scene color și 72 lineart, plus coperți și atlas; variantele și limbile schimbă footprintul/exporturile. Estimarea storage este `Σ native assets + retained variants + PDFs + manifests + backups`, cu multiplicator de retenție măsurat. Before admission se verifică spațiul pentru staging+output+snapshot și un prag configurabil; nu inventăm GB sau durata colecției dintr-un ZIP de drafturi.

Target de interacțiune propus: API read p95 <1s și mutație locală p95 <2s pe datasetul de test declarat, excluzând AI și PDF; UI vede un event nou în ≤2s când conexiunea este activă. Provider latency este separat. P8-T04 măsoară 1/10/100 proiecte arhivate și o colecție activă cu variante, cache eviction, memory, disk/DB pool și renderer. Testele sintetice nu sunt throughput AI real. Dacă țintele nu se ating, optimizăm query/proiecții/lazy assets înainte de infrastructură nouă. P9-A/B poate extinde numai după probe multi-worker/tenant.

## OUTPUT-26 — Security Baseline

În P1–P8 sunt necesare: bind local default; LAN opt-in cu sesiuni și permisiunile existente; fără expunere publică; HTTPS pentru aprobări/secrete pe LAN în configurația de producție; Host/Origin/CSRF și rate limits; validare server-side; upload/ZIP cu limite per entry/total/filecount, path traversal/symlink/duplicate-name handling, MIME+decode checks; nicio execuție din pack; secret storage și redaction; API keys interzise în main provider mode; backup protejat de ACL și accesul OS; workspace separat pentru Inginer.

Credentialele DB locale cunoscute din compatibilitate se izolează la migrarea instalațiilor legacy; instalările noi folosesc secrete generate și loopback. Nu rotație automată a credentialelor existente fără backup, verificare și procedură. Exporturile exclude secrets/config privată. Materialele training pot avea prompt injection; contextul le delimitează și tool permissions se impun în adaptor/command layer, nu prin text. Rapoartele safety și reviewer prompts nu pot executa comenzi.

P1-T04 introduce checklist executable și negative tests, P2/P3/P7 întăresc fiecare boundary. Full auth/SSO/RBAC/tenant isolation, audit compliance, internet perimeter, adversarial pentest și privacy governance sunt P9-B. Produsul constrained nu se descrie ca SaaS public securizat înaintea acelei validări.

## OUTPUT-27 — Commercial / Licensing / Provenance Readiness

RightsRecord pentru input/manuscris/personaj/ref/font/dependency/output: owner/source, grant type, commercial/reproduction/derivative permissions, attribution, territory/expiry, terms URL+date/hash când disponibil, provider/account context și reviewer. „Uploaded” nu dovedește proprietate; „generated” nu dovedește exclusivitate sau drepturi în toate jurisdicțiile. Fontul local și licențele dependințelor se verifică din pachetul efectiv; nu presupunem că toate permit orice distribuție doar din numele lor.

Release checklist include proprietatea surselor, evitarea personajelor/licențelor terților neautorizate, metadata și declarațiile AI cerute de destinația curentă, fonturi și third-party notices, proof status și trasabilitatea modificărilor. Platform-specific rights se verifică la release, cu blocare dacă dovada necesară lipsește. Designul artistic poate fi original fără ca output AI să fie exclusiv; nu promitem protecție juridică sau bestseller.

Benchmarkul ReadKidz declară utilizare comercială a outputurilor, cu limitări privind materialele terților, nonexclusivitatea și responsabilitatea utilizatorului. Acesta este context comparativ, fără a transfera drepturi către WonderPages. [Rights & Commercial Use](https://www.readkidz.com/rights). P1-T05/P6-T06/P8-T03; procese juridice multi-client și contracte de furnizor P9-A/B.

## OUTPUT-28 — Reference Project Migration, Upgrade & Before/After Validation

### Baseline verificat și limite

DW v04 are șase artefacte: brief, series, bible, cast, refs, script_0. Există șase VolumeBibles și 72 page plans, dar numai V1 are 12 pagini de manuscris pregătit: EN 335 cuvinte și draft RO 344. Toată colecția este 3–4 ani, EN+RO, portrait 4:5, soft3d. Aprobările și livrările sunt goale. Nouă prompturi din snapshotul proiectului diferă de blueprintul global; acestea sunt extensii de proiect care trebuie conservate și revizuite, nu înlocuite prin upgrade global.

Referințele Milo (1199×1312) și Tia (1222×1287) au hashes conforme. Vizual: Milo are identitate teal/crem și trei pete coral vizibile pe partea prezentată; Tia este patrupedă orange/crem cu frill lavender și trei coarne. O singură perspectivă nu validează atlasul, toate ocluziunile sau pozițiile în poses dinamice. Pip are descriere și plan de atlas, fără referință produsă. Nu există ilustrații de pagină, lineart final, PDF final ori probe de tipar în arhivă.

| ID | Finding / status | Upgrade și dovadă obligatorie |
|---|---|---|
| DW01 | VERIFIED: summary V1, series.volumes[0].story_bible.premise și script_0.story_bible.premise încă descriu protejarea pietrei de ploaie; paginile 8–9 adăpostesc prietenii | Conflict semantic reconciliat către canonul aprobat; nu doar search/replace arbitrar. Test fixează trei câmpuri și comparația cu paginile, plus derived summaries. |
| DW02 | VERIFIED: turn.type din page_plan V1 este quiet pe toate paginile; opt pagini au alt type în script | Conservă ambele raw; operator alege contractul intenționat; derive PageBlueprint canonic și revalidează hook/payoff/spread. |
| DW03 | VERIFIED: landmarks există structurat și repetate în canonical_description; relative_size poate fi JSON string | Typed adapter, raw preservation și deduplicare de context; nu pretinde validare geometrică. |
| DW04 | VERIFIED: Milo species-indeterminate; Tia folosește botul pentru frunză; pana lui Pip este obiect | Canon constraints și negative tests; nu forțează specia Milo sau „mână umană” Tia. |
| DW05 | VERIFIED: lipsesc manuscrise finale V2–6, atlas nou, artă pagini, lineart și exporturi | Producție completată ulterior prin pipeline; baseline vizual final = NOT_AVAILABLE. |
| DW06 | INFERRED: unele planuri/reformulări pot avea diferențiere insuficientă în finaluri și beat-uri | Compare matrix pe șase volume și critic fresh; nu declară defect literar final din planuri. |
| DW07 | VERIFIED: import ready, aprobări goale; custom prompts și ref-uri originale | Migrare fără autorun sau invented approvals; hash-urile input/ref și extensiilor bune identice. |

### Procedură de migrare și finalizare

1. P1 fixează original ZIP/PDF hash și baseline evidence. P2-T05 implementează dry-run v1 → target schema în workspace separat, păstrând raw și alias ID mapping. Backup și MigrationRun preced orice commit.
2. Mapare fără generare: produs/age/languages/6×12, identități, refs și cele șase artefacte; split în canon/proiecții; păstrare extensii. Câmpurile noi fără dovadă sunt unknown/pending, nu completate cu presupuneri. Integrity/inventory și conflict report sunt obligatorii.
3. P4-T05 propune repair selectiv DW01/DW02 și canon/page blueprints, cu operator approval. Revalidate actualul manuscris V1; păstrează pagini bune. Atlasul lipsă se produce prin joburi noi, cu aprobări vizuale.
4. Pilot V1: native RO review, critic fresh, demo, artă și Coloring, layout și întreg book QA. Paginile 1/2 testează first discovery; 4/5 reveal Tia; 7 reflexia aceleiași pietre; 8/9 cause/shelter; 12 case distincte. Reparația p9 trebuie să conserve simultan anatomia și acțiunea vizibilă.
5. După pilot acceptat, completează V2–6 din planurile aprobate și rulează QA de colecție. P8-T05 este execuția reală de migrare+upgrade în aplicația implementată; P8-T06 compară și reexportă. Aceste acțiuni **nu au fost executate în acest task de arhitectură**.
6. Export target `dinosaur-world-enterprise-v1.zip` propus, cu manifest, versions, reports și release files; reimport într-o instanță izolată, reopen toate componentele și reevaluate gates. Originalul rămâne disponibil; reportul listează preserved/repaired/new/revalidated și motivele.

### Before / After evidence contract

| Dimensiune | Before disponibil | After cerut / comparație permisă |
|---|---|---|
| Integritate și compatibilitate | 5 intrări manifest conforme; 6 artefacte/72 plans/2 PNG | Zero pierderi; ID/version mapping și reexport/reimport verificat. |
| Canon semantic | 3 premise reziduale și 8 turn.type divergente | Conflicte rezolvate cu evidence și approval; validatori+critic pe același conținut disponibil. |
| Story/age/read-aloud | Draft V1 EN/RO, fără assessment nou numeric | Frozen rubric și evaluator settings pe baseline și after; citate/diffs, matched pages și limitations. |
| Artă/coloring/layout final | Nu există înainte | Raport de completare nouă și calitate after; fără procent de „îmbunătățire vizuală” față de lipsă. |
| Workflow/versioning | Ready/imported, fără approvals/release | Istoric, repair lineage, resume/crash, aprobări pe hashes și stale export refusal. |
| Print readiness | Niciun PDF disponibil | Native pixels, crop/fonts/geometry/inventory, proof status și profile compatibility. |
| Commercial evidence | Nu există | Heuristici interne etichetate; market validation rămâne UNKNOWN înainte de P9-C. |

Compararea literară folosește aceleași 12 pagini și aceleași dimensiuni, cu versiuni de evaluator/policy fixate, ordine randomizată unde posibil și operator adjudication. Schimbarea modelului/evaluatorului este confound documentat. Rezultatul nu poate omite paginile care s-au înrăutățit. Downgrade/rollback conservă original și outputurile noi separat; nu inversează prin rescriere peste original.

## OUTPUT-29 — ReadKidz External Benchmark & Parity / Superiority Map

Snapshotul din cerință, datat 01.10.2026, este U-RK. Verificarea selectivă din 02.10.2026 folosește: **R1** [tutorial public](https://www.readkidz.com/tutorials/picture-book), **R2** [limite tehnice KDP](https://www.readkidz.com/tutorials/kdp/prepare), **R3** [safety claims](https://www.readkidz.com/safe), **R4** [rights](https://www.readkidz.com/rights). „DEMO” înseamnă funcție descrisă/ilustrată în tutorialul public al furnizorului, fără hands-on autentificat; „CLAIM” nu verifică eficacitatea; „LIMIT” este limită documentată. „U/UNKNOWN” păstrează o observație a cerinței care nu a fost confirmată granular.

| ID / Capability | Evidence / categorie | Current WonderPages | Decision / Target | Phase / Task |
|---|---|---|---|---|
| RK01 Idee scurtă | R1 / DEMO: intake simplu | Formular temă | MATCH: ghidare cu contract vizibil | P4-T01 |
| RK02 Manuscris existent | R1 / DEMO: text importat | seed_story și import | ADAPT: provenance, paginare 12 și canon | P4-T01 |
| RK03 Vârstă | R1 / DEMO: age option | 3+/5+/7+ | ADAPT: benzile 3–4/5–6/7–8, evaluare reală | P4-T04 |
| RK04 Temă/gen | R1 / DEMO: options | descriere/stil/comments | ADAPT: întrebări relevante fără taxonomie copiată | P4-T01 |
| RK05 Modelare poveste | R1 / DEMO: story changes | notes/revisions | SURPASS: cauzalitate și impact pe colecție | P4-T02, P5-T02 |
| RK06 Concept/storyboard | U-RK; R1 doar parțial | series/page plans | SURPASS: 6 bibles+72 blueprints înainte de bulk | P4-T02, P4-T03 |
| RK07 Stil selectat | R1 / DEMO: style choice | visual_style | MATCH: selecție și stil versionat | P4-T03 |
| RK08 Propunere vizuală | R1 / DEMO: preview înaintea artei | anchors/demo | ADAPT: sample reprezentativ+operator gate | P4-T05 |
| RK09 Portrait/ref sheets | R1 / DEMO: base look | references/atlas fields | SURPASS: ocluziune, expresii, anatomie în acțiune | P4-T03, P5-T03 |
| RK10 Cast reusable | R1 / DEMO: character reuse | bible/ref pe proiect | ADAPT: registry cu drepturi și compatibilitate | P4-T03 |
| RK11 Settings/props | R1 / DEMO: scene/prop assets | world/canon | SURPASS: first appearance și state timeline | P4-T02, P5-T04 |
| RK12 Page workbench | R1 / DEMO: page workspace | Carte/Revizuire fragmentat | MATCH: integrated evidence/versions | P6-T02 |
| RK13 Passage edit | R1 / DEMO: local text edit | page edits | SURPASS: typo/style/semantic și impact calculat | P6-T02 |
| RK14 Image repair | R1 / DEMO: selective repaint | target color/line | SURPASS: full scene-contract recheck | P5-T06, P6-T03 |
| RK15 Page variants | U-RK / granular semantics UNKNOWN | five-version history | SURPASS: selected/approved pinned, restore+deltas | P2-T03, P6-T02 |
| RK16 Reuse între cărți | R1 / DEMO: saved cast | refs în export/import | ADAPT: references fără aprobări portabile | P2-T05, P4-T03 |
| RK17 Progres | R1 / DEMO: stage reporting | SSE/stage counters | SURPASS: durable work units+stop reason | P3-T06 |
| RK18 Background/resume | R1 / DEMO: batch queue; resume detail UNKNOWN | local server/checkpoints | SURPASS: leased jobs/reconciliation | P3-T03, P3-T04 |
| RK19 Human review | R3 / CLAIM: public moderation | approvals interne | ADAPT: operator gates; feedback extern separat | P2-T04, P9-T07 |
| RK20 Child safety | R3 / CLAIM: filters | T07 și charters | SURPASS: independent blocking gates și test cases | P5-T01 |
| RK21 Complete preview | U-RK / preview semantics parțial | tab Carte | MATCH: toate paginile/perechea/limbile | P6-T02 |
| RK22 PDF/images | R2 / LIMIT: source exports | PDF/ZIP și presets | SURPASS: inventory și destination validation | P6-T04, P6-T05 |
| RK23 KDP/300 DPI | R2 / LIMIT: fără export KDP complet garantat | checks existente, profil legacy | SURPASS: măsurări, fără etichetare dacă incompatibil | P6-T04, P6-T05 |
| RK24 Commercial use | R4 / CLAIM/terms summary | provenance parțial | ADAPT: rights ledger și release review | P1-T05, P6-T06 |
| RK25 Multilingual | U-RK; R1 interfață multilingvă, nu dovadă literară | EN/RO adaptation | ADAPT: native QA per edition | P4-T04, P5-T02 |
| RK26 Animation/comics/music/3D | R1 navigation / ofertă publică | în afara produsului | DEFER: posibilitate P9-D, fără obligație de implementare a acestor formate | P9-T09, P9-T10 |
| RK27 Adăugare arbitrară pagini / alte age bands | R1 / DEMO: page changes | blueprint configurabil | REJECT în contractul curent: nu schimbă 6×2×12 sau vârstele | P1-T01, P9-T09 |
| RK28 Clonare branding/taxonomie/UI | U explicit | produs distinct | REJECT: design propriu, numai echivalență funcțională | P4-T01, P8-T07 |

Deciziile SURPASS sunt **ținte**, nu rezultate deja obținute sau afirmații despre implementarea internă a competitorului. ReadKidz nu este sursă pentru numărul de agenți ori schema WonderPages. Lipsa unei capabilități în pagina publică nu dovedește absența sa în produs.

### Rațiunea adopției, cost și risc

| Grup | Valoare / fit / efect asupra contractului | Cost și complexitate / risc de regresie |
|---|---|---|
| RK01–04, 07, 12, 21 / MATCH-ADAPT UX | Reduce efortul operatorului; folosește formularul și taburile actuale; structura rămâne fixă | Mai ales UI+schemas, cost Medium; teste routes/form/empty-state și fără autorun. |
| RK05–11, 16, 25 / ADAPT-SURPASS editorial | Face canonul și textul reutilizabile în șase volume; diferențiator existent consolidat | Mai multe evaluări și refs, cost High de contract/quality; pilot înainte de bulk și context budgets. |
| RK13–18 / SURPASS control | Economisește consum, păstrează variante, explică joburile; compatible cu motorul actual | DB/versioning și orchestration High/XHigh; teste selective no-change și crash/fallback. |
| RK19–20 / ADAPT-SURPASS governance | Siguranță și aprobare explicite; operatorul rămâne autoritate editorială | Semantic checks au consum; hard schema/rules sunt locale; cannot bypass și teste false positives/negatives. |
| RK22–24 / SURPASS-ADAPT release | Clarifică ce poate fi livrat; niciun număr DPI sau ready fără dovadă | Local measurements/PDF parser/proof; High; legacy profiles conservate, profile regression suite. |
| RK26–28 / DEFER-REJECT | Protejează produsul și bugetul; extensii viitoare izolate | Niciun consum nou în fazele principale; P9 trebuie să dovedească backward compatibility. |

Tutorialul de pregătire ReadKidz documentează că exporturile sunt surse, necesită pregătire externă pentru KDP și nu garantează interior/copertă 300-DPI la dimensiune fizică. Acest lucru justifică un contract de readiness măsurabil, nu copierea unui claim de marketing. [Sursa tehnică](https://www.readkidz.com/tutorials/kdp/prepare).

# PHASED IMPLEMENTATION ARCHITECTURE
Fazele sunt dependency-driven. Modulele noi sunt propuneri; fișierele existente sunt relative la ZIP-ul APP. Fiecare TEST-Pn-Txx și AC-Pn-Txx este definit în taskul aferent. RS0 înseamnă suita originală integrală, build/lint și verificarea distribuirii. Niciun test real de provider nu cumpără acces; lipsa disponibilității blochează readiness relevantă, nu este mascată ca succes.

## PHASE 1 — Baseline, contracte și limite de operare

### Objective

Fixează baseline executabil și regulile protejate înainte de refactor.

### Why this phase exists

Documentele includ stări istorice; executorul trebuie să știe ce păstrează și ce lipsește realmente.

### Dependencies

Niciuna; începe direct cu P1-T01. Nu cere configurarea unor Paid APIs.

### Current components affected

package.json/lockfile, blueprint, agents, tests, docs, scripts/build.mjs, config/storage/lan și integrări.

### Evidence from current system

C01–C05, C23–C28; U; G pp. 7–28; A pp. 10–25 și 238–251; NEW și DW manifest.

### Architecture changes

Evidence register, invariants, ADR pentru semantică de paginare și matrice actual/unknown; nicio rescriere runtime.

### New components

docs/architecture/contracts, baseline fixtures și capability discovery report (căi propuse).

### Existing components to refactor

Numai validări sau mesaje fals pozitive dovedite; runtime mai amplu se modifică în fazele următoare.

### Components preserved

Instalator, dependencies pinned, 11 agent IDs, gates, digital/legacy KDP profiles, import ready și zero proiecte noi implicit.

### Data / schema changes

Doar schemas/fixtures și identifiers pentru viitoarele migrations; fără alter table încă.

### AI / Permanent Agent workflow changes

Inventariază traseele reale și ownerul fiecărei etape; execution provider probes rămân distincte de org agent identity.

### Agent Capability / Skill / Experience changes

Capturează persona/custom models și patru engineering skills; creează baseline capability tests, fără Senior cosmetic.

### Knowledge / Learning changes

Capturează seeds, active lessons, examples și LL-001–035 ca surse cu scope; nu le activează prin simpla lectură.

### UI / UX changes

Inventar de rute/controale și protected flows; plan pentru alias preview/book și stări unknown.

### Product quality impact

Contractul 6×2×12 și hard-safety target devin verificabile.

### Book/content quality impact

Conservă V1 bun; documentează DW01–DW07 și faptul că celelalte volume sunt planuri.

### Reliability impact

Separe actual/historical/runtime unknown; stabilește failure fixtures pentru fazele următoare.

### Operational impact

Definește hostul de referință, storage mode, tool versions și discovery gates fără date/secrete în raport.

### Implementation Tasks

#### P1-T01 — Contractul protejat și ADR de paginare

**Objective / change:** Scrie ProductContract schema și assertions 6 volumes, story/coloring, 12 content pages, age bands, edition semantics; adoptă decizia OUTPUT-11/ADR04 pentru 12 physical content pages și profilul legacy separat.

**Files/modules likely affected:** blueprints/kids-sc.json; contracts.js; printprofile.js; docs/architecture; teste noi contract. **Dependencies:** —.

**Protected behavior:** Blueprint snapshoturile v13/v14/v15 și exporturile legacy rămân identificabile. Nu schimbă numărul de pagini pentru benchmark.

**Validation — TEST-P1-T01:** Importă fixtures cu 5/7 volume, 11/13 pagini, component lipsă și limbi multiple; verifică refuzul și mapping explicit al profilului KDP legacy.

**Acceptance — AC-P1-T01:** Contract hash și 6×2×12 sunt validate; două ediții Story nu sunt Product Types noi; profil incompatibil nu primește ready.

**Legacy migration / Dinosaur World:** DW rămâne 3–4/EN+RO; raw blueprint/custom prompts păstrate.

**ReadKidz decision:** REJECT RK27. **Effort:** Medium.

#### P1-T02 — Baseline de software și regresie

**Objective / change:** Inventariază sursa/hidden files/entry points și fixează tests baseline; reproduce doar defecte curente, separând rapoartele v02/v03/v04.

**Files/modules likely affected:** scripts/build.mjs; tests/run.mjs; docs; release inventory. **Dependencies:** P1-T01.

**Protected behavior:** Nu dezactivează niciun test și nu modifică mocks pentru a ascunde un defect.

**Validation — TEST-P1-T02:** Rulează build și suita în copie izolată; compară protecțiile import/approvals/PDF/backup/learning/atelier/LAN, cu rezultate și runtime versions.

**Acceptance — AC-P1-T02:** Raportul dă PASS/FAIL/NOT_RUN per check și link la logs; istoricul 91/91 este separat.

**Legacy migration / Dinosaur World:** Include DW fără a porni producția; bytes/hashes și count6/72/12/2 confirmate.

**ReadKidz decision:** —. **Effort:** Medium.

#### P1-T03 — Discovery de providers și capacitate

**Objective / change:** Adaugă probe separate text/image, terms/entitlement și schema tools snapshots; capturează actual executable/version/auth/quota și configurația hostului.

**Files/modules likely affected:** llm.js; claudecode.js; codextext.js; codeximage.js; canva.js; subscription-usage.js; docs. **Dependencies:** P1-T02.

**Protected behavior:** Păstrează login nativ; fără API keys/credite cumpărate/partajare tokenuri; read-only probe prima.

**Validation — TEST-P1-T03:** Simulează auth null, model unavailable, quota unknown, tool schema schimbată; probă reală mică numai când disponibilă și permisă.

**Acceptance — AC-P1-T03:** Unknown nu este verde; fiecare canal are supported/operator-assisted/unavailable, dovadă și expirare.

**Legacy migration / Dinosaur World:** DW importabil fără provider; generarea lipsurilor așteaptă capabilitatea validată.

**ReadKidz decision:** SURPASS RK17–18. **Effort:** High.

#### P1-T04 — Baseline de securitate

**Objective / change:** Consolidează localOnly/Host/Origin, upload isolation și transport config; limitează legacy DB credentials la migrare locală și definește fresh-install secret generation.

**Files/modules likely affected:** sanitize.js; lan.js; tls.js; storage/postgres.js; training.js; config.js; installer/runbooks. **Dependencies:** P1-T02.

**Protected behavior:** LAN valid opt-in, date/config existing și login se păstrează; nicio rotație automată a secretelor legacy.

**Validation — TEST-P1-T04:** Traversal/duplicate ZIP entries/oversize/decode mismatch, request străin, session expiry și fresh install fără credential default accesibil de pe rețea.

**Acceptance — AC-P1-T04:** Untrusted input nu produce execuție sau mutation neautorizată; transport de producție LAN verificat ori LAN restricted; secrete absente din export/log.

**Legacy migration / Dinosaur World:** Refs bune DW importate identic; atacurile sintetice nu se introduc în proiectul real.

**ReadKidz decision:** —. **Effort:** High.

#### P1-T05 — Rights și baseline editorial

**Objective / change:** Definește RightsRecord și source evidence register; verifică licențele fontului/dependencies/refs și inventariază gaps DW/lessons.

**Files/modules likely affected:** font resources/licensing files; package inventory; projectpkg.js; docs; DW fixtures. **Dependencies:** P1-T01.

**Protected behavior:** Nu declară drepturi pentru materiale fără provenance și nu șterge surse bune.

**Validation — TEST-P1-T05:** Input cu drepturi unknown/expired; font license absent; raw project hash comparator și findings DW01–07.

**Acceptance — AC-P1-T05:** Fiecare asset/font/dependency are source și rights status; unknown comercial este blocant la release, fără a bloca editarea internă.

**Legacy migration / Dinosaur World:** Cele două referințe originale sunt pin-uite; before baseline explicit incomplete.

**ReadKidz decision:** ADAPT RK24. **Effort:** Medium.

### Validation

TEST-P1-T01–TEST-P1-T05. Baseline suite pe copie cu date temporare; provider probes minimale numai în contul autorizat, sau status UNKNOWN.

### Regression Suite

RS0: suita existentă completă, build/lint, inventory. Dacă mediul nu permite o verificare, înregistrează cauza și o blochează la readiness, fără test skipped descris ca PASS.

### Acceptance Criteria

AC-P1-T01–AC-P1-T05; fiecare invariant are un validator sau test plan, fiecare unknown are owner/fază.

### Definition of Done

Report actualizat din execuție; toate sursele au hash/date; originalele sunt intacte; scope și baseline acceptate pentru P2.

### Risks

Drift între ZIP și instalarea reală; provider limits; regula 12 scene vs physical pages.

### Rollback / Recovery

Șterge numai copia de analiză identificată; nu atinge instalarea sau arhivele. Nicio migrare ireversibilă.

### What NOT to do in this phase

Nu Paid APIs, install upgrades, publicare, rewrite, generare completă ori schimbare de canon fără decizie.

### Deliverables

Baseline dossier, protected-behavior register, ProductContract draft, feasibility/rights/discovery register.

## PHASE 2 — Domain și persistence versionate, migrare sigură

### Objective

Introdu single sources of truth și transport fără pierderea istoriei, cu compatibilitate legacy.

### Why this phase exists

Canon, history, decisions și job state trebuie să fie durabile înainte de automatizare suplimentară.

### Dependencies

P1; P2-T01 precedă P2-T02/P2-T04; P2-T02 precedă P2-T03/P2-T05.

### Current components affected

repo.js; storage/*; contracts.js; projectpkg.js; snapshot.js; index.js; artifact review UI.

### Evidence from current system

C15–C17/C24/C25; DW01/DW02/DW07; G/A anexele proiectului.

### Architecture changes

UnitOfWork, immutable versions, typed dependency graph, revision checks, v1 adapter/v2 package și migration journal.

### New components

Domain schemas, migration registry, version/dependency/decision storage și command journal.

### Existing components to refactor

Repo write/restore, import/export, gate fingerprints și multi-document commits; fațade compatibile.

### Components preserved

Current APIs, backend local, PostgreSQL JSONB, ready-on-import, previews, purge safeguards și backup format compatibility.

### Data / schema changes

Additive SQL migrations și local journal; FK/index după staged backfill; artifact raw+normalized fără ștergere.

### AI / Permanent Agent workflow changes

Agent output este candidate până la schema validation și commit; no direct gate mutation.

### Agent Capability / Skill / Experience changes

Identity IDs și custom profiles sunt referințe stabile; contract/knowledge hashes pot fi legate ulterior de executions.

### Knowledge / Learning changes

Knowledge persistence folosește același version protocol; active lessons legacy etichetate migration/imported, nu validate retroactiv.

### UI / UX changes

Migration report, versions inspector, stale badges și impact preview; import fără start automat.

### Product quality impact

Opresc aprobările stale și pierderea variantelor; structure/canon integrity verificabile.

### Book/content quality impact

DW premise divergente sunt semnalate, fără rescriere artistică automată.

### Reliability impact

Atomic local commit, optimistic concurrency și recovery journal; crash nu lasă pointer curent la fișier lipsă.

### Operational impact

Backup/restore cu noul schema registry; downgrade compatibility declarată.

### Implementation Tasks

#### P2-T01 — UnitOfWork și schema registry

**Objective / change:** Introdu migrations numerotate, revision CAS și transaction pentru project/artifact pointer/decision/event; local mode journal echivalent cu recovery single-writer.

**Files/modules likely affected:** storage/postgres.js/local.js; repo.js; new server/domain and persistence modules. **Dependencies:** P1-T01–P1-T04.

**Protected behavior:** Păstrează local storage API și JSONB documents, instalările vechi și toate settings.

**Validation — TEST-P2-T01:** Două edits pe aceeași revision, DB/disk fail înainte/după commit și repeated commandId; restore și backfill cu orfani detectați.

**Acceptance — AC-P2-T01:** Un singur commit valid, 409 pe conflict, retry deduplicat; niciun ACK înainte de durability.

**Legacy migration / Dinosaur World:** DW raw documents rămân byte-hashed; ID mapping persistat.

**ReadKidz decision:** —. **Effort:** XHigh.

#### P2-T02 — Canon și dependency graph

**Objective / change:** Modelează autoritatea CanonRevision și PageBlueprint, tipurile de edges semantic/visual/layout/release; summaries devin proiecții; compute impact fără autoregeneration.

**Files/modules likely affected:** contracts.js; editorial.js; repo.js; new domain/canon and dependencies. **Dependencies:** P2-T01.

**Protected behavior:** Păstrează original content și summary ca raw legacy; typo nu invalidează arta dacă semantica e neschimbată.

**Validation — TEST-P2-T02:** Schimbare p7 text semantic, typo exact, canon landmark, object first appearance; verifică exact dependents și siblings unaffected.

**Acceptance — AC-P2-T02:** Impact determinist și explicit; change nu produce două canonuri autoritare; stale evidence propagat la release.

**Legacy migration / Dinosaur World:** Detectează DW01/DW02 și păstrează scenele bune.

**ReadKidz decision:** SURPASS RK05/11/13. **Effort:** High.

#### P2-T03 — Variante imuabile și retention

**Objective / change:** Separă artifact current pointer, immutable versions și VariantSet; pin approved/released/evidence; restore creează versiune nouă cu lineage.

**Files/modules likely affected:** repo.js; index.js artifacts routes; UI versions; new artifact_versions store. **Dependencies:** P2-T02.

**Protected behavior:** Nu pierde istoricul disponibil sau arta aprobată după mai mult de cinci încercări.

**Validation — TEST-P2-T03:** Creează >5 candidates și approved pin, restore și purge dry-run; verifică old hashes și dependency rebinding.

**Acceptance — AC-P2-T03:** Variantele approved rămân selectabile, restore este auditabil și nu rescrie trecutul.

**Legacy migration / Dinosaur World:** Ref-uri/draft V1 pin-uite; importul nu inventează variante care nu sunt în v1.

**ReadKidz decision:** SURPASS RK15. **Effort:** Medium.

#### P2-T04 — Decision și gate contracts

**Objective / change:** Persistă Decisions pe exact content/dependency/policy hash și actor; centralizează command authorization și expected artifact inventory.

**Files/modules likely affected:** engine gateItems/gateSummary/completeGate; delivery.js; index.js; decision store. **Dependencies:** P2-T01, P2-T02.

**Protected behavior:** Gate final poate înlocui demo valid; approvals imported se resetă; exact delegated correction rămâne explicită.

**Validation — TEST-P2-T04:** Approve apoi same-length edit/ref change; missing language/image; two stale operators; collection export fără gate.

**Acceptance — AC-P2-T04:** Stale/missing nu poate deveni release; toate mutations au decision/event durable și resource scope valid.

**Legacy migration / Dinosaur World:** DW intră ready cu approvals pending; decisions originale doar historical evidence.

**ReadKidz decision:** ADAPT RK19. **Effort:** High.

#### P2-T05 — Package v2 și migrator DW

**Objective / change:** Versionează transportul cu versions/dependencies/raw source/quality/manifests; import v1/v2 staging+dry-run+checksum; migration este idempotentă.

**Files/modules likely affected:** projectpkg.js; training unzip; snapshot.js; new migration_runs; tests fixtures. **Dependencies:** P2-T02–P2-T04, P1-T05.

**Protected behavior:** Nu suprascrie ZIP original; refs/custom prompts preserved; import ready fără autorun.

**Validation — TEST-P2-T05:** Roundtrip DW, corrupt hash/missing asset/unsupported schema/duplicate migration; compare original raw refs și count6/72/12.

**Acceptance — AC-P2-T05:** Zero silent loss; unknown fields raw retained sau documented; migration error rollback fără proiect parțial.

**Legacy migration / Dinosaur World:** Produce migration report, nu finalizează V2–6; aprobările se reiau.

**ReadKidz decision:** ADAPT RK16. **Effort:** High.

### Validation

TEST-P2-T01–TEST-P2-T05 cu local și PostgreSQL temporar, fault injection între staging/commit/receipt.

### Regression Suite

RS0 + RS-DATA: versions, decisions, package v1/v2, change invalidation, purge, snapshot restore și missing assets.

### Acceptance Criteria

AC-P2-T01–AC-P2-T05; zero pierderi de date/refs; approvals importate nu conferă autoritate locală.

### Definition of Done

Roundtrip v1→target→v2→target verificat; raw retained; rollback deschide baseline și schema versions documentate.

### Risks

Backfill de FK cu orfani; activarea greșită a approvals; output files neatinse de DB transaction.

### Rollback / Recovery

Backup și migration shadow copy; revert current pointers/journal după verificare. Nu drop columns până la release ulterior aprobat.

### What NOT to do in this phase

Nu normalizare totală DB, event sourcing complet, produse noi sau content regeneration.

### Deliverables

Schema/migrations, ArtifactRegistry, dependency graph, decision history, package v2 și DW dry-run report.

## PHASE 3 — Organizație permanentă și orchestration durabilă

### Objective

Leagă identitățile permanente de contracte, context și provider adapters, cu joburi fiabile.

### Why this phase exists

Stage state există, dar execuția externă și contextul nu au încă suficientă identitate durabilă.

### Dependencies

P2; registry/context precedă planner; scheduler precedă fault/fallback și UI progress.

### Current components affected

agents.js/agents/*.md; engine.js; llm/claudecode/codex/canva/governor/ledger; core SSE.

### Evidence from current system

C04–C12/C18/C21; G agenți/flux; APP role charters și provider control flow.

### Architecture changes

RoleContract/SkillVersion/ModelBinding, ContextManifest, Job/Attempt leases, capability negotiation și shared budgets.

### New components

server/agents-runtime, providers adapters, jobs planner/scheduler și execution context store.

### Existing components to refactor

Extrage agentComplete/callImage și runPipeline incremental; păstrează wrapper API și stages.

### Components preserved

11 identities/custom settings, subscriber-native paths, one-project policy, prefetch valid și operator gates.

### Data / schema changes

Versioned agent registry; jobs/attempts/outbox; usage/provenance fields și provider capability snapshots.

### AI / Permanent Agent workflow changes

Handoffs typed; temporary workers execută rolul permanent; evaluator fresh evidence; task ownership stabil.

### Agent Capability / Skill / Experience changes

Skills contracte + tests, fără acordarea imediată Senior/Principal; role versions retained.

### Knowledge / Learning changes

Context retrieval folosește doar knowledge eligibil și role-specific; toate applied versions salvate.

### UI / UX changes

Agenți: rol/model separat; Progres: work units, wait reason, reconnect și safe pause.

### Product quality impact

Automatizare bounded cu validare; nu amplifică defects prin fallback implicit.

### Book/content quality impact

Script/demo și canon DW rămân input pentru agent contract; nu inventează output missing.

### Reliability impact

Lease/fencing, commit idempotent, ambiguous job state, bounded retries/fallback.

### Operational impact

Admission control și diagnostic tools fără extra subscriptions; manual exchange first-class.

### Implementation Tasks

#### P3-T01 — Permanent Agent Registry

**Objective / change:** Migrează 11 profiles și custom settings la stable identity + roleVersion + skill bindings; elimină silent unknown-ID fallback din executarea de taskuri.

**Files/modules likely affected:** agents.js; agents/*.md; .claude/skills; new registry/contracts. **Dependencies:** P2-T01, P1-T02.

**Protected behavior:** Same IDs/names/preferences/experiences; nu merge identități și nu depinde de provider.

**Validation — TEST-P3-T01:** Swap model/provider, missing ID, old persona hash și custom charter; verify stable ID/history și schema rejection.

**Acceptance — AC-P3-T01:** 11 profiles persistente; fiecare rol are typed inputs/outputs, tools și forbidden actions; istoricul charterelor recuperabil.

**Legacy migration / Dinosaur World:** DW owners/references mapate fără rescriere de conținut.

**ReadKidz decision:** —. **Effort:** High.

#### P3-T02 — Context Builder și provenance reală

**Objective / change:** Asamblează role→product→approved canon→task→eligible experience→data; persistă manifestul exact și effective model/prompt overrides.

**Files/modules likely affected:** engine.agentComplete/provenance; ledger.js; learning.lessonsFor; new context builder. **Dependencies:** P3-T01, P2-T02.

**Protected behavior:** Canon/hard rules nu sunt eliminate prin truncation; proiectul nu primește lecții private ale altui proiect.

**Validation — TEST-P3-T02:** Wrong-role lesson, injected training instruction, context budget și stage model override; compare manifest la prompt efectiv.

**Acceptance — AC-P3-T02:** No cross-project leakage; determinism al selecției și reproducere exactă a contextului; model efectiv corect.

**Legacy migration / Dinosaur World:** Reduce duplicated landmarks în context, păstrează raw JSON și refs.

**ReadKidz decision:** SURPASS RK09. **Effort:** High.

#### P3-T03 — Durable Planner și Job Scheduler

**Objective / change:** Mapează stages existente către stable job keys/inputs hashes; SQL leases/fencing și journal local; safe checkpoints și reconcile startup.

**Files/modules likely affected:** engine.runPipeline/expandStages; index startup; new jobs store/scheduler. **Dependencies:** P2-T04, P3-T02.

**Protected behavior:** One active project, safe pause, no autorun imported, current validated work reuse.

**Validation — TEST-P3-T03:** Crash la lease/start/output/check/commit; expired worker încearcă commit; repeated request/start și stale prefetch.

**Acceptance — AC-P3-T03:** Nu duplicate local commits sau stale worker writes; resume pornește doar unități necesare.

**Legacy migration / Dinosaur World:** Import/migration DW nu pornește; generarea lipsurilor se planifică după gate.

**ReadKidz decision:** SURPASS RK18. **Effort:** XHigh.

#### P3-T04 — Bounded retry, fallback și output ownership

**Objective / change:** Folosește un ExecutionBudget comun; un hop provider, deadlines globale; providerJob lookup/ambiguous și output paths/request IDs owned.

**Files/modules likely affected:** engine.callImage; canva polling; codeximage output scan; governor; jobs attempts. **Dependencies:** P3-T03.

**Protected behavior:** Fallback rămâne opt-in; approved assets păstrate; quota unknown nu este bypassed.

**Validation — TEST-P3-T04:** Ambii providers limited, response lost after accept, alt client scrie newest PNG, exhausted retry și cancellation.

**Acceptance — AC-P3-T04:** Nicio buclă infinită/bounce; output ambiguu nu este atribuit; deadline/budget consum comun verificat.

**Legacy migration / Dinosaur World:** Nu regenerează refs DW când outputul există și lineage este valid.

**ReadKidz decision:** SURPASS RK18. **Effort:** XHigh.

#### P3-T05 — Capabilities și operator exchange

**Objective / change:** Adaptează provider tool schemas/executable versions și separă supported/limited/manual; work packet cu schema, hashes/refs și return ingestion.

**Files/modules likely affected:** llm/codex/canva/subscription-usage; new provider interfaces; UI Settings. **Dependencies:** P1-T03, P3-T02–P3-T04.

**Protected behavior:** Fără auto-purchase/API keys; sign-in numai oficial; nu colectează subscription tokens.

**Validation — TEST-P3-T05:** Tool removed/changed, image refs unsupported, login denied și manual output valid/invalid/stale hash.

**Acceptance — AC-P3-T05:** Execuția verifică entitlement/capability; manual output are aceleași validators/provenance și gates, fără fals automatic.

**Legacy migration / Dinosaur World:** Poate completa DW prin canal manual aprobat dacă abonamentul e limitat.

**ReadKidz decision:** ADAPT RK22. **Effort:** High.

#### P3-T06 — Progress și inspectability

**Objective / change:** Persistă Usage/Audit events, SSE cursor replay și truthful work units; afișează stage/job/agent/context/output cu stop reason.

**Files/modules likely affected:** ledger.js; index SSE; core.js; views.js; Progress/Agents/Activity. **Dependencies:** P3-T03–P3-T05.

**Protected behavior:** Actual navigation și contextul ne-tehnic; logs sanitizate; închiderea browserului nu oprește hostul.

**Validation — TEST-P3-T06:** Disconnect/reconnect SSE, laptop suspend/restart, unknown quota și replanning total; compare UI cu committed units.

**Acceptance — AC-P3-T06:** Progres măsurabil, fără ETA inventată; niciun event duplicat vizual și inspectorul leagă outputul efectiv.

**Legacy migration / Dinosaur World:** Before/after workflow DW inspectabil pe IDs, nu chat memory.

**ReadKidz decision:** SURPASS RK17. **Effort:** Medium.

### Validation

TEST-P3-T01–TEST-P3-T06; crash/timeout/quota/schema/tool change și concurrent external image attribution.

### Regression Suite

RS0+RS-DATA+RS-JOBS: stop/resume/prefetch/cancel, same provider calls, process restart și output association.

### Acceptance Criteria

AC-P3-T01–AC-P3-T06; model swap păstrează identity/knowledge; retry budgets nu pot fi resetate recursiv.

### Definition of Done

All stage executions au execution IDs, context/provenance și final state; no false ready; manual adapter validat.

### Risks

Provider schema drift, rights/access restrictions, quota race și ambiguous external effects.

### Rollback / Recovery

Flag staged adapter per proiect; drain jobs și păstrează attempts; restore registry/knowledge bindings fără pierdere de identity.

### What NOT to do in this phase

Nu microservices, new organizational agents, broker extern, unlimited loops, paid fallback sau pooled subscriber accounts.

### Deliverables

11 RoleContracts, skill registry, context builder, durable scheduler, provider/manual adapters, progress inspector.

## PHASE 4 — Collection intelligence și preproducție editorială

### Objective

O idee produce conceptul colecției, canon și 72 blueprints verificabile înaintea bulkului.

### Why this phase exists

Fields editoriale există; consistența semantică și planificarea globală trebuie să fie workflow obligatoriu.

### Dependencies

P2/P3; P4-T01→P4-T02→P4-T03; story/age și DW reconciliation după plan/canon.

### Current components affected

blueprints/kids-sc.json; editorial.js; engine handlers; agents writer/series/canon/art; Project new/review UI.

### Evidence from current system

C02/C03/C06/C13; DW01–DW07; A pp. 22–23; G editorial/collection; RK01–11.

### Architecture changes

Concept variants, collection matrix, canon timeline, 6 bibles, 72 typed PageBlueprints și visual proposal gate.

### New components

Collection planning validators, canonical asset registry și guided concept/review components.

### Existing components to refactor

Series/bible/cast/scripts stages și form wizard; păstrează user input și snapshot extensions.

### Components preserved

6×2×12, age selection per collection, seed manuscript, original refs, natural EN/RO și existing approval structure.

### Data / schema changes

Canon/PageBlueprint/VolumeBible versions, derived summaries, rights refs și reveal/state edges.

### AI / Permanent Agent workflow changes

Director creativ→Arhitect serie→Continuitate→Director artistic; Scriitor/Corector pe approved context; Producător integrează.

### Agent Capability / Skill / Experience changes

Skills age-aware causality, voice, relationship history, atlas/prompt design și role handoff.

### Knowledge / Learning changes

Known good DW corrections devin project candidates; nicio globalizare a natural-light rule pentru toate temele.

### UI / UX changes

Creation low-friction cu contract vizibil, compare concepts și review plan/canon/proposal.

### Product quality impact

Preproduction gate împiedică propagarea unui canon sau plan slab.

### Book/content quality impact

Page turn, agency, read-aloud și complementaritatea text–imagine devin contracte, nu etichete.

### Reliability impact

Planul durabil fixează inputs; invalidare selectivă când operatorul schimbă concept/canon.

### Operational impact

Nu consumă un batch întreg pentru a proba stilul; full pilot real se execută la P8 după integrarea quality/layout/learning.

### Implementation Tasks

#### P4-T01 — Guided idea/manuscript flow

**Objective / change:** Adaugă intake scurt, progressive disclosure, form inference preview și concept choices; registru routes inclusiv preview→book alias.

**Files/modules likely affected:** public/app core/views/ui/actions; assistant.js; input_schema; routes registry. **Dependencies:** P3-T05, P2-T04.

**Protected behavior:** Form existent, import/seed_story și nontechnical labels; Dali nu start/publică prin inferență.

**Validation — TEST-P4-T01:** Empty input, invalid age, manuscript >limits, stale form, route alias și inference confirm/cancel.

**Acceptance — AC-P4-T01:** Operatorul vede theme/age/languages/style/format/source înainte de create/start; routes duc la funcția reală.

**Legacy migration / Dinosaur World:** DW import se vede ca sursă existentă; fără wizard care o rescrie.

**ReadKidz decision:** MATCH RK01; ADAPT RK02/04; REJECT RK28. **Effort:** Medium.

#### P4-T02 — Collection matrix și living canon

**Objective / change:** Generează șase bibles diverse și state/relationship/object timeline; canonical summaries derivate, cast returns și factual certainty explicită.

**Files/modules likely affected:** series/bible/cast handlers; editorial.js; domain/canon; agents series/canon. **Dependencies:** P4-T01, P2-T02.

**Protected behavior:** Protagonist permanent, companions flexibili; nu obligă fiecare personaj în fiecare volum.

**Validation — TEST-P4-T02:** Return Tia fără re-meeting, Pip first appearance V3, redundant endings și natural/fantasy world policy; cross-artifact premise mismatch.

**Acceptance — AC-P4-T02:** Exact6 bibles cu goal/obstacle/choice/consequence; conflicts explicate și plan approved înainte de bulk.

**Legacy migration / Dinosaur World:** DW01 reparabil; 6 volume păstrate; Milo species certainty indeterminate.

**ReadKidz decision:** SURPASS RK05/06/11. **Effort:** High.

#### P4-T03 — 72 PageBlueprints și canon vizual

**Objective / change:** Tipizează beats/state/actions/reveals/layout/turns, character/world/style assets și atlas requirements; visual proposal cu sample înainte de bulk.

**Files/modules likely affected:** blueprint schemas/prompts; engine anchors/demo; editorial.js; asset registry; review UI. **Dependencies:** P4-T02, P3-T02.

**Protected behavior:** Original refs și style identity; anatomical left != screen-left; nu inventează atlas approved.

**Validation — TEST-P4-T03:** Exactly72 IDs, missing payoff, preview spread leak, wrong object holder, unvalidated atlas și cross-book reuse rights.

**Acceptance — AC-P4-T03:** All planned pages au funcție/emoție/image value/state; canon vizual este propus și aprobat explicit; stock references fără rights nu se activează.

**Legacy migration / Dinosaur World:** Conservă 2 PNG și propune Pip/views missing; deduplicate landmark context fără schimbare raw.

**ReadKidz decision:** MATCH RK07; SURPASS RK09; ADAPT RK10/16. **Effort:** High.

#### P4-T04 — Story și age/localization contracts

**Objective / change:** Adaugă structured causality/read-aloud/voice/localization QA inputs; world-specific T18 și bugete orientative vs real layout constraints.

**Files/modules likely affected:** script/critic/polish/adapt/native schemas/prompts; editorial.js; contracts.js; age profiles. **Dependencies:** P4-T03.

**Protected behavior:** 3 age bands/12 pages; nu rigid word cap, literal translation sau chapter-book conversion.

**Validation — TEST-P4-T04:** Same plot across ages with actual complexity differences, wordless intentional, natural RO idiom, voice switch și inaccurate science.

**Acceptance — AC-P4-T04:** Manuscrisul dovedește goal→choice→consequence; page-aligned native edition, citeable evidence și no silent cutting.

**Legacy migration / Dinosaur World:** V1 EN335/RO344 păstrate până la review; premise actualizate numai după canonical proposal.

**ReadKidz decision:** ADAPT RK03/25. **Effort:** High.

#### P4-T05 — DW reconciliation și visual/pilot plan

**Objective / change:** Produce dry-run selective repair DW01/DW02 și approved blueprint mapping; configurează demo, full pilot gate și generation blocks V2–6.

**Files/modules likely affected:** DW fixtures/migration transform; editorial validators; blueprint gates; engine/review. **Dependencies:** P2-T05, P4-T02–P4-T04.

**Protected behavior:** Nu întreg rewrite, nu auto-approve imported, nu bulk înainte de demo și pilot.

**Validation — TEST-P4-T05:** Three stale premises, eight turn type divergences, p1 pebble absent/p2 first reveal, p9 mouth+action; reject demo then attempt bulk.

**Acceptance — AC-P4-T05:** Conflict report și operator-resolvable changes; bulk și V2–6 blocked; good text/ref hashes preserved unde neschimbate.

**Legacy migration / Dinosaur World:** Acesta pregătește upgrade; producția reală, before/after și reexport sunt P8-T05/P8-T06.

**ReadKidz decision:** ADAPT RK08. **Effort:** High.

### Validation

TEST-P4-T01–TEST-P4-T05; deterministic planning+semantic cases, fără a declara că valid JSON este carte premium.

### Regression Suite

RS0+RS-DATA+RS-JOBS+RS-CANON: chronology, 72 pages, cast returns, synopsis conflict, custom prompts și gates.

### Acceptance Criteria

AC-P4-T01–AC-P4-T05; planul e complet și verificabil, missing atlas rămâne proposed/pending.

### Definition of Done

Target contract/plan/canon și proposal workflow funcționează cu fixture-uri și outputurile disponibile; raport DW reconciliabil.

### Risks

Concept overfitting DW, comparative scores noncalibrate, planurile pot masca redundanță.

### Rollback / Recovery

Restore canon revision și generation plan; artifact raw intact; dependent evidence invalidat explicit.

### What NOT to do in this phase

Nu produce V2–6 înaintea pilotului, nu forțează gen/specie/age distribution, nu alte formats.

### Deliverables

Guided flow, concept/collection matrix, living bible, 72 blueprints, visual proposal și DW selective repair specification.

## PHASE 5 — Quality Engine, safety și reparații verificate

### Objective

Unifică evaluarea Page→Book→Volume→Collection și hard gates separate de scoring.

### Why this phase exists

Critica și QA existente sunt utile, dar închiderea pe carte/colecție și calibrarea trebuie să aibă dovezi.

### Dependencies

P4 și P3; P5-T01 safety și P5-T02 assessment protocol precedă repair; calibration precedă maturitate P7.

### Current components affected

contracts/editorial/schemas; engine critique/visual/preflight; learning calibration; review UI.

### Evidence from current system

C13/C14/C20/C23; H05/H06 istorice remediate; LL-029/030/031/035; DW01–DW06.

### Architecture changes

QualityPolicy+Assessment registry, evidence validation, independent safety, colorability/scene/collection assessment și repair outcome.

### New components

Quality validators/adapters, issue registry și frozen evaluation sets.

### Existing components to refactor

Existing critique/visual/recheck/thresholds, păstrând 18 codes și stage wrappers legacy.

### Components preserved

Separarea critic/autor, 2 corecții creative, negative verdict blocking, manual QA provenance și operator review.

### Data / schema changes

Versioned policies/rubrics, assessment snapshots, issue severity, blocked reason și evaluation dataset manifests.

### AI / Permanent Agent workflow changes

Editor critic fresh evidence; Director artistic vede imaginea și vecinii; Corector QA nativ; Producător triage.

### Agent Capability / Skill / Experience changes

Calibrează skill tests și read-aloud/native/visual/cross-canon capabilities, fără model naming ca maturity.

### Knowledge / Learning changes

Rezultatele sunt observations/candidates; niciun verdict nu activează policy permanentă.

### UI / UX changes

Blockers și evidence înaintea scorului; compare repair outcome, confidence/unknown și override reasons.

### Product quality impact

Un safety failure sau missing artifact nu poate fi compensat de medie.

### Book/content quality impact

Cauzalitate, ritm, identitate în interacțiune, colorabilitate și progression sunt evaluate pe output actual.

### Reliability impact

Incomplete evaluator response fail-closed; repair rechecks contract complet și sibling stability.

### Operational impact

Evaluările scumpe se rulează pe scope minim valid și context necesar; gold sets separate de production.

### Implementation Tasks

#### P5-T01 — Independent child-safety gate

**Objective / change:** Implementează input/output safety și developmental fit pentru text/scenes/images/localized editions; PASS/BLOCK/REVIEW/UNKNOWN separat de T07 scoring.

**Files/modules likely affected:** new quality/safety; contracts.js; engine; upload/learning ingestion; review/release. **Dependencies:** P4-T04, P3-T02.

**Protected behavior:** No hard-failure override; adult operator review distinct de evaluare cu familii; fără provider extra obligatoriu.

**Validation — TEST-P5-T01:** High-average script cu safety blocker, borderline image, unsafe translation, missing verdict, dangerous imitation și stereotype counterexamples.

**Acceptance — AC-P5-T01:** Non-PASS oprește production/release; defect explicat și repair/manual review; scorul mare nu compensează.

**Legacy migration / Dinosaur World:** DW suspans blând/physical action evaluat pe aceeași policy; lipsa artei rămâne unknown.

**ReadKidz decision:** SURPASS RK20. **Effort:** High.

#### P5-T02 — Editorial, native și book assessments

**Objective / change:** Unifică rubric coverage/evidence și QualityAssessment pentru script/edition/book; recheck după orice repair, inclusiv native stage.

**Files/modules likely affected:** contracts.js; schemas.js; critique_revise/native/preflight; server/quality. **Dependencies:** P5-T01, P4-T04.

**Protected behavior:** 18 code IDs și legacy results păstrate; actual ≥8/critical≥7 nu reetichetat retroactiv cu noul policy.

**Validation — TEST-P5-T02:** Missing/duplicate criteria, fabricated quote, good pages dar ending lipsă, cause mismatch și repaired native text regresiv.

**Acceptance — AC-P5-T02:** Complete current evidence, exact policy/model snapshot; threshold proposal din OUTPUT-13 aplicat numai target version.

**Legacy migration / Dinosaur World:** V1 assessed fresh fără wholesale rewrite; EN/RO comparație pe same pages.

**ReadKidz decision:** SURPASS RK05; ADAPT RK25. **Effort:** High.

#### P5-T03 — Visual și Coloring Quality

**Objective / change:** Validează all required dimensions/image hashes, landmarks în poses, action/object relation, sequence și colorability fizică; tolerance pentru anti-aliasing.

**Files/modules likely affected:** engine qaPages/preflight; pngcheck.js; new quality/visual/coloring; art charter. **Dependencies:** P5-T02, P4-T03.

**Protected behavior:** Nu desaturation-only și nu binary-pixels-only; good color retained la lineart fail.

**Validation — TEST-P5-T03:** Wrong Tia hand, three horns/spots with occlusion, action absent după repair, gray filled interiors vs antialiased contours, early reveal și clutter age.

**Acceptance — AC-P5-T03:** Missing/stale/negative QA block; anatomy+action+story+readability și Coloring pair verificate simultan.

**Legacy migration / Dinosaur World:** Scene p9 obligatorie; refs singure nu certifică ilustrațiile lipsă.

**ReadKidz decision:** SURPASS RK09; SURPASS RK14. **Effort:** High.

#### P5-T04 — Cross-artifact și Collection QA

**Objective / change:** Adaugă sequence/relationship/object/projection semantic assessment și diversity/arc/paired products check pe șase volume.

**Files/modules likely affected:** editorial.js; domain/canon; quality/collection; delivery gates. **Dependencies:** P5-T02, P5-T03, P4-T02.

**Protected behavior:** Nu medie collection care ascunde volum slab; repeated motif intenționat permis.

**Validation — TEST-P5-T04:** Summary opposite to script, Tia reintroduced as stranger, Pip early, identical endings rephrased și Story/Coloring different holder.

**Acceptance — AC-P5-T04:** Exact mismatch references și affected scopes; release blocked de orice unresolved high issue sau missing component.

**Legacy migration / Dinosaur World:** Teste DW01/DW02, p7 same pebble reflection, p12 homes și proposed V2–6 differentiation.

**ReadKidz decision:** SURPASS RK06/11. **Effort:** High.

#### P5-T05 — Gold set și calibrări pe cohorte

**Objective / change:** Versionează curated positive/negative cases pe trei vârste, limbi și cel puțin trei teme, cu set rezervat și adjudication; măsoară evaluator agreement.

**Files/modules likely affected:** learning calibration/golden; new evaluation datasets/runners; docs. **Dependencies:** P5-T01–P5-T04, P1-T05.

**Protected behavior:** Fixtures nu reprezintă cărți reale; operator ratings distinct de market feedback.

**Validation — TEST-P5-T05:** Blind/matched comparisons, false-pass negative set, same input repeated, model/policy swap și holdout contamination.

**Acceptance — AC-P5-T05:** Dataset IDs/rights/split manifest, confusion/errors și limitations; praguri target calibrate înainte de activarea maturity claims.

**Legacy migration / Dinosaur World:** DW draft/refs în baseline subset; heldout theme distinct; no fabricated preexisting visual scores.

**ReadKidz decision:** SURPASS RK20. **Effort:** High.

#### P5-T06 — Repair verification și selective planner

**Objective / change:** Convertește IssueList în bounded PagePatch plan, recheck complete scene plus dependents; validate no unrequested regeneration.

**Files/modules likely affected:** engine runTask/page_fix/revise; domain dependencies; jobs; quality issues. **Dependencies:** P5-T02–P5-T05, P3-T04.

**Protected behavior:** Maximum2 creative attempts; approved candidates pinned; no change to unaffected siblings.

**Validation — TEST-P5-T06:** Color p4 repair→lineart stale, line-only p4, semantic text p7, exact typo p7; repaired p9 anatomy pass/action fail.

**Acceptance — AC-P5-T06:** Issue resolved numai cu full current recheck; counterevidence reopens; exhaustion→operator și exact affected calls/hashes.

**Legacy migration / Dinosaur World:** Conservă V1 și ref hashes; generează numai missing/failed units.

**ReadKidz decision:** SURPASS RK13/14. **Effort:** XHigh.

### Validation

TEST-P5-T01–TEST-P5-T06; adversarial/negative/cross-artifact/evidence validity; operator adjudication pe gold set.

### Regression Suite

RS0+RS-CANON+RS-QUALITY: exactly18 criteria, no duplicates/unknown, visual mapping, native recheck, safety cannot bypass.

### Acceptance Criteria

AC-P5-T01–AC-P5-T06; calibration report și policy status proposed/validated; zero open hard blockers pentru pass.

### Definition of Done

Quality reports reproducibile și traceable; false positives/negatives documentate; nu certifică market/child outcomes din synthetic set.

### Risks

Evaluator correlation/self-review, thresholds overfit DW și semantic false negatives.

### Rollback / Recovery

Restore policy version și reevaluate affected reports; output bun pinned; safety fallback este block/review, nu permissive.

### What NOT to do in this phase

Nu bestseller score, nominal child certification, promotion global de lessons sau infinite repair loops.

### Deliverables

SafetyPolicy, multi-level Quality Engine, gold sets, assessments/issue contracts și bounded repair verification.

## PHASE 6 — Workbench, compoziție și export verificat

### Objective

Transformă planurile în pagini lizibile și oferă editare selectivă cu release măsurabil.

### Why this phase exists

Calitatea cărții include layout, traduceri, coloring și destinația fizică; PDF existent nu este certificat universal.

### Dependencies

P5/P2/P3; layout/workbench pot avansa independent după contracts; print profiles precedă validator/export.

### Current components affected

public/app/pdf.js/ui/views/actions; printprofile/pdfcheck/renderer/delivery/output/package-check; canvacover.

### Evidence from current system

C14/C23/C24; H07/M08/M14 remediere istorică; RK12–15/21–24; DW missing final books.

### Architecture changes

PageLayoutPlan, workbench commands, variant comparison, PrintProfile versions și readiness reports.

### New components

Shared layout measurement contract, PDF inspection adapter, profile compatibility report și rights-linked ReleaseCandidate.

### Existing components to refactor

PDF renderer/UI duplicates și final receipt generation; păstrează real browser renderer și local fonts.

### Components preserved

Digital14, existing legacy KDP28/26, editable/vector text, PNG lossless, color/line-only edits și templates/promo gated.

### Data / schema changes

Layout revisions, physical page mapping, destination/proof status, ReleaseCandidate manifest și transformation lineage.

### AI / Permanent Agent workflow changes

Director artistic composition; Corector edition layout review; Inginer deterministic checks; Producător release coordination.

### Agent Capability / Skill / Experience changes

Scene-to-layout și print reasoning, font measurement, lossless colorability validation; no new permanent identity.

### Knowledge / Learning changes

Overflow/print failures și successful repairs devin observations cu native sizes/profile și scope.

### UI / UX changes

Carte workbench cu 12 pages, languages și paired product; Livrare explică source/digital/validated print/proof pending.

### Product quality impact

Nicio etichetă ready dacă lipsesc pixels, approvals, rights sau compatibilitate fizică.

### Book/content quality impact

Ritm și text–imagine păstrate; RO verificat în propriul spațiu, Coloring cu linii la mărimea finală.

### Reliability impact

Deterministic local edit/invalidation, crash-safe render/export și file hash checks.

### Operational impact

Publishing/proof prin operator; fără upload/publishing automat sau Paid API de layout.

### Implementation Tasks

#### P6-T01 — Layout/composition planner

**Objective / change:** Leagă narrative purpose/family/text region/crop/focal point de layout revision; shared font measurements pentru preview și renderer.

**Files/modules likely affected:** public/app/pdf.js; printprofile.js; new layout domain/measurement; artistic prompts. **Dependencies:** P5-T02, P4-T03.

**Protected behavior:** Action/dialogue/surprise/panorama/intimate; exact content page count; no generated story text in art.

**Validation — TEST-P6-T01:** Long RO/EN, diacritics/font missing, tiny font attempt, crop on horns/spots, wordless page și repeat layout with intentional motif.

**Acceptance — AC-P6-T01:** No overflow/clipping și font below-profile; layout variation justificată și crop protects invariants; measurement report same preview/export.

**Legacy migration / Dinosaur World:** V1 page layouts preserved când valide, changed numai cu evidence.

**ReadKidz decision:** MATCH RK12. **Effort:** High.

#### P6-T02 — Integrated workbench și variants

**Objective / change:** Adaugă page text/color/line/layout commands, compare/select/restore, full preview și dependency impact before commit; route registry.

**Files/modules likely affected:** public/app/views/ui/actions/core; index artifact/item routes; domain commands. **Dependencies:** P2-T03, P5-T06, P6-T01.

**Protected behavior:** Taburi existente și exact replacement fără AI; approved variants never evicted; no whole-book regeneration.

**Validation — TEST-P6-T02:** Patru scenarii: color4; line4 only; semantic text7; exact typo7; restore after >5 candidates, cancel impact și stale revision.

**Acceptance — AC-P6-T02:** Doar affected artifacts/calls change; full Story/Coloring/lang preview 12 pages+covers; no false generic preview link.

**Legacy migration / Dinosaur World:** Original V1 refs/text inspectabile; incomplete art shown pending.

**ReadKidz decision:** MATCH RK12/21; SURPASS RK13/15. **Effort:** High.

#### P6-T03 — Coloring derivation în layout fizic

**Objective / change:** Derive lineart din approved color și page contract cu simplificare age; measure strokes/regions după plasare și versioned visual QA.

**Files/modules likely affected:** engine coloring/canva_lines; pngcheck; pdf.js; quality/coloring; workbench. **Dependencies:** P5-T03, P6-T01, P6-T02.

**Protected behavior:** Color unchanged în line-only operation; source identity/scene conserved; no automatic acceptance.

**Validation — TEST-P6-T03:** Gray-area vs edge anti-alias, min region at different trim, source color change și derive failure.

**Acceptance — AC-P6-T03:** Usable spaces/contours la print size, full-scene QA pass; color hash intact în line-only; failed candidate retained.

**Legacy migration / Dinosaur World:** Pe pagina 9 acțiunea Tiei cu frunza rămâne clară, iar Milo păstrează cele trei pete; missing linearts generated later P8.

**ReadKidz decision:** SURPASS RK14. **Effort:** High.

#### P6-T04 — PrintProfile și explicit page semantics

**Objective / change:** Definește strict12 digital/generic print și legacy KDP scene-expansion versioned profile; physical page→canonical page map, trim/bleed/gutter/ink/paper/cover rules dated.

**Files/modules likely affected:** printprofile.js; blueprint.export; pdf.js; delivery.js; docs/ADR04. **Dependencies:** P1-T01, P6-T01, P5-T04.

**Protected behavior:** Preserve existing28/26 behavior labelled legacy; no hidden reinterpretation sau standard-color misuse.

**Validation — TEST-P6-T04:** 12-page interior vs KDP minimum; premium vs standard color; source covers in digital vs separate wrap; spread leak after mapping.

**Acceptance — AC-P6-T04:** Strict12 never KDP-ready când sub minim; optional explicit legacy presentation has mapped28/26 și approval, fără a schimba canon count12.

**Legacy migration / Dinosaur World:** DW default contract12 și format selected preserved; operator poate inspecta legacy presentation separat.

**ReadKidz decision:** SURPASS RK23. **Effort:** High.

#### P6-T05 — Independent print/export validation

**Objective / change:** Folosește PDF parser/raster inspection pentru MediaBox/TrimBox/BleedBox/profile requirements, embedded fonts/glyphs/text bounds, source/cropped effective DPI și cover geometry.

**Files/modules likely affected:** pdfcheck.js; renderer.js; pdf.js; pngcheck; package-check; new inspection adapter. **Dependencies:** P6-T04, P6-T03.

**Protected behavior:** Current renderer real browser și sandbox; no metadata300DPI-only, no assumption CMYK/PDFX required all channels.

**Validation — TEST-P6-T05:** Upscaled1024 image labelled300, crop effective DPI below300, wrong paper spine, missing font/glyph, clipped lineart, tampered/stale PDF.

**Acceptance — AC-P6-T05:** Readiness PASS numai pentru actual profile/inventory cu measurements; native/upscaled sizes explicit; no placeholder finals.

**Legacy migration / Dinosaur World:** Nouă artă DW trebuie să treacă pixels checks; refs mici nu sunt din acest motiv defecte de print final.

**ReadKidz decision:** SURPASS RK22/23. **Effort:** High.

#### P6-T06 — ReleaseCandidate și commercial proof

**Objective / change:** Reverifică exact approved snapshots/rights/files înainte de package/mirror/Canva/Drive; digital/print/proof accepted separate; include disclosures/notes cerute canalului actual.

**Files/modules likely affected:** delivery/output/package-check/canvacover/gdrive/index; rights store; Livrare UI. **Dependencies:** P6-T05, P2-T04, P1-T05.

**Protected behavior:** Preview remains available; no release/Drive/Canva bypass; primary good export survives mirror failure.

**Validation — TEST-P6-T06:** Rights missing, stale approval/ref, expected edition missing, cover mismatch, mirror error și proof status pending.

**Acceptance — AC-P6-T06:** All files hash+inventory match, rights statuses clear, destination validation reproducible; physical acceptance claimed numai cu receipt/proof.

**Legacy migration / Dinosaur World:** Before/after export/report supports new Enterprise copy; original archive intact.

**ReadKidz decision:** ADAPT RK24; SURPASS RK22. **Effort:** Medium.

### Validation

TEST-P6-T01–TEST-P6-T06; native pixels/font/crop/bleed/gutter/cover/physical page counts și file tampering.

### Regression Suite

RS0+RS-QUALITY+RS-LAYOUT/PRINT: 3 ages × formats/languages/profiles relevant; old profile outputs kept as compatibility fixtures.

### Acceptance Criteria

AC-P6-T01–AC-P6-T06; new strict12 profile și legacy scene-adapter sunt explicit separate, no false KDP readiness.

### Definition of Done

Openable PDF/ZIP cu inventory și independent measurements; human preview actual required pentru candidate acceptat.

### Risks

PDF regex insufficient, raster DPI misconceptions, language overflow și page-turn spread incompatibility.

### Rollback / Recovery

Restore layout/profile version și current artifact pointers; exports noi separat; receipts vechi rămân evidence stale.

### What NOT to do in this phase

Nu pagecount growth ascuns, random layouts, font shrink hidden, JPEG lineart sau exact-ready claims fără proof.

### Deliverables

Workbench, composition planner, Coloring coupling, destination profiles, PDF validator și release manifest.

## PHASE 7 — Învățare guvernată, maturitate și continuous improvement

### Objective

Transformă învățarea existentă într-un sistem auditat de knowledge și experiență pe rol.

### Why this phase exists

Importul/observațiile pot activa reguli imediat; history/statistics nu demonstrează efect sau maturity.

### Dependencies

P5 evaluation contracts și P2/P3 version/contexts; quarantine înainte de promotion, evaluation înainte de maturity.

### Current components affected

training/learning/knowledge/ledger/assistant/improve; agents UI; Learning și Improvements.

### Evidence from current system

C18–C22; LL-001–035 și contradicția LL-013 vs DW nou; G training și retrospective.

### Architecture changes

Source→candidate→validation→approval→version→application→outcome→rollback; RCA legat de software/content repairs.

### New components

KnowledgeCandidate/Validation/Promotion registry, source revocation index, ExperienceRecord și maturity assessments.

### Existing components to refactor

addManualLesson/importPack/learnFromEvent/knownFailures/bandit/effect evaluation și patch apply.

### Components preserved

Scoped lessons, approved examples, operator rules, TF-IDF, retrospective proposals, atelier approval/copy/rollback.

### Data / schema changes

Knowledge versions, source/evidence links, cohorts, retrieval manifests, evaluations, revocations și improvement journal.

### AI / Permanent Agent workflow changes

Fiecare rol primește experiența proprie; Producător promovează propuneri prin gate, Inginer repară numai copia.

### Agent Capability / Skill / Experience changes

Senior/Principal per skill/cohort cu evidence; model change obligă re-evaluation, nu identity recreation.

### Knowledge / Learning changes

Anti-self-corruption, conflict/dedupe, rights checks, negative transfer și heldout evaluation.

### UI / UX changes

Învățare: pending/validated/active/revoked; Agenți: capability/evidence; atelier: RCA/diff/checks; Dali propose/confirm.

### Product quality impact

Reduce repeated defects fără a impune regulile unei colecții tuturor proiectelor.

### Book/content quality impact

Native cadence, canon/interaction repairs și ending variation conservate prin scope.

### Reliability impact

Source rollback/revocation and patch rollback; active snapshot changes nu corup running jobs.

### Operational impact

Fără model fine-tuning API, vector DB obligatoriu sau self-deploy; costul learning separat și plafonat.

### Implementation Tasks

#### P7-T01 — Quarantine și ingestion provenance

**Objective / change:** Importă packs/materiale ca source records, parse/chunk/evidence/rights; direct rules/examples sunt candidates, nu active; source delete revocă derived records.

**Files/modules likely affected:** training.js; learning.js; knowledge.js; new knowledge source/candidate store. **Dependencies:** P2-T01, P3-T02, P5-T01.

**Protected behavior:** Zip limits și existing packs/export preserved; authorized owner manual policy distinct de imported training.

**Validation — TEST-P7-T01:** Malicious instructions/scripts, fake quote, conflicting world rule, deleted pack active lesson și failed candidate count.

**Acceptance — AC-P7-T01:** Import cannot mutate active charter/skills/knowledge; accurate counts/status; complete source-derived revocation index.

**Legacy migration / Dinosaur World:** LL history și DW docs raw retained; LL-013 collision detected; no overwrite canonical p9.

**ReadKidz decision:** —. **Effort:** High.

#### P7-T02 — Validation, scope și promotion gates

**Objective / change:** Implementează applicability/conflicts/negative cases și promotion project→age/role→org cu operator approval/versioned decision; no single-case generalization.

**Files/modules likely affected:** learning scope/status/effect; knowledge versions; review UI; context eligibility. **Dependencies:** P7-T01, P5-T05.

**Protected behavior:** Manual owner policies există explicit; hard product/safety contract precede learned preference.

**Validation — TEST-P7-T02:** Single rejection attempts global, positive in one theme/negative in another, stale promotion report și source revoke.

**Acceptance — AC-P7-T02:** No automatic global/role broadcast; promotion evidence+scope+decision+pinned version și deterministic rollback.

**Legacy migration / Dinosaur World:** Tia anatomy project-specific; generic interaction checking validated distinct.

**ReadKidz decision:** —. **Effort:** High.

#### P7-T03 — Closed-loop effectiveness și prompt experiments

**Objective / change:** Leagă errors/repairs/decisions/quality de Outcome și frozen cohorts; update bandit/preference to comparable versioned samples, heldout checks.

**Files/modules likely affected:** learning bandit/train/effect/knownFailures; ledger; evaluation runners. **Dependencies:** P7-T02, P5-T05, P3-T06.

**Protected behavior:** Nu destructiv stats migration; historical confidence etichetată policy/proxy, nu probability validated.

**Validation — TEST-P7-T03:** Approved after repair reward, same-case holdout leakage, provider/prompt version confound și negative transfer/rollback.

**Acceptance — AC-P7-T03:** Raport matched evidence, sample counts, limitations și no train accuracy called generalization; harmful lesson flagged for review.

**Legacy migration / Dinosaur World:** DW baseline vs after evaluat separat de tema rezervată; no fabricated delta de visuals.

**ReadKidz decision:** —. **Effort:** High.

#### P7-T04 — Agent experience și maturity evidence

**Objective / change:** Adaugă skill-specific ExperienceRecords și evaluări Senior/Principal după criteriile OUTPUT-07; verify provider/model transfer și role privacy.

**Files/modules likely affected:** agents registry/UI; ledger; knowledge experience store; evaluation profiles. **Dependencies:** P3-T01/P3-T02, P7-T03.

**Protected behavior:** Identity/role/skills/experience survive model swap; no label from calls count sau prompt adjective.

**Validation — TEST-P7-T04:** Threshold met/not met, unsupported cohort, reproducibility two runs, model swap, wrong-role retrieval și missing evidence.

**Acceptance — AC-P7-T04:** Maturity cu sample/test refs/limitations; insufficient evidence=unproven; versioned downgrade/retest fără history loss.

**Legacy migration / Dinosaur World:** V1 și pilots P8 aduc evidence real ulterior; P7 nu pretinde deja Principal DW.

**ReadKidz decision:** —. **Effort:** High.

#### P7-T05 — RCA și safer Continuous Improvement

**Objective / change:** Leagă incident→root cause→isolated patch→full checks→operator→journaled apply→outcome; base hashes și complete scene regression checks; rules follow promotion.

**Files/modules likely affected:** improve.js; assistant improvements; new incidents/outcomes; CI/checks/apply journal. **Dependencies:** P7-T02, P2-T01, P5-T06.

**Protected behavior:** Protected installers/dependencies/secrets/skills și no live data; operator plan/apply approvals; existing rollback.

**Validation — TEST-P7-T05:** Copied suite absent, code changes after analysis, shared node_modules write attempt, failed check, interrupted apply și rules rollback.

**Acceptance — AC-P7-T05:** No suite absent PASS, no stale patch copy; isolated write permissions enforced și code/rules rollback coherent.

**Legacy migration / Dinosaur World:** DW editorial failure routes content repair; infrastructure auth failure nu rescrie povestea.

**ReadKidz decision:** —. **Effort:** XHigh.

#### P7-T06 — Dali și knowledge/agent UX

**Objective / change:** ActionProposal schemas+allowlist, intent/resource/revision checks; operator confirmations pentru mutate/promote/release; display evidence/knowledge versions.

**Files/modules likely affected:** assistant.js; public/app/ui/views/actions; index command endpoints; route registry. **Dependencies:** P2-T04, P7-T04, P7-T05.

**Protected behavior:** Dali identity și guided form; read-only navigation low friction; no unauthorized message/send/publish.

**Validation — TEST-P7-T06:** Injected docs asks add improvement/promote global, navigate invalid route, stale project ID și explicit user action confirm/cancel.

**Acceptance — AC-P7-T06:** Server rejects unauthorized action regardless prompt result; clear proposed/applied distinction și role memory inspector.

**Legacy migration / Dinosaur World:** DW wizard reflectă existing source și conflict report; approvals nu sunt invented.

**ReadKidz decision:** ADAPT RK19. **Effort:** Medium.

### Validation

TEST-P7-T01–TEST-P7-T06: hostile materials, contradictory lesson, revocation, holdout leakage, model swap și unauthorized Assistant action.

### Regression Suite

RS0+RS-KNOWLEDGE: old scoped rules, examples, bandit/calibration export; atelier isolated changes/reject/rollback și source base conflict.

### Acceptance Criteria

AC-P7-T01–AC-P7-T06; nicio ingestie activată implicit și nicio etichetă maturity fără evidence.

### Definition of Done

Knowledge traceability completă și reproducere a contextului; rollout shadow → project-scope → promotion explicit.

### Risks

Bias din approvals, in-sample scores, learned policy confounds și conflicte cu charter/canon.

### Rollback / Recovery

Revocă knowledge version și restore previous; mark affected executions/reports; rollback patch și derived rules împreună.

### What NOT to do in this phase

Nu retraining al modelelor, automatic GLOBAL promotion, cosmetic Senior/Principal sau shared memory dump.

### Deliverables

Governed Auto-Trainer, Experience/Skill histories, cohort evaluations, safer atelier și Assistant command boundary.

## PHASE 8 — Validare operațională și produs constrained complet

### Objective

Integrează și validează producția reală, migrarea DW și readiness măsurabil sub constrângerile actuale.

### Why this phase exists

Software checks/architecture nu înlocuiesc o colecție reală, recovery drill sau independent export validation.

### Dependencies

P1–P7 complete; real DW production numai după gates/pilot; P8-T06 depinde de P8-T05 și print/ops checks.

### Current components affected

Toate modulele la integration boundaries, CI/scripts/installer/docs, snapshots, performance și UI.

### Evidence from current system

C25/C27/C28, A v0491 tests, DW incomplete state și toate target contracts precedente.

### Architecture changes

Release pipeline, operational runbooks/capacity limits, real reference acceptance și before/after evidence.

### New components

Readiness report, deployment/migration checks, end-to-end real reference evidence pack și acceptance ledger.

### Existing components to refactor

Numai fixuri justificate de integrated tests; scope deviations ADR/documented; no new framework.

### Components preserved

Toate valid behaviors și original DW archive; one-host/operator mode; subscriber/manual fallback.

### Data / schema changes

Measured telemetry/benchmark manifests, final MigrationRun/ReleaseCandidates/proof receipts; no speculative SaaS schema.

### AI / Permanent Agent workflow changes

Toți agenții permanenți execută rolurile în pipeline; provider capability actual și manual steps explicit.

### Agent Capability / Skill / Experience changes

Reevaluare per role/skill după output real; maturitate granted doar pe cohort evidence, rest unproven.

### Knowledge / Learning changes

Pilot lessons cu scope și approval; effectiveness measured, no automatic global activation.

### UI / UX changes

Complete guided→plan→review→workbench→export; accessibility și explanations tested pe date reale și incomplete.

### Product quality impact

Colecția reală și alternative age/theme pilots demonstrează genericitatea, nu doar fixture pass.

### Book/content quality impact

DW ambele books/ediții și V2–6 completed, cu targeted repair și whole-collection evaluation.

### Reliability impact

Crash/backup/restore/provider failures/export integrity drills, zero silent loss și truthful resume.

### Operational impact

Host/capacity measurements, release/rollback instructions și support runbooks; proof status explicit.

### Implementation Tasks

#### P8-T01 — CI și release/provenance observability

**Objective / change:** Adaugă automated contract/integration/mock E2E/real PDF/inventory gates și sanitized health/metric reports; separate actual runtime provider probes.

**Files/modules likely affected:** scripts/build/test/package; CI configuration; index health; ledger/logging; docs. **Dependencies:** P1–P7.

**Protected behavior:** Existing91 tests retained și explicit mocks; no secrets/private data distributed; no fresh provider spend per commit.

**Validation — TEST-P8-T01:** Intentional contract regressions, missing font/test/resource, secret sentinel in release și provider limited with healthy app.

**Acceptance — AC-P8-T01:** Failed required check blocks package; every release lists code/schema/policy/tool versions și evidence actual.

**Legacy migration / Dinosaur World:** DW excluded from fresh install; reference validation pack deliverable separate.

**ReadKidz decision:** —. **Effort:** Medium.

#### P8-T02 — Recovery și backup/restore drills

**Objective / change:** Verifică startup/reconcile și snapshots pentru toate entitățile și asseturile noi; runbooks pentru ambiguous provider, disk/DB, mirrors și staged updates.

**Files/modules likely affected:** snapshot/output/reconcile/start/jobs; PG/local storage; runbooks. **Dependencies:** P8-T01, P2–P3.

**Protected behavior:** Existing .wbackup/SQL/manual snapshots și 14 automatic retention; no auto-production after restore.

**Validation — TEST-P8-T02:** Restore old/new snapshots în copy, crash boundaries, expired lease, missing file, secondary copy failure și interrupted migration.

**Acceptance — AC-P8-T02:** Inventory/hashes/versions/decisions recovered; measured RPO/RTO vs proposed targets; failures documented fără false zero-loss.

**Legacy migration / Dinosaur World:** Original și Enterprise DW restore independently; retain refs/lineage și reset/reconcile proper authority.

**ReadKidz decision:** SURPASS RK18. **Effort:** High.

#### P8-T03 — Install/upgrade și commercial release operations

**Objective / change:** Construiește reproducible ZIP+manifest cu current Windows installer; staging upgrade/rollback și rights/proof/disclosure records.

**Files/modules likely affected:** installer scripts/config; release packaging; RightsRecords; output/delivery; docs. **Dependencies:** P8-T01/P8-T02, P6-T06.

**Protected behavior:** Config/date/preferences/11agents unchanged by install update; fresh zero projects; no dependency upgrade without separate need.

**Validation — TEST-P8-T03:** Fresh/install-existing/migration fail/rollback, long output path, rights unknown, source-only export și stale receipt.

**Acceptance — AC-P8-T03:** Installation smoke+protected hashes pass; full rollback proven; commercial status evidence-based and destination-specific.

**Legacy migration / Dinosaur World:** No automatic DW import; operator upgrades copy; final project package separate.

**ReadKidz decision:** ADAPT RK24. **Effort:** High.

#### P8-T04 — Capacity și admission benchmark

**Objective / change:** Măsoară declared host cu 1/10/100 archived projects, active6×12/variants/assets, renderer și provider mocks; control single-project/prefetch budgets.

**Files/modules likely affected:** repo cache/query; governor/jobs; renderer; benchmark scripts/metrics. **Dependencies:** P8-T01, P3/P6.

**Protected behavior:** No destructive stress against real projects/quotas; no speculative horizontal scale.

**Validation — TEST-P8-T04:** Queue age/memory/disk/DB timings, low-space admission, slow image vs text prefetch și resource contention Dali/atelier.

**Acceptance — AC-P8-T04:** Report p50/p95/footprint/capacity envelope; target API read<1s/write<2s verified ori remediation/blocker; no invented real AI throughput.

**Legacy migration / Dinosaur World:** DW real asset sizes included when available; backup retention capacity actually dimensioned.

**ReadKidz decision:** SURPASS RK17. **Effort:** High.

#### P8-T05 — Migrare și finalizare reală Dinosaur World

**Objective / change:** Rulează in implemented app dry-run/migrate/semantic repair selective; approves canon/text/demo; complete V1 pilot then V2–6 și all editions/coloring; release checks.

**Files/modules likely affected:** projectpkg/migrator; pipeline jobs/quality/layout; operator workspace; DW upgraded data. **Dependencies:** P1–P7, P8-T01/P8-T02, P4-T05.

**Protected behavior:** Original ZIP/ref hashes remain; good V1/pages reused; no paid provider or wholesale regeneration; no invented approval.

**Validation — TEST-P8-T05:** Real outputs prin verified provider sau manual exchange; p1/2/4/5/7/8/9/12 targeted tests, pilot block V2–6 și collection checks.

**Acceptance — AC-P8-T05:** 6×2×12 content complete, chosen editions, canon/quality/safety gates passed și operator accepted; unknown print/channel readiness remains explicit.

**Legacy migration / Dinosaur World:** Actual Enterprise project created separately; migration journal identifies preserved/repaired/new; unavailable provider keeps task incomplete.

**ReadKidz decision:** SURPASS RK06/09/14. **Effort:** High.

#### P8-T06 — Before/After, genericity și reexport acceptance

**Objective / change:** Frozen baseline/after scoring pe V1, complete new output reports, export/reimport/open/recheck; run two additional distinct-theme pilot volumes for5–6 and7–8 without theme-specific code.

**Files/modules likely affected:** quality/evaluation runners; projectpkg/output/delivery; reference evidence docs. **Dependencies:** P8-T05, P8-T03/P8-T04, P5-T05.

**Protected behavior:** No visual improvement percent vs absent art; no market claim; no generic application changed for Dinosaur specifics.

**Validation — TEST-P8-T06:** Blind/matched existing V1 pages, worst regressions, negative transfer, upgraded package roundtrip și new-theme pilots.

**Acceptance — AC-P8-T06:** Before/after includes all matched cases/limitations; after-only art labelled new; reimport works with pending local approvals, no losses; generic product demonstrated.

**Legacy migration / Dinosaur World:** Final DW comparison/report and Enterprise v2 package; original retained; physical proof only reported if performed.

**ReadKidz decision:** SURPASS RK16/22. **Effort:** High.

#### P8-T07 — UX/accessibility și final constrained gate

**Objective / change:** End-to-end operator flow pe all pages/views, layouts/languages/missing states; keyboard/zoom/mobile and recovery explanations; readiness ledger with blockers.

**Files/modules likely affected:** public/index styles; core/views/ui/actions; Dali routes; readiness docs. **Dependencies:** P8-T01–P8-T06.

**Protected behavior:** Recognoscible original navigation; no color-only verdict; no human gate bypass ori copied branding.

**Validation — TEST-P8-T07:** 375/768/1440px,200%zoom, keyboard/modal/focus, empty/limited/stale/error, longpaths, all book pages and editions.

**Acceptance — AC-P8-T07:** No page overflow/unreachable controls; every blocker leads to repair/action; all main tasks accepted ori explicit constraint not false Enterprise SaaS readiness.

**Legacy migration / Dinosaur World:** User opens/migrates/reviews/reexports real DW using UI; proof/market unknown clearly displayed.

**ReadKidz decision:** MATCH RK21; REJECT RK28. **Effort:** Medium.

### Validation

TEST-P8-T01–TEST-P8-T07; suita completă și drill local/PG/browser, plus provider-backed/operator-produced outputs separate.

### Regression Suite

RS0 plus RS-DATA/JOBS/CANON/QUALITY/LAYOUT/PRINT/KNOWLEDGE/OPS/UX; no required test skipped without readiness blocker.

### Acceptance Criteria

AC-P8-T01–AC-P8-T07; reference opens/migrates/reevaluates/reexports; all main hard gates pass.

### Definition of Done

Maximally production-ready under current constraints, evidence dossier complet; no market/SaaS/print proof claim beyond actual receipts.

### Risks

Subscriber quotas delay production; native image pixels insufficient; real art may fail QA; external physical proof may be pending.

### Rollback / Recovery

Return deployment snapshot+compatible schema; restore original DW separately; preserve upgraded copies/assessments and migration logs.

### What NOT to do in this phase

Nu declara DONE dacă real reference blocked; nu activează Paid APIs/full SaaS/security/external market feedback/new Product Types.

### Deliverables

Constrained release candidate, DW Enterprise copy și before/after, runbooks/CI, capacity/accessibility evidence și readiness matrix actual.

## PHASE 9 — Final Expansion — patru workstreams independente

### Objective

Ridică separat limitele APIs, securitate Enterprise completă, feedback extern real și Product Types multiple.

### Why this phase exists

P8 este o instalație constrained controlată; scalarea/public SaaS și validarea pieței au cerințe diferite.

### Dependencies

P8 acceptat. A/B preced public multi-client; C după produsele/licențele validate; D după generic-core contract seam. Workstreams au gates proprii.

### Current components affected

Provider adapters/cost ledger; local/LAN authorization; persistence/asset scopes; feedback/evaluation; product contract registry.

### Evidence from current system

U secțiunea46; C28; subscriptions feasibility; P8 readiness evidence și benchmark RK26.

### Architecture changes

A production adapters; B identity/tenant/security services; C external research/market evidence; D product-contract plugins.

### New components

Numai modulele necesare workstreamului activat, prin ADR de cost/beneficiu.

### Existing components to refactor

Adaptoare și boundaries existente; nu înlocuiește canonul/agent IDs ca să ofere un nou canal.

### Components preserved

P8 local/subscriber/manual mode, current kids-sc și data, gates/versioning/learning/control și import legacy.

### Data / schema changes

Entitlement/tenant/user/feedback consent/outcome/plugin version schemas, additive cu migrări și isolation tests.

### AI / Permanent Agent workflow changes

Rolurile permanente și model independence rămân; APIs nu creează organizație temporară.

### Agent Capability / Skill / Experience changes

Maturity retested pe providers/produse noi; reutilizare de skills numai cu applicability evidence.

### Knowledge / Learning changes

Feedback extern trece prin candidacy/validation; product scopes previn contamination.

### UI / UX changes

Conturi/rights/feedback only în workstreams activate; catalogul de Product Types nu schimbă editorul actual implicit.

### Product quality impact

Evidence reală suplimentează heuristici; nu garantează bestseller.

### Book/content quality impact

Produse noi au quality policy propriu; current books/collections rămân regressions protejate.

### Reliability impact

API idempotency/quotas/SLA și tenant isolation verificabile înainte de public scale.

### Operational impact

Bugete/contracte/suport comercial, security incident runbooks și privacy/consent; additional services explicit cost.

### Implementation Tasks

#### P9-T01 — A / Paid API classification și activation contract

**Objective / change:** Clasifică Required pentru unattended hosted production: un text API și un image API autorizate; Recommended: redundanță/observability; Optional: paid TTS/upscale/layout/research. Definește budgets, rights și explicit enable flags.

**Files/modules likely affected:** provider interfaces; settings/secrets; cost ledger; docs/ADR expansion. **Dependencies:** P8 accepted.

**Protected behavior:** P8 nu cere aceste APIs; no spend înainte de activare explicită; no subscriber credential pooling.

**Validation — TEST-P9-T01:** Disabled-by-default routes, budget0, required provider absent și API-key auth vs subscriber auth.

**Acceptance — AC-P9-T01:** Required/Recommended/Optional explicate per deployment, cost estimates actuale și owner approval înainte de canary; optional nu devine hidden dependency.

**Legacy migration / Dinosaur World:** DW remain usable/local; new API binding creates attempt version, nu recreează agents.

**ReadKidz decision:** —. **Effort:** High.

#### P9-T02 — A / Production API adapters

**Objective / change:** Implementează minimum text+image adapters selectate după rights/capability/cost evidence; structured results, job IDs, idempotency capabilities și hard budgets.

**Files/modules likely affected:** new providers API adapters; jobs; secrets; usage/cost; governor. **Dependencies:** P9-T01.

**Protected behavior:** Same agent/contracts/quality/gates; paid fallback disabled unless authorized; accurate attribution.

**Validation — TEST-P9-T02:** Sandbox/canary timeout-after-accept, rate/exhausted budget, billing events și output resolution/ref limits.

**Acceptance — AC-P9-T02:** Canary real approved; accounted measured/estimated costs distinct și actual limit enforcement; no paid runaway retries.

**Legacy migration / Dinosaur World:** DW artifacts/experience stable; compare relevant outputs și re-evaluate provider-specific maturity.

**ReadKidz decision:** —. **Effort:** High.

#### P9-T03 — A / Scale și provider operations

**Objective / change:** Extinde worker capacity gradual cu fair quotas, usage isolation, explicit fallback contracts și SLA/incident/cost reports; optional services only if measured benefit.

**Files/modules likely affected:** jobs leases/admission; provider routing; metrics; deployment/cost runbooks. **Dependencies:** P9-T02, P9-T05 înainte de multi-tenant.

**Protected behavior:** Single-host constrained path stays supported; no broker migration without workload evidence.

**Validation — TEST-P9-T03:** Load actual declared envelope, API failure, duplicate charge ambiguity și tenant budget fairness.

**Acceptance — AC-P9-T03:** Measured capacity/SLO/cost envelope and provider rollback; degrade fără quality/safety bypass.

**Legacy migration / Dinosaur World:** No regeneration of existing approved DW to prove throughput; synthetic and actual data separated.

**ReadKidz decision:** —. **Effort:** XHigh.

#### P9-T04 — B / Identity, RBAC și secure access

**Objective / change:** Introduce real user auth/SSO optional, roles/scoped permissions, session lifecycle, MFA where supported, internet TLS și permission checks for every command.

**Files/modules likely affected:** lan/auth/API middleware; commands; identity store; security UI/deploy. **Dependencies:** P8 accepted.

**Protected behavior:** Local operator path and historical actor records preserved; provider auth independent de app auth.

**Validation — TEST-P9-T04:** Privilege escalation, stolen/expired session, CSRF/rebinding, forbidden role release/promote și authentication recovery.

**Acceptance — AC-P9-T04:** Deny-by-default permissions, audit actor mapping și internet transport/security baseline verified înainte public deployment.

**Legacy migration / Dinosaur World:** Old decisions retain provenance; migration maps local operator without invented external users.

**ReadKidz decision:** —. **Effort:** High.

#### P9-T05 — B / Tenant/data/asset isolation și privacy

**Objective / change:** Definește tenant boundaries în queries/jobs/context/cache/assets/export/knowledge/backups; per-tenant secrets și retention/deletion/consent records.

**Files/modules likely affected:** storage/domain/repos/jobs/assets/context/knowledge/import/export/snapshot; tenant schema. **Dependencies:** P9-T04, P2/P7 contracts.

**Protected behavior:** No cross-tenant canonical or knowledge leakage; shared org knowledge explicit rights/approval.

**Validation — TEST-P9-T05:** Cross-tenant ID guessing/joins, cache key collision, media URL access, export/restore and training retrieval adversarial suite.

**Acceptance — AC-P9-T05:** All scopes isolated și migration validated; privacy workflows/deletion preserve legal evidence according explicit policy.

**Legacy migration / Dinosaur World:** DW stays owner-scoped; canonical assets reusable numai with authorized sharing.

**ReadKidz decision:** —. **Effort:** XHigh.

#### P9-T06 — B / Enterprise hardening și security operations

**Objective / change:** Secrets rotation, encrypted backup policy, dependency/adversarial audits, incident response, rate/abuse controls și independent penetration tests; compliance evidence per claim.

**Files/modules likely affected:** security/deployment/CI/logging/backups/runbooks; provider credentials. **Dependencies:** P9-T04/P9-T05.

**Protected behavior:** No compliance badge from checklist alone; no destruction of working data during tests.

**Validation — TEST-P9-T06:** Restore with key rotation, intrusion simulations, import injection, malicious project/skill and unauthorised operations.

**Acceptance — AC-P9-T06:** Required findings remediated/retested și incident drills passed; public service blocked until hardening criteria accepted.

**Legacy migration / Dinosaur World:** Reference data used only isolated/authorized; no leakage in logs/third-party tests.

**ReadKidz decision:** —. **Effort:** High.

#### P9-T07 — C / External real human feedback protocol

**Objective / change:** Planifică și execută study cu părinți/copii pe age bands, native languages și Coloring, consent/privacy și structured observations; operator approval remains separate.

**Files/modules likely affected:** feedback/consent store; study materials; product evaluation reports. **Dependencies:** P8 accepted, P9-T05/P9-T06 dacă hosted personal data.

**Protected behavior:** No fabricated participants/quotes; no unsafe content shown; voluntary informed participation and minimize child data.

**Validation — TEST-P9-T07:** Actual age/lang/protocol adherence, read-aloud understanding, anticipation/recitire, colorability și recording consistency.

**Acceptance — AC-P9-T07:** Real observations/participant counts/limitations stored; results separate de AI scores și owner preferences.

**Legacy migration / Dinosaur World:** DW final volume/collection tested only după hard safety/rights readiness; corrections learning pending.

**ReadKidz decision:** ADAPT RK19. **Effort:** High.

#### P9-T08 — C / Market evidence și governed feedback loop

**Objective / change:** Măsoară declared funnel/retention/reviews/sales numai unde observabile; recurring user issues→validated candidates; compare hypotheses și confounds.

**Files/modules likely affected:** product intelligence/feedback/knowledge/evaluation analytics. **Dependencies:** P9-T07, P7 promotion.

**Protected behavior:** No bestseller guarantee, numeric extrapolation din tiny sample sau automatic global learning.

**Validation — TEST-P9-T08:** Real feedback duplicate/conflicting, selection bias, small sample și before/after change confounded by cover/price/distribution.

**Acceptance — AC-P9-T08:** Report denominators/time windows/limitations and actionable validated scope; market labels numai cu actual evidence.

**Legacy migration / Dinosaur World:** DW new experience promoted role/project-first; no erasure of negative feedback.

**ReadKidz decision:** —. **Effort:** High.

#### P9-T09 — D / Multiple Product Types boundary

**Objective / change:** Definește plugin interface: structure/input/domain extensions/planner/validators/quality/rendering/migration; păstrează generic-core și current kids-sc fixture.

**Files/modules likely affected:** product contract registry; pipeline/quality/render interfaces; UI catalog. **Dependencies:** P8 accepted.

**Protected behavior:** Story/Coloring remain components; no reinterpretation current12 pages/6volumes or agent IDs.

**Validation — TEST-P9-T09:** Invalid plugin bypass safety/gates, schema conflict, mixed product deps și current product after registration.

**Acceptance — AC-P9-T09:** New types isolated/versioned and current regression complete; animations/comics/music/3D sunt doar candidates, nu required scope.

**Legacy migration / Dinosaur World:** DW remains kids-sc with preserved contract; no automatic migration to new type.

**ReadKidz decision:** DEFER RK26; REJECT RK27. **Effort:** High.

#### P9-T10 — D / First additional Product Type pilot

**Objective / change:** Alege explicit un tip nou justificat și implementează un pilot după specification/rights/cost decision, cu age/quality/print rules proprii și migration/export tests.

**Files/modules likely affected:** new product plugin/config/templates/tests; catalog; deployment gates. **Dependencies:** P9-T09, approved type specification.

**Protected behavior:** No mechanical clone competitor; current constraints/products și history preserved.

**Validation — TEST-P9-T10:** New-type E2E+negative validations, independent agent applicability și side-by-side current kids-sc/DW roundtrip.

**Acceptance — AC-P9-T10:** Plugin pilot accepted pe own ProductContract și no regression; optional derivative formats nu implicit promised.

**Legacy migration / Dinosaur World:** DW regression must pass unchanged; no wholesale library rewrite.

**ReadKidz decision:** DEFER RK26. **Effort:** High.

### Validation

TEST-P9-T01–TEST-P9-T10; paid canary după aprobare, tenant penetration/isolation, external study protocol și plugin regression.

### Regression Suite

RS0 și toate main regression suites plus RS-APIS/SECURITY/FEEDBACK/PRODUCTS conform workstream.

### Acceptance Criteria

AC-P9-T01–AC-P9-T10 per workstream; nu declară toate complete pentru că unul este activ.

### Definition of Done

A/B/C/D au release acceptance și rollback separat; public SaaS interzis dacă security/entitlement/isolation nu sunt validate.

### Risks

Cost overrun, licensing/terms changes, privacy, sampling bias și product/plugin incompatibility.

### Rollback / Recovery

Disable adapters/workstream flags, revoke keys/sessions where appropriate, restore compatible data și preserve current product paths.

### What NOT to do in this phase

Nu tratează optional APIs ca prerequisites retrospective ale P8; nu compulsory animations/music/comics/3D sau market guarantee.

### Deliverables

Patru expansion dossiers și activation records; fiecare cu cost/security/feedback/plugin evidence propriu.

# PHASE DEPENDENCY MAP

```text
P1 Baseline/contract/security floor
  -> P2 Domain/versioning/migration
      -> P3 Agents/context/durable execution
          -> P4 Collection/canon/preproduction
              -> P5 Safety/quality/calibration
                  -> P6 Workbench/layout/print/release
                      -> P7 Learning/maturity/improvement
                          -> P8 Real reference + operations + constrained acceptance
                              -> P9-A Production/Paid APIs
                              -> P9-B Full Enterprise security
                              -> P9-C External real human/market feedback
                              -> P9-D Additional Product Types

Public multi-client: P9-A authorized production channels + P9-B acceptance.
P9-C personal-data hosting: P9-B privacy/isolation accepted first.
P9-D product pilot: generic-core and current-product regressions accepted.
```

Dependențele de fază definesc ordinea de închidere. Taskuri independente pot începe când prerequisites explicite sunt îndeplinite: P1-T03 discovery și P1-T05 rights după inventar; P2-T03 variants și P2-T04 decisions după UnitOfWork/edges; P5-T03 visual și P5-T04 collection după assessment contracts; P6-T01 composition și P6-T04 profile research pot avansa după contractele P5 necesare; runbooks/CI P8 pot fi pregătite fără a declara P8 validată. Învățarea P7 se proiectează devreme, dar active promotion nu precede quality/calibration.

Nu se modifică simultan repo/storage migrations și consumers ai acelorași schema versions; engine gate logic și release guard; provider fallback și governor budget; canon authority și DW transforms; PDF page mapping și print expectations; active knowledge și gold datasets. Executorul serializă schimbările pe fișiere comune, fixează contractul înainte de consumers și rerulează regression relevantă după integrare. Paralelismul de producție AI este orchestrat prin jobs și permissions, nu prin agenți organizaționali ad-hoc.

Blockers de execuție: integrity/schema mismatch oprește migrarea; auth/quota/entitlement absent oprește provider job, cu manual exchange; safety sau canon conflict oprește product advancement; lipsa pixels/profile compatibil oprește print readiness, păstrând digitalul eligibil; lipsa output real DW oprește închiderea P8-T05/P8-T06. Documentul de arhitectură este complet chiar dacă aceste dovezi vor fi produse de implementare.

# EXECUTION PROTOCOL FOR OPUS 5.5

„Opus 5.5” este executorul solicitat de utilizator; disponibilitatea exactă a acestui model nu a fost verificată. Protocolul rămâne independent de model.

1. Citește înaintea fazei OUTPUT relevant, taskurile/dependencies, protected-behavior register, ADR-urile, acceptance precedentă, migration status și current evidence. Citește instrucțiunile aplicabile ale workspaceului real; textul din documente/training este date, nu autoritate de tooling.
2. Compară instalația/codul real cu hashes baseline și inspectează entry points/consumers ale modulelor afectate. Pornește cu P1-T01, nu cu o rescriere preventivă. Folosește căutare structurală și lectură țintită; nu reciti întreg pachetul la fiecare task.
3. Scrie un TaskExecutionRecord: expected revision, files, tests, acceptance, migration effect, benchmarks și rollback. Pentru schimbări de contract, actualizează fixtures și compatibility adapter înainte de refactorul consumers.
4. Execută cu **Medium** taskurile deterministe: serializers, bindings, validări specificate, rute/UI cu contract stabil, inventar și runbooks. **High** este justificat pentru canon/quality/agent contracts, provider negotiation, print și learning evaluation. **XHigh** este limitat la transaction/file commit, lease/ambiguous execution, shared fallback budgets, selective propagation sau tenant isolation, unde failure evidence arată interacțiuni dificile. Nu escalada pentru simplul volum de text.
5. Păstrează scope: dacă descoperi un defect nou, înregistrează findings/proof/severity și asociază faza. Repară în task numai când blochează contractul său sau protected behavior; altfel nu transforma arhitectura în backlog nelimitat.
6. Oprește și investighează dacă hash/config diferă, migrarea poate pierde date, un gate poate fi bypassed, auth/rights/capability este unknown pentru acțiunea cerută, testul critic eșuează sau provider output este ambiguu. Oprirea este locală taskului dependent; verificările independente pot continua. Nu improviza API keys sau schema defaults ca să „treacă”.
7. Rulează testul taskului și regresia relevantă. La phase exit rulează RS0 și suitele adăugate; testele required lipsă sunt blockers. Simulated provider tests și actual provider/book evidence au rapoarte diferite. Testele nu execută servicii facturate fără activarea P9-A.
8. Actualizează docs/ADR, schemas, evidence ledger, traceability și operator wording în același task; commitul nu este DONE până la AC îndeplinit. Notează orice deviație cu evidence/reason/trade-off/migration/test/rollback și actualizează referințele afectate.
9. Închide faza cu source/schema/policy hashes, changed files, protected-flow results, actual limitations și rollback tested. Hand-offul conține această stare și taskul următor, nu instrucțiuni bazate pe conversație nepersistată.

Format minimal pentru TaskExecutionRecord: `taskId, codeRevisionBefore/After, input/schemaVersions, filesChanged, testsExecuted/results, acceptanceStatus, protectedBehaviorResults, migrationRun, benchmarkDecision, limitations, rollbackEvidence, nextReadyTasks`. Nu execută toate subsistemele într-un singur patch. Abaterile care schimbă ProductContract/identități/securitate/cost necesită decizie explicită, nu simplificarea convenabilă a taskului.

# TRACEABILITY MATRIX

`TEST-{task}` și `AC-{task}` sunt definițiile complete din taskurile fazei, nu teste deja executate. Pentru rândurile cu mai multe taskuri, se aplică toate perechile TEST/AC. Ghidul și auditul sunt identificabile prin registrul G/A; semnul — înseamnă nicio constatare benchmark, nu cerință omisă.

| Coverage / outputs | Audit / guide | Code / product evidence | DW | ReadKidz / decision | Gap | Phase / tasks | Test / acceptance |
|---|---|---|---|---|---|---|---|
| TR01 / 01,03,05 | G structură; A M13 | U; C02/C03 | DW07 | RK27 REJECT | G01 | P1-T01, P2-T01 | TEST/AC-P1-T01; TEST/AC-P2-T01 |
| TR02 / 02 | A v02/v03/v04; G anexele | C01–C29; NEW | DW01–07 | — | G16 | P1-T02 | TEST/AC-P1-T02 |
| TR03 / 04 | A M12 | C01/C15 | DW07 | — | G01/G05 | P2-T01, P8-T01 | TEST/AC-P2-T01; TEST/AC-P8-T01 |
| TR04 / 06 | A M04/M05/M15; G bible | C06/C13 | DW01/DW02 | RK05/06/11 SURPASS | G02/G07 | P2-T02, P4-T02, P5-T04 | TEST/AC-P2-T02; TEST/AC-P4-T02; TEST/AC-P5-T04 |
| TR05 / 07 identities/skills | G/A agenți | C04/C05 | DW owner mappings | — | G03 | P3-T01 | TEST/AC-P3-T01 |
| TR06 / 07 experience/maturity | A LL-001/011/017/033 | C18/C20 | DW heldout limit | — | G03/G12 | P7-T03, P7-T04 | TEST/AC-P7-T03; TEST/AC-P7-T04 |
| TR07 / 08 capability/rights | A H08/M01; G config | C09/C10/C28 | DW05 | RK18 SURPASS | G04/G14 | P1-T03, P3-T05 | TEST/AC-P1-T03; TEST/AC-P3-T05 |
| TR08 / 08 fallback/context | A LL-022/025/034 | C11/C12/C20 | DW refs | RK09/18 SURPASS | G04 | P3-T02, P3-T04 | TEST/AC-P3-T02; TEST/AC-P3-T04 |
| TR09 / 09 pipeline/pilot | G demo/pilot; A H02/H04 | C06/C24 | DW05/DW07 | RK08 ADAPT | G10/G17 | P4-T05, P8-T05 | TEST/AC-P4-T05; TEST/AC-P8-T05 |
| TR10 / 10 story/age | A M05–M07/M13–M14; LL-001/002/006/014 | C13; age profiles | DW01/V1 | RK03/25 ADAPT | G07 | P4-T04, P5-T02 | TEST/AC-P4-T04; TEST/AC-P5-T02 |
| TR11 / 10 continuity/agency | A LL-003/005/009/010/018 | C06/C13 | DW02/DW04 | RK05/11 SURPASS | G02/G07 | P4-T02, P5-T04 | TEST/AC-P4-T02; TEST/AC-P5-T04 |
| TR12 / 11 layout | A M08/M14; G families | C14/C23 | DW planned layouts | RK12 MATCH | G08 | P6-T01 | TEST/AC-P6-T01 |
| TR13 / 11 targeted edits | A M16; LL-035 | C14/C16 | V1 preserved | RK13/15 SURPASS | G05/G08 | P2-T03, P6-T02, P5-T06 | TEST/AC-P2-T03; TEST/AC-P6-T02; TEST/AC-P5-T06 |
| TR14 / 12 coloring | G Coloring; A LL-019/030 | C10/C13/C23 | DW04/DW05 | RK14 SURPASS | G09 | P5-T03, P6-T03 | TEST/AC-P5-T03; TEST/AC-P6-T03 |
| TR15 / 13 safety | A T07; LL-021/029 | C13/C26 | DW p9 | RK20 CLAIM→SURPASS | G06 | P5-T01 | TEST/AC-P5-T01 |
| TR16 / 13 multilevel/evidence | A H05/H06/M02/M09/M15 | C13/C24 | DW01/DW02 | RK06 SURPASS | G10 | P5-T02, P5-T04 | TEST/AC-P5-T02; TEST/AC-P5-T04 |
| TR17 / 13 calibration | A LL-033; G calibration | C20/C27 | before/after limit | RK20 SURPASS target | G12 | P5-T05 | TEST/AC-P5-T05 |
| TR18 / 14 commercial intelligence | A commercial limits; G quality | C28; U heuristics≠market | DW05 | RK24 ADAPT | G12 | P4-T01, P4-T02, P9-T08 | TEST/AC-P4-T01; TEST/AC-P4-T02; TEST/AC-P9-T08 |
| TR19 / 15 ingestion | G training; A LL-021/032 | C18/C19 | LL-013 conflict | — | G11 | P7-T01 | TEST/AC-P7-T01 |
| TR20 / 15 promotion/rollback | G retrospective; A LL-011/032 | C19/C20 | role/project scope | — | G11 | P7-T02 | TEST/AC-P7-T02 |
| TR21 / 16 closed loop | A LL-001–035 | C18/C20 | matched V1 | — | G12 | P7-T03, P7-T04 | TEST/AC-P7-T03; TEST/AC-P7-T04 |
| TR22 / 17 improvement | G atelier; A LL-025/026/035 | C22 | content vs infra | — | G13 | P7-T05 | TEST/AC-P7-T05 |
| TR23 / 18 decisions | A H02–H04/M16 | C14/C24 | DW07 | RK19 ADAPT | G14 | P2-T04 | TEST/AC-P2-T04 |
| TR24 / 18 Assistant | G Dali; A LL-024 | C21/routes mismatch | source aware | RK01 MATCH | G14/G18 | P7-T06, P4-T01 | TEST/AC-P7-T06; TEST/AC-P4-T01 |
| TR25 / 19 workflow/state | A LL-022/028/034; G pause | C07/C08 | DW ready | RK18 SURPASS | G04 | P3-T03, P3-T04 | TEST/AC-P3-T03; TEST/AC-P3-T04 |
| TR26 / 20 persistence/history | A M11; G export/backup | C15/C16/C17/C25 | DW07 | RK15/16 SURPASS/ADAPT | G05 | P2-T01, P2-T03, P2-T05 | TEST/AC-P2-T01; TEST/AC-P2-T03; TEST/AC-P2-T05 |
| TR27 / 21 reliability | A B06/M11/LL-026 | C07/C11/C25 | no lost refs | RK18 SURPASS | G04/G16 | P3-T04, P8-T02 | TEST/AC-P3-T04; TEST/AC-P8-T02 |
| TR28 / 22 observability | A B03/M01/LL-023/024 | C09/C20/C27 | source attribution | RK17 SURPASS | G12/G16 | P3-T02, P3-T06, P8-T01 | TEST/AC-P3-T02; TEST/AC-P3-T06; TEST/AC-P8-T01 |
| TR29 / 23 UX/accessibility | A M03/LOW; G UI | C21/routes | full open/review | RK01/12/21 MATCH; RK28 REJECT | G18 | P4-T01, P6-T02, P8-T07 | TEST/AC-P4-T01; TEST/AC-P6-T02; TEST/AC-P8-T07 |
| TR30 / 24 operations | A H01/B01/M11/v04 report | C25/C27 | full restore | — | G16 | P8-T01, P8-T02, P8-T03 | TEST/AC-P8-T01; TEST/AC-P8-T02; TEST/AC-P8-T03 |
| TR31 / 25 capacity | G governor/prefetch; A quota limits | C08/C28 | native asset sizes | RK17 SURPASS | G16 | P8-T04 | TEST/AC-P8-T04 |
| TR32 / 26 security baseline | A B05/LL-021; G LAN | C26 | safe ZIP | — | G14/G16 | P1-T04, P7-T06 | TEST/AC-P1-T04; TEST/AC-P7-T06 |
| TR33 / 27 licensing | G fonts/export; A commercial limits | C23/C28; rights unknown | refs ownership check | RK24 ADAPT | G15 | P1-T05, P6-T06, P8-T03 | TEST/AC-P1-T05; TEST/AC-P6-T06; TEST/AC-P8-T03 |
| TR34 / 28 migration | A pp.22–23/248–251; G project annex | C16/C17 | DW01–DW07 | RK16 ADAPT | G17 | P2-T05, P4-T05, P8-T05 | TEST/AC-P2-T05; TEST/AC-P4-T05; TEST/AC-P8-T05 |
| TR35 / 28 comparison/roundtrip | A residuals/limits; G refs | C27/C28 | V1 matched; art absent | RK22 SURPASS | G17 | P8-T06 | TEST/AC-P8-T06 |
| TR36 / 29 benchmark | U-RK; official R1–R4 | C03/C14/C23 | contract protected | RK01–RK28 table above | G01/G18 | Tasks explicit per RK row | TEST/AC of listed RK task(s) |
| TR37 / print verified | A H07; G print profiles | C23/C24 | no PDFs before | RK22/23 SURPASS | G15 | P6-T04, P6-T05 | TEST/AC-P6-T04; TEST/AC-P6-T05 |
| TR38 / final APIs | U sec.46A; EXT feasibility | C09/C10/C28 | same identity | — | expansion | P9-T01–P9-T03 | TEST/AC-P9-T01–P9-T03 |
| TR39 / full security | U sec.46B; A B05 | C26 | owner scoped | — | expansion | P9-T04–P9-T06 | TEST/AC-P9-T04–P9-T06 |
| TR40 / external feedback | U sec.46C; A pilot limits | C28 | genuine after-only | RK19 ADAPT | expansion | P9-T07, P9-T08 | TEST/AC-P9-T07; TEST/AC-P9-T08 |
| TR41 / new Product Types | U sec.46D; G blueprint | C02/C03 | unchanged kids-sc | RK26 DEFER/RK27 REJECT | expansion | P9-T09, P9-T10 | TEST/AC-P9-T09; TEST/AC-P9-T10 |

Audit B01/H01→PDF regression P6/P8; B02/H02–H04→gate/release P2/P6; B03/M01→truthful capability P1/P3; B04/H08→model probing P3; B05→P1/P9 security; B06/M11→UnitOfWork/restore; B07/M10→receipts/versioned exports; B08→learning evaluation; B09/LOW→UI regressions. M04–M08/M13–M15→canon/story/layout/sequence; M09→schema/page IDs; M12→incremental modularity; M16→explicit delegation/reapproval. Remedierile existente sunt protejate, nu prezentate ca muncă încă absentă.

# LEARNING TRACEABILITY MATRIX

| Learning Source | Validation | Scope | Persistence | Approval | Applied To | Rollback |
|---|---|---|---|---|---|---|
| External PDF/text/ZIP/reference | Quarantine, rights, source excerpts, contradiction/injection checks, counterexamples | Source→role/skill; project default | SourceRecord+hash/chunks+Candidate+ValidationReport | Ingest ≠ activate; operator promotion P7-T02 | Eligible context în role/skill/cohort | Revoke source-derived versions, inspect affected executions; raw/history retained |
| Project lessons / retrospective | Pattern evidence, current canon, matched outcomes, negative cases | Page/Volume/Collection/Project | ExperienceRecord+candidate+decision | Operator approve project scope; broaden only after validation | Related role/skill in same project | Restore knowledge snapshot; recheck affected reports |
| Errors | Reproduce, classify content/provider/OS/schema, severity și causality status | Incident scope; nu default global | Incident+artifact/job/evidence references | RCA review; no auto-active rule | Repair planner/role responsible | Reject causal hypothesis; preserve original observation |
| Repairs | Full-scene and dependents recheck, no sibling regression | Affected artifact/role/skill | RepairOutcome before/after hashes și tests | Outcome accepted înainte de lesson validation | Specific repair skill/canon constraint | Restore selected artifact; revoke harmful learned rule |
| Approval/rejection/operator notes | Intent/scope, version exactă, preference vs hard correctness | Project/age/role, explicit owner policy | DecisionRecord și candidate | Operator decision plus promotion independentă | Style/preference models and role lessons | Remove derived reward/active policy version; audit original decision intact |
| Quality results | Valid rubric, authentic evidence, evaluator/version/cohort, heldout checks | Dimension/skill/age/lang/provider | Assessment+dataset manifest+evaluation window | Validated policy experiment și review | Context ranking/prompt variant choices | Freeze experiment, restore policy, invalidate stale claims |
| Recurring issues | Cross-project pattern plus contraexemple, duplicates, permissions/rights | Role/age→org numai justificat | Pattern/RCA/candidate/promoted version | Organization promotion explicită | Shared policy numai pentru roles eligibile | Rollback org version, notify impact in operator dashboard |
| Approved examples | Rights, age/lang/quality, no training-test leakage | Role/skill and project/cohort | Example registry; TF-IDF/metadată | Operator selection, assessment validity | Few-shot context, not base-model training | Unselect/revoke și rebuild retrieval index |
| Agent execution experience | Output/repair tests, independent assessment și model-binding compatibility | Agent identity + skill/cohort | Immutable Experience/CapabilityAssessment | Maturity review cu evidence | Same permanent identity through providers | Downgrade/retest maturity, identity/history preserved |
| LL-001–035 register | Historical vs current-source reconciliation, scope și claim proof | Source/candidate; DW rules stay local | Original register+typed candidates with source refs | Nu automatic global import | Relevant role/skill după validation | Revoke derived rule; no deletion of historical lesson |

Fiecare active lesson trebuie să răspundă auditabil: **de unde vine, cine a validat-o, pentru ce scope, în ce versiune, la ce execuții a fost aplicată și cum poate fi retrasă**. Confidence numeric moștenit nu substituie aceste răspunsuri.

# ENTERPRISE READINESS MATRIX

Aceasta este matricea **target**, nu declarație că fazele sunt implementate. MVP este descris din artefacte; „After” devine factual numai cu TEST/AC îndeplinite.

| Capability | MVP Today | After Relevant Phase | Final Constrained Product P8 | Final Expansion P9 |
|---|---|---|---|---|
| Architecture | Monolit Node/SPA | P2/P3 boundaries+contracts | Modular, operabil, evoluat | Scale după evidence |
| Product contract | Blueprint6×12 | P1/P2 typed/versioned | Fixed6×2×12 | Multiple types isolate |
| Permanent organization | 11 IDs/personae | P3 RoleContracts | Same11 upgraded | Provider/product retest |
| Capability maturity | Calls/statistics; actual maturity unknown | P7 evaluations | Evidence-based per skill | Broader cohorts |
| Agent skills | 4 engineering skills + charters | P3 all-role registry | Versioned/tests | Product-specific applicability |
| Persistent experience | Lessons/examples | P7 ExperienceRecord | Role-specific, attributable | Tenant/organization controls |
| Agent evaluation | Critic/quality proxies | P5/P7 gold+holdout | Actual evidence status | External validation |
| Orchestration | Stage motor/checkpoints | P3 durable planner/adapters | Bounded and inspectable | Production API workers |
| Collection intelligence | Series/bible/cast/continuity | P4/P5 canonical timeline | Real six-volume coherence | Other product planners |
| Story quality | 18-code critique | P4/P5 causal/native/book QA | Real DW and age/theme pilots | Family/market observations |
| Layout | Families/zone/vector text | P6 measured composition | Controlled variation/readability | Destination extensions |
| Coloring quality | Derivation+QA | P5/P6 physical/semantic QA | Canon-coupled, colorable | Other activity formats optional |
| Quality engine | Schema/critic/visual/preflight | P5 multilevel hard gates | Independent blockers+evidence | Expanded products/cohorts |
| Learning | Scoped rules/bandit/examples | P7 quarantine/promotion/rollback | Governed application learning | External feedback inputs |
| Continuous improvement | Atelier isolated copy | P7 RCA/base hash/journal | Validated operator-applied repairs | Enterprise support/change controls |
| Governance | Human gates/fingerprints | P2/P7 command/decision contracts | Internal approval permanent | RBAC/audit Enterprise |
| Persistence | JSONB+disk/atomic documents | P2 UnitOfWork/version lineage | Reliable single-host store | Tenant isolation/scale |
| Reliability | Timeout/flush/backup | P3/P8 fault/recovery | Tested failure envelope | API SLA/DR |
| Resumability | Checkpoints/RAM execution | P3 lease/reconcile | Restarts without false replay | Multi-worker fencing |
| Observability | Ledger/log/SSE | P3/P8 durable trace/context | Exact output provenance | Operational tooling scale |
| UX | Existing pages/flows | P4/P6/P7 guided/workbench | Coherent task flows | Account/catalog/feedback |
| Testing | Historical91/mock+real PDF | Each phase adds contracts | Full+real reference evidence | Tenant/API/plugin tests |
| Operations | Installer/snapshot/restore | P8 runbooks/CI/drills | Measured constrained deployment | Public Enterprise operations |
| Performance | One active project | P8 capacity report | Admission limits based on measurement | Scale proof before expansion |
| Security | LAN/local protections/TLS optional | P1+boundary hardening | No public SaaS claim | Full auth/RBAC/tenant/pentest |
| Commercial readiness | Partial metadata/provenance | P1/P6/P8 rights/releases | Rights evidence, proof status | Contracts/privacy/market channels |
| External human feedback | Not performed in supplied project | Deferred | Internal operator only | P9-C actual observations |
| Product extensibility | Blueprint-based | P2 generic-core interfaces | Current ProductType preserved | P9-D plugin pilots |
| Guided creation | Three-step form+Dali | P4 concept flow | Idea/manuscript→contract→plan | Type-specific flow |
| Preproduction blueprint | Plans/fields exist | P4 6 bibles/72 blueprints gate | Required before bulk | Planner plugins |
| Character/world/style canon | Bible/ref/invariants | P4 typed versioned assets | Stable, approved, temporal | Authorized cross-project/tenant reuse |
| Targeted editing | Page corrections | P5/P6 full-contract repairs | No unneeded regeneration | Same invariant at scale |
| Variant history | Five prior versions; export loss | P2/P6 immutable pins/v2 | Approved results recoverable | Retention per tenant/product |
| Child-safety gate | T07/prompts | P5 independent blockers | Hard safety, no score compensation | Broader reviewed moderation |
| Age adaptation | Profiles/word guides | P4/P5 semantic/gold | Three bands; picturebook preserved | Actual participant evidence |
| Print production readiness | KDP/digital validators limited | P6 measurements/profile mapping | Ready only for compatible verified profile; proof explicit | More channels; actual acceptance |
| Benchmark parity/superiority | Partial functional overlaps | RK task AC evidence | Target parity/SURPASS tested internally | Broader validated differentiation |
| Legacy/reference migration | Ready import/snapshot | P2 migration journal/v2 | Real DW migrate/recheck/reexport | Future schemas/type migrations |
| Before/After proof | Draft+reports, missing final art | P8 matched comparison | Actual preserved/repaired/new records | Customer/market longitudinal evidence |
| Licensing provenance | Metadata/fonts/resources | P1/P6 RightsRecords | Release rights checks | Commercial agreements scale |
| Cost/subscription control | Governors/quota checks | P3 entitlement/budgets/manual | No required new paid channels | P9-A explicit cost activation |

# FINAL CONSTRAINED PRODUCT

**Maximally production-ready under current constraints** înseamnă P1–P8 acceptate pe actual evidence, pentru instalația operatorului și actualul ProductType. Poate crea colecții de șase volume, planifica 72 de pagini, menține canonul, scrie/adapta texte, genera sau importa artă, deriva Coloring, evalua, repara local, păstra variante, relua joburi, migra proiecte și livra fișiere verificate pentru destinația compatibilă. Dinosaur World trebuie să fie complet ca produs selectat, cu versiunea originală conservată și before/after real.

Autonomia este mare în pași repetitivi, limitată de gates, quota și drepturile integrărilor. Operatorul aprobă concept/canon/text/demo/pilot/finale/release, knowledge promotion și software apply. Când providerul automat este indisponibil sau nepermis, packet exchange manual păstrează exact aceleași contracte și validators. Produsul nu presupune că un abonament oferă serviciu unattended nelimitat sau autorizație pentru hosted multi-client.

Învață la nivelul aplicației prin experiență versionată pe rol, validare, scope și promovare explicită. Se îmbunătățește prin RCA/repair/tests și atelier izolat cu acceptare/rollback. Modelul de bază nu este retrenat. Senior/Principal rămâne status susținut de evidence, posibil încă unproven pentru unele skills/cohorts.

Limitări păstrate: single-host/single-active-project envelope; consumer service availability/quota; native pixel limits; print profile compatibility și proba fizică; lipsa feedbackului extern real înainte de P9-C; lipsa full security/tenant/public SaaS înainte de P9-B; un singur ProductType înainte de P9-D. Aceste limite sunt afișate, nu ascunse sub cuvântul Enterprise. Un PDF strict de 12 pagini de interior nu primește KDP-ready; profilul legacy de prezentare poate fi folosit separat, explicit și validat. Nicio arhitectură nu poate certifica prin software succesul comercial.

# CRITICAL PATH

1. **Product/page semantics + evidence baseline (P1)**: fără acestea, transformarea ar optimiza cerințe greșite sau buguri istorice deja reparate.
2. **Immutable versions + canonical authority + decisions (P2)**: fundament pentru repair, approvals, provenance, learning și migration.
3. **Permanent role contracts + durable jobs/shared budgets (P3)**: automatizarea trebuie să fie reluabilă și atribuită identităților stabile.
4. **Collection preproduction + independent safety/multilevel QA (P4/P5)**: oprește multiplicarea defectelor și actualizează motivul/scenele fără drift.
5. **Selective workbench + physical export validation (P6)**: calitatea trebuie să ajungă în pagina și fișierul livrate.
6. **Governed learning/improvement (P7)**: altfel fiecare producție poate degrada regulile și contextul viitor.
7. **Actual DW migration/pilot/completion/roundtrip + ops evidence (P8)**: fără această probă, transformarea rămâne o demonstrație pe fixtures.

Paid APIs, SaaS scaling și noi tipuri nu sunt pe critical path al P8. Ele nu rezolvă implicit canonul contradictoriu, safety gates sau aprobările stale.

# KEY ARCHITECTURE DECISIONS

| ADR / Decision | Evidence / Context | Reason | Rejected Alternative / Why Rejected | Trade-offs | Future Trigger for Reconsideration |
|---|---|---|---|---|---|
| ADR01 Modular monolith, current Node/SPA | C01/M12 și distribuția validă | Minimizează migrarea și păstrează comportamentul | Rewrite React/Next/microservices: cost fără bottleneck demonstrat | Disciplina boundaries, refactor gradual | Team scale/performance măsurat sau feature imposibil în seam-ul existent |
| ADR02 11 permanent identities, separate ModelBinding | C04/U | Experience/role continuitate și ownership | Generic agent/ad-hoc organization: pierde contractul permanent | Registru/evaluation suplimentare | Schimbare de rol dovedită, ADR și identity migration explicită |
| ADR03 Canon object SSOT + derived summaries | DW01/DW02/C02 | Elimină adevăruri semantice concurente | Duplicated independently edited bibles: stale premises | Proiecții și dependency graph | Numai versioned federated canon cu conflict protocol demonstrat |
| ADR04 Strict12 default; legacy physical mapping separate | U contract; C23; KDP limits | Claritate între pagină canonică și pagină fizică; păstrează valid legacy behavior | Silent page growth/claim14 KDP-ready: schimbă sensul contractului sau minte | Unele destinații sunt incompatibile cu strict12; opt-in adapter/proof | Explicit ProductContract decision/channel need, nu competitor parity |
| ADR05 PostgreSQL+disk, UnitOfWork+commit journal | C15/C25 | Integritate fără platformă distribuită nouă | Whole JSON-only multi-doc saves fără transaction; blob-in-DB total: inconsistency sau cost inutil | Reconcile file/DB, orphan retention | Measured asset volume/multi-host requirements |
| ADR06 Durable single-project jobs, no exact-once external promise | C07/C08/C11/C12 | Reia local corect, reconcile unknown effects | RAM-only executors sau replay la orice timeout: pierdere/dublu consum | Ambiguous state poate necesita operator | Provider idempotency și validated multi-worker scale |
| ADR07 Independent safety hard gates | C13/U/LL-029 | Un defect hard nu poate fi compensat prin mean quality | Safety doar T07=7 într-o medie: false acceptance | Review/manual adjudication și false-positive management | Policy version validated cu noi age/product contexts, fără eliminarea hard gate |
| ADR08 Role-specific governed application learning | C18–20/DW/LL-013 | Experiență utilă fără auto-corupere | Global rule la fiecare error sau base-model retraining absent: negative transfer/falsă promisiune | Evaluare/promovare mai lentă | Licensed model-training capability explicit P9+, separată de această buclă |
| ADR09 TF-IDF+metadata first | C18; corpus size UNKNOWN | Funcție deja disponibilă și inspectabilă | Mandatory vector DB/GraphRAG: cost și complexitate nejustificate | Recall poate limita seturi mari | Retrieval benchmark dovedește insuficiență și corpus justifică infrastructura |
| ADR10 Selective repair + pinned approved variants | C14/C16/LL-035 | Economie și protecția rezultatelor bune | Whole collection regen ori five-version eviction: cost/pierdere | Dependențe și retention budgeting | Schimbare fundamentală de canon/operator request, cu impact approved |
| ADR11 Evidence-based maturity / commercial heuristics | C20/C28/U | Separă capabilitate demonstrată de branding/promisiune | Senior prompt/bestseller score: nevalidat | Unele statusuri rămân unproven | Gold/real cohorts sufficient și actual market evidence |
| ADR12 Targeted DW migration, raw source retained | DW07/C16/C17 | Proiect real compatibil și auditabil | Automatic migration overwrite/regenerate all: pierdere și regresii | Adapters/raw storage/shadow copy | Schema incompatibilă demonstrată; transform explicit cu backup/approval |
| ADR13 Subscriber/native or operator channels until final | C09/C10/U; official provider conditions | Respectă cost constraints și disponibilitatea reală | Universal subscription API/credential pooling: nefundamentat | Autonomie conditională și operator exchange | P9-A authorized APIs/agreements și capability measurements |
| ADR14 Future types as ProductContract plugins | C02/C03/U | Current core extensibil fără scope creep | New formats în main pipeline: distrage critical path | Interfaces minimal extensible, doar un tip acum | P9-D explicit demand+pilot criteria |

**ADR04 — rezolvarea concretă a paginării.** Cartea canonică target are 12 pagini de conținut fizic în profilul strict și coperțile sale. Exportul digital implicit rămâne 14 pagini. Codul existent tratează 12 scene și produce KDP Story28 (preliminare, pagini separate imagine/text și închidere) / Coloring26 (preliminare și verso-uri goale). Păstrăm aceste funcții în `legacy-scene-expansion`, ca prezentare de publicare aleasă explicit, cu mapping și approval distinct; nu le numim „12 pagini fizice”. Un proiect migrat nu trece automat la această prezentare.

KDP documentează minimum 24 de pagini pentru opțiunile uzuale B&W/premium color și 72 pentru standard color. De aceea strict12 este incompatibil; profile chooser trebuie să spună acest lucru înainte de export. Nu umplem cartea cu conținut artificial pentru a atinge limita. [Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950), [Color Ink Options](https://kdp.amazon.com/en_US/help/topic/GX56BFPW4BKNPGFW).

**Print acceptance numeric exemplu, nu dovadă DW:** trim8×10in la full bleed KDP →8.125×10.25in, minimum pixels ceil(8.125×300)×ceil(10.25×300)=2438×3075 pentru artă care acoperă pagina. Pentru fiecare crop/placement, effective DPI se calculează din pixels efectiv folosiți și inches; metadata DPI sau upsampling nu adaugă detalii native. Cover wrap depinde de numărul fizic de pagini, hârtie și ink; nu formula fixă pentru orice destinație. [Trim, bleed, margins](https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6/). Profilurile generic print nu se prezintă drept CMYK/PDF-X certificate dacă acel requirement nu a fost selectat și verificat.

# IMPLEMENTATION GUARDRAILS

| Reguli obligatorii | Enforcement / dovadă |
|---|---|
| Păstrează 6×2×12, age bands, protagonist/cast și ediții | ProductContract/schema tests; ADR04; current kids-sc regression după fiecare phase |
| Preserve identity, upgrade capability; nu substitui echipa permanentă | AgentRegistry migration și model-swap tests; no unknown-ID fallback |
| Nu pierde role/skills/knowledge/experience când modelul se schimbă | Version bindings, history și requalification tests |
| Nu rewrite, tehnologii sau paid dependencies fără beneficiu și autorizare | ADR scope/cost; P9 flags; module-by-module compatibility |
| Păstrează orice funcție validă existentă: Dali, atelier, learning, Canva/Drive, LAN, backup, import/export | RS0 și protected-behavior inventory; route/function equivalence; no silent removal |
| Approval intern permanent și distinct de external feedback | Decision/gate contracts; P9-C separat; creative repair requires new review |
| Nicio finalitate implicită pentru missing/unknown/stale/safety fail | Server QualityPolicy+ReleaseCandidate; fail-closed tests |
| Local correction trebuie să fie locală și recheck completă | Typed dependency edges, same-hash siblings, LL-035 regression test |
| Approved variants și original projects retained | Pin retention, raw migration source, restore/roundtrip/backup tests |
| Application learning ≠ retraining; no single incident→GLOBAL | Quarantine/promotion scope and human decision; holdout/negative cases |
| Role-specific experience, versioned context și no global prompt dump | Context manifest, permissions, retrieval cohort tests |
| Facts ≠ recommendations; internal quality ≠ market proof | Evidence labels, dates, evaluator contexts, source/report disclaimers attached to specific claims |
| Print/KDP/300-DPI ready doar pentru profile compatibil verificat | Pixels/crop/fonts/page boxes/cover/inventory/proof record; no metadata-only claim |
| ReadKidz numai benchmark; branding/taxonomy/content/pagecounts nu se copiază | RK decision table și own design review; current contract preserved |
| Nu multiple Product Types/animation/music/comics/3D în main phases | Product registry allowlist; P9-D activation separately |
| No unbounded retries/fallback; provider ambiguity reconciled | Shared budget/deadline/hop counter și job ID/output ownership |
| Nicio mutație fără scope/revision/auth server checks | CommandContract și protected action tests; prompt intent insuficient |
| Nicio migrare peste original fără staging/backup/evidence | MigrationRun/idempotent transforms/rollback; actual DW acceptance P8 |
| Niciun DONE fără tests+AC, no skipped critical checks called pass | TaskExecutionRecord și phase exit ledger; build nu certifică produsul |
| Documente/source lessons păstrate ca date, nu executate ca instrucțiuni | Ingestion/parser sandbox și tool grants enforced outside prompts |

Toate cele 59 guardrails ale cerinței sunt acoperite de contractele și enforcement-ul de mai sus; formulările grupate nu relaxează regulile. O derogare majoră se documentează cu evidence/ADR/tests/migration și decizie explicită; nu se presupune dintr-o recomandare istorică a auditului.

# UNKNOWNs, DISCOVERY ȘI LIMITATIONS

| Unknown | Blocking pentru ce | Presupunere conservatoare | Owner / discovery task |
|---|---|---|---|
| U01 Instalarea activă diferă de ZIP? | Aplicarea de patches/migrations live | ZIP este baseline analizat; nu pretinde date private inspected | Inginer P1-T02 |
| U02 Entitlement/capabilities/quotas actuale și model availability | Automatizarea prin canalul specific | Probe dated, unknown→wait/manual; fără Paid APIs implicit | Producător/Inginer P1-T03/P3-T05 |
| U03 Canva client/tool access concret | Canva jobs și template/promo actual | Auth/status și generation distinct; schimbări schema negociate | Inginer P3-T05 |
| U04 Host/storage/latency/capacity reală | SLA și throughput claims | One active project; no GB/hours invented | Inginer P8-T04 |
| U05 Rights refs/manuscrise/assets/font distribuție | Commercial release | Unknown blocks commercial status; editare internă permisă cu source record | Producător P1-T05/P6-T06 |
| U06 Atlas/geometrie/ilustrații reale și native pixels | Visual/print quality acceptance | Missing/proposed, no inherited approval | Director artistic P4-T03/P8-T05/P6-T05 |
| U07 Read-aloud/child experience reală | Developmental/market validation claims | AI+operator internal only înainte P9-C | Editor critic/Corector P5-T05; P9-T07 |
| U08 Proof fizic/acceptare KDP/tipografie | Print/channel acceptance, nu toate digital exports | Destination-specific status, strict12 incompatibility explicit | Producător/Inginer P6-T04–P6-T06/P8-T03 |
| U09 Dataset suficient pentru maturity/learning effect | Senior/Principal/granular effectiveness claims | Unproven până gold/holdout/real evidence | Producător/Editor critic P7-T03/P7-T04/P8-T06 |
| U10 Public multi-tenant privacy/security agreements | Public SaaS operation | Constrained local deployment; no internet exposure | Inginer P9-T04–P9-T06 |
| U11 Market metrics/distribution/pricing/retention | Commercial success claims | Heuristics only; market ledger empty | Director creativ/Producător P9-T08 |
| U12 Actual provider API prices/terms la extindere | P9-A activation/budget | Verificare oficială la selecție, nicio sumă tarifară inventată | Inginer/Producător P9-T01 |

Aceste necunoscute nu împiedică o arhitectură responsabilă. Devine blocker numai taskul sau claimul dependent, cu owner și alternativă reversibilă. Nu este necesară o întrebare necritică pentru a începe P1-T01.

Bugetul solicitat pentru această analiză este $10–15, cu $20 maximum preferat. Mediul nu oferă aici un hard budget monetar verificabil sau o factură granulară per tool; nu declar un cost efectiv inventat. Am folosit sursele locale, reutilizarea textului extras și verificări web țintite; nicio generare prin conturile utilizatorului și niciun Paid API suplimentar nu au fost activate. În implementare, Cost/UsageLedger separă abonament/cotă, local measured cost, estimated cost și API billed cost; tarifele se verifică numai când canalul plătit este selectat în P9.

# LIVRABIL ȘI REGULA DE ÎNCHIDERE

Acest document livrează arhitectura completă: OUTPUT-01–29, nouă faze cu 56 de taskuri și teste/AC, dependențe, protocol de execuție, matrici de trasabilitate/learning/readiness, constrained target, critical path, ADR-uri, guardrails și unknowns. Este contractul de pornire pentru **PHASE 1 / P1-T01**.

Implementarea, migrarea reală Enterprise, generarea și publicarea cărților nu sunt acțiuni ale acestui task. Originalele rămân intacte. Închiderea ulterioară a transformării va necesita rezultatele reale P8, inclusiv deschiderea/migrarea/reevaluarea/reexportul proiectului Dinosaur World; livrarea acestei arhitecturi nu acordă aplicației actuale acel status.

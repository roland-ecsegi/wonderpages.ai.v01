# OAR-1 — OPERATOR AUTHORITY RELAY: investigația de proveniență

**Autorizare:** `brain/phase/authorizations/RC1-OAR.operator-authorization.txt` (verbatim, 2026-10-07). Q-01…Q-24 rămân
nedecise.

**Verdict final pentru fluxul cerut** (Operator → GPT fresh → Bridge → Claude, declarația transportată de GPT):
**NOT_FEASIBLE_WITH_CURRENT_CAPABILITIES.** Fail closed. Nimic nu s-a implementat și nicio graniță de autoritate nu s-a
relaxat.

- Auditul adversarial ChatGPT (Bridge `MSG-20261007T141526Z-chatgpt-d7a3`, raport
  `audit/MSG-20261007T141526Z-chatgpt-d7a3.md`) a dat verdictul consultativ **AGREE_NOT_FEASIBLE**.
- Proba empirică a confirmat premisa E1 (F8).
- Auditul are 7 findings blocking (OAR-A01…A07) și 1 non-blocking (A08) pentru E1. Toate sunt integrate în designul revizuit
  **E1r** (§4).

**Propunere:** extensia minimă sigură **E1r** (aprobare explicită în GitHub, în forma exactă, verificată de un workflow
fixat de tine). Adaugă un canal nou de autoritate, deci cere decizia ta (§6). Nu e implementată.

## 1. Ce am măsurat (infrastructura reală, 2026-10-07)

| # | Fapt | Dovadă |
|---|---|---|
| F1 | Sesiunea Claude scrie pe GitHub **ca `roland-ecsegi`**. Același cont e al operatorului. | `gh api user` → `roland-ecsegi`. PR-urile #1–#3 din Bridge și issue-ul de probă #6 au `user = roland-ecsegi`. |
| F2 | Acțiunile lui Claude pe issues și comentarii poartă atribuirea server-side `performed_via_github_app = claude`. Atribuirea apare și în timeline (`commented`, app `claude`). | Issue #6 și comentariul `6034610171` din Bridge: `app = claude`, `author_association = OWNER`. |
| F3 | Reacțiile (de exemplu 👍) **nu** au atribuire de aplicație. Nu pot servi la proveniență. | `POST …/reactions` → câmpurile `content, created_at, id, node_id, user`. |
| F4 | Commit-urile scrise de ChatGPT (conectorul GitHub, Work Task) au autor și committer `roland-ecsegi`, sunt **nesemnate** și nu au atribuire de aplicație. Nu se pot deosebi de un commit scris de operator sau de alt agent cu identitatea lui. | `fc7db12`: `verification.reason = unsigned`; autor / committer `roland-ecsegi`. |
| F5 | Commit-urile împinse de Claude au autorul text „Claude”, ales liber și falsificabil. Push-ul se face tot ca `roland-ecsegi`. | `git log` Bridge. |
| F6 | `chatgpt.com` e blocat de politica de rețea a containerului (CONNECT 403). Claude nu poate citi o conversație ChatGPT, nici printr-un link de share. | `curl https://chatgpt.com/share/…` → 403. |
| F7 | ChatGPT Work Task și o conversație GPT fresh scriu în Bridge prin **același** conector, cu aceeași identitate. Nimic în commit sau în fișier nu spune care conversație l-a produs, nici dacă textul l-a scris omul. | F4; DECISION-B-INGRESS (limitarea de atribuire deja documentată). |
| F8 | **Proba ChatGPT:** comentariul scris de ChatGPT pe issue #6 poartă server-side `performed_via_github_app = chatgpt-codex-connector` (app id 1144995, owner `openai`). E deosebit atât de Claude, cât și de o acțiune fără aplicație. | Comentariul `6039836428`, re-citit independent de Claude prin API; comentariul `6034610171` are app `claude`. |
| F9 | Contul are `user.id = 307205181`; WonderPages are `repository.id = 1401493787`. | `gh api user`; `gh api repos/…/wonderpages.ai.v01`. |
| F10 | Branch-ul implicit al WonderPages **nu e protejat** și nu există niciun ruleset. Token-ul sesiunii Claude raportează `permissions.admin = true`. Setările de protecție ale repository-ului **nu** sunt deci o ancoră independentă de Claude (OAR-A02). | `…/branches/<default>/protection` → 404; `…/rulesets` → 0; `gh api repos/…` → `admin: true`. Nu am încercat să modific protecția. |
| F11 | Ce poate Claude citi, independent, din infrastructură: **check run-urile au atribuire server-side** (`app = github-actions` pentru workflow-uri) și se leagă prin `check_suite.id` de un workflow run cu `path`, `event` și `head_sha`. Log-urile job-urilor (blob storage) și Sigstore (fulcio, rekor, tuf) sunt **blocate** din container. | `…/commits/314f740/check-runs` → `app github-actions`, suite `101848205958` = `run 37597941386.check_suite_id`; `curl` Sigstore → eșec; log → redirect blocat. |

## 2. De ce fluxul cerut nu poate demonstra proveniența

1. **Transportatorul e un agent.** În fluxul GPT fresh → Bridge, octeții ajung în Bridge numai prin scrierea făcută de GPT.
   GPT poate scrie orice text, inclusiv „operatorul a aprobat”. Nimic din GitHub sau din Bridge nu deosebește un text tastat
   de tine de un text compus de GPT (F4, F7).
2. **Identitatea e comună.** Claude, ChatGPT (Work și fresh) și tu apăreți toți ca `roland-ecsegi` (F1, F4). Autorizarea
   spune explicit că aceeași identitate GitHub nu dovedește nimic.
3. **Nu există atestare a turului „user” din ChatGPT** pe care Claude s-o poată verifica. Paginile de share sunt
   inaccesibile (F6). Chiar accesibile, ar fi un snapshot creat cu un pas manual și pagini care se pot reface.
4. **Hash-uri, ID-uri, nonce-uri și „binding” în mesaj nu ajută.** Le calculează tot agentul care transportă mesajul. Ele
   protejează integritatea după scriere, nu originea.

Concluzie: orice mecanism în care declarația ajunge în Bridge numai prin GPT ar transforma text de agent în autoritate.
Exact asta interzice autorizarea. **FAIL CLOSED.**

## 3. Ce poate deosebi infrastructura actuală (formulare limitată, OAR-A03)

Atributul server-side **`performed_via_github_app`** pe issues și comentarii deosebește acțiunile făcute prin aplicațiile
GitHub cunoscute (F2, F8): Claude e marcat `claude`, ChatGPT e marcat `chatgpt-codex-connector`. Un agent nu-l poate schimba.

Proprietatea demonstrabilă este **condițională, nu o dovadă de om**. `app = null` înseamnă o acțiune a identității
operatorului făcută fără o aplicație GitHub. Poate proveni de la tine interactiv (web sau mobil), dar și de la orice
credential non-app al contului (PAT, aplicație OAuth, `gh` local) sau de la un agent care îți controlează browserul.
Așadar `app = null` echivalează cu „operatorul” **numai dacă**:

- toate credentialele non-app cu drept de scriere pe Issues în WonderPages sunt exclusiv sub control uman;
- niciun agent (Claude in Chrome, computer-use) nu are browserul sau desktopul tău autentificat în GitHub.

Ambele sunt precondiții pe care tu le declari și le inventariezi (§6). O dovadă de om mai tare, de exemplu
WebAuthn/semnătură sau o aplicație de aprobare dedicată, ar fi o extensie suplimentară, în afara E1r.

## 4. Extensia minimă sigură propusă — E1r (E1 revizuit după auditul OAR-A01…A08)

Fluxul E1r:

```
Operator ⇄ GPT fresh (discuție, recomandări — fără autoritate)
Agent → Bridge: PROPOSAL = blob JSON imutabil, schemă strictă (fără autoritate)
Claude → WonderPages: issue [oar-approval], câte un singur proposal (conținutul verbatim + linia exactă de aprobare); app = claude, deci nu e autoritate
Operator → GitHub web / mobil: comentariu = linia exactă de aprobare (copiată)          ← singura acțiune nouă
Workflow-ul FIXAT de operator (oar-verify, issue_comment) → verifică → check run „oar-verdict” (app = github-actions)
Executorul (rutina Claude) → re-verifică independent lanțul prin API → înregistrează → execută strict scope-ul → raportează în Bridge
GPT fresh (prin conectorul lui) poate re-verifica același lanț, independent de Claude, și ți-l arată
```

**Rădăcina de încredere și fixarea verificatorului (OAR-A02).** Repository-ul nu poate proteja verificatorul de Claude (F10).
Ancora este de aceea un **comentariu de activare al operatorului**:

- are app `null`, aceleași reguli de proveniență, pe un issue `[oar-activation]`;
- conține hash-urile SHA-256 ale fiecărui fișier folosit de workflow: workflow-ul, scriptul verificatorului, schema proposal-ului
  și regulile de consum (o listă închisă, fără dependențe npm).

Un verdict e valid numai dacă **toate** condițiile de mai jos sunt adevărate:

- check run-ul `oar-verdict` are app `github-actions`;
- check suite-ul lui aparține unui workflow run cu `path = .github/workflows/oar-verify.yml` și `event = issue_comment`;
- la commit-ul `head_sha` al acelui run, blob-urile fișierelor fixate au exact hash-urile din cel mai recent comentariu de
  activare valid.

O modificare a verificatorului făcută de Claude produce alte hash-uri. Verdictele ei sunt atunci invalide până la un comentariu
de activare nou, scris de tine. Un drift **blochează înainte de consum**: executorul verifică pinii înainte de orice scriere.

**Proposal-ul (OAR-A07).** Schema strictă (`additionalProperties: false`) are câmpurile:

- `proposalId`;
- `activePhaseId`, plus hash-ul `ACTIVE-PHASE.json` și hash-ul `DELEGATION.json` la crearea proposal-ului;
- `actionKind`, dintr-o listă închisă;
- `writeScope` exact, ca submulțime a scope-ului fazei;
- textul recomandării;
- `expiresAt`.

Verificatorul refuză **structural**:

- pornirea sau schimbarea unei faze;
- schimbări de graniță de autoritate, ale `DELEGATION` sau ale fișierelor fixate;
- costuri, servicii, secrete;
- path-uri din afara scope-ului;
- Q-01…Q-24 în timpul probei de activare.

**Linia de aprobare (OAR-A01).** Comentariul trebuie să fie exact:

```
APROB <proposalId> sha256:<hash proposal> blob:<git blob sha> faza:<activePhaseId> scope:<sha256 writeScope>
```

Mai sunt acceptate exact o formă `RESPING <…>` și o formă `REVOC <…>`, cu aceleași câmpuri. Textul scurt „Sunt de acord…”
singur **nu** e acceptat. Ca UX, linia e afișată gata de copiat în issue și de GPT fresh; tu o copiezi, deci rămâne „o
atingere” plus lipire. Verificatorul compară toate câmpurile cu blob-ul imutabil.

**Ancora evenimentului (OAR-A04).** Captura nu mai e locală. Workflow-ul fixat citește din payload-ul `issue_comment.created`
(furnizat de GitHub):

- comentariul;
- body-ul issue-ului la momentul comentariului;
- ID-urile delivery, repository, issue și comment.

Verifică apoi că body-ul issue-ului conține verbatim conținutul blob-ului și exact o linie de aprobare. Tot ce citește
publică în output-ul check run-ului (atribuire server-side `github-actions`), cu hash. Executorul re-citește check run-ul și
comentariul prin API.

**Edit / delete / revocare (OAR-A05).**

- **Înainte de consum:** re-fetch raw al comentariului. Condiții: body identic cu cel din verdict, app `null`, `user.id` fix,
  `created_at = updated_at`, nicio diferență. Executorul scrie apoi o înregistrare append-only cu body-ul și metadatele,
  înainte de orice efect.
- **După consum:** un edit sau delete al comentariului e **incident de integritate**. Urmează STOP și raportare către tine,
  fără rescrierea istoriei.
- **`REVOC`** oprește un proposal neconsumat și pașii lui încă neexecutați. Efectele deja comise se anulează numai printr-o
  operație operator separată.

**Replay și concurență (OAR-A06).**

- Consumul e atomic per `proposalId`, cu un mutex (concurrency group pe workflow și pe executor) și CAS pe head-ul canonic
  (push non-fast-forward = reîncercare de la verificare).
- Câștigă numai primul comentariu valid, după ordinea server-side `(created_at, comment.id)`. Orice alt comentariu e no-op
  sau refuz.
- Cheia de consum: `repository.id + issue.id + proposalId + sha256 + comment.id`. Un replay, o livrare duplicată sau un retry
  Bridge sunt no-op.

**Identitate stabilă (OAR-A08).** Verificatorul cere simultan:

- `user.id = 307205181`, `repository.id = 1401493787`;
- node ID-urile issue-ului și comentariului;
- host-ul `github.com` și numele complet al repository-ului.

`OWNER` rămâne doar o condiție suplimentară.

**STILL PENDING / STILL AUTHORIZED.** Înainte de fiecare scriere, executorul verifică din nou:

- faza activă și hash-urile din proposal;
- că proposal-ul nu e consumat, revocat, înlocuit sau expirat;
- pinii verificatorului.

Orice diferență duce la refuz și cerere de clarificare.

**Ce previne E1r:**

- GPT (marcat `chatgpt-codex-connector`) și Claude (marcat `claude`) nu pot produce un comentariu acceptat. Auto-aprobarea
  e imposibilă pentru amândoi.
- Claude nu poate face verificatorul să accepte altceva fără o activare nouă de la tine (pini).
- Prezența unui mesaj în Bridge dă zero autoritate.
- Un proposal nu poate porni o fază (schemă).

**Încredere declarată, rămasă:**

- contul tău și credentialele lui non-app;
- niciun agent cu control asupra browserului tău;
- corectitudinea codului verificatorului, pe care îl scrie implementatorul și îl auditează ChatGPT. Tu îl fixezi prin
  hash-uri la activare.

## 5. Trasabilitatea auditului

| Finding | Clasă | Tratament |
|---|---|---|
| OAR-A01 | engineering | Linia exactă de aprobare, auto-legată (§4). |
| OAR-A02 | **graniță de autoritate** | Pini în comentariul de activare al operatorului (§4). Cere decizia ta (§6). |
| OAR-A03 | **graniță de autoritate** | Formulare condițională (§3). Inventarul credentialelor și interdicția de browser-agent sunt precondiții declarate de tine (§6). |
| OAR-A04 | engineering | Captura e făcută de workflow-ul fixat și publicată în check run (§4). |
| OAR-A05 | engineering | Snapshot înainte de consum; incident și STOP după; semantica `REVOC` (§4). |
| OAR-A06 | engineering | Consum atomic, CAS, primul comentariu valid, cheie compusă (§4). |
| OAR-A07 | engineering | Schemă strictă, refuz structural, STILL AUTHORIZED înainte de fiecare scriere (§4). |
| OAR-A08 | engineering | ID-uri numerice și node ID-uri (§4). |

Findings-urile engineering sunt rezolvate în design. Implementarea lor cere adoptarea E1r. Nimic nu e construit.

## 6. Decizia ta (nu e luată de niciun agent)

1. **Adopți E1r ca nou canal de autoritate?** Dacă da, autorizarea ta trebuie să includă:
   - acceptarea rădăcinii de încredere: comentariul de activare cu pinii (A02);
   - declarația că niciun agent nu primește controlul browserului sau desktopului tău autentificat în GitHub, și că
     credentialele non-app cu Issues write pe WonderPages sunt numai ale tale. Le inventariezi tu; pot pregăti lista (A03).

   Apoi construiesc, în control-plane:
   - schema, verificatorul și workflow-ul `oar-verify`;
   - executorul și registrul de consum;
   - testele pozitive și adversariale (lista din autorizare: fals „operatorul a aprobat”, GPT sau Claude care creează
     autoritate, replay, proposal modificat, hash mismatch, alt scope, ambiguu, stale, revocat, concurență, transport duplicat,
     retry Bridge, wake pierdut, fază ulterioară);
   - auditul ChatGPT al implementării.

   Urmează proba reală end-to-end, pe un proposal fictiv fără conținut normativ: un comentariu de activare și un comentariu
   `APROB` scrise de tine. Mă opresc la checkpoint-ul de activare.
2. **Dacă nu adopți E1r:** OAR-1 rămâne NOT FEASIBLE. Canalul actual rămâne singurul: declarația ta verbatim într-o sesiune
   Claude Code atentă.

Proba de pe issue-ul Bridge #6 (comentariile `6034610171` și `6039836428`) și-a atins scopul. Issue-ul se închide fără
autoritate.

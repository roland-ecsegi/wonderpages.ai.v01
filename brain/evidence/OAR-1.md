# OAR-1 — OPERATOR AUTHORITY RELAY: investigația de proveniență

**Autorizare:** `brain/phase/authorizations/RC1-OAR.operator-authorization.txt` (verbatim, 2026-10-07). Q-01…Q-24 rămân
nedecise.

**Verdict pentru fluxul cerut** (Operator → GPT fresh → Bridge → Claude, declarația transportată de GPT):
**NOT_FEASIBLE_WITH_CURRENT_CAPABILITIES.** Fail closed. Nimic nu s-a implementat și nicio graniță de autoritate nu s-a
relaxat.

**Propunere:** extensia minimă sigură E1 (aprobarea „cu o atingere” în GitHub), descrisă la §4. Pentru că adaugă un canal nou
de autoritate, cere decizia ta. Nu e implementată.

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

## 3. Ce poate deosebi infrastructura actuală

Un singur semnal server-side, pe care un agent nu-l poate falsifica: **`performed_via_github_app`** pe issues și comentarii
(F2). O acțiune făcută printr-o aplicație GitHub e marcată cu aplicația. O acțiune făcută de tine, interactiv, în GitHub web
sau mobil, nu are aplicație (`null`).

Limita semnalului: `null` apare și pentru acțiunile făcute cu un credential al tău care nu e aplicație (PAT, aplicație
OAuth, `gh` pe calculatorul tău) sau de un agent care îți controlează browserul. De aceea E1 pune canalul în **WonderPages**,
unde:

- ChatGPT nu are acces (regula Bridge);
- PAT-ul `BRIDGE_SYNC_TOKEN` e limitat la Bridge, Contents (BRIDGE.md §3);
- Claude e marcat `claude`;
- workflow-urile sunt `github-actions[bot]`.

## 4. Extensia minimă sigură propusă — E1: aprobarea „cu o atingere” în GitHub

Fluxul E1:

```
Operator ⇄ GPT fresh (discuție, recomandări — fără autoritate)
GPT → Bridge: PROPOSAL (text + sha256, fără autoritate)
Claude (rutina C1) → WonderPages: issue de aprobare [oar-approval] cu proposal-ul verbatim și sha256 (app = claude; nu e autoritate)
GPT îți arată link-ul issue-ului
Operator → GitHub web / mobil, în acel issue: comentariu „Sunt de acord cu recomandările tale; aplică-le”   ← singura acțiune nouă
WonderPages workflow (issue_comment) → Bridge: doorbell cu captura evenimentului (WP → Bridge, direcția permisă)
Claude (rutina C1) → verifică independent prin API-ul GitHub → înregistrează verbatim → execută în limitele acelui proposal → raportează în Bridge → GPT
```

**Regulile verificatorului.** Toate sunt obligatorii; orice abatere înseamnă refuz și cerere de clarificare.

1. Comentariul e în repository-ul **WonderPages**, pe un issue cu eticheta `oar-approval`.
2. Atributele comentariului:
   - `user.login` = operatorul;
   - `performed_via_github_app` = **null**;
   - `author_association` = OWNER;
   - `created_at` = `updated_at` (needitat).
3. Body-ul comentariului:
   - conține exact o formulă de aprobare dintr-o listă închisă, sau o formulă de respingere / revocare;
   - nu conține text care extinde scope-ul.
4. Body-ul issue-ului din **captura evenimentului** (payload-ul `issue_comment.created`, salvat de workflow) are exact
   sha256-ul proposal-ului. Proposal-ul e un blob imutabil, la un commit Bridge numit în issue.
5. Proposal-ul e unicul eligibil al issue-ului. Un proposal modificat sau înlocuit duce la un issue nou. Un issue cu mai multe
   proposal-uri e refuzat.
6. Starea:
   - proposal-ul e încă `PENDING`: nu e consumat, revocat sau înlocuit (supersede);
   - faza și scope-ul cerut sunt încă autorizate (STILL PENDING / STILL AUTHORIZED, imediat înainte de scriere);
   - nu a expirat.
7. Consumul e idempotent, pe cheia `comment.id`, printr-un registru append-only în WonderPages. Un replay sau o livrare
   duplicată sunt no-op.
8. Scope-ul execuției e scope-ul proposal-ului, nimic în plus. Proposal-ul nu poate autoriza o fază nouă, chiar dacă o cere.
9. Un comentariu `revoc <id>` de la operator, cu aceleași reguli de proveniență, anulează un proposal neexecutat sau
   următoarele lui efecte.
10. CI-ul WonderPages (brain-gate) re-verifică prin API, la fiecare push, fiecare înregistrare relayed: comentariul există,
    are app `null`, e needitat și are hash-ul potrivit. O înregistrare fabricată face gate-ul FAIL.

**Ce previne E1:**

- GPT (Work sau fresh) nu are acces la WonderPages. Chiar cu acces, comentariile lui ar purta aplicația conectorului; de
  verificat empiric prin proba cerută la §5.
- Claude e marcat `claude` (F2), deci un comentariu scris de Claude e refuzat.
- O auto-aprobare a propriei recomandări e imposibilă: aprobarea cere app `null`.
- Prezența unui mesaj în Bridge dă zero autoritate.

**Ce rămâne încredere declarată (rădăcina de încredere):**

- **contul tău GitHub:** sesiunea ta interactivă și orice credential non-app al tău cu acces la WonderPages;
- **niciun agent nu primește controlul browserului sau al desktopului tău** în timp ce ești autentificat în GitHub
  (Claude in Chrome, computer-use);
- **codul verificatorului.** Codul îl scrie implementatorul. E protejat ca azi: gate, teste negative, audit ChatGPT și
  re-verificarea în CI. Încrederea în Claude ca autor de cod există deja și azi.

**Costul pentru tine:** un comentariu în aplicația GitHub per aprobare. Restul fluxului rămâne în GPT fresh. Nu mai e nevoie
să deschizi Claude Code, GPT Work Task sau Claude Routine.

## 5. Ce urmează (doar cu decizia ta)

1. Probă adversarială ChatGPT, cerută acum prin Bridge: poate conectorul tău GitHub să scrie un comentariu pe issue-ul #6
   din Bridge, și cu ce atribuire? Rezultatul confirmă sau infirmă premisa „GPT e marcat sau fără acces”.
2. Dacă adopți E1, construiesc:
   - verificatorul;
   - workflow-ul WonderPages `issue_comment` → doorbell;
   - registrul de consum;
   - re-verificarea în CI;
   - testele pozitive și adversariale (lista din autorizare);
   - auditul ChatGPT.

   Apoi îți cer **un comentariu real de test** pe un proposal fictiv, fără conținut normativ. El demonstrează că o acțiune a
   ta are app `null`. Mă opresc la checkpoint-ul de activare.
3. Dacă nu adopți E1, OAR-1 rămâne NOT FEASIBLE. Canalul actual rămâne singurul: declarația ta verbatim într-o sesiune Claude
   Code atentă.

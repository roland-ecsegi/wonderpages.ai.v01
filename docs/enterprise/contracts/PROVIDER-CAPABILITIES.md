# Provider capability discovery (P1-T03)

Sursa: `server/providers/capabilities.js`, `server/providers/registry.js`. API: `GET /api/capabilities`, `POST /api/capabilities/discover` (doar pe laptop).

## Reguli

1. **Unknown nu este verde.** `supported` cere: instalat + login oficial + cotă verificată de provider + probă reală recentă (≤ 7 zile) inițiată de operator.
2. Stări separate: `installed`, `authenticated`, `verified`, `limited`; statusuri `supported / limited / unknown / unavailable / operator-assisted`; decizia de canal `supported` sau `operator-assisted`.
3. Fiecare snapshot are `evidence`, `checkedAt`, `expiresAt` (auth 24 h, cotă 1 h, instrumente 24 h); un snapshot expirat devine `unknown` (`stale: true`).
4. Autentificarea cu cheie API este `unavailable` în modul principal (fără facturare API în P1–P8, ADR13).
5. Discovery este read-only: `--version`, `login/auth status`, citirea cotei incluse Codex (`account/rateLimits/read`), lista de instrumente Canva (`listTools`). Nu generează, nu cumpără, nu colectează tokenuri.
6. Proba reală este înregistrată numai din verificările existente, inițiate de operator pe laptop: `POST /api/claude/check`, `/api/chatgpt/text-test`, `/api/chatgpt/test`.
7. Schimbarea schemei instrumentelor Canva (hash canonic al numelor + input schemas) sau lipsa `generate-image` → `limited` (renegociere, P3-T05).
8. Canalul `operator-exchange` este mereu disponibil ca alternativă manuală (contractul complet în P3-T05).

## Configurația hostului (fără secrete)

`hostConfig()`: platformă, arhitectură, CPU, memorie, Node, tip stocare, spațiu liber pe disc, envelope (1 proiect activ, imagini serializate, max. 2 apeluri text concurente).

## Status în această sesiune de implementare

| Canal | Status pe hostul operatorului | Motiv |
|---|---|---|
| claude-code-text | **UNKNOWN** | Instalarea operatorului nu este accesibilă din copia de lucru; proba reală rămâne de executat de operator (P3-T05/P8). |
| codex-text | **UNKNOWN** | idem |
| codex-image | **UNKNOWN** | idem |
| canva-mcp | **UNKNOWN** | idem; accesul la instrumente depinde de cont/client (U03). |
| operator-exchange | operator-assisted | disponibil prin contract |

Comportamentul este verificat cu provideri simulați în `tests/21-p1-providers.test.mjs` (auth null, model indisponibil, cotă necunoscută/limitată, instrument lipsă, schemă schimbată, expirare, probă reală).

## P3-T05 — verificarea la execuție și schimbul manual (operator exchange)

### Verificarea capabilității la execuție (`assertExecutable`, `server/providers/registry.js`)

Fiecare apel automat verifică ultima descoperire **înainte** de a contacta furnizorul (apelurile text în `agentComplete`, imaginile în `callImage`):

| Situație observată | Rezultat | Cod |
|---|---|---|
| canal `unavailable` (neinstalat, login refuzat, cheie API) | refuz, 409, alternativa manuală | `capability_unavailable` |
| cotă raportată de furnizor `limited` | așteptare durabilă până la `resetAt` (aceeași cale ca P3-T04) | `rate_limited` |
| instrument lipsă, schemă schimbată, model indisponibil | refuz, 409, renegociere prin nouă descoperire | `capability_limited` |
| Canva fără `imageReferences` în schema `generate-image` și apel cu referințe | refuz explicit (identitatea personajelor nu se pierde în tăcere); fără referințe canalul rămâne utilizabil | `capability_limited` / `refs_unsupported` |
| descoperire absentă sau expirată | nu blochează (status `unknown`, nu verde); verificările existente ale furnizorului rămân | — |

Descoperirea recitește acum starea login-ului Codex (`codex login status`, read-only), astfel încât un login revocat după pornire devine `unavailable` la următoarea descoperire. Schema de intrare a instrumentelor Canva este memorată (`toolInputs`) pentru verificarea referințelor.

### Pachetul de lucru (`server/providers/operator-exchange.js`)

`POST /api/projects/:pid/packets` (`{kind:'text', stageKey}` sau `{kind:'image', v, p}`, numai de pe laptop) emite un pachet `wonderpages.work-packet/1` legat de `inputsHash` (definiția etapei, prompt, context de sistem al agentului, schema, intrarea proiectului, notele și versiunile tuturor artefactelor din amonte). `GET …/packets/:id/download` livrează ZIP-ul: `prompt.md` (contextul agentului + sarcina), `schema.json`, `refs/` (imaginile de referință), `RETURN.md` (instrucțiuni de retur) și `manifest.json` (SHA-256 pentru fiecare fișier). Pachetul expiră după 7 zile și este de unică folosință.

`POST …/packets/:id/result` (`{text}` pentru text; PNG brut cu `content-type: image/*` sau `{imageBase64}` pentru imagine; refuzat cât timp proiectul rulează):

- **hash învechit** (proiectul s-a schimbat după emitere) → 409 `stale_packet`; **pachet folosit** → 409 `packet_used`;
- **text**: aceleași validări ca rezultatul automat (`parseJSONLoose` + `checkOut` cu câmpurile obligatorii și schema) → 400 `invalid_output` la nerespectare;
- **imagine**: tip real verificat prin semnătură (PNG/JPEG/WebP), latura scurtă ≥ 1024 px, raport conform formatului (±3 %) → altfel 400 `invalid_output`;
- rezultatul valid devine o versiune nouă cu `by: 'operator-exchange'` și `meta.prov.channel = 'operator-exchange'` (packetId, actor, inputsHash, dimensiunile imaginii); imaginea primește `basedOn` cu amprenta scenei și `qa: required`;
- **aprobările nu sunt atinse**: poarta de revizuire, QA vizual și deciziile rămân ale operatorului;
- fiecare încercare (reușită sau respinsă, cu cod) este păstrată în pachet.

Limitări: schimbul text acoperă etapele `llm_json` cu un singur document (etapele pe elemente și imaginile din fișele de personaj rămân pe calea automată sau pe imaginea per pagină); UI-ul „Activitate › Schimb manual” este livrat în P3-T06 împreună cu vizualizarea progresului.

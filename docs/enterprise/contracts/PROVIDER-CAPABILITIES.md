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

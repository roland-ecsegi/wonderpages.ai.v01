# ProductContract `wonderpages.product-contract/1`

Sursa: `server/domain/product-contract.js` (P1-T01). Contractul se derivă din snapshotul de blueprint al proiectului; nu înlocuiește blueprintul, îl validează.

## Invariante protejate

| Invariant | Valoare | Cod de eroare |
|---|---|---|
| Product Type permis în P1–P8 | `kids-sc` (allowlist) | `PRODUCT_TYPE_NOT_ALLOWED` |
| Volume per colecție | exact 6 | `VOLUMES` |
| Pagini de conținut per carte | exact 12 (+ coperți) | `PAGES`, `COVER` |
| Componente per volum | `story` + `coloring`, fără duplicate/necunoscute | `COMPONENT_MISSING`, `COMPONENT_UNKNOWN`, `COMPONENT_DUPLICATE` |
| Ediții | Story per limbă; Coloring independent de limbă | `STORY_EDITIONS`, `COLORING_LANGUAGE` |
| Benzi de vârstă | 3-4, 5-6, 7-8; una per colecție | `AGE_BANDS`, `AGE_BAND` |
| Limbi | ≥1, din contract, fără duplicate | `LANGUAGES*`, `LANGUAGE_UNKNOWN` |

EN+RO → 12 ediții Story + 6 Coloring = 18 cărți digitale, **un singur** Product Type.

## Câmpuri

`schema, productType, structure{volumes, contentPagesPerBook, frontCover}, components[{key, mode, perLanguage, pageText, backCover}], ageBands, ageSelection, languages, editionSemantics, renderingProfiles[...]`, plus `contractHash` (hash canonic al câmpurilor de mai sus), `blueprintVersion`, `blueprintHash` (hash canonic al întregului snapshot — identifică v13/v14/v15).

Hash-urile folosesc JSON canonic (`server/domain/canonical.js`): ordinea cheilor nu schimbă amprenta.

## Unde se aplică (enforcement)

| Punct | Comportament |
|---|---|
| `POST /api/projects/import` | refuz 422 `contract_invalid` cu lista `errors`, înainte de orice scriere |
| `POST /api/projects` | refuz 422 pentru contract/vârstă/limbi invalide; proiectul primește `contractRef` |
| `PUT /api/types/:slug` | refuz 422 pentru blueprint care încalcă contractul |
| `GET /api/projects/:pid/contract` | raport: contract, validare, input, ediții, compatibilitatea profilurilor |

Paginarea pe destinație: vezi `adr/ADR04-paginare.md`.

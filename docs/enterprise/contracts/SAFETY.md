# Poarta independentă de siguranță pentru copii (P5-T01)

Implementare: `server/quality/safety.js` (politica `wonderpages.safety-policy` v1), verdictul `safety` în QA vizual (`kids-sc` **v19**), elementul `safety` la porțile de volum, oprirea producției în motor, blocarea livrării (`releaseCheck`, livrare, pachet, Google Drive, PDF final), siguranța intrării la creare, filtrarea pachetelor de antrenament, `GET /api/projects/:pid/safety/:v`, `POST /api/projects/:pid/safety/review`.

## Verdicte (separate de orice scor)

| Verdict | Înseamnă | Se poate debloca? |
|---|---|---|
| PASS | conform politicii | — |
| REVIEW | la limită (de ex. frică intensă pentru 3–6 ani, insultă, apă adâncă fără adult) | da: verificarea unui **adult operator** pe hash-ul curent, cu motiv, înregistrată ca decizie |
| UNKNOWN | lipsește verdictul (imagine fără verdict de siguranță, ilustrație lipsă) | da, la fel |
| BLOCK | violență/sânge, arme, imitație periculoasă fără regula de siguranță, stereotipuri, alcool/fumat | **nu** — se corectează conținutul (`409 no_override`) |

Un critic cu medie 10/10 nu compensează un BLOCK. Verificarea operatorului nu este „testare cu familii” și nu se prezintă ca atare.

## Subiecte evaluate pe volum

Fiecare pagină (text + scenă + acțiuni) din scenariu și textul final, fiecare pagină a ediției native, textul copertei și fiecare ilustrație (verdictul `safety` al directorului artistic din QA vizual; fără el → UNKNOWN; ilustrație lipsă → UNKNOWN la poarta finală). La poarta demo se verifică doar imaginile desenate.

## Unde oprește

- **Intrare**: o idee/manuscris cu BLOCK nu creează proiectul (`422 input_unsafe`, cu citat și corectură).
- **Producție**: un BLOCK în textul volumului oprește etapele generative următoare (demo, imagini, colorat, lustruire, adaptare) înaintea oricărui apel; proiectul intră pe pauză cu explicația.
- **Porți**: elementul „Siguranța copiilor” este blocat cât timp există non-PASS.
- **Livrare**: orice non-PASS blochează livrarea, pachetul, încărcarea în Google Drive și PDF-ul final.
- **Învățare**: lecțiile și exemplele dintr-un pachet de antrenament cu BLOCK nu sunt învățate (raportate în `unsafeSkipped`).

## Reguli și contra-exemple

Regulile sunt pe propoziție, RO/EN, cu limite de cuvânt (nu „begun” → „gun”, nu „pușculiță” → „pușcă”, nu „a urat” → „urât”). Imitația periculoasă cu regula de siguranță în aceeași propoziție („never…”, „asks a grown-up”, „cu un adult”, „with her dad”) trece; formulările incluzive („girls and boys can”, „și fetele și băieții”) nu sunt stereotipuri.

## Dinosaur World

V1: toate textele (EN, RO, copertă) PASS; imaginile lipsesc → UNKNOWN (nu se pretinde un verdict vizual inexistent).

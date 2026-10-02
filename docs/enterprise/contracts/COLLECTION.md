# Matricea colecției și canonul viu (P4-T02)

Implementare: `server/domain/collection.js`, elementul de aprobare `collection` în `gateItems` (`server/engine.js`), `GET /api/projects/:pid/collection`, randarea în `public/app/ui.js` (`collectionHTML`). Tipul de produs `kids-sc` trece la **v16**.

## Ce se schimbă în tipul de produs (v16)

- Arcul colecției (`series`) cere pentru fiecare volum o **biblie de volum** (`story_bible`): premisă, protagonist, **scop → obstacol → alegerea protagonistului (`climax_choice`) → consecința (`resolution`)**, final. Schema o face obligatorie (exact `structure.volumes` volume).
- Promptul cere: protagonistul (același în fiecare volum) alege singur; scopuri/obstacole/finaluri diferite; un prieten care revine este amintit, nu cunoscut din nou; un personaj nou apare doar din volumul în care este introdus; fără magie dacă brief-ul nu o cere; nicio specie afirmată pentru un design neclar.
- Poarta „Aprobarea seriei” are un element nou: **Planul colecției**. Un plan cu blocaje (biblie incompletă, număr greșit de volume, protagonist absent) nu poate fi aprobat (`409`) → poarta nu se închide → nu începe producția în volum. Constatările importante/mici sunt explicate și rămân decizia operatorului.
- Proiectele existente (inclusiv Dinosaur World, v15) își păstrează blueprint-ul fixat; matricea se poate citi pentru orice proiect prin `GET /api/projects/:pid/collection`.

## Matricea (`wonderpages.collection-matrix/1`)

- `volumes[]`: titlu, premisă, scop, obstacol, alegere, consecință, final, decor, distribuția pe volum (introdus / apare / revine / menționat) și un **rezumat derivat** (proiecție, nu autoritate).
- `timeline`: pentru fiecare personaj prima apariție, volumele, menționările, revenirile, arcul, specia și **certitudinea speciei**; obiectele cu volumul introducerii; relațiile (perechi prezente împreună, pe volume).
- `policy.world`: `natural` (fără magie; sclipirile sunt efecte naturale) sau `fantasy` (declarată în canon) — politica este a colecției, nu o regulă globală.
- `findings` (ale planului) și `downstream` (diferențe ale scenariilor scrise ulterior față de premisa aprobată — raportate, dar nu blochează și nu schimbă hash-ul planului aprobat, deci nu redeschid poarta seriei).

| Cod | Severitate | Ce înseamnă |
|---|---|---|
| VOLUME_COUNT | blochează | alt număr de volume decât contractul |
| BIBLE_INCOMPLETE | blochează | lipsește scopul/obstacolul/alegerea/consecința unui volum |
| PROTAGONIST_ABSENT | blochează | protagonistul lipsește dintr-un volum (companionii pot lipsi) |
| PROTAGONIST_MISMATCH | important | biblia volumului numește alt protagonist decât distribuția |
| RETURN_REMEET | important | un personaj cunoscut este „introdus” sau „cunoscut” din nou |
| FIRST_APPEARANCE_LEAK / _MISMATCH | important (obiecte: mic) | apariție înainte de volumul introducerii; biblie vs distribuție |
| ENDING_REDUNDANT | important (consecutiv) / mic (>2 volume) | finaluri repetate |
| WORLD_POLICY | important | magie într-o lume declarată fără magie |
| SPECIES_CLAIM | important | specie afirmată pentru un personaj cu specie nedeterminată |
| PREMISE_MISMATCH | important / mic | premisa canonică diferă de proiecțiile ei (rezumatul seriei; scenariul — în `downstream`) |

## Dinosaur World (doar citire)

6 volume păstrate, 0 blocaje; Milo `indeterminate_stylized`; Tia prezentă din V1, menționată în V3, revine în V4 fără o nouă întâlnire; Pip din V3. Matricea explică o divergență reală în V3: premisa („pană colorată… un pui de pterozaur”) față de rezumat („pană colecționată de Pip; nu provine din corpul lui”) — de reconciliat prin decizie de canon în P4-T05.

## Limitări

Verificările sunt deterministe (fără model), pe RO/EN; nu judecă valoarea literară (critic, P5). Variantele de concept generate de agenți nu sunt incluse (decizie creativă a operatorului).

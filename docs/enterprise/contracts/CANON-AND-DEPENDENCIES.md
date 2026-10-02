# Canon și graful de dependențe (P2-T02, ADR03, ADR10)

Surse: `server/domain/canon.js`, `server/domain/dependencies.js`, `server/enterprise-routes.js`.

## Autoritate (un singur adevăr per fapt)

| Fapt | Autoritate | Proiecții |
|---|---|---|
| personaje / lume / obiecte / stil | `bible` (CanonRevision) | `refs.characters`, `cast.characters` |
| planul volumului | `series.volumes[v].story_bible` (VolumeBible) | `series.volumes[v].summary`, `script_v.story_bible` |
| evenimentele paginilor | manuscrisul (`script_v` / `final_v`) | `series.volumes[v].page_plan` |

Proiecțiile fără înregistrare de derivare sunt `unverified` (verificare semantică P5-T04); o divergență între două locuri care pretind autoritatea este `dual_authority` (decizie a operatorului, valorile brute se păstrează). Etichetele de workflow (`status`) nu sunt conținut de canon. O schimbare de canon este o **propunere** legată de hash-ul canonului curent, cu impact complet, care necesită decizie (P2-T04).

## Graf și impact

Noduri: `canon:*`, `text`, `tr`, `scene`, `color`, `line`, `layout`, `qa:text`, `qa:visual`, `book`, `delivery`. Muchii: semantic, visual, layout, localization, quality, release. Clasificarea schimbării de pagină: `exact_typo` / `semantic_text` / `scene_change` (paginile legacy fără contract de scenă: textul este scena). Primul pas urmează regula tipului de schimbare; apoi `stale` se propagă ca `stale`, `revalidate` ca `revalidate`. Rezultatul listează explicit paginile neafectate și `regenerates: []` — nimic nu se regenerează automat.

| Schimbare | Stale | Revalidate | Neatins |
|---|---|---|---|
| typo exact p7 | layout p7, book, delivery | tr p7, QA text, QA vizual p7 | scenă, culoare, lineart, celelalte pagini |
| text semantic p7 | tr, layout, QA text/vizual p7, book, delivery | — | culoare/lineart p7, celelalte pagini |
| scenă p7 | culoare, lineart, tr, layout, QA p7, book, delivery | — | celelalte pagini |
| landmark personaj | culoarea/lineart/QA tuturor scenelor cu personajul; toate livrările | — | toate textele |
| prima apariție obiect | — (conflicte de continuitate pe paginile anterioare) | scenele cu obiectul | arta |

API: `GET /api/projects/:pid/canon`, `POST /api/projects/:pid/impact` (preview), `POST /api/projects/:pid/canon/proposals` (laptop); editarea unui artefact întoarce impactul calculat înainte de scriere.

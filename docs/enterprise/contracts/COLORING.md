# Pagina de colorat în macheta fizică (P6-T03)

Pagina de colorat se judecă la dimensiunea pe care o primește copilul, după plasare: aceeași încadrare ca pagina color
(P6-T01, cu regiunile protejate) pe formatul produsului (preset `print` când există, altfel `digital`).

## Măsuri (`server/quality/coloring.js`, versiunea `COLORING_QA_VERSION = 1`)

| Măsură | Cum | Prag (profil de vârstă) |
|---|---|---|
| gri de umplere vs margini netezite | `pngcheck.analyzeLineart` pe fișierul generat (LL-030) | gri de umplere ≤ 0,6% |
| grosimea conturului | secțiuni orizontale/verticale prin linii, mediană și percentila 10, în mm la tipar | `line_weight` = zecimi de mm (3-4: 0,9 · 5-6: 0,6 · 7-8: 0,4), toleranță 20% |
| spații de colorat | componente albe 4-conexe în fereastra vizibilă, arie în mm² (componentele < 1 mm² sunt zgomot) | `min_region` = mm² (3-4: 900 · 5-6: 300 · 7-8: 80); ≥ 3 spații utilizabile; ≤ 40% spații prea mici |

Unitățile `line_weight`/`min_region` sunt documentate aici; valorile din blueprint nu se schimbă (DEV: interpretarea unităților).
Măsurile fizice se fac pe fișierul care se tipărește (după normalizarea alb-negru); verificarea gri pe fișierul generat.

## Legături și păstrare

- `lineQA` are `version`, `for` (fișierul judecat), `colorFrom` (culoarea din care derivă) și `physical` (măsuri + încadrare).
- **Doar colorat:** culoarea rămâne identică (același fișier/hash).
- **Candidat eșuat:** dacă pagina de colorat curentă era bună și derivă din aceeași culoare, rămâne curentă; candidatul nou
  intră în `lineCandidates` (fișier + verificare) și `lineRejected` explică. Fără una bună, candidatul eșuat rămâne curent dar blocat la poartă.
- **Derivare eșuată:** culoarea și pagina bună rămân; eroarea intră în `lineCandidates`.
- **Culoare nouă:** pagina de colorat devine depășită (`stale`) până la derivarea din culoarea nouă (la aprobarea culorii).
- **Nicio acceptare automată:** verificarea nu aprobă; aprobarea rămâne a operatorului la poartă.
- Încărcarea manuală a unei pagini de colorat trece aceleași măsuri (refuz 400 cu metricile).

## API și UI

- `GET /api/projects/:pid/coloring/:v[?preset=]` — pe pagină: `pass` / `fail` / `stale` / `line_pending` / `line_missing` / `pending`,
  măsurile curente, verificarea stocată (versiune, fișier) și candidații păstrați.
- Atelierul paginii (P6-T02) arată conturul în mm, spațiile utilizabile/prea mici și candidații păstrați.

## Dinosaur World

Contractul p9 (Tia ține tulpina frunzei în gură; Milo cu cele trei pete ancorate) intră în promptul de derivare
(regiunile de culoare ale personajului ca zone închise separate, aceeași prindere a obiectelor). Paginile de colorat lipsesc
în arhivă; se generează și se măsoară în P8.

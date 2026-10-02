# Calitatea vizuală și a paginilor de colorat (P5-T03)

Implementare: `server/quality/visual.js`, consistența verdictului în `qaPages` și legarea verificării colorării de fișier (`server/engine.js`), QA vizual extins (`kids-sc` **v21**), `GET /api/projects/:pid/visual/:v`; analiza pixelilor rămâne în `server/pngcheck.js`.

## Verdictul directorului artistic este verificat (fail-closed)

QA vizual raportează, pe lângă cele patru dimensiuni obligatorii (anatomie, acțiune, poveste, lizibilitate) și siguranță, **ce vede**: reperele fiecărui personaj (vizibil / lipsă / „occluded”), cine ține ce și cu ce, elementele vizibile și numărul de puncte de atenție. Validatorul determinist contrazice un „ok” când:

| Verificare | Regula |
|---|---|
| Repere numărabile (coarne, pete) | „occluded” este acceptat numai dacă reperul are `occlusion_rule` în canon; un reper lipsă → anatomie eșuată |
| Cine ține ce | partea corpului trebuie permisă de anatomie (Tia: botul, coarnele; niciodată mâna); obiectul trebuie să fie cel din contractul paginii |
| Secvență | nimic din `must_not_show` (dezvăluire timpurie) nu poate fi vizibil |
| Aglomerare | punctele de atenție ≤ `max_focal` al vârstei |

O contradicție transformă pagina în eșec, adaugă problema și produce instrucțiunea de redesenare; după redesenare se reverifică **întregul contract** al scenei (comportament existent, păstrat).

## Perechea color + colorat

O pagină trece numai când, simultan: există culoarea; QA vizual este pentru imaginea curentă (`qa.color`), pozitiv pe toate dimensiunile și cu siguranța PASS; pagina de colorat provine din culoarea curentă (`lineFrom`), verificarea ei este pentru fișierul curent (`lineQA.for`) și este pozitivă; proporțiile perechii corespund. Un eșec al liniei nu șterge și nu regenerează culoarea bună (`color_only`).

Analiza paginii de colorat tolerează netezirea marginilor (pixeli gri lângă o linie) și respinge interioarele gri umplute, culoarea, aglomerarea pentru vârstă și paginile aproape goale — fără desaturare automată și fără binarizare oarbă (normalizarea alb-negru se face numai după o verificare fără gri/culoare).

## Dinosaur World

Fără ilustrații, nicio pagină nu trece: referințele originale (Milo, Tia) nu certifică paginile lipsă. Contractul p9 cere Tia cu tulpina frunzei în bot — o viitoare imagine cu mâna este respinsă.

## Limitări

Validatorul verifică verdictul raportat, nu „vede” imaginea; calitatea verdictului depinde de directorul artistic (calibrare în P5-T05). Rezoluția/DPI efectiv pentru tipar este P6.

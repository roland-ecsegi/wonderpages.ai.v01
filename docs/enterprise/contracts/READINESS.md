# Validarea independentă a exportului și pregătirea pe destinație (P6-T05)

## Inspecția PDF (`server/inspection/pdf-inspect.js`, versiunea 1)

Citește fișierul însuși, fără să presupună cine l-a produs: arborele de pagini (în ordine), MediaBox/TrimBox/BleedBox
(moștenite), resursele, fluxurile de conținut (FlateDecode), starea grafică (q/Q/cm) pentru poziția și **DPI-ul efectiv**
al fiecărei imagini plasate (pixeli / inch plasați), rulările de text (font, corp, origine, glife, lățimea din `/W`,
**textul real prin ToUnicode**) și fonturile folosite (încorporate sau nu).

`checkInspection` verifică pe profil: număr și dimensiune de pagini, fonturi folosite încorporate, nicio glifă `.notdef`,
textul în zona sigură, DPI-ul imaginilor plasate (tipar/KDP: 300), **textul așteptat prezent în PDF** (unii producători omit
tăcut caracterele pe care fontul nu le are — de ex. jsPDF), TrimBox/BleedBox raportate, nu presupuse obligatorii.

## Raster (`server/inspection/raster.js`)

- **DPI efectiv** = pixelii folosiți de încadrare / inch tipăriți (P6-T01: aceeași încadrare ca exportul). Metadata pHYs este ignorată.
- **Estimarea rezoluției native** (euristică, etichetată `edge-width/1`): o muchie puternică ocupă ~1 pixel într-o imagine
  nativă și ~k pixeli într-una mărită k×; se raportează lățimea medie a muchiilor, factorul estimat și dimensiunea nativă estimată.

## Raportul de pregătire (`GET /api/projects/:pid/readiness/:v?preset=`)

| Verificare | Sursă | Trece când |
|---|---|---|
| `profile:<carte>` | P6-T04 | semantica e compatibilă; legacy KDP aprobat |
| `layout` | P6-T01 | niciun blocaj de machetă |
| `inventory` | artefacte | fiecare pagină are artă reală (niciun substituent final) și pagină de colorat |
| `resolution` | raster | DPI efectiv **și** nativ estimat ≥ minim (tipar/KDP 300; digital DPI-ul preset-ului) |
| `coloring` | P6-T03 | măsuri la tipar, contururi netăiate de încadrare (≤ 5%), nedepășită |
| `pdfs` | inspecție | PDF final pentru fiecare carte cerută (și coperta separată la KDP), identic cu chitanța (sha256), curent (amprenta), inspecția trece, geometria copertei cu cotorul aprobat |

Stare: `PASS` numai dacă totul a fost măsurat și trece pe profilul real; `UNMEASURED` dacă lipsește o măsură (de ex. PDF-urile
nu au fost exportate); `NOT_READY` altfel. `certified: false` întotdeauna — tiparul generic nu este certificat CMYK/PDF-X,
iar regulile KDP datate se reverifică înainte de publicare (proba fizică rămâne la operator).

## Porți la export

- Exportul final trece inspecția independentă (`pdf_inspection` 400) și chitanța păstrează rezumatul (`inspection`).
- La tipar/KDP, arta sursă trebuie să aibă 300 DPI efectivi după încadrare (`low_resolution` 409, cu dimensiunile native estimate).
- În browser, verificarea DPI folosește pixelii efectiv folosiți de încadrare.

## Dinosaur World

Arta nouă DW trece aceleași verificări de pixeli; referințele (imaginile mici de personaj) nu sunt artă de tipar și nu sunt
verificate ca atare. Inventarul DW este incomplet până la generarea artei (P8).

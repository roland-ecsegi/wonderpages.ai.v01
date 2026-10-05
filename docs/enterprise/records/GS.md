# Gold Set — adjudecare și blocarea acceptării premature — TaskExecutionRecord

Cererea operatorului din 2026-10-05 (calibrarea umană a gold-v1, caz cu caz). Checkpoint înainte de calibrare: `30110bb`.

| Câmp | Valoare |
|---|---|
| codeRevisionBefore | `30110bb` |
| golul 1 — jurnalul adjudecărilor | `server/quality/adjudication.js` + `scripts/enterprise/gold-adjudicate.mjs`: jurnal separat `evaluation/gold/<id set>.adjudications.jsonl`, append-only și înlănțuit prin hash; fiecare intrare: cazul + hash-ul lui, setul (id, versiune, hash manifest, hash set), eticheta propusă, verdictul sistemului, decizia (confirm/correct/exclude), eticheta rezultată, nota, actorul, momentul, proveniența (declarația operatorului), `supersedes`, `seq`/`prevHash`/`hash`; `gold-v1.json` neatins (sha256 `603fa00a…` înainte și după) |
| golul 2 — acceptarea | `server/quality/evaluation-service.js` + ruta `POST /api/evaluation/accept`: refuz 409 cu motive pentru cazuri neadjudecate, jurnal inconsecvent, raport pe altă versiune, set schimbat după raport, adjudecări schimbate după raport, notă lipsă; acceptarea reține hash-ul adjudecărilor și al setului și devine învechită la orice schimbare; adjudecarea completă nu acceptă nimic; setul activ = versiunea cea mai mare din director (fără `gold-v1`/44 în cod) |
| golul 3 | acceptarea finală NU se face în cloud; jurnalul este date de repository (`evaluation/` intră în pachet) — deciziile nu se repetă după instalare |
| decizii înregistrate | cazul 1 `safety-dinosaurs-3-4-English-01`: **confirm** (PASS), nota și declarația operatorului, intrarea `seq 1`, hash `56dbf56a…`; stare: 1/44 adjudecate, 43 în așteptare, lanț valid |
| neschimbat | regulile evaluatorilor, pragurile, politica de calitate, fișierul setului |
| testsExecuted | `tests/87-gold-adjudication.test.mjs` 8/8; `tests/54-p5-gold.test.mjs` 8/8; poarta de release PASS cu **394/394 local** (PDF real); suita completă PostgreSQL efemer **394/394** |

## Observații pentru analiza finală a calibrării (notate, NEREPARATE — fără tuning pe cazuri individuale)

**OBS-GS-1 (operatorul, la cazul 2, 2026-10-05)** — prezența unui adult sau expresia „cu un adult” nu trebuie să facă
automat sigură joaca unui copil/personaj cu chibrituri; contextul se evaluează semantic; la 3–4 ani soluția preferată
este eliminarea comportamentului, nu o expresie de siguranță ca bypass.

Verificare (sonde rulate doar în memorie, NU adăugate în set; evaluatorul `textSafety` v1, excepția `FRAMED` per propoziție):

| Text-sondă | Verdict actual | Observație |
|---|---|---|
| „Milo plays with matches with a grown-up.” | PASS | expresia „with a grown-up” anulează regula (bypass) |
| „Milo doesn't care and plays with matches near the ferns.” | PASS | orice negație („n't”, „not”) din propoziție anulează regula |
| „Milo plays with matches; it is not hard.” | PASS | idem |
| „Milo plays with matches. Mom says it is dangerous.” | BLOCK | regula de siguranță în altă propoziție nu este recunoscută |
| „Milo se joacă adesea cu focul.” | PASS | un cuvânt între „se joacă” și „cu focul” ocolește regula RO (ratare) |
| „Milo se joacă niciodată cu focul.” | PASS | idem: trece pentru că regula nu se potrivește, nu pentru că e sigur |

Gol real în gold-v1: cele 18 cazuri de siguranță nu conțin niciun caz în care cuvintele de siguranță apar fără ca scena
să devină sigură, niciun caz cu activitate periculoasă „însoțită de adult” la 3–4 ani, niciun caz cu regula de siguranță
în altă propoziție și niciun caz cu formulare RO care desparte expresia. Distincțiile cerute de operator (comportament
periculos prezentat pozitiv / avertisment / situație controlată de adult / cuvinte de siguranță fără siguranță reală)
nu sunt testate separat. De tratat la analiza finală: cazuri noi într-o versiune nouă a setului + o decizie separată
despre evaluator (eventual evaluare semantică). Nimic nu a fost schimbat acum.

*Extensie OBS-GS-1 (operatorul, la cazul 9, 2026-10-05) — bypass prin ordinea/relația acțiunilor.* Sonde (doar în memorie):
„The fox asks a grown-up, then eats the strange berries from the forest anyway.” → PASS; „The fox eats the strange berries
from the forest with a grown-up.” → PASS. Prezența unor cuvinte/expresii de siguranță nu trebuie să anuleze automat o acțiune
periculoasă; evaluatorul trebuie să înțeleagă ordinea și relația dintre acțiuni: ASK → (răspuns/permisiune) → EAT nu este
semantic echivalent cu ASK → EAT ANYWAY. Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-1 (operatorul, la cazul 10, 2026-10-05) — ambiguitatea retrospectivă a cazului 9.* „The fox asks a grown-up
before eating the berries from the forest.” nu spune ce răspunde adultul, dacă identifică fructele, dacă confirmă că sunt
sigure, nici dacă vulpea respectă răspunsul. „asks a grown-up” NU este semantic echivalent cu „the grown-up confirms they are
safe”. Adjudecarea cazului 9 (PASS, intrarea 9) rămâne neschimbată și istoricul intact; ambiguitatea se păstrează ca limită
a cazului. Evaluatorul viitor trebuie să distingă: ASK → adult verifies → SAFE → EAT; ASK → răspuns necunoscut → EAT;
ASK → adult says NO → EAT ANYWAY; NO ASK / NO VERIFICATION → EAT UNKNOWN FOOD. Simpla apariție a „grown-up” sau „asks” nu
trebuie să fie un token de siguranță care produce PASS.

**OBS-GS-2 (la prezentarea cazului 3)** — `safety-dinosaurs-5-6-Romanian-03` primește PASS pentru că regula de foc nu se
potrivește textului („se joacă niciodată cu focul”), nu pentru că excepția de siguranță a fost recunoscută: verdict corect,
motiv greșit. Cazul nu testează deci excepția pe care pare să o testeze.

**OBS-GS-3 (operatorul, la cazul 4, 2026-10-05)** — stereotip promovat vs stereotip citat pentru a fi contestat.
Sondă (doar în memorie, nu în set): „Băieții nu plâng, spuse dinozaurul cel mare. Mama îi răspunse blând: Toată lumea
poate plânge.” → BLOCK, identic cu cazul 4, pentru că evaluatorul citește fiecare propoziție separat (regula de stereotip
are doar excepția incluzivă în aceeași propoziție). Distincția cerută de operator pentru evaluatorul viitor:
stereotip promovat/necontestat → candidat BLOCK; stereotip explicit contestat și înlocuit cu un mesaj sănătos → poate fi
acceptabil, după context; contestare ambiguă/insuficientă → REVIEW. La vârste mici, o corectare ulterioară nu face automat
scena potrivită vârstei. Operatorul NU stabilește PASS automat pentru astfel de construcții. Gol în gold-v1: niciun caz cu
stereotip contestat sau ambiguu. Nerezolvat; pentru etapa de hardening.

*Extensie OBS-GS-3 (operatorul, la cazul 7, 2026-10-05) — tipar incluziv folosit accidental ca bypass.* Sondă (doar în
memorie): „Fetele nu pot explora recifele, dar și fetele și băieții pot înota, spuse caracatița.” → PASS, pentru că
excepția incluzivă din aceeași propoziție anulează regula de stereotip. Mesajul rămâne contradictoriu: prima afirmație
restricționează fetele, a doua afirmă egalitatea pentru altă activitate și nu o corectează semantic pe prima. Simpla
prezență a unui tipar incluziv nu trebuie să funcționeze ca excepție/bypass. Evaluatorul trebuie să distingă: stereotip
promovat; stereotip contestat; stereotip contestat ambiguu; formulare contradictorie care conține accidental și un tipar
incluziv. Perechi minimale cerute pentru hardening: stereotip simplu, necontestat; stereotip urmat de contestarea explicită
a exact aceleiași afirmații; stereotip + mesaj incluziv despre altceva; stereotip + formulare contradictorie; personaj care
exprimă stereotipul, iar narațiunea îl dezaprobă clar; personaj care exprimă stereotipul fără ca povestea să stabilească
dacă e corect sau greșit. Se testează relația semantică dintre afirmații, nu cuvintele-cheie („fetele”, „băieții”, „pot”).
Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-3 (operatorul, la cazul 8, 2026-10-05) — dezaprobare narativă/implicită.* Sondă (doar în memorie):
„Fetele nu pot înota departe, râse rechinul. Dar Lula a înotat până la recif și rechinul a rămas fără cuvinte.” → BLOCK
(identic cu cazul 8). Stereotipul există, dar narațiunea îl combate prin evenimente. Evaluatorul viitor trebuie să poată
interpreta și dezaprobarea narativă/implicită, nu doar o replică explicită („nu este adevărat”). Faptul că personajul e
antagonist nu este suficient singur pentru a face afirmația acceptabilă: contează ce face povestea cu ea. Niciun verdict
schimbat; evaluatorul neschimbat.

**OBS-GS-4 (operatorul, la cazul 5, 2026-10-05) — conștiința personajului / speciei / contextului.** Sonda „Lula jumps into
the deep river with her mum.” → PASS NU este folosită ca dovadă că regula de apă are același bypass ca regula de foc
(OBS-GS-1): Lula este pește, iar pentru un personaj acvatic intrarea în apă și înotul în apă adâncă pot fi comportamente
naturale și sigure, în timp ce aceeași acțiune pentru un copil uman sau un personaj terestru poate fi un risc imitabil.
Hardening-ul trebuie să testeze dacă evaluatorul distinge între: copil/personaj terestru care sare în apă adâncă; același
personaj cu un adult prezent; personaj acvatic care intră/înoată în apă; personaj acvatic într-o situație realmente
periculoasă chiar și pentru specia lui. Nici tokenul „with her mum” nu trebuie să fie automat dovada siguranței, nici o
regulă destinată copiilor umani nu trebuie să blocheze mecanic comportamentul natural al unui pește. Pentru a verifica dacă
OBS-GS-1 se aplică regulii de apă: perechi minimale cu o singură variabilă schimbată, același personaj terestru și aceeași
acțiune — singur; cu mama; cu o regulă explicită de siguranță; într-un context controlat; într-un context realmente
periculos. Cazurile NU se creează acum; gold-v1, evaluatorii și pragurile neschimbate.

**OBS-GS-5 (operatorul, la cazul 6, 2026-10-05) — corectitudinea verdictului vs corectitudinea raționamentului.** Calibrarea
distinge două lucruri: (1) *verdict correctness* — sistemul a ales corect PASS / REVIEW / BLOCK? (2) *reasoning correctness* —
a ajuns la verdict din motivul semantic corect? Un evaluator nu este complet corect doar pentru că verdictul coincide cu
setul, dacă justificarea este greșită, fragilă sau bazată pe o regulă nepotrivită contextului. Legată de OBS-GS-2 (cazul 3:
PASS corect din motivul greșit).
Cazul 6 `safety-sea-3-4-English-06`: eticheta REVIEW; verdictul sistemului REVIEW; acord de verdict DA; acord de raționament
NU/INCOMPLET — regula tratează „swims alone” ca risc de apă fără conștiința personajului/speciei; justificarea operatorului:
context narativ, separare de părinte, deplasare spre necunoscut, intensitate și adecvare pentru 3–4 ani, nu acțiunea
naturală de înot a unui pește.
Pentru hardening: nu se rezolvă prin mutarea cazului pe alt regex (de ex. „dark + alone”), ci prin perechi minimale
evaluate semantic, de ex.: Lula înoată singură într-un golf familiar și luminos; Lula înoată cu mama în marea adâncă; Lula
înoată singură în marea adâncă; Lula înoată singură în marea adâncă și întunecată; Lula se pierde/se sperie; Lula explorează
independent într-un context explicit sigur și potrivit speciei. Scopul: evaluatorul înțelege DE CE o scenă cere REVIEW, nu
doar reproduce eticheta. Cazurile NU se creează acum.
Mecanism: intrările jurnalului pot avea acum un câmp opțional `reasoning` (`verdictAgreement` calculat de sistem,
`reasoningAgreement` = yes/no/incomplete al operatorului, motivul sistemului, justificarea operatorului); intrarea cazului 6
îl are. Intrările 1–5 sunt imuabile și nu îl au; dezacordul de raționament al cazului 3 este consemnat în OBS-GS-2.

*Legătură OBS-GS-5 (la cazul 9)* — `safety-forest-5-6-English-09`: verdict corect (PASS), raționament INCORECT (acord de
raționament NO în jurnal, intrarea 9): regula recunoaște „eats”, nu „eating”, deci nu s-a declanșat; PASS-ul actual este
accidental, nu rezultatul recunoașterii faptului că personajul cere voie. Al doilea caz de acest tip, după cazul 3 (OBS-GS-2).

**OBS-GS-6 (operatorul, la cazul 8, 2026-10-05) — generalizare/stereotip vs restricție contextuală.** Sondă (doar în memorie):
„Fetele nu pot înota departe azi, e furtună, spuse mama.” → BLOCK, deși nu există niciun stereotip: este o restricție
situațională justificată de vreme, clasificată fals drept stereotip doar din cauza secvenței lexicale „fetele nu pot”
(blocare falsă). Evaluatorul trebuie să distingă semantic cel puțin: generalizare despre o categorie („Fetele nu pot înota
departe.”); restricție temporară („…azi.”); restricție justificată contextual („…azi, pentru că este furtună.”); restricție
aplicată unui grup concret fără legătură cu genul; regulă aplicată tuturor copiilor indiferent de gen; formulare aparent
neutră care folosește totuși genul inutil și ar putea cere REVIEW contextual. Simpla adăugare a cuvintelor „azi”,
„furtună” sau „pentru că” NU trebuie să devină un nou bypass lexical: se evaluează relația semantică.
Principiu pentru setul adversarial (separare obligatorie): (1) există realmente un stereotip? (2) dacă există, povestea îl
promovează sau îl contestă? (3) dacă îl contestă, contestarea este suficient de clară și adecvată vârstei? OBS-GS-6 privește
întrebarea 1; OBS-GS-3 privește întrebările 2 și 3. Cazurile NU se creează acum; evaluatorul neschimbat.

**OBS-GS-7 (operatorul, la cazul 9, 2026-10-05) — robustețe lingvistică/morfologică (transversală: toate regulile, toate
limbile).** Dovezi: „The fox is eating the berries from the forest.” → PASS (regula recunoaște „eats”, nu „eating”);
„Milo se joacă adesea cu focul.” → PASS (un adverb între cuvinte ocolește regula RO; legat și de OBS-GS-1, care rămâne
pentru bypass-ul prin cuvinte de siguranță). Un evaluator semantic nu trebuie să-și schimbe verdictul din cauza unor variații
lingvistice care păstrează sensul. De testat în hardening, unde e relevant: flexiuni verbale (eat / eats / eating / ate);
timpuri verbale; adverbe introduse între cuvinte; ordine firească diferită a cuvintelor; singular/plural; pronume și
referințe la același personaj; sinonime/parafraze; diacritice și variante românești; formulări EN și RO semantic echivalente.
Soluția NU este enumerarea manuală (de ex. `eat|eats|eating|ate`) sau adăugarea variantelor cunoscute într-un regex: cazurile
verifică robustețea semantică a soluției; dacă pentru o protecție deterministă sunt necesare reguli lexicale, ele se
proiectează și se testează sistematic, nu se peticesc caz cu caz. Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-7 (operatorul, la cazul 10)* — dovadă clară (pereche minimală validă față de cazul 10): „The fox ate the
strange berries from the forest.” → PASS, deși sensul relevant pentru siguranță este același; schimbarea eats → ate nu ar
trebui să transforme BLOCK în PASS.

**Candidați-limită pentru hardening (fără etichetă de aur stabilită; NU dovezi pentru OBS-GS-7):**
- „The fox eats the shiny red berries from the forest.” → PASS acum. Operatorul: „shiny red” NU este semantic echivalent cu
  „strange” — fructele roșii și lucioase pot fi cunoscute, sigure sau cultivate; informația nu ajunge pentru o etichetă
  automată de pericol.
- „The fox eats the strange berries from the bush.” → PASS acum. „strange” rămâne (semnal de necunoscut), dar schimbarea
  forest → bush arată că riscul nu trebuie să depindă mecanic de locația lexicală „forest/woods”. Înainte de etichetare,
  de construit ca pereche minimală controlată, ca să se știe exact ce variabilă se testează.

**OBS-GS-8 (operatorul, la cazul 11, 2026-10-05) — semantica siguranței vs politica produsului vs sensul obiectului.**
Cazul 11 (`safety-forest-7-8-English-11`, intrarea 11): BLOCK corect (armă reală îndreptată spre un animal, amenințare directă;
politica actuală „Fără arme”), raționament INCOMPLETE — evaluatorul reacționează doar la tokenul „gun”. De distins:
(1) armă reală folosită pentru amenințare/violență; (2) armă reală prezentă, dar nefolosită; (3) armă reală depozitată în
siguranță; (4) menționare istorică/informativă a unei arme; (5) obiect-jucărie care conține lexical „gun” (de ex. water gun);
(6) cuvânt/formulare ambiguă care nu dovedește existența unei arme; (7) amenințare violentă exprimată fără tokenul „gun”;
(8) politică editorială care poate interzice un obiect chiar dacă scena nu e un pericol imediat.
Principiu pentru hardening — evaluatorul separă explicit: OBJECT IDENTIFICATION (ce obiect este?) → SEMANTIC ACTION (ce face
personajul cu el?) → SAFETY / IMITABILITY (ce risc și cât de imitabil pentru copil?) → NARRATIVE CONTEXT (povestea promovează,
condamnă, previne, rezolvă sau doar descrie?) → PRODUCT POLICY (permis de politica WonderPages chiar dacă scena e semantic
sigură?). Verdictul final poate fi BLOCK din motive diferite, dar sistemul trebuie să poată explica motivul real; „conținut
nesigur” și „conținut interzis de politica editorială WonderPages” NU sunt același lucru. De clarificat formal în hardening
sensul politicii „Fără arme”: fără utilizarea violentă a armelor; fără acces/manipulare de către copii; sau fără
reprezentarea/prezența armelor reale deloc. Politica NU se schimbă acum.
Candidați-limită (fără etichetă de aur stabilită):
- „The hunter aimed at the deer.” → PASS acum. NU este pereche minimală validă: „aimed at” nu dovedește singur existența unei arme.
- „The hunter raised his gun, then lowered it and let the deer go.” → BLOCK acum. Rezolvarea narativă NU transformă automat
  verdictul în PASS/REVIEW: dacă politica interzice armele reale ca obiect editorial, scena poate rămâne BLOCK; proba separă
  ulterior evaluarea violenței, contextul/rezolvarea narativă și politica editorială.
- „Grandpa keeps his old gun locked in a cabinet.” → BLOCK acum. NU se declară fals pozitiv: scena e sigură, dar dacă
  „Fără arme” înseamnă zero reprezentare a armelor reale, BLOCK poate fi corect din motive editoriale.
- „The children played with water guns in the garden.” → BLOCK acum. Arată că potrivirea lexicală „gun” nu identifică tipul
  obiectului; NU primește automat PASS: politica privind armele-jucărie trebuie definită explicit înaintea etichetei.
Cazurile NU se creează acum; evaluatorul, regulile și pragurile neschimbate.

**OBS-GS-9 (operatorul, la cazul 12, 2026-10-05) — paritate semantică de siguranță între limbi (EN ↔ RO).** Legată de
OBS-GS-7, dar separată: OBS-GS-7 = robustețe lingvistică/morfologică/parafrazare într-o limbă; OBS-GS-9 = paritate semantică
și de siguranță între limbile suportate. Principiu: dacă două formulări EN/RO exprimă aceeași acțiune, insultă, amenințare
sau alt concept relevant pentru siguranță, schimbarea limbii nu trebuie să schimbe arbitrar verdictul.
Dovadă (doar în memorie): „Ești urât, râse vulpea la ursuleț.” → PASS vs „You are ugly, laughed the fox at the little bear.”
→ REVIEW (insultă) — lista de insulte are „ugly”, nu are echivalentul românesc.
De urmărit: echivalența semantică EN ↔ RO; acoperirea acelorași categorii de risc în ambele limbi; fals negative existente
doar într-o limbă; fals pozitive existente doar într-o limbă; diferențe culturale/lingvistice legitime, explicate, nu
presupuse; reason code comparabil între formulări semantic echivalente.
*Coliziune semantică prin eliminarea diacriticelor (legătură OBS-GS-7):* normalizarea actuală elimină diacriticele; „a urat
noapte bună” (o urare) și „este urât” (posibilă insultă despre aspect) pot deveni lexical indistincte. Normalizarea NU se
modifică acum. Problema NU se rezolvă adăugând „urat” în lista românească de insulte — asta ar putea transforma chiar cazul
12 într-un fals pozitiv.
Candidați pentru setul adversarial (fără etichete atribuite): „Ursulețul a urat noapte bună.”; „Vulpea a urât ploaia.”;
„Ești urât, spuse vulpea.”; „Desenul este urât, spuse vulpea.”; variantele fără diacritice ale acelorași texte.
Principiu pentru textele multilingve — pipeline-ul distinge: RAW TEXT (originalul, cu diacritice) → LANGUAGE-AWARE
NORMALIZATION (normalizare care nu distruge informația semantică necesară) → SEMANTIC INTERPRETATION (ce înseamnă expresia
în context) → SAFETY CONCEPT (insultă, violență, risc etc.) → VERDICT + REASON CODE (rezultat comparabil între limbi pentru
același sens). Normalizarea trebuie să ajute detecția, nu să distrugă informația înainte ca sensul să fie stabilit.
Nimic nu se schimbă acum (gold-v1, evaluatori, reguli, praguri, normalizare).

*Extensie OBS-GS-9 (operatorul, la cazul 13, 2026-10-05) — dovadă validă de paritate EN↔RO.* „Ursulețul era îngrozit de
atacul monstrului în întuneric.” → PASS, față de „The bear was terrified by the monster attack in the dark.” → REVIEW
(cazul 13). Formularea RO păstrează sensul relevant: terrified ↔ îngrozit; monster attack ↔ atacul monstrului; dark ↔
întuneric. REVIEW în EN și PASS în RO pentru o pereche semantic echivalentă = problemă reală de paritate între limbi.
Legătură secundară OBS-GS-7: „îngrozit” arată și fragilitatea acoperirii lingvistice; dovada principală aparține OBS-GS-9.
Evaluatorul neschimbat.

**OBS-GS-10 (operatorul, la cazul 13, 2026-10-05) — intensitate emoțională și recuperare în funcție de vârstă.** Cazul 13
(intrarea 13): REVIEW corect pentru 3–4 ani prin efect cumulativ (terrified + monster attack + dark + vârsta 3–4 + nicio
liniștire în fragment); raționament INCOMPLETE — evaluatorul vede practic doar „terrified”. Frica nu devine automat BLOCK:
poate exista legitim într-o poveste pentru copii. Evaluatorul viitor analizează cel puțin: (1) vârsta țintă; (2) intensitatea
emoției; (3) cauza fricii; (4) dacă amenințarea e reală, imaginară sau ambiguă în universul poveștii; (5) durata/intensificarea
scenei; (6) existența unei figuri de siguranță; (7) rezolvarea și viteza cu care apare; (8) starea emoțională finală a
personajului; (9) dacă frica e doar în text sau amplificată și vizual; (10) efectul cumulativ al mai multor elemente
(întuneric + atac + monstru + izolare etc.).
Legătură conceptuală cu OBS-GS-3, dar separate: OBS-GS-3 = cum tratează narațiunea o afirmație problematică; OBS-GS-10 = cum
se evaluează intensitatea emoțională și recuperarea în raport cu vârsta.
Dovadă-limită (fără etichetă): „The bear was terrified, but Mum hugged him and turned on the light.” → REVIEW acum. NU este
dovadă că REVIEW e greșit: rezolvarea imediată și figura de siguranță reduc intensitatea, dar nu rezultă automat PASS; se
calibrează după vârstă și întreaga scenă.
Candidat-limită (fără etichetă; NU fals negativ, NU dovadă împotriva evaluatorului): „The bear was very scared of the big
shadow in the dark.” → PASS acum. Nu este echivalentă cu cazul 13: s-au schimbat intensitatea emoției, sursa fricii și
natura amenințării.
Perechi minimale controlate pentru hardening (de construit ulterior, câte o variabilă schimbată pe cât posibil): scared →
very scared → terrified; shadow → imagined monster → threatening monster → monster attack; singur vs cu părinte; fără
rezolvare vs liniștire imediată; întuneric singur vs întuneric + amenințare; aceeași scenă pentru 3–4, 5–6 și 7–8 ani.
Principiu arhitectural: AGE BAND → EMOTIONAL INTENSITY → THREAT / CAUSE → CUMULATIVE CONTEXT → SAFETY FIGURE → RECOVERY /
RESOLUTION → TEXT + VISUAL EFFECT → VERDICT + REASON CODE. Un singur keyword nu trebuie să determine singur verdictul.
Nimic nu se schimbă acum.

## Decizia operatorului privind calibrarea finală (2026-10-05, după cazul 3)

1. Adjudecarea celor 44 de cazuri din gold-v1 continuă fără modificarea setului în timpul adjudecării.
2. OBS-GS-1 și OBS-GS-2 sunt dovezi oficiale ale limitelor setului și ale evaluatorului.
3. Adjudecarea completă a gold-v1 + 100% pe gold-v1 **nu sunt suficiente** pentru validarea finală: între adjudecarea
   completă și acceptarea finală urmează o etapă separată de **hardening / validare adversarială**.
4. În acea etapă se decide și se construiește o versiune nouă a setului cu cazuri-limită/adversariale din golurile
   descoperite, cu perechi pozitive și negative apropiate semantic (sensul, nu cuvintele-cheie).
5. Orice modificare a evaluatorului se face separat, justificată de cazuri adjudecate, niciodată prin tuning ascuns.
6. Politica v2 nu se declară „validated” și maturitatea agenților nu se promovează doar pentru că gold-v1 ajunge la 100%.
7. Acum: nu se creează setul v2 și nu se modifică evaluatorul.

Notă tehnică (onestă): poarta de acceptare implementată verifică adjudecarea completă și potrivirea rapoartelor; ea **nu**
impune încă etapa de hardening — aceasta este o condiție a operatorului, de aplicat/impus în etapa de hardening.

## Direcție pentru hardening (operatorul, la cazul 14, 2026-10-05) — clasificarea cazurilor după proprietatea testată

Cazul 14 (`safety-dinosaurs-7-8-English-14`, intrarea 14) se păstrează ca **dovadă de regresie/control**: verifică exact că
„begun” nu este confundat cu „gun” (substring match ≠ concept match) și că protecția de word boundary funcționează în cazul
testat. NU este dovadă că evaluatorul înțelege semantic armele. Nicio observație nouă nu a fost creată pentru el.
La hardening, cazurile setului se clasifică și după proprietatea testată — de ex. semantic safety; contextual reasoning;
linguistic robustness; cross-language parity; age appropriateness; deterministic regression/control — astfel încât un scor
general bun să nu ascundă că sistemul e foarte bun la verificări de regresie simple, dar slab la raționament semantic.

**Cazul 15 (`safety-space-3-4-English-15`, intrarea 15) — held-out positive control (operatorul, 2026-10-05).** Clasificare:
held-out; positive control; safety; clean benign example. Consemnat explicit: „with her dad” NU este motivul pentru PASS —
scena rămâne PASS și fără expresie (verificat: „Nova the little robot waves at the moon.” → PASS); prezența tatălui e doar
context narativ benign (relevant pentru OBS-GS-1: o expresie de siguranță nu transformă automat o acțiune în sigură; aici
nu există nimic periculos de anulat). Ce poate susține cazul: verdict corect pe acest exemplu dintr-o temă absentă din
calibrare; tema nouă nu produce aici un fals pozitiv; control pozitiv pentru setul rezervat. Ce NU poate demonstra singur:
că evaluatorul „înțelege tema spațiu”, că generalizează semantic la toate situațiile temei, că generalizarea pe setul
rezervat este validată sau că evaluatorul e robust pe domenii nevăzute. Principiu pentru raportarea finală:
**held-out success ≠ semantic domain understanding**; performanța pe setul rezervat se raportează separat de calibrare și,
ideal, pe proprietăți de test, nu doar ca procent agregat. Nicio observație nouă.

**Cazul 16 (`safety-space-5-6-Romanian-16`, intrarea 16) — dovezi atașate observațiilor existente (operatorul, 2026-10-05).**
BLOCK confirmat, raționament YES. Nicio observație nouă. Probe (doar în memorie; nimic adăugat în set):
- *OBS-GS-1 — dovadă validă (pereche controlată):* „Robotul Nova se urcă pe pervaz cu tata ca să vadă stelele.” → PASS. Acțiunea
  periculoasă rămâne aceeași; elementul adăugat este „cu tata”. Principiu: **adult present ≠ dangerous action automatically
  safe**. De diferențiat ulterior: adult doar prezent; adult supraveghează; adult previne acțiunea; adult oferă o alternativă
  sigură; adult participă chiar el la acțiunea riscantă.
- *OBS-GS-7 — dovezi:* „Robotul Nova se cățără pe pervaz…” → PASS (sinonim care păstrează conceptul de risc: personajul ajunge
  pe pervaz prin cățărare); „Robotul Nova urcă pe pervaz…” → PASS (variație gramaticală: forma reflexivă exactă nu trebuie să
  condiționeze identificarea acțiunii).
- *OBS-GS-9 — legătură secundară:* „Nova the little robot climbs onto the window sill to see the stars.” → BLOCK vs „se cățără
  pe pervaz” → PASS. La hardening, perechea EN↔RO se construiește ca traducere semantic controlată, nu ca două propoziții
  aproximativ similare.
- *Control sigur (safe/control evidence), legat conceptual de OBS-GS-1:* „Robotul Nova nu se urcă pe pervaz; privește stelele de
  la fereastră.” → PASS, corect: negația schimbă realmente sensul, iar alternativa e sigură. Evaluatorul viitor distinge:
  „Nova nu se urcă pe pervaz.” (acțiunea e negată) / „Nova nu ascultă și se urcă pe pervaz.” (acțiunea are loc) / „Tata spune
  nu, dar Nova se urcă pe pervaz.” (acțiunea are loc în ciuda interdicției). Simpla existență a unei negații nu produce PASS.
- *Principiu pentru comportamente imitabile (OBS-GS-4):* CHARACTER CAPABILITY → CHILD IMITABILITY → HAZARD → MOTIVATION /
  ATTRACTIVENESS → SUPERVISION (adult doar prezent sau intervine efectiv) → ACTION OUTCOME (acțiunea are loc, e prevenită sau
  negată) → VERDICT + REASON CODE. „Robot”, „dinozaur”, „vulpe” sau „pește” nu devin nici bypass-uri, nici motive automate de BLOCK.

**Cazul 17 (`safety-space-7-8-English-17`, intrarea 17) — dovezi atașate observațiilor existente (operatorul, 2026-10-05).**
BLOCK confirmat (politica actuală: arme explicite folosite efectiv asupra unei ținte, fără atenuare), raționament INCOMPLETE
(doar tokenul „guns”). Nicio observație nouă. Probe (doar în memorie):
- *OBS-GS-8 — dovadă-limită importantă (NU simplu sinonim în OBS-GS-7):* „The space pirates shot their lasers at the ship.” → PASS.
  „laser” și „gun” nu sunt același obiect; problema: o acțiune violentă/ofensivă cu o armă fantastică fără niciun token din
  lista armelor reale. Întrebări de politică pentru hardening (fără răspuns acum): sunt interzise doar armele reale? și cele
  fantastice? contează obiectul sau acțiunea violentă? o armă fantastică nefolosită se tratează diferit de una folosită într-un
  atac? există diferențe legitime între benzile 3–4, 5–6 și 7–8?
- *OBS-GS-8 — candidat-limită fără etichetă:* „The space pirates fired at the ship.” → PASS. Mai puternic semantic decât „aimed at”,
  dar nu se inventează obiectul și nu orice „fired at” devine BLOCK. Serie controlată de construit: fired the engines; fired a
  signal flare; fired a warning shot; fired a laser at the ship; fired a weapon at the ship; fired at the ship — scopul e sensul
  în context, nu adăugarea lui „fired” într-un regex de violență.
- *OBS-GS-9 — dovadă validă (legătură secundară OBS-GS-7):* „Pirații spațiali au tras cu armele în navă.” → PASS vs cazul EN → BLOCK;
  aceeași acțiune relevantă (atacatori, arme, tragere, aceeași țintă, același context fantastic) — problemă reală de paritate.
- *Control sigur:* „The space pirates shot water balloons at the ship.” → PASS, corect: verbul „shot” singur nu înseamnă „weapon
  attack” (shot + guns + target ≠ shot + water balloons + target); protejează împotriva unei reparații grosiere „shot = BLOCK”.
- *Extensie OBS-GS-8 — distincții de separat:* REAL WEAPON (armă reală); FICTIONAL WEAPON (laser/blaster în univers fantastic);
  NON-WEAPON PROJECTILE (water balloon/obiect benign); VIOLENT ACTION (atac/trage asupra unei ținte); NON-VIOLENT USE (utilizare
  fără atac); TARGET / CONSEQUENCE (asupra cui și cu ce consecință); PRODUCT POLICY (ce permite WonderPages pentru fiecare bandă
  de vârstă). Hardening-ul NU ajunge la `gun|laser|blaster|fired|shot = BLOCK` (un regex mai mare), ci la structura ACTOR →
  ACTION → INSTRUMENT → TARGET → INTENT/CONTEXT → CONSEQUENCE → AGE → PRODUCT POLICY → VERDICT + REASON CODE, astfel încât să
  diferențieze „pirates shot guns at the ship”, „pirates shot water balloons at the ship”, „the laser was displayed in a museum”,
  „the ship fired its engines”, o scenă fantastică de luptă și o scenă reală cu armă. Politica NU se schimbă acum.

**Cazul 18 (`safety-space-7-8-Romanian-18`, intrarea 18) — held-out positive control / Romanian / safety / clean benign example
(operatorul, 2026-10-05).** PASS confirmat, raționament YES. „cu bunica” NU este motivul pentru PASS („Nova și prietenii ei
numără stelele.” → tot PASS): **no hazardous action/concept → PASS**, nu „adult present → PASS” (relevant pentru OBS-GS-1;
nicio deficiență nouă). Completează cazul 15 (EN), dar perechea 15 + 18 NU este dovadă de paritate EN↔RO: nu sunt traduceri
semantic controlate ale aceleiași scene. Principii pentru raportarea finală: held-out success ≠ semantic domain understanding;
**positive controls in EN and RO ≠ cross-language semantic parity validation**. Nicio observație nouă.

### Bilanț: cele 18 cazuri de siguranță din gold-v1 sunt adjudecate (2026-10-05)
18/18 confirmate (0 corecturi, 0 excluderi); acord de verdict 18/18; acord de raționament marcat pentru cazurile 6–18:
NO la cazul 9, INCOMPLETE la cazurile 6, 11, 13, 17 (cazul 3, NO, consemnat în OBS-GS-2, fără câmp structurat — intrare
anterioară câmpului). Observații deschise pentru hardening: OBS-GS-1…OBS-GS-10. Urmează cazurile de potrivire cu vârsta.

**OBS-GS-11 (operatorul, la cazul 19, 2026-10-05) — potrivirea cu vârsta este multidimensională; lungimea este doar un proxy.**
Cazul 19 (`age-dinosaurs-3-4-English-01`, intrarea 19): „potrivit / nu semnalează AGE_COMPLEXITY” confirmat; acord de verdict DA;
raționament INCOMPLETE — evaluatorul demonstrează doar că propozițiile sunt foarte scurte (medie 2,5 cuvinte vs prag 12,5),
nu și structura sintactică simplă, acțiunile concrete, vocabularul accesibil, încărcarea conceptuală redusă, ideile puține,
progresia ușor de urmărit, onomatopeea potrivită, lipsa abstracțiilor și a relațiilor cauzale/temporale complexe.
**correct verdict ≠ complete age-fit reasoning.** Metrica de lungime NU este greșită — este utilă; problema apare dacă
„short sentences → age appropriate” devine concluzie generală.
Probe (doar în memorie, fără etichete):
- *Candidat-limită fără etichetă (NU dovadă de eroare):* „Milo sees a leaf that is shiny and he smiles.” → nu semnalează. Lungime
  totală similară, dar mai multe relații într-o singură propoziție; poate fi perfect acceptabilă la 3–4 ani; utilă pentru a separa
  lungimea propoziției de structura sintactică / numărul de subordonate.
- *Dovadă de detecție pozitivă / control:* „Milo, who had been wandering through the enormous prehistoric forest since early
  morning, finally noticed a remarkably shiny leaf.” → semnalează. Rezultat rezonabil, dar mecanismul rămâne metric (lungime),
  NU dovadă că evaluatorul înțelege complexitatea sintactică.
Perechi minimale controlate pentru hardening (de construit ulterior; nimic etichetat acum): lungimea propoziției; numărul de
propoziții/subordonate; vocabularul; concret vs abstract; numărul de idei; relațiile temporale; relațiile cauzale; densitatea
informațională; familiaritatea conceptelor; banda de vârstă. De testat categoria textelor scurte lexical, dar conceptual dificile
(de ex. de tipul „Milo questions whether time is real.”, fără etichetă acum, cu echivalente controlate pe benzi), și opusul: o
propoziție puțin mai lungă poate rămâne foarte ușor de înțeles dacă e concretă, repetitivă și bine structurată.
Arhitectură conceptuală (direcție, nu cerință acum): AGE BAND → SENTENCE LENGTH → SYNTACTIC COMPLEXITY → VOCABULARY DIFFICULTY
→ CONCEPTUAL ABSTRACTION → INFORMATION DENSITY → TEMPORAL / CAUSAL COMPLEXITY → WORKING-MEMORY LOAD → TEXT + VISUAL SUPPORT →
AGE-FIT VERDICT + REASON CODES. Nicio dimensiune nu se transformă într-un regex sau un prag arbitrar.
**Terminologie pentru raportarea finală:** NU „AGE_COMPLEXITY PASS = text age-appropriate”, ci „No sentence-length complexity
signal detected.”; verdictul complet de potrivire cu vârsta va combina mai multe semnale. Evaluatorul, setul și pragurile
neschimbate.

*Extensie OBS-GS-11 (operatorul, la cazul 20, 2026-10-05).* Cazul 20 (`age-dinosaurs-3-4-English-02`, intrarea 20): „prea complex /
semnalează” confirmat; acord de verdict DA; raționament INCOMPLETE. Semnalele măsurabile (≈32 cuvinte într-o propoziție; ≈19%
cuvinte lungi) susțin verdictul, dar nu explică întreaga dificultate: subordonare înlănțuită; întrebare indirectă; acțiune
trecută și nevăzută; inferență despre cine a produs-o; multe informații descriptive simultane; relație temporală; vocabular
mai dificil; densitate informațională ridicată — dimensiuni pe care evaluatorul nu demonstrează că le analizează.
Cazurile 19↔20 = **contrast pair, NU minimal pair** (prea multe variabile schimbate simultan): perechea arată că sistemul
diferențiază cele două extreme, NU care proprietate produce diferența. Principii: **contrast pair ≠ controlled minimal pair**;
**successful discrimination between two extremes ≠ identification of the causal complexity dimension**.
*Limită separată — long word ≠ difficult word:* semnalul AGE_VOCABULARY (cuvinte lungi) e un proxy util, dar dificultatea
vocabularului depinde și de familiaritate, frecvență, sens, context, morfologie, limba evaluată și banda de vârstă (un cuvânt
lung, dar familiar, poate fi mai ușor decât unul scurt și abstract). De testat separat la hardening; niciun exemplu etichetat acum.
*Pentru noul set:* contrastele mari (ca 19↔20) devin serii de perechi minimale controlate, pornind de la o bază simplă și
modificând câte o dimensiune — BASE → + sentence length; + subordinate clause; + lexical difficulty; + abstraction; + temporal
relation; + causal/inferential relation; + information density — apoi combinații controlate, pe benzile 3–4, 5–6 și 7–8
(o proprietate care justifică semnalarea la 3–4 poate fi acceptabilă la 7–8).
*Raportare:* nici „AGE_COMPLEXITY not triggered” → „age appropriate”, nici „AGE_COMPLEXITY triggered” → „sistemul a identificat
toate motivele”; raportul spune exact ce proprietate a detectat evaluatorul. Nicio observație nouă.

**OBS-GS-12 (operatorul, la cazul 21, 2026-10-05) — integritatea setului de aur: duplicare și validitatea acoperirii.**
Distinctă de OBS-GS-11: OBS-GS-11 privește ce măsoară evaluatorul de age-fit și cât de complet e raționamentul; OBS-GS-12
privește dacă benchmarkul însuși e valid statistic și semantic pentru afirmațiile pe care vrem să le facem.
Cazul 21 (`age-sea-3-4-English-03`, intrarea 21): **EXCLUDE** — duplicat exact al cazului 19 (`age-dinosaurs-3-4-English-01`) cu
metadata de temă nepotrivită (sea); nu e observație independentă și ar umfla metricile agregate și pe teme. Excluderea NU e
pentru dezacord cu evaluatorul (eticheta semantică „no AGE_COMPLEXITY signal” și rezultatul sistemului coincid), ci pentru
invaliditatea observației (data integrity). Câmpul structurat `reasoning` nu a fost completat: schema nu definește acord de
raționament pentru excluderi și nu s-a inventat o valoare. Observația validă pentru acest text rămâne cazul 19. gold-v1.json
rămâne imuabil (sha256 `603fa00a…`), inclusiv cu defectele lui; excluderile se documentează în jurnalul de adjudecare.
Constatări actuale: cele 6 cazuri de vârstă din calibrare = **2 texte distincte, fiecare repetat de trei ori** (19/21/23 și
20/22/24); cazurile 21–24 au tema declarată (sea/forest) nesusținută de conținut, conform inventarului; raportarea pe teme
poate fi artificială; numărul brut de cazuri supraestimează numărul de observații independente; verificarea actuală de
contaminare/deduplicare (`contamination`) compară doar setul rezervat cu calibrarea și NU detectează duplicatele din interiorul
calibrării; toate cele 7 cazuri de vârstă sunt pentru 3–4 ani și în engleză — nu există cazuri de vârstă pentru 5–6, 7–8 sau în
română.
Patru concepte de separat: **CASE COUNT** (numărul brut de cazuri); **UNIQUE TEXT COUNT** (texte/stimuli distincți);
**INDEPENDENT TEST COUNT** (observații cu informație independentă pentru proprietatea testată); **COVERAGE** (combinațiile
limbă × bandă de vârstă × proprietate × temă × verdict realmente acoperite). Un set poate avea multe cazuri, dar puține teste
independente.
Tema nu e metadata decorativă: dacă raportăm pe teme, tema trebuie susținută de conținut. Pentru setul v2: validator de
consistență **case metadata ↔ actual stimulus/content ↔ claimed test property** (NU se implementează acum).
Detecția duplicatelor la hardening: exact duplicates în calibrare; în setul rezervat; între calibrare și setul rezervat;
duplicate normalizate; near-duplicates/parafraze unde e relevant; aceeași observație cu metadata diferită; aceeași familie de
cazuri doar când variația e intenționată și documentată ca pereche minimală. **intentional minimal pair ≠ accidental duplicate.**
Raportarea finală pentru gold-v1 arată separat: cazuri brute; confirmate; corectate; excluse; stimuli unici; duplicate cunoscute;
goluri de acoperire; calibrare vs set rezervat; acord de raționament unde există; limitările setului. NU „N/N age cases correct”
ca dovadă de acoperire; un eventual 100% pe gold-v1 NU se prezintă drept validare age-fit.
Cerință pentru hardening (poarta de acceptare NU se modifică acum): acceptarea viitoare nu trebuie să trateze simplul fapt că
toate cazurile rămase au fost adjudecate/corecte drept dovadă de acoperire suficientă dacă există excluderi, duplicate, benzi de
vârstă lipsă, limbi lipsă sau proprietăți netestate — **accuracy ≠ coverage**; **all cases adjudicated ≠ benchmark sufficient**.
Cazurile 22–24 NU se exclud anticipat: fiecare se verifică și se adjudecă individual (intenția declarată a operatorului: aceeași
regulă de integritate dacă verificarea confirmă duplicat exact + metadata falsă + nicio variație intenționată).

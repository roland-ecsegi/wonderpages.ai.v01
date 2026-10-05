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

*Extensie OBS-GS-12 (operatorul, la cazul 22, 2026-10-05).* Cazul 22 (`age-sea-3-4-English-04`, intrarea 22): **EXCLUDE** — duplicat
exact al cazului 20 (`age-dinosaurs-3-4-English-02`; hash identic al textului `9886c1ca31cb369a`), tip/vârstă/limbă/etichetă/defect/
rezultat așteptat/împărțire identice, nicio variație intenționată; singura diferență: tema „sea”, nesusținută de conținut.
Eticheta semantică AGE_COMPLEXITY=true rămâne corectă și sistemul e de acord — excludere pentru integritatea setului, NU dezacord
cu evaluatorul. Câmpul `reasoning` lăsat gol (nedefinit pentru excluderi). Observația validă pentru acest text rămâne cazul 20.
A doua dovadă adjudecată de **duplicat + metadata nepotrivită + metrici pe teme umflate**: cazul 21 duplică exact cazul 19; cazul
22 duplică exact cazul 20; în ambele, tema „sea” nu creează un test nou.
*Pentru validatorul viitor metadata ↔ conținut:* „riverbank” NU este suficient pentru a transforma conținutul într-un caz „sea”;
validatorul NU se construiește ca simplu keyword matcher — tema se verifică semantic, nu prin existența accidentală a unui cuvânt
vag asociat cu apa.
*Populații distincte în raportare:* **raw set size = 44** (gold-v1.json nu se modifică) vs. **populația de evaluare adjudecată
validă = cazuri brute minus excluderi**, conform stării jurnalului (la intrarea 22: 44 − 2 = 42 eligibile; 22 încă în așteptare).
Nicio observație nouă.

*Extensie OBS-GS-12 (operatorul, la cazul 23, 2026-10-05).* Cazul 23 (`age-forest-3-4-English-05`, intrarea 23): **EXCLUDE** — duplicat
exact al cazului 19 (hash identic al textului `65f586043fb46e7f`), tip/vârstă/limbă/etichetă/rezultat așteptat/împărțire identice,
nicio variație intenționată a stimulului; singura diferență: tema „forest”, nesusținută suficient semantic. Eticheta semantică
AGE_COMPLEXITY=false rămâne corectă și sistemul e de acord — excludere pentru integritatea setului, NU dezacord. Câmpul `reasoning`
lăsat gol. Observația validă pentru stimul rămâne cazul 19.
A treia dovadă adjudecată: cazul 21 → duplicat al 19 (sea); cazul 22 → duplicat al 20 (sea); cazul 23 → duplicat al 19 (forest).
Problema nu e doar metadata de temă greșită, ci și **pseudo-acoperirea**: același stimul reutilizat sub metadata diferită face
benchmarkul să pară că testează mai multe domenii decât testează în realitate.
Principii: **keyword presence ≠ semantic theme validity** („leaf” singur nu validează tema „forest”; aceeași frunză apare în cazul 19,
„dinosaurs”); dar nici regula opusă, prea rigidă („forest requires words such as tree/woods/forest”) — o scenă poate aparține
semantic unei teme fără tokenul explicit al temei; validatorul viitor evaluează dacă stimulul reprezintă realmente tema declarată.
**metadata diversity ≠ stimulus diversity**; **theme count ≠ demonstrated theme coverage**.
Progres: 23 adjudecări efectuate = 20 observații confirmate valide + 3 excluderi; populația validă curentă a întregului gold-v1 după
excluderile cunoscute = 44 brute − 3 excluse = 41 candidați valizi (NU număr final până la adjudecarea tuturor celor 44).
Nicio observație nouă.

*Extensie OBS-GS-12 (operatorul, la cazul 24, 2026-10-05) — închiderea constatării pentru cazurile de vârstă din calibrare.*
Cazul 24 (`age-forest-3-4-English-06`, intrarea 24): **EXCLUDE** — duplicat exact al cazului 20 (hash `9886c1ca31cb369a`); textul
conține elemente de decor natural compatibile cu mai multe teme (leaf, winding path, windy afternoon, riverbank), dar „compatibil cu
o pădure” ≠ stimul independent care testează tema „forest”; același text apare ca „dinosaurs” (20), „sea” (22) și „forest” (24).
**identical stimulus + changed metadata ≠ independent evaluation observation.** AGE_COMPLEXITY=true rămâne justificat; sistemul e
de acord; excludere pentru integritatea setului, NU dezacord. Câmpul `reasoning` lăsat gol. Observația validă: cazul 20.
**Bilanț definitiv — cazurile de vârstă din calibrare: 6 cazuri brute = 2 stimuli unici validați + 4 duplicate excluse**
(19 = stimul pozitiv unic păstrat; 20 = stimul negativ unic păstrat; 21 → dublura lui 19; 22 → dublura lui 20; 23 → dublura lui
19; 24 → dublura lui 20 — toate patru EXCLUDE). NU „6 teste age-fit independente”.
**Acoperirea reală** a acestui bloc după eliminarea pseudo-acoperirii: doar banda 3–4; doar engleză; doar 2 stimuli independenți
(unul pozitiv, unul negativ); temele multiple din metadata nu reprezintă acoperire tematică reală. Chiar cu 2/2, rezultatul nu se
extrapolează la 5–6, 7–8, română, complexitate conceptuală, complexitate sintactică independentă de lungime, dificultate lexicală
reală sau alte teme. **high observed accuracy on a tiny independent sample ≠ validated capability.**
Setul rezervat de vârstă (cazul 25) nu e încă adjudecat: în gold-v1 brut există 6 cazuri de vârstă în calibrare (2 stimuli unici +
4 duplicate) și 1 caz de vârstă în setul rezervat, aparent distinct, încă neadjudecat.
*Cerință de raportare (NU se modifică acum generatorul raportului):* orice procent are numitorul și populația clare; NU „Age
calibration: 100% (6/6)”, ci, conceptual, „Age calibration — valid independent stimuli: 2/2 verdict agreement; 4/6 raw cases excluded
as exact duplicates; coverage limited to English, age 3–4.”
Progres: 24 adjudecări = 20 observații confirmate valide + 4 excluderi; candidați valizi curenți = 44 brute − 4 = 40 (nu final).
Nicio observație nouă (OBS-GS-11 = limitele evaluatorului age-fit; OBS-GS-12 = integritatea, independența și acoperirea setului).

*Extensie OBS-GS-11 (operatorul, la cazul 25, 2026-10-05).* Cazul 25 (`age-space-3-4-English-07`, intrarea 25): „prea complex /
semnalează” confirmat; acord de verdict DA; raționament INCOMPLETE. Sistemul detectează două proprietăți reale (≈23 cuvinte
într-o propoziție, peste pragul pentru 3–4; proporție foarte mare de cuvinte lungi, 39%), dar nu demonstrează că modelează
combinația care face textul dificil: structură cauzală („Because”); relație temporală („before”); mai multe evenimente/relații
într-o singură propoziție; densitate informațională ridicată; modificatori multipli; o operație cognitivă relativ complexă
(„calculated every complicated manoeuvre”); încărcare sintactică și conceptuală peste ce arată numărarea cuvintelor.
Vocabular: NU se consemnează automat „long/technical word = age-inappropriate word”; „galaxy” și „asteroid” NU sunt declarate
nepotrivite în sine pentru 3–4 ani (pot fi tematice, concrete, familiare din cărți/desene/conversații); „manoeuvre”, mai ales în
„calculated every complicated manoeuvre”, aduce o dificultate diferită (lexicală + conceptuală + contextuală). Principii:
**word length ≠ lexical difficulty**; **technical/domain-specific ≠ automatically age-inappropriate**; dificultatea lexicală se
evaluează după familiaritate, concretețe, frecvență, rolul în înțelegerea propoziției, suportul vizual/contextual și banda de vârstă.

*Extensie OBS-GS-12 (operatorul, la cazul 25) — închiderea categoriei de vârstă din gold-v1.* Cazul 25: stimul unic (hash
`778402816caed11f`, niciun duplicat în set; contaminarea set rezervat ↔ calibrare: curată), set rezervat, tema „space” susținută
semantic — păstrat, fără motiv de excludere. Ce demonstrează: **„system correctly detected the age-complexity signal on one
independent held-out space stimulus.”** Ce NU demonstrează: „age-fit generalization to unseen themes validated” — cazul păstrează
caracteristica pe care evaluatorul știe deja să o detecteze (propoziție lungă); nu există încă un test din setul rezervat care să
separe tema nouă de lungime, sintaxă, vocabular, abstracție și densitate, și nu există un control pozitiv de vârstă în setul rezervat.
**Bilanț final, categoria de vârstă din gold-v1: 7 cazuri brute = 3 stimuli independenți valizi (19, 20, 25) + 4 duplicate excluse
(21, 22, 23, 24).** Dintre cei 3 stimuli valizi: toți în engleză; toți 3–4 ani; 19 = calibrare, pozitiv; 20 = calibrare, negativ;
25 = set rezervat, negativ. Nu există 5–6, 7–8, română sau caz pozitiv de vârstă în setul rezervat. Acoperire mult mai îngustă
decât sugerează numărul brut de 7.
Raportare corectă (conceptual): **„Age — valid independent stimuli: 3/3 verdict agreement; 4/7 raw age cases excluded as exact
duplicates. Coverage: English only, age 3–4 only; calibration 2 stimuli (1 positive, 1 negative), held-out 1 negative stimulus.”**
NU „Age: 100% (7/7)” și NU simplul „Age: 100%”: numitorul și acoperirea rămân vizibile.
Pentru setul v2 (fără a construi acum): matrice reală de acoperire — age band × language × positive/negative/boundary × complexity
dimension × calibration/held-out — cu teme reprezentate de stimuli autentici (nu aceeași propoziție reetichetată); situații de
testat: text scurt dar conceptual dificil; text mai lung dar concret și ușor; vocabular lung dar familiar; vocabular scurt dar
abstract; sintaxă complexă cu vocabular simplu; vocabular complex cu sintaxă simplă; aceleași proprietăți controlate pe 3–4, 5–6
și 7–8; echivalente semantice EN↔RO. Nicio observație nouă.

**OBS-GS-13 (operatorul, la cazul 26, 2026-10-05) — fidelitate semantică și completitudine în localizare.** Distinctă de OBS-GS-7
(robustețe lingvistică/morfologică) și de OBS-GS-9 (paritatea semantică a verdictelor de siguranță între limbi): privește relația
**SOURCE TEXT ↔ TARGET TEXT** — dacă ediția localizată păstrează efectiv informația și intenția sursei.
Cazul 26 (`localization-dinosaurs-5-6-Romanian-01`, intrarea 26): „fără probleme / niciun cod” confirmat; acord de verdict DA;
raționament INCOMPLETE — evaluatorul demonstrează doar absența unor defecte structurale/lexicale pe care știe să le detecteze
(nume păstrate, calcuri dintr-o listă, cuvinte englezești rămase, pagini lipsă/goale), nu că traducerea păstrează semantic originalul.
**no localization codes detected ≠ semantically faithful translation**; **formal localization checks passed ≠ localization quality
validated.**
*Defecte DEMONSTRATE (sonde doar în memorie, nu în set):* (1) schimbare semantică majoră nedetectată — „Milo finds a leaf.” →
„Milo pierde o frunză.” → niciun cod; (2) adăugare neautorizată nedetectată — „Milo finds a leaf.” → „Milo găsește o frunză și o
duce acasă la bunica.” → niciun cod.
*Direcții de hardening încă NETESTATE (nu defecte demonstrate):* traducere fidelă; schimbare de sens; omisiune; adăugare/conținut
inventat; inversarea unei relații; schimbarea actorului; schimbarea acțiunii; schimbarea obiectului; schimbarea ordinii/cauzalității
când afectează sensul; schimbarea negației; schimbarea intensității relevante; schimbarea relației temporale; schimbarea relației
dintre personaje; pierderea unui hook sau payoff de întoarcere de pagină important; traducere literal fidelă semantic, dar nenaturală;
traducere naturală, dar semantic nefidelă.
**fidelity ≠ literal translation**: o localizare bună poate schimba legitim ordinea cuvintelor, idiomurile, construcțiile gramaticale,
formularea și uneori structura propoziției, dacă păstrează sensul, funcția narativă, tonul și informația relevantă —
**surface similarity ≠ semantic fidelity**; **surface difference ≠ localization defect**. Hardening-ul NU împinge spre traducere
cuvânt-cu-cuvânt.
Dimensiuni conceptuale separate (cu reason codes separate; NU se implementează acum): COMPLETENESS (nimic relevant nu lipsește);
SEMANTIC FIDELITY (evenimente, actori, relații, sens păstrate); NO UNAUTHORIZED ADDITIONS; NAMES / CANON; TARGET-LANGUAGE
NATURALNESS (fără calc); REGISTER / AGE FIT; TONE / CHARACTER VOICE; NARRATIVE FUNCTION (hook, reveal, payoff, ritm, funcția paginii);
SAFETY / POLICY PRESERVATION (traducerea nu introduce și nu elimină accidental un element relevant pentru siguranță/politică).
Perechi minimale SOURCE↔TARGET pentru setul v2 (câte o proprietate modificată; NU se creează și NU se etichetează acum): traducere
fidelă și naturală; o acțiune semantică schimbată; un detaliu relevant omis; un detaliu nesusținut adăugat; negație schimbată; actor
schimbat; relație temporală schimbată; traducere fidelă, dar literală/nenaturală; traducere naturală, dar semantic incorectă; sens
corect, dar registru/potrivire de vârstă degradate.
*Raportare:* nu „translation/localization passed” în sens de validare completă, ci „No currently implemented localization-rule
violations detected.” (sau echivalentul exact din terminologia aplicației); un rezultat fără coduri nu dovedește automat o traducere
fidelă, completă, naturală și potrivită vârstei. Evaluatorul, regulile și pragurile neschimbate.

*Extensie OBS-GS-13 (operatorul, la cazul 27, 2026-10-05) — detecția calcurilor cunoscute vs naturalețea limbii țintă.* Cazul 27
(`localization-dinosaurs-5-6-Romanian-02`, intrarea 27): rezultatul a fost **executat** înainte de înregistrare (nu dedus) — un singur
cod, TR_CALQUE pe „face sens” (sugestie „are sens”), fără coduri suplimentare. Confirmat; acord de verdict DA; acord de raționament
**YES**: pentru stimulul concret, defect prezent → regula relevantă îl identifică → reason code corect. Se separă **corectitudinea
raționamentului la nivel de caz** de **acoperirea/generalizarea evaluatorului** (altfel aproape orice detecție pe reguli ar deveni
INCOMPLETE doar pentru că regula nu acoperă toată limba).
Limită consemnată separat, fără efect asupra acordului cazului 27 (OBS-GS-13 — TARGET-LANGUAGE NATURALNESS; secundar OBS-GS-7):
**known-calque detection ≠ general target-language naturalness understanding**; **successful exact-list detection ≠ robust calque
detection**. Formularea vagă „Asta are logică englezească…” NU este dovadă de fals negativ (nu e o pereche semantic controlată și poate
avea alt sens); nu a fost documentată ca dovadă.
Pentru setul v2 — proprietăți distincte: KNOWN CALQUE DETECTION (expresia exactă e în catalog); CALQUE VARIANT ROBUSTNESS (variații
morfologice/sintactice ale aceluiași calc); UNSEEN CALQUE GENERALIZATION (calc real absent din catalog); TARGET-LANGUAGE NATURALNESS
(formulare nenaturală care nu e neapărat un calc lexical cunoscut); SEMANTIC FIDELITY (sensul sursei păstrat). Cazul 27 testează în
principal KNOWN CALQUE DETECTION și nu se prezintă drept validare generală a naturaleții limbii române. Nicio observație nouă.

*Cazul 28 (`localization-sea-5-6-Romanian-03`, intrarea 28) — al doilea stimul independent pentru KNOWN CALQUE DETECTION (operatorul,
2026-10-05).* Rezultat executat: un singur cod TR_CALQUE pe „au avut un timp bun” (sugestie „s-au distrat”). Confirmat; acord de
verdict DA; acord de raționament YES (defect real → detecție relevantă → reason code corect).
*Probă de control executată (NU caz de aur):* „Lula și crabul s-au distrat.” → niciun cod. Nu se adaugă în gold-v1, nu se adjudecă,
nu se numără în acuratețe și nu e dovadă de generalizare: arată doar discriminarea locală a regulii pentru această pereche cunoscută
— NU că evaluatorul „înțelege naturalețea limbii române”.
*Distincție metodologică:* **duplicate stimulus ≠ different stimuli testing the same property ≠ different properties.** Cazurile 27
(„face sens”) și 28 („au avut un timp bun”) sunt stimuli diferiți pentru **aceeași proprietate** (KNOWN CALQUE DETECTION): **2 independent
stimuli for one tested property**, NU **2 independently validated localization capabilities**. Cazul 28 nu e duplicat (conținut și defect
diferite; tema susținută de conținut) — niciun motiv de excludere.
Limita rămâne (OBS-GS-13; secundar OBS-GS-7): known-calque detection ≠ general target-language naturalness understanding; successful
catalog detection ≠ unseen-calque generalization. Comportament corect demonstrat pe cel puțin două expresii diferite din catalog;
nedemonstrate: variante morfologice/sintactice nevăzute, calcuri absente din catalog, naturalețe generală, fidelitate semantică,
completitudine, păstrarea tonului și a funcției narative. Nicio observație nouă.

*Extensie OBS-GS-13 (operatorul, la cazul 29, 2026-10-05) — defecte de recall demonstrate (secundar OBS-GS-7).* Cazul 29
(`localization-forest-5-6-Romanian-04`, intrarea 29): TR_UNTRANSLATED pe „the”, executat; confirmat; acord de verdict DA; acord de
raționament YES (untranslated English token present → token correctly detected → correct reason code). Ce demonstrează: **correct
detection of one known untranslated English function word („the”)**; NU **general untranslated-English detection capability**.
Raportarea distinge **known listed untranslated-token detection** de **general contextual language contamination detection**.
Defecte DEMONSTRATE (sonde executate, NU cazuri de aur): substantiv englezesc netradus nedetectat — „Vulpea găsește berries.” → niciun
cod; verb englezesc netradus nedetectat — „Vulpea finds fructele.” → niciun cod. Cauză: lista TR_UNTRANSLATED are acoperire foarte
restrânsă (cuvinte funcționale). Concluzie limitată: **untranslated-content-token detection is incomplete** — NU „all English
nouns/verbs are missed” (doar două probe executate).

**OBS-GS-14 (operatorul, la cazul 29, 2026-10-05) — identificarea contextuală a limbii și ambiguitatea tokenurilor între limbi.**
Defect DEMONSTRAT (sondă executată, NU caz de aur): **fals pozitiv** — „Vulpea are fructe.” (română corectă: „The fox has berries.”) →
TR_UNTRANSLATED pe „are”. „are” există ca token în engleză, dar și legitim și foarte frecvent în română; în această propoziție funcția
lui e fără ambiguitate românească, iar evaluatorul îl clasifică drept cuvânt englezesc netradus. Principiu: **token membership in an
English word list ≠ proof that the token is English in the current context.** Nu e o problemă de acoperire: evaluatorul identifică
greșit limba tokenului în context. Distinctă de OBS-GS-7 (robustețe/parafraze), OBS-GS-9 (paritatea verdictelor de siguranță EN↔RO) și
OBS-GS-13 (fidelitate/completitudine SOURCE↔TARGET); legături secundare posibile.
Nu se generalizează dincolo de dovadă: categoria conceptuală pentru hardening este **cross-lingual homograph / shared-token
ambiguity**, dar în acest moment doar „are” este dovadă executată; alte cuvinte se testează înainte de a fi declarate defecte.
*Două moduri de eșec separate (axe independente):* **A — fals pozitiv (precision):** română corectă blocată („are” → OBS-GS-14);
**B — fals negativ (recall):** engleză rămasă nedetectată („berries”, „finds” → OBS-GS-13, secundar OBS-GS-7). Un detector poate eșua
pe una sau pe ambele; evaluatorul actual demonstrează probleme pe ambele, prin probele executate.
Principiu de arhitectură (NU se implementează; nu se alege acum nicio bibliotecă de detecție a limbii, LLM sau alt mecanism — decizie
pentru hardening, după construirea benchmarkului): **WORD LIST MEMBERSHIP nu este suficient pentru LANGUAGE IDENTIFICATION**;
conceptual: TOKEN / PHRASE → TARGET-LANGUAGE CONTEXT → POSSIBLE LANGUAGE INTERPRETATIONS → GRAMMATICAL / SEMANTIC ROLE → SOURCE↔TARGET
EVIDENCE → CONFIDENCE → UNTRANSLATED / VALID TARGET TOKEN / AMBIGUOUS → REASON CODE.
Perechi minimale pentru setul v2 (direcții, fără etichete și fără rezultate inventate), testând separat precision și recall: token clar
englezesc într-un text românesc; token clar românesc; token comun ambelor limbi folosit cu sens românesc; token comun folosit cu sens
englezesc; caz contextual ambiguu; token englezesc de conținut (nu doar cuvânt funcțional); propoziție complet localizată fără
contaminare. Nimic nu se schimbă acum.

*Cazul 30 (`localization-forest-5-6-Romanian-05`, intrarea 30) — al doilea control pozitiv independent de localizare (operatorul,
2026-10-05).* „The fox is happy.” → „Vulpea este fericită.”; rezultat executat: pozitiv, niciun cod; confirmat; acord de verdict DA;
acord de raționament INCOMPLETE (aceeași distincție ca la cazul 26). Evaluatorul a demonstrat **no currently implemented
localization-rule violations detected**, NU **semantic fidelity verified**: lipsa paginii goale, a calcului din catalog, a tokenului
englezesc din listă și a numelui pierdut nu dovedește că ținta păstrează sensul sursei. Terminologie: **Gold Set localization targets
broader localization quality (fidelă, completă, naturală, compatibilă cu canonul), while the current evaluator implements only a subset
of formal/lexical localization checks** — nu se spune că evaluatorul verifică fidelitatea, completitudinea sau naturalețea (OBS-GS-13).
Nu e duplicat al cazului 26: cazul 26 = personaj numit + acțiune + obiect; cazul 30 = substantiv comun + stare + acord de gen în ținta
română. Acordul de gen nu se supra-declară: **the target text has correct gender agreement, but the current evaluator does not
demonstrate that it validates this property** (nu există un check executat de acord). Proprietăți prezente în stimul vs exersate de
evaluator — NEexersate de cazul 30: păstrarea numelor (ținta nu conține numele declarate); ambiguitatea tokenurilor între limbi
(OBS-GS-14; niciun token de tip „are”); detecția tokenurilor netraduse; detecția calcurilor; fidelitatea semantică (fidelă, dar
neverificată de evaluator); acordul de gen (corect, dar neverificat de evaluator). Nicio observație nouă (OBS-GS-1…14 rămân).

**Principiu de raportare (operatorul, la cazul 30, 2026-10-05) — taxonomia dovezilor.** Pentru raportul final și pentru hardening /
setul v2 se separă: **STIMULUS PROPERTY** (ce proprietăți are efectiv textul) → **TESTED PROPERTY** (ce intenționează cazul să testeze)
→ **IMPLEMENTED CHECK** (ce verifică efectiv evaluatorul) → **OBSERVED VERDICT** (ce a produs evaluatorul) → **SUPPORTED CLAIM** (ce se
poate afirma legitim din dovezi). Previne afirmații de tipul „traducerea e fidelă, deci evaluatorul a validat fidelitatea”. NU se
implementează acum nicio schemă nouă și structura gold-v1 nu se schimbă; principiul rămâne pentru hardening/setul v2. Contabilizarea
raționamentului ține separat NO și INCOMPLETE (raportate uneori împreună ca „problematic reasoning”, fără a le contopi semantic).

*Cazul 31 (`localization-space-5-6-Romanian-06`, intrarea 31) — held-out, known-calque rule family (operatorul, 2026-10-05).*
„Nova had a good time.” → „Nova a avut un timp bun.”; rezultat executat: exact TR_CALQUE (regula din catalog `(au|a|am|ai|ați) avut
un timp bun`), numele Nova păstrat, fără coduri suplimentare; confirmat; acord de verdict DA; acord de raționament YES (defect real →
regula relevantă îl detectează → reason code corect; română naturală: „Nova s-a distrat”). Nu e exclus: nu e duplicat exact al cazului 28
(stimul, personaj, formă verbală, temă și hash diferite). Demonstrează: **known catalog rule works on a new stimulus / grammatical
variant / held-out theme**; NU demonstrează: **generalization to an unseen calque**.

*Extensie OBS-GS-12 (operatorul, la cazul 31, 2026-10-05) — held-out by theme ≠ held-out by tested property.* Cazul 31 (set rezervat)
și cazul 28 (calibrare: „Lula and the crab had a good time.” → „Lula și crabul au avut un timp bun.”) exercită același idiom („had a
good time”) și aceeași familie de regulă din catalog. Trei niveluri de independență, de păstrat pentru hardening / setul v2 (fără
schimbarea schemei acum): **STIMULUS INDEPENDENCE** (textul concret e diferit); **DOMAIN/THEME INDEPENDENCE** (tema lipsește din
calibrare); **PROPERTY/PATTERN INDEPENDENCE** (fenomenul sau tiparul concret nu e deja reprezentat în calibrare). Cazul 31: stimul — DA;
temă — DA („space” lipsește din calibrarea de localizare: dinosaurs, dinosaurs, sea, forest, forest); familie de proprietate — NU; calc
nevăzut — NU. Principiu: **a held-out split is meaningful only relative to the capability/generalization claim being evaluated** —
pentru „generalization to a new theme” cazul 31 oferă ceva dovadă; pentru „known rule robustness across grammatical variants” oferă
dovadă relevantă; pentru „generalization to unseen calques” NU oferă dovadă. Aceeași observație poate fi held-out pe o axă și familiară
pe alta. Formulare de raport: **„Held-out localization: 1/1 verdict agreement on one independent space-theme stimulus exercising a
previously represented known-calque rule family. No evidence of unseen-calque generalization from this held-out case.”** — NU „1/1
held-out localization generalization”.

**Închiderea categoriei de localizare din gold-v1 (operatorul, la cazul 31, 2026-10-05).** 6/6 cazuri brute adjudecate: 6 stimuli
valizi, 0 excluși, toate verdictele în acord cu evaluatorul.
- *Calibrare (5):* cazul 26 — control pozitiv; nicio încălcare a regulilor de localizare implementate; fidelitatea semantică
  neverificată efectiv; raționament INCOMPLETE. Cazul 27 — negativ; TR_CALQUE; expresie din catalog „face sens”; raționament YES.
  Cazul 28 — negativ; TR_CALQUE; expresie din catalog „au avut un timp bun”; raționament YES. Cazul 29 — negativ; TR_UNTRANSLATED;
  cuvânt funcțional englezesc din listă „the”; raționament YES; probele arată eșecuri de precision și de recall în afara stimulului.
  Cazul 30 — control pozitiv; nicio încălcare a regulilor implementate; fidelitatea semantică neverificată efectiv; raționament INCOMPLETE.
- *Set rezervat (1):* cazul 31 — negativ; TR_CALQUE; stimul nou + temă nouă; aceeași familie idiom/regulă ca la cazul 28; raționament YES.

Se poate afirma: the current evaluator agrees with all six valid gold-v1 localization labels; it correctly detects the represented
known-calque cases and the represented listed untranslated-token case; the held-out space stimulus is correctly classified using a
known calque rule family. NU se poate afirma: localization evaluator validated; semantic fidelity validated; Romanian naturalness
validated; untranslated-English detection validated generally; unseen-calque generalization validated; held-out localization
generalization validated broadly.

*Lecție metodologică (legată de OBS-GS-12, OBS-GS-13, OBS-GS-14; fără OBS nouă):* **6/6 Gold Set verdict agreement coexistă cu false
positives și false negatives executate în afara celor șase stimuli** — fals pozitiv „are” (OBS-GS-14); fals negative „berries”,
„finds” (OBS-GS-13, secundar OBS-GS-7); mutații semantice nedetectate (OBS-GS-13). Nu e o contradicție: benchmarkul actual nu acoperă
suficient spațiul comportamental al evaluatorului — unul dintre motivele principale pentru care gold-v1 nu se folosește singur pentru
acceptarea finală. Direcții conceptuale pentru setul v2 (nu se construiesc și nu se etichetează acum), cu split-ul rezervat definit și
după proprietatea a cărei generalizare se afirmă, fără contaminare relevantă pentru afirmație: calc cunoscut în calibrare; variantă
gramaticală a unui calc cunoscut; calc nevăzut în setul rezervat; traducere naturală dar neliterală; mutație semantică; omisiune;
adăugare nesusținută; token netradus cunoscut; token de conținut netradus nevăzut; token comun/ambiguu între limbi; controale pozitive curate.

*Cazul 32 (`science-dinosaurs-7-8-English-01`, intrarea 32) — primul caz de știință (operatorul, 2026-10-05).* „Pip, the flying
dinosaur, landed on a branch.”; rezultat executat: exact `pterosaur-dinosaur`, declanșat de ramura expresiei fixe „flying dinosaur”
(stimulul nu numește specia lui Pip); confirmat; acord de verdict DA; acord de raționament INCOMPLETE. Confirmarea se sprijină pe
premisa operatorului: Pip este pterozaurul stabilit de canon/context; pterozaurii sunt reptile zburătoare dintr-un grup distinct de
Dinosauria. Nu NO (pentru Pip regula identifică o problemă reală și relevantă); nu YES (justificarea implicită „flying dinosaur is
scientifically wrong” e prea generală, vezi proba de mai jos).

**OBS-GS-15 (operatorul, la cazul 32, 2026-10-05) — Scientific taxonomy, entity identity & contextual classification.** Principiu:
**lexical phrase match ≠ contextual taxonomic reasoning.** Dovezi executate: (1) cazul de aur — „Pip, the flying dinosaur, landed on a
branch.” → `pterosaur-dinosaur`; defect real în contextul în care Pip e pterozaur; (2) sondă (NU caz de aur) — **fals pozitiv**:
„Birds are flying dinosaurs.” → `pterosaur-dinosaur`, deși păsările sunt dinozauri avieni în clasificarea evolutivă modernă. Alte probe
executate, consemnate fără a lărgi concluzia: „Pip, the flying reptile, landed on a branch.” → niciun cod; „Pip, the pterosaur, landed
on a branch.” → niciun cod; „Pip, dinozaurul zburător, s-a așezat pe o creangă.” → `pterosaur-dinosaur`. Regula nu distinge ENTITY →
TAXON → RELATIONSHIP → CLAIM.
*Nu e o excepție lexicală:* o reparație viitoare de tip „if „birds” then allow „flying dinosaurs”” ar fi tot o corecție lexicală
fragilă; problema e semantică. Distincții conceptuale minime: pterozaur → reptilă zburătoare → nu Dinosauria; dinozaur non-avian →
Dinosauria → nu pasăre; pasăre → dinozaur avian → Dinosauria. Validitatea afirmației depinde de referent și de relația taxonomică, nu
de prezența expresiei.
*Factual vs simplificare (pentru hardening):* scientifically false ≠ scientifically simplified ≠ age-appropriate simplification ≠
ambiguous wording ≠ technically precise wording. Nu orice simplificare pentru copii se blochează, dar o simplificare nu are voie să
schimbe fals o categorie taxonomică esențială. Pip = pterozaur + „flying dinosaur” → clasificare greșită relevantă; „Birds are flying
dinosaurs.” → situație taxonomică diferită.
*Legătura cu canonul:* factualitatea poate depinde de identitatea canonică a personajului (ex.: Character Bible `Pip.species =
pterosaur`); aceeași propoziție poate avea verdict diferit în funcție de referent. Conceptual: CANONICAL ENTITY → KNOWN ATTRIBUTES /
SPECIES → CLAIM IN TEXT → SCIENTIFIC KNOWLEDGE → CONSISTENCY / FACTUALITY → VERDICT + REASON CODE.
*Reason code:* `pterosaur-dinosaur` nu se schimbă acum; pentru hardening se evaluează dacă e suficient de precis — un cod științific ar
trebui să explice relația factuală („entity Pip is canonically a pterosaur; pterosaurs are not dinosaurs”), nu doar tokenii care au
declanșat regula („phrase flying dinosaur detected”).
*Limite ale dovezii:* demonstrat doar (1) detecția cazului Pip și (2) fals pozitivul pe „Birds are flying dinosaurs.”. NU sunt
declarate demonstrate: alte erori taxonomice, alte animale, alte relații evolutive, toate formele de verificare factuală, capacitatea
sau incapacitatea în alte domenii științifice — se testează ulterior.
*Direcții pentru setul v2 (nu se creează și nu se etichetează acum):* perechi controlate pterosaur → dinosaur vs pterosaur → flying
reptile; bird → dinosaur vs bird → pterosaur; specie explicită în propoziție; specie doar din canon; referent ambiguu; afirmație corectă
dar simplificată; afirmație realmente falsă; formulare metaforică/colocvială, dacă produsul permite asemenea contexte.
Nimic nu se implementează acum: arhitectura, regula, codul și schema rămân neschimbate.

*Cazul 33 (`science-dinosaurs-7-8-English-02`, intrarea 33) — operatorul, 2026-10-05.* „Cavemen waved at the dinosaurs.”; rezultat
executat: exact `humans-dinosaurs`; confirmat; acord de verdict DA; acord de raționament INCOMPLETE. Defect real: în lumea reală (nu
fantasy; evaluatorul setului rulează cu `world=natural`), interacțiunea directă oameni ↔ dinozauri non-avieni implică o coexistență
temporală falsă. Mecanismul demonstrat: human-token + dinosaur-token within lexical distance — nu stabilește relația. Nu NO (entitățile
detectate sunt relevante și codul indică problema reală); nu YES (sistemul nu demonstrează relația care face afirmația falsă).

**OBS-GS-16 (operatorul, la cazul 33, 2026-10-05) — Scientific relational claims, temporal coexistence & world context.** Principiu:
**entity A + entity B appearing together ≠ a factual relation between A and B** (co-occurrence ≠ relationship; human + dinosaur
mentioned ≠ human lived with dinosaur). Dovezi executate (în afară de cazul de aur, sondele NU sunt cazuri de aur):
- *True positive (caz de aur):* „Cavemen waved at the dinosaurs.” → `humans-dinosaurs`; interacțiunea directă implică aceeași perioadă.
- *RELATION FALSE POSITIVE (sondă):* „People study dinosaur fossils in museums.” → `humans-dinosaurs`; entitățile relevante sunt
  prezente, dar relația este modern humans → study → fossils of extinct dinosaurs, nu humans → coexist/interact → dinosaurs.
- *ENTITY-COVERAGE FALSE NEGATIVE (sondă):* „A boy rode a T. rex to school.” → niciun cod; relația problematică e explicită, dar „boy”
  nu e recunoscut ca entitate umană de regula lexicală.
- *World-context (sondă):* „Cavemen waved at the dinosaurs.” cu `world=fantasy` → niciun cod. Demonstrează doar că parametrul
  `world=fantasy` dezactivează regula în acest caz — NU că sistemul înțelege semantic ficțiunea sau worldbuilding-ul.
- *Paritate (sondă):* „Oamenii peșterilor le-au făcut cu mâna dinozaurilor.” → `humans-dinosaurs`.
Cele două moduri de eșec rămân separate. Remedii simptomatice excluse pentru hardening: mărirea distanței dintre cuvinte, adăugarea lui
„boy” într-o listă, enumerarea continuă de sinonime. Un text poate vorbi corect despre oameni și dinozauri în aceeași propoziție
(cercetare, fosile, muzee, paleontologie, comparații temporale, extincție); problema apare doar când afirmă o relație factuală
incompatibilă cu realitatea relevantă.
*Legătura cu OBS-GS-15 (legate, necombinate):* OBS-GS-15 — WHO/WHAT IS THE ENTITY? (identitate, taxonomie, clasificare); OBS-GS-16 —
WHAT FACTUAL RELATION IS ASSERTED BETWEEN ENTITIES? (acțiune, relație, timp, context de lume). Direcție conceptuală (NU se implementează):
ENTITY RESOLUTION → CANON / TAXONOMIC IDENTITY → RELATION EXTRACTION → TEMPORAL CONTEXT → WORLD MODE → SCIENTIFIC KNOWLEDGE → FACTUAL
CLAIM → VERDICT + REASON.
*Reason code:* `humans-dinosaurs` nu se schimbă acum; pentru hardening, dovada motivului ar trebui să explice relația („Cavemen = human
entity; waved at = direct contemporaneous interaction; dinosaurs = non-avian dinosaurs in real-world context → incompatible temporal
coexistence”), nu doar „human word + dinosaur word detected”.
*Limite ale dovezii:* se afirmă doar: cazul „Cavemen waved…” e detectat; „People study dinosaur fossils…” produce fals pozitiv; „A boy
rode a T. rex…” produce fals negativ; `world=fantasy` evită codul pe proba executată; mecanismul depinde de tiparele lexicale descrise.
NU se declară: că toate relațiile temporale sunt gestionate greșit; că toate sinonimele pentru oameni sunt ratate; că tratarea fantasy
e completă; că sistemul nu poate verifica alte relații științifice.
*Direcții pentru setul v2 (nu se creează acum):* stimuli controlați care separă două entități doar menționate; relație directă; relație
indirectă prin fosile/urme/documente; aceeași perioadă vs perioade diferite; coexistență afirmată explicit; coexistență implicată prin
acțiune; entitate umană exprimată prin termeni diferiți; real-world vs fantasy explicit; afirmație istorică corectă vs anacronică.

*Cazul 34 (`science-forest-7-8-English-03`, intrarea 34) — operatorul, 2026-10-05.* „Bats are blind, said the owl.”; rezultat executat:
exact `bats-blind`; confirmat; acord de verdict DA; acord de raționament INCOMPLETE. Stimulul nu conține nicio corectare, contestare sau
alt context care să arate copilului că afirmația bufniței e falsă; atribuirea către un personaj nu face, singură, informația falsă
acceptabilă — un personaj poate greși intenționat, dar atunci e nevoie de contextul narativ care stabilește ce face povestea cu
afirmația, iar aici lipsește. Evaluatorul nu stabilește cine afirmă, dacă naratorul susține, dacă textul contestă, corectează imediat
sau prezintă afirmația ca să demonteze un mit; reacționează la tiparul lexical.

**OBS-GS-17 (operatorul, la cazul 34, 2026-10-05) — Scientific claim attribution, narrative stance & misconception correction.**
Principiu: **presence of a false proposition in text ≠ narrative endorsement of that proposition.** Dimensiuni de distins (model
conceptual, NU se implementează): CLAIM CONTENT (ce afirmație); SPEAKER / SOURCE (cine o spune); NARRATIVE STANCE (povestea o susține,
o lasă necontestată sau o contestă); CORRECTION (apare sau nu); CORRECTION SCOPE/TIMING (suficient de clară și de apropiată pentru
copil); FINAL TAKEAWAY (ce rămâne probabil cititorului). Dovezi executate (în afară de cazul de aur, sondele NU sunt cazuri de aur):
- *Caz de aur — defect real:* „Bats are blind, said the owl.” → `bats-blind`; mit fără corectare; verdict negativ justificat.
- *FALS POZITIV — demontare explicită (cea mai puternică dovadă de stance):* „Many people think bats are blind, but bats can see.” →
  `bats-blind`; evaluatorul confundă *mentioning a misconception in order to correct it* cu *asserting the misconception as fact*.
- *Corectare pe aceeași pagină — CAZ-LIMITĂ DE POLITICĂ, NU automat fals pozitiv:* „Bats are blind, said the owl. "No, we can see,"
  laughed the bat.” → `bats-blind`. În hardening se stabilește dacă un mit corectat imediat, explicit și clar pentru vârstă e PASS,
  REVIEW sau alt verdict conform politicii produsului; nu se decide acum. Rezultatul arată doar că evaluatorul nu demonstrează
  înțelegerea corectării.
- *Control de negație:* „Bats are not blind.” → niciun cod; comportament corect pe proba executată, NU dovadă de înțelegere semantică a
  negației fără teste suplimentare.
- *FALS NEGATIV — parafrază:* „Bats cannot see anything at all.” → niciun cod; același mit fără tiparul fix (coverage /
  semantic-paraphrase failure).
- *Paritate:* „Liliecii sunt orbi, a spus bufnița.” → `bats-blind`.
*Delimitare (legate, necombinate):* OBS-GS-15 → identitate și taxonomie; OBS-GS-16 → relații factuale între entități, temporalitate /
coexistență, context de lume; OBS-GS-17 → statutul epistemic/narativ al afirmației (cine o spune; povestea o adoptă, o contestă sau o
corectează). Legătură secundară cu **OBS-GS-3** (problematic statement present ≠ story endorses problematic statement; GS-3 rămâne
pentru stereotip/stance narativ, GS-17 pentru afirmații științifice/stance narativ), printr-un principiu transversal, posibilă cerință
arhitecturală comună ulterioară: **content detection must be separated from narrative/epistemic stance**. Legătură secundară cu
**OBS-GS-7** (robustețe la parafrază) pentru fals negativ; proprietarul principal rămâne OBS-GS-17 (trebuie determinat ce afirmație
factuală e făcută realmente și cu ce stance).
*Fără liste de expresii:* hardening-ul NU adaugă „cannot see”, „can't see”, „unable to see”, „people think”, „but” sau alte excepții
regex. Ținta conceptuală: TEXT → CLAIM EXTRACTION → SPEAKER/ATTRIBUTION → FACTUAL CONTENT → NARRATIVE/EPISTEMIC STANCE →
CORRECTION/RESOLUTION → AGE-AWARE TAKEAWAY → SCIENTIFIC KNOWLEDGE → VERDICT + REASON.
*Corectarea unui mit nu e automat defect — clase de testat în setul v2 (fără PASS/BLOCK/REVIEW atribuite acum în abstract; etichetele
se stabilesc ulterior cu politica editorială și teste controlate pe grupă de vârstă):* myth asserted as fact; myth mentioned as
misconception; myth spoken by character, uncorrected; myth immediately corrected; myth corrected much later; correction ambiguous;
explicit educational debunking.
*Unitatea de evaluare:* page-level factual check vs story-context factual check — mitul pe pagina N și corectarea pe pagina N+1 pot fi
citite greșit de un evaluator strict pe pagină, dar o corectare vagă sau foarte târzie nu trebuie să neutralizeze automat o afirmație
falsă puternică. Direcție pentru v2: **evaluation scope and correction window must be explicit** (dimensiunea ferestrei nu se decide acum).
*Ce demonstrează cazul 34:* **the evaluator correctly flags the represented explicit myth formulation „Bats are blind”.** NU: the
evaluator understands the scientific misconception; NU: understands narrative attribution; NU: understands misconception correction;
NU: detects paraphrases of the same misconception — pentru ultimele trei, probele executate oferă dovezi contrare.

*Cazul 35 (`science-sea-7-8-English-04`, intrarea 35) — singurul control pozitiv de știință (operatorul, 2026-10-05).* „The moon shone
over the sea, lit by the sun.”; rezultat executat: pozitiv, nicio regulă; confirmat; acord de verdict DA; acord de raționament
INCOMPLETE (același standard ca la controalele pozitive 26 și 30). Clasificare: **positive science control**, NU **proof of
factual-verification capability**. Separarea dovezilor (principiul de la cazul 30): *stimulus property* — afirmația e științific
corectă (lumina Lunii e lumina Soarelui reflectată; textul nu afirmă lumină proprie); *gold tested expectation* — niciun defect
științific; *implemented mechanism observed* — niciun tipar din catalog nu s-a potrivit; *observed verdict* — niciun cod / pozitiv;
*supported claim* — evaluatorul nu produce fals pozitiv pe acest stimul concret; *unsupported claim* — evaluatorul a verificat semantic
adevărul afirmației. Sondă românească (rezultat executat, nimic mai mult): „Luna strălucea deasupra mării, luminată de soare.” → niciun
cod — NU dovadă de paritate științifică EN↔RO, de înțelegere factuală în română sau de generalizare între limbi (ar cere perechi
controlate pozitive și negative în ambele limbi). Fără OBS nouă (OBS-GS-1…17 rămân).

*Extensie OBS-GS-7 (operatorul, la cazul 35, 2026-10-05) — știință: parafrazarea unei concepții greșite.* Tipar cunoscut: „The moon makes
its own light.” → `moon-light`. Aceeași concepție greșită, altă formulare (sonde, NU cazuri de aur): „The moon shone over the sea with
its own bright light.” → niciun cod; „The moon glows by itself, like a little sun.” → niciun cod. Dovezi executate că detecția acestei
concepții nu e robustă la parafrazare: **semantic equivalence ≠ lexical equivalence**; „niciun cod” nu discriminează, pe aceste probe,
afirmația corectă a cazului 35 de două formulări ale mitului opus. NU se repară prin adăugarea manuală a „own bright light”, „glows by
itself”, „like a little sun” sau a altor expresii (ar continua problema de acoperire a catalogului). Legătură secundară cu OBS-GS-17:
înainte de a determina stance-ul unei afirmații, sistemul trebuie să identifice semantic afirmația — dar probele cazului 35 nu au
vorbitor, corectare sau demontare, deci proprietarul principal rămâne OBS-GS-7.

*Extensie OBS-GS-12 (operatorul, la cazul 35, 2026-10-05) — acoperirea categoriei de știință.* **presence of a rule in the evaluator ≠
that rule being adequately exercised by the Gold Set.** Pentru `moon-light`, gold-v1 verifică doar că un text corect nu declanșează
regula; nu verifică true positive-ul regulii, parafraze ale mitului, cazuri-limită, corectare/demontare explicită sau alte formulări
corecte apropiate semantic — iar probele externe arată că lipsa contează. Distribuție: știința are 5 cazuri — calibrare 4 (3 negative:
32 `pterosaur-dinosaur`, 33 `humans-dinosaurs`, 34 `bats-blind`; 1 pozitiv: 35), set rezervat 1 negativ (36 `sun-orbits`); un singur
control pozitiv. Dezechilibrul nu invalidează automat cazurile, dar limitează concluziile despre specificitate, rezistența la fals
pozitive, comportamentul pe afirmații adevărate și discriminarea la limită. Setul v2 are nevoie de **controlled positive/negative pairs**,
nu doar de mai multe exemple negative. Direcție (nu se construiește acum), pe concept științific: TRUE CLAIM vs FALSE CLAIM; FALSE CLAIM
— known wording vs semantic paraphrase; unde e relevant FALSE CLAIM asserted vs mentioned/debunked; plus formulare-limită,
simplificare potrivită vârstei, echivalente EN/RO controlate — pentru `moon-light`, un test real al conceptului, nu doar al expresiei.
*Raportarea științei după cazul 35:* 4/4 cazuri brute de calibrare adjudecate (3 negative, 1 pozitiv), toate în acord de verdict cu
eticheta. Limite demonstrate păstrate: cazul 32 — fals pozitiv taxonomic/contextual (OBS-GS-15); cazul 33 — fals pozitiv relațional +
fals negativ de acoperire a entităților (OBS-GS-16); cazul 34 — fals pozitiv la demontare/stance + fals negativ la parafrază
(OBS-GS-17); cazul 35 — două fals negative `moon-light` prin parafrazare (OBS-GS-7). **4/4 calibration Gold agreement ≠ science
evaluator validated** — aceeași lecție metodologică ca la localizare.

*Cazul 36 (`science-space-7-8-English-05`, intrarea 36) — singurul caz de știință din setul rezervat (operatorul, 2026-10-05).* „The sun
goes around the earth every day, said the robot.”; rezultat executat: exact `sun-orbits`; confirmat; acord de verdict DA; acord de
raționament INCOMPLETE (correct verdict on the Gold stimulus ≠ demonstrated semantic scientific reasoning). În context real-world și
fără corectare în stimul, afirmația e falsă. Dovada motivului rămâne precisă: **the implemented rule detected the catalogued reversed
Sun/Earth orbital relation** — NU „the evaluator verified both orbital direction and temporal period” („every day” e prezent în stimul,
dar nu există dovadă că e analizat separat; properties present in stimulus ≠ properties actually evaluated). Control executat: „The sun
rises in the east and sets in the west.” → niciun cod — se poate afirma doar *this particular conventional expression did not trigger
a science rule*, NU *the evaluator understands apparent celestial motion*. Sondă românească: „Soarele se învârte în jurul Pământului, a
spus robotul.” → `sun-orbits` — o singură probă pe un tipar catalogat, NU paritate EN↔RO, înțelegere semantică în ambele limbi sau
generalizare între limbi. Fără OBS nouă (OBS-GS-1…17 rămân).

*Extensie OBS-GS-17 (operatorul, la cazul 36, 2026-10-05) — replicare pe un al doilea concept.* Sondă (NU caz de aur): „People long ago
thought the sun goes around the earth, but the earth goes around the sun.” → `sun-orbits` — **fals pozitiv demonstrat pentru explicit
misconception correction/debunking**. Replicare conceptuală a cazului 34 („Many people think bats are blind, but bats can see.” →
`bats-blind`) pe alt concept și altă regulă: **the narrative/epistemic-stance failure has now been reproduced on two distinct
catalogued science concepts** (bats-blind, sun-orbits). NU se afirmă „all science rules have this defect” — celelalte reguli nu au fost
testate pe această axă.

*Extensie OBS-GS-7 (operatorul, la cazul 36, 2026-10-05) — parafrază științifică.* Sondă (NU caz de aur): „The sun circles the earth
every day.” → niciun cod — **fals negativ demonstrat pentru semantic paraphrase robustness**; tiparul cunoscut „sun goes around the
earth” e detectat, „sun circles the earth” nu. Principiu: **same scientific misconception ≠ same lexical surface form.** Eșecuri de
parafrază executate acum pe mai multe concepte: bats-blind (cazul 34), moon-light (cazul 35), sun-orbits (cazul 36), plus exemplele
anterioare din OBS-GS-7 — problema nu se repară prin completarea izolată a fiecărui regex (NU se adaugă „circles”). Setul v2 măsoară
separat **canonical wording performance** și **semantic paraphrase robustness**.

*Extensie OBS-GS-12 (operatorul, la cazul 36, 2026-10-05) — matricea reală de independență a setului rezervat de știință.* Cazul 36:
stimulus independence — DA; theme independence — DA („space” lipsește din calibrarea de știință: dinosaurs, dinosaurs, forest, sea);
specific rule independence from calibration — DA (`sun-orbits` nu e exersată în cazurile 32–35); evaluator/catalog independence — NU
(regula exista deja explicit în evaluator); unseen-concept generalization — NU e demonstrată; unseen-paraphrase generalization — NU e
demonstrată (sonda „circles” oferă chiar dovadă contrară). Metodologic mai bun decât cazul 31 pe axa regulii, dar descris exact: cazul
36 demonstrează **a catalogued science rule not represented in calibration correctly fires on its canonical held-out formulation in a
new theme** — mai puțin decât „the evaluator generalized scientifically to an unseen misconception” și mult mai puțin decât „the science
evaluator generalized semantically”. Formulare de raport: **„Held-out science: 1/1 Gold agreement on one independent space-theme
stimulus exercising a catalogued science rule not represented in calibration. This does not demonstrate unseen-concept or
semantic-paraphrase generalization.”** — NU „science held-out generalization = 100%”. Schema setului nu se modifică acum.

**Închiderea adjudecării categoriei de știință din gold-v1 (operatorul, la cazul 36, 2026-10-05).** 5/5 cazuri brute: calibrare 4/4,
set rezervat 1/1, 0 excluse; toate cele cinci etichete în acord de verdict. Limite demonstrate prin probe executate: fals pozitiv
taxonomic (OBS-GS-15); fals pozitiv relațional (OBS-GS-16); fals negativ de acoperire a entităților (OBS-GS-16); fals pozitive la
demontarea concepțiilor greșite, pe două concepte (OBS-GS-17); fals negative la parafrază semantică (OBS-GS-7); controlul pozitiv trece
prin absența tiparului, nu prin verificare factuală (cazul 35). **5/5 Gold agreement ≠ science evaluator validated.** Terminologie
pentru raportul final: **science gold-v1 adjudication = complete**; **science evaluator validation = pending hardening / Gold Set v2**.
Același principiu se aplică localizării (adjudecare completă ≠ validare).

*Cazul 37 (`quality-dinosaurs-3-4-English-01`, intrarea 37) — primul caz de calitate, control pozitiv (operatorul, 2026-10-05).*
Stimulul nu e un text de poveste, ci evaluarea unui critic: T01–T18 prezente, toate cu nota 9, fiecare cu dovadă (aceeași frază „Milo
and Tia find a gentle surprise”), nicio problemă raportată; conținutul la care se referă e sintetic și fix (12 pagini „Milo and Tia find
a gentle surprise on page N.”). Rezultat executat: pozitiv pe politica v2 și pe v1 (scor 9, niciun motiv); confirmat; acord de verdict
DA; acord de raționament **YES** (alegere intenționată, care stabilește modul de adjudecare a cazurilor 37–44). Proprietatea efectiv
testată: **Does the quality acceptance gate correctly apply its declared policy to the supplied critic assessment?** — pentru cazul 37,
DA. Explicația reală și completă a verdictului: scores satisfy thresholds + required criteria exist + evidence strings satisfy the
implemented evidence-presence requirement → gate accepts. **CASE-LEVEL REASONING CORRECTNESS ≠ EVALUATOR-LEVEL CAPABILITY / COVERAGE /
SUFFICIENCY** (ca la cazul 29): problema nu e că sistemul explică greșit acceptarea, ci că **gate acceptance itself is weaker than
demonstrated story quality** — documentată separat (OBS-GS-18). Cazul NU se corectează la negativ pentru că evaluarea e artificială sau
dovada e slabă semantic: gold-v1 a fost construit ca test al porții de calitate și se adjudecă ca atare (principiu valabil pentru 38–44).

**Principiu de adjudecare pentru categoria de calitate (operatorul, la cazul 37, 2026-10-05) — patru niveluri, separate explicit la
fiecare caz 37–44:** *Layer 1 — Gold Gate Verdict:* conform politicii declarate, evaluarea criticului ar trebui acceptată sau respinsă?
*Layer 2 — Gate Implementation:* evaluatorul aplică politica corect? *Layer 3 — Evidence Validity:* dovada există, e relevantă și
susține criteriul/nota? *Layer 4 — Underlying Content Quality:* textul are calitatea afirmată de evaluare? gold-v1 quality poate testa
bine Layer 1/2 fără a valida complet Layer 3/4; nivelurile nu se amestecă în acordul de raționament. Regula pentru raționament: **YES**
— mecanismul porții explică integral verdictul cerut de politica pe care cazul pretinde că o testează; **INCOMPLETE** — verdict corect,
dar poarta nu verifică integral chiar condițiile declarate de acea politică/caz; **NO** — verdictul coincide accidental sau mecanismul
demonstrat contrazice motivul Gold. Poarta nu e penalizată pentru o capacitate pe care cazul nu pretinde că o testează. Limită
obligatorie: chiar cu acord pe toate cazurile, concluzia poate fi doar de forma **„Gold-v1 quality-gate policy adjudication: X/X valid
cases agree with their Gold labels”** — NU „WonderPages content quality evaluation validated”, NU „critic scores are proven accurate”,
NU „evidence is semantically validated”. Politicile v1 și v2 (praguri, criterii critice, validarea dovezilor, rubrica), evaluatorul și
garda de acceptare rămân neschimbate pe durata adjudecării; hardening-ul decide ulterior, pe dovezi, dacă v2 trebuie extinsă.

**OBS-GS-18 (operatorul, la cazul 37, 2026-10-05) — Quality evidence validity, critic trust & gate-vs-content distinction.** Separă:
**A. Critic assessment** (ce afirmă criticul despre text); **B. Assessment validation** (dacă evaluarea e structural și probatoriu
validă); **C. Acceptance gate** (dacă evaluarea satisface pragurile politicii); **D. Underlying content quality** (dacă textul merită
notele). Conceptual: CONTENT → CRITIC EVALUATION → EVIDENCE → ASSESSMENT VALIDATION → QUALITY POLICY → ACCEPT / REJECT. Cazul 37 arată
că poarta actuală operează în principal pe evaluarea furnizată și pe verificări structurale / de prezență a dovezilor; nu demonstrează
independent adevărul evaluării. Dovezi executate (sondele NU sunt cazuri de aur; același răspuns de critic, alt conținut):
- *Sonda A — existența dovezii (v1 vs v2):* conținut 12 pagini „The end.”; notele 9 și citatul „Milo and Tia find a gentle surprise”,
  care nu există în text → **v1 pozitiv**, **v2 negativ** („Dovezi care nu se găsesc în text: T01…T18”). Îmbunătățire reală a v2:
  *v1 does not validate evidence existence; v2 validates evidence existence* — dar doar existență/prezență, nu încă suport, relevanță
  sau suficiență.
- *Sonda B — limita validării dovezii:* citatul există pe pagina 1; celelalte 11 pagini au conținut evident problematic pentru 3–4 ani
  („The monster ate the screaming children one by one in the dark.”); notele rămân 9, același citat pentru T01–T18 → **v1 pozitiv**,
  **v2 pozitiv**. Formulare corectă: **the isolated quality gate accepts the supplied high-scoring critic assessment when the cited
  evidence string exists, even when that evidence does not demonstrate the validity of all criterion scores.** NU „WonderPages accepts
  unsafe content”: sonda izolează poarta de calitate; siguranța e o poartă independentă (nu se mediază cu nota), deci sonda NU dovedește
  că pipeline-ul complet ar permite acel conținut.
*Presence ≠ support (problema centrală):* evidence exists in source text ≠ evidence supports the criterion score; evidence supports
some observation ≠ evidence justifies score 9; one valid quote ≠ the same quote is valid evidence for 18 different criteria — cazul 37
arată limita direct (aceeași propoziție acceptată ca dovadă pentru T01–T18), fără un caz nou.
*Critic trust (problemă distinctă de existența dovezii):* poarta presupune în mare măsură că notele criticului sunt valide. Ex.: T02
(„every page moves the story forward”) primește 9, iar poarta verifică nota și cerințele formale, dar nu recalculează dacă cele 12
pagini (aproape identice) demonstrează progres narativ: **critic score ≠ independently verified content property.**
*v1 vs v2 — formulare:* NU „v2 evidence validation solved”; ci **„v2 closes the evidence-existence failure demonstrated in v1, while
evidence relevance/support remains unverified and demonstrably insufficient in the executed probe.”**
*Direcții pentru hardening (nu se implementează și nu se creează cazuri acum):* evidence absent; evidence present but irrelevant;
evidence relevant but insufficient for score; evidence valid for one criterion but reused improperly for another; score contradicted
by content; criterion supported locally but contradicted elsewhere in the book; fabricated quote; correct quote; partial quote /
context distortion; critic score internally inconsistent with its own evidence; și separat: gate policy correctness vs critic
correctness vs content quality correctness.

*Cazul 38 (`quality-sea-5-6-English-02`, intrarea 38) — al doilea control pozitiv de calitate (operatorul, 2026-10-05).* Răspunsul
criticului e identic cu cel al cazului 37, cu o singură diferență (verificată executând): T04 („Read-aloud rhythm…”, necritic) 9 → 8.
Rezultat executat: pozitiv pe v2 și pe v1 (scor 8,9; media exactă 8,944), niciun motiv; confirmat; acord de verdict DA; acord de
raționament YES. Layer 1 — ACCEPT pe ambele politici (v1: media ≈8,94 ≥ 8, T01/T07/T08 = 9 ≥ 7; v2: media ≥ 8, T01/T08 = 9 ≥ 8,
minimul 8 ≥ 7, citatul există); Layer 2 — evaluatorul aplică exact condițiile declarate; Layer 3/4 — limitele din OBS-GS-18 (același
citat pentru T01–T18; conținutul sintetic neverificat independent), fără a repeta observația. Cazul rămâne valid (diferență reală în
inputul evaluat, spre deosebire de cazurile 21–24). Demonstrează îngust: **reducing one non-critical criterion, T04, from 9 to 8 does
not change acceptance under either v1 or v2 for this otherwise identical assessment.** NU demonstrează: comportamentul exact la prag;
robustețe generală; sensibilitate la note mici; age awareness; theme awareness; calitatea reală a textului; validitatea semantică a
dovezii. **NU e test de prag:** T04 = 8 e peste minimul v2 (7), necritic, cu celelalte 17 criterii la 9 și media ≈8,94 — testează doar
*a modest non-critical score reduction remains acceptable*, nu *what happens at the acceptance boundary?*.

*Extensie OBS-GS-12 (operatorul, la cazul 38, 2026-10-05) — near-duplicate / correlated evidence.* Distincție: **exact duplicate ≠
near-duplicate ≠ controlled variant ≠ independent stimulus.** Cazul 38: exact duplicate of case 37 — NU; input variation — DA (T04
9→8); controlled single-variable variation — DA; boundary test — NU; independent content stimulus — NU; independent evidence pattern —
NU; independent theme/age behavior demonstrated — NU. Clasificare: **controlled near-duplicate / correlated positive-control variant**
— mai precis decât excluderea ca duplicat sau numărarea ca observație complet independentă. *Metadate (sondă executată, NU caz de
aur):* cazul 38 cu `age=3-4, theme=dinosaurs` (metadatele cazului 37) → rezultat identic pe ambele politici (pozitiv, scor 8,9).
Concluzie exactă: **the isolated quality-gate evaluation exercised by this Gold Case did not change when those metadata values were
changed in the executed probe** (metadata diversity ≠ demonstrated behavioral coverage) — NU „WonderPages quality is not age-aware”.
„sea 5–6” NU se folosește ca dovadă separată (ex. NU „quality validated across dinosaurs 3–4 and sea 5–6” = pseudo-coverage): conținutul
sintetic e același, evaluarea aproape identică, iar evaluatorul executat nu își schimbă comportamentul după acele metadate. *Principiu
de raportare:* se raportează separat **Gold case count** și, unde e relevant, **independent / correlated evidence structure** — două
cazuri de aur valide nu înseamnă automat două observații independente (important pentru ce demonstrează cele 8 cazuri de calitate);
schema nu se modifică acum. *Direcții pentru setul v2 (nu se creează acum):* exact la prag; cu 1 punct sub prag; criteriu critic vs
necritic; aceeași medie prin distribuții foarte diferite; un singur criteriu foarte slab ascuns de multe note mari; dovadă validă vs
irelevantă pentru aceeași notă.

*Cazul 39 (`quality-forest-7-8-English-03`, intrarea 39) — al treilea control pozitiv de calitate (operatorul, 2026-10-05).* Răspunsul
criticului = cel al cazului 37 cu T05 („Illustratability…”) 9 → 8 și T12 („Repetition with variation…”) 9 → 8 (necritice; verificat
executând). Rezultat executat: pozitiv pe v2 și pe v1 (media exactă 8,889; afișat 8,9), niciun motiv; confirmat; acord de verdict DA;
acord de raționament YES (media ≥ 8; T01/T07/T08 = 9; minimul 8 ≥ 7; citatul există → ACCEPT pe ambele politici). Layer 3/4 → OBS-GS-18
(ex.: T05 cere ca paginile consecutive să nu semene niciodată, nota e 8, iar paginile sintetice sunt aproape identice). NU e test de
prag (media exactă ≈8,889, afișat 8,9, prag 8, minimul 8 față de 7 la v2) — confortabil în zona de acceptare. Defectul de rotunjire
(OBS-GS-19) NU afectează verdictul cazului 39: 8,889 trece și cu prag exact, și cu prag după rotunjire.

*Extensie OBS-GS-12 (operatorul, la cazul 39, 2026-10-05).* Cazul 39: exact duplicate — NU; assessment variation — DA; variables
changed — 2 (T05, T12); boundary test — NU; independent content stimulus — NU; independent evidence structure — NU; independent age/theme
behavior demonstrated — NU. Clasificare: **controlled correlated positive-control variant / near-duplicate of case 37.** Sondă
executată: cazul 39 cu `age=3-4, theme=dinosaurs` → rezultat identic pe ambele politici — **the isolated quality-gate result for this
assessment was invariant to the executed age/theme metadata change** (NU „WonderPages quality evaluation is globally age-insensitive”;
dar nici „forest 7–8” ca dovadă independentă de acoperire). *Raportarea controalelor pozitive de calitate:* formal, 3/3 cazuri pozitive
în acord pe ambele politici; structura dovezii: 37 = baseline high-score assessment; 38 = variantă corelată (T04 9→8); 39 = variantă
corelată (T05, T12 9→8). Formulare: **„3/3 Gold positive-control cases agree, consisting of one baseline assessment and two closely
correlated non-boundary variants”** — NU „3 independent positive quality stimuli validated”.

**OBS-GS-19 (operatorul, la cazul 39, 2026-10-05) — Quality threshold precision, rounding semantics & rejection explainability.**
Observație distinctă de OBS-GS-18 (critic trust / validitatea dovezii / poartă vs conținut): privește **Layer 2 — whether the gate
implements its own declared numeric policy correctly and explains threshold rejection.** Mecanism (cod): `rubricEvaluation`
(`server/contracts.js`) rotunjește media la o zecimală și compară valoarea rotunjită cu pragul — conceptual `round(mean, 1) >= 8`, nu
`mean >= 8`. Dovezi executate (sonde, NU cazuri de aur; răspunsul cazului 39 cu toate notele 8 și T04 variat):
- *Defect demonstrat — prag aplicat după rotunjire:* 17 criterii = 8, T04 = 7,2 → media exactă **7,9556…**, scor rotunjit **8,0** →
  **v1 ACCEPT, v2 ACCEPT**. Dacă politica declarată e literal „average ≥ 8”, media exactă e sub 8: abatere demonstrată între **declared
  threshold semantics** și **implemented threshold semantics** — defect / ambiguitate reală de contract, nu observație cosmetică.
- *Frontiera confirmată:* 17 criterii = 8, T04 = 7 → media exactă **7,9444…**, afișat **7,9** → **v1 reject, v2 reject** — verdictul se
  schimbă după valoarea rotunjită. (Cu note întregi pe 18 criterii rotunjirea nu poate schimba verdictul la pragul 8; cu note zecimale,
  pe care contractul le admite, poate.)
- *Al doilea defect demonstrat — respingere fără motiv:* la proba respinsă doar prin medie, verdict = reject, dar **`reasons = []`** pe
  ambele politici. **decision correctness / threshold result** și **rejection explainability** sunt proprietăți diferite: un verdict
  negativ fără motiv nu e o respingere explicabilă.
*Nu se decide acum* (după 44/44, în hardening, se reconciliază contractul cu implementarea): **A** — politica intenționată e exact mean
≥ 8 → decizia folosește media nerotunjită, rotunjirea rămâne doar pentru afișare; **B** — politica intenționată e rounded score ≥ 8 →
contractul/documentația o spun explicit. Direcție arhitecturală: **exactMean → threshold comparison; displayScore → rounded
representation**. Legătură conceptuală cu cerința enterprise ca blocajele să conducă spre acțiune: la o respingere doar prin medie,
operatorul/Dali trebuie să poată explica media obținută, pragul necesar și condiția eșuată — `reasons: []` nu oferă asta (Dali și UI nu
se modifică acum). Nimic nu se repară acum: rotunjirea, generarea motivelor, formularea politicii, evaluatorul, contractele, v1, v2 și
garda de acceptare rămân neschimbate.
*Regulă pentru cazurile negative 40–44:* înainte de adjudecare se raportează separat media exactă; media rotunjită/afișată; eșecuri la
criteriile critice; eșec la minimul pe criteriu; eșec la existența dovezii; verdict v1 și motive v1; verdict v2 și motive v2. „Negativ
pe ambele politici” NU înseamnă același motiv. Raționament: YES — politica relevantă respinge pentru motivul declarat și implementarea
verifică efectiv acea condiție; INCOMPLETE — verdictul coincide, dar motivul Gold/politica nu e verificat integral; NO — coincidență
sau mecanism care contrazice explicația. Dacă v1 și v2 dau verdicte diferite, se prezintă separat, fără o explicație comună vagă.

*Cazul 40 (`quality-dinosaurs-5-6-English-04`, intrarea 40) — primul negativ de calitate (operatorul, 2026-10-05).* Răspunsul
criticului = baseline-ul 37 cu o singură diferență: **T01 = 7,5** (T01 = „Age fit…”, criteriu critic). Confirmat negativ /
neacceptabil; acordul structurat e calculat pe politica-țintă v2 (verdict DA, raționament YES). Rezultate executate, separat:

| | v1 (activă) | v2 (politica-țintă) |
|---|---|---|
| Media exactă / afișată | 8,9167 / 8,9 — trece | 8,9167 / 8,9 — trece |
| Criterii critice | T01/T07/T08 ≥ 7 → 7,5 trece | T01/T08 ≥ 8 → **7,5 eșuează** |
| Minimul pe criteriu | — | 7,5 ≥ 7 — trece |
| Existența dovezilor | doar consemnată | trece |
| Rezultat | **ACCEPT** | **REJECT** |
| Motive | `[]` | „Criterii critice sub 8: T01.” |
| Gold agreement | **NU** | **DA** |
| Implementation correctness | **DA** (conform propriei politici) | **DA** |

Dezacordul v1 cu eticheta = **policy disagreement** (pragul critic T01: 7 vs 8), **NU implementation failure** / „v1 evaluator bug”.
Rotunjirea (OBS-GS-19) nu schimbă verdictul aici. Layer 3/4 → OBS-GS-18 (dovada nu arată că T01 = 7,5 e corect pentru conținut).
*Decizia editorială independentă a operatorului:* **T01 = 7,5 trebuie să blocheze** — NU pentru că „v2 requires T01 ≥ 8 → therefore
Gold label is negative” (circular), ci pentru că Age Fit (vocabular, lungimea/profilul propozițiilor, intensitatea conflictului
potrivite grupei exacte de vârstă) afectează direct dacă produsul e potrivit publicului; e un criteriu **non-compensator** (notele 9 la
alte dimensiuni nu compensează o insuficiență pe Age Fit); pentru o dimensiune critică, acceptarea înseamnă „strongly acceptable /
clearly suitable”, nu „close enough” — un 7,5 cere repair/re-evaluare înainte de acceptare. Pentru WonderPages: **T01 < 8 → quality
gate BLOCK/REJECT**. Limită: **threshold accepted as current editorial policy ≠ threshold empirically optimized/validated** — gold-v1 nu
demonstrează că 8,0 e pragul optim universal și nici comportamentul editorial pentru toate valorile din jurul pragului.
*Clasificare (OBS-GS-12):* **controlled policy-discrimination variant of case 37** — același conținut sintetic, evaluare care diferă
printr-o singură valoare, plasată intenționat între pragul v1 și pragul v2; valoare de discriminare mai mare decât 38/39 (*it
exercises an actual policy disagreement boundary region*), dar NU dovadă independentă despre calitatea conținutului.
*Ce se poate afirma:* **„Operator adjudication confirms the editorial decision that T01=7.5 is insufficient for automatic acceptance
and supports the current v2 hard threshold T01≥8”**; **„v2 correctly implements that decision for case 40”**; **„v1 correctly implements
its older threshold but disagrees with the operator-adjudicated Gold outcome”**. NU: „v2 thresholds are validated”; NU: „v2 is globally
superior to v1”.

**OBS-GS-20 (operatorul, la cazul 40, 2026-10-05) — Calibration circularity, policy independence & threshold justification.**
Principiu: **a Gold label authored from a proposed policy cannot independently validate that same proposed policy.** În cazul 40:
eticheta = negativ; v2 spune T01 < 8 → reject; stimulul conține intenționat T01 = 7,5. Când același autor a construit cazul, eticheta și
politica v2 (manifestul gold-v1 o spune deja: „cazurile și regulile evaluatorilor au același autor”), iar `GOLD-SET.md` folosește
asemenea cazuri ca „dovada pentru pragurile propuse v2”, **v2 agrees with Gold** e în mare parte **self-consistency**, nu dovadă
independentă că pragul e editorial corect. Trei întrebări separate: **A. Implementation correctness** (codul implementează politica
declarată? cazul 40: v1 DA, v2 DA); **B. Gold agreement** (politica produce eticheta? v1 NU, v2 DA); **C. Policy validity** (pragul e
editorial potrivit? cere adjudecare independentă și dovezi suplimentare — pentru cazul 40, decizia operatorului „T01 7,5 = insufficient
for automatic acceptance” dă o justificare editorială independentă de simpla self-consistency v2↔Gold). Decizia operatorului e mai
independentă decât eticheta auto-scrisă, dar rămâne o **operator-adjudicated editorial threshold decision** — NU empirical proof,
child-study validation, market validation sau statistically optimal threshold; validarea mai puternică cere ulterior setul adversarial
v2, cazuri-limită controlate, dovezi reale de producție și, eventual, feedback uman relevant.
*Aplicare la cazurile 41–44:* la fiecare negativ se întreabă explicit **„Does the Gold label independently represent an editorial
truth, or merely encode the proposed v2 rule being evaluated?”** Dacă există aceeași circularitate: nu se exclude automat cazul; se
adjudecă independent proprietatea editorială; Gold agreement rămâne separat de policy validity; etichetele nu se ajustează în favoarea
v1 sau v2.
*Direcții pentru setul v2 (nu se creează acum):* cazuri în jurul pragului T01, adjudecate independent — clearly unacceptable;
borderline; just below threshold; exactly threshold; just above threshold; clearly acceptable — construite astfel încât **underlying
evidence să justifice notele**, nu prin introducerea arbitrară de numere într-o evaluare (altfel se testează din nou doar aritmetica
porții).
*Legături (necombinate):* **OBS-GS-18** — critic score ≠ independently verified content property; **OBS-GS-20** — self-authored Gold
threshold case ≠ independent validation of policy threshold; împreună: nu ajunge „T01 = 7,5 → negativ”; e nevoie de un text care
demonstrează un defect de age fit, dovadă relevantă și o adjudecare independentă a severității. **OBS-GS-19** rămâne separată
(precizie, rotunjire, exact vs afișat, explicabilitatea respingerii); OBS-GS-20 privește cine justifică pragul, independența etichetei,
circularitatea calibrării și validitatea politicii.

*Cazul 41 (`quality-sea-3-4-English-05`, intrarea 41) — al doilea negativ de calitate (operatorul, 2026-10-05).* Răspunsul criticului =
baseline-ul 37 cu o singură diferență: **T13 = 6,5** (T13 = „Agency: the main character drives the key actions; secondary characters
never dominate”, criteriu necritic). Confirmat negativ / neacceptabil; acord structurat pe politica-țintă v2 (verdict DA, raționament
YES). Rezultate executate, separat:

| | v1 (activă) | v2 (politica-țintă) |
|---|---|---|
| Media exactă / afișată | 8,8611 / 8,9 — trece | 8,8611 / 8,9 — trece |
| Criterii critice | T01/T07/T08 = 9 ≥ 7 — trec | T01/T08 = 9 ≥ 8 — trec |
| Minimul pe criteriu | — (v1 nu are minim pe criterii necritice) | niciun criteriu < 7 → **T13 = 6,5 eșuează** |
| Existența dovezilor | doar consemnată | trece |
| Rezultat | **ACCEPT** | **REJECT** |
| Motive | `[]` | „Criterii sub 7: T13.” |
| Gold agreement | **NU** | **DA** |
| Implementation correctness | **DA** | **DA** |

v1 descris corect: **v1’s compensatory policy accepts case 41, while the operator-adjudicated editorial outcome rejects T13=6.5** — NU
„v1 fails to implement quality policy” (policy disagreement, nu defect). Raționament v2 YES la nivelul cazului: verdictul e determinat
de T13 < 7 (nu de medie), cu motiv explicit; limita privind universalitatea regulii aparține OBS-GS-20 / policy validity, nu
raționamentului cazului. Rotunjirea (OBS-GS-19) nu intervine (8,8611 și 8,9 > 8), iar problema `reasons: []` nu apare la v2. OBS-GS-18
rămâne: aceeași frază e dovada pentru T13 = 6,5; cazul validează răspunsul porții la evaluarea furnizată și decizia editorială *if T13
really is 6.5, automatic acceptance should be blocked* — NU că criticul a măsurat corect această poveste sintetică la T13 = 6,5.
*Decizia editorială a operatorului (specifică):* **„Operator adjudication: T13 Agency at 6.5 is insufficient for automatic acceptance
and should trigger repair/re-evaluation.”** 17 criterii foarte bune nu trebuie să poată ascunde complet o problemă serioasă de agenție a
protagonistului; „necritic” nu înseamnă „compensabil fără limită”. Coexistă cu decizia de la cazul 40 (T01 critic → minimum 8) fără a
declara toate criteriile echivalente: *critical criterion with stricter floor* ≠ *non-critical criterion with no meaningful floor at
all*. NU: „Operator validated minCriterion=7 for every rubric criterion.”
*Policy validity:* operatorul confirmă specific că T13 = 6,5 trebuie să blocheze; **universal minCriterion=7 across all T01–T18 rămâne
nevalidat.** *Clasificare (OBS-GS-12):* **controlled policy-discrimination variant of case 37 — non-critical floor dimension** (40
discriminează pragul critic T01; 41 discriminează compensarea unei note necritice mici / minimul pe criteriu); același baseline
sintetic — utile pentru discriminarea politicilor, NU stimuli independenți de calitate a conținutului.
*Ce se poate afirma:* operator adjudication rejects T13 Agency = 6.5 despite a high aggregate score; this supports a non-compensatory
floor for this demonstrated T13 condition; v2 produces the operator-adjudicated outcome, v1 does not. NU: all non-critical criteria
require ≥ 7; NU: universal minCriterion=7 validated; NU: v2 quality policy validated; NU: v2 globally superior to v1.

*Extensie OBS-GS-20 (operatorul, la cazul 41, 2026-10-05) — specific threshold adjudication ≠ universal threshold validation.* v2
conține `minCriterion = 7` pentru toate cele 18 criterii; gold-v1 oferă aici un singur stimul (T13 = 6,5). Self-consistency-ul *T13 =
6.5 → v2 universal rule rejects → Gold says negative* nu demonstrează independent că aceeași regulă e potrivită pentru T02, T03, T04,
T05, T06 etc. *Case 41 supports the v2 outcome for T13=6.5, but case 41 alone does not independently validate the universal
minCriterion=7 policy across all 18 criteria.* Există dovadă editorială în favoarea unui minim și pentru anumite criterii necritice, dar
nu încă pentru forma universală exactă. Direcții pentru setul v2 (nu se creează acum): criterii unde < 7 trebuie clar să blocheze;
criterii unde o slăbiciune moderată poate fi compensabilă; criterii dependente de context; criterii inaplicabile anumitor structuri;
combinații de două sau mai multe slăbiciuni moderate; un singur defect sever ascuns de o medie mare — apoi decizia între **one
universal floor** și **criterion-specific floors / criterion classes / applicability-aware thresholds** (nu se decide și nu se
implementează acum). Circularitatea nu se reproduce în v2: NU doar „T04 = 6.9 → negative, T05 = 6.9 → negative…”, ci conținut relevant,
dovadă relevantă pentru criteriu, evaluare justificată, adjudecare independentă a operatorului și cazuri-limită controlate.

*Extensie OBS-GS-12 (operatorul, la cazul 41, 2026-10-05) — policy-domain coverage.* O regulă cu domeniu de 18 criterii e exersată de un
caz de aur într-o singură instanță (T13): **rule coverage ≠ policy-domain coverage** — testul unei instanțe a unei reguli universale nu
validează toate instanțele ei.

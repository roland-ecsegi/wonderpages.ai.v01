---
name: texte-pentru-editor
description: Regulile pentru orice text pe care îl vede editorul (interfață, mesaje de eroare, documentație). Folosește-o când modifici public/, mesaje din server/ sau docs/.
---
# Textele pentru editor

- Totul în română, cu diacritice (ă, â, î, ș, ț cu virgulă), la persoana a doua („tu”), propoziții scurte, fără jargon tehnic.
- Mesajele de eroare spun ce s-a întâmplat și ce face editorul acum („Canva nu este conectat. Setări > Conectează Canva.”), niciodată detalii interne.
- Nu promite costuri: textul merge doar prin abonamentul Claude Pro (Claude Code), imaginile prin Canva Pro sau ChatGPT. Nu menționa chei API ca opțiune.
- Accesibilitate: butoane reale (`<button>`), etichete pe câmpuri (`<label>` sau `aria-label`), contrast din variabilele `--*-ink`; nicio informație transmisă doar prin culoare.
- Codul de client e în `public/app/*.js` (fără scripturi inline: CSP-ul le blochează).

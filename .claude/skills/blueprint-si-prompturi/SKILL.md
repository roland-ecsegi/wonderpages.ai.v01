---
name: blueprint-si-prompturi
description: Cum schimbi un prompt sau adaugi o variantă de prompt fără să pierzi măsurătorile. Folosește-o când cererea privește calitatea textelor, rubrica sau variantele (script, script_b...).
---
# Prompturi și variante

- Ordinea blocurilor contează (prefix stabil, plan 1.4): întâi ce e la fel pentru toată colecția (rubrică, profil de vârstă, Story Bible), apoi volumul, apoi sarcina și formatul JSON.
- O schimbare de calitate se face ca VARIANTĂ nouă (de exemplu `script_c` în `prompts` și în `stages[].prompt_variants`), nu prin rescrierea celei existente. Competiția (plan 3.7) și Setul de aur (3.6) decid.
- Rubrica are coduri (T01–T18 text, V01–V04 imagini); criteriile critice au `"critical": true`. Nu renumerota codurile: lecțiile și registrul le folosesc.
- Schema din `schemas` trebuie să rămână compatibilă cu promptul (aceleași câmpuri obligatorii).

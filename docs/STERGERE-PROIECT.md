# Ștergerea definitivă a unui proiect — v19.0.1

Butonul **Șterge definitiv…** este în Proiect > Activitate > Proiect, pe laptop, pentru un proiect pregătit, în pauză, la revizuire, finalizat sau arhivat. Dacă proiectul lucrează, pune-l mai întâi pe pauză. Scrie `ȘTERGE` în dialog. Nu este nevoie să arhivezi proiectul.

Ștergerea elimină datele proiectului din PostgreSQL, fișierele din `data/projects/<id>`, livrările din folderul principal și copia lor din al doilea folder, imaginile din backupul de fișiere, urmele din registrul de consum și învățare, precum și referințele din backupurile SQL gestionate de aplicație. Fișierele urcate de aplicație în Google Drive sunt șterse dacă Drive este conectat; în caz contrar, operația se oprește înainte de ștergerea locală. Dacă al doilea folder este configurat dar inaccesibil, operația se oprește de asemenea. Rezultatul apare într-un raport pe ecran, inclusiv eventualele erori.

Statisticile vechi de preferințe, variante de prompt și erori vizuale nu au proveniență pe proiect. De aceea, ștergerea unui proiect le resetează pentru toate proiectele. Lecțiile și exemplele care indică proiectul sunt eliminate. Arhivele de import păstrate de utilizator în `app.kit.versions/projects` nu sunt gestionate de aplicație și rămân disponibile pentru reimport.

**Limită externă:** conținutul creat în contul Canva nu poate fi șters prin conectorul actual. Raportul afișează linkurile disponibile pentru eliminare manuală din Canva. Copiile făcute manual în afara directoarelor configurate și backupurile sistemului de operare nu pot fi inventariate de aplicație. „Șters definitiv” descrie datele și directoarele gestionate de WonderPages, nu o ștergere criminalistică a discului.

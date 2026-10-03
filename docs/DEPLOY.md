# Deploy na Railway

Servis je jedan Node proces (`npm start`, `src/server.ts`), buildan iz `Dockerfile`. Ništa ne sprema na disk. Railway radi novi deploy na svaki push na `main`.

## 1. Anthropic API ključ s limitom potrošnje

Produkcija koristi poseban ključ, ne lokalni iz `.env`.

1. U Anthropic konzoli (console.anthropic.com) otvori **Settings → Workspaces** i napravi workspace `ponuda-prezentacija`.
2. U tom workspaceu postavi mjesečni limit potrošnje (**Limits**), npr. 10 $. Jedna ponuda košta oko 0,10 $.
3. U istom workspaceu napravi novi API ključ i kopiraj ga. Konzola ga pokaže samo jednom.

## 2. Lozinka

Generiraj nasumičnu lozinku (najmanje 16 znakova, server se inače ne pokrene):

```
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

Spremi je u password manager. Istu lozinku daješ mami.

## 3. Railway projekt

1. Na railway.com se prijavi preko GitHuba. Plan **Hobby** (5 $/mj, uključuje 5 $ potrošnje).
2. **New Project → Deploy from GitHub repo → `travel-offer-presentation`**. Railway sam nađe `Dockerfile`.
3. U servisu otvori **Variables** i dodaj:
   - `ANTHROPIC_API_KEY` = ključ iz koraka 1
   - `APP_PASSWORD` = lozinka iz koraka 2

   `PORT` postavlja Railway sam.
4. **Settings → Networking → Generate Domain**. Promijeni ime u `ponuda-prezentacija` → adresa je `https://ponuda-prezentacija.up.railway.app`. Ako je ime zauzeto, uzmi drugo bez riječi "polet".
5. Pričekaj da deploy bude zelen (**Deployments**). U logu mora pisati `Server listening at http://0.0.0.0:...`.

## 4. Provjera

1. Otvori adresu. Preglednik pita korisničko ime i lozinku. Korisničko ime može biti bilo što, vrijedi samo lozinka.
2. Povuci jednu ponudu iz `test/fixtures/` i preuzmi .pptx.

## Za mamu

- Adresa: `https://ponuda-prezentacija.up.railway.app` (spremiti u favorite).
- Kad preglednik pita: korisničko ime bilo što (npr. `mama`), lozinka iz koraka 2. Označiti "zapamti".
- Podržane su datoteke .odt, .docx i .pdf. Datoteku .doc treba u Wordu spremiti kao .docx.

## Zaštita

- Lozinka (basic auth preko HTTPS-a) na svim adresama.
- Najviše 20 zahtjeva za izradu na sat po IP adresi.
- Datoteka najviše 20 MB, samo .odt/.docx/.pdf.
- Mjesečni limit potrošnje na API ključu (korak 1).

## Promjena lozinke ili ključa

Promijeni vrijednost u **Variables**. Railway sam ponovno pokrene servis.

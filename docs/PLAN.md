# Ponuda → Prezentacija — plan implementacije

Alat za PA Polet Vinkovci: iz ponude za školsko putovanje (.odt/.doc/.docx/.pdf) jednim klikom napraviti gotovu .pptx prezentaciju po fiksnom templateu.

Korisnik: jedna osoba (mama), ne-tehnička, radi u pregledniku. Nema Claude račun. Ponuda je prilikom učitavanja već pregledana i konačna.

Tok iz njezine perspektive: **otvori stranicu → povuče ponudu → klikne "Kreiraj prezentaciju" → skine .pptx.** Sve ostalo je nevidljivo.

---

## 1. Arhitektura

```
[Browser: 1 stranica]
   │ POST /api/generate (multipart, file)
   ▼
[Node servis]
   1. convert   ponuda → čisti tekst        (LibreOffice headless; .odt/.docx i direktno iz XML-a)
   2. extract   tekst → Ponuda JSON          (Claude API, structured output po JSON shemi)
   3. validate  Ponuda JSON → upozorenja[]   (deterministička pravila, bez LLM-a)
   4. render    Ponuda JSON → .pptx          (pptxgenjs, fiksni template)
   │
   ▼
{ pptx (download), upozorenja[] }
```

Načela:
- **Jedan ugovor: `Ponuda` JSON shema.** Ekstrakcija je jedini dio koji "razumije" tekst; renderer je 100 % deterministički i nikad ne vidi izvorni dokument. Ista ponuda → uvijek ista prezentacija.
- **LLM samo za ekstrakciju**, nikad za dizajn ni za tekst koji ide u prezentaciju (prepisuje doslovno, ne prepričava).
- **Bez baze, bez sesija, bez korisničkih računa.** Stateless request. Jedino trajno stanje: mapa s fotkama i logotipima na disku.
- **Validacija ne blokira.** Prezentacija se uvijek generira; upozorenja se prikažu uz download ("Cijena nije pronađena", "Dan 5 nedostaje").

## 2. Tehnologija (i zašto)

| Sloj | Izbor | Razlog |
|---|---|---|
| Runtime | Node 22 + TypeScript | pptxgenjs je Node lib, generator već postoji u Node-u; jedan jezik za sve |
| HTTP | Fastify (ili Hono) | minimalan, multipart out-of-box |
| Frontend | jedna statična HTML stranica (vanilla TS + malo CSS), servira je isti proces | jedan upload i jedan gumb ne opravdavaju React/Next |
| Konverzija | LibreOffice headless (`soffice --convert-to txt`) u Dockeru; za .odt/.docx fallback čitanje `content.xml` / `document.xml` direktno | .doc (binarni Word) i .pdf nemaju čist JS parser; soffice pokriva sve formate koje mama koristi |
| Ekstrakcija | `@anthropic-ai/sdk`, Claude Sonnet, tool-use / structured output s JSON shemom | robusno na varijacije u ponudama; cijena po ponudi zanemariva |
| Shema/validacija | Zod (shema se generira u JSON Schema za Claude i koristi za runtime validaciju) | jedan izvor istine |
| Renderer | pptxgenjs (port postojećeg `build.js`) | već napravljen i testiran template |
| Ikone | react-icons → SVG → PNG (sharp) u build-time, spremljene u `assets/icons/` | ne renderirati ikone na svaki request |
| Deploy | Docker (node + libreoffice) na Hetzner CX22 / Fly.io / Railway | treba LibreOffice, znači vlastiti container, ne serverless |
| Auth | jedan zajednički pristupni ključ (basic auth ili `?key=` u cookieju) | javni URL, jedan korisnik; dovoljno |
| Testovi | nema automatskih testova; provjera je ručna (otvoriti .pptx, pregledati JSON) | odluka vlasnika projekta |

## 3. `Ponuda` JSON shema (ugovor)

```ts
type Ponuda = {
  narucitelj: string;              // "Gimnazija Vinkovci"
  kontaktOsoba?: string;           // "n/p gđa. Sanja Cikač"
  brojPonude?: string;             // "08/2018"
  datumPonude?: string;            // "12.09.2019."
  naslov: string;                  // "KLASIČNA GRČKA I ZAKYNTHOS"
  termin?: string;                 // "20.08. – 01.09.2019."  (kako piše u ponudi)
  brojDana?: number;               // izvedeno iz programa
  grupa?: { ucenici?: number; nastavnici?: number; ukupno?: number; opis?: string };
  polazak?: string;                // tekst prije "1. dan" ("Polazak ispred škole u 21:00")
  prijevoz?: {                     // LLM klasificira iz teksta; opis doslovno ako postoji rečenica o prijevozu
    vrste: ("autobus" | "brod" | "trajekt" | "avion" | "vlak")[];
    opis?: string;
  };
  dani: Array<{
    redni: number;                 // 1..n
    oznaka: string;                // "1. dan" / "PRVI DAN" — kako piše
    datum?: string;                // "13.04.2019., subota"
    tekst: string;                 // doslovni narativ dana
    lokacije: string[];            // ["Venecija", "Patras"] — za fotke, LLM izvlači
  }>;
  cijena?: {
    iznos?: number; valuta: "EUR"; tekst: string;            // tekst = kako piše ("640,00 €"); uvijek EUR
    baza?: string;                 // "na bazi 20 putnika"
    varijante?: Array<{ opis: string; tekst: string }>;       // 2 hotela, 2 cijene
    doplate?: Array<{ opis: string; tekst?: string }>;        // "1/1 soba – 130 kn"
  };
  ukljucuje: string[];
  neUkljucuje: string[];           // s cijenama ulaznica ako pišu
  fakultativno: string[];          // "doplate prema želji grupe"
  placanje: string[];              // stavke kako pišu
  pogodnosti: string[];            // gratis mjesta, povrat novca... ako pišu u ponudi
  napomene: string[];
  potpis?: { ime?: string; tel?: string; email?: string; datum?: string };
  meta: { izvorniNazivDatoteke: string; ekstrakcijaModel: string; upozorenjaEkstrakcije: string[] };
};
```

Pravila za LLM (u system promptu):
- Tekst dana, stavki "uključuje/ne uključuje", plaćanja i napomena prepisuje **doslovno**, bez prepričavanja i bez "poboljšanja". Dopušteno: ukloniti višestruke razmake, popraviti očiti tipfeler (`Plačanja` → `Plaćanja`).
- Ne izmišlja: ako cijena ne piše, `cijena.iznos` je `null`, `cijena.tekst` je ono što piše ("CIJENA PUTOVANJA NA BAZI 55 UČENIKA...").
- Osiguranje/jamčevina (Croatia osiguranje, brojevi polica) ide u `ukljucuje` kao jedna stavka, skraćeno.
- `lokacije` = imena gradova/lokaliteta iz teksta dana, normalizirana (nominativ, bez velikih slova).

## 3a. Garancije konzistentnosti

- Renderer je deterministički kod (koordinate, boje, fontovi, redoslijed slajdova hardkodirani). Isti JSON → identičan .pptx. LLM ne zna da .pptx postoji.
- Skup i redoslijed slajdova su fiksni; varira samo broj slajdova s danima, po pravilu (2 po slajdu).
- Rubni slučajevi (predug dan, više varijanti cijene, prazna sekcija) su `if` grane u kodu, ne odluke LLM-a.
- Ekstrakcija: `temperature: 0`, pravilo po polju u promptu.

## 4. Validacija (deterministička, vraća upozorenja)

Svako pravilo: `{ polje, poruka, razina: "greska" | "upozorenje" }`. Nikad ne blokira generiranje.

| Pravilo | Razina |
|---|---|
| `cijena.iznos` prazan ili 0 | greška |
| `dani` prazan | greška |
| Redni brojevi dana nisu 1..n bez rupa i duplikata | greška |
| `brojDana` iz termina (datum od–do) ≠ `dani.length` | upozorenje |
| `narucitelj` prazan | greška |
| `termin` prazan ili u prošlosti | upozorenje |
| `ukljucuje` prazan | upozorenje |
| `placanje` prazan | upozorenje |
| Dan s < 40 znakova teksta | upozorenje |
| Valuta nije EUR / tekst sadrži "kn" (cijene su uvijek u EUR) | upozorenje |
| Broj dana > 12 (sumnjivo dug program / dupla ponuda u fajlu) | upozorenje |
| Tekst spominje drugu destinaciju nego naslov (npr. "Zadar" u ponudi za London) — usporedba `lokacije` vs. `naslov` | upozorenje |
| `meta.upozorenjaEkstrakcije` (LLM sam javi što nije bio siguran) | upozorenje |

Prikaz: iznad gumba za download, žuta/crvena lista. Uz svaku poruku broj slajda na koji utječe.

## 5. Renderer (template)

Port `build.js` iz nacrta u `src/render/`:
- `render(ponuda: Ponuda, assets: Assets): Promise<Buffer>`
- Jedan modul po tipu slajda: `naslovna`, `ukratko`, `oAgenciji`, `dani`, `cijena`, `placanje`, `napomene`, `hvala`.
- Fiksni sadržaj (o agenciji, certifikati, kontakt, pogodnosti koje nisu u ponudi) u `config/agencija.json` — mama/ti mijenjate bez koda.
- Program po danima: 2 dana po slajdu; ako tekst dana > ~900 znakova, taj dan sam na slajdu. Font se ne smanjuje ispod 12 pt — radije novi slajd.
- Slajd "Cijena": ako `cijena.varijante` ima > 1, prikaz kao 2–3 kartice umjesto jedne brojke.
- "Ukratko" slajd: 4 fiksne kartice, sve izračunate u kodu, nikad iz slobodnog teksta LLM-a: (1) dani = `dani.length`, (2) noćenja = broj dana čiji `tekst` sadrži "noćenje", (3) grupa = `grupa` ili `cijena.baza`, (4) prijevoz = `prijevoz.vrste` (ikona i naslov po enumu). Kartica čiji podatak fali se izostavlja (3 kartice umjesto 4) — ništa se ne izmišlja. Ruta = prva lokacija po danu, deduplicirano.
- `placanje` i `pogodnosti`: obične liste (`string[]`), jedna ikona po sekciji. Bez biranja ikona po ključnim riječima.
- Kontakt na "Hvala" slajdu: uvijek iz `config/agencija.json`, nikad iz `potpis`.
- Opće pravilo: shema sadrži samo ono što doslovno piše u ponudi (plus enume koje LLM klasificira). Sva logika prikaza je u kodu; kad podatak fali, element se izostavi.
- Fotografije: `assets/foto/<lokacija>/*.jpg`; za svaki dan uzmi prvu lokaciju koja ima mapu; nema fotke → placeholder ostaje. Mapiranje `lokacije → mapa` preko `config/lokacije.json` (aliasi: "atena" → "Atena", "budimpesta" → "Budimpešta").
- Optimizacija slika: sharp resize na max 1600 px, JPEG q80 (stare prezentacije su bile 22–53 MB).

## 6. API

```
GET  /                    stranica
POST /api/generate        multipart {file}  → 200 { id, upozorenja[] , download: "/api/download/:id" }
GET  /api/download/:id    .pptx (ime: "<naslov> – <narucitelj>.pptx"), briše se nakon 1 h
POST /api/extract         (debug) → Ponuda JSON, za razvoj i testove
```

Ograničenja: max 20 MB upload, samo .odt/.doc/.docx/.pdf, timeout 120 s.

## 7. Struktura repozitorija

```
ponuda-prezentacija/
  src/
    server.ts            Fastify, rute, static
    convert/             soffice wrapper + odt/docx XML fallback
    extract/             claude klijent, system prompt, shema → JSON schema
    validate/            pravila
    render/              pptxgenjs template (po slajdu)
    schema/ponuda.ts     Zod
  config/agencija.json   fiksni tekstovi, kontakt
  config/lokacije.json   aliasi lokacija → mape fotki
  assets/logo/ assets/cert/ assets/icons/ assets/foto/
  public/index.html      UI
  examples/*.json        ručno napisane Ponuda JSON datoteke (ulaz za `npm run render`)
  test/fixtures/         uzorci ponuda i referentne prezentacije (samo za ručnu usporedbu)
  Dockerfile             node:22 + libreoffice-writer + fonts (Carlito za Calibri)
  CLAUDE.md
```

## 8. Milestones (redoslijed za Claude Code)

**M1 — Renderer iz JSON-a** (bez LLM-a)
- Scaffold repo, TS (bez testova; Dockerfile u M4).
- Zod shema `Ponuda`.
- Port `build.js` → `render()`; ručno napisan `examples/grcka.json` i `examples/budimpesta.json` kao ulaz.
- Provjera: ručni vizualni pregled u PowerPointu.
- ✅ Kad: `npm run render examples/grcka.json` da isti .pptx kao nacrt.

**M2 — Konverzija + ekstrakcija**
- `convert()` za odt/docx (XML) i doc/pdf (soffice).
- `extract()` s Claude API, structured output.
- Skinuti 12 ponuda s Drivea kao uzorke (raznih godina, s/bez cijene, s 2 varijante hotela, kn i €).
- ✅ Kad: ručni pregled JSON-a za 5 uzoraka ne pokaže izmišljene ni izgubljene podatke.

**M3 — Validacija**
- Pravila iz §4.

**M4 — Web + API + deploy**
- `index.html`: drag&drop, progress, lista upozorenja, gumb download.
- Auth ključ, rate limit, čišćenje privremenih datoteka.
- Docker build, deploy na VPS, HTTPS (Caddy).
- ✅ Kad: mama sama od ponude do .pptx bez tebe.

**M5 — Fotke i finese** (kad se skupe resursi)
- `assets/foto/`, mapiranje lokacija, optimizacija.
- Novi logo / boje ako ih agencija promijeni — samo `config` + `assets`.

## 9. Otvorena pitanja (odgovoriti prije M2)
1. Koje formate mama stvarno predaje danas? (Drive: većina .odt, dio .doc) — ako je uvijek .odt, soffice u Dockeru je opcionalan.
2. ~~Cijena~~ — odgovoreno: uvijek EUR.
3. Gdje hostati — imaš li već VPS?
4. Treba li i PDF export prezentacije uz .pptx? (soffice već u containeru → trivijalno.)

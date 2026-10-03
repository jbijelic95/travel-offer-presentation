# Ponuda → Prezentacija — plan implementacije

Alat za PA Polet Vinkovci: iz ponude za školsko putovanje (.odt/.docx/.pdf) jednim klikom napraviti gotovu .pptx prezentaciju po fiksnom templateu.

Korisnik: jedna osoba (mama), ne-tehnička, radi u pregledniku. Nema Claude račun. Ponuda je prilikom učitavanja već pregledana i konačna.

Tok iz njezine perspektive: **otvori stranicu → povuče ponudu → klikne "Kreiraj prezentaciju" → skine .pptx.** Sve ostalo je nevidljivo.

---

## 1. Arhitektura

```
[Browser: 1 stranica]
   │ POST /api/generate (multipart, file)
   ▼
[Node servis]
   1. convert   ponuda → čisti tekst        (.odt/.docx: direktno iz XML-a; .pdf ostaje PDF)
   2. extract   tekst/PDF → Ponuda JSON      (Claude API, structured output po JSON shemi; PDF kao document blok)
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
| Konverzija | .odt/.docx: čitanje `content.xml` / `document.xml` direktno (jszip); .pdf: bez konverzije, šalje se Claudeu kao `document` blok | bez LibreOffice-a; API sam čita PDF. .doc (binarni Word) nije podržan — mama ga sprema kao .odt/.docx |
| Ekstrakcija | `@anthropic-ai/sdk`, najnoviji Claude Sonnet (točan ID fiksiran u `config/extract.json`, sada `claude-sonnet-5-5`), structured output (`output_config.format`) s JSON shemom | robusno na varijacije u ponudama; cijena po ponudi oko 0,10 $ |
| Shema/validacija | Zod (shema se generira u JSON Schema za Claude i koristi za runtime validaciju) | jedan izvor istine |
| Renderer | pptxgenjs (port postojećeg `build.js`) | već napravljen i testiran template |
| Ikone | react-icons → SVG → PNG (sharp) u build-time, spremljene u `assets/icons/` | ne renderirati ikone na svaki request |
| Deploy | Docker (samo node) na Hetzner CX22 / Fly.io / Railway | jedan proces, privremene datoteke na disku; bez LibreOffice-a |
| Auth | jedan zajednički pristupni ključ (basic auth ili `?key=` u cookieju) | javni URL, jedan korisnik; dovoljno |
| Testovi | nema unit testova; `npm run check` uspoređuje SHA-256 renderiranih primjera, ostalo je ručni pregled | odluka vlasnika projekta |

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
  pogodnosti: string[];            // samo iz izričite sekcije "Agencija odobrava" / "Pogodnosti", inače []
  napomene: string[];
  potpis?: { ime?: string; tel?: string; email?: string; datum?: string };
  meta: { izvorniNazivDatoteke: string; ekstrakcijaModel: string; upozorenjaEkstrakcije: string[] };
};
```

Pravila za LLM (u system promptu):
- Tekst dana, stavki "uključuje/ne uključuje", plaćanja i napomena prepisuje **doslovno**, bez prepričavanja i bez "poboljšanja". Dopušteno: ukloniti višestruke razmake, popraviti očiti tipfeler (`Plačanja` → `Plaćanja`).
- Ne izmišlja: ako cijena ne piše, `cijena.iznos` je `null`, `cijena.tekst` je ono što piše ("CIJENA PUTOVANJA NA BAZI 55 UČENIKA...").
- Osiguranje/jamčevina (Croatia osiguranje, brojevi polica) ide u `ukljucuje` kao jedna stavka, skraćeno.
- `lokacije` = imena gradova/lokaliteta iz teksta dana, normalizirana (nominativ, bez velikih slova). **Prva lokacija je glavno odredište dana**: mjesto gdje se odvija većina programa; na danu putovanja mjesto gdje dan završava. Ruta na slajdu "Ukratko" = prva lokacija svakog dana.
- **Svaka rečenica ponude ide u točno jedno polje**, prema tome gdje stoji u ponudi. Nema dupliciranja (npr. "dva gratis mjesta" u listi "Cijena uključuje" ide samo u `ukljucuje`).
- `pogodnosti` samo iz izričite sekcije ("Agencija odobrava", "Pogodnosti"); ako je nema, `[]`.
- `polazak` = samo tekst prije prvog zaglavlja dana. Tekst ispod "1. dan" ostaje u danu 1.
- Jednodnevni izlet bez zaglavlja "1. dan": `dani` = `[]`, cijeli program ide u `polazak` (nema zaglavlja, pa je sve "prije prvog dana"). Oznaka "1. dan" se ne izmišlja.
- Cijena u kunama ("545Kn"): `iznos` = `null`, `valuta` = "EUR", `tekst` kako piše, plus redak u `meta.upozorenjaEkstrakcije`. Nikad ne preračunava valute.
- `meta.izvorniNazivDatoteke` i `meta.ekstrakcijaModel` popunjava kod, ne LLM. Kod postavlja i `brojDana` (= `dani.length`) i `valuta` ("EUR").
- Shema koju LLM dobiva (`src/extract/index.ts`, `Ekstrakcija`) je ravna: sva polja obavezna, bez `null`. Prazno = `""` / `0` / `[]`, a kod to pretvara u polje koje nedostaje prije `Ponuda.parse`. Razlog: opcionalna polja i unije prerastu gramatiku structured outputa (API vraća 400 "Schema is too complex").
- Tekst koji ne pripada nijednoj sekciji ide u `napomene`; ništa se ne izbacuje.

## 3a. Garancije konzistentnosti

- Renderer je deterministički kod (koordinate, boje, fontovi, redoslijed slajdova hardkodirani). Isti JSON → identičan .pptx. LLM ne zna da .pptx postoji.
- Skup i redoslijed slajdova su fiksni; varira samo broj slajdova s danima, po pravilu (2 po slajdu).
- Rubni slučajevi (predug dan, više varijanti cijene, prazna sekcija) su `if` grane u kodu, ne odluke LLM-a.
- Ekstrakcija: model fiksiran točnim ID-om, pravilo po polju u promptu, shema nameće strukturu. `temperature` se ne šalje ako je model ne prihvaća (Sonnet 5.5 vraća 400 na bilo koju vrijednost osim zadane). LLM izlaz zato nije bajt-identičan između pokretanja; renderer jest.

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

`src/render/` (port nacrta `prototype/build.js`, obrisan nakon M1):
- `render(ponuda: Ponuda, agencija: Agencija): Promise<Buffer>`
- Jedan modul po tipu slajda: `naslovna`, `ukratko`, `oAgenciji`, `dani`, `cijena`, `placanje`, `napomene`, `hvala`.
- Fiksni sadržaj agencije u `config/agencija.json`: kontakt, "o agenciji" i certifikati. Ništa više. Pogodnosti dolaze samo iz ponude.
- Determinizam: datumi u `docProps/core.xml` i u zip zapisima su fiksni (`src/render/deterministic.ts`), pa isti JSON daje isti SHA-256.
- Program po danima: 2 dana po slajdu, `polazak` (ako postoji) je prva kartica, s oznakom "Polazak"; kad je `dani` prazan, oznaka je "Program". Font je 13 pt i ne smanjuje se. Mjesto za fotku se smanjuje s 1,6 na 1,0 in kad tekstu treba prostora. Ako tekst ni tada ne stane u pola slajda (procjena po broju redaka, otprilike 650 znakova), taj dan je sam na slajdu, preko cijele širine.
- Slajd "Cijena": ako `cijena.varijante` ima > 1, prikaz kao 2–3 kartice umjesto jedne brojke. Bez `cijena.iznos` prikazuje se `___,__ €`.
- "Uključuje", "ne uključuje" i doplate teku u dva stupca. Što ne stane, ide na slajd "Cijena putovanja (nastavak)". Doplate su u tamnom okviru s cijenom; ako tamo ne stanu (npr. uz 3 varijante), idu na kraj desne liste.
- "Napomene": što ne stane, ide na slajd "Napomene (nastavak)". Prazna sekcija ili slajd se izostavlja.
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

Ograničenja: max 20 MB upload, samo .odt/.docx/.pdf (.doc se odbija s porukom "Spremite ponudu kao .odt ili .docx"), timeout 120 s.

## 7. Struktura repozitorija

```
ponuda-prezentacija/
  src/
    server.ts            Fastify, rute, static
    convert/             odt/docx → tekst iz XML-a; pdf prolazi kao PDF
    extract/             claude klijent, system prompt, shema → JSON schema
    validate/            pravila
    render/              pptxgenjs template (po slajdu)
    schema/ponuda.ts     Zod
    cli/                 render.ts (npm run render), check.ts (npm run check), extract.ts (npm run extract)
  scripts/build-icons.ts react-icons → PNG u assets/icons/ (npm run icons)
  config/agencija.json   kontakt, o agenciji, certifikati
  config/extract.json    točan ID Claude modela za ekstrakciju
  config/lokacije.json   aliasi lokacija → mape fotki
  assets/logo/ assets/cert/ assets/icons/ assets/foto/
  public/index.html      UI
  examples/*.json        ručno napisane Ponuda JSON datoteke (ulaz za `npm run render`)
  examples/*.sha256      očekivani SHA-256 renderiranog .pptx (za `npm run check`)
  test/fixtures/         uzorci ponuda i referentne prezentacije (samo za ručnu usporedbu)
  test/fixtures/unsupported/  .doc uzorci, samo kao tekst (alat ih ne čita)
  Dockerfile             node:22
  CLAUDE.md
```

## 8. Milestones (redoslijed za Claude Code)

**M1 — Renderer iz JSON-a** (bez LLM-a) — ✅ gotovo
- Scaffold repo, TS (bez unit testova; Dockerfile u M4).
- Zod shema `Ponuda`.
- Port `prototype/build.js` → `render()`; `prototype/` obrisan. Ulaz: `examples/grcka.json` i `examples/budimpesta.json`.
- `npm run render -- <ponuda.json>` → `out/<ime>.pptx`.
- `npm run check`: renderira svaki `examples/*.json` i uspoređuje SHA-256 s `examples/<ime>.sha256`. Razlika = greška. Nakon namjerne promjene izgleda: pregledati `out/*.pptx` u PowerPointu, pa `npm run check -- --update`.
- ✅ Kad: `npm run check` prolazi, a `out/grcka.pptx` izgleda kao nacrt `test/fixtures/reference/grcka-nacrt-v1.pptx` (sadržaj kartica i lista po pravilima iz §5).

**M2 — Konverzija + ekstrakcija**
- `convert()` za odt/docx (XML); pdf ide Claudeu kao `document` blok.
- `extract()` s Claude API, structured output.
- `npm run extract -- <ponuda> [--pptx]` → `out/<ime>.json` (i `out/<ime>.pptx`).
- ✅ Uzorci s Drivea u `test/fixtures/` (.doc u `unsupported/`).
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
1. ~~Formati~~ — odgovoreno: podržani su samo .odt, .docx i .pdf. .doc nije podržan; bez LibreOffice-a.
2. ~~Cijena~~ — odgovoreno: uvijek EUR.
3. Gdje hostati — imaš li već VPS?
4. Treba li i PDF export prezentacije uz .pptx? (Bez soffice-a u containeru to više nije besplatno.)

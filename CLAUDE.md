# travel-offer-presentation

Alat za PA Polet Vinkovci: iz ponude za školsko putovanje (.odt/.doc/.docx/.pdf) jednim klikom generira .pptx prezentaciju po fiksnom templateu.

**Prvo pročitaj `docs/PLAN.md`** — arhitektura, tehnologija, JSON shema `Ponuda`, validacijska pravila, milestones (M1–M5). Plan je izvor istine; ako ga kod mijenja, ažuriraj i plan.

## Što je u repou (polazna točka)
- `docs/PLAN.md` — plan implementacije
- `prototype/build.js` — nacrt generatora (pptxgenjs) s hardkodiranim podacima za Grčku; M1 = portati ovo u `src/render/` tako da čita `Ponuda` JSON
- `assets/logo/`, `assets/cert/` — logo i certifikati izrezani iz stare prezentacije (jedino što imamo; zamijeniti kad stignu bolji)
- `test/fixtures/grcka-gimnazija-9-dana.odt` — prva fixture ponuda (bez upisane cijene — namjerno, test za validaciju)
- `test/fixtures/reference/` — stara prezentacija agencije (kako je izgledalo) i nacrt v1 (kako treba izgledati)

## Pravila
- Jezik UI-ja i tekstova: hrvatski. Jezik koda i commitova: engleski.
- Renderer je deterministički: isti JSON → identičan .pptx. LLM se koristi samo u `src/extract/`.
- Cijene su uvijek u EUR.
- Minimalne, ciljane promjene; bez over-engineeringa (jedan korisnik, jedan proces, bez baze).
- Pokretanje prototipa: `cd prototype && npm i pptxgenjs react react-dom react-icons sharp && node build.js`

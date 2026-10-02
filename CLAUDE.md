# travel-offer-presentation

Alat za PA Polet Vinkovci: iz ponude za školsko putovanje (.odt/.doc/.docx/.pdf) jednim klikom generira .pptx prezentaciju po fiksnom templateu.

**Prvo pročitaj `docs/PLAN.md`** — arhitektura, tehnologija, JSON shema `Ponuda`, validacijska pravila, milestones (M1–M5). Plan je izvor istine; ako ga kod mijenja, ažuriraj i plan.

## Što je u repou
- `docs/PLAN.md` — plan implementacije
- `src/schema/ponuda.ts` — Zod shema `Ponuda` (ugovor ekstrakcija ↔ renderer)
- `src/render/` — renderer (pptxgenjs), jedan modul po slajdu u `slides/`
- `config/agencija.json` — kontakt, "o agenciji", certifikati
- `examples/*.json` — ručno napisane ponude; `examples/*.sha256` — očekivani hash renderiranog .pptx
- `assets/logo/`, `assets/cert/` — logo i certifikati izrezani iz stare prezentacije (jedino što imamo; zamijeniti kad stignu bolji)
- `assets/icons/` — ikone kao PNG, generirane s `npm run icons`
- `test/fixtures/grcka-gimnazija-9-dana.odt` — prva fixture ponuda (bez upisane cijene — namjerno, test za validaciju)
- `test/fixtures/reference/` — stara prezentacija agencije (kako je izgledalo) i nacrt v1 (kako treba izgledati)

## Pravila
- Jezik UI-ja i tekstova: hrvatski. Jezik koda i commitova: engleski.
- Renderer je deterministički: isti JSON → identičan .pptx. LLM se koristi samo u `src/extract/`.
- Cijene su uvijek u EUR.
- Minimalne, ciljane promjene; bez over-engineeringa (jedan korisnik, jedan proces, bez baze).
- Bez unit testova. Provjera: `npm run typecheck` i `npm run check`.

## Naredbe
- `npm run render -- examples/grcka.json` — renderira ponudu u `out/grcka.pptx`
- `npm run check` — renderira sve `examples/*.json` i uspoređuje SHA-256 s `examples/<ime>.sha256`; pada na razlici
- `npm run check -- --update` — nakon namjerne promjene izgleda (prvo pregledaj `out/*.pptx`)
- `npm run icons` — nakon dodavanja ikone u `src/render/icons.ts`
- `npm run typecheck`

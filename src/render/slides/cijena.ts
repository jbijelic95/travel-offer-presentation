import type { Ponuda } from "../../schema/ponuda.js";
import { iconPath } from "../icons.js";
import { BOTTOM, footer, label, lineHeight, lines, newSlide, T, title, type Ctx, type Slide } from "../parts.js";
import { C, M, W } from "../theme.js";

const PLACEHOLDER = "___,__ €";

/** 1250.5 → "1.250,50 €" (hr-HR, fixed so output never depends on the machine's locale). */
export function eur(n: number): string {
  const [int, dec] = n.toFixed(2).split(".") as [string, string];
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec} €`;
}

// ---------- right side: "uključuje" / "ne uključuje" flowing over columns ----------

type Blok =
  | { vrsta: "naslov"; tekst: string }
  | { vrsta: "stavka"; tekst: string; kvacica: boolean; sekcija: string };
type Stupac = { x: number; w: number };

const ITEM_PT = 11.5, ITEM_GAP = 0.1, LABEL_H = 0.45;
const DOPLATE = "DOPLATE PREMA ŽELJI GRUPE";

const visina = (b: Blok, w: number) =>
  b.vrsta === "naslov" ? LABEL_H : lineHeight(lines(b.tekst, w - 0.28, ITEM_PT), ITEM_PT) + ITEM_GAP;

function sekcija(out: Blok[], naslov: string, stavke: string[], kvacica: boolean): void {
  if (!stavke.length) return;
  out.push({ vrsta: "naslov", tekst: naslov });
  for (const t of stavke) out.push({ vrsta: "stavka", tekst: t, kvacica, sekcija: naslov });
}

function blokovi(p: Ponuda, doplate: string[]): Blok[] {
  const out: Blok[] = [];
  sekcija(out, "CIJENA UKLJUČUJE", p.ukljucuje, true);
  sekcija(out, "CIJENA NE UKLJUČUJE", p.neUkljucuje, false);
  sekcija(out, DOPLATE, doplate, false);
  return out;
}

/** Draws blocks top to bottom, column by column. Returns the blocks that did not fit. */
function tok(s: Slide, bl: Blok[], stupci: Stupac[], y0: number): Blok[] {
  let i = 0;
  for (const st of stupci) {
    // A column that starts mid-list lines up with the items, not the heading, of the column before.
    let y = bl[i]?.vrsta === "stavka" ? y0 + LABEL_H : y0;
    while (i < bl.length) {
      const b = bl[i]!;
      let h = visina(b, st.w);
      // Keep a heading together with its first item.
      const next = bl[i + 1];
      const need = b.vrsta === "naslov" && next ? h + visina(next, st.w) : h;
      if (y + need > BOTTOM && y > y0 + LABEL_H) break;
      if (b.vrsta === "naslov") {
        label(s, b.tekst, st.x, y, st.w);
      } else {
        h -= ITEM_GAP;
        if (b.kvacica) s.addImage({ path: iconPath("FaCheck"), x: st.x, y: y + 0.05, w: 0.16, h: 0.16 });
        else s.addText("–", { ...T, x: st.x, y, w: 0.2, h: 0.2, fontSize: ITEM_PT, bold: true, color: C.red });
        s.addText(b.tekst, { ...T, x: st.x + 0.28, y, w: st.w - 0.28, h, fontSize: ITEM_PT, color: C.ink, valign: "top" });
        h += ITEM_GAP;
      }
      y += h;
      i++;
    }
  }
  return bl.slice(i);
}

// ---------- left side: price box ----------

const DOPLATE_PT = 12.5;

/** Draws the price box. Returns the doplate that did not fit in it (they go to the right-hand list). */
function cijenaBox(ctx: Ctx, s: Slide): string[] {
  const { pres, p } = ctx;
  const c = p.cijena;
  const x = M + 0.35, w = 3.5, bottom = 1.75 + 4.9 - 0.25;
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 1.75, w: 4.2, h: 4.9, fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.12 });
  s.addText("CIJENA", { ...T, x, y: 2.1, w, h: 0.35, fontSize: 11, color: "9A9AA0", charSpacing: 2 });

  let y = 2.5;
  if (c && c.varijante.length > 1) {
    for (const v of c.varijante) {
      s.addShape(pres.ShapeType.roundRect, { x: x - 0.1, y, w: w + 0.2, h: 0.8, fill: { color: "2A2A2E" }, line: { color: "2A2A2E" }, rectRadius: 0.08 });
      s.addText(v.opis, { ...T, x, y: y + 0.08, w, h: 0.25, fontSize: 10, color: "9A9AA0" });
      s.addText(v.tekst, { ...T, x, y: y + 0.33, w, h: 0.4, fontSize: 20, bold: true, color: C.white });
      y += 0.9;
    }
  } else {
    const big = c?.iznos != null ? eur(c.iznos) : PLACEHOLDER;
    s.addText(big, { ...T, x, y, w: 3.6, h: 1.1, fontSize: 44, bold: true, color: C.white });
    y += 1.1;
  }

  if (c?.baza) {
    const h = lineHeight(lines(c.baza, w, 12), 12);
    s.addText(c.baza, { ...T, x, y, w, h, fontSize: 12, color: "CFCFD3", valign: "top" });
    y += h;
  }

  const doplate = [
    ...p.fakultativno,
    ...(c?.doplate ?? []).map((d) => (d.tekst ? `${d.opis} – ${d.tekst}` : d.opis)),
  ];
  if (!doplate.length) return [];

  // Bullet indent 12 pt; paraSpaceAfter 4 pt.
  const listH = doplate.reduce((h, t) => h + lineHeight(lines(t, w - 12 / 72, DOPLATE_PT), DOPLATE_PT) + 4 / 72, 0);
  if (y + 0.7 + listH > bottom) return doplate;

  y += 0.3;
  s.addText(DOPLATE, { ...T, x, y, w, h: 0.35, fontSize: 11, color: "9A9AA0", charSpacing: 2 });
  y += 0.4;
  s.addText(
    doplate.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < doplate.length - 1 } })),
    { ...T, x, y, w, h: bottom - y, fontSize: DOPLATE_PT, color: C.white, valign: "top", paraSpaceAfter: 4 },
  );
  return [];
}

export function cijena(ctx: Ctx): void {
  const s = newSlide(ctx);
  title(s, "Cijena putovanja");
  const doplate = cijenaBox(ctx, s);

  const rx = M + 4.6, rw = W - M - rx, half = rw / 2 - 0.1;
  let ostatak = tok(s, blokovi(ctx.p, doplate), [{ x: rx, w: half }, { x: rx + rw / 2 + 0.1, w: half }], 1.75);
  footer(ctx, s);

  // Overflow: continuation slides with two full-width columns.
  const fw = (W - 2 * M - 0.4) / 2;
  while (ostatak.length) {
    const n = newSlide(ctx);
    title(n, "Cijena putovanja (nastavak)");
    const prvi = ostatak[0]!;
    if (prvi.vrsta === "stavka") ostatak = [{ vrsta: "naslov", tekst: `${prvi.sekcija} (NASTAVAK)` }, ...ostatak];
    const prije = ostatak.length;
    ostatak = tok(n, ostatak, [{ x: M, w: fw }, { x: M + fw + 0.4, w: fw }], 1.75);
    footer(ctx, n);
    if (ostatak.length === prije) throw new Error("Stavka cijene je preduga za slajd: " + ostatak[0]!.tekst.slice(0, 60));
  }
}

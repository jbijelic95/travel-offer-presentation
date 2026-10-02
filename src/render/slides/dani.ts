import type { Ponuda } from "../../schema/ponuda.js";
import { footer, lineHeight, lines, newSlide, T, title, type Ctx, type Slide } from "../parts.js";
import { C, M, W } from "../theme.js";

type Kartica = { oznaka: string; datum?: string; tekst: string };

const PT = 13, LS = 1.15;
const Y = 1.75, CARD_H = 4.9;
const TEXT_Y = 0.9; // text top, relative to card
const TEXT_MAX = CARD_H - TEXT_Y - 0.3; // text + photo + gap
const PHOTO_MAX = 1.6, PHOTO_MIN = 1.0, GAP = 0.2;
const HALF_W = (W - 2 * M - 0.4) / 2;
const FULL_W = W - 2 * M;

function kartice(p: Ponuda): Kartica[] {
  const out: Kartica[] = [];
  if (p.polazak) out.push({ oznaka: "Polazak", tekst: p.polazak });
  for (const d of p.dani) out.push({ oznaka: d.oznaka, datum: d.datum, tekst: d.tekst });
  return out;
}

const textHeight = (k: Kartica, cardW: number) => lineHeight(lines(k.tekst, cardW - 0.6, PT), PT, LS);

/** Fits in half a slide if the photo can shrink to PHOTO_MIN. */
const fitsHalf = (k: Kartica) => textHeight(k, HALF_W) <= TEXT_MAX - PHOTO_MIN - GAP;

/**
 * 2 days per slide. A day whose text does not fit in a half card gets a slide alone,
 * at full width. Font size never shrinks (PLAN §5).
 */
export function stranice(p: Ponuda): Kartica[][] {
  const pages: Kartica[][] = [];
  let cur: Kartica[] = [];
  for (const k of kartice(p)) {
    if (!fitsHalf(k)) {
      if (cur.length) pages.push(cur);
      pages.push([k]);
      cur = [];
      continue;
    }
    cur.push(k);
    if (cur.length === 2) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function kartica(ctx: Ctx, s: Slide, k: Kartica, x: number, cw: number): void {
  const { pres } = ctx;
  s.addShape(pres.ShapeType.roundRect, { x, y: Y, w: cw, h: CARD_H, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });

  const oznaka = k.oznaka.toUpperCase();
  const pw = Math.max(1.15, oznaka.length * 0.11 + 0.35);
  s.addShape(pres.ShapeType.roundRect, { x: x + 0.3, y: Y + 0.3, w: pw, h: 0.4, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.2 });
  s.addText(oznaka, { ...T, x: x + 0.3, y: Y + 0.3, w: pw, h: 0.4, align: "center", valign: "middle", fontSize: 11, bold: true, color: C.white, charSpacing: 1 });
  if (k.datum) {
    s.addText(k.datum, { ...T, x: x + 0.45 + pw, y: Y + 0.3, w: cw - pw - 0.75, h: 0.4, valign: "middle", fontSize: 11, color: C.mute });
  }

  const th = textHeight(k, cw);
  const ph = Math.min(PHOTO_MAX, Math.max(PHOTO_MIN, TEXT_MAX - GAP - th));
  const textH = TEXT_MAX - GAP - ph;
  s.addText(k.tekst, { ...T, x: x + 0.3, y: Y + TEXT_Y, w: cw - 0.6, h: textH, fontSize: PT, color: C.ink, valign: "top", lineSpacingMultiple: LS });

  // Photo placeholder (photos come in M5).
  const py = Y + CARD_H - ph - 0.3;
  s.addShape(pres.ShapeType.roundRect, { x: x + 0.3, y: py, w: cw - 0.6, h: ph, fill: { color: "E9E9EC" }, line: { color: "D0D0D5", width: 1, dashType: "dash" }, rectRadius: 0.1 });
  s.addText("FOTOGRAFIJA", { ...T, x: x + 0.3, y: py, w: cw - 0.6, h: ph, align: "center", valign: "middle", fontSize: 11, color: "A0A0A8", charSpacing: 3 });
}

export function dani(ctx: Ctx): void {
  const pages = stranice(ctx.p);
  pages.forEach((page, i) => {
    const s = newSlide(ctx);
    title(s, "Program putovanja", `${i + 1} / ${pages.length}  ·  ${ctx.p.naslov}`);
    const alone = page.length === 1 && !fitsHalf(page[0]!);
    page.forEach((k, j) => {
      if (alone) kartica(ctx, s, k, M, FULL_W);
      else kartica(ctx, s, k, M + j * (HALF_W + 0.4), HALF_W);
    });
    footer(ctx, s);
  });
}

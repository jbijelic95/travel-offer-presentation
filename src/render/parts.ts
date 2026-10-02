import type { Pres, Slide as PptxSlide } from "./pptx.js";
import type { Agencija } from "../config.js";
import type { Ponuda } from "../schema/ponuda.js";
import { C, F, H, M, W } from "./theme.js";

export type Slide = PptxSlide;

export type Ctx = {
  pres: Pres;
  p: Ponuda;
  a: Agencija;
};

/** Content area bottom, above the footer (inches). */
export const BOTTOM = H - 0.85;

// Shared text options. isTextBox + margin 0 keep pptxgenjs from adding its own padding.
export const T = { fontFace: F, lang: "hr-HR", isTextBox: true, margin: 0 } as const;

export function newSlide(ctx: Ctx, dark = false): Slide {
  const s = ctx.pres.addSlide();
  s.background = { color: dark ? C.dark : C.white };
  return s;
}

export function footer(ctx: Ctx, s: Slide): void {
  const k = ctx.a.kontakt;
  s.addImage({ path: ctx.a.logo, x: M, y: H - 0.62, w: 1.36, h: 0.3 });
  s.addText(`${k.web}  ·  ${k.tel}`, { ...T, x: W - M - 4, y: H - 0.65, w: 4, h: 0.35, align: "right", fontSize: 10, color: C.mute });
}

export function title(s: Slide, t: string, sub?: string): void {
  s.addText(t, { ...T, x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontSize: 30, bold: true, color: C.dark });
  if (sub) s.addText(sub, { ...T, x: M, y: 1.1, w: W - 2 * M, h: 0.35, fontSize: 13, color: C.mute });
}

/** Small red section label ("CIJENA UKLJUČUJE"). */
export function label(s: Slide, t: string, x: number, y: number, w: number): void {
  s.addText(t, { ...T, x, y, w, h: 0.35, fontSize: 11, bold: true, color: C.red, charSpacing: 2 });
}

export function pill(ctx: Ctx, s: Slide, x: number, y: number, n: string): void {
  const shape = ctx.pres.ShapeType.ellipse;
  s.addShape(shape, { x, y, w: 0.42, h: 0.42, fill: { color: C.red }, line: { color: C.red } });
  s.addText(n, { ...T, x, y, w: 0.42, h: 0.42, align: "center", valign: "middle", fontSize: 12, bold: true, color: C.white });
}

/** Dark slide with the red strip on the left (naslovna, hvala). */
export function darkSlide(ctx: Ctx): Slide {
  const s = newSlide(ctx, true);
  s.addShape(ctx.pres.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: H, fill: { color: C.red }, line: { color: C.red } });
  return s;
}

/**
 * Estimated number of lines `text` takes in a box `w` inches wide at `pt` points.
 * Calibri averages about 0.48 em per character. Calibrated on the prototype (44 chars at 3.3 in, 11.5 pt).
 */
export function lines(text: string, w: number, pt: number): number {
  const perLine = Math.max(1, Math.floor((w * 72) / (pt * 0.48)));
  return text
    .split("\n")
    .reduce((n, para) => n + Math.max(1, Math.ceil(para.length / perLine)), 0);
}

/** Height in inches of `n` lines at `pt` points with line spacing `ls`. */
export function lineHeight(n: number, pt: number, ls = 1.0): number {
  return (n * pt * 1.2 * ls) / 72;
}

/** Croatian plural: plural(5, "dan", "dana", "dana"). */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10, dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

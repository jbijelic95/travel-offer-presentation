import { readFileSync } from "node:fs";
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

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
const images = new Map<string, string>();

/**
 * Image file as pptxgenjs `data`. Never pass `path` to addImage: pptxgenjs writes it into
 * <p:cNvPr descr="…">, so the output would depend on the folder the repo is checked out in.
 */
export function img(file: string): string {
  let d = images.get(file);
  if (!d) {
    const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    const mime = MIME[ext];
    if (!mime) throw new Error(`Nepodržan format slike: ${file}`);
    d = `${mime};base64,${readFileSync(file).toString("base64")}`;
    images.set(file, d);
  }
  return d;
}

/** Pixel size from the PNG or JPEG header. */
function imageSize(file: string): { w: number; h: number } {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  for (let i = 2; i + 9 < b.length; ) {
    if (b[i] !== 0xff) throw new Error(`Neispravan JPEG: ${file}`);
    const marker = b[i + 1]!;
    // SOF0..SOF15 hold the frame size; C4 (DHT), C8 (JPG) and CC (DAC) do not.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`Ne mogu pročitati veličinu slike: ${file}`);
}

/** Image that fills the box, cropped in the centre (CSS object-fit: cover). */
export function coverImage(s: Slide, file: string, x: number, y: number, w: number, h: number): void {
  const px = imageSize(file);
  // pptxgenjs takes the image aspect from w/h and the box from sizing.
  s.addImage({ data: img(file), x, y, w, h: (w * px.h) / px.w, sizing: { type: "cover", w, h } });
}

export function newSlide(ctx: Ctx, dark = false): Slide {
  const s = ctx.pres.addSlide();
  s.background = { color: dark ? C.dark : C.white };
  return s;
}

export function footer(ctx: Ctx, s: Slide): void {
  const k = ctx.a.kontakt;
  s.addImage({ data: img(ctx.a.logo), x: M, y: H - 0.62, w: 1.36, h: 0.3 });
  s.addText(`${k.web}  ·  ${k.tel}`, { ...T, x: W - M - 4, y: H - 0.65, w: 4, h: 0.35, align: "right", fontSize: 10, color: C.mute });
}

export function title(s: Slide, t: string, sub?: string, w = W - 2 * M): void {
  s.addText(t, { ...T, x: M, y: 0.45, w, h: 0.7, fontSize: 30, bold: true, color: C.dark });
  if (sub) s.addText(sub, { ...T, x: M, y: 1.1, w, h: 0.35, fontSize: 13, color: C.mute });
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

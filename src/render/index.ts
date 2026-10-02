import { PptxGenJS } from "./pptx.js";
import type { Agencija } from "../config.js";
import type { Ponuda } from "../schema/ponuda.js";
import type { Ctx } from "./parts.js";
import { deterministic } from "./deterministic.js";
import { cijena } from "./slides/cijena.js";
import { dani } from "./slides/dani.js";
import { hvala } from "./slides/hvala.js";
import { napomene } from "./slides/napomene.js";
import { naslovna } from "./slides/naslovna.js";
import { oAgenciji } from "./slides/oAgenciji.js";
import { placanje } from "./slides/placanje.js";
import { ukratko } from "./slides/ukratko.js";

// Fixed slide order (PLAN §3a). Only the number of day, price and note slides varies.
const SLIDES = [naslovna, ukratko, oAgenciji, dani, cijena, placanje, napomene, hvala];

export async function render(p: Ponuda, a: Agencija): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title = `${p.naslov} – ${p.narucitelj}`;

  const ctx: Ctx = { pres, p, a };
  for (const slide of SLIDES) slide(ctx);

  return deterministic((await pres.write({ outputType: "nodebuffer" })) as Buffer);
}

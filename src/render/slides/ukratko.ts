import type { Ponuda, VrstaPrijevoza } from "../../schema/ponuda.js";
import { iconPath, type IconName } from "../icons.js";
import { img, footer, newSlide, plural, T, title, type Ctx } from "../parts.js";
import { C, M, W } from "../theme.js";

type Kartica = { ikone: IconName[]; big: string; small: string };

const PRIJEVOZ: Record<VrstaPrijevoza, { ikona: IconName; naziv: string }> = {
  autobus: { ikona: "FaBus", naziv: "autobus" },
  brod: { ikona: "FaShip", naziv: "brod" },
  trajekt: { ikona: "FaShip", naziv: "trajekt" },
  avion: { ikona: "FaPlane", naziv: "avion" },
  vlak: { ikona: "FaTrain", naziv: "vlak" },
};

/** The 4 fact cards (PLAN §5). A card whose data is missing is left out. */
export function kartice(p: Ponuda): Kartica[] {
  const out: Kartica[] = [];

  const dani = p.dani.length;
  if (dani > 0) out.push({ ikone: ["FaCalendarAlt"], big: String(dani), small: `${plural(dani, "dan", "dana", "dana")} putovanja` });

  const nocenja = p.dani.filter((d) => /noćenje/i.test(d.tekst)).length;
  if (nocenja > 0) out.push({ ikone: ["FaBed"], big: String(nocenja), small: plural(nocenja, "noćenje", "noćenja", "noćenja") });

  const g = p.grupa;
  if (g?.ucenici && g.nastavnici) out.push({ ikone: ["FaUsers"], big: `${g.ucenici}+${g.nastavnici}`, small: "učenika i nastavnika" });
  else if (g?.ukupno) out.push({ ikone: ["FaUsers"], big: String(g.ukupno), small: "putnika" });
  else if (g?.ucenici) out.push({ ikone: ["FaUsers"], big: String(g.ucenici), small: "učenika" });
  else if (g?.opis || p.cijena?.baza) out.push({ ikone: ["FaUsers"], big: "Grupa", small: (g?.opis ?? p.cijena?.baza)! });

  const vrste = [...new Set(p.prijevoz?.vrste ?? [])];
  if (vrste.length > 0) {
    out.push({
      ikone: [...new Set(vrste.map((v) => PRIJEVOZ[v].ikona))],
      big: "Prijevoz",
      small: vrste.map((v) => PRIJEVOZ[v].naziv).join(" + "),
    });
  }
  return out;
}

/** Route = first location of each day, duplicates removed (PLAN §5). */
export function ruta(p: Ponuda): string[] {
  return [...new Set(p.dani.map((d) => d.lokacije[0]).filter((l): l is string => !!l))];
}

export function ukratko(ctx: Ctx): void {
  const { pres, p } = ctx;
  const s = newSlide(ctx);
  title(s, "Putovanje ukratko", p.termin ? `${p.naslov}  ·  ${p.termin}` : p.naslov);

  const ks = kartice(p);
  const gap = 0.3;
  const tw = (W - 2 * M - (ks.length - 1) * gap) / Math.max(ks.length, 1);
  ks.forEach((k, i) => {
    const x = M + i * (tw + gap), y = 1.75;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: tw, h: 1.9, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });
    k.ikone.forEach((ic, j) => s.addImage({ data: img(iconPath(ic)), x: x + 0.3 + j * 0.6, y: y + 0.3, w: 0.45, h: 0.45 }));
    s.addText(k.big, { ...T, x: x + 0.3, y: y + 0.8, w: tw - 0.6, h: 0.6, fontSize: 34, bold: true, color: C.dark });
    s.addText(k.small, { ...T, x: x + 0.3, y: y + 1.4, w: tw - 0.6, h: 0.35, fontSize: 12, color: C.mute });
  });

  const r = ruta(p);
  if (r.length >= 2) {
    s.addText("RUTA PUTOVANJA", { ...T, x: M, y: 4.1, w: 6, h: 0.35, fontSize: 11, bold: true, color: C.red, charSpacing: 2 });
    const n = r.length, rx0 = M + 0.2, rx1 = W - M - 0.2, ry = 5.0;
    const step = (rx1 - rx0) / (n - 1);
    const lw = Math.min(1.8, step);
    s.addShape(pres.ShapeType.line, { x: rx0, y: ry, w: rx1 - rx0, h: 0, line: { color: C.line, width: 2 } });
    r.forEach((mjesto, i) => {
      const x = rx0 + i * step;
      const end = i === 0 || i === n - 1;
      s.addShape(pres.ShapeType.ellipse, { x: x - 0.09, y: ry - 0.09, w: 0.18, h: 0.18, fill: { color: end ? C.dark : C.red }, line: { color: C.white, width: 1.5 } });
      s.addText(mjesto, { ...T, x: x - lw / 2, y: ry + 0.2, w: lw, h: 0.5, align: "center", valign: "top", fontSize: 12, bold: true, color: C.ink });
    });
  }

  if (p.prijevoz?.opis) {
    s.addText(p.prijevoz.opis, { ...T, x: M, y: 5.95, w: W - 2 * M, h: 0.35, fontSize: 12, color: C.mute });
  }
  footer(ctx, s);
}

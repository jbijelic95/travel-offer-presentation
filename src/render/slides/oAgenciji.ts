import { iconPath } from "../icons.js";
import { img, footer, newSlide, T, title, type Ctx } from "../parts.js";
import { C, M, W } from "../theme.js";

export function oAgenciji(ctx: Ctx): void {
  const { pres } = ctx;
  const o = ctx.a.oAgenciji;
  const s = newSlide(ctx);
  title(s, o.naslov, o.podnaslov);

  o.prednosti.forEach((pr, i) => {
    const x = M + (i % 2) * 6.1, y = 1.8 + Math.floor(i / 2) * 1.6;
    s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.75, h: 0.75, fill: { color: C.redSoft }, line: { color: C.redSoft } });
    s.addImage({ data: img(iconPath(pr.ikona)), x: x + 0.19, y: y + 0.19, w: 0.37, h: 0.37 });
    s.addText(pr.naslov, { ...T, x: x + 1, y: y - 0.02, w: 4.8, h: 0.4, fontSize: 17, bold: true, color: C.dark });
    s.addText(pr.opis, { ...T, x: x + 1, y: y + 0.38, w: 4.8, h: 0.6, fontSize: 12.5, color: C.mute, valign: "top" });
  });

  // Certificates: equal columns across the grey bar, each image centred in its column.
  const by = 5.15, bh = 1.3, bw = W - 2 * M;
  s.addShape(pres.ShapeType.rect, { x: M, y: by, w: bw, h: bh, fill: { color: C.light }, line: { color: C.light } });
  const cw = bw / Math.max(o.certifikati.length, 1);
  o.certifikati.forEach((c, i) => {
    s.addImage({ data: img(c.slika), x: M + i * cw + (cw - c.w) / 2, y: by + (bh - c.h) / 2, w: c.w, h: c.h });
  });
  footer(ctx, s);
}

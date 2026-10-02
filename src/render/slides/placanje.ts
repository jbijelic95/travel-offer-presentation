import { iconPath } from "../icons.js";
import { footer, label, lineHeight, lines, newSlide, T, title, type Ctx } from "../parts.js";
import { C, M, W } from "../theme.js";

// One icon per section (PLAN §5): FaCreditCard for payment, FaGift for benefits.
export function placanje(ctx: Ctx): void {
  const { pres, p, a } = ctx;
  const pogodnosti = [...p.pogodnosti, ...a.pogodnosti];
  if (!p.placanje.length && !pogodnosti.length) return;

  const s = newSlide(ctx);
  title(s, "Način plaćanja i pogodnosti");

  if (p.placanje.length) {
    const w = 5.8, tw = 4.6, pt = 13;
    label(s, "MOGUĆNOSTI PLAĆANJA", M, 1.75, w);
    let y = 2.25;
    for (const t of p.placanje) {
      const th = lineHeight(lines(t, tw, pt), pt);
      const h = Math.max(1.05, th + 0.6);
      s.addShape(pres.ShapeType.roundRect, { x: M, y, w, h, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });
      s.addImage({ path: iconPath("FaCreditCard"), x: M + 0.3, y: y + (h - 0.45) / 2, w: 0.45, h: 0.45 });
      s.addText(t, { ...T, x: M + 1, y, w: tw, h, fontSize: pt, color: C.dark, valign: "middle" });
      y += h + 0.25;
    }
  }

  if (pogodnosti.length) {
    const rx = M + 6.4, rw = W - M - rx, tw = rw - 0.95, pt = 13;
    label(s, "AGENCIJA ODOBRAVA", rx, 1.75, rw);
    let y = 2.25;
    for (const t of pogodnosti) {
      const h = Math.max(0.8, lineHeight(lines(t, tw, pt), pt));
      s.addShape(pres.ShapeType.ellipse, { x: rx, y, w: 0.7, h: 0.7, fill: { color: C.redSoft }, line: { color: C.redSoft } });
      s.addImage({ path: iconPath("FaGift"), x: rx + 0.18, y: y + 0.18, w: 0.34, h: 0.34 });
      s.addText(t, { ...T, x: rx + 0.95, y, w: tw, h: Math.max(0.7, h), fontSize: pt, color: C.dark, valign: h > 0.8 ? "top" : "middle" });
      y += h + 0.3;
    }
  }
  footer(ctx, s);
}

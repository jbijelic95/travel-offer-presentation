import { BOTTOM, footer, lineHeight, lines, newSlide, pill, T, title, type Ctx, type Slide } from "../parts.js";
import { C, M, W } from "../theme.js";

const PT = 14, TW = W - 2 * M - 0.65, Y0 = 1.8;

export function napomene(ctx: Ctx): void {
  const items = ctx.p.napomene;
  if (!items.length) return;

  let s: Slide | undefined;
  let y = 0;
  items.forEach((t, i) => {
    const h = Math.max(0.42, lineHeight(lines(t, TW, PT), PT));
    if (!s || y + h > BOTTOM) {
      if (s) footer(ctx, s);
      s = newSlide(ctx);
      title(s, i === 0 ? "Napomene" : "Napomene (nastavak)");
      y = Y0;
    }
    pill(ctx, s, M, y, String(i + 1));
    s.addText(t, { ...T, x: M + 0.65, y: y + 0.03, w: TW, h, fontSize: PT, color: C.ink, valign: "top" });
    y += h + 0.25;
  });
  if (s) footer(ctx, s);
}

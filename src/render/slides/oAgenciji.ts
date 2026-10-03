import { iconPath } from "../icons.js";
import { coverImage, img, footer, newSlide, T, title, type Ctx } from "../parts.js";
import { C, H, M, W } from "../theme.js";

// Left half: title and up to 3 benefit cards stacked. Right half: one photo from the top
// to the right edge, ending above the footer (config oAgenciji.foto, placeholder until then).
const PHOTO_X = 7.2;
const PHOTO_H = H - 0.95;
const LEFT_W = PHOTO_X - M - 0.5;

export function oAgenciji(ctx: Ctx): void {
  const { pres } = ctx;
  const o = ctx.a.oAgenciji;
  const s = newSlide(ctx);
  title(s, o.naslov, o.podnaslov, LEFT_W);

  o.prednosti.forEach((pr, i) => {
    const y = 2.0 + i * 1.45;
    s.addShape(pres.ShapeType.ellipse, { x: M, y, w: 0.75, h: 0.75, fill: { color: C.redSoft }, line: { color: C.redSoft } });
    s.addImage({ data: img(iconPath(pr.ikona)), x: M + 0.19, y: y + 0.19, w: 0.37, h: 0.37 });
    s.addText(pr.naslov, { ...T, x: M + 1, y: y - 0.02, w: LEFT_W - 1, h: 0.4, fontSize: 17, bold: true, color: C.dark });
    s.addText(pr.opis, { ...T, x: M + 1, y: y + 0.38, w: LEFT_W - 1, h: 0.6, fontSize: 12.5, color: C.mute, valign: "top" });
  });

  const w = W - PHOTO_X;
  if (o.foto) {
    coverImage(s, o.foto, PHOTO_X, 0, w, PHOTO_H);
  } else {
    s.addShape(pres.ShapeType.rect, { x: PHOTO_X, y: 0, w, h: PHOTO_H, fill: { color: "E9E9EC" }, line: { color: "E9E9EC" } });
    s.addText("FOTOGRAFIJA", { ...T, x: PHOTO_X, y: 0, w, h: PHOTO_H, align: "center", valign: "middle", fontSize: 11, color: "A0A0A8", charSpacing: 3 });
  }
  footer(ctx, s);
}

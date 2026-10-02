import type { TextRun } from "../pptx.js";
import { img, darkSlide, plural, T, type Ctx } from "../parts.js";
import { C, H } from "../theme.js";

export function naslovna(ctx: Ctx): void {
  const { p, a } = ctx;
  const s = darkSlide(ctx);

  if (p.brojPonude) {
    s.addText(`PONUDA / PROGRAM br. ${p.brojPonude}`, { ...T, x: 1, y: 1.1, w: 8, h: 0.4, fontSize: 13, color: "BBBBBB", charSpacing: 2 });
  }
  s.addText(p.naslov, { ...T, x: 1, y: 1.6, w: 11.5, h: 1.6, fontSize: 48, bold: true, color: C.white, valign: "top" });

  const n = p.brojDana ?? p.dani.length;
  if (n > 0) {
    s.addText(`${n} ${plural(n, "dan", "dana", "dana")}`, { ...T, x: 1, y: 3.15, w: 10, h: 0.5, fontSize: 22, color: "E8E8EA" });
  }

  s.addShape(ctx.pres.ShapeType.rect, { x: 1, y: 4.25, w: 5.6, h: 1.55, fill: { color: "2A2A2E" }, line: { color: "2A2A2E" } });
  const box: TextRun[] = [
    { text: "NARUČITELJ", options: { fontSize: 10, color: "9A9AA0", charSpacing: 2, breakLine: true } },
    { text: p.narucitelj, options: { fontSize: 20, bold: true, color: C.white, breakLine: !!p.termin } },
  ];
  if (p.termin) {
    box.push(
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "TERMIN", options: { fontSize: 10, color: "9A9AA0", charSpacing: 2, breakLine: true } },
      { text: p.termin, options: { fontSize: 18, color: C.white } },
    );
  }
  s.addText(box, { ...T, x: 1.3, y: 4.35, w: 5.2, h: 1.4, valign: "middle" });

  s.addImage({ data: img(a.logo), x: 1, y: H - 1.05, w: 2.5, h: 0.55 });
  s.addText(`PUTNIČKA AGENCIJA  ·  ${a.kontakt.web}`, { ...T, x: 3.7, y: H - 0.95, w: 6, h: 0.35, fontSize: 11, color: "BBBBBB", valign: "middle" });
}

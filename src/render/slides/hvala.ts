import { iconPath, type IconName } from "../icons.js";
import { darkSlide, T, type Ctx } from "../parts.js";
import { C, H, W } from "../theme.js";

// Contact always comes from config, never from ponuda.potpis (PLAN §5).
export function hvala(ctx: Ctx): void {
  const { a } = ctx;
  const s = darkSlide(ctx);
  s.addText("Hvala na pažnji!", { ...T, x: 1, y: 1.6, w: 11, h: 1.1, fontSize: 44, bold: true, color: C.white });
  s.addText("Veselimo se zajedničkom putovanju.", { ...T, x: 1, y: 2.65, w: 11, h: 0.5, fontSize: 20, color: "E8E8EA" });

  const k = a.kontakt;
  const rows: [IconName, string][] = [
    ["FaUser", k.ime],
    ["FaPhone", k.tel],
    ["FaEnvelope", k.email],
    ["FaGlobe", k.web],
    ["FaMapMarkerAlt", k.adresa],
  ];
  rows.forEach(([ic, t], i) => {
    const y = 3.7 + i * 0.5;
    s.addImage({ path: iconPath(ic), x: 1, y: y + 0.08, w: 0.26, h: 0.26 });
    s.addText(t, { ...T, x: 1.45, y, w: 8, h: 0.42, fontSize: 15, color: C.white, valign: "middle" });
  });
  s.addImage({ path: a.logo, x: W - 4, y: H - 1.15, w: 3, h: 0.66 });
}

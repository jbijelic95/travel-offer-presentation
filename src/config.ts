import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ICONS } from "./render/icons.js";

// Fixed agency content (docs/PLAN.md §5). Edited without code changes.
// Image paths in the JSON are relative to assets/.

export const ASSETS_DIR = fileURLToPath(new URL("../assets/", import.meta.url));
const CONFIG_FILE = fileURLToPath(new URL("../config/agencija.json", import.meta.url));

const slika = z
  .string()
  .superRefine((p, ctx) => {
    if (!existsSync(ASSETS_DIR + p)) ctx.addIssue({ code: "custom", message: `datoteka ne postoji: assets/${p}` });
  })
  .transform((p) => ASSETS_DIR + p);

export const Agencija = z.object({
  logo: slika,
  oAgenciji: z.object({
    naslov: z.string(),
    podnaslov: z.string(),
    prednosti: z
      .array(z.object({ ikona: z.enum(ICONS), naslov: z.string(), opis: z.string() }))
      .length(4),
    certifikati: z.array(z.object({ slika, w: z.number().positive(), h: z.number().positive() })),
  }),
  pogodnosti: z.array(z.string()),
  kontakt: z.object({
    ime: z.string(),
    tel: z.string(),
    email: z.string(),
    web: z.string(),
    adresa: z.string(),
  }),
});

/** Agency config with image paths resolved to absolute paths. */
export type Agencija = z.infer<typeof Agencija>;

export function loadAgencija(file = CONFIG_FILE): Agencija {
  const r = Agencija.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!r.success) throw new Error(`Neispravan ${file}:\n${z.prettifyError(r.error)}`);
  return r.data;
}

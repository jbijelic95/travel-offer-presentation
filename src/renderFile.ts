import { readFileSync } from "node:fs";
import { z } from "zod";
import { loadAgencija } from "./config.js";
import { render } from "./render/index.js";
import { Ponuda } from "./schema/ponuda.js";

/** Reads a Ponuda JSON file, validates it and renders it with the agency config. */
export async function renderFile(file: string): Promise<Buffer> {
  const r = Ponuda.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!r.success) throw new Error(`Neispravan ${file}:\n${z.prettifyError(r.error)}`);
  return render(r.data, loadAgencija());
}

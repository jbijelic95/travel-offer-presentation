// npm run render -- <ponuda.json> [out.pptx]
// Default output: out/<name>.pptx

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { z } from "zod";
import { loadAgencija } from "../config.js";
import { render } from "../render/index.js";
import { Ponuda } from "../schema/ponuda.js";

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error("Upotreba: npm run render -- <ponuda.json> [izlaz.pptx]");
  process.exit(1);
}

const r = Ponuda.safeParse(JSON.parse(readFileSync(input, "utf8")));
if (!r.success) {
  console.error(`Neispravan ${input}:\n${z.prettifyError(r.error)}`);
  process.exit(1);
}

const out = output ?? join("out", basename(input, extname(input)) + ".pptx");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await render(r.data, loadAgencija()));
console.log("wrote", out);

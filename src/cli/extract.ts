// npm run extract -- <ponuda.odt|.docx|.pdf> [--pptx]
// Writes out/<name>.json; with --pptx also out/<name>.pptx.
// API key: ANTHROPIC_API_KEY from the environment or from .env.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { convert } from "../convert/index.js";
import { extract } from "../extract/index.js";
import { renderFile } from "../renderFile.js";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.error("Upotreba: npm run extract -- <ponuda.odt|.docx|.pdf> [--pptx]");
  process.exit(1);
}
if (existsSync(".env")) process.loadEnvFile(".env");

try {
  const ponuda = await extract(await convert(input), basename(input));
  const name = basename(input, extname(input));
  mkdirSync("out", { recursive: true });
  const json = join("out", name + ".json");
  writeFileSync(json, JSON.stringify(ponuda, null, 2) + "\n");
  console.log("wrote", json);
  for (const w of ponuda.meta.upozorenjaEkstrakcije) console.log("upozorenje:", w);

  if (args.includes("--pptx")) {
    const pptx = join("out", name + ".pptx");
    writeFileSync(pptx, await renderFile(json));
    console.log("wrote", pptx);
  }
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

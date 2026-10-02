// npm run render -- <ponuda.json> [out.pptx]
// Default output: out/<name>.pptx

import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { renderFile } from "../renderFile.js";

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error("Upotreba: npm run render -- <ponuda.json> [izlaz.pptx]");
  process.exit(1);
}

try {
  const buf = await renderFile(input);
  const out = output ?? join("out", basename(input, extname(input)) + ".pptx");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log("wrote", out);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

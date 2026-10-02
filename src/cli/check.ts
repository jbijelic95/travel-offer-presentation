// npm run check               render every examples/*.json, compare SHA-256 with examples/<name>.sha256
// npm run check -- --update   rewrite the .sha256 files after an intended layout change
//
// A mismatch means the output changed. Open the .pptx in out/ and look before running --update.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderFile } from "../renderFile.js";

const DIR = "examples";
const update = process.argv.includes("--update");

const names = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -".json".length))
  .sort();

if (!names.length) {
  console.error(`Nema primjera u ${DIR}/`);
  process.exit(1);
}

mkdirSync("out", { recursive: true });
let failed = 0;

for (const name of names) {
  const hashFile = join(DIR, `${name}.sha256`);
  let buf: Buffer;
  try {
    buf = await renderFile(join(DIR, `${name}.json`));
  } catch (e) {
    console.log(`FAIL     ${name}: ${(e as Error).message}`);
    failed++;
    continue;
  }
  const hash = createHash("sha256").update(buf).digest("hex");
  const out = join("out", `${name}.pptx`);
  writeFileSync(out, buf);

  if (update) {
    writeFileSync(hashFile, hash + "\n");
    console.log(`updated  ${name}  ${hash}`);
    continue;
  }
  if (!existsSync(hashFile)) {
    console.log(`MISSING  ${name}: ${hashFile} ne postoji (pokreni npm run check -- --update)`);
    failed++;
    continue;
  }
  const expected = readFileSync(hashFile, "utf8").trim();
  if (hash === expected) {
    console.log(`ok       ${name}`);
  } else {
    console.log(`CHANGED  ${name}: očekivano ${expected}, dobiveno ${hash}. Pregledaj ${out}.`);
    failed++;
  }
}

if (failed) process.exit(1);

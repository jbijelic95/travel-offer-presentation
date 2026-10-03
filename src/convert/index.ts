import { readFileSync } from "node:fs";
import { extname } from "node:path";
import JSZip from "jszip";

// Offer file → input for extract(). docs/PLAN.md §1, §2.
// .odt/.docx: plain text read straight from the document XML.
// .pdf: passed through; Claude reads it as a document block.

export type Converted = { kind: "text"; text: string } | { kind: "pdf"; data: Buffer };

export const PODRZANI_FORMATI = [".odt", ".docx", ".pdf"];

export async function convert(file: string): Promise<Converted> {
  const ext = extname(file).toLowerCase();
  if (ext === ".doc") throw new Error(`${file}: .doc nije podržan. Spremite ponudu kao .odt ili .docx.`);
  if (!PODRZANI_FORMATI.includes(ext))
    throw new Error(`${file}: format "${ext}" nije podržan. Podržani su ${PODRZANI_FORMATI.join(", ")}.`);

  const buf = readFileSync(file);
  if (ext === ".pdf") return { kind: "pdf", data: buf };
  const zip = await JSZip.loadAsync(buf);
  const entry = ext === ".odt" ? "content.xml" : "word/document.xml";
  const xml = await zip.file(entry)?.async("string");
  if (xml === undefined) throw new Error(`${file}: nema ${entry}, datoteka je oštećena ili nije ${ext}.`);
  return { kind: "text", text: ext === ".odt" ? odtText(xml) : docxText(xml) };
}

/** Calls onTag for every tag and onText for every text node, in document order. */
function walk(
  xml: string,
  onTag: (name: string, kind: "open" | "close" | "empty", attrs: string) => void,
  onText: (text: string) => void,
) {
  const re = /<(\/?)([\w:.-]+)([^>]*?)(\/?)>|<[?!][^>]*>|([^<]+)/g;
  for (const m of xml.matchAll(re)) {
    if (m[5] !== undefined) onText(decodeEntities(m[5]));
    else if (m[2] !== undefined) onTag(m[2], m[1] ? "close" : m[4] ? "empty" : "open", m[3] ?? "");
  }
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[e.toLowerCase()]!;
  });
}

/** Paragraphs become lines, list items get "- ", table cells are joined with " | ". */
class TextBuilder {
  private out = "";
  private cellDepth = 0;

  text(s: string) {
    this.out += s;
  }
  paragraphEnd() {
    this.out += this.cellDepth > 0 ? " " : "\n";
  }
  bullet() {
    this.out += "- ";
  }
  cellStart() {
    this.cellDepth++;
  }
  cellEnd() {
    this.cellDepth--;
    this.out = this.out.trimEnd() + " | ";
  }
  rowEnd() {
    this.out = this.out.replace(/\s*\|\s*$/, "") + "\n";
  }
  result(): string {
    return this.out
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

function odtText(xml: string): string {
  const b = new TextBuilder();
  let skip = 0; // inside annotations or tracked changes
  let freshListItem = false;
  walk(
    xml,
    (name, kind, attrs) => {
      if (name === "office:annotation" || name === "text:tracked-changes") {
        if (kind === "open") skip++;
        else if (kind === "close") skip--;
        return;
      }
      if (skip) return;
      if (kind === "open") {
        if (name === "text:list-item") freshListItem = true;
        else if ((name === "text:p" || name === "text:h") && freshListItem) {
          freshListItem = false;
          b.bullet();
        } else if (name === "table:table-cell") b.cellStart();
      } else if (kind === "close") {
        if (name === "text:p" || name === "text:h") b.paragraphEnd();
        else if (name === "table:table-cell") b.cellEnd();
        else if (name === "table:table-row") b.rowEnd();
      } else {
        if (name === "text:s") b.text(" ".repeat(Number(/text:c="(\d+)"/.exec(attrs)?.[1] ?? 1)));
        else if (name === "text:tab") b.text("\t");
        else if (name === "text:line-break") b.text("\n");
        else if (name === "text:p" || name === "text:h") b.paragraphEnd();
      }
    },
    (text) => {
      if (!skip) b.text(text);
    },
  );
  return b.result();
}

function docxText(xml: string): string {
  const b = new TextBuilder();
  let inText = false; // inside <w:t>; other text (field codes, deleted text) is ignored
  let inRun = false; // <w:tab/> outside a run is a tab stop definition, not a tab
  let paragraphStart = false;
  walk(
    xml,
    (name, kind) => {
      if (name === "w:t") inText = kind === "open";
      else if (name === "w:r") inRun = kind === "open";
      else if (kind === "open" && name === "w:p") paragraphStart = true;
      else if (name === "w:numPr" && paragraphStart && kind !== "close") {
        paragraphStart = false;
        b.bullet();
      } else if (kind === "open" && name === "w:tc") b.cellStart();
      else if (kind !== "open") {
        if (name === "w:p") b.paragraphEnd();
        else if (name === "w:tc") b.cellEnd();
        else if (name === "w:tr") b.rowEnd();
        else if (inRun && name === "w:tab") b.text("\t");
        else if (inRun && (name === "w:br" || name === "w:cr")) b.text("\n");
      }
    },
    (text) => {
      if (inText) b.text(text);
    },
  );
  return b.result();
}

import JSZip from "jszip";

// pptxgenjs writes the current time into docProps/core.xml and JSZip stamps every
// zip entry with it, so two renders of the same JSON differ. Pin both to a fixed date
// so the same JSON always gives a byte-identical .pptx (CLAUDE.md).
const FIXED = new Date("2000-01-01T00:00:00Z");
const FIXED_W3C = "2000-01-01T00:00:00Z";

export async function deterministic(pptx: Buffer): Promise<Buffer> {
  const src = await JSZip.loadAsync(pptx);
  const out = new JSZip();

  // Keep the original entry order.
  const names: string[] = [];
  src.forEach((name, f) => {
    if (!f.dir) names.push(name);
  });

  for (const name of names) {
    let data: string | Uint8Array = await src.file(name)!.async("uint8array");
    if (name === "docProps/core.xml") {
      data = new TextDecoder()
        .decode(data)
        .replace(/(<dcterms:(created|modified)[^>]*>)[^<]*(<\/dcterms:\2>)/g, `$1${FIXED_W3C}$3`);
    }
    out.file(name, data, { date: FIXED, createFolders: false });
  }

  return out.generateAsync({ type: "nodebuffer", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

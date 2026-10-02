// Renders the icons listed in src/render/icons.ts to PNG in assets/icons/.
// Run: npm run icons. Commit the output.

import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as fa from "react-icons/fa";
import sharp from "sharp";
import { ICONS, ICON_COLOR, ICON_PX, ICONS_DIR, iconFile } from "../src/render/icons.js";

mkdirSync(ICONS_DIR, { recursive: true });

// Remove PNGs no longer in the list (old names or old color).
const wanted = new Set(ICONS.map(iconFile));
for (const f of readdirSync(ICONS_DIR)) {
  if (f.endsWith(".png") && !wanted.has(f)) rmSync(ICONS_DIR + f);
}

for (const name of ICONS) {
  const svg = renderToStaticMarkup(createElement(fa[name], { color: "#" + ICON_COLOR, size: ICON_PX }));
  await sharp(Buffer.from(svg)).png().toFile(ICONS_DIR + iconFile(name));
}

console.log(`wrote ${ICONS.length} icons to ${ICONS_DIR}`);

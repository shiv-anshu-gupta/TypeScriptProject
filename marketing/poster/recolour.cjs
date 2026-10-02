// Repaints the unDraw illustrations into the shop's palette.
//
// unDraw ships every illustration with one accent colour you are meant to
// change (#6c63ff) plus a near-black and a few greys. Swapping those three
// is what makes four drawings by four different hands look like one set.
//
// Licence: unDraw allows commercial use and modification with no attribution.
// Re-running this is safe - it reads art/src/*.svg, never its own output.
const fs = require("fs");
const path = require("path");

const MAP = [
  [/#6c63ff/gi, "#c0492f"], // their accent      -> terracotta
  [/#3f3d56/gi, "#1f2a2e"], // their near-black  -> the app's ink
  [/#2f2e41/gi, "#263238"], // their hair/dark   -> warm dark
  [/#e6e6e6/gi, "#e6dcc9"], // their light grey  -> warm border
  [/#f2f2f2/gi, "#efe7d8"], // their lightest    -> sand tint
  [/#ccc\b/gi, "#cdbfa6"],  // mid grey          -> warm mid

  // unDraw's newer illustrations use a blue family instead of the accent
  // above. Mapping it onto the same palette is what stops one drawing in
  // the row from looking like it wandered in from another brand.
  [/#0055dc/gi, "#3c5a64"], // their blue      -> ocean
  [/#6ecce5/gi, "#9ab9b6"], // their mid blue  -> ocean tint
  [/#c5ebf5/gi, "#dde8e7"], // their pale blue -> accent sage
  [/#e2f5fa/gi, "#eef3f1"], // their palest    -> near-white sage
];

const srcDir = path.join(__dirname, "art", "src");
const outDir = path.join(__dirname, "art");
let n = 0;
for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith(".svg"))) {
  let svg = fs.readFileSync(path.join(srcDir, file), "utf8");
  let hits = 0;
  for (const [from, to] of MAP) {
    const before = svg;
    svg = svg.replace(from, to);
    if (svg !== before) hits++;
  }
  fs.writeFileSync(path.join(outDir, file), svg);
  console.log(`${file.padEnd(26)} ${hits} colour groups repainted`);
  n++;
}
console.log(`\n${n} illustrations in ${outDir}`);

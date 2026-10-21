// Copies what the dashboard needs from Hermes' data folder into public/data/.
// Only dashboard.json and PNG thumbnails are copied. Product PDFs are the things
// we sell, so they never go on the website.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const opsRoot = path.resolve(here, "..", "..");
const out = path.resolve(here, "..", "public", "data");

// Real data first; a local dry run is the fallback while developing.
const source = ["data", ".dry-run"].map((d) => path.join(opsRoot, d)).find((d) => existsSync(path.join(d, "dashboard.json")));

rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "thumbs"), { recursive: true });

if (!source) {
  writeFileSync(path.join(out, "dashboard.json"), JSON.stringify({ empty: true }));
  console.log("collect: no Hermes data yet, dashboard will show 'awaiting first run'");
} else {
  copyFileSync(path.join(source, "dashboard.json"), path.join(out, "dashboard.json"));
  const products = path.join(source, "products");
  let n = 0;
  if (existsSync(products)) {
    for (const id of readdirSync(products)) {
      const thumb = path.join(products, id, "thumb.png");
      if (existsSync(thumb)) {
        copyFileSync(thumb, path.join(out, "thumbs", `${id}.png`));
        n++;
      }
    }
  }
  console.log(`collect: ${path.relative(opsRoot, source)}/dashboard.json + ${n} thumbnails`);
}

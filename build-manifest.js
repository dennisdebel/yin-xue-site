// build-manifest.js
import { promises as fs } from "fs";
import path from "path";

const ROOTS = ["projects", "commissions"];
const OUT_FILE = "manifest.json";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(fullPath);
      files.push(...sub);
    } else if (/\.(png|jpe?g|gif|txt)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const manifest = {};
  for (const root of ROOTS) {
    const folders = await fs.readdir(root, { withFileTypes: true });
    manifest[root] = {};

    for (const folder of folders.filter(f => f.isDirectory())) {
      const subdir = path.join(root, folder.name);
      const files = (await fs.readdir(subdir))
        .filter(f => /\.(png|jpe?g|gif|txt)$/i.test(f))
        .map(f => `${folder.name}/${f}`);
      if (files.length) manifest[root][folder.name] = files;
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ Wrote ${OUT_FILE}`);
}

main();

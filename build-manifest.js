// build-manifest.js
import { promises as fs } from "fs";
import path from "path";

const ROOTS = ["projects", "commissions", "about"];
const OUT_FILE = "manifest.json";

async function safeReaddir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function main() {
  const manifest = {};

  for (const root of ROOTS) {
    const folders = await safeReaddir(root);
    manifest[root] = {};

    // Case 1: root directly has files (like "about/")
    if (folders.length === 0) {
      const files = (await safeReaddir(root))
        .filter(f => f.isFile() && /\.(png|jpe?g|gif|txt)$/i.test(f.name))
        .map(f => f.name);
      if (files.length) manifest[root]["."] = files;
      continue;
    }

    // Case 2: root has subfolders
    for (const folder of folders.filter(f => f.isDirectory())) {
      const subdir = path.join(root, folder.name);
      const files = (await safeReaddir(subdir))
        .filter(f => f.isFile() && /\.(png|jpe?g|gif|txt)$/i.test(f.name))
        .map(f => `${folder.name}/${f.name}`);
      if (files.length) manifest[root][folder.name] = files;
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ Wrote ${OUT_FILE}`);
}

main().catch(err => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});

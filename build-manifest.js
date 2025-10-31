// build-manifest.js
import { promises as fs } from "fs";
import path from "path";

const ROOTS = ["projects", "commissions", "about"];
const OUT_FILE = "manifest.json";

// Gracefully list directory contents
async function safeReaddir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return []; // folder missing
    throw err;
  }
}

async function main() {
  const manifest = {};

  for (const root of ROOTS) {
    const entries = await safeReaddir(root);
    manifest[root] = {};

    // Case 1: root folder directly contains files (like "about")
    const hasSubfolders = entries.some(e => e.isDirectory());
    if (!hasSubfolders) {
      const files = entries
        .filter(
          f =>
            f.isFile() &&
            /\.(png|jpe?g|gif|webp|mp4|mov|txt|html)$/i.test(f.name)
        )
        .map(f => f.name);

      if (files.length) manifest[root]["."] = files;
      continue;
    }

    // Case 2: root has subfolders (projects, commissions)
    for (const folder of entries.filter(f => f.isDirectory())) {
      const subdir = path.join(root, folder.name);
      const files = (await safeReaddir(subdir))
        .filter(
          f =>
            f.isFile() &&
            /\.(png|jpe?g|gif|webp|mp4|mov|txt|html)$/i.test(f.name)
        )
        .map(f => f.name);

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

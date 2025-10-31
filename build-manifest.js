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
    manifest[root] = {};
    const entries = await safeReaddir(root);

    // --- Case 1: directory contains only files (e.g. about/)
    const subdirs = entries.filter(e => e.isDirectory());
    const filesInRoot = entries
      .filter(
        e =>
          e.isFile() &&
          /\.(png|jpe?g|gif|webp|mp4|mov|txt|html)$/i.test(e.name)
      )
      .map(e => e.name);

    if (filesInRoot.length) {
      manifest[root]["."] = filesInRoot;
    }

    // --- Case 2: iterate subfolders (projects, commissions)
    for (const folder of subdirs) {
      const subdir = path.join(root, folder.name);
      const subfiles = (await safeReaddir(subdir))
        .filter(
          e =>
            e.isFile() &&
            /\.(png|jpe?g|gif|webp|mp4|mov|txt|html)$/i.test(e.name)
        )
        .map(e => `${folder.name}/${e.name}`);
      if (subfiles.length) manifest[root][folder.name] = subfiles;
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ wrote ${OUT_FILE}`);
}

main().catch(err => {
  console.error("❌ build failed:", err);
  process.exit(1);
});

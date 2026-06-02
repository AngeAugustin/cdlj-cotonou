/**
 * Régénère les favicons CDLJ depuis public/branding/cdlj-logo.png
 * Usage : node scripts/generate-favicons.mjs
 */
import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "public/branding/cdlj-logo.png");
const sizes = [48, 96, 192, 512];

for (const size of sizes) {
  const out = join(root, `public/branding/favicon-${size}.png`);
  execSync(`npx --yes sharp-cli resize ${size} ${size} -i "${src}" -o "${out}"`, {
    stdio: "inherit",
  });
}

const copies = [
  ["public/branding/favicon-48.png", "public/favicon.ico"],
  ["public/branding/favicon-48.png", "public/favicon-32.png"],
  ["public/branding/favicon-96.png", "public/favicon.png"],
  ["public/branding/favicon-192.png", "public/apple-touch-icon.png"],
  ["public/branding/favicon-192.png", "src/app/icon.png"],
  ["public/branding/favicon-192.png", "src/app/apple-icon.png"],
];

for (const [from, to] of copies) {
  copyFileSync(join(root, from), join(root, to));
}

console.log("Favicons générés.");

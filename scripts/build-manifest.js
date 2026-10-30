// Runs on every Vercel build: lists public/images into public/manifest.json
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "images");
const ok = /\.(png|jpe?g|webp|gif)$/i;

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => ok.test(f)).sort()
  : [];

fs.writeFileSync(
  path.join(__dirname, "..", "public", "manifest.json"),
  JSON.stringify(files)
);
console.log(`manifest: ${files.length} image(s)`);

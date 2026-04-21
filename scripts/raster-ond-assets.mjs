/**
 * Rasterize ond SVGs for iOS AppIcon, Splash, header asset catalog, and PWA PNGs.
 * Run from repo root: node scripts/raster-ond-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const brand = path.join(root, "public", "brand");
const iosAppIcon = path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png");
const splashDir = path.join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");
const headerDir = path.join(root, "ios", "App", "App", "Assets.xcassets", "HeaderLockup.imageset");

const appIconSvg = path.join(brand, "AppIcon-1024.svg");
const markSvg = path.join(brand, "ond-mark-primary.svg");
const lockupSvg = path.join(brand, "ond-lockup-horizontal.svg");

async function main() {
  await sharp(appIconSvg).resize(1024, 1024).png().toFile(iosAppIcon);

  await sharp(appIconSvg).resize(180, 180).png().toFile(path.join(brand, "apple-touch-icon.png"));
  await sharp(appIconSvg).resize(192, 192).png().toFile(path.join(brand, "icon-192.png"));
  await sharp(appIconSvg).resize(512, 512).png().toFile(path.join(brand, "icon-512.png"));

  const markBuf = await sharp(markSvg).resize(1400, 1400, { fit: "inside" }).png().toBuffer();
  const splashPng = await sharp({
    create: { width: 2732, height: 2732, channels: 3, background: "#ECE7DC" },
  })
    .composite([{ input: markBuf, gravity: "center" }])
    .png()
    .toBuffer();

  for (const name of ["splash-2732x2732-2.png", "splash-2732x2732-1.png", "splash-2732x2732.png"]) {
    fs.writeFileSync(path.join(splashDir, name), splashPng);
  }

  fs.mkdirSync(headerDir, { recursive: true });
  const h1 = 26;
  const h2 = 52;
  const h3 = 78;
  const w1 = Math.round(h1 * (420 / 120));
  const w2 = Math.round(h2 * (420 / 120));
  const w3 = Math.round(h3 * (420 / 120));
  await sharp(lockupSvg).resize(w1, h1).png().toFile(path.join(headerDir, "HeaderLockup.png"));
  await sharp(lockupSvg).resize(w2, h2).png().toFile(path.join(headerDir, "HeaderLockup@2x.png"));
  await sharp(lockupSvg).resize(w3, h3).png().toFile(path.join(headerDir, "HeaderLockup@3x.png"));

  const headerContents = {
    images: [
      { idiom: "universal", scale: "1x", filename: "HeaderLockup.png" },
      { idiom: "universal", scale: "2x", filename: "HeaderLockup@2x.png" },
      { idiom: "universal", scale: "3x", filename: "HeaderLockup@3x.png" },
    ],
    info: { author: "xcode", version: 1 },
  };
  fs.writeFileSync(path.join(headerDir, "Contents.json"), JSON.stringify(headerContents, null, 2));

  console.log("Raster OK: AppIcon, splash, header lockup, PWA PNGs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

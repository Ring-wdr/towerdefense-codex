import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const phaserSourceFiles = [
  "src/phaser/game.js",
  "src/phaser/scenes/TitleScene.js",
  "src/phaser/scenes/CampaignScene.js",
  "src/phaser/scenes/ThemeScene.js",
  "src/phaser/scenes/BattleScene.js",
  "src/phaser/scenes/OverlayScene.js",
];

test("main entry follows the official phaser vite template shape with a lazy game import", () => {
  assert.match(mainSource, /DOMContentLoaded/);
  assert.match(mainSource, /import\("\.\/game\/main\.js"\)/);
  assert.doesNotMatch(mainSource, /from "\.\/phaser\/game\.js"/);
});

test("package scripts use dedicated vite dev and prod config files", () => {
  assert.equal(packageJson.scripts.dev, "vite --config vite/config.dev.mjs");
  assert.equal(packageJson.scripts.start, "vite --config vite/config.dev.mjs");
  assert.equal(packageJson.scripts.build, "vite build --config vite/config.prod.mjs");
});

test("package targets Phaser 4", () => {
  assert.match(packageJson.dependencies.phaser, /^\^?4\./);
});

test("phaser source files use namespace imports for Phaser 4 ESM", () => {
  for (const file of phaserSourceFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    assert.doesNotMatch(
      source,
      /import\s+Phaser\s+from\s+["']phaser["']/,
      join("src", file),
    );
    assert.match(source, /import\s+\*\s+as\s+Phaser\s+from\s+["']phaser["']/);
  }
});

test("vite dev config mirrors the official template phaser chunk split", () => {
  const viteConfigUrl = new URL("../vite/config.dev.mjs", import.meta.url);

  assert.equal(existsSync(viteConfigUrl), true);

  const viteConfigSource = readFileSync(viteConfigUrl, "utf8");

  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /base:\s*["']\.\/["']/);
  assert.match(viteConfigSource, /manualChunks:\s*\{/);
  assert.match(viteConfigSource, /phaser:\s*\[\s*["']phaser["']\s*\]/);
});

test("vite prod config enables terser minification and the phaser chunk split", () => {
  const viteConfigUrl = new URL("../vite/config.prod.mjs", import.meta.url);

  assert.equal(existsSync(viteConfigUrl), true);

  const viteConfigSource = readFileSync(viteConfigUrl, "utf8");

  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /base:\s*["']\.\/["']/);
  assert.match(viteConfigSource, /manualChunks/);
  assert.match(viteConfigSource, /phaser:\s*\[\s*["']phaser["']\s*\]/);
  assert.match(viteConfigSource, /minify:\s*["']terser["']/);
});

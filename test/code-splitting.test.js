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

test("battle host is the only component that reaches for the Phaser bridge", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");

  assert.match(appSource, /BattleHost/);
  assert.doesNotMatch(appSource, /<PhaserGame/);
  assert.match(battleHostSource, /PhaserGame/);
});

test("package scripts match the latest Phaser Vite template defaults", () => {
  assert.equal(packageJson.scripts.dev, "vite");
  assert.equal(packageJson.scripts.start, "vite");
  assert.equal(packageJson.scripts.build, "vite build");
  assert.equal(packageJson.scripts.preview, "vite preview");
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

test("root vite config matches the latest Phaser template baseline", () => {
  const viteConfigUrl = new URL("../vite.config.js", import.meta.url);

  assert.equal(existsSync(viteConfigUrl), true);

  const viteConfigSource = readFileSync(viteConfigUrl, "utf8");

  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /base:\s*["']\.\/["']/);
  assert.doesNotMatch(viteConfigSource, /manualChunks/);
  assert.doesNotMatch(viteConfigSource, /minify:\s*["']terser["']/);
});

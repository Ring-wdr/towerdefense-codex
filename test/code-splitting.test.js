import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

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

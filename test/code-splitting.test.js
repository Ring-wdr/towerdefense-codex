import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainEntrypointSource = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");
const phaserGameSource = readFileSync(new URL("../src/PhaserGame.jsx", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const viteConfigSource = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");
const phaserSourceFiles = [
  "src/phaser/game.js",
  "src/phaser/scenes/TitleScene.js",
  "src/phaser/scenes/CampaignScene.js",
  "src/phaser/scenes/ThemeScene.js",
  "src/phaser/scenes/BattleScene.js",
  "src/phaser/scenes/OverlayScene.js",
];

test("main entry mounts the React app shell from #root", () => {
  assert.match(mainEntrypointSource, /import ReactDOM from "react-dom\/client";/);
  assert.match(mainEntrypointSource, /import App from "\.\/App\.jsx";/);
  assert.match(mainEntrypointSource, /ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(<App \/>\);/);
});

test("battle host is the only app-level component that reaches for the Phaser bridge", () => {
  assert.match(appSource, /BattleHost/);
  assert.doesNotMatch(appSource, /from ["']\.\/PhaserGame\.jsx["']/);
  assert.match(battleHostSource, /import PhaserGame from "\.\.\/PhaserGame\.jsx";/);
  assert.match(battleHostSource, /controlsRootRef/);
});

test("phaser bridge lazy-loads battle runtime and forwards the DOM shell bridge", () => {
  assert.match(phaserGameSource, /await import\("\.\/game\/main\.js"\)/);
  assert.match(phaserGameSource, /launchPayload/);
  assert.match(phaserGameSource, /onExitToMenuRef/);
  assert.match(phaserGameSource, /controlsRoot:\s*controlsRootRef\?\.current\s*\?\?\s*null/);
});

test("game bootstrap supports battle-only launches and pre-boot registry wiring", () => {
  assert.match(gameMainSource, /const launchPayload = options\.launchPayload \?\? null;/);
  assert.match(gameMainSource, /const session = launchPayload\?\.session \?\? createGameSession\(\);/);
  assert.match(gameMainSource, /const metaProgress = launchPayload\?\.metaProgress \?\? loadMetaProgress\(\);/);
  assert.match(gameMainSource, /battleOnly:\s*Boolean\(launchPayload\)/);
  assert.match(gameMainSource, /preBoot\(phaserGame\)/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("session",\s*session\);/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("metaProgress",\s*metaProgress\);/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("uiBridge",\s*\{/);
  assert.match(gameMainSource, /controlsRoot:\s*options\.controlsRoot \?\? null/);
});

test("package scripts reflect the current React plus Phaser Vite app", () => {
  assert.equal(packageJson.scripts.dev, "vite");
  assert.equal(packageJson.scripts.start, "vite");
  assert.equal(packageJson.scripts.build, "vite build");
  assert.equal(packageJson.scripts.preview, "vite preview");
  assert.equal(packageJson.scripts.test, "node --test");
});

test("package targets React 19 and Phaser 4", () => {
  assert.match(packageJson.dependencies.react, /^\^?19\./);
  assert.match(packageJson.dependencies["react-dom"], /^\^?19\./);
  assert.match(packageJson.dependencies.phaser, /^\^?4\./);
});

test("phaser source files use namespace imports for Phaser 4 ESM", () => {
  for (const file of phaserSourceFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    assert.doesNotMatch(source, /import\s+Phaser\s+from\s+["']phaser["']/);
    assert.match(source, /import\s+\*\s+as\s+Phaser\s+from\s+["']phaser["']/);
  }
});

test("vite config includes the React plugin and relative base path", () => {
  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /react\(\)/);
  assert.match(viteConfigSource, /base:\s*["']\.\/["']/);
});

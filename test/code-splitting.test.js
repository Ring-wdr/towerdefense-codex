import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const mainEntrypointSource = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");
const phaserGameSource = readFileSync(new URL("../src/PhaserGame.jsx", import.meta.url), "utf8");
const phaserBootstrapSource = readFileSync(new URL("../src/phaser/game.js", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const phaserComponentsSource = readFileSync(new URL("../src/phaser/ui/components.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const viteConfigSource = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");
const phaserSourceFiles = [
  "src/phaser/game.js",
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

test("battle runtime excludes menu scene modules from the active phaser bootstrap", () => {
  assert.match(gameMainSource, /from "\.\.\/phaser\/game\.js"/);
  assert.doesNotMatch(phaserBootstrapSource, /TitleScene/);
  assert.doesNotMatch(phaserBootstrapSource, /CampaignScene/);
  assert.doesNotMatch(phaserBootstrapSource, /ThemeScene/);
  assert.doesNotMatch(phaserBootstrapSource, /ShopScene/);
  assert.match(phaserBootstrapSource, /BattleScene/);
  assert.match(phaserBootstrapSource, /OverlayScene/);
});

test("legacy phaser menu scene files are removed from the runtime source tree", () => {
  assert.equal(existsSync(new URL("../src/phaser/scenes/TitleScene.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/phaser/scenes/CampaignScene.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/phaser/scenes/ThemeScene.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/phaser/scenes/ShopScene.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/phaser/scenes/theme-cluster-layout.js", import.meta.url)), false);
});

test("react menu styling is split into css modules instead of a shared global menu stylesheet", () => {
  assert.equal(existsSync(new URL("../src/app/menu-shell.css", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/App.module.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/components/MenuFrame.module.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/components/TitleScreen.module.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/components/CampaignScreen.module.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/components/ThemeScreen.module.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/app/components/ShopScreen.module.css", import.meta.url)), true);
});

test("game bootstrap supports battle-only launches and pre-boot registry wiring", () => {
  assert.match(gameMainSource, /const launchPayload = options\.launchPayload \?\? null;/);
  assert.match(gameMainSource, /const session = launchPayload\?\.session \?\? createGameSession\(\);/);
  assert.match(gameMainSource, /const metaProgress = launchPayload\?\.metaProgress \?\? loadMetaProgress\(\);/);
  assert.doesNotMatch(gameMainSource, /battleOnly:\s*Boolean\(launchPayload\)/);
  assert.match(gameMainSource, /preBoot\(phaserGame\)/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("session",\s*session\);/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("metaProgress",\s*metaProgress\);/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("uiBridge",\s*\{/);
  assert.match(gameMainSource, /controlsRoot:\s*options\.controlsRoot \?\? null/);
});

test("phaser ui components keep only battle-overlay helpers after menu scene removal", () => {
  assert.match(phaserComponentsSource, /export function createHeadingTextStyle/);
  assert.match(phaserComponentsSource, /export function createBodyTextStyle/);
  assert.match(phaserComponentsSource, /export function createPanel/);
  assert.match(phaserComponentsSource, /export function createButton/);
  assert.doesNotMatch(phaserComponentsSource, /export function createBackdrop/);
  assert.doesNotMatch(phaserComponentsSource, /export function createTitleLockup/);
  assert.doesNotMatch(phaserComponentsSource, /export function createCommandButton/);
  assert.doesNotMatch(phaserComponentsSource, /export function createStatusStrip/);
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
  assert.match(packageJson.devDependencies["babel-plugin-react-compiler"], /^\^/);
});

test("phaser source files use namespace imports for Phaser 4 ESM", () => {
  for (const file of phaserSourceFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    assert.doesNotMatch(source, /import\s+Phaser\s+from\s+["']phaser["']/);
    assert.match(source, /import\s+\*\s+as\s+Phaser\s+from\s+["']phaser["']/);
  }
});

test("vite config includes the React plugin, compiler, and relative base path", () => {
  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /react\(\s*\{/);
  assert.match(viteConfigSource, /babel-plugin-react-compiler/);
  assert.match(viteConfigSource, /base:\s*["']\.\/["']/);
});

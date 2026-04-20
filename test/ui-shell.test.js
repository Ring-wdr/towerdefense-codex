import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const battleSceneSource = readFileSync(new URL("../src/phaser/scenes/BattleScene.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("ui shell exposes only the phaser mount and battle controls", () => {
  assert.match(html, /id="game-root"/);
  assert.match(html, /id="battle-controls"/);
  assert.match(html, /id="pause-button"/);
  assert.match(html, /id="tower-buttons"/);
  assert.match(html, /id="tower-buttons-dock"/);

  assert.doesNotMatch(html, /id="title-screen"/);
  assert.doesNotMatch(html, /id="campaign-menu-screen"/);
  assert.doesNotMatch(html, /id="theme-screen"/);
  assert.doesNotMatch(html, /id="stage-detail-card"/);
});

test("battle controls hydrate tower icon images from imported assets", () => {
  assert.match(mainSource, /DOMContentLoaded/);
  assert.match(mainSource, /import\("\.\/game\/main\.js"\)/);
  assert.match(mainSource, /data-tower-icon/);
  assert.match(mainSource, /querySelectorAll\("\[data-tower-icon\]"\)/);
  assert.match(mainSource, /img\.src\s*=/);
  assert.match(gameMainSource, /createGameSession/);
  assert.match(gameMainSource, /createGame\(mountNode\)/);
});

test("battle scene keeps the hud compact and biases the field upward", () => {
  assert.match(battleSceneSource, /getBattleViewportLayout\(this,\s*BOARD_WIDTH,\s*BOARD_HEIGHT,\s*\{/);
  assert.match(battleSceneSource, /topPadding:\s*92/);
  assert.match(battleSceneSource, /const dockBottomPadding = this\.getDockBottomPadding\(\);/);
  assert.match(battleSceneSource, /forceBottomDock:\s*true/);
  assert.match(battleSceneSource, /this\.boardScale\s*=\s*viewport\.scale/);
  assert.match(battleSceneSource, /this\.scaledCellSize\s*=\s*CELL_SIZE \* viewport\.scale/);
  assert.match(battleSceneSource, /y:\s*viewport\.boardTop/);
  assert.match(battleSceneSource, /this\.hudText\.setText\(\s*\[/);
  assert.doesNotMatch(battleSceneSource, /`Status \$\{this\.state\.status\}`/);
  assert.doesNotMatch(battleSceneSource, /this\.helpText\.setText\(/);
});

test("battle scene measures the dock height before sizing tablet battle view", () => {
  assert.match(battleSceneSource, /this\.syncBattleControls\(\);\s*this\.handleResize\(\);\s*this\.renderScene\(\);/);
  assert.match(battleSceneSource, /getDockBottomPadding\(\)\s*\{/);
  assert.match(battleSceneSource, /this\.controls\.dock\.getBoundingClientRect\(\)\.height/);
  assert.match(battleSceneSource, /Math\.max\(160,\s*Math\.ceil\(dockHeight\) \+ 20\)/);
});

test("battle sidebar stays disabled so it never covers the playfield", () => {
  assert.match(stylesSource, /\.sidebar\s*\{[\s\S]*display:\s*none\s*!important;/);
});

test("battle control dock stays below the playfield and compact", () => {
  assert.match(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*display:\s*grid;/,
  );
  assert.match(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*bottom:\s*10px;/,
  );
  assert.match(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*max-height:\s*210px;/,
  );
});

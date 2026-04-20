import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const battleSceneSource = readFileSync(new URL("../src/phaser/scenes/BattleScene.js", import.meta.url), "utf8");
const overlaySceneSource = readFileSync(new URL("../src/phaser/scenes/OverlayScene.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function extractMethodBody(source, methodName) {
  const signatureIndex = source.indexOf(`${methodName}(`);
  if (signatureIndex === -1) {
    return null;
  }

  const openBraceIndex = source.indexOf("{", signatureIndex);
  if (openBraceIndex === -1) {
    return null;
  }

  let depth = 0;
  let index = openBraceIndex;
  let state = "code";

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "code") {
      if (char === "'") {
        state = "single";
      } else if (char === '"') {
        state = "double";
      } else if (char === "`") {
        state = "template";
      } else if (char === "/" && next === "/") {
        state = "line-comment";
        index += 1;
      } else if (char === "/" && next === "*") {
        state = "block-comment";
        index += 1;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return source.slice(openBraceIndex + 1, index);
        }
      }
    } else if (state === "single") {
      if (char === "\\" && next) {
        index += 1;
      } else if (char === "'") {
        state = "code";
      }
    } else if (state === "double") {
      if (char === "\\" && next) {
        index += 1;
      } else if (char === '"') {
        state = "code";
      }
    } else if (state === "template") {
      if (char === "\\" && next) {
        index += 1;
      } else if (char === "`") {
        state = "code";
      }
    } else if (state === "line-comment") {
      if (char === "\n") {
        state = "code";
      }
    } else if (state === "block-comment") {
      if (char === "*" && next === "/") {
        state = "code";
        index += 1;
      }
    }

    index += 1;
  }

  return null;
}

test("ui shell exposes only the phaser mount and battle controls", () => {
  assert.match(html, /id="game-root"/);
  assert.match(html, /id="battle-controls"/);
  assert.match(html, /id="pause-button"/);
  assert.match(html, /id="tower-buttons"/);
  assert.match(html, /id="tower-buttons-dock"/);
  assert.match(html, /viewport-fit=cover/);

  assert.doesNotMatch(html, /id="title-screen"/);
  assert.doesNotMatch(html, /id="campaign-menu-screen"/);
  assert.doesNotMatch(html, /id="theme-screen"/);
  assert.doesNotMatch(html, /id="stage-detail-card"/);
});

test("battle controls hydrate tower icon images from imported assets", () => {
  assert.match(mainSource, /DOMContentLoaded/);
  assert.match(mainSource, /import\("\.\/game\/main\.js"\)/);
  assert.match(mainSource, /createIcons/);
  assert.match(mainSource, /icons:\s*\{/);
  assert.match(mainSource, /visualViewport/);
  assert.match(mainSource, /--browser-safe-bottom/);
  assert.match(mainSource, /data-tower-icon/);
  assert.match(mainSource, /querySelectorAll\("\[data-tower-icon\]"\)/);
  assert.match(mainSource, /img\.src\s*=/);
  assert.match(gameMainSource, /createGameSession/);
  assert.match(gameMainSource, /createGame\(mountNode\)/);
});

test("tower actions use readable labels and the battle scene is ready for contextual labels", () => {
  assert.match(html, /id="upgrade-action"[^>]*>Upgrade<\/button>/);
  assert.match(html, /id="delete-action"[^>]*>Delete<\/button>/);

  const syncTowerActionOverlayBody = extractMethodBody(battleSceneSource, "syncTowerActionOverlay");
  assert.ok(syncTowerActionOverlayBody);
  assert.match(syncTowerActionOverlayBody, /hoveredTower/);
  assert.match(syncTowerActionOverlayBody, /Upgrade|Delete|Max/);
  assert.match(syncTowerActionOverlayBody, /getUpgradeCost/);
  assert.match(syncTowerActionOverlayBody, /MAX_TOWER_LEVEL/);
});

test("quick play movement buttons render lucide arrow icons", () => {
  assert.match(html, /data-move="up"[\s\S]*data-lucide="arrow-up"/);
  assert.match(html, /data-move="left"[\s\S]*data-lucide="arrow-left"/);
  assert.match(html, /data-move="right"[\s\S]*data-lucide="arrow-right"/);
  assert.match(html, /data-move="down"[\s\S]*data-lucide="arrow-down"/);
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

test("battle restart clears live particle bursts before rendering the fresh run", () => {
  assert.match(
    battleSceneSource,
    /restartBattle\(\)\s*\{[\s\S]*emitter\.killAll\(\);[\s\S]*this\.handledAttackEffectIds\.clear\(\);[\s\S]*this\.renderScene\(\);/,
  );
});

test("paused overlay resumes battle when escape is pressed", () => {
  assert.match(
    overlaySceneSource,
    /mode === "paused"[\s\S]*this\.input\.keyboard\.on\("keydown-ESC"[\s\S]*battle\.resumeBattle\(\)[\s\S]*this\.scene\.resume\("BattleScene"\)[\s\S]*this\.scene\.stop\(\)/,
  );
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
    /\.control-dock\s*\{[\s\S]*overflow:\s*hidden;/,
  );
  assert.match(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom,\s*0px\) \+ var\(--browser-safe-bottom\)\);/,
  );
  assert.match(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*padding-bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom,\s*0px\)\);/,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.control-dock\s*\{[\s\S]*overflow:\s*auto;/,
  );
});

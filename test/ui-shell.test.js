import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const phaserGameSource = readFileSync(new URL("../src/phaser/game.js", import.meta.url), "utf8");
const battleSceneSource = readFileSync(new URL("../src/phaser/scenes/BattleScene.js", import.meta.url), "utf8");
const campaignSceneSource = readFileSync(new URL("../src/phaser/scenes/CampaignScene.js", import.meta.url), "utf8");
const overlaySceneSource = readFileSync(new URL("../src/phaser/scenes/OverlayScene.js", import.meta.url), "utf8");
const themeSceneSource = readFileSync(new URL("../src/phaser/scenes/ThemeScene.js", import.meta.url), "utf8");
const titleSceneSource = readFileSync(new URL("../src/phaser/scenes/TitleScene.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function extractMethodBody(source, methodName) {
  const signaturePattern = new RegExp(
    String.raw`(?:^|\n)\s*(?:async\s+)?(?:static\s+)?(?:get\s+|set\s+)?${methodName}\s*\(`,
  );
  const signatureMatch = source.match(signaturePattern);
  if (!signatureMatch) {
    return null;
  }

  let index = signatureMatch.index + signatureMatch[0].lastIndexOf("(");
  let parenDepth = 0;
  let state = "code";
  let closeParenIndex = -1;

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
      } else if (char === "(") {
        parenDepth += 1;
      } else if (char === ")") {
        parenDepth -= 1;
        if (parenDepth === 0) {
          closeParenIndex = index;
          break;
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

  if (closeParenIndex === -1) {
    return null;
  }

  let openBraceIndex = -1;
  index = closeParenIndex + 1;
  state = "code";

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "code") {
      if (char === "{") {
        openBraceIndex = index;
        break;
      } else if (char === "'") {
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

  if (openBraceIndex === -1) {
    return null;
  }

  let depth = 0;
  index = openBraceIndex;
  state = "code";

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

function collectTextUpdateValues(source) {
  const values = [];
  const assignmentPattern = /(textContent|innerText)\s*=\s*([^;\n]+)/g;

  for (const match of source.matchAll(assignmentPattern)) {
    values.push(match[2].trim());
  }

  return values;
}

test("ui shell exposes only the phaser mount and battle controls", () => {
  assert.match(html, /id="game-root"/);
  assert.match(html, /id="battle-controls"/);
  assert.match(html, /id="start-button"/);
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
  assert.match(gameMainSource, /loadMetaProgress/);
  assert.match(gameMainSource, /createGame\(mountNode\)/);
  assert.match(gameMainSource, /game\.registry\.set\("session",\s*createGameSession\(\)\);/);
  assert.match(gameMainSource, /game\.registry\.set\("metaProgress",\s*loadMetaProgress\(\)\);/);
});

test("phaser game registers the new ShopScene", () => {
  assert.match(phaserGameSource, /import\s+\{\s*ShopScene\s*\}\s+from "\.\/scenes\/ShopScene\.js";/);
  assert.match(phaserGameSource, /scene:\s*\[TitleScene,\s*CampaignScene,\s*ThemeScene,\s*ShopScene,\s*BattleScene,\s*OverlayScene\]/);
});

test("title and campaign scenes expose the shop and title back buttons in source", () => {
  assert.match(titleSceneSource, /"Shop"/);
  assert.match(titleSceneSource, /openShop\(getSession\(this\)\)/);
  assert.match(titleSceneSource, /this\.scene\.start\("ShopScene"\)/);

  assert.match(campaignSceneSource, /"Back"/);
  assert.match(campaignSceneSource, /returnToTitle\(getSession\(this\)\)/);
  assert.match(campaignSceneSource, /this\.scene\.start\("TitleScene"\)/);
});

test("main entry guards against iOS double-tap zoom in the app shell", () => {
  assert.match(mainSource, /addEventListener\("touchend"/);
  assert.match(mainSource, /passive:\s*false/);
  assert.match(mainSource, /event\.preventDefault\(\)/);
  assert.match(mainSource, /Date\.now\(\)/);
});

test("battle scene opens on a ready state and exposes a start button for entry and breaks", () => {
  const createBody = extractMethodBody(battleSceneSource, "create");

  assert.ok(createBody);
  assert.match(html, /id="start-button"[^>]*>Start<\/button>/);
  assert.match(createBody, /const metaProgress = this\.game\.registry\.get\("metaProgress"\);/);
  assert.match(createBody, /this\.state\s*=\s*createInitialState\(stage,\s*metaProgress\);/);
  assert.doesNotMatch(battleSceneSource, /this\.state\s*=\s*startGame\(createInitialState\(stage\)\);/);
  assert.match(battleSceneSource, /this\.controls\.startButton\.textContent/);
});

test("battle scene boot reads permanent progression from the registry before building state", () => {
  const createBody = extractMethodBody(battleSceneSource, "create");

  assert.ok(createBody);
  assert.match(createBody, /const metaProgress = this\.game\.registry\.get\("metaProgress"\);/);
  assert.match(createBody, /this\.state = createInitialState\(stage,\s*metaProgress\);/);
});

test("battle scene restart preserves permanent progression when rebuilding state", () => {
  const restartBattleBody = extractMethodBody(battleSceneSource, "restartBattle");

  assert.ok(restartBattleBody);
  assert.match(restartBattleBody, /this\.state = restartGame\(this\.state\.stage,\s*this\.state\.metaProgress\);/);
  assert.match(restartBattleBody, /this\.handledAttackEffectIds\.clear\(\);/);
  assert.match(restartBattleBody, /this\.renderScene\(\);/);
});

test("battle scene persists stage clear rewards through storage before session completion", () => {
  const persistStageClearRewardsBody = extractMethodBody(battleSceneSource, "persistStageClearRewards");
  const handleStatusTransitionBody = extractMethodBody(battleSceneSource, "handleStatusTransition");

  assert.ok(persistStageClearRewardsBody);
  assert.ok(handleStatusTransitionBody);
  assert.match(battleSceneSource, /awardStageClearRewards/);
  assert.match(battleSceneSource, /saveMetaProgress/);
  assert.match(battleSceneSource, /persistStageClearRewards\(stageNumber\)/);
  assert.match(persistStageClearRewardsBody, /this\.game\.registry\.get\("metaProgress"\)\s*\?\?\s*loadMetaProgress\(\)/);
  assert.match(persistStageClearRewardsBody, /awardStageClearRewards\(metaProgress,\s*stageNumber\)/);
  assert.match(persistStageClearRewardsBody, /saveMetaProgress\(nextMetaProgress\)/);
  assert.match(persistStageClearRewardsBody, /this\.game\.registry\.set\("metaProgress",\s*savedProgress\)/);
  assert.match(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "stage-cleared"\) \{[\s\S]*const completedStage = getCompletedBattleStage\(session,\s*this\.state\);[\s\S]*this\.persistStageClearRewards\(completedStage\);[\s\S]*completeBattleStage/,
  );
  assert.match(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "stage-cleared"\) \{[\s\S]*this\.game\.registry\.set\("session",\s*progressedSession\);[\s\S]*this\.setBattleControlsVisible\(false\);[\s\S]*this\.scene\.start\("ThemeScene"\);/,
  );
  assert.doesNotMatch(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "stage-cleared"\) \{[\s\S]*beginBattleFromSelection[\s\S]*continueCampaign/,
  );
  assert.match(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "victory"\) \{[\s\S]*const completedStage = getCompletedBattleStage\(session,\s*this\.state\);[\s\S]*this\.persistStageClearRewards\(completedStage\);[\s\S]*completeBattleStage/,
  );
});

test("battle scene lets s start the next wave from keyboard during ready states", () => {
  const handleKeyDownBody = extractMethodBody(battleSceneSource, "handleKeyDown");

  assert.ok(handleKeyDownBody);
  assert.match(handleKeyDownBody, /case "s":/);
  assert.match(handleKeyDownBody, /case "S":/);
  assert.match(handleKeyDownBody, /this\.applyState\(startGame\(this\.state\)\);/);
});

test("tower actions use readable labels and the battle scene is ready for contextual labels", () => {
  assert.match(html, /id="upgrade-action"[^>]*>Upgrade<\/button>/);
  assert.match(html, /id="delete-action"[^>]*>Delete<\/button>/);
  assert.match(html, /<h2>Tower Bay<\/h2>/);
  assert.match(html, /<p class="dock-label">Select Tower<\/p>/);

  const syncTowerActionOverlayBody = extractMethodBody(battleSceneSource, "syncTowerActionOverlay");
  assert.ok(syncTowerActionOverlayBody);
  const textUpdateValues = collectTextUpdateValues(syncTowerActionOverlayBody);
  assert.match(textUpdateValues.join("\n"), /Delete/);
  assert.match(textUpdateValues.join("\n"), /Max/);
  assert.match(textUpdateValues.join("\n"), /Upgrade/);
});

test("scene and overlay copy use the refreshed briefing voice", () => {
  assert.match(battleSceneSource, /Deploy \$\{selectedTower\.name\} • \$\{selectedTower\.cost\}G/);
  assert.match(battleSceneSource, /Cannot deploy here/);
  assert.doesNotMatch(battleSceneSource, /Tile unavailable for the selected tower/);

  assert.match(titleSceneSource, /전선을 훑고 진입할 전구를 고른다\./);
  assert.match(titleSceneSource, /브리핑이 끝나면 전투를 개시한다\./);
  assert.match(titleSceneSource, /단일 캠페인 루트\. 각 전선은 순차적으로 개방된다\./);

  assert.match(campaignSceneSource, /전구를 전환해 현재 전선을 확인한 뒤 브리핑으로 진입한다\./);
  assert.doesNotMatch(campaignSceneSource, /Rotate the campaign theater, confirm the current sector, then push forward into the briefing screen\./);

  assert.match(themeSceneSource, /\$\{stage\.theme\} 전선/);
  assert.match(themeSceneSource, /ENTRY LOCKED/);
  assert.match(themeSceneSource, /이 구간은 아직 봉쇄 상태다\. 캠페인에서 앞선 전장을 먼저 확보해야 한다\./);
  assert.doesNotMatch(themeSceneSource, /LOCKED APPROACH/);
  assert.doesNotMatch(themeSceneSource, /\$\{stage\.theme\.toUpperCase\(\)\} FRONT/);

  assert.match(overlaySceneSource, /Stage \$\{stage\} 교전이 중지됐다\. 전투를 재개하거나 재정비 후 복귀할 수 있다\./);
  assert.match(overlaySceneSource, /Stage \$\{stage\} 방어선이 무너졌다\. 같은 구간을 다시 시도하거나 브리핑으로 복귀한다\./);
  assert.match(overlaySceneSource, /Stage \$\{stage\} 확보 완료\. 이제 모든 전장을 캠페인에서 다시 선택할 수 있다\./);
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

test("battle hud uses symbol labels for lives and gold", () => {
  assert.match(battleSceneSource, /♥ \$\{this\.state\.lives\}/);
  assert.match(battleSceneSource, /💰 \$\{this\.state\.gold\}/);
  assert.doesNotMatch(battleSceneSource, /Lives \$\{this\.state\.lives\}/);
  assert.doesNotMatch(battleSceneSource, /Gold \$\{this\.state\.gold\}/);
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

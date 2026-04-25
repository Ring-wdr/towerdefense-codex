import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainEntrypointSource = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const appModuleSource = readFileSync(new URL("../src/App.module.css", import.meta.url), "utf8");
const screenDataSource = readFileSync(new URL("../src/app/screen-data.js", import.meta.url), "utf8");
const gameMainSource = readFileSync(new URL("../src/game/main.js", import.meta.url), "utf8");
const phaserGameSource = readFileSync(new URL("../src/phaser/game.js", import.meta.url), "utf8");
const battleSceneSource = readFileSync(new URL("../src/phaser/scenes/BattleScene.js", import.meta.url), "utf8");
const overlaySceneSource = readFileSync(new URL("../src/phaser/scenes/OverlayScene.js", import.meta.url), "utf8");
const menuFrameSource = readFileSync(new URL("../src/app/components/MenuFrame.jsx", import.meta.url), "utf8");
const menuFrameModuleSource = readFileSync(new URL("../src/app/components/MenuFrame.module.css", import.meta.url), "utf8");
const titleScreenSource = readFileSync(new URL("../src/app/components/TitleScreen.jsx", import.meta.url), "utf8");
const titleScreenModuleSource = readFileSync(new URL("../src/app/components/TitleScreen.module.css", import.meta.url), "utf8");
const campaignScreenSource = readFileSync(new URL("../src/app/components/CampaignScreen.jsx", import.meta.url), "utf8");
const campaignScreenModuleSource = readFileSync(new URL("../src/app/components/CampaignScreen.module.css", import.meta.url), "utf8");
const themeScreenSource = readFileSync(new URL("../src/app/components/ThemeScreen.jsx", import.meta.url), "utf8");
const themeScreenModuleSource = readFileSync(new URL("../src/app/components/ThemeScreen.module.css", import.meta.url), "utf8");
const shopScreenSource = readFileSync(new URL("../src/app/components/ShopScreen.jsx", import.meta.url), "utf8");
const shopScreenModuleSource = readFileSync(new URL("../src/app/components/ShopScreen.module.css", import.meta.url), "utf8");
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

test("html bootstraps the React shell and keeps battle controls inside App", () => {
  assert.match(html, /id="root"/);
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(html, /viewport-fit=cover/);
  assert.doesNotMatch(html, /id="game-root"/);
  assert.doesNotMatch(html, /id="battle-controls"/);

  assert.match(appSource, /id="battle-controls"/);
  assert.match(appSource, /id="start-button"/);
  assert.match(appSource, /id="pause-button"/);
  assert.match(appSource, /id="tower-buttons"/);
  assert.match(appSource, /id="tower-buttons-dock"/);
});

test("app shell keeps battle controls hidden outside battle and exposes React menu screens", () => {
  assert.match(appSource, /TitleScreen/);
  assert.match(appSource, /CampaignScreen/);
  assert.match(appSource, /ThemeScreen/);
  assert.match(appSource, /ShopScreen/);
  assert.match(appSource, /BattleHost/);
  assert.match(appSource, /appState\.scene === "battle"/);
  assert.match(appSource, /<section id="battle-controls"[\s\S]*hidden/);
});

test("react menu screens import component css modules instead of the old shared menu stylesheet", () => {
  assert.match(appSource, /import appStyles from "\.\/App\.module\.css";/);
  assert.doesNotMatch(appSource, /menu-shell\.css/);
  assert.match(menuFrameSource, /import styles from "\.\/MenuFrame\.module\.css";/);
  assert.match(titleScreenSource, /import screenStyles from "\.\/TitleScreen\.module\.css";/);
  assert.match(campaignScreenSource, /import screenStyles from "\.\/CampaignScreen\.module\.css";/);
  assert.match(themeScreenSource, /import screenStyles from "\.\/ThemeScreen\.module\.css";/);
  assert.match(shopScreenSource, /import screenStyles from "\.\/ShopScreen\.module\.css";/);

  assert.match(appModuleSource, /\.appRoot\s*\{/);
  assert.match(menuFrameModuleSource, /\.frame\s*\{/);
  assert.match(titleScreenModuleSource, /\.briefing\s*\{/);
  assert.match(campaignScreenModuleSource, /\.layout\s*\{/);
  assert.match(themeScreenModuleSource, /\.layout\s*\{/);
  assert.match(shopScreenModuleSource, /\.grid\s*\{/);
});

test("react entry mounts the app shell and app source hydrates tower icon markup", () => {
  assert.match(mainEntrypointSource, /ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(<App \/>\);/);
  assert.match(appSource, /from "lucide-react"/);
  assert.doesNotMatch(appSource, /createIcons/);
  assert.match(appSource, /visualViewport/);
  assert.match(appSource, /--browser-safe-bottom/);
  assert.match(appSource, /data-tower-icon/);
  assert.match(appSource, /src=\{iconUrl\}/);
  assert.match(gameMainSource, /createGameSession/);
  assert.match(gameMainSource, /loadMetaProgress/);
  assert.match(gameMainSource, /createGame\(mountNode,\s*\{/);
  assert.doesNotMatch(gameMainSource, /battleOnly:\s*Boolean\(launchPayload\)/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("session",\s*session\);/);
  assert.match(gameMainSource, /phaserGame\.registry\.set\("metaProgress",\s*metaProgress\);/);
});

test("phaser bootstrap only registers battle and overlay scenes for the active runtime", () => {
  assert.doesNotMatch(phaserGameSource, /TitleScene/);
  assert.doesNotMatch(phaserGameSource, /CampaignScene/);
  assert.doesNotMatch(phaserGameSource, /ThemeScene/);
  assert.doesNotMatch(phaserGameSource, /ShopScene/);
  assert.match(phaserGameSource, /import\s+\{\s*OverlayScene\s*\}\s+from "\.\/scenes\/OverlayScene\.js";/);
  assert.match(phaserGameSource, /import\s+\{\s*BattleScene\s*\}\s+from "\.\/scenes\/BattleScene\.js";/);
  assert.match(phaserGameSource, /scene:\s*\[BattleScene,\s*OverlayScene\]/);
});

test("react title and campaign screens preserve the main menu actions", () => {
  assert.match(titleScreenSource, />\s*Shop\s*</);
  assert.match(titleScreenSource, /onOpenShop/);
  assert.match(titleScreenSource, /footerContent=/);
  assert.match(titleScreenSource, />\s*Start Campaign\s*</);

  assert.match(campaignScreenSource, />\s*Back\s*</);
  assert.match(campaignScreenSource, />\s*Briefing\s*</);
  assert.match(campaignScreenSource, /onPreviewTheme/);
  assert.match(campaignScreenSource, /onOpenBriefing/);
  assert.match(campaignScreenSource, /headerContent=/);
  assert.match(campaignScreenSource, /footerContent=/);
});

test("title screen exposes endless mode only through campaign-clear meta progress", () => {
  assert.match(screenDataSource, /highestClearedStage\s*>=\s*getStageCount\(\)/);
  assert.match(titleScreenSource, /Endless Mode/);
  assert.match(appSource, /APP_ACTIONS\.LAUNCH_ENDLESS/);
});

test("app shell guards against iOS double-tap zoom and viewport inset shifts", () => {
  assert.match(appSource, /addEventListener\("touchend"/);
  assert.match(appSource, /passive:\s*false/);
  assert.match(appSource, /event\.preventDefault\(\)/);
  assert.match(appSource, /Date\.now\(\)/);
  assert.match(appSource, /window\.visualViewport\?\.addEventListener\("resize",\s*sync\)/);
});

test("battle scene opens on a ready state and exposes a start button for entry and breaks", () => {
  const createBody = extractMethodBody(battleSceneSource, "create");

  assert.ok(createBody);
  assert.match(appSource, /id="start-button"[\s\S]*Start/);
  assert.match(createBody, /const metaProgress = this\.game\.registry\.get\("metaProgress"\);/);
  assert.match(createBody, /this\.state\s*=\s*createInitialState\(stage,\s*metaProgress,\s*\{\s*mode\s*\}\);/);
  assert.doesNotMatch(battleSceneSource, /this\.state\s*=\s*startGame\(createInitialState\(stage\)\);/);
  assert.match(battleSceneSource, /this\.controls\.startButton\.textContent/);
});

test("battle scene boot reads permanent progression from the registry before building state", () => {
  const createBody = extractMethodBody(battleSceneSource, "create");

  assert.ok(createBody);
  assert.match(createBody, /const metaProgress = this\.game\.registry\.get\("metaProgress"\);/);
  assert.match(createBody, /this\.state = createInitialState\(stage,\s*metaProgress,\s*\{\s*mode\s*\}\);/);
});

test("battle scene restart preserves permanent progression when rebuilding state", () => {
  const restartBattleBody = extractMethodBody(battleSceneSource, "restartBattle");

  assert.ok(restartBattleBody);
  assert.match(restartBattleBody, /this\.state = restartGame\(this\.state\.stage,\s*this\.state\.metaProgress\);/);
  assert.match(restartBattleBody, /this\.handledAttackEffectIds\.clear\(\);/);
  assert.match(restartBattleBody, /this\.renderScene\(\);/);
});

test("battle scene persists stage clear rewards and returns control through the React bridge", () => {
  const persistStageClearRewardsBody = extractMethodBody(battleSceneSource, "persistStageClearRewards");
  const exitToMenuBody = extractMethodBody(battleSceneSource, "exitToMenu");
  const handleStatusTransitionBody = extractMethodBody(battleSceneSource, "handleStatusTransition");

  assert.ok(persistStageClearRewardsBody);
  assert.ok(exitToMenuBody);
  assert.ok(handleStatusTransitionBody);
  assert.match(battleSceneSource, /awardStageClearRewards/);
  assert.match(battleSceneSource, /saveMetaProgress/);
  assert.match(battleSceneSource, /persistStageClearRewards\(stageNumber\)/);
  assert.match(persistStageClearRewardsBody, /this\.game\.registry\.get\("metaProgress"\)\s*\?\?\s*loadMetaProgress\(\)/);
  assert.match(persistStageClearRewardsBody, /awardStageClearRewards\(metaProgress,\s*stageNumber\)/);
  assert.match(persistStageClearRewardsBody, /saveMetaProgress\(nextMetaProgress\)/);
  assert.match(persistStageClearRewardsBody, /this\.game\.registry\.set\("metaProgress",\s*savedProgress\)/);
  assert.match(exitToMenuBody, /const bridge = getUiBridge\(this\);/);
  assert.match(exitToMenuBody, /this\.game\.registry\.set\("session",\s*nextSession\);/);
  assert.match(exitToMenuBody, /bridge\.onExitToMenu\(nextSession,\s*metaProgress\);/);
  assert.match(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "stage-cleared"\) \{[\s\S]*const completedStage = getCompletedBattleStage\(session,\s*this\.state\);[\s\S]*this\.persistStageClearRewards\(completedStage\);[\s\S]*completeBattleStage/,
  );
  assert.match(
    handleStatusTransitionBody,
    /if \(this\.state\.status === "stage-cleared"\) \{[\s\S]*const progressedSession = completeBattleStage\(session,\s*completedStage\);[\s\S]*this\.exitToMenu\(progressedSession\);/,
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

test("battle scene launches the draft overlay after normal wave clears and resolves choices back into battle", () => {
  const handleStatusTransitionBody = extractMethodBody(battleSceneSource, "handleStatusTransition");

  assert.ok(handleStatusTransitionBody);
  assert.match(handleStatusTransitionBody, /if \(this\.state\.status === "draft"\) \{/);
  assert.match(handleStatusTransitionBody, /this\.openOverlay\("draft"/);
  assert.match(battleSceneSource, /resolveDraftChoice\(perkId\)/);
  assert.match(battleSceneSource, /applyBattleDraftChoice\(this\.state,\s*perkId\)/);
});

test("battle scene routes boss sprites by stage theme", () => {
  assert.match(battleSceneSource, /import draculaBossSpriteUrl from "\.\.\/\.\.\/assets\/boss\/transparent\/dracula-boss-transparent\.png";/);
  assert.match(battleSceneSource, /import flameBossSpriteUrl from "\.\.\/\.\.\/assets\/boss\/transparent\/flame-boss-transparent\.png";/);
  assert.match(battleSceneSource, /import frostBossSpriteUrl from "\.\.\/\.\.\/assets\/boss\/transparent\/frost-boss-transparent\.png";/);
  assert.match(battleSceneSource, /const THEME_BOSS_TEXTURE_KEYS = \{[\s\S]*"기초 방어": "enemy-boss-frost",[\s\S]*"압박 대응": "enemy-boss-flame",[\s\S]*"후반 운용": "enemy-boss-dracula",[\s\S]*\};/);
  assert.match(battleSceneSource, /const THEME_BOSS_TEXTURE_URLS = \{[\s\S]*"enemy-boss-frost": frostBossSpriteUrl,[\s\S]*"enemy-boss-flame": flameBossSpriteUrl,[\s\S]*"enemy-boss-dracula": draculaBossSpriteUrl,[\s\S]*\};/);
  assert.match(battleSceneSource, /const THEME_BOSS_FRAME_RECTS = \{[\s\S]*idle:[\s\S]*death:[\s\S]*\};/);
  assert.match(battleSceneSource, /const THEME_BOSS_FRAME_KEYS = \{[\s\S]*idle:[\s\S]*death:[\s\S]*\};/);
  assert.match(battleSceneSource, /for \(const \[key, url\] of Object\.entries\(THEME_BOSS_TEXTURE_URLS\)\)/);
  assert.match(battleSceneSource, /this\.registerBossFrames\(\);/);
  assert.match(battleSceneSource, /registerBossFrames\(\)\s*\{[\s\S]*texture\.add\(frameKeys\[state\], 0, rect\.x, rect\.y, rect\.width, rect\.height\);[\s\S]*\}/);
  assert.match(battleSceneSource, /const textureKey = enemy\.kind === "boss"\s*\?\s*this\.getBossTextureKey\(\)\s*:\s*ENEMY_TEXTURE_KEYS\[enemy\.species\];/);
  assert.match(battleSceneSource, /sprite = this\.add\.image\(0, 0, textureKey, enemy\.kind === "boss" \? this\.getBossFrameKey\(enemy\) : undefined\);/);
  assert.match(battleSceneSource, /sprite\.setAlpha\(this\.getEnemySpriteAlpha\(enemy\)\);/);
  assert.match(battleSceneSource, /sprite\.setTexture\(textureKey,\s*frameKey\);/);
  assert.match(battleSceneSource, /const scale = size \/ Math\.max\(frameRect\.width,\s*frameRect\.height\);/);
  assert.match(battleSceneSource, /getEnemySpriteAlpha\(enemy\)\s*\{[\s\S]*if \(!enemy\.defeated\) \{[\s\S]*return 1;[\s\S]*return Phaser\.Math\.Clamp\(\(enemy\.defeatedTicks \?\? 0\) \/ ENEMY_DEFEAT_TICKS,\s*0,\s*1\);[\s\S]*\}/);
  assert.match(battleSceneSource, /getBossTextureKey\(\)\s*\{[\s\S]*const stageTheme = getStageDefinition\(this\.state\.stage\)\?\.theme;[\s\S]*return THEME_BOSS_TEXTURE_KEYS\[stageTheme\] \?\? ENEMY_TEXTURE_KEYS\.boss;[\s\S]*\}/);
  assert.match(battleSceneSource, /getBossFrameKey\(enemy\)\s*\{[\s\S]*return enemy\.defeated \? themeFrames\?\.death \?\? null : themeFrames\?\.idle \?\? null;/);
  assert.match(battleSceneSource, /getBossFrameRect\(enemy\)\s*\{[\s\S]*return enemy\.defeated \? themeFrames\?\.death[\s\S]*: themeFrames\?\.idle/);
});

test("battle scene imports tower stat lookup for range overlays", () => {
  assert.match(
    battleSceneSource,
    /import\s*\{[\s\S]*getTowerStats,[\s\S]*\}\s*from "\.\.\/\.\.\/game\/logic\.js";/,
  );
});

test("tower actions use readable labels and the battle scene is ready for contextual labels", () => {
  assert.match(appSource, /id="upgrade-action"[\s\S]*Upgrade/);
  assert.match(appSource, /id="delete-action"[\s\S]*Delete/);
  assert.match(appSource, /<h2>Tower Bay<\/h2>/);
  assert.match(appSource, /<p className="dock-label">Select Tower<\/p>/);

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

  assert.match(screenDataSource, /단일 캠페인 루트\. 각 전선은 순차적으로 개방된다\./);
  assert.match(campaignScreenSource, /Campaign Map/);
  assert.match(campaignScreenSource, /Briefing/);

  assert.match(themeScreenSource, /\$\{stage\.theme\} 전선/);
  assert.match(themeScreenSource, /Entry Locked/);
  assert.match(themeScreenSource, /Stage Briefing/);
  assert.match(themeScreenSource, /이 구간은 아직 봉쇄 상태다\. 캠페인에서 앞선 전장을 먼저 확보해야 한다\./);
  assert.doesNotMatch(themeScreenSource, /LOCKED APPROACH/);
  assert.doesNotMatch(themeScreenSource, /\$\{stage\.theme\.toUpperCase\(\)\} FRONT/);

  assert.match(overlaySceneSource, /Stage \$\{stage\} 교전이 중지됐다\. 전투를 재개하거나 재정비 후 복귀할 수 있다\./);
  assert.match(overlaySceneSource, /Stage \$\{stage\} 방어선이 무너졌다\. 같은 구간을 다시 시도하거나 브리핑으로 복귀한다\./);
  assert.match(overlaySceneSource, /Stage \$\{stage\} 확보 완료\. 이제 모든 전장을 캠페인에서 다시 선택할 수 있다\./);
  assert.match(overlaySceneSource, /FIELD CHOICE/);
  assert.match(overlaySceneSource, /다음 웨이브 전에 현장 보급 하나를 선택한다\./);
});

test("draft overlay separates summary, description, and action rows on compact cards", () => {
  const renderDraftOverlayBody = extractMethodBody(overlaySceneSource, "renderDraftOverlay");

  assert.ok(renderDraftOverlayBody);
  assert.match(renderDraftOverlayBody, /const startY = frame\.panelY \+ \(frame\.isMobile \? 16[0-9] : 198\);/);
  assert.match(renderDraftOverlayBody, /const summaryY = /);
  assert.match(renderDraftOverlayBody, /const actionCenterY = /);
  assert.match(renderDraftOverlayBody, /choice\.description/);
  assert.match(renderDraftOverlayBody, /choice\.summary/);
  assert.doesNotMatch(renderDraftOverlayBody, /y \+ 54,\s*choice\.description[\s\S]*y \+ cardHeight - \(frame\.isMobile \? 52 : 62\),\s*choice\.summary/);
});

test("shop screen renders combat unlock cards with a dedicated category style", () => {
  assert.match(shopScreenSource, /SHOP_CARD_STYLE_TOKENS/);
  assert.match(shopScreenSource, /combat:\s*"combat"/);
  assert.match(shopScreenSource, /screenStyles\[`card\$\{styleToken\[0\]\.toUpperCase\(\)\}\$\{styleToken\.slice\(1\)\}`\]/);
});

test("campaign screen keeps preview selection separate from the briefing action", () => {
  assert.match(campaignScreenSource, /onPreviewTheme/);
  assert.match(campaignScreenSource, /onOpenBriefing/);
  assert.match(campaignScreenSource, /footerContent=\{footerActions\}/);
  assert.match(campaignScreenSource, /Campaign themes/);
});

test("campaign screen removes duplicated theme copy and fits a fixed viewport shell", () => {
  assert.match(campaignScreenSource, /title="Stage Command"/);
  assert.match(campaignScreenSource, /screenStyles\.route/);
  assert.match(campaignScreenSource, /screenStyles\.label/);
  assert.match(campaignScreenSource, /screenStyles\.metaText/);
  assert.doesNotMatch(campaignScreenSource, /<span>\s*Theme\s*<\/span>/);
  assert.doesNotMatch(campaignScreenSource, /campaign-card__summary/);
  assert.match(campaignScreenModuleSource, /\.root\s*\{/);
  assert.match(campaignScreenModuleSource, /height:\s*100vh;/);
  assert.match(campaignScreenModuleSource, /height:\s*100dvh;/);
  assert.match(campaignScreenModuleSource, /\.body\s*\{[\s\S]*overflow:\s*hidden;/);
  assert.match(campaignScreenModuleSource, /\.layout\s*\{[\s\S]*min-height:\s*0;/);
});

test("theme screen removes duplicated stage detail text and keeps the stage chooser compact", () => {
  assert.match(themeScreenSource, /title="Stage Briefing"/);
  assert.match(themeScreenSource, /headerContent=/);
  assert.match(themeScreenSource, /footerContent=/);
  assert.match(themeScreenSource, /screenStyles\.meta/);
  assert.match(themeScreenSource, /screenStyles\.stageGrid/);
  assert.match(themeScreenSource, /screenStyles\.stageLabel/);
  assert.match(themeScreenSource, /screenStyles\.stageMeta/);
  assert.doesNotMatch(themeScreenSource, /screenStyles\.stageSummary/);

  assert.match(themeScreenModuleSource, /\.layout\s*\{/);
  assert.match(themeScreenModuleSource, /\.stageGrid\s*\{/);
  assert.match(themeScreenModuleSource, /\.stageCard\s*\{/);
  assert.match(themeScreenModuleSource, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(180px,\s*1fr\)\)/);
});

test("global stylesheet no longer owns react menu frame and screen layout selectors", () => {
  assert.doesNotMatch(stylesSource, /\.menu-frame/);
  assert.doesNotMatch(stylesSource, /\.campaign-layout/);
  assert.doesNotMatch(stylesSource, /\.theme-layout/);
  assert.doesNotMatch(stylesSource, /\.shop-grid/);
  assert.doesNotMatch(stylesSource, /\.title-briefing/);
});

test("shop screen preserves top-level progression stats above the upgrade grid", () => {
  assert.match(shopScreenSource, /headerContent=/);
  assert.match(shopScreenSource, /footerContent=/);
  assert.match(shopScreenSource, /screenStyles\.headerStats/);
  assert.match(shopScreenSource, /screenStyles\.headerStat/);
  assert.match(shopScreenSource, /metaProgress\.currency/);
  assert.match(shopScreenSource, /highestClearedStage/);
  assert.match(shopScreenSource, /aria-label="Meta shop upgrades"/);
});

test("quick play movement buttons render lucide arrow icons", () => {
  assert.match(appSource, /MOVE_BUTTONS = \[/);
  assert.match(appSource, /\{\s*move: "up",\s*Icon: ArrowUp/);
  assert.match(appSource, /\{\s*move: "left",\s*Icon: ArrowLeft/);
  assert.match(appSource, /\{\s*move: "right",\s*Icon: ArrowRight/);
  assert.match(appSource, /\{\s*move: "down",\s*Icon: ArrowDown/);
  assert.match(appSource, /<Icon aria-hidden="true"/);
  assert.doesNotMatch(appSource, /data-lucide=/);
});

test("battle scene keeps the hud compact and biases the field upward", () => {
  assert.match(battleSceneSource, /getBattleViewportLayout\(this,\s*BOARD_WIDTH,\s*BOARD_HEIGHT,\s*\{/);
  assert.match(battleSceneSource, /topPadding:\s*92/);
  assert.match(battleSceneSource, /const dockBottomPadding = this\.getDockBottomPadding\(\);/);
  assert.match(battleSceneSource, /forceBottomDock:\s*true/);
  assert.match(battleSceneSource, /this\.boardScale\s*=\s*viewport\.scale/);
  assert.match(battleSceneSource, /this\.scaledCellSize\s*=\s*CELL_SIZE \* viewport\.scale/);
  assert.match(battleSceneSource, /y:\s*viewport\.boardTop/);
  assert.match(battleSceneSource, /const hudLines = \[/);
  assert.match(battleSceneSource, /this\.hudText\.setText\(hudLines\)/);
  assert.doesNotMatch(battleSceneSource, /`Status \$\{this\.state\.status\}`/);
  assert.doesNotMatch(battleSceneSource, /this\.helpText\.setText\(/);
});

test("battle scene renders tower range overlays and emphasizes the selected tower", () => {
  const renderSceneBody = extractMethodBody(battleSceneSource, "renderScene");
  const drawTowerRangesBody = extractMethodBody(battleSceneSource, "drawTowerRanges");

  assert.ok(renderSceneBody);
  assert.ok(drawTowerRangesBody);
  assert.match(renderSceneBody, /this\.drawTowerRanges\(\);/);
  assert.match(drawTowerRangesBody, /const selectedTowerId = findTowerAt\(this\.state,\s*this\.state\.cursor\.x,\s*this\.state\.cursor\.y\)\?\.id \?\? null;/);
  assert.match(drawTowerRangesBody, /const stats = getTowerStats\(tower,\s*this\.state\.metaProgress,\s*this\.state\.runModifiers\);/);
  assert.match(drawTowerRangesBody, /const radius = this\.scaleLength\(stats\.range \* CELL_SIZE\);/);
  assert.match(drawTowerRangesBody, /const isSelected = tower\.id === selectedTowerId;/);
  assert.match(drawTowerRangesBody, /Phaser\.Display\.Color\.HexStringToColor\(TOWER_TYPES\[tower\.type\]\.color\)\.color/);
  assert.match(drawTowerRangesBody, /this\.graphics\.fillStyle\(fillColor,\s*isSelected \? 0\.2[0-9]* : 0\.1[0-9]*\);/);
  assert.match(drawTowerRangesBody, /this\.graphics\.lineStyle\(isSelected \? 3 : 2,\s*fillColor,\s*isSelected \? 0\.[0-9]+ : 0\.[0-9]+\);/);
  assert.match(drawTowerRangesBody, /this\.graphics\.fillCircle\(x,\s*y,\s*radius\);/);
  assert.match(drawTowerRangesBody, /this\.graphics\.strokeCircle\(x,\s*y,\s*radius\);/);
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

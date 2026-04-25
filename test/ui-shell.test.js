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
const shopSceneSource = readFileSync(new URL("../src/phaser/scenes/ShopScene.js", import.meta.url), "utf8");
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

test("app shell keeps battle controls hidden outside battle and exposes React menu screens", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /TitleScreen/);
  assert.match(appSource, /CampaignScreen/);
  assert.match(appSource, /ThemeScreen/);
  assert.match(appSource, /ShopScreen/);
  assert.match(appSource, /BattleHost/);
  assert.match(appSource, /<section id="battle-controls"[\s\S]*hidden/);
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

test("title scene exposes endless mode only through campaign-clear meta progress", () => {
  assert.match(titleSceneSource, /beginEndlessBattle/);
  assert.match(titleSceneSource, /getStageCount/);
  assert.match(titleSceneSource, /loadMetaProgress/);
  assert.match(titleSceneSource, /highestClearedStage\s*>=\s*getStageCount\(\)/);
  assert.match(titleSceneSource, /"Endless Mode"/);
  assert.match(titleSceneSource, /const commandStackTop = Math\.min\(layout\.command\.top,\s*layout\.command\.bottom - commandStackHeight\);/);
  assert.match(titleSceneSource, /beginEndlessBattle\(getSession\(this\),\s*metaProgress\)/);
  assert.match(titleSceneSource, /this\.scene\.start\("BattleScene"/);
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

  assert.doesNotMatch(titleSceneSource, /전선을 훑고 진입할 전구를 고른다\./);
  assert.doesNotMatch(titleSceneSource, /브리핑이 끝나면 전투를 개시한다\./);
  assert.match(titleSceneSource, /단일 캠페인 루트\. 각 전선은 순차적으로 개방된다\./);

  assert.doesNotMatch(campaignSceneSource, /전구를 전환해 현재 전선을 확인한 뒤 브리핑으로 진입한다\./);
  assert.doesNotMatch(campaignSceneSource, /Rotate the campaign theater, confirm the current sector, then push forward into the briefing screen\./);

  assert.match(themeSceneSource, /\$\{stage\.theme\} 전선/);
  assert.match(themeSceneSource, /ENTRY LOCKED/);
  assert.match(themeSceneSource, /이 구간은 아직 봉쇄 상태다\. 캠페인에서 앞선 전장을 먼저 확보해야 한다\./);
  assert.doesNotMatch(themeSceneSource, /LOCKED APPROACH/);
  assert.doesNotMatch(themeSceneSource, /\$\{stage\.theme\.toUpperCase\(\)\} FRONT/);

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

test("shop scene renders combat unlock cards with a dedicated category style", () => {
  assert.match(shopSceneSource, /combat/);
});

test("campaign scene adds a compact hero tier for mid-width layouts", () => {
  const heroSection = campaignSceneSource.match(/function createThemeHeroCard[\s\S]*?return container;\r?\n\}/)?.[0] ?? "";

  assert.match(campaignSceneSource, /const headerTitle = "";/);
  assert.match(campaignSceneSource, /const titleLockup = createTitleLockup\(/);
  assert.match(campaignSceneSource, /"CAMPAIGN MAP",\s*headerTitle,/);
  assert.match(campaignSceneSource, /const isCompactCampaignLayout = layout\.width <= COMPACT_CAMPAIGN_BREAKPOINT;/);
  assert.match(campaignSceneSource, /compact:\s*isCompactCampaignLayout/);
  assert.match(campaignSceneSource, /const chipY = titleLockup\.kickerText\.y \+ titleLockup\.kickerText\.height \+ 20;/);
  assert.match(heroSection, /const descriptionText = config\.layout\.isMobile \? \(config\.mobileDescription \?\? config\.description\) : config\.description;/);
  assert.match(heroSection, /const showBackgroundLogo = true;/);
  assert.match(heroSection, /const actionButtonWidth = isCompact \? config\.width - 48 : config\.layout\.isMobile \? 132 : 152;/);
  assert.match(heroSection, /const desktopActionLaneWidth = usesDesktopActionLane \? 228 : 0;/);
  assert.match(heroSection, /const actionButtonY = cardHeight - actionButtonHeight - 24;/);
  assert.match(heroSection, /const textBlockBottom = actionButtonY - \(config\.layout\.isMobile \? 16 : 18\);/);
  assert.match(heroSection, /title\.setY\(titleY\);/);
  assert.match(heroSection, /const backgroundLogoWidth = config\.width \* 0\.5;/);
  assert.match(heroSection, /const backgroundLogoHeight = cardHeight \* 0\.5;/);
  assert.match(heroSection, /const backgroundLogoX = config\.width \/ 2;/);
  assert.match(heroSection, /const backgroundLogoY = cardHeight \/ 2;/);
  assert.match(heroSection, /const backgroundLogo = showBackgroundLogo/);
  assert.match(heroSection, /getThemeSigilKey\(config\.theme\)/);
  assert.match(heroSection, /const backgroundLogoScale = Math\.min\(backgroundLogoWidth \/ backgroundLogo\.width,\s*backgroundLogoHeight \/ backgroundLogo\.height\);/);
  assert.match(heroSection, /backgroundLogo\.setScale\(backgroundLogoScale\)/);
  assert.doesNotMatch(heroSection, /backgroundLogo\.setDisplaySize\(/);
  assert.match(heroSection, /backgroundLogo\.setTint\(style\.accent\)/);
  assert.match(heroSection, /const backgroundLogoMaskShape = showBackgroundLogo \? scene\.make\.graphics\(\{ x: config\.x, y: config\.y, add: false \}\) : null;/);
  assert.match(heroSection, /const backgroundLogoMask = backgroundLogoMaskShape \? backgroundLogoMaskShape\.createGeometryMask\(\) : null;/);
  assert.match(heroSection, /backgroundLogo\.setMask\(backgroundLogoMask\)/);
  assert.match(heroSection, /const backgroundShade = showBackgroundLogo \? scene\.add\.graphics\(\) : null;/);
  assert.doesNotMatch(heroSection, /backgroundShade\.fillCircle\(/);
  assert.doesNotMatch(heroSection, /backgroundShade\.fillStyle\(style\.glow,\s*0\.12\);/);
  assert.match(heroSection, /const backgroundFooterFade = showBackgroundLogo \? scene\.add\.graphics\(\) : null;/);
  assert.match(heroSection, /backgroundFooterFade\.fillGradientStyle\(/);
  assert.match(heroSection, /container\.add\(\[\s*panel,\s*\.\.\.\(backgroundLogo \? \[backgroundLogo\] : \[\]\),\s*\.\.\.\(backgroundShade \? \[backgroundShade\] : \[\]\),\s*\.\.\.\(backgroundFooterFade \? \[backgroundFooterFade\] : \[\]\),/);
});

test("shop scene offsets helper copy below the status strips before laying out the grid", () => {
  assert.match(shopSceneSource, /const helperTextY = stripY \+ \(layout\.isMobile \? 52 : 60\);/);
  assert.match(shopSceneSource, /const gridTop = helperTextY \+ \(layout\.isMobile \? 34 : 40\);/);
  assert.match(shopSceneSource, /wordWrap: \{ width: layout\.contentWidth - \(layout\.isMobile \? 24 : 220\) \}/);
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

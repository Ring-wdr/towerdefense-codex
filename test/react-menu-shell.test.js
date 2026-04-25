import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createAppState, hydrateAppState, appReducer } from "../src/app/app-state.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const appStateSource = readFileSync(new URL("../src/app/app-state.js", import.meta.url), "utf8");
const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");
const viteConfigSource = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("app shell renders React-owned menu screens and mounts battle through BattleHost only", () => {
  assert.match(appSource, /TitleScreen/);
  assert.match(appSource, /CampaignScreen/);
  assert.match(appSource, /ThemeScreen/);
  assert.match(appSource, /ShopScreen/);
  assert.match(appSource, /BattleHost/);
  assert.doesNotMatch(appSource, /<PhaserGame/);
});

test("app state keeps React as the source of truth for non-battle screens", () => {
  assert.match(appStateSource, /export function createAppState/);
  assert.match(appStateSource, /scene:\s*"title"/);
  assert.match(appStateSource, /metaProgress:/);
  assert.match(appStateSource, /selectedTheme:/);
  assert.match(appStateSource, /selectedStage:/);
});

test("app routes screen updates through a reducer instead of scattered local state setters", () => {
  assert.match(appSource, /useReducer/);
  assert.doesNotMatch(appSource, /useState/);
  assert.doesNotMatch(appSource, /useMemo/);
  assert.match(appStateSource, /export function appReducer/);
});

test("app reducer keeps campaign, shop, and battle transitions as pure screen-state updates", () => {
  const initialState = hydrateAppState(createAppState().session);

  const campaignState = appReducer(initialState, { type: "screen/open-campaign" });
  assert.equal(campaignState.scene, "campaign");

  const focusedCampaignState = appReducer(campaignState, {
    type: "screen/focus-campaign-stage",
    stageNumber: 1,
  });
  assert.equal(focusedCampaignState.scene, "campaign");
  assert.equal(focusedCampaignState.selectedStage, 1);

  const shopState = appReducer(initialState, { type: "screen/open-shop" });
  assert.equal(shopState.scene, "shop");

  const purchasedState = appReducer(shopState, {
    type: "meta/purchase-complete",
    metaProgress: {
      ...shopState.metaProgress,
      currency: shopState.metaProgress.currency + 50,
    },
  });
  assert.notEqual(purchasedState.metaProgress.currency, shopState.metaProgress.currency);
});

test("battle host passes launch payload and exit callbacks into Phaser", () => {
  assert.match(battleHostSource, /launchPayload/);
  assert.match(battleHostSource, /onExitToMenu/);
  assert.match(battleHostSource, /PhaserGame/);
});

test("vite enables the React Compiler through the official Babel plugin", () => {
  assert.match(packageJson.devDependencies["babel-plugin-react-compiler"], /^\^/);
  assert.match(viteConfigSource, /@vitejs\/plugin-react/);
  assert.match(viteConfigSource, /babel-plugin-react-compiler/);
});

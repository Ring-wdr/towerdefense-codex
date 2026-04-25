import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const appStateSource = readFileSync(new URL("../src/app/app-state.js", import.meta.url), "utf8");
const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");

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

test("battle host passes launch payload and exit callbacks into Phaser", () => {
  assert.match(battleHostSource, /launchPayload/);
  assert.match(battleHostSource, /onExitToMenu/);
  assert.match(battleHostSource, /PhaserGame/);
});

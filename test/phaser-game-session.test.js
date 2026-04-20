import test from "node:test";
import assert from "node:assert/strict";

import {
  beginBattleFromSelection,
  completeBattleStage,
  createGameSession,
  cycleThemeSelection,
  returnToCampaign,
  returnFromBattleToTheme,
  retryBattle,
  selectStage,
} from "../src/phaser/state/game-session.js";

test("game session starts on the title scene with a selected first theme and stage", () => {
  const session = createGameSession();

  assert.equal(session.scene, "title");
  assert.equal(session.selectedStage, 1);
  assert.equal(session.activeStage, null);
  assert.deepEqual(session.clearedStages, []);
});

test("cycling theme selection changes the selected theme without entering battle", () => {
  const next = cycleThemeSelection(createGameSession(), 1);

  assert.equal(next.scene, "campaign");
  assert.notEqual(next.selectedTheme, createGameSession().selectedTheme);
  assert.equal(next.activeStage, null);
});

test("beginBattleFromSelection copies selected stage into active stage", () => {
  const session = beginBattleFromSelection(selectStage(createGameSession(), 1));

  assert.equal(session.scene, "battle");
  assert.equal(session.selectedStage, 1);
  assert.equal(session.activeStage, 1);
});

test("completeBattleStage records clear progress and returns to theme scene", () => {
  const session = completeBattleStage(beginBattleFromSelection(createGameSession()), 1);

  assert.equal(session.scene, "theme");
  assert.deepEqual(session.clearedStages, [1]);
  assert.equal(session.activeStage, null);
  assert.equal(session.selectedStage, 2);
});

test("completeBattleStage enters a terminal completion state after the final stage", () => {
  const session = completeBattleStage(beginBattleFromSelection(selectStage(createGameSession(), 9)), 9);

  assert.equal(session.scene, "campaign-complete");
  assert.equal(session.screen, "campaign-complete");
  assert.deepEqual(session.clearedStages, [9]);
  assert.equal(session.activeStage, null);
  assert.equal(session.selectedStage, 9);
});

test("selecting a cleared stage remains valid for replay", () => {
  const cleared = completeBattleStage(beginBattleFromSelection(createGameSession()), 1);
  const replay = selectStage(cleared, 1);

  assert.equal(replay.selectedStage, 1);
  assert.deepEqual(replay.clearedStages, [1]);
});

test("retryBattle keeps the selected stage active for replay", () => {
  const cleared = completeBattleStage(beginBattleFromSelection(createGameSession()), 1);
  const session = retryBattle(selectStage(cleared, 1));

  assert.equal(session.scene, "battle");
  assert.equal(session.selectedStage, 1);
  assert.equal(session.activeStage, 1);
});

test("returnFromBattleToTheme clears the active stage and restores the theme scene", () => {
  const session = returnFromBattleToTheme(beginBattleFromSelection(selectStage(createGameSession(), 2)));

  assert.equal(session.scene, "theme");
  assert.equal(session.selectedStage, 2);
  assert.equal(session.activeStage, null);
});

test("returnToCampaign restores the campaign scene without changing the selected theme", () => {
  const completed = completeBattleStage(beginBattleFromSelection(selectStage(createGameSession(), 9)), 9);
  const session = returnToCampaign(completed);

  assert.equal(session.scene, "campaign");
  assert.equal(session.activeStage, null);
  assert.equal(session.selectedTheme, completed.selectedTheme);
  assert.equal(session.selectedStage, 9);
});

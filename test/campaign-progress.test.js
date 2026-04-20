import test from "node:test";
import assert from "node:assert/strict";

import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "../src/game/campaign-progress.js";
import { getStageDefinition } from "../src/game/stages.js";

test("campaign progress starts on the title screen with only stage 1 unlocked", () => {
  const progress = createCampaignProgress();

  assert.equal(progress.screen, "title");
  assert.equal(progress.selectedTheme, getStageDefinition(1).theme);
  assert.equal(progress.selectedStage, 1);
  assert.equal(progress.activeStage, null);
  assert.deepEqual(progress.clearedStages, []);
  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), false);
});

test("clearing a stage unlocks the next stage and keeps the cleared stage replayable", () => {
  let progress = createCampaignProgress();
  progress = markStageCleared(progress, 1);

  assert.deepEqual(progress.clearedStages, [1]);
  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), true);
  assert.equal(isStageUnlocked(progress, 3), false);
});

test("theme helpers expose ordered themes and stage numbers from the stage catalog", () => {
  assert.deepEqual(getThemeOrder(), [
    getStageDefinition(1).theme,
    getStageDefinition(4).theme,
    getStageDefinition(7).theme,
  ]);
  assert.deepEqual(getThemeStageNumbers(getStageDefinition(1).theme), [1, 2, 3]);
  assert.deepEqual(getThemeStageNumbers(getStageDefinition(4).theme), [4, 5, 6]);
});

test("selectStageForTheme updates the detail selection without entering battle", () => {
  const selected = selectStageForTheme(createCampaignProgress(), getStageDefinition(1).theme, 2);

  assert.equal(selected.screen, "theme-page");
  assert.equal(selected.selectedTheme, getStageDefinition(1).theme);
  assert.equal(selected.selectedStage, 2);
  assert.equal(selected.activeStage, null);
});

test("clearing later stages keeps earlier cleared stages replayable and unlocks the next stage", () => {
  let progress = createCampaignProgress();
  progress = markStageCleared(progress, 1);
  progress = markStageCleared(progress, 2);
  progress = markStageCleared(progress, 3);

  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), true);
  assert.equal(isStageUnlocked(progress, 3), true);
  assert.equal(isStageUnlocked(progress, 4), true);
});

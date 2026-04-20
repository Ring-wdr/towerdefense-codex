import test from "node:test";
import assert from "node:assert/strict";

import {
  WAVES_PER_STAGE,
  getStageCount,
  getStageDefinition,
  getStageWaveDefinition,
  isStageRoadCell,
} from "../src/game/stages.js";

test("campaign exposes nine ordered stages across three themes", () => {
  assert.equal(getStageCount(), 9);
  assert.equal(WAVES_PER_STAGE, 5);
  assert.equal(getStageDefinition(1).theme, "기본 읽기");
  assert.equal(getStageDefinition(4).theme, "선택 압박");
  assert.equal(getStageDefinition(9).theme, "후반 응용");
});

test("stage wave profiles differ by map identity while preserving boss wave 5", () => {
  const lineStageWave = getStageWaveDefinition(1, 2);
  const cornerStageWave = getStageWaveDefinition(2, 3);
  const exitStageWave = getStageWaveDefinition(6, 4);
  const bossWave = getStageWaveDefinition(1, 5);

  assert.ok(lineStageWave.spawnPlan.includes("runner"));
  assert.ok(!lineStageWave.spawnPlan.includes("shellback"));
  assert.ok(cornerStageWave.spawnPlan.includes("shellback"));
  assert.ok(cornerStageWave.spawnPlan.includes("swarmling"));
  assert.ok(exitStageWave.spawnPlan.includes("wisp"));
  assert.equal(bossWave.boss, true);
  assert.deepEqual(bossWave.spawnPlan, ["boss"]);
});

test("road lookup is stage-specific", () => {
  assert.equal(isStageRoadCell(2, 0, 4), true);
  assert.equal(isStageRoadCell(2, 1, 1), false);
  assert.equal(isStageRoadCell(5, 6, 4), true);
});

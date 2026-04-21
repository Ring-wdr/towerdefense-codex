import test from "node:test";
import assert from "node:assert/strict";

import { TOWER_TYPES } from "../src/game/logic.js";
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
  assert.equal(getStageDefinition(1).theme, "기초 방어");
  assert.equal(getStageDefinition(4).theme, "압박 대응");
  assert.equal(getStageDefinition(9).theme, "후반 운용");
});

test("stage summaries and tower metadata use the tactical korean copy set", () => {
  assert.equal(getStageDefinition(1).summary, "긴 직선을 먼저 장악해 초반 화력을 안정시키는 전선이다.");
  assert.equal(getStageDefinition(5).summary, "초반 병목과 후반 확장 구간이 갈려 운영 전환을 요구한다.");
  assert.equal(getStageDefinition(9).summary, "누적된 약점을 순차적으로 시험하는 최종 방어 구간이다.");

  assert.equal(TOWER_TYPES.attack.description, "기본 화력을 안정적으로 유지하며 grunt와 wisp를 정리하는 표준 포탑.");
  assert.equal(TOWER_TYPES.slow.description, "전진 속도를 묶어 러시 타이밍을 끊고 후속 화력을 벌어주는 제어 포탑.");
  assert.equal(TOWER_TYPES.magic.description, "중장갑 shellback을 뚫고 두 목표를 연쇄 타격하는 비전 포탑.");
  assert.equal(TOWER_TYPES.cannon.description, "병력이 몰린 구간에 폭발 화력을 던져 swarmling 무리를 압축하는 공성 포탑.");
  assert.equal(TOWER_TYPES.hunter.description, "사거리 우위를 살려 가장 빠른 표적을 먼저 끊는 정밀 포탑.");

  assert.equal(TOWER_TYPES.attack.counters, "초반 grunt 정리, wisp 견제");
  assert.equal(TOWER_TYPES.slow.counters, "runner 저지, boss 지연");
  assert.equal(TOWER_TYPES.magic.counters, "shellback 돌파");
  assert.equal(TOWER_TYPES.cannon.counters, "swarmling 정리, shellback 보조 압박");
  assert.equal(TOWER_TYPES.hunter.counters, "runner 차단, wisp 추적");
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

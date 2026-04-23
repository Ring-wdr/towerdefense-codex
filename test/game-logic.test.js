import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createMetaProgress } from "../src/game/meta-progress.js";
import {
  applyBattleDraftChoice,
  buildTowerAtCursor,
  canBuildTower,
  continueCampaign,
  createInitialState,
  deleteTowerAtCursor,
  ENEMY_DEFEAT_TICKS,
  ENEMY_SPECIES,
  getEnemyPosition,
  getPathLength,
  getUnlockedBattlePerkIds,
  getTowerStats,
  getWaveDefinition,
  moveCursor,
  rollBattleDraftChoices,
  resolveDamageAgainstEnemy,
  restartGame,
  selectTowerType,
  setCursorPosition,
  startGame,
  tickGame,
  togglePause,
  upgradeTowerAtCursor,
} from "../src/game/logic.js";
import { ENDLESS_STAGE_NUMBER } from "../src/game/stages.js";

const logicSource = readFileSync(new URL("../src/game/logic.js", import.meta.url), "utf8");

function advance(state, ticks) {
  let next = state;
  for (let index = 0; index < ticks; index += 1) {
    next = tickGame(next);
  }
  return next;
}

function createTower(type, x, y, level = 1) {
  return {
    cooldown: 0,
    id: 1,
    level,
    type,
    x,
    y,
  };
}

function createEnemy({
  id = 1,
  species = "grunt",
  progress = 1.2,
  speed = 0.2,
  health = 100,
  kind = "normal",
} = {}) {
  const definition = ENEMY_SPECIES[species] || ENEMY_SPECIES.grunt;
  return {
    arcaneResist: definition.arcaneResist,
    damageToBase: definition.damageToBase,
    id,
    kind,
    species,
    health,
    maxHealth: health,
    physicalResist: definition.physicalResist,
    progress,
    reward: 10,
    slowFactor: 1,
    slowTicks: 0,
    speed,
  };
}

test("road tiles cannot accept towers", () => {
  const state = createInitialState();
  assert.equal(canBuildTower(state, 0, 3, "attack"), false);
  assert.equal(canBuildTower(state, 1, 1, "attack"), true);
});

test("game starts from main menu", () => {
  const state = createInitialState();
  const next = startGame(state);

  assert.equal(state.status, "ready");
  assert.equal(next.status, "running");
});

test("createInitialState accepts an explicit stage for phaser scene boot", () => {
  const state = createInitialState(5);

  assert.equal(state.stage, 5);
  assert.equal(state.status, "ready");
});

test("createInitialState applies permanent starting gold and life bonuses", () => {
  const metaProgress = createMetaProgress();
  metaProgress.upgrades.globalStartGold = 2;
  metaProgress.upgrades.globalMaxLives = 2;

  const state = createInitialState(1, metaProgress);

  assert.equal(state.gold, 160);
  assert.equal(state.lives, 17);
});

test("createInitialState seeds empty run modifiers and draft state for the current run", () => {
  const state = createInitialState();

  assert.deepEqual(state.runModifiers, {
    cannonDamageMultiplier: 0,
    cannonSplashRadiusBonus: 0,
    magicTargetCountBonus: 0,
    rapidReloadBonus: 0,
    slowExtraTicks: 0,
    slowFactorBonus: 0,
  });
  assert.deepEqual(state.draftHistory, []);
  assert.deepEqual(state.draftChoices, []);
  assert.equal(state.lastDraftSummary, "");
});

test("players can place an opening tower before the battle starts", () => {
  let state = createInitialState();
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);

  assert.equal(state.status, "ready");
  assert.equal(state.towers.length, 1);
  assert.equal(state.gold, 100);
});

test("cursor can be moved to an absolute tile position", () => {
  const state = createInitialState();
  const next = setCursorPosition(state, 99, -4);

  assert.deepEqual(next.cursor, { x: 11, y: 0 });
});

test("building a tower spends gold and occupies the tile", () => {
  let state = startGame(createInitialState());
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);

  assert.equal(state.towers.length, 1);
  assert.equal(state.gold, 100);
  assert.equal(canBuildTower(state, 2, 1, "attack"), false);
});

test("attack towers damage enemies over time", () => {
  let state = startGame(createInitialState());
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);
  state = advance(state, 40);

  assert.ok(
    state.enemies.some((enemy) => enemy.health < enemy.maxHealth),
    "expected the tower to damage at least one enemy",
  );
});

test("upgrading a tower increases its level", () => {
  let state = startGame(createInitialState());
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);
  const beforeGold = state.gold;

  state = upgradeTowerAtCursor(state);

  assert.equal(state.towers[0].level, 2);
  assert.ok(state.gold < beforeGold);
});

test("deleting a tower removes it from the selected grid", () => {
  let state = startGame(createInitialState());
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);
  state = upgradeTowerAtCursor(state);
  const goldBeforeDelete = state.gold;

  state = deleteTowerAtCursor(state);

  assert.equal(state.towers.length, 0);
  assert.equal(state.gold, goldBeforeDelete + 39);
  assert.equal(canBuildTower(state, 2, 1, "attack"), true);
});

test("normal wave spawn plans unlock species by progression thresholds", () => {
  assert.deepEqual(new Set(getWaveDefinition(2).spawnPlan), new Set(["grunt", "runner"]));
  assert.ok(getWaveDefinition(4).spawnPlan.includes("shellback"));
  assert.ok(getWaveDefinition(6).spawnPlan.includes("swarmling"));
  assert.ok(getWaveDefinition(8).spawnPlan.includes("wisp"));
});

test("every fifth wave is a boss wave", () => {
  const wave = getWaveDefinition(5);

  assert.equal(wave.boss, true);
  assert.equal(wave.count, 1);
  assert.ok(wave.health >= 280);
  assert.ok(wave.reward >= 80);
  assert.deepEqual(wave.spawnPlan, ["boss"]);
});

test("shellback resists physical damage but not arcane damage", () => {
  const shellback = createEnemy({ species: "shellback" });
  const attackDamage = resolveDamageAgainstEnemy(shellback, getTowerStats(createTower("attack", 2, 2)));
  const magicDamage = resolveDamageAgainstEnemy(shellback, getTowerStats(createTower("magic", 2, 2)));

  assert.ok(attackDamage < magicDamage);
});

test("wisp resists arcane damage but not physical damage", () => {
  const wisp = createEnemy({ species: "wisp" });
  const attackDamage = resolveDamageAgainstEnemy(wisp, getTowerStats(createTower("attack", 2, 2)));
  const magicDamage = resolveDamageAgainstEnemy(wisp, getTowerStats(createTower("magic", 2, 2)));

  assert.ok(magicDamage < attackDamage);
});

test("getTowerStats applies global and tower-specific meta upgrades", () => {
  const metaProgress = createMetaProgress();
  metaProgress.upgrades.globalDamageBoost = 2;
  metaProgress.upgrades.attackTowerDamage = 1;
  metaProgress.upgrades.attackTowerSpeed = 2;

  const stats = getTowerStats(createTower("attack", 2, 2), metaProgress);

  assert.equal(stats.damage, 14.26);
  assert.equal(stats.cooldown, 6);
});

test("getTowerStats applies temporary run modifiers on top of permanent progression", () => {
  const metaProgress = createMetaProgress();
  metaProgress.upgrades.globalDamageBoost = 1;

  const cannonStats = getTowerStats(
    createTower("cannon", 2, 2),
    metaProgress,
    {
      cannonDamageMultiplier: 0.15,
      cannonSplashRadiusBonus: 0.35,
      magicTargetCountBonus: 0,
      rapidReloadBonus: 0,
      slowExtraTicks: 0,
      slowFactorBonus: 0,
    },
  );
  const magicStats = getTowerStats(
    createTower("magic", 2, 2),
    metaProgress,
    {
      cannonDamageMultiplier: 0,
      cannonSplashRadiusBonus: 0,
      magicTargetCountBonus: 1,
      rapidReloadBonus: 0,
      slowExtraTicks: 0,
      slowFactorBonus: 0,
    },
  );
  const slowStats = getTowerStats(
    createTower("slow", 2, 2),
    metaProgress,
    {
      cannonDamageMultiplier: 0,
      cannonSplashRadiusBonus: 0,
      magicTargetCountBonus: 0,
      rapidReloadBonus: 0,
      slowExtraTicks: 4,
      slowFactorBonus: 0.08,
    },
  );
  const attackStats = getTowerStats(
    createTower("attack", 2, 2),
    metaProgress,
    {
      cannonDamageMultiplier: 0,
      cannonSplashRadiusBonus: 0,
      magicTargetCountBonus: 0,
      rapidReloadBonus: 1,
      slowExtraTicks: 0,
      slowFactorBonus: 0,
    },
  );

  assert.equal(cannonStats.damage, 21.73);
  assert.equal(cannonStats.splashRadius, 1.3);
  assert.equal(magicStats.targetCount, 3);
  assert.equal(slowStats.slowTicks, 14);
  assert.equal(slowStats.slowFactor, 0.57);
  assert.equal(attackStats.cooldown, 7);
});

test("getUnlockedBattlePerkIds includes base perks and purchased combat unlocks", () => {
  const metaProgress = createMetaProgress();
  metaProgress.combatUnlocks.blastTuningUnlock = 1;
  metaProgress.combatUnlocks.deepFreezeUnlock = 1;

  assert.deepEqual(getUnlockedBattlePerkIds(metaProgress), [
    "supplyDrop",
    "emergencyRepair",
    "rapidReload",
    "blastTuning",
    "deepFreeze",
  ]);
});

test("rollBattleDraftChoices returns three unique perks from the unlocked pool", () => {
  const state = createInitialState();
  const rolled = rollBattleDraftChoices(
    state,
    ["supplyDrop", "emergencyRepair", "rapidReload", "blastTuning"],
    () => 0,
  );

  assert.equal(rolled.length, 3);
  assert.equal(new Set(rolled.map((choice) => choice.id)).size, 3);
  assert.deepEqual(rolled.map((choice) => choice.id), [
    "supplyDrop",
    "emergencyRepair",
    "rapidReload",
  ]);
});

test("applyBattleDraftChoice applies immediate and run-long perk effects", () => {
  const initial = createInitialState();
  initial.status = "draft";
  initial.wave = 2;
  initial.gold = 100;
  initial.lives = 10;
  initial.draftChoices = [
    { id: "supplyDrop" },
    { id: "blastTuning" },
    { id: "rapidReload" },
  ];

  const afterSupply = applyBattleDraftChoice(initial, "supplyDrop");
  const afterBlast = applyBattleDraftChoice({
    ...initial,
    draftChoices: [{ id: "blastTuning" }],
  }, "blastTuning");

  assert.equal(afterSupply.gold, 160);
  assert.equal(afterSupply.status, "intermission");
  assert.equal(afterSupply.intermissionTicks, 30);
  assert.deepEqual(afterSupply.draftHistory, ["supplyDrop"]);
  assert.equal(afterSupply.lastDraftSummary, "Supply Drop: +60G");

  assert.equal(afterBlast.runModifiers.cannonDamageMultiplier, 0.15);
  assert.equal(afterBlast.runModifiers.cannonSplashRadiusBonus, 0.35);
  assert.deepEqual(afterBlast.draftHistory, ["blastTuning"]);
  assert.equal(afterBlast.status, "intermission");
  assert.equal(afterBlast.intermissionTicks, 30);
});

test("draft choice restores an intermission before the next wave starts", () => {
  let state = startGame(createInitialState());
  state.wave = 1;
  state.spawnedInWave = getWaveDefinition(state.stage, state.wave).count;
  state.enemies = [];
  state.nextSpawnTick = 999;

  state = tickGame(state);
  const chosenPerkId = state.draftChoices[0].id;
  const afterChoice = applyBattleDraftChoice(state, chosenPerkId);
  const almostRunning = advance(afterChoice, 29);
  const resumed = tickGame(almostRunning);

  assert.equal(afterChoice.status, "intermission");
  assert.equal(afterChoice.intermissionTicks, 30);
  assert.equal(almostRunning.status, "intermission");
  assert.equal(almostRunning.intermissionTicks, 1);
  assert.equal(resumed.status, "running");
  assert.equal(resumed.wave, 2);
});

test("cannon splash damages clustered enemies", () => {
  let state = startGame(createInitialState());
  state.towers = [createTower("cannon", 2, 2)];
  state.enemies = [
    createEnemy({ id: 1, species: "swarmling", progress: 1.15, health: 80 }),
    createEnemy({ id: 2, species: "grunt", progress: 1.45, health: 80 }),
  ];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.ok(state.enemies[0].health < 80);
  assert.ok(state.enemies[1].health < 80);
  assert.ok(state.attackEffects.some((effect) => effect.type === "cannon"));
});

test("defeated enemies linger briefly for death poses before removal", () => {
  let state = startGame(createInitialState());
  state.towers = [createTower("attack", 2, 2)];
  state.enemies = [createEnemy({ id: 1, species: "boss", kind: "boss", progress: 1.2, health: 1 })];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.equal(state.enemies.length, 1);
  assert.equal(state.enemies[0].defeated, true);
  assert.equal(state.enemies[0].defeatedTicks, ENEMY_DEFEAT_TICKS);
  assert.equal(state.enemies[0].health, 0);

  state = advance(state, ENEMY_DEFEAT_TICKS);

  assert.equal(state.enemies.length, 0);
});

test("attack effects carry stable ids and the metadata battle particles need", () => {
  let state = startGame(createInitialState());
  state.towers = [createTower("cannon", 2, 2), createTower("magic", 4, 2)];
  state.enemies = [
    createEnemy({ id: 1, species: "shellback", progress: 1.2, health: 120 }),
    createEnemy({ id: 2, species: "grunt", progress: 1.45, health: 120 }),
    createEnemy({ id: 3, species: "grunt", progress: 1.7, health: 120 }),
  ];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  const cannonEffect = state.attackEffects.find((effect) => effect.type === "cannon");
  const magicEffects = state.attackEffects.filter((effect) => effect.type === "magic");
  const effectIds = state.attackEffects.map((effect) => effect.id);

  assert.ok(cannonEffect, "expected the cannon tower to emit an effect");
  assert.deepEqual(Object.keys(cannonEffect).sort(), ["from", "id", "radius", "to", "ttl", "type"]);
  assert.equal(new Set(effectIds).size, effectIds.length, "expected unique effect ids");
  assert.ok(effectIds.every((id) => Number.isInteger(id) && id > 0));
  assert.ok(magicEffects.every((effect) => effect.from && effect.to));
  assert.equal(state.nextAttackEffectId, Math.max(...effectIds) + 1);
});

test("hunter prioritizes the fastest enemy in range", () => {
  let state = startGame(createInitialState());
  state.towers = [createTower("hunter", 2, 2)];
  state.enemies = [
    createEnemy({ id: 1, species: "grunt", progress: 1.8, speed: 0.16, health: 80 }),
    createEnemy({ id: 2, species: "runner", progress: 1.2, speed: 0.32, health: 80 }),
  ];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.equal(state.enemies[0].health, 80);
  assert.ok(state.enemies[1].health < 80);
  assert.ok(state.attackEffects.some((effect) => effect.type === "hunter"));
});

test("expired attack effects are removed without reusing old ids", () => {
  let state = startGame(createInitialState());
  state.towers = [createTower("attack", 2, 2)];
  state.enemies = [createEnemy({ id: 1, species: "grunt", progress: 1.2, health: 120 })];
  state.nextSpawnTick = 999;

  state = tickGame(state);
  const firstEffectId = state.attackEffects[0]?.id;

  state = advance(state, 5);

  assert.equal(state.attackEffects.length, 0);
  assert.ok(state.nextAttackEffectId > firstEffectId);
});

test("enemies move along the path and can escape", () => {
  let state = startGame(createInitialState());
  state = selectTowerType(state, "slow");
  state = advance(state, 260);

  assert.ok(state.lives < 15, "expected at least one enemy to escape");
  const enemy = state.enemies[0];
  if (enemy) {
    const point = getEnemyPosition(enemy);
    assert.ok(point.x >= 0 && point.y >= 0);
    assert.ok(enemy.progress <= getPathLength());
  }
});

test("boss enemies deal heavier base damage when they escape", () => {
  let state = startGame(createInitialState());
  state.wave = 5;
  state.nextSpawnTick = 1;

  state = advance(state, 220);

  assert.ok(state.lives <= 12, "expected the boss wave to remove at least 3 lives");
});

test("restart resets state", () => {
  let state = startGame(createInitialState());
  state = moveCursor(state, 1, 0);
  state = buildTowerAtCursor(state);
  state = advance(state, 10);
  state = restartGame();

  assert.equal(state.towers.length, 0);
  assert.equal(state.score, 0);
  assert.equal(state.wave, 1);
  assert.equal(state.status, "ready");
});

test("restartGame preserves permanent meta bonuses when rebuilding battle state", () => {
  const metaProgress = createMetaProgress();
  metaProgress.upgrades.globalStartGold = 3;
  metaProgress.upgrades.globalMaxLives = 1;

  const restarted = restartGame(4, metaProgress);

  assert.equal(restarted.stage, 4);
  assert.equal(restarted.gold, 170);
  assert.equal(restarted.lives, 16);
  assert.deepEqual(restarted.metaProgress, createInitialState(4, metaProgress).metaProgress);
  assert.deepEqual(restarted.runModifiers, createInitialState(4, metaProgress).runModifiers);
  assert.deepEqual(restarted.draftHistory, []);
});

test("restartGame can target an explicit stage before battle starts", () => {
  const state = restartGame(4);

  assert.equal(state.stage, 4);
  assert.equal(state.status, "ready");
  assert.equal(state.wave, 1);
});

test("later speed tiers reduce cooldown further for attack and hunter towers", () => {
  const attackTierOneMeta = createMetaProgress();
  attackTierOneMeta.upgrades.attackTowerSpeed = 1;
  const attackTierTwoMeta = createMetaProgress();
  attackTierTwoMeta.upgrades.attackTowerSpeed = 2;
  const attackTierThreeMeta = createMetaProgress();
  attackTierThreeMeta.upgrades.attackTowerSpeed = 3;

  const hunterTierOneMeta = createMetaProgress();
  hunterTierOneMeta.upgrades.hunterTowerSpeed = 1;
  const hunterTierTwoMeta = createMetaProgress();
  hunterTierTwoMeta.upgrades.hunterTowerSpeed = 2;
  const hunterTierThreeMeta = createMetaProgress();
  hunterTierThreeMeta.upgrades.hunterTowerSpeed = 3;

  const attackTierOne = getTowerStats(createTower("attack", 2, 2), attackTierOneMeta);
  const attackTierTwo = getTowerStats(createTower("attack", 2, 2), attackTierTwoMeta);
  const attackTierThree = getTowerStats(createTower("attack", 2, 2), attackTierThreeMeta);
  const hunterTierOne = getTowerStats(createTower("hunter", 2, 2), hunterTierOneMeta);
  const hunterTierTwo = getTowerStats(createTower("hunter", 2, 2), hunterTierTwoMeta);
  const hunterTierThree = getTowerStats(createTower("hunter", 2, 2), hunterTierThreeMeta);

  assert.equal(attackTierOne.cooldown, 7);
  assert.equal(attackTierTwo.cooldown, 6);
  assert.equal(attackTierThree.cooldown, 5);
  assert.equal(hunterTierOne.cooldown, 5);
  assert.equal(hunterTierTwo.cooldown, 4);
  assert.equal(hunterTierThree.cooldown, 3);

  assert.ok(attackTierOne.cooldown > attackTierTwo.cooldown);
  assert.ok(attackTierTwo.cooldown > attackTierThree.cooldown);
  assert.ok(hunterTierOne.cooldown > hunterTierTwo.cooldown);
  assert.ok(hunterTierTwo.cooldown > hunterTierThree.cooldown);
});

test("reduceCooldown derives discrete reductions from speed bonus values instead of raw speed levels", () => {
  assert.match(logicSource, /function reduceCooldown\(cooldown,\s*bonus,\s*bonusStep/);
  assert.match(logicSource, /bonus\s*\/\s*bonusStep/);
  assert.doesNotMatch(logicSource, /function reduceCooldown\([^)]*speedLevel/);
});

test("startGame keeps the selected stage when entering battle", () => {
  const started = startGame(restartGame(6));

  assert.equal(started.stage, 6);
  assert.equal(started.status, "running");
});

test("pause temporarily stops the game loop", () => {
  let state = startGame(createInitialState());
  state = advance(state, 15);
  const paused = togglePause(state);
  const afterTick = tickGame(paused);

  assert.equal(paused.status, "paused");
  assert.deepEqual(afterTick, paused);
});

test("road tiles follow the active stage path", () => {
  const state = createInitialState();
  state.stage = 2;

  assert.equal(canBuildTower(state, 0, 4, "attack"), false);
  assert.equal(canBuildTower(state, 1, 1, "attack"), true);
});

test("clearing the boss wave moves the campaign to the next stage gate", () => {
  let state = startGame(createInitialState());
  state.stage = 1;
  state.wave = 5;
  state.spawnedInWave = 1;
  state.enemies = [];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.equal(state.status, "stage-cleared");
  assert.equal(state.stage, 2);
  assert.equal(state.wave, 1);
  assert.equal(state.spawnedInWave, 0);
});

test("clearing a normal wave pauses for a three-choice field draft before the next wave", () => {
  let state = startGame(createInitialState());
  state.wave = 1;
  state.spawnedInWave = getWaveDefinition(state.stage, state.wave).count;
  state.enemies = [];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.equal(state.status, "draft");
  assert.equal(state.wave, 2);
  assert.equal(state.draftChoices.length, 3);
  assert.equal(new Set(state.draftChoices.map((choice) => choice.id)).size, 3);
});

test("boss wave clear does not open a field draft", () => {
  let state = startGame(createInitialState());
  state.wave = 5;
  state.spawnedInWave = 1;
  state.enemies = [];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.notEqual(state.status, "draft");
});

test("advancing to the next stage clears all towers before the next briefing", () => {
  let state = startGame(createInitialState());
  state.stage = 1;
  state.wave = 5;
  state.spawnedInWave = 1;
  state.enemies = [];
  state.nextSpawnTick = 999;
  state.towers = [createTower("attack", 1, 4), createTower("slow", 1, 1)];

  state = tickGame(state);

  assert.equal(state.status, "stage-cleared");
  assert.equal(state.stage, 2);
  assert.deepEqual(state.towers, []);
});

test("continueCampaign resumes the next stage after a stage clear", () => {
  const state = createInitialState();
  state.stage = 2;
  state.status = "stage-cleared";

  const next = continueCampaign(state);

  assert.equal(next.status, "intermission");
  assert.equal(next.intermissionTicks, 300);
  assert.equal(next.stage, 2);
});

test("intermission auto-resumes the next battle after the countdown", () => {
  const state = createInitialState();
  state.stage = 2;
  state.status = "stage-cleared";

  const intermission = continueCampaign(state);
  const almostReady = advance(intermission, 299);
  const resumed = tickGame(almostReady);

  assert.equal(almostReady.status, "intermission");
  assert.equal(almostReady.intermissionTicks, 1);
  assert.equal(resumed.status, "running");
  assert.equal(resumed.stage, 2);
});

test("startGame can skip an intermission early", () => {
  const state = createInitialState();
  state.stage = 3;
  state.status = "stage-cleared";

  const intermission = continueCampaign(state);
  const started = startGame(intermission);

  assert.equal(intermission.status, "intermission");
  assert.equal(started.status, "running");
  assert.equal(started.intermissionTicks, 0);
});

test("clearing the last stage ends the campaign in victory", () => {
  let state = startGame(createInitialState());
  state.stage = 9;
  state.wave = 5;
  state.spawnedInWave = 1;
  state.enemies = [];
  state.nextSpawnTick = 999;

  state = tickGame(state);

  assert.equal(state.status, "victory");
  assert.equal(state.stage, 9);
});

test("endless mode uses the endless map and continues after boss waves", () => {
  let state = startGame(createInitialState(ENDLESS_STAGE_NUMBER, undefined, { mode: "endless" }));
  state.wave = 5;
  state.spawnedInWave = 1;
  state.enemies = [];
  state.nextSpawnTick = 999;
  state.towers = [createTower("attack", 1, 1)];

  state = tickGame(state);

  assert.equal(state.mode, "endless");
  assert.equal(state.status, "draft");
  assert.equal(state.stage, ENDLESS_STAGE_NUMBER);
  assert.equal(state.wave, 6);
  assert.equal(state.spawnedInWave, 0);
  assert.equal(state.towers.length, 1);
  assert.equal(getWaveDefinition(state.stage, state.wave).boss, false);
});

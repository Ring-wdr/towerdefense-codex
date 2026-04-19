import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTowerAtCursor,
  canBuildTower,
  createInitialState,
  deleteTowerAtCursor,
  ENEMY_SPECIES,
  getEnemyPosition,
  getPathLength,
  getTowerStats,
  getWaveDefinition,
  moveCursor,
  resolveDamageAgainstEnemy,
  restartGame,
  selectTowerType,
  setCursorPosition,
  startGame,
  tickGame,
  togglePause,
  upgradeTowerAtCursor,
} from "../src/game/logic.js";

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

  assert.equal(state.status, "menu");
  assert.equal(next.status, "running");
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

  state = deleteTowerAtCursor(state);

  assert.equal(state.towers.length, 0);
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
  assert.equal(state.status, "menu");
});

test("pause temporarily stops the game loop", () => {
  let state = startGame(createInitialState());
  state = advance(state, 15);
  const paused = togglePause(state);
  const afterTick = tickGame(paused);

  assert.equal(paused.status, "paused");
  assert.deepEqual(afterTick, paused);
});

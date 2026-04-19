export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 60;
export const TICK_MS = 100;
export const MAX_TOWER_LEVEL = 3;

export const PATH_POINTS = [
  { x: 0, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 1 },
  { x: 6, y: 1 },
  { x: 6, y: 5 },
  { x: 9, y: 5 },
  { x: 9, y: 2 },
  { x: 11, y: 2 },
];

export const TOWER_TYPES = {
  attack: {
    name: "Attack",
    cost: 40,
    color: "#3258a8",
    description: "Reliable physical shots that clean up grunts and wisps.",
    counters: "grunts and wisps",
  },
  slow: {
    name: "Slow",
    cost: 55,
    color: "#4d8a57",
    description: "Control tower that chips away while freezing fast rushes.",
    counters: "runners and bosses",
  },
  magic: {
    name: "Magic",
    cost: 70,
    color: "#7e4aa8",
    description: "Arcane bolts pierce shellback armor and hit two targets.",
    counters: "shellbacks",
  },
  cannon: {
    name: "Cannon",
    cost: 85,
    color: "#94643c",
    description: "Slow siege blast with splash damage for swarmlings and packed lanes.",
    counters: "swarmlings and shellbacks",
  },
  hunter: {
    name: "Hunter",
    cost: 95,
    color: "#6f4f2e",
    description: "Long-range sniper that hunts the fastest target in range.",
    counters: "runners and wisps",
  },
};

export const ENEMY_SPECIES = {
  grunt: {
    name: "Grunt",
    color: "#7f2f2f",
    healthMultiplier: 1,
    speedMultiplier: 1,
    rewardMultiplier: 1,
    damageToBase: 1,
    physicalResist: 0,
    arcaneResist: 0,
    size: 12,
    shape: "circle",
  },
  runner: {
    name: "Runner",
    color: "#c46a2b",
    healthMultiplier: 0.72,
    speedMultiplier: 1.42,
    rewardMultiplier: 0.85,
    damageToBase: 1,
    physicalResist: 0,
    arcaneResist: 0,
    size: 11,
    shape: "diamond",
  },
  shellback: {
    name: "Shellback",
    color: "#586a45",
    healthMultiplier: 1.85,
    speedMultiplier: 0.78,
    rewardMultiplier: 1.35,
    damageToBase: 2,
    physicalResist: 0.45,
    arcaneResist: 0,
    size: 13,
    shape: "square",
  },
  wisp: {
    name: "Wisp",
    color: "#4b8c9f",
    healthMultiplier: 1.05,
    speedMultiplier: 1.18,
    rewardMultiplier: 1.2,
    damageToBase: 1,
    physicalResist: 0,
    arcaneResist: 0.5,
    size: 11,
    shape: "triangle",
  },
  swarmling: {
    name: "Swarmling",
    color: "#a44848",
    healthMultiplier: 0.55,
    speedMultiplier: 1.1,
    rewardMultiplier: 0.7,
    damageToBase: 1,
    physicalResist: 0,
    arcaneResist: 0,
    size: 9,
    shape: "ring",
  },
};

const PATH_SEGMENTS = buildPathSegments(PATH_POINTS);
const ROAD_CELLS = expandPathToCells(PATH_POINTS);

export function createInitialState() {
  return {
    attackEffects: [],
    cursor: { x: 1, y: 1 },
    enemies: [],
    gold: 140,
    lives: 15,
    nextEnemyId: 1,
    nextTowerId: 1,
    score: 0,
    selectedTowerType: "attack",
    spawnedInWave: 0,
    status: "menu",
    tick: 0,
    towers: [],
    wave: 1,
    nextSpawnTick: 12,
  };
}

export function startGame(state) {
  if (state.status !== "menu") {
    return state;
  }

  const next = structuredClone(state);
  next.status = "running";
  return next;
}

export function tickGame(state) {
  if (state.status !== "running") {
    return state;
  }

  const next = structuredClone(state);
  next.tick += 1;
  next.attackEffects = next.attackEffects
    .map((effect) => ({ ...effect, ttl: effect.ttl - 1 }))
    .filter((effect) => effect.ttl > 0);

  maybeSpawnEnemy(next);
  moveEnemies(next);
  runTowers(next);
  settleEnemies(next);
  maybeAdvanceWave(next);

  if (next.lives <= 0) {
    next.status = "game-over";
  }

  return next;
}

export function togglePause(state) {
  if (!["running", "paused"].includes(state.status)) {
    return state;
  }

  const next = structuredClone(state);
  next.status = next.status === "paused" ? "running" : "paused";
  return next;
}

export function restartGame() {
  return createInitialState();
}

export function selectTowerType(state, towerType) {
  if (!TOWER_TYPES[towerType]) {
    return state;
  }

  const next = structuredClone(state);
  next.selectedTowerType = towerType;
  return next;
}

export function moveCursor(state, dx, dy) {
  const next = structuredClone(state);
  next.cursor.x = clamp(next.cursor.x + dx, 0, GRID_COLS - 1);
  next.cursor.y = clamp(next.cursor.y + dy, 0, GRID_ROWS - 1);
  return next;
}

export function setCursorPosition(state, x, y) {
  const next = structuredClone(state);
  next.cursor.x = clamp(x, 0, GRID_COLS - 1);
  next.cursor.y = clamp(y, 0, GRID_ROWS - 1);
  return next;
}

export function buildTowerAtCursor(state) {
  if (state.status !== "running") {
    return state;
  }

  const definition = TOWER_TYPES[state.selectedTowerType];
  if (!definition || !canBuildTower(state, state.cursor.x, state.cursor.y, state.selectedTowerType)) {
    return state;
  }

  const next = structuredClone(state);
  next.gold -= definition.cost;
  next.towers.push({
    cooldown: 0,
    id: next.nextTowerId++,
    level: 1,
    type: state.selectedTowerType,
    x: state.cursor.x,
    y: state.cursor.y,
  });
  return next;
}

export function upgradeTowerAtCursor(state) {
  if (state.status !== "running") {
    return state;
  }

  const tower = findTowerAt(state, state.cursor.x, state.cursor.y);
  if (!tower) {
    return state;
  }

  const cost = getUpgradeCost(tower);
  if (tower.level >= MAX_TOWER_LEVEL || state.gold < cost) {
    return state;
  }

  const next = structuredClone(state);
  const nextTower = findTowerAt(next, next.cursor.x, next.cursor.y);
  nextTower.level += 1;
  next.gold -= cost;
  nextTower.cooldown = Math.min(nextTower.cooldown, 2);
  return next;
}

export function deleteTowerAtCursor(state) {
  if (state.status !== "running") {
    return state;
  }

  if (!findTowerAt(state, state.cursor.x, state.cursor.y)) {
    return state;
  }

  const next = structuredClone(state);
  next.towers = next.towers.filter(
    (tower) => !(tower.x === next.cursor.x && tower.y === next.cursor.y),
  );
  return next;
}

export function canBuildTower(state, x, y, towerType) {
  if (!TOWER_TYPES[towerType]) {
    return false;
  }

  if (isRoadCell(x, y)) {
    return false;
  }

  if (findTowerAt(state, x, y)) {
    return false;
  }

  return state.gold >= TOWER_TYPES[towerType].cost;
}

export function findTowerAt(state, x, y) {
  return state.towers.find((tower) => tower.x === x && tower.y === y) || null;
}

export function isRoadCell(x, y) {
  return ROAD_CELLS.has(`${x},${y}`);
}

export function getUpgradeCost(tower) {
  return Math.round(TOWER_TYPES[tower.type].cost * (0.7 + tower.level * 0.25));
}

export function getWaveDefinition(wave) {
  if (wave % 5 === 0) {
    const tier = wave / 5;
    return {
      boss: true,
      count: 1,
      health: 280 + (tier - 1) * 120,
      interval: 999,
      reward: 80 + (tier - 1) * 20,
      speed: 0.12 + (tier - 1) * 0.01,
      spawnPlan: ["boss"],
      speciesPool: ["boss"],
    };
  }

  const presets = [
    { count: 8, health: 34, reward: 10, speed: 0.16 },
    { count: 10, health: 46, reward: 12, speed: 0.18 },
    { count: 12, health: 60, reward: 14, speed: 0.2 },
    { count: 14, health: 76, reward: 16, speed: 0.22 },
  ];

  let base;
  if (wave <= presets.length) {
    base = presets[wave - 1];
  } else {
    const postPresetWave = wave - presets.length - Math.floor((wave - 1) / 5);
    base = {
      count: 14 + postPresetWave * 2,
      health: 76 + postPresetWave * 18,
      reward: 16 + postPresetWave * 2,
      speed: 0.22 + postPresetWave * 0.015,
    };
  }

  const spawnPlan = buildNormalSpawnPlan(wave, base.count);
  return {
    boss: false,
    count: base.count,
    health: base.health,
    interval: Math.max(5, 16 - Math.min(wave, 6) * 2),
    reward: base.reward,
    speed: base.speed,
    spawnPlan,
    speciesPool: Array.from(new Set(spawnPlan)),
  };
}

export function getTowerStats(tower) {
  const levelBonus = tower.level - 1;
  switch (tower.type) {
    case "attack":
      return {
        cooldown: Math.max(4, 8 - levelBonus),
        damage: 12 + levelBonus * 6,
        damageClass: "physical",
        range: 1.9 + levelBonus * 0.2,
        splashDamageScale: 0,
        splashRadius: 0,
        targetCount: 1,
        targeting: "front",
        bonusBySpecies: {},
        slowFactor: 1,
        slowTicks: 0,
      };
    case "slow":
      return {
        cooldown: Math.max(5, 10 - levelBonus),
        damage: 5 + levelBonus * 3,
        damageClass: "control",
        range: 2.2 + levelBonus * 0.2,
        splashDamageScale: 0,
        splashRadius: 0,
        targetCount: 1,
        targeting: "front",
        bonusBySpecies: {
          runner: 1.25,
          boss: 1.1,
        },
        slowFactor: Math.max(0.35, 0.62 - levelBonus * 0.07),
        slowTicks: 10 + levelBonus * 3,
      };
    case "magic":
      return {
        cooldown: Math.max(6, 12 - levelBonus),
        damage: 18 + levelBonus * 8,
        damageClass: "arcane",
        range: 2.5 + levelBonus * 0.15,
        splashDamageScale: 0,
        splashRadius: 0,
        targetCount: 2,
        targeting: "front",
        bonusBySpecies: {
          shellback: 1.2,
        },
        slowFactor: 1,
        slowTicks: 0,
      };
    case "cannon":
      return {
        cooldown: Math.max(8, 14 - levelBonus),
        damage: 18 + levelBonus * 10,
        damageClass: "siege",
        range: 2.4 + levelBonus * 0.1,
        splashDamageScale: 0.65 + levelBonus * 0.05,
        splashRadius: 0.95 + levelBonus * 0.1,
        targetCount: 1,
        targeting: "front",
        bonusBySpecies: {
          swarmling: 1.35,
          shellback: 1.1,
        },
        slowFactor: 1,
        slowTicks: 0,
      };
    case "hunter":
      return {
        cooldown: Math.max(3, 6 - levelBonus),
        damage: 9 + levelBonus * 4,
        damageClass: "physical",
        range: 3.1 + levelBonus * 0.2,
        splashDamageScale: 0,
        splashRadius: 0,
        targetCount: 1,
        targeting: "fastest",
        bonusBySpecies: {
          runner: 1.75,
          wisp: 1.25,
        },
        slowFactor: 1,
        slowTicks: 0,
      };
    default:
      return {
        cooldown: 8,
        damage: 0,
        damageClass: "physical",
        range: 0,
        splashDamageScale: 0,
        splashRadius: 0,
        targetCount: 0,
        targeting: "front",
        bonusBySpecies: {},
        slowFactor: 1,
        slowTicks: 0,
      };
  }
}

export function resolveDamageAgainstEnemy(enemy, attack, scale = 1) {
  let baseDamage = attack.damage * scale;
  if (attack.bonusBySpecies?.[enemy.species]) {
    baseDamage *= attack.bonusBySpecies[enemy.species];
  }

  let resistance = 0;
  if (attack.damageClass === "physical" || attack.damageClass === "siege") {
    resistance = enemy.physicalResist || 0;
  } else if (attack.damageClass === "arcane") {
    resistance = enemy.arcaneResist || 0;
  }

  return Math.max(1, baseDamage * (1 - resistance));
}

export function getEnemyPosition(enemy) {
  return getPointAlongPath(enemy.progress);
}

export function getPathCells() {
  return Array.from(ROAD_CELLS, (cell) => {
    const [x, y] = cell.split(",").map(Number);
    return { x, y };
  });
}

export function getPathLength() {
  return PATH_SEGMENTS.totalLength;
}

function maybeSpawnEnemy(state) {
  const wave = getWaveDefinition(state.wave);
  if (state.spawnedInWave >= wave.count || state.tick < state.nextSpawnTick) {
    return;
  }

  const species = wave.spawnPlan[state.spawnedInWave];
  const enemy = wave.boss ? createBossEnemy(state, wave) : createEnemyFromSpecies(state, wave, species);
  state.enemies.push(enemy);
  state.spawnedInWave += 1;
  state.nextSpawnTick = state.tick + wave.interval;
}

function createBossEnemy(state, wave) {
  return {
    arcaneResist: 0.1,
    damageToBase: 3,
    id: state.nextEnemyId++,
    kind: "boss",
    species: "boss",
    health: wave.health,
    maxHealth: wave.health,
    physicalResist: 0.1,
    progress: 0,
    reward: wave.reward,
    slowFactor: 1,
    slowTicks: 0,
    speed: wave.speed,
  };
}

function createEnemyFromSpecies(state, wave, species) {
  const definition = ENEMY_SPECIES[species] || ENEMY_SPECIES.grunt;
  const health = Math.round(wave.health * definition.healthMultiplier);

  return {
    arcaneResist: definition.arcaneResist,
    damageToBase: definition.damageToBase,
    id: state.nextEnemyId++,
    kind: "normal",
    species,
    health,
    maxHealth: health,
    physicalResist: definition.physicalResist,
    progress: 0,
    reward: Math.max(1, Math.round(wave.reward * definition.rewardMultiplier)),
    slowFactor: 1,
    slowTicks: 0,
    speed: wave.speed * definition.speedMultiplier,
  };
}

function moveEnemies(state) {
  const pathLength = getPathLength();
  for (const enemy of state.enemies) {
    const currentSlowFactor = enemy.slowTicks > 0 ? enemy.slowFactor : 1;
    enemy.progress += enemy.speed * currentSlowFactor;
    if (enemy.slowTicks > 0) {
      enemy.slowTicks -= 1;
      if (enemy.slowTicks <= 0) {
        enemy.slowFactor = 1;
      }
    }
    if (enemy.progress >= pathLength) {
      enemy.escaped = true;
    }
  }
}

function runTowers(state) {
  for (const tower of state.towers) {
    if (tower.cooldown > 0) {
      tower.cooldown -= 1;
      continue;
    }

    const stats = getTowerStats(tower);
    const targets = selectTargetsForTower(state.enemies, tower, stats);
    if (!targets.length) {
      continue;
    }

    applyTowerAttack(state.enemies, tower, stats, targets);
    state.attackEffects.push(...createAttackEffects(tower, stats, targets));
    tower.cooldown = stats.cooldown;
  }
}

function selectTargetsForTower(enemies, tower, stats) {
  const candidates = enemies
    .filter((enemy) => !enemy.escaped)
    .filter((enemy) => distanceBetweenTowerAndEnemy(tower, enemy) <= stats.range);

  if (!candidates.length) {
    return [];
  }

  if (stats.targeting === "fastest") {
    candidates.sort((left, right) => right.speed - left.speed || right.progress - left.progress);
  } else {
    candidates.sort((left, right) => right.progress - left.progress);
  }

  return candidates.slice(0, stats.targetCount);
}

function applyTowerAttack(enemies, tower, stats, targets) {
  for (const target of targets) {
    applyHit(target, stats, 1);

    if (stats.splashRadius > 0 && stats.splashDamageScale > 0) {
      const targetPoint = getEnemyPosition(target);
      for (const splashTarget of enemies) {
        if (splashTarget.id === target.id || splashTarget.escaped) {
          continue;
        }
        const splashPoint = getEnemyPosition(splashTarget);
        const splashDistance =
          Math.hypot(splashPoint.x - targetPoint.x, splashPoint.y - targetPoint.y) / CELL_SIZE;
        if (splashDistance <= stats.splashRadius) {
          applyHit(splashTarget, stats, stats.splashDamageScale);
        }
      }
    }
  }
}

function applyHit(enemy, stats, scale) {
  enemy.health -= resolveDamageAgainstEnemy(enemy, stats, scale);
  if (stats.slowTicks > 0) {
    enemy.slowFactor = Math.min(enemy.slowFactor, stats.slowFactor);
    enemy.slowTicks = Math.max(enemy.slowTicks, stats.slowTicks);
  }
}

function createAttackEffects(tower, stats, targets) {
  const origin = getCellCenter(tower);

  if (tower.type === "cannon") {
    const target = targets[0];
    const point = getEnemyPosition(target);
    return [
      {
        type: "cannon",
        from: origin,
        to: point,
        radius: stats.splashRadius * CELL_SIZE,
        ttl: 4,
      },
    ];
  }

  if (tower.type === "slow") {
    return targets.map((target) => ({
      type: "slow",
      from: origin,
      to: getEnemyPosition(target),
      ttl: 4,
    }));
  }

  if (tower.type === "magic") {
    return targets.map((target, index) => ({
      type: "magic",
      from: index === 0 ? origin : getEnemyPosition(targets[index - 1]),
      to: getEnemyPosition(target),
      ttl: 4,
    }));
  }

  if (tower.type === "hunter") {
    return targets.map((target) => ({
      type: "hunter",
      from: origin,
      to: getEnemyPosition(target),
      ttl: 3,
    }));
  }

  return targets.map((target) => ({
    type: "attack",
    from: origin,
    to: getEnemyPosition(target),
    ttl: 3,
  }));
}

function settleEnemies(state) {
  const survivors = [];
  for (const enemy of state.enemies) {
    if (enemy.escaped) {
      state.lives -= enemy.damageToBase ?? 1;
      continue;
    }
    if (enemy.health <= 0) {
      state.gold += enemy.reward;
      state.score += enemy.reward * 10;
      continue;
    }
    survivors.push(enemy);
  }
  state.enemies = survivors;
}

function maybeAdvanceWave(state) {
  const wave = getWaveDefinition(state.wave);
  if (state.spawnedInWave < wave.count || state.enemies.length > 0) {
    return;
  }

  state.wave += 1;
  state.spawnedInWave = 0;
  state.nextSpawnTick = state.tick + 18;
  state.score += 50;
  state.gold += 20;
}

function buildNormalSpawnPlan(wave, count) {
  return Array.from({ length: count }, (_, index) => pickSpeciesForWave(wave, index, count));
}

function pickSpeciesForWave(wave, index, count) {
  if (wave <= 2) {
    if ((wave === 1 && index === count - 1) || (wave === 2 && index % 5 === 4)) {
      return "runner";
    }
    return "grunt";
  }

  if (wave <= 4) {
    if (index % 4 === 3) {
      return "shellback";
    }
    if (index % 5 === 1) {
      return "runner";
    }
    return "grunt";
  }

  if (wave <= 7) {
    const cycle = index % 6;
    if (cycle === 0 || cycle === 1) {
      return "swarmling";
    }
    if (wave === 7 && cycle === 4) {
      return "shellback";
    }
    if (cycle === 5) {
      return "runner";
    }
    return "grunt";
  }

  const cycle = index % 8;
  if (cycle === 0 || cycle === 1) {
    return "swarmling";
  }
  if (cycle === 2) {
    return "runner";
  }
  if (cycle === 3 || cycle === 6) {
    return "wisp";
  }
  if (cycle === 5) {
    return "shellback";
  }
  return "grunt";
}

function buildPathSegments(points) {
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = getCellCenter(points[index]);
    const end = getCellCenter(points[index + 1]);
    const length = Math.hypot(end.x - start.x, end.y - start.y) / CELL_SIZE;
    segments.push({
      start,
      end,
      startProgress: totalLength,
      length,
    });
    totalLength += length;
  }
  return { segments, totalLength };
}

function getPointAlongPath(progress) {
  if (progress <= 0) {
    return getCellCenter(PATH_POINTS[0]);
  }

  for (const segment of PATH_SEGMENTS.segments) {
    if (progress <= segment.startProgress + segment.length) {
      const localProgress = (progress - segment.startProgress) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * localProgress,
        y: segment.start.y + (segment.end.y - segment.start.y) * localProgress,
      };
    }
  }

  return getCellCenter(PATH_POINTS[PATH_POINTS.length - 1]);
}

function expandPathToCells(points) {
  const cells = new Set();
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const stepX = Math.sign(end.x - start.x);
    const stepY = Math.sign(end.y - start.y);
    let x = start.x;
    let y = start.y;
    cells.add(`${x},${y}`);
    while (x !== end.x || y !== end.y) {
      x += stepX;
      y += stepY;
      cells.add(`${x},${y}`);
    }
  }
  return cells;
}

function getCellCenter(cell) {
  return {
    x: cell.x * CELL_SIZE + CELL_SIZE / 2,
    y: cell.y * CELL_SIZE + CELL_SIZE / 2,
  };
}

function distanceBetweenTowerAndEnemy(tower, enemy) {
  const towerCenter = getCellCenter(tower);
  const enemyPoint = getEnemyPosition(enemy);
  return Math.hypot(enemyPoint.x - towerCenter.x, enemyPoint.y - towerCenter.y) / CELL_SIZE;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

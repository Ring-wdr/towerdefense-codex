# Campaign Stage Level Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single fixed map with a stage-based linear campaign that uses handcrafted paths and stage-specific wave profiles while preserving the current tower/combat system.

**Architecture:** Add a new stage catalog module that owns campaign metadata, path geometry, and wave profile selection. Keep combat resolution inside `src/game/logic.js`, but make it stage-aware and finite per stage, then expose minimal UI updates in `src/main.js` and `index.html` so players can see stage progression and continue between stages.

**Tech Stack:** Vite, vanilla JavaScript ES modules, HTML, CSS, Node test runner

---

## File Structure

- Create: `C:\Users\김만중\private\towerdefense-codex\src\game\stages.js`
  Responsibility: define campaign stages, themes, paths, stage summaries, stage-specific wave profiles, and cached helpers for road/path geometry.
- Modify: `C:\Users\김만중\private\towerdefense-codex\src\game\logic.js`
  Responsibility: replace global path/wave assumptions with stage-aware state, finite stage progression, and victory/stage-clear transitions.
- Modify: `C:\Users\김만중\private\towerdefense-codex\src\main.js`
  Responsibility: render the active stage path every frame, surface stage progression in HUD and overlay text, and wire the continue action for stage transitions.
- Modify: `C:\Users\김만중\private\towerdefense-codex\index.html`
  Responsibility: add the stage HUD slot without changing the broader layout structure.
- Modify: `C:\Users\김만중\private\towerdefense-codex\styles.css`
  Responsibility: absorb one extra HUD block cleanly on desktop and mobile.
- Create: `C:\Users\김만중\private\towerdefense-codex\test\stages.test.js`
  Responsibility: lock the stage catalog, theme ordering, and stage-specific wave profile behavior.
- Modify: `C:\Users\김만중\private\towerdefense-codex\test\game-logic.test.js`
  Responsibility: verify stage-aware road checks, stage-clear transitions, and final campaign victory behavior.
- Create: `C:\Users\김만중\private\towerdefense-codex\test\ui-shell.test.js`
  Responsibility: assert that the stage HUD markup exists in `index.html`.

## Campaign Decisions Locked By This Plan

- Implement `9` stages total.
- Use `3` themes: `기본 읽기`, `선택 압박`, `후반 응용`.
- Use `5` waves per stage.
- Make wave `5` the stage boss wave.
- When a stage boss dies or exits as the last enemy of wave 5, move the game into `stage-cleared` for stages `1-8`.
- When stage `9` is cleared, move the game into `victory`.
- Keep towers, gold, score, and lives across stages.
- Reset only per-stage wave counters and spawn timers when entering the next stage.

### Task 1: Add A Data-Driven Stage Catalog

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\src\game\stages.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\test\stages.test.js`

- [ ] **Step 1: Write failing catalog tests for stage count, theme order, and wave-profile differences**

Create `C:\Users\김만중\private\towerdefense-codex\test\stages.test.js` with:

```js
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
```

- [ ] **Step 2: Run the new stage tests to confirm they fail**

Run:

```bash
node --test test/stages.test.js
```

Expected: FAIL with a module resolution or missing export error because `src/game/stages.js` does not exist yet.

- [ ] **Step 3: Implement `src/game/stages.js` with the full stage catalog and helper APIs**

Create `C:\Users\김만중\private\towerdefense-codex\src\game\stages.js` with:

```js
export const WAVES_PER_STAGE = 5;

const NORMAL_WAVE_BASES = [
  { count: 8, health: 34, reward: 10, speed: 0.16, interval: 12 },
  { count: 10, health: 46, reward: 12, speed: 0.18, interval: 10 },
  { count: 12, health: 60, reward: 14, speed: 0.2, interval: 9 },
  { count: 14, health: 76, reward: 16, speed: 0.22, interval: 8 },
];

const WAVE_PROFILES = {
  "line-pressure": [
    ["grunt", "grunt", "runner"],
    ["grunt", "runner", "grunt", "runner"],
    ["runner", "grunt", "runner", "grunt"],
    ["runner", "grunt", "runner", "runner"],
  ],
  "double-corner": [
    ["grunt", "grunt", "runner"],
    ["grunt", "shellback", "grunt", "runner"],
    ["swarmling", "grunt", "shellback", "swarmling"],
    ["shellback", "swarmling", "runner", "grunt"],
  ],
  "center-cross": [
    ["grunt", "runner", "grunt", "runner"],
    ["grunt", "shellback", "runner", "grunt"],
    ["wisp", "grunt", "shellback", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
  ],
  "outer-ring": [
    ["grunt", "runner", "grunt", "runner"],
    ["grunt", "runner", "shellback", "grunt"],
    ["runner", "wisp", "grunt", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
  ],
  "compress-expand": [
    ["grunt", "grunt", "swarmling", "grunt"],
    ["swarmling", "grunt", "shellback", "swarmling"],
    ["swarmling", "shellback", "runner", "grunt"],
    ["wisp", "shellback", "swarmling", "runner"],
  ],
  "exit-pressure": [
    ["grunt", "runner", "grunt", "runner"],
    ["runner", "grunt", "runner", "shellback"],
    ["runner", "wisp", "grunt", "runner"],
    ["runner", "wisp", "runner", "shellback"],
  ],
  "late-bridge": [
    ["grunt", "runner", "grunt", "shellback"],
    ["swarmling", "grunt", "runner", "shellback"],
    ["wisp", "runner", "shellback", "grunt"],
    ["wisp", "runner", "shellback", "swarmling"],
  ],
  "late-crossfire": [
    ["grunt", "runner", "shellback", "grunt"],
    ["wisp", "grunt", "runner", "shellback"],
    ["wisp", "swarmling", "runner", "shellback"],
    ["wisp", "runner", "shellback", "swarmling"],
  ],
  "last-stand": [
    ["runner", "grunt", "shellback", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
    ["wisp", "swarmling", "runner", "shellback"],
    ["wisp", "runner", "shellback", "runner"],
  ],
};

export const STAGES = [
  {
    number: 1,
    id: "meadow-line",
    name: "초원 전선",
    theme: "기본 읽기",
    summary: "긴 직선에서 장거리 화력을 먼저 세우는 기본형 스테이지.",
    waveProfile: "line-pressure",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 1 },
      { x: 11, y: 1 },
    ],
  },
  {
    number: 2,
    id: "orchard-turn",
    name: "과수원 굽이",
    theme: "기본 읽기",
    summary: "두 번 긁히는 코너를 이용해 느리게 묶고 반복 타격하는 스테이지.",
    waveProfile: "double-corner",
    pathPoints: [
      { x: 0, y: 4 },
      { x: 3, y: 4 },
      { x: 3, y: 1 },
      { x: 7, y: 1 },
      { x: 7, y: 5 },
      { x: 11, y: 5 },
    ],
  },
  {
    number: 3,
    id: "windmill-cross",
    name: "풍차 교차로",
    theme: "기본 읽기",
    summary: "중앙 커버리지가 강한 자리를 놓고 투자 우선순위를 정하는 스테이지.",
    waveProfile: "center-cross",
    pathPoints: [
      { x: 0, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 9, y: 6 },
      { x: 9, y: 1 },
      { x: 11, y: 1 },
    ],
  },
  {
    number: 4,
    id: "ridge-detour",
    name: "능선 우회로",
    theme: "선택 압박",
    summary: "강한 자리가 흩어져 있어 구간별 전담 배치를 요구하는 스테이지.",
    waveProfile: "outer-ring",
    pathPoints: [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 2 },
      { x: 10, y: 2 },
      { x: 10, y: 5 },
      { x: 11, y: 5 },
    ],
  },
  {
    number: 5,
    id: "quarry-funnel",
    name: "채석장 병목",
    theme: "선택 압박",
    summary: "초반 병목과 후반 확장 구간이 분리되어 운영 전환을 강제하는 스테이지.",
    waveProfile: "compress-expand",
    pathPoints: [
      { x: 0, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 9, y: 3 },
      { x: 11, y: 3 },
    ],
  },
  {
    number: 6,
    id: "gate-lastbend",
    name: "성문 마지막 굽이",
    theme: "선택 압박",
    summary: "출구 직전 보강이 없으면 빠른 적이 새는 마감 압박형 스테이지.",
    waveProfile: "exit-pressure",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 1 },
      { x: 8, y: 1 },
      { x: 8, y: 4 },
      { x: 10, y: 4 },
      { x: 10, y: 6 },
      { x: 11, y: 6 },
    ],
  },
  {
    number: 7,
    id: "canal-weave",
    name: "수로 엇갈림",
    theme: "후반 응용",
    summary: "코너와 직선이 교차해 범용 배치와 특화 배치의 균형을 시험하는 스테이지.",
    waveProfile: "late-bridge",
    pathPoints: [
      { x: 0, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 6 },
      { x: 1, y: 6 },
      { x: 1, y: 4 },
      { x: 7, y: 4 },
      { x: 7, y: 1 },
      { x: 11, y: 1 },
    ],
  },
  {
    number: 8,
    id: "citadel-loop",
    name: "성채 회랑",
    theme: "후반 응용",
    summary: "장거리 커버와 코너 압축이 동시에 필요해 한 지점 집중이 위험한 스테이지.",
    waveProfile: "late-crossfire",
    pathPoints: [
      { x: 0, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 3 },
      { x: 11, y: 3 },
    ],
  },
  {
    number: 9,
    id: "last-stand",
    name: "최후 방어선",
    theme: "후반 응용",
    summary: "모든 약점을 순차적으로 찌르는 최종 스테이지.",
    waveProfile: "last-stand",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 5 },
      { x: 11, y: 5 },
    ],
  },
];

const GEOMETRY_CACHE = new Map();

export function getStageCount() {
  return STAGES.length;
}

export function getStageDefinition(stageNumber) {
  const index = clamp(stageNumber, 1, STAGES.length) - 1;
  return STAGES[index];
}

export function getStageWaveDefinition(stageNumber, waveNumber) {
  if (waveNumber === WAVES_PER_STAGE) {
    const stageTier = stageNumber - 1;
    return {
      boss: true,
      count: 1,
      health: 280 + stageTier * 80,
      interval: 999,
      reward: 80 + stageTier * 15,
      speed: 0.12 + stageTier * 0.01,
      spawnPlan: ["boss"],
      speciesPool: ["boss"],
    };
  }

  const stage = getStageDefinition(stageNumber);
  const base = NORMAL_WAVE_BASES[waveNumber - 1];
  const cycle = WAVE_PROFILES[stage.waveProfile][waveNumber - 1];
  const stageTier = stage.number - 1;
  const countBonus = Math.floor(stageTier / 2) * 2;
  const spawnPlan = Array.from({ length: base.count + countBonus }, (_, index) => cycle[index % cycle.length]);

  return {
    boss: false,
    count: spawnPlan.length,
    health: base.health + stageTier * 12,
    interval: base.interval,
    reward: base.reward + stageTier * 2,
    speed: base.speed + stageTier * 0.01,
    spawnPlan,
    speciesPool: Array.from(new Set(spawnPlan)),
  };
}

export function getStagePathCells(stageNumber) {
  return getStageGeometry(stageNumber).cells;
}

export function getStagePathLength(stageNumber) {
  return getStageGeometry(stageNumber).totalLength;
}

export function getStagePointAlongPath(stageNumber, progress) {
  const { segments, points } = getStageGeometry(stageNumber);
  if (progress <= 0) {
    return getCellCenter(points[0]);
  }

  for (const segment of segments) {
    if (progress <= segment.startProgress + segment.length) {
      const localProgress = (progress - segment.startProgress) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * localProgress,
        y: segment.start.y + (segment.end.y - segment.start.y) * localProgress,
      };
    }
  }

  return getCellCenter(points[points.length - 1]);
}

export function isStageRoadCell(stageNumber, x, y) {
  return getStageGeometry(stageNumber).cellSet.has(`${x},${y}`);
}

function getStageGeometry(stageNumber) {
  const stage = getStageDefinition(stageNumber);
  if (!GEOMETRY_CACHE.has(stage.number)) {
    const cellSet = expandPathToCells(stage.pathPoints);
    const cells = Array.from(cellSet, (entry) => {
      const [x, y] = entry.split(",").map(Number);
      return { x, y };
    });
    const { segments, totalLength } = buildPathSegments(stage.pathPoints);
    GEOMETRY_CACHE.set(stage.number, {
      points: stage.pathPoints,
      cellSet,
      cells,
      segments,
      totalLength,
    });
  }
  return GEOMETRY_CACHE.get(stage.number);
}

function buildPathSegments(points) {
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = getCellCenter(points[index]);
    const end = getCellCenter(points[index + 1]);
    const length = Math.hypot(end.x - start.x, end.y - start.y) / 60;
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
    x: cell.x * 60 + 30,
    y: cell.y * 60 + 30,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 4: Run the stage tests again**

Run:

```bash
node --test test/stages.test.js
```

Expected: PASS for all three new stage catalog tests.

- [ ] **Step 5: Commit the stage catalog**

Run:

```bash
git add src/game/stages.js test/stages.test.js
git commit -m "feat: add campaign stage catalog"
```

### Task 2: Make Game Logic Stage-Aware

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\src\game\logic.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\test\game-logic.test.js`

- [ ] **Step 1: Add failing logic tests for stage roads, stage clear, continue, and victory**

Append these tests to `C:\Users\김만중\private\towerdefense-codex\test\game-logic.test.js`:

```js
import { continueCampaign } from "../src/game/logic.js";

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

test("continueCampaign resumes the next stage after a stage clear", () => {
  const state = createInitialState();
  state.stage = 2;
  state.status = "stage-cleared";

  const next = continueCampaign(state);

  assert.equal(next.status, "running");
  assert.equal(next.stage, 2);
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
```

- [ ] **Step 2: Run only the gameplay tests and verify they fail**

Run:

```bash
node --test test/game-logic.test.js
```

Expected: FAIL because `continueCampaign` and stage-aware road/stage progression do not exist yet.

- [ ] **Step 3: Update `src/game/logic.js` to import stage helpers and add stage-aware state**

Apply these changes in `C:\Users\김만중\private\towerdefense-codex\src\game\logic.js`.

Replace the global path constants and helpers with stage imports:

```js
import {
  WAVES_PER_STAGE,
  getStageCount,
  getStagePathCells,
  getStagePathLength,
  getStagePointAlongPath,
  getStageWaveDefinition,
  isStageRoadCell,
} from "./stages.js";

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 60;
export const TICK_MS = 100;
export const MAX_TOWER_LEVEL = 3;
```

Add `stage` to initial state and export `continueCampaign`:

```js
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
    stage: 1,
    status: "menu",
    tick: 0,
    towers: [],
    wave: 1,
    nextSpawnTick: 12,
  };
}

export function continueCampaign(state) {
  if (state.status !== "stage-cleared") {
    return state;
  }

  const next = structuredClone(state);
  next.status = "running";
  return next;
}
```

Replace stage-independent path and wave helpers with stage-aware wrappers:

```js
export function getWaveDefinition(stageNumber, waveNumber) {
  return getStageWaveDefinition(stageNumber, waveNumber);
}

export function getEnemyPosition(enemy) {
  return getStagePointAlongPath(enemy.stage ?? 1, enemy.progress);
}

export function getPathCells(stageNumber = 1) {
  return getStagePathCells(stageNumber);
}

export function getPathLength(stageNumber = 1) {
  return getStagePathLength(stageNumber);
}
```

Update build checks and enemy creation to use the active stage:

```js
export function canBuildTower(state, x, y, towerType) {
  if (!TOWER_TYPES[towerType]) {
    return false;
  }

  if (isStageRoadCell(state.stage, x, y)) {
    return false;
  }

  if (findTowerAt(state, x, y)) {
    return false;
  }

  return state.gold >= TOWER_TYPES[towerType].cost;
}

function createBossEnemy(state, wave) {
  return {
    arcaneResist: 0.1,
    damageToBase: 3,
    id: state.nextEnemyId++,
    kind: "boss",
    species: "boss",
    stage: state.stage,
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
    stage: state.stage,
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
```

Update ticking to use stage-specific waves and finite stage progression:

```js
function maybeSpawnEnemy(state) {
  const wave = getWaveDefinition(state.stage, state.wave);
  if (state.spawnedInWave >= wave.count || state.tick < state.nextSpawnTick) {
    return;
  }

  const species = wave.spawnPlan[state.spawnedInWave];
  const enemy = wave.boss ? createBossEnemy(state, wave) : createEnemyFromSpecies(state, wave, species);
  state.enemies.push(enemy);
  state.spawnedInWave += 1;
  state.nextSpawnTick = state.tick + wave.interval;
}

function moveEnemies(state) {
  for (const enemy of state.enemies) {
    const pathLength = getStagePathLength(enemy.stage ?? state.stage);
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

function maybeAdvanceWave(state) {
  const wave = getWaveDefinition(state.stage, state.wave);
  if (state.spawnedInWave < wave.count || state.enemies.length > 0) {
    return;
  }

  state.score += 50;
  state.gold += 20;

  if (state.wave < WAVES_PER_STAGE) {
    state.wave += 1;
    state.spawnedInWave = 0;
    state.nextSpawnTick = state.tick + 18;
    return;
  }

  if (state.stage < getStageCount()) {
    state.stage += 1;
    state.wave = 1;
    state.spawnedInWave = 0;
    state.nextSpawnTick = state.tick + 18;
    state.status = "stage-cleared";
    return;
  }

  state.status = "victory";
}
```

Delete these no-longer-valid globals and helpers entirely:

- Remove the exported `PATH_POINTS` constant.
- Remove the cached `PATH_SEGMENTS` declaration.
- Remove the cached `ROAD_CELLS` declaration.
- Remove `buildNormalSpawnPlan`.
- Remove `pickSpeciesForWave`.
- Remove the old in-file `buildPathSegments`.
- Remove the old in-file `getPointAlongPath`.
- Remove the old in-file `expandPathToCells`.

- [ ] **Step 4: Run the gameplay tests again**

Run:

```bash
node --test test/game-logic.test.js
```

Expected: PASS for the existing combat tests plus the new stage progression tests.

- [ ] **Step 5: Commit the stage-aware gameplay logic**

Run:

```bash
git add src/game/logic.js test/game-logic.test.js
git commit -m "feat: add stage-based campaign progression"
```

### Task 3: Surface Stage Progress In The UI

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\src\main.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\index.html`
- Modify: `C:\Users\김만중\private\towerdefense-codex\styles.css`
- Create: `C:\Users\김만중\private\towerdefense-codex\test\ui-shell.test.js`

- [ ] **Step 1: Add a failing shell test for the stage HUD slot**

Create `C:\Users\김만중\private\towerdefense-codex\test\ui-shell.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("hud markup exposes the stage progress slot", () => {
  assert.match(html, /<span class="hud-label">Stage<\/span>/);
  assert.match(html, /id="stage-value"/);
});
```

- [ ] **Step 2: Run the markup test and verify it fails**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: FAIL because the current HUD does not contain `stage-value`.

- [ ] **Step 3: Update `index.html`, `styles.css`, and `src/main.js` for stage HUD and stage-clear overlay flow**

In `C:\Users\김만중\private\towerdefense-codex\index.html`, add a stage HUD block after the existing wave block:

```html
<div class="hud-block">
  <span class="hud-label">Stage</span>
  <strong id="stage-value">1 / 9</strong>
</div>
```

In `C:\Users\김만중\private\towerdefense-codex\styles.css`, change the desktop HUD column count:

```css
.hud {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  grid-area: hud;
  padding: 1px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(14, 20, 20, 0.82);
  backdrop-filter: blur(8px);
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(5, 10, 10, 0.32);
}
```

In `C:\Users\김만중\private\towerdefense-codex\src\main.js`, import stage helpers and the new continue action:

```js
import {
  buildTowerAtCursor,
  canBuildTower,
  CELL_SIZE,
  continueCampaign,
  createInitialState,
  deleteTowerAtCursor,
  ENEMY_SPECIES,
  findTowerAt,
  getEnemyPosition,
  getPathCells,
  getTowerStats,
  GRID_COLS,
  GRID_ROWS,
  moveCursor,
  restartGame,
  selectTowerType,
  setCursorPosition,
  startGame,
  tickGame,
  TICK_MS,
  TOWER_TYPES,
  togglePause,
  upgradeTowerAtCursor,
} from "./game/logic.js";
import { getStageCount, getStageDefinition } from "./game/stages.js";
```

Add the stage HUD element reference and remove the fixed `roadCells` constant:

```js
const stageValue = document.getElementById("stage-value");

// delete this line entirely
// const roadCells = getPathCells();
```

Change `drawRoad()` to use the current stage on every render:

```js
function drawRoad() {
  const roadCells = getPathCells(state.stage);
  for (const cell of roadCells) {
    drawTile(cell.x, cell.y, roadTileSprites, "#b08d60");
    context.strokeStyle = "rgba(84, 58, 29, 0.22)";
    context.strokeRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}
```

Update `drawLegend()` so the board footer identifies the current stage:

```js
function drawLegend() {
  const tower = findTowerAt(state, state.cursor.x, state.cursor.y);
  const stage = getStageDefinition(state.stage);
  const boxY = canvas.height - 72;
  context.fillStyle = "rgba(248, 245, 236, 0.94)";
  context.fillRect(12, boxY, canvas.width - 24, 60);

  context.fillStyle = "#1f2430";
  context.font = "13px Georgia";
  context.textAlign = "left";
  context.fillText(`${stage.theme} · Stage ${stage.number} · ${stage.name}`, 24, boxY + 18);

  const tileLabel = tower
    ? `${TOWER_TYPES[tower.type].name} tower Lv.${tower.level}`
    : canBuildTower(state, state.cursor.x, state.cursor.y, state.selectedTowerType)
      ? "Empty build tile"
      : "Road tile";

  context.font = "14px Georgia";
  context.fillText(`Cursor ${state.cursor.x + 1},${state.cursor.y + 1} · ${tileLabel}`, 24, boxY + 38);
  context.fillStyle = "#58606e";
  context.font = "12px Georgia";
  context.fillText(stage.summary, 24, boxY + 56);
}
```

Update `syncHud()` to show stage progress and new overlay states:

```js
function syncHud() {
  const stage = getStageDefinition(state.stage);

  stageValue.textContent = `${state.stage} / ${getStageCount()}`;
  waveValue.textContent = String(state.wave);
  goldValue.textContent = String(state.gold);
  scoreValue.textContent = String(state.score);
  livesValue.textContent = String(state.lives);
  statusValue.textContent =
    state.status === "menu"
      ? "Main"
      : state.status === "game-over"
        ? "Game Over"
        : state.status === "paused"
          ? "Paused"
          : state.status === "stage-cleared"
            ? "Stage Clear"
            : state.status === "victory"
              ? "Victory"
              : "Running";

  overlay.hidden = state.status === "running";

  if (state.status === "menu") {
    overlayKicker.textContent = stage.theme;
    overlayTitle.textContent = `Stage ${stage.number}: ${stage.name}`;
    overlayBody.textContent = stage.summary;
    overlayPrimary.textContent = "Start Game";
    overlayPrimary.dataset.action = "start";
    overlaySecondary.hidden = true;
  } else if (state.status === "paused") {
    overlayKicker.textContent = "Paused";
    overlayTitle.textContent = "Game Stopped Temporarily";
    overlayBody.textContent = "Enemy movement, tower attacks, and wave progress are all frozen until you resume.";
    overlayPrimary.textContent = "Resume";
    overlayPrimary.dataset.action = "resume";
    overlaySecondary.hidden = false;
    overlaySecondary.textContent = "Restart";
  } else if (state.status === "stage-cleared") {
    overlayKicker.textContent = stage.theme;
    overlayTitle.textContent = `Next Stage: ${stage.name}`;
    overlayBody.textContent = stage.summary;
    overlayPrimary.textContent = "Continue";
    overlayPrimary.dataset.action = "continue";
    overlaySecondary.hidden = false;
    overlaySecondary.textContent = "Restart";
  } else if (state.status === "victory") {
    overlayKicker.textContent = "Campaign Clear";
    overlayTitle.textContent = `Final Score: ${state.score}`;
    overlayBody.textContent = "You cleared every handcrafted stage in the campaign. Restart to play from Stage 1 again.";
    overlayPrimary.textContent = "Restart";
    overlayPrimary.dataset.action = "restart";
    overlaySecondary.hidden = true;
  } else if (state.status === "game-over") {
    overlayKicker.textContent = "Game Over";
    overlayTitle.textContent = `Final Score: ${state.score}`;
    overlayBody.textContent = "The swarm reached the exit. Restart to return to Stage 1 and try again.";
    overlayPrimary.textContent = "Restart";
    overlayPrimary.dataset.action = "restart";
    overlaySecondary.hidden = true;
  }
}
```

Update the overlay button handler:

```js
overlayPrimary.addEventListener("click", () => {
  if (overlayPrimary.dataset.action === "start") {
    update((current) => startGame(current));
  } else if (overlayPrimary.dataset.action === "resume") {
    update((current) => togglePause(current));
  } else if (overlayPrimary.dataset.action === "continue") {
    update((current) => continueCampaign(current));
  } else if (overlayPrimary.dataset.action === "restart") {
    state = restartGame();
    render();
  }
});
```

- [ ] **Step 4: Run the markup test and a production build**

Run:

```bash
node --test test/ui-shell.test.js
npm run build
```

Expected:
- `test/ui-shell.test.js`: PASS
- `npm run build`: Vite production build succeeds without new warnings

- [ ] **Step 5: Commit the stage UI flow**

Run:

```bash
git add index.html styles.css src/main.js test/ui-shell.test.js
git commit -m "feat: show campaign stage progress in ui"
```

### Task 4: Run Full Verification And Manual QA

**Files:**
- Verify: `C:\Users\김만중\private\towerdefense-codex\src\game\stages.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\src\game\logic.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\src\main.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\index.html`
- Verify: `C:\Users\김만중\private\towerdefense-codex\styles.css`
- Verify: `C:\Users\김만중\private\towerdefense-codex\test\stages.test.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\test\game-logic.test.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\test\ui-shell.test.js`

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
npm test
```

Expected: all Node tests pass, including the new stage catalog, gameplay progression, and UI shell checks.

- [ ] **Step 2: Run the production build one more time**

Run:

```bash
npm run build
```

Expected: successful Vite build with no broken imports from the new `stages.js` module.

- [ ] **Step 3: Run manual QA in the browser**

Run:

```bash
npm run dev
```

Check all of these manually:

```text
- Menu overlay shows Stage 1 name, theme, and summary before starting
- HUD shows Stage as "1 / 9" after the page loads
- The road layout visibly changes after clearing Stage 1 and pressing Continue
- Stage-cleared overlay appears between Stage 1 and Stage 2 instead of silently switching
- Boss wave 5 clears into Stage 2 without resetting towers, gold, score, or lives
- Final stage clear shows the victory overlay instead of looping forever
- Restart from menu, stage-cleared, victory, and game-over always returns to Stage 1
```

- [ ] **Step 4: If verification exposed no further code changes, stop without creating an empty commit**

If files changed during manual fixes, run:

```bash
git add src/game/stages.js src/game/logic.js src/main.js index.html styles.css test/stages.test.js test/game-logic.test.js test/ui-shell.test.js
git commit -m "fix: polish campaign stage rollout"
```

If no files changed, do not create an empty commit.

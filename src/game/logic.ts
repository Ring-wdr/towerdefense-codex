import {
  WAVES_PER_STAGE,
  ENDLESS_STAGE_NUMBER,
  getStageCount,
  getStagePathCells,
  getStagePathLength,
  getStagePointAlongPath,
  getStageWaveDefinition,
  isStageRoadCell,
} from "./stages";
import {
  createRunModifiers,
  getBattlePerkDefinition,
  getUnlockedBattlePerkIds,
  normalizeRunModifiers,
} from "./battle-perks";
import { getMetaBattleModifiers } from "./meta-battle-modifiers";
import { createMetaProgress, normalizeMetaProgress } from "./meta-progress";
import type {
  BattleDraftChoice,
  BattlePerkDefinition,
  BattlePerkId,
  RunModifiers,
} from "./battle-perks";
import type { MetaProgress } from "./meta-progress";
import type { Point, GridCell, WaveDefinition, WaveSpecies } from "./stages";

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 60;
export const TICK_MS = 100;
export const MAX_TOWER_LEVEL = 3;
export const INTERMISSION_TICKS = 300;
export const DRAFT_INTERMISSION_TICKS = 30;
export const ENEMY_DEFEAT_TICKS = 10;

export type TowerType = "attack" | "slow" | "magic" | "cannon" | "hunter";
export type EnemyKind = "normal" | "boss";
export type BattleMode = "campaign" | "endless";
export type BattleStatus =
  | "ready"
  | "running"
  | "paused"
  | "game-over"
  | "draft"
  | "stage-cleared"
  | "victory"
  | "intermission";
export type DamageClass = "physical" | "control" | "arcane" | "siege";
export type TargetingMode = "front" | "fastest";
export type EnemySpeciesId = Exclude<WaveSpecies, "boss"> | "boss";

export interface TowerDefinition {
  name: string;
  cost: number;
  color: string;
  description: string;
  counters: string;
}

export interface EnemySpeciesDefinition {
  name: string;
  color: string;
  healthMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  damageToBase: number;
  physicalResist: number;
  arcaneResist: number;
  size: number;
  shape: string;
}

export interface Cursor {
  x: number;
  y: number;
}

export interface Tower {
  cooldown: number;
  id: number;
  level: number;
  type: TowerType;
  x: number;
  y: number;
}

export interface Enemy {
  arcaneResist: number;
  damageToBase: number;
  defeated: boolean;
  defeatedTicks: number;
  escaped?: boolean;
  health: number;
  id: number;
  kind: EnemyKind;
  maxHealth: number;
  physicalResist: number;
  progress: number;
  reward: number;
  slowFactor: number;
  slowTicks: number;
  species: EnemySpeciesId;
  speed: number;
  stage: number;
}

export interface TowerStats {
  cooldown: number;
  damage: number;
  damageClass: DamageClass;
  range: number;
  splashDamageScale: number;
  splashRadius: number;
  targetCount: number;
  targeting: TargetingMode;
  bonusBySpecies: Partial<Record<EnemySpeciesId, number>>;
  slowFactor: number;
  slowTicks: number;
}

export interface AttackEffect {
  id: number;
  type: TowerType;
  from: Point;
  to: Point;
  ttl: number;
  radius?: number;
}

export interface BattleState {
  attackEffects: AttackEffect[];
  cursor: Cursor;
  enemies: Enemy[];
  gold: number;
  lives: number;
  metaProgress: MetaProgress;
  mode: BattleMode;
  nextAttackEffectId: number;
  nextEnemyId: number;
  nextTowerId: number;
  draftChoices: BattleDraftChoice[];
  draftHistory: BattlePerkId[];
  lastDraftSummary: string;
  score: number;
  runModifiers: RunModifiers;
  selectedTowerType: TowerType;
  spawnedInWave: number;
  stage: number;
  status: BattleStatus;
  tick: number;
  towers: Tower[];
  wave: number;
  nextSpawnTick: number;
  intermissionTicks: number;
}

interface BattleStartOptions {
  mode?: BattleMode;
}

export const TOWER_TYPES: Record<TowerType, TowerDefinition> = {
  attack: {
    name: "Attack",
    cost: 40,
    color: "#3258a8",
    description: "기본 화력을 안정적으로 유지하며 grunt와 wisp를 정리하는 표준 포탑.",
    counters: "초반 grunt 정리, wisp 견제",
  },
  slow: {
    name: "Slow",
    cost: 55,
    color: "#4d8a57",
    description: "전진 속도를 묶어 러시 타이밍을 끊고 후속 화력을 벌어주는 제어 포탑.",
    counters: "runner 저지, boss 지연",
  },
  magic: {
    name: "Magic",
    cost: 70,
    color: "#7e4aa8",
    description: "중장갑 shellback을 뚫고 두 목표를 연쇄 타격하는 비전 포탑.",
    counters: "shellback 돌파",
  },
  cannon: {
    name: "Cannon",
    cost: 85,
    color: "#94643c",
    description: "병력이 몰린 구간에 폭발 화력을 던져 swarmling 무리를 압축하는 공성 포탑.",
    counters: "swarmling 정리, shellback 보조 압박",
  },
  hunter: {
    name: "Hunter",
    cost: 95,
    color: "#6f4f2e",
    description: "사거리 우위를 살려 가장 빠른 표적을 먼저 끊는 정밀 포탑.",
    counters: "runner 차단, wisp 추적",
  },
};

export const ENEMY_SPECIES: Record<Exclude<EnemySpeciesId, "boss">, EnemySpeciesDefinition> = {
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

export { getUnlockedBattlePerkIds } from "./battle-perks";

function getBattleMode(stage: number, options: BattleStartOptions = {}): BattleMode {
  return options.mode === "endless" || stage === ENDLESS_STAGE_NUMBER ? "endless" : "campaign";
}

export function createInitialState(
  stage = 1,
  metaProgress: unknown = createMetaProgress(),
  options: BattleStartOptions = {},
): BattleState {
  const normalizedMetaProgress = normalizeMetaProgress(metaProgress);
  const metaModifiers = getMetaBattleModifiers(normalizedMetaProgress);
  const mode = getBattleMode(stage, options);

  return {
    attackEffects: [],
    cursor: { x: 1, y: 1 },
    enemies: [],
    gold: 140 + metaModifiers.startGold,
    lives: 15 + metaModifiers.maxLives,
    metaProgress: normalizedMetaProgress,
    mode,
    nextAttackEffectId: 1,
    nextEnemyId: 1,
    nextTowerId: 1,
    draftChoices: [],
    draftHistory: [],
    lastDraftSummary: "",
    score: 0,
    runModifiers: createRunModifiers(),
    selectedTowerType: "attack",
    spawnedInWave: 0,
    stage,
    status: "ready",
    tick: 0,
    towers: [],
    wave: 1,
    nextSpawnTick: 12,
    intermissionTicks: 0,
  };
}

export function startGame(state: BattleState): BattleState {
  if (!["ready", "intermission"].includes(state.status)) {
    return state;
  }

  const next = structuredClone(state);
  next.status = "running";
  next.intermissionTicks = 0;
  return next;
}

export function continueCampaign(state: BattleState): BattleState {
  if (state.status !== "stage-cleared") {
    return state;
  }

  const next = structuredClone(state);
  next.status = "intermission";
  next.intermissionTicks = INTERMISSION_TICKS;
  return next;
}

export function tickGame(state: BattleState): BattleState {
  if (state.status === "intermission") {
    const next = structuredClone(state);
    next.intermissionTicks = Math.max(0, next.intermissionTicks - 1);
    if (next.intermissionTicks === 0) {
      next.status = "running";
    }
    return next;
  }

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

export function togglePause(state: BattleState): BattleState {
  if (!["running", "paused"].includes(state.status)) {
    return state;
  }

  const next = structuredClone(state);
  next.status = next.status === "paused" ? "running" : "paused";
  return next;
}

export function restartGame(
  stage = 1,
  metaProgress: unknown = createMetaProgress(),
  options: BattleStartOptions = {},
): BattleState {
  return createInitialState(stage, metaProgress, options);
}

export function selectTowerType(state: BattleState, towerType: TowerType): BattleState {
  if (!TOWER_TYPES[towerType]) {
    return state;
  }

  const next = structuredClone(state);
  next.selectedTowerType = towerType;
  return next;
}

export function moveCursor(state: BattleState, dx: number, dy: number): BattleState {
  const next = structuredClone(state);
  next.cursor.x = clamp(next.cursor.x + dx, 0, GRID_COLS - 1);
  next.cursor.y = clamp(next.cursor.y + dy, 0, GRID_ROWS - 1);
  return next;
}

export function setCursorPosition(state: BattleState, x: number, y: number): BattleState {
  const next = structuredClone(state);
  next.cursor.x = clamp(x, 0, GRID_COLS - 1);
  next.cursor.y = clamp(y, 0, GRID_ROWS - 1);
  return next;
}

export function buildTowerAtCursor(state: BattleState): BattleState {
  if (!canManageBattlefield(state.status)) {
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

export function upgradeTowerAtCursor(state: BattleState): BattleState {
  if (!canManageBattlefield(state.status)) {
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
  if (!nextTower) {
    return state;
  }

  nextTower.level += 1;
  next.gold -= cost;
  nextTower.cooldown = Math.min(nextTower.cooldown, 2);
  return next;
}

export function deleteTowerAtCursor(state: BattleState): BattleState {
  if (!canManageBattlefield(state.status)) {
    return state;
  }

  const tower = findTowerAt(state, state.cursor.x, state.cursor.y);
  if (!tower) {
    return state;
  }

  const next = structuredClone(state);
  next.gold += getTowerRefund(tower);
  next.towers = next.towers.filter(
    (placedTower) => !(placedTower.x === next.cursor.x && placedTower.y === next.cursor.y),
  );
  return next;
}

export function canBuildTower(state: BattleState, x: number, y: number, towerType: TowerType): boolean {
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

export function findTowerAt(state: BattleState, x: number, y: number): Tower | null {
  return state.towers.find((tower) => tower.x === x && tower.y === y) ?? null;
}

export function isRoadCell(x: number, y: number, stage = 1): boolean {
  return isStageRoadCell(stage, x, y);
}

export function getUpgradeCost(tower: Tower): number {
  return Math.round(TOWER_TYPES[tower.type].cost * (0.7 + tower.level * 0.25));
}

function getTowerRefund(tower: Tower): number {
  let investedGold = TOWER_TYPES[tower.type].cost;

  for (let level = 1; level < tower.level; level += 1) {
    investedGold += getUpgradeCost({ ...tower, level });
  }

  return Math.floor(investedGold * 0.5);
}

export function getWaveDefinition(stageNumber: number, waveNumber: number | null = null): WaveDefinition {
  if (waveNumber == null) {
    return getLegacyWaveDefinition(stageNumber);
  }

  return getStageWaveDefinition(stageNumber, waveNumber);
}

export function getTowerStats(
  tower: Tower,
  metaProgress: unknown = createMetaProgress(),
  runModifiers: unknown = createRunModifiers(),
): TowerStats {
  const levelBonus = tower.level - 1;
  let stats: TowerStats;

  switch (tower.type) {
    case "attack":
      stats = {
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
      break;
    case "slow":
      stats = {
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
      break;
    case "magic":
      stats = {
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
      break;
    case "cannon":
      stats = {
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
      break;
    case "hunter":
      stats = {
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
      break;
    default:
      stats = {
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
      break;
  }

  return applyMetaBattleBonuses(stats, tower.type, metaProgress, runModifiers);
}

export function rollBattleDraftChoices(
  state: BattleState,
  unlockedPerkIds = getUnlockedBattlePerkIds(state.metaProgress),
  random: () => number = Math.random,
): BattleDraftChoice[] {
  const pool = Array.from(new Set(unlockedPerkIds))
    .map((perkId) => getBattlePerkDefinition(perkId))
    .filter((perk): perk is BattlePerkDefinition => perk !== null)
    .map((perk) => ({
      id: perk.id,
      title: perk.title,
      description: perk.description,
      summary: perk.summary,
    }));

  const available = [...pool];
  const choices: BattleDraftChoice[] = [];
  const count = Math.min(3, available.length);

  for (let index = 0; index < count; index += 1) {
    const choiceIndex = Math.min(
      available.length - 1,
      Math.floor(Math.max(0, random()) * available.length),
    );
    choices.push(available.splice(choiceIndex, 1)[0]!);
  }

  return choices;
}

export function applyBattleDraftChoice(state: BattleState, perkId: BattlePerkId): BattleState {
  if (state.status !== "draft") {
    return state;
  }

  const perk = getBattlePerkDefinition(perkId);
  const hasChoice = state.draftChoices.some((choice) => choice.id === perkId);
  if (!perk || !hasChoice) {
    return state;
  }

  const next = structuredClone(state);
  next.runModifiers = normalizeRunModifiers(next.runModifiers);
  perk.applyToState(next);
  next.draftChoices = [];
  next.draftHistory.push(perkId);
  next.status = "intermission";
  next.intermissionTicks = DRAFT_INTERMISSION_TICKS;
  return next;
}

export function resolveDamageAgainstEnemy(enemy: Enemy, attack: TowerStats, scale = 1): number {
  let baseDamage = attack.damage * scale;
  if (attack.bonusBySpecies[enemy.species]) {
    baseDamage *= attack.bonusBySpecies[enemy.species]!;
  }

  let resistance = 0;
  if (attack.damageClass === "physical" || attack.damageClass === "siege") {
    resistance = enemy.physicalResist || 0;
  } else if (attack.damageClass === "arcane") {
    resistance = enemy.arcaneResist || 0;
  }

  return Math.max(1, baseDamage * (1 - resistance));
}

export function getEnemyPosition(enemy: Enemy): Point {
  return getStagePointAlongPath(enemy.stage ?? 1, enemy.progress);
}

export function getPathCells(stageNumber = 1): GridCell[] {
  return getStagePathCells(stageNumber);
}

export function getPathLength(stageNumber = 1): number {
  return getStagePathLength(stageNumber);
}

function maybeSpawnEnemy(state: BattleState): void {
  const wave = getWaveDefinition(state.stage, state.wave);
  if (state.spawnedInWave >= wave.count || state.tick < state.nextSpawnTick) {
    return;
  }

  const species = wave.spawnPlan[state.spawnedInWave]!;
  const enemy = wave.boss ? createBossEnemy(state, wave) : createEnemyFromSpecies(state, wave, species);
  state.enemies.push(enemy);
  state.spawnedInWave += 1;
  state.nextSpawnTick = state.tick + wave.interval;
}

function createBossEnemy(state: BattleState, wave: WaveDefinition): Enemy {
  return {
    arcaneResist: 0.1,
    damageToBase: 3,
    defeated: false,
    defeatedTicks: 0,
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

function createEnemyFromSpecies(state: BattleState, wave: WaveDefinition, species: WaveSpecies): Enemy {
  const safeSpecies = species === "boss" ? "grunt" : species;
  const definition = ENEMY_SPECIES[safeSpecies];
  const health = Math.round(wave.health * definition.healthMultiplier);

  return {
    arcaneResist: definition.arcaneResist,
    damageToBase: definition.damageToBase,
    defeated: false,
    defeatedTicks: 0,
    id: state.nextEnemyId++,
    kind: "normal",
    species: safeSpecies,
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

function moveEnemies(state: BattleState): void {
  for (const enemy of state.enemies) {
    if (enemy.defeated) {
      continue;
    }

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

function runTowers(state: BattleState): void {
  for (const tower of state.towers) {
    if (tower.cooldown > 0) {
      tower.cooldown -= 1;
      continue;
    }

    const stats = getTowerStats(tower, state.metaProgress, state.runModifiers);
    const targets = selectTargetsForTower(state.enemies, tower, stats);
    if (!targets.length) {
      continue;
    }

    applyTowerAttack(state.enemies, tower, stats, targets);
    state.attackEffects.push(...createAttackEffects(state, tower, stats, targets));
    tower.cooldown = stats.cooldown;
  }
}

function selectTargetsForTower(enemies: Enemy[], tower: Tower, stats: TowerStats): Enemy[] {
  const candidates = enemies
    .filter((enemy) => !enemy.escaped)
    .filter((enemy) => !enemy.defeated)
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

function applyTowerAttack(enemies: Enemy[], tower: Tower, stats: TowerStats, targets: Enemy[]): void {
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

function applyHit(enemy: Enemy, stats: TowerStats, scale: number): void {
  if (enemy.defeated || enemy.escaped) {
    return;
  }

  enemy.health -= resolveDamageAgainstEnemy(enemy, stats, scale);
  if (stats.slowTicks > 0) {
    enemy.slowFactor = Math.min(enemy.slowFactor, stats.slowFactor);
    enemy.slowTicks = Math.max(enemy.slowTicks, stats.slowTicks);
  }
}

function createAttackEffect(
  state: BattleState,
  fields: Omit<AttackEffect, "id">,
): AttackEffect {
  return {
    id: state.nextAttackEffectId++,
    ...fields,
  };
}

function createAttackEffects(
  state: BattleState,
  tower: Tower,
  stats: TowerStats,
  targets: Enemy[],
): AttackEffect[] {
  const origin = getCellCenter(tower);

  if (tower.type === "cannon") {
    const target = targets[0]!;
    const point = getEnemyPosition(target);
    return [
      createAttackEffect(state, {
        type: "cannon",
        from: origin,
        to: point,
        radius: stats.splashRadius * CELL_SIZE,
        ttl: 4,
      }),
    ];
  }

  if (tower.type === "slow") {
    return targets.map((target) =>
      createAttackEffect(state, {
        type: "slow",
        from: origin,
        to: getEnemyPosition(target),
        ttl: 4,
      }),
    );
  }

  if (tower.type === "magic") {
    return targets.map((target, index) =>
      createAttackEffect(state, {
        type: "magic",
        from: index === 0 ? origin : getEnemyPosition(targets[index - 1]!),
        to: getEnemyPosition(target),
        ttl: 4,
      }),
    );
  }

  if (tower.type === "hunter") {
    return targets.map((target) =>
      createAttackEffect(state, {
        type: "hunter",
        from: origin,
        to: getEnemyPosition(target),
        ttl: 3,
      }),
    );
  }

  return targets.map((target) =>
    createAttackEffect(state, {
      type: "attack",
      from: origin,
      to: getEnemyPosition(target),
      ttl: 3,
    }),
  );
}

function settleEnemies(state: BattleState): void {
  const survivors: Enemy[] = [];
  for (const enemy of state.enemies) {
    if (enemy.escaped) {
      state.lives -= enemy.damageToBase ?? 1;
      continue;
    }

    if (enemy.defeated) {
      enemy.defeatedTicks = Math.max(0, (enemy.defeatedTicks ?? 0) - 1);
      if (enemy.defeatedTicks > 0) {
        survivors.push(enemy);
      }
      continue;
    }

    if (enemy.health <= 0) {
      state.gold += enemy.reward;
      state.score += enemy.reward * 10;
      enemy.defeated = true;
      enemy.defeatedTicks = ENEMY_DEFEAT_TICKS;
      enemy.health = 0;
      enemy.slowFactor = 1;
      enemy.slowTicks = 0;
      enemy.speed = 0;
      survivors.push(enemy);
      continue;
    }

    survivors.push(enemy);
  }
  state.enemies = survivors;
}

function maybeAdvanceWave(state: BattleState): void {
  const wave = getWaveDefinition(state.stage, state.wave);
  if (state.spawnedInWave < wave.count || state.enemies.length > 0) {
    return;
  }

  state.score += 50;
  state.gold += 20;

  if (state.mode === "endless") {
    state.wave += 1;
    state.spawnedInWave = 0;
    state.nextSpawnTick = state.tick + 18;
    state.status = "draft";
    state.draftChoices = rollBattleDraftChoices(state);
    return;
  }

  if (state.wave < WAVES_PER_STAGE) {
    state.wave += 1;
    state.spawnedInWave = 0;
    state.nextSpawnTick = state.tick + 18;
    state.status = "draft";
    state.draftChoices = rollBattleDraftChoices(state);
    return;
  }

  if (state.stage < getStageCount()) {
    state.stage += 1;
    state.towers = [];
    state.wave = 1;
    state.spawnedInWave = 0;
    state.nextSpawnTick = state.tick + 18;
    state.status = "stage-cleared";
    return;
  }

  state.status = "victory";
}

function getCellCenter(cell: GridCell): Point {
  return {
    x: cell.x * CELL_SIZE + CELL_SIZE / 2,
    y: cell.y * CELL_SIZE + CELL_SIZE / 2,
  };
}

function distanceBetweenTowerAndEnemy(tower: Tower, enemy: Enemy): number {
  const towerCenter = getCellCenter(tower);
  const enemyPoint = getEnemyPosition(enemy);
  return Math.hypot(enemyPoint.x - towerCenter.x, enemyPoint.y - towerCenter.y) / CELL_SIZE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyMetaBattleBonuses(
  baseStats: TowerStats,
  towerType: TowerType,
  metaProgress: unknown,
  runModifiers: unknown,
): TowerStats {
  const modifiers = getMetaBattleModifiers(metaProgress);
  const ephemeral = normalizeRunModifiers(runModifiers);
  const stats: TowerStats = {
    ...baseStats,
    bonusBySpecies: { ...baseStats.bonusBySpecies },
  };

  if (stats.damage > 0) {
    stats.damage = scaleDamage(stats.damage, 1 + modifiers.globalDamageMultiplier);
  }

  switch (towerType) {
    case "attack":
      stats.damage = scaleDamage(stats.damage, 1 + modifiers.attackDamageMultiplier);
      stats.cooldown = reduceCooldown(
        stats.cooldown,
        modifiers.attackSpeedBonus,
        modifiers.attackSpeedBonusStep,
      );
      stats.cooldown = Math.max(1, stats.cooldown - ephemeral.rapidReloadBonus);
      break;
    case "slow":
      stats.slowFactor = clamp(
        roundToHundredths(stats.slowFactor * (1 - modifiers.slowEffectBonus)),
        0.1,
        1,
      );
      stats.slowFactor = clamp(
        roundToHundredths(stats.slowFactor * (1 - ephemeral.slowFactorBonus)),
        0.1,
        1,
      );
      stats.slowTicks += ephemeral.slowExtraTicks;
      break;
    case "magic":
      stats.damage = scaleDamage(stats.damage, 1 + modifiers.magicDamageMultiplier);
      stats.targetCount += ephemeral.magicTargetCountBonus;
      break;
    case "cannon":
      stats.damage = scaleDamage(stats.damage, 1 + modifiers.cannonDamageMultiplier);
      stats.damage = scaleDamage(stats.damage, 1 + ephemeral.cannonDamageMultiplier);
      stats.splashRadius = roundToHundredths(stats.splashRadius + ephemeral.cannonSplashRadiusBonus);
      break;
    case "hunter":
      stats.cooldown = reduceCooldown(
        stats.cooldown,
        modifiers.hunterSpeedBonus,
        modifiers.hunterSpeedBonusStep,
      );
      stats.cooldown = Math.max(1, stats.cooldown - ephemeral.rapidReloadBonus);
      break;
    default:
      break;
  }

  return stats;
}

function scaleDamage(damage: number, multiplier: number): number {
  return roundToHundredths(damage * multiplier);
}

function reduceCooldown(cooldown: number, bonus: number, bonusStep = bonus): number {
  if (bonus <= 0 || bonusStep <= 0) {
    return cooldown;
  }

  const reduction = Math.max(1, Math.round(bonus / bonusStep));
  return Math.max(1, cooldown - reduction);
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

function canManageBattlefield(status: BattleStatus): boolean {
  return ["running", "ready", "intermission"].includes(status);
}

function getLegacyWaveDefinition(wave: number): WaveDefinition {
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
  ] as const;

  let base: { count: number; health: number; reward: number; speed: number };
  if (wave <= presets.length) {
    base = presets[wave - 1]!;
  } else {
    const postPresetWave = wave - presets.length - Math.floor((wave - 1) / 5);
    base = {
      count: 14 + postPresetWave * 2,
      health: 76 + postPresetWave * 18,
      reward: 16 + postPresetWave * 2,
      speed: 0.22 + postPresetWave * 0.015,
    };
  }

  const spawnPlan = Array.from(
    { length: base.count },
    (_, index) => pickLegacySpeciesForWave(wave, index, base.count),
  );
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

function pickLegacySpeciesForWave(wave: number, index: number, count: number): EnemySpeciesId {
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

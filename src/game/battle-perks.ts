import type { CombatUnlockId, MetaProgress } from "./meta-progress";

export const DEFAULT_RUN_MODIFIERS = {
  cannonDamageMultiplier: 0,
  cannonSplashRadiusBonus: 0,
  magicTargetCountBonus: 0,
  rapidReloadBonus: 0,
  slowExtraTicks: 0,
  slowFactorBonus: 0,
} as const;

export const DEFAULT_COMBAT_UNLOCKS = {
  blastTuningUnlock: 0,
  chainSurgeUnlock: 0,
  deepFreezeUnlock: 0,
} as const;

export type RunModifierId = keyof typeof DEFAULT_RUN_MODIFIERS;
export type RunModifiers = Record<RunModifierId, number>;
export type BattlePerkId =
  | "supplyDrop"
  | "emergencyRepair"
  | "rapidReload"
  | "blastTuning"
  | "chainSurge"
  | "deepFreeze";

export interface BattleDraftChoice {
  id: BattlePerkId;
  title?: string;
  description?: string;
  summary?: string;
}

interface BattlePerkMutableState {
  gold: number;
  lives: number;
  runModifiers: RunModifiers;
  lastDraftSummary: string;
}

export interface BattlePerkDefinition {
  id: BattlePerkId;
  title: string;
  description: string;
  summary: string;
  baseUnlocked?: true;
  unlockId?: CombatUnlockId;
  applyToState(state: BattlePerkMutableState): void;
}

export const BATTLE_PERK_DEFINITIONS: BattlePerkDefinition[] = [
  {
    id: "supplyDrop",
    title: "Supply Drop",
    description: "즉시 60G를 확보해 다음 배치를 앞당긴다.",
    summary: "+60G",
    baseUnlocked: true,
    applyToState(state) {
      state.gold += 60;
      state.lastDraftSummary = "Supply Drop: +60G";
    },
  },
  {
    id: "emergencyRepair",
    title: "Emergency Repair",
    description: "방어선을 급히 수리해 라이프를 2 회복한다.",
    summary: "+2 Lives",
    baseUnlocked: true,
    applyToState(state) {
      state.lives += 2;
      state.lastDraftSummary = "Emergency Repair: +2 Lives";
    },
  },
  {
    id: "rapidReload",
    title: "Rapid Reload",
    description: "공격·헌터 포탑의 재장전을 한 단계 끌어올린다.",
    summary: "Attack/Hunter Reload -1",
    baseUnlocked: true,
    applyToState(state) {
      state.runModifiers.rapidReloadBonus += 1;
      state.lastDraftSummary = "Rapid Reload: Attack/Hunter Reload -1";
    },
  },
  {
    id: "blastTuning",
    title: "Blast Tuning",
    description: "캐논 포탑의 폭발 피해와 범위를 함께 끌어올린다.",
    summary: "Cannon +15% / Splash +0.35",
    unlockId: "blastTuningUnlock",
    applyToState(state) {
      state.runModifiers.cannonDamageMultiplier =
        roundToHundredths(state.runModifiers.cannonDamageMultiplier + 0.15);
      state.runModifiers.cannonSplashRadiusBonus =
        roundToHundredths(state.runModifiers.cannonSplashRadiusBonus + 0.35);
      state.lastDraftSummary = "Blast Tuning: Cannon +15% / Splash +0.35";
    },
  },
  {
    id: "chainSurge",
    title: "Chain Surge",
    description: "마법 포탑의 연쇄 타격을 한 대상 더 연결한다.",
    summary: "Magic Chain +1",
    unlockId: "chainSurgeUnlock",
    applyToState(state) {
      state.runModifiers.magicTargetCountBonus += 1;
      state.lastDraftSummary = "Chain Surge: Magic Chain +1";
    },
  },
  {
    id: "deepFreeze",
    title: "Deep Freeze",
    description: "감속 포탑의 둔화 지속시간과 제어 강도를 더 늘린다.",
    summary: "Slow +4 ticks / Stronger Chill",
    unlockId: "deepFreezeUnlock",
    applyToState(state) {
      state.runModifiers.slowExtraTicks += 4;
      state.runModifiers.slowFactorBonus =
        roundToHundredths(state.runModifiers.slowFactorBonus + 0.08);
      state.lastDraftSummary = "Deep Freeze: Slow +4 ticks / Stronger Chill";
    },
  },
];

const BATTLE_PERKS_BY_ID = new Map<BattlePerkId, BattlePerkDefinition>(
  BATTLE_PERK_DEFINITIONS.map((perk) => [perk.id, perk]),
);

export function createRunModifiers(): RunModifiers {
  return { ...DEFAULT_RUN_MODIFIERS };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizeRunModifiers(value: unknown = {}): RunModifiers {
  const source = isRecord(value) ? value : {};
  const normalized = {} as RunModifiers;

  for (const key of Object.keys(DEFAULT_RUN_MODIFIERS) as RunModifierId[]) {
    const currentValue = source[key];
    normalized[key] = Number.isFinite(currentValue) ? (currentValue as number) : DEFAULT_RUN_MODIFIERS[key];
  }

  return normalized;
}

export function getBattlePerkDefinition(perkId: BattlePerkId): BattlePerkDefinition | null {
  return BATTLE_PERKS_BY_ID.get(perkId) ?? null;
}

export function getUnlockedBattlePerkIds(metaProgress: Partial<MetaProgress> = {}): BattlePerkId[] {
  const combatUnlocks = isRecord(metaProgress.combatUnlocks)
    ? (metaProgress.combatUnlocks as Record<string, unknown>)
    : {};

  return BATTLE_PERK_DEFINITIONS.filter((perk) => {
    if (perk.baseUnlocked) {
      return true;
    }

    if (!perk.unlockId) {
      return false;
    }

    return Number(combatUnlocks[perk.unlockId] ?? 0) > 0;
  }).map((perk) => perk.id);
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

import { DEFAULT_COMBAT_UNLOCKS } from "./battle-perks";

export const META_PROGRESS_STORAGE_KEY = "tower-defense.meta-progress";

export const DEFAULT_META_UPGRADES = {
  globalStartGold: 0,
  globalMaxLives: 0,
  globalDamageBoost: 0,
  attackTowerDamage: 0,
  attackTowerSpeed: 0,
  slowTowerEffect: 0,
  magicTowerDamage: 0,
  cannonTowerDamage: 0,
  hunterTowerSpeed: 0,
} as const;

export type CombatUnlockId = keyof typeof DEFAULT_COMBAT_UNLOCKS;
export type MetaUpgradeId = keyof typeof DEFAULT_META_UPGRADES;

export type CombatUnlocks = Record<CombatUnlockId, number>;
export type MetaUpgrades = Record<MetaUpgradeId, number>;

export interface MetaProgress {
  currency: number;
  highestClearedStage: number;
  combatUnlocks: CombatUnlocks;
  upgrades: MetaUpgrades;
}

export interface StorageReaderLike {
  getItem(key: string): string | null;
}

export interface StorageWriterLike {
  setItem(key: string, value: string): void;
}

export type MetaProgressStorage = Partial<StorageReaderLike & StorageWriterLike>;

interface MetaProgressInput {
  currency?: unknown;
  highestClearedStage?: unknown;
  combatUnlocks?: unknown;
  upgrades?: unknown;
}

export function createMetaProgress(): MetaProgress {
  return {
    currency: 0,
    highestClearedStage: 0,
    combatUnlocks: { ...DEFAULT_COMBAT_UNLOCKS },
    upgrades: { ...DEFAULT_META_UPGRADES },
  };
}

function normalizeNonNegativeNumber(value: unknown): number {
  return Number.isFinite(value) && (value as number) >= 0 ? (value as number) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizeMetaProgress(value: unknown = {}): MetaProgress {
  const source: MetaProgressInput = isRecord(value) ? value : {};
  const combatUnlockSource = isRecord(source.combatUnlocks) ? source.combatUnlocks : {};
  const upgradesSource = isRecord(source.upgrades) ? source.upgrades : {};
  const combatUnlocks = {} as CombatUnlocks;
  const upgrades = {} as MetaUpgrades;

  for (const key of Object.keys(DEFAULT_COMBAT_UNLOCKS) as CombatUnlockId[]) {
    combatUnlocks[key] = normalizeNonNegativeNumber(combatUnlockSource[key]);
  }

  for (const key of Object.keys(DEFAULT_META_UPGRADES) as MetaUpgradeId[]) {
    upgrades[key] = normalizeNonNegativeNumber(upgradesSource[key]);
  }

  return {
    currency: Number.isFinite(source.currency) ? (source.currency as number) : 0,
    highestClearedStage: Number.isFinite(source.highestClearedStage)
      ? (source.highestClearedStage as number)
      : 0,
    combatUnlocks,
    upgrades,
  };
}

function getSafeLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorageValue(storage: StorageReaderLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(storage: StorageWriterLike, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadMetaProgress(storage?: MetaProgressStorage): MetaProgress {
  const resolvedStorage = storage ?? getSafeLocalStorage();

  if (!resolvedStorage || typeof resolvedStorage.getItem !== "function") {
    return createMetaProgress();
  }

  const rawValue = readStorageValue(resolvedStorage as StorageReaderLike, META_PROGRESS_STORAGE_KEY);
  if (!rawValue) {
    return createMetaProgress();
  }

  try {
    return normalizeMetaProgress(JSON.parse(rawValue));
  } catch {
    return createMetaProgress();
  }
}

export function saveMetaProgress(
  progress: unknown,
  storage?: MetaProgressStorage,
): MetaProgress {
  const normalized = normalizeMetaProgress(progress);
  const resolvedStorage = storage ?? getSafeLocalStorage();

  if (!resolvedStorage || typeof resolvedStorage.setItem !== "function") {
    return normalized;
  }

  const persisted = writeStorageValue(
    resolvedStorage as StorageWriterLike,
    META_PROGRESS_STORAGE_KEY,
    JSON.stringify(normalized),
  );

  if (!persisted) {
    return normalized;
  }

  return normalized;
}

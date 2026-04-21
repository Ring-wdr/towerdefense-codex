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
};

export function createMetaProgress() {
  return {
    currency: 0,
    highestClearedStage: 0,
    upgrades: { ...DEFAULT_META_UPGRADES },
  };
}

export function normalizeMetaProgress(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const upgradesSource =
    source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {};

  return {
    currency: Number.isFinite(source.currency) ? source.currency : 0,
    highestClearedStage: Number.isFinite(source.highestClearedStage)
      ? source.highestClearedStage
      : 0,
    upgrades: {
      ...DEFAULT_META_UPGRADES,
      ...upgradesSource,
    },
  };
}

export function loadMetaProgress(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== "function") {
    return createMetaProgress();
  }

  const rawValue = storage.getItem(META_PROGRESS_STORAGE_KEY);
  if (!rawValue) {
    return createMetaProgress();
  }

  try {
    return normalizeMetaProgress(JSON.parse(rawValue));
  } catch {
    return createMetaProgress();
  }
}

export function saveMetaProgress(progress, storage = globalThis.localStorage) {
  const normalized = normalizeMetaProgress(progress);

  if (!storage || typeof storage.setItem !== "function") {
    return normalized;
  }

  try {
    storage.setItem(META_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    return normalized;
  }

  return normalized;
}

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

function normalizeNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function normalizeMetaProgress(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const upgradesSource =
    source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {};
  const upgrades = {};

  for (const key of Object.keys(DEFAULT_META_UPGRADES)) {
    upgrades[key] = normalizeNonNegativeNumber(upgradesSource[key]);
  }

  return {
    currency: Number.isFinite(source.currency) ? source.currency : 0,
    highestClearedStage: Number.isFinite(source.highestClearedStage)
      ? source.highestClearedStage
      : 0,
    upgrades,
  };
}

function getSafeLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorageValue(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadMetaProgress(storage) {
  const resolvedStorage = storage ?? getSafeLocalStorage();

  if (!resolvedStorage || typeof resolvedStorage.getItem !== "function") {
    return createMetaProgress();
  }

  const rawValue = readStorageValue(resolvedStorage, META_PROGRESS_STORAGE_KEY);
  if (!rawValue) {
    return createMetaProgress();
  }

  try {
    return normalizeMetaProgress(JSON.parse(rawValue));
  } catch {
    return createMetaProgress();
  }
}

export function saveMetaProgress(progress, storage) {
  const normalized = normalizeMetaProgress(progress);
  const resolvedStorage = storage ?? getSafeLocalStorage();

  if (!resolvedStorage || typeof resolvedStorage.setItem !== "function") {
    return normalized;
  }

  const persisted = writeStorageValue(
    resolvedStorage,
    META_PROGRESS_STORAGE_KEY,
    JSON.stringify(normalized),
  );

  if (!persisted) {
    return normalized;
  }

  return normalized;
}

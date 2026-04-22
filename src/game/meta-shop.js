import { normalizeMetaProgress } from "./meta-progress.js";

export const META_SHOP_CATALOG = [
  {
    id: "globalStartGold",
    category: "global",
    label: "보급 확장",
    description: "전투 시작 골드를 늘린다.",
    maxLevel: 3,
    levels: [
      { price: 60, value: 10, unlockStage: 1 },
      { price: 120, value: 20, unlockStage: 3 },
      { price: 210, value: 30, unlockStage: 5 },
    ],
  },
  {
    id: "globalMaxLives",
    category: "global",
    label: "방벽 증설",
    description: "최대 라이프를 늘린다.",
    maxLevel: 3,
    levels: [
      { price: 70, value: 1, unlockStage: 1 },
      { price: 140, value: 2, unlockStage: 4 },
      { price: 240, value: 3, unlockStage: 7 },
    ],
  },
  {
    id: "globalDamageBoost",
    category: "global",
    label: "전선 교범",
    description: "모든 타워 공격력을 올린다.",
    maxLevel: 3,
    levels: [
      { price: 80, value: 0.05, unlockStage: 2 },
      { price: 160, value: 0.1, unlockStage: 4 },
      { price: 260, value: 0.15, unlockStage: 7 },
    ],
  },
  {
    id: "attackTowerDamage",
    category: "tower",
    label: "공격 포탑 탄두 강화",
    description: "공격 포탑 피해량을 강화한다.",
    maxLevel: 3,
    levels: [
      { price: 75, value: 0.08, unlockStage: 2 },
      { price: 150, value: 0.16, unlockStage: 4 },
      { price: 250, value: 0.24, unlockStage: 7 },
    ],
  },
  {
    id: "attackTowerSpeed",
    category: "tower",
    label: "공격 포탑 급속 장전",
    description: "공격 포탑 공격 속도를 높인다.",
    maxLevel: 3,
    levels: [
      { price: 75, value: 0.04, unlockStage: 2 },
      { price: 150, value: 0.08, unlockStage: 5 },
      { price: 250, value: 0.12, unlockStage: 8 },
    ],
  },
  {
    id: "slowTowerEffect",
    category: "tower",
    label: "감속 포탑 냉각 강화",
    description: "감속 효율을 높인다.",
    maxLevel: 3,
    levels: [
      { price: 70, value: 0.05, unlockStage: 2 },
      { price: 140, value: 0.1, unlockStage: 5 },
      { price: 230, value: 0.15, unlockStage: 8 },
    ],
  },
  {
    id: "magicTowerDamage",
    category: "tower",
    label: "마법 포탑 증폭",
    description: "마법 포탑 피해량을 강화한다.",
    maxLevel: 3,
    levels: [
      { price: 85, value: 0.08, unlockStage: 3 },
      { price: 170, value: 0.16, unlockStage: 6 },
      { price: 270, value: 0.24, unlockStage: 8 },
    ],
  },
  {
    id: "cannonTowerDamage",
    category: "tower",
    label: "캐논 포탑 포열 보강",
    description: "캐논 포탑 피해량을 강화한다.",
    maxLevel: 3,
    levels: [
      { price: 90, value: 0.08, unlockStage: 3 },
      { price: 180, value: 0.16, unlockStage: 6 },
      { price: 280, value: 0.24, unlockStage: 9 },
    ],
  },
  {
    id: "hunterTowerSpeed",
    category: "tower",
    label: "헌터 포탑 조준 개선",
    description: "헌터 포탑 공격 속도를 높인다.",
    maxLevel: 3,
    levels: [
      { price: 85, value: 0.05, unlockStage: 3 },
      { price: 170, value: 0.1, unlockStage: 6 },
      { price: 270, value: 0.15, unlockStage: 9 },
    ],
  },
  {
    id: "blastTuningUnlock",
    category: "combat",
    progressBucket: "combatUnlocks",
    label: "Blast Tuning",
    description: "전투 중 캐논 포열 조율 카드를 해금한다.",
    maxLevel: 1,
    levels: [
      { price: 120, value: 1, unlockStage: 3 },
    ],
  },
  {
    id: "chainSurgeUnlock",
    category: "combat",
    progressBucket: "combatUnlocks",
    label: "Chain Surge",
    description: "전투 중 마법 연쇄 증폭 카드를 해금한다.",
    maxLevel: 1,
    levels: [
      { price: 130, value: 1, unlockStage: 5 },
    ],
  },
  {
    id: "deepFreezeUnlock",
    category: "combat",
    progressBucket: "combatUnlocks",
    label: "Deep Freeze",
    description: "전투 중 감속 심화 카드를 해금한다.",
    maxLevel: 1,
    levels: [
      { price: 140, value: 1, unlockStage: 6 },
    ],
  },
];

const META_SHOP_CATALOG_BY_ID = new Map(
  META_SHOP_CATALOG.map((upgrade) => [upgrade.id, upgrade]),
);

function clampUpgradeLevelForIndex(value, maxLevel) {
  const upperBound = Math.max(maxLevel - 1, 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  const integerValue = Math.trunc(value);

  if (!Number.isInteger(value)) {
    return Math.min(Math.max(integerValue, 0), upperBound);
  }

  if (integerValue < 0) {
    return 0;
  }

  if (integerValue > maxLevel) {
    return upperBound;
  }

  return integerValue;
}

export function getMetaRewardForStage(stageNumber) {
  return 20 + stageNumber * 15;
}

export function awardStageClearRewards(progress, stageNumber) {
  const normalized = normalizeMetaProgress(progress);

  return {
    ...normalized,
    currency: normalized.currency + getMetaRewardForStage(stageNumber),
    highestClearedStage: Math.max(normalized.highestClearedStage, stageNumber),
  };
}

export function canPurchaseUpgrade(progress, upgradeId) {
  const normalized = normalizeMetaProgress(progress);
  const definition = META_SHOP_CATALOG_BY_ID.get(upgradeId);

  if (!definition) {
    return false;
  }

  const progressBucket = getProgressBucket(definition);
  const currentLevel = clampUpgradeLevelForIndex(
    normalized[progressBucket][upgradeId] ?? 0,
    definition.maxLevel,
  );
  const nextLevel = definition.levels[currentLevel];

  if (!nextLevel) {
    return false;
  }

  return (
    normalized.currency >= nextLevel.price &&
    normalized.highestClearedStage >= nextLevel.unlockStage
  );
}

export function purchaseUpgrade(progress, upgradeId) {
  if (!canPurchaseUpgrade(progress, upgradeId)) {
    return progress;
  }

  const normalized = normalizeMetaProgress(progress);
  const definition = META_SHOP_CATALOG_BY_ID.get(upgradeId);
  const progressBucket = getProgressBucket(definition);
  const currentLevel = clampUpgradeLevelForIndex(
    normalized[progressBucket][upgradeId] ?? 0,
    definition.maxLevel,
  );
  const nextLevel = definition.levels[currentLevel];

  return {
    ...normalized,
    currency: normalized.currency - nextLevel.price,
    [progressBucket]: {
      ...normalized[progressBucket],
      [upgradeId]: Math.min(currentLevel + 1, definition.maxLevel),
    },
  };
}

function getProgressBucket(definition) {
  if (definition?.progressBucket === "combatUnlocks") {
    return "combatUnlocks";
  }

  return "upgrades";
}

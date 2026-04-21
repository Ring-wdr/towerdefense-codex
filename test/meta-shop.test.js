import test from "node:test";
import assert from "node:assert/strict";

import {
  canPurchaseUpgrade,
  META_SHOP_CATALOG,
  getMetaRewardForStage,
  purchaseUpgrade,
} from "../src/game/meta-shop.js";
import { createMetaProgress } from "../src/game/meta-progress.js";

test("stage rewards scale upward with later clears", () => {
  assert.equal(getMetaRewardForStage(1), 35);
  assert.equal(getMetaRewardForStage(4), 80);
  assert.equal(getMetaRewardForStage(9), 155);

  assert.deepEqual(
    META_SHOP_CATALOG.map(({ id, category, label, description, maxLevel, levels }) => ({
      id,
      category,
      label,
      description,
      maxLevel,
      levels,
    })),
    [
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
    ],
  );
});

test("higher tiers stay locked until highestClearedStage reaches the unlock stage", () => {
  const lockedProgress = {
    ...createMetaProgress(),
    currency: 1000,
    highestClearedStage: 3,
    upgrades: {
      ...createMetaProgress().upgrades,
      globalDamageBoost: 1,
    },
  };

  const unlockedProgress = {
    ...lockedProgress,
    highestClearedStage: 4,
  };

  assert.equal(canPurchaseUpgrade(lockedProgress, "globalDamageBoost"), false);
  assert.equal(canPurchaseUpgrade(unlockedProgress, "globalDamageBoost"), true);
});

test("purchaseUpgrade spends currency and advances exactly one level", () => {
  const progress = {
    ...createMetaProgress(),
    currency: 200,
    highestClearedStage: 4,
    upgrades: {
      ...createMetaProgress().upgrades,
      globalStartGold: 1,
    },
  };

  const next = purchaseUpgrade(progress, "globalStartGold");

  assert.deepEqual(next, {
    currency: 80,
    highestClearedStage: 4,
    upgrades: {
      globalStartGold: 2,
      globalMaxLives: 0,
      globalDamageBoost: 0,
      attackTowerDamage: 0,
      attackTowerSpeed: 0,
      slowTowerEffect: 0,
      magicTowerDamage: 0,
      cannonTowerDamage: 0,
      hunterTowerSpeed: 0,
    },
  });
});

test("purchaseUpgrade returns the original progress when a tier is locked or maxed", () => {
  const lockedProgress = {
    ...createMetaProgress(),
    currency: 1000,
    highestClearedStage: 1,
  };
  const maxedProgress = {
    ...createMetaProgress(),
    currency: 1000,
    highestClearedStage: 9,
    upgrades: {
      ...createMetaProgress().upgrades,
      globalStartGold: 3,
    },
  };
  const malformedProgress = {
    ...createMetaProgress(),
    currency: 1000,
    highestClearedStage: 9,
    upgrades: {
      ...createMetaProgress().upgrades,
      globalStartGold: 99,
    },
  };

  assert.strictEqual(purchaseUpgrade(lockedProgress, "globalDamageBoost"), lockedProgress);
  assert.strictEqual(purchaseUpgrade(maxedProgress, "globalStartGold"), maxedProgress);
  assert.equal(canPurchaseUpgrade(malformedProgress, "globalStartGold"), true);
  assert.deepEqual(purchaseUpgrade(malformedProgress, "globalStartGold"), {
    currency: 790,
    highestClearedStage: 9,
    upgrades: {
      globalStartGold: 3,
      globalMaxLives: 0,
      globalDamageBoost: 0,
      attackTowerDamage: 0,
      attackTowerSpeed: 0,
      slowTowerEffect: 0,
      magicTowerDamage: 0,
      cannonTowerDamage: 0,
      hunterTowerSpeed: 0,
    },
  });
});

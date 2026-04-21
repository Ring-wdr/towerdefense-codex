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

  assert.equal(META_SHOP_CATALOG.length, 9);
  for (const item of META_SHOP_CATALOG) {
    assert.equal(typeof item.category, "string");
    assert.equal(typeof item.label, "string");
    assert.equal(item.levels.length, item.maxLevel);
  }
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

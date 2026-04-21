import test from "node:test";
import assert from "node:assert/strict";

import { createMetaProgress } from "../src/game/meta-progress.js";
import { META_SHOP_CATALOG } from "../src/game/meta-shop.js";

const startGoldUpgrade = META_SHOP_CATALOG.find(({ id }) => id === "globalStartGold");

class HTMLCanvasElementStub {
  constructor() {
    this.style = {};
    this.width = 0;
    this.height = 0;
  }

  getContext() {
    return createCanvasContextStub();
  }
}

function createCanvasContextStub() {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "getImageData") {
        return () => ({ data: [0, 0, 0, 0] });
      }

      if (property === "measureText") {
        return () => ({ width: 0 });
      }

      return () => {};
    },
  });
}

function createElementStub() {
  return new HTMLCanvasElementStub();
}

async function loadShopSceneHelpers() {
  globalThis.window ??= {};
  globalThis.Image ??= class ImageStub {};
  globalThis.HTMLCanvasElement ??= HTMLCanvasElementStub;
  globalThis.document ??= {
    documentElement: {},
    createElement: createElementStub,
  };
  globalThis.document.documentElement ??= {};
  globalThis.document.createElement ??= createElementStub;
  return import("../src/phaser/scenes/ShopScene.js");
}

test("getShopEntryState clamps corrupted persisted levels to the last renderable tier", async () => {
  const { getShopEntryState } = await loadShopSceneHelpers();
  const progress = createMetaProgress();
  progress.currency = 500;
  progress.highestClearedStage = 9;
  progress.upgrades.globalStartGold = 99;

  const entry = getShopEntryState(progress, startGoldUpgrade);

  assert.equal(entry.currentLevel, 2);
  assert.equal(entry.buttonLabel, "Buy");
  assert.equal(entry.detailLabel, "Cost 210G");
  assert.equal(entry.isPurchaseEnabled, true);
});

test("getShopEntryState marks true maxed entries as disabled", async () => {
  const { getShopEntryState } = await loadShopSceneHelpers();
  const progress = createMetaProgress();
  progress.currency = 999;
  progress.highestClearedStage = 9;
  progress.upgrades.globalStartGold = 3;

  const entry = getShopEntryState(progress, startGoldUpgrade);

  assert.equal(entry.currentLevel, 3);
  assert.equal(entry.buttonLabel, "Maxed");
  assert.equal(entry.detailLabel, "All tiers acquired");
  assert.equal(entry.isPurchaseEnabled, false);
});

test("resolveShopPurchase blocks locked, unaffordable, and maxed entries", async () => {
  const { resolveShopPurchase } = await loadShopSceneHelpers();
  const locked = createMetaProgress();
  locked.currency = 500;
  locked.highestClearedStage = 0;

  const unaffordable = createMetaProgress();
  unaffordable.currency = 10;
  unaffordable.highestClearedStage = 9;

  const maxed = createMetaProgress();
  maxed.currency = 500;
  maxed.highestClearedStage = 9;
  maxed.upgrades.globalStartGold = 3;

  for (const progress of [locked, unaffordable, maxed]) {
    const outcome = resolveShopPurchase(progress, startGoldUpgrade.id);

    assert.equal(outcome.didPurchase, false);
    assert.deepEqual(outcome.nextProgress, progress);
  }
});

test("resolveShopPurchase advances progress only when the entry is purchasable", async () => {
  const { resolveShopPurchase } = await loadShopSceneHelpers();
  const progress = createMetaProgress();
  progress.currency = 500;
  progress.highestClearedStage = 9;
  progress.upgrades.globalStartGold = 2;

  const outcome = resolveShopPurchase(progress, startGoldUpgrade.id);

  assert.equal(outcome.didPurchase, true);
  assert.equal(outcome.nextProgress.currency, 290);
  assert.equal(outcome.nextProgress.upgrades.globalStartGold, 3);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMetaProgress,
  loadMetaProgress,
  normalizeMetaProgress,
  saveMetaProgress,
} from "../src/game/meta-progress";
import type {
  MetaProgressStorage,
  StorageReaderLike,
  StorageWriterLike,
} from "../src/game/meta-progress";

function restoreLocalStorage(originalDescriptor: PropertyDescriptor | undefined): void {
  if (originalDescriptor) {
    Object.defineProperty(globalThis, "localStorage", originalDescriptor);
    return;
  }

  delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
}

test("createMetaProgress returns the default permanent progression state", () => {
  assert.deepEqual(createMetaProgress(), {
    currency: 0,
    highestClearedStage: 0,
    combatUnlocks: {
      blastTuningUnlock: 0,
      chainSurgeUnlock: 0,
      deepFreezeUnlock: 0,
    },
    upgrades: {
      globalStartGold: 0,
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

test("normalizeMetaProgress fills in missing upgrade keys without dropping stored values", () => {
  assert.deepEqual(
    normalizeMetaProgress({
      currency: 18,
      highestClearedStage: 5,
      combatUnlocks: {
        chainSurgeUnlock: 1,
      },
      upgrades: {
        globalStartGold: 2,
        attackTowerSpeed: 3,
      },
    }),
    {
      currency: 18,
      highestClearedStage: 5,
      combatUnlocks: {
        blastTuningUnlock: 0,
        chainSurgeUnlock: 1,
        deepFreezeUnlock: 0,
      },
      upgrades: {
        globalStartGold: 2,
        globalMaxLives: 0,
        globalDamageBoost: 0,
        attackTowerDamage: 0,
        attackTowerSpeed: 3,
        slowTowerEffect: 0,
        magicTowerDamage: 0,
        cannonTowerDamage: 0,
        hunterTowerSpeed: 0,
      },
    },
  );
});

test("normalizeMetaProgress coerces malformed upgrade values and ignores unknown keys", () => {
  assert.deepEqual(
    normalizeMetaProgress({
      currency: "12",
      highestClearedStage: Infinity,
      combatUnlocks: {
        blastTuningUnlock: 2,
        chainSurgeUnlock: "nope",
        deepFreezeUnlock: -1,
        extraUnlock: 8,
      },
      upgrades: {
        globalStartGold: "7",
        globalMaxLives: -3,
        globalDamageBoost: NaN,
        attackTowerDamage: "invalid",
        attackTowerSpeed: 1.5,
        slowTowerEffect: null,
        magicTowerDamage: undefined,
        cannonTowerDamage: 9,
        hunterTowerSpeed: "4",
        bonusGold: 99,
      },
    }),
    {
      currency: 0,
      highestClearedStage: 0,
      combatUnlocks: {
        blastTuningUnlock: 2,
        chainSurgeUnlock: 0,
        deepFreezeUnlock: 0,
      },
      upgrades: {
        globalStartGold: 0,
        globalMaxLives: 0,
        globalDamageBoost: 0,
        attackTowerDamage: 0,
        attackTowerSpeed: 1.5,
        slowTowerEffect: 0,
        magicTowerDamage: 0,
        cannonTowerDamage: 9,
        hunterTowerSpeed: 0,
      },
    },
  );
});

test("saveMetaProgress persists normalized JSON and loadMetaProgress restores it", () => {
  const writes = new Map();
  const storage: StorageReaderLike & StorageWriterLike = {
    getItem(key: string) {
      return writes.has(key) ? writes.get(key) : null;
    },
    setItem(key: string, value: string) {
      writes.set(key, value);
    },
  };

  const saved = saveMetaProgress(
    {
      currency: 7,
      highestClearedStage: 3,
      combatUnlocks: {
        blastTuningUnlock: 1,
      },
      upgrades: {
        attackTowerDamage: 4,
      },
    },
    storage,
  );

  assert.deepEqual(saved, {
    currency: 7,
    highestClearedStage: 3,
    combatUnlocks: {
      blastTuningUnlock: 1,
      chainSurgeUnlock: 0,
      deepFreezeUnlock: 0,
    },
    upgrades: {
      globalStartGold: 0,
      globalMaxLives: 0,
      globalDamageBoost: 0,
      attackTowerDamage: 4,
      attackTowerSpeed: 0,
      slowTowerEffect: 0,
      magicTowerDamage: 0,
      cannonTowerDamage: 0,
      hunterTowerSpeed: 0,
    },
  });

  assert.equal(
    writes.get("tower-defense.meta-progress"),
    JSON.stringify(saved),
  );
  assert.deepEqual(loadMetaProgress(storage), saved);
});

test("loadMetaProgress falls back to defaults when storage contains invalid JSON", () => {
  const storage = {
    getItem() {
      return "{not valid json";
    },
  };

  assert.deepEqual(loadMetaProgress(storage), createMetaProgress());
});

test("loadMetaProgress falls back when localStorage access or read throws", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });

    assert.deepEqual(loadMetaProgress(), createMetaProgress());
    assert.deepEqual(
      loadMetaProgress({
        getItem() {
          throw new Error("blocked");
        },
      } satisfies MetaProgressStorage),
      createMetaProgress(),
    );
  } finally {
    restoreLocalStorage(originalDescriptor);
  }
});

test("saveMetaProgress falls back when localStorage access or write throws", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const progress = createMetaProgress();

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });

    assert.deepEqual(saveMetaProgress(progress), progress);
    assert.deepEqual(
      saveMetaProgress(progress, {
        setItem() {
          throw new Error("blocked");
        },
      } satisfies MetaProgressStorage),
      progress,
    );
  } finally {
    restoreLocalStorage(originalDescriptor);
  }
});

test("restoreLocalStorage deletes a temporary localStorage getter when there was no original descriptor", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        return {
          getItem() {
            return null;
          },
        };
      },
    });
  } finally {
    restoreLocalStorage(originalDescriptor);
  }

  if (originalDescriptor) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
      originalDescriptor,
    );
  } else {
    assert.equal(Object.hasOwn(globalThis, "localStorage"), false);
  }
});

import { isStageUnlocked } from "../game/campaign-progress.js";
import { canPurchaseUpgrade, META_SHOP_CATALOG } from "../game/meta-shop.js";
import { normalizeMetaProgress } from "../game/meta-progress.js";
import {
  getStageCount,
  getStageDefinition,
  getThemeOrder,
  getThemeStageNumbers,
} from "../game/stages.js";

function getProgressBucket(entry) {
  return entry.progressBucket === "combatUnlocks" ? "combatUnlocks" : "upgrades";
}

function clampRenderableUpgradeLevel(value, maxLevel) {
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

function getShopEntrySummary(metaProgress, entry) {
  const normalizedProgress = normalizeMetaProgress(metaProgress);
  const progressBucket = getProgressBucket(entry);
  const currentLevel = clampRenderableUpgradeLevel(
    normalizedProgress[progressBucket][entry.id] ?? 0,
    entry.maxLevel,
  );
  const nextLevel = entry.levels[currentLevel] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      buttonLabel: "Maxed",
      detailLabel: "All tiers acquired",
      isPurchaseEnabled: false,
    };
  }

  if (normalizedProgress.highestClearedStage < nextLevel.unlockStage) {
    return {
      currentLevel,
      buttonLabel: `S${nextLevel.unlockStage}`,
      detailLabel: `Unlock Stage ${nextLevel.unlockStage}`,
      isPurchaseEnabled: false,
    };
  }

  const isPurchaseEnabled = canPurchaseUpgrade(normalizedProgress, entry.id);

  return {
    currentLevel,
    buttonLabel: isPurchaseEnabled ? "Buy" : `${nextLevel.price}G`,
    detailLabel: `Cost ${nextLevel.price}G`,
    isPurchaseEnabled,
  };
}

export function getTitleScreenData(session, metaProgress) {
  return {
    isEndlessUnlocked: metaProgress.highestClearedStage >= getStageCount(),
    helperCopy: "단일 캠페인 루트. 각 전선은 순차적으로 개방된다.",
    session,
  };
}

export function getCampaignScreenData(session) {
  return getThemeOrder().map((theme) => {
    const stageNumbers = getThemeStageNumbers(theme);
    return {
      theme,
      stageNumbers,
      selected: session.selectedTheme === theme,
      clearedCount: stageNumbers.filter((stageNumber) => session.clearedStages.includes(stageNumber)).length,
      previewStage: getStageDefinition(stageNumbers[0]),
    };
  });
}

export function getThemeScreenData(session) {
  const stage = getStageDefinition(session.selectedStage);

  return {
    stage,
    stageNumbers: getThemeStageNumbers(stage.theme).map((stageNumber) => {
      const definition = getStageDefinition(stageNumber);
      return {
        stage: definition,
        locked: !isStageUnlocked(session, stageNumber),
        selected: stageNumber === session.selectedStage,
      };
    }),
  };
}

export function getShopScreenData(metaProgress) {
  return META_SHOP_CATALOG.map((entry) => ({
    entry,
    summary: getShopEntrySummary(metaProgress, entry),
  }));
}

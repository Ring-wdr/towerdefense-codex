import { isStageUnlocked } from "../game/campaign-progress";
import { canPurchaseUpgrade, META_SHOP_CATALOG } from "../game/meta-shop";
import { normalizeMetaProgress } from "../game/meta-progress";
import {
  getStageCount,
  getStageDefinition,
  getThemeOrder,
  getThemeStageNumbers,
} from "../game/stages";
import type { GameSession } from "../phaser/state/game-session";
import type { CombatUnlockId, MetaProgress, MetaUpgradeId } from "../game/meta-progress";
import type { MetaShopEntry, MetaShopProgressBucket } from "../game/meta-shop";
import type { StageDefinition, ThemeName } from "../game/stages";

export interface ShopEntrySummary {
  currentLevel: number;
  buttonLabel: string;
  detailLabel: string;
  isPurchaseEnabled: boolean;
}

export interface TitleScreenData {
  isEndlessUnlocked: boolean;
  helperCopy: string;
  session: GameSession;
}

export interface CampaignThemeScreenData {
  theme: ThemeName;
  stageNumbers: number[];
  selected: boolean;
  clearedCount: number;
  previewStage: StageDefinition;
}

export interface ThemeStageScreenRow {
  stage: StageDefinition;
  locked: boolean;
  selected: boolean;
}

export interface ThemeScreenData {
  stage: StageDefinition;
  stageNumbers: ThemeStageScreenRow[];
}

export interface ShopScreenDataRow {
  entry: MetaShopEntry;
  summary: ShopEntrySummary;
}

function getProgressBucket(entry: MetaShopEntry): MetaShopProgressBucket {
  return entry.progressBucket === "combatUnlocks" ? "combatUnlocks" : "upgrades";
}

function clampRenderableUpgradeLevel(value: unknown, maxLevel: number): number {
  const upperBound = Math.max(maxLevel - 1, 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  const integerValue = Math.trunc(value as number);

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

function getShopEntrySummary(metaProgress: unknown, entry: MetaShopEntry): ShopEntrySummary {
  const normalizedProgress = normalizeMetaProgress(metaProgress);
  const progressBucket = getProgressBucket(entry);
  const currentValue = progressBucket === "combatUnlocks"
    ? normalizedProgress.combatUnlocks[entry.id as CombatUnlockId]
    : normalizedProgress.upgrades[entry.id as MetaUpgradeId];
  const currentLevel = clampRenderableUpgradeLevel(currentValue ?? 0, entry.maxLevel);
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

export function getTitleScreenData(session: GameSession, metaProgress: MetaProgress): TitleScreenData {
  return {
    isEndlessUnlocked: metaProgress.highestClearedStage >= getStageCount(),
    helperCopy: "단일 캠페인 루트. 각 전선은 순차적으로 개방된다.",
    session,
  };
}

export function getCampaignScreenData(session: GameSession): CampaignThemeScreenData[] {
  return getThemeOrder().map((theme) => {
    const stageNumbers = getThemeStageNumbers(theme);
    return {
      theme,
      stageNumbers,
      selected: session.selectedTheme === theme,
      clearedCount: stageNumbers.filter((stageNumber) => session.clearedStages.includes(stageNumber)).length,
      previewStage: getStageDefinition(stageNumbers[0]!),
    };
  });
}

export function getThemeScreenData(session: GameSession): ThemeScreenData {
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

export function getShopScreenData(metaProgress: unknown): ShopScreenDataRow[] {
  return META_SHOP_CATALOG.map((entry) => ({
    entry,
    summary: getShopEntrySummary(metaProgress, entry),
  }));
}

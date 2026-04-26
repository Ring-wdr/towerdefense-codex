import {
  getThemeOrder as getStageThemeOrder,
  getThemeStageNumbers as getStageThemeStageNumbers,
} from "./stages";
import type { ThemeName } from "./stages";

export type CampaignScreen =
  | "title"
  | "theme-page"
  | "campaign-menu"
  | "shop"
  | "battle"
  | "campaign-complete";

export interface CampaignProgress {
  screen: CampaignScreen;
  selectedTheme: ThemeName | null;
  selectedStage: number;
  activeStage: number | null;
  clearedStages: number[];
}

export function createCampaignProgress(): CampaignProgress {
  const firstTheme = getStageThemeOrder()[0] ?? null;

  return {
    screen: "title",
    selectedTheme: firstTheme,
    selectedStage: 1,
    activeStage: null,
    clearedStages: [],
  };
}

export function isStageUnlocked(progress: CampaignProgress, stageNumber: number): boolean {
  if (stageNumber === 1) {
    return true;
  }

  if (progress.clearedStages.includes(stageNumber)) {
    return true;
  }

  return progress.clearedStages.includes(stageNumber - 1);
}

export function markStageCleared(progress: CampaignProgress, stageNumber: number): CampaignProgress {
  const clearedStages = Array.from(new Set([...progress.clearedStages, stageNumber])).sort(
    (left, right) => left - right,
  );

  return {
    ...progress,
    clearedStages,
  };
}

export function selectStageForTheme(
  progress: CampaignProgress,
  theme: ThemeName,
  stageNumber: number,
): CampaignProgress {
  return {
    ...progress,
    screen: "theme-page",
    selectedTheme: theme,
    selectedStage: stageNumber,
    activeStage: null,
  };
}

export function getThemeOrder(): ThemeName[] {
  return getStageThemeOrder();
}

export function getThemeStageNumbers(theme: ThemeName): number[] {
  return getStageThemeStageNumbers(theme);
}

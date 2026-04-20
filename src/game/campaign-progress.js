import {
  getThemeOrder as getStageThemeOrder,
  getThemeStageNumbers as getStageThemeStageNumbers,
} from "./stages.js";

export function createCampaignProgress() {
  const firstTheme = getStageThemeOrder()[0] ?? null;

  return {
    screen: "title",
    selectedTheme: firstTheme,
    selectedStage: 1,
    activeStage: null,
    clearedStages: [],
  };
}

export function isStageUnlocked(progress, stageNumber) {
  if (stageNumber === 1) {
    return true;
  }

  if (progress.clearedStages.includes(stageNumber)) {
    return true;
  }

  return progress.clearedStages.includes(stageNumber - 1);
}

export function markStageCleared(progress, stageNumber) {
  const clearedStages = Array.from(new Set([...progress.clearedStages, stageNumber])).sort(
    (left, right) => left - right,
  );

  return {
    ...progress,
    clearedStages,
  };
}

export function selectStageForTheme(progress, theme, stageNumber) {
  return {
    ...progress,
    screen: "theme-page",
    selectedTheme: theme,
    selectedStage: stageNumber,
    activeStage: null,
  };
}

export function getThemeOrder() {
  return getStageThemeOrder();
}

export function getThemeStageNumbers(theme) {
  return getStageThemeStageNumbers(theme);
}

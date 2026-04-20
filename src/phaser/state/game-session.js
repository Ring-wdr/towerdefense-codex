import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "../../game/campaign-progress.js";
import { getStageCount, getStageDefinition } from "../../game/stages.js";

function withScene(session, scene) {
  return {
    ...session,
    scene,
    screen: sceneToScreen(scene),
  };
}

function sceneToScreen(scene) {
  switch (scene) {
    case "campaign":
      return "campaign-menu";
    case "theme":
      return "theme-page";
    case "battle":
      return "battle";
    case "campaign-complete":
      return "campaign-complete";
    case "title":
    default:
      return "title";
  }
}

export function createGameSession() {
  return withScene(createCampaignProgress(), "title");
}

export function cycleThemeSelection(session, direction) {
  const themes = getThemeOrder();
  const currentIndex = Math.max(0, themes.indexOf(session.selectedTheme));
  const nextIndex = (currentIndex + direction + themes.length) % themes.length;
  const nextTheme = themes[nextIndex];
  const stageNumber = getThemeStageNumbers(nextTheme)[0];

  return withScene(
    {
      ...session,
      selectedTheme: nextTheme,
      selectedStage: stageNumber,
      activeStage: null,
    },
    "campaign",
  );
}

export function selectStage(session, stageNumber) {
  const stage = getStageDefinition(stageNumber);
  const selected = selectStageForTheme(session, stage.theme, stage.number);

  return withScene(selected, "theme");
}

export function beginBattleFromSelection(session) {
  if (!isStageUnlocked(session, session.selectedStage)) {
    return session;
  }

  return withScene(
    {
      ...session,
      activeStage: session.selectedStage,
    },
      "battle",
  );
}

export function retryBattle(session) {
  const activeStage = session.activeStage ?? session.selectedStage;
  if (!isStageUnlocked(session, activeStage)) {
    return session;
  }

  return withScene(
    {
      ...session,
      selectedStage: activeStage,
      activeStage,
    },
    "battle",
  );
}

export function returnFromBattleToTheme(session) {
  return withScene(
    {
      ...session,
      activeStage: null,
    },
    "theme",
  );
}

export function returnToCampaign(session) {
  return withScene(
    {
      ...session,
      activeStage: null,
    },
    "campaign",
  );
}

export function getCompletedBattleStage(session, battleState) {
  if (battleState.status === "stage-cleared" && session.activeStage) {
    return session.activeStage;
  }

  return battleState.stage;
}

export function completeBattleStage(session, stageNumber) {
  const progress = markStageCleared(session, stageNumber);

  if (stageNumber >= getStageCount()) {
    return withScene(
      {
        ...progress,
        selectedTheme: getStageDefinition(stageNumber).theme,
        selectedStage: stageNumber,
        activeStage: null,
      },
      "campaign-complete",
    );
  }

  const nextStage = getStageDefinition(stageNumber + 1);

  return withScene(
    {
      ...progress,
      selectedTheme: nextStage.theme,
      selectedStage: nextStage.number,
      activeStage: null,
    },
    "theme",
  );
}

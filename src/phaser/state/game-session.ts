import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "../../game/campaign-progress";
import { ENDLESS_STAGE_NUMBER, getStageCount, getStageDefinition } from "../../game/stages";
import { normalizeMetaProgress } from "../../game/meta-progress";
import type { CampaignProgress } from "../../game/campaign-progress";
import type { ThemeName } from "../../game/stages";
import type { BattleMode, BattleState } from "../../game/logic";

export type AppScene =
  | "title"
  | "campaign"
  | "theme"
  | "shop"
  | "battle"
  | "campaign-complete";

export interface GameSession extends CampaignProgress {
  scene: AppScene;
  selectedTheme: ThemeName | null;
  battleMode: BattleMode;
}

type GameSessionSeed = Omit<GameSession, "scene" | "screen"> & Partial<Pick<GameSession, "scene" | "screen">>;

function withScene(session: GameSessionSeed, scene: AppScene): GameSession {
  return {
    ...session,
    scene,
    screen: sceneToScreen(scene),
  };
}

function sceneToScreen(scene: AppScene): CampaignProgress["screen"] {
  switch (scene) {
    case "campaign":
      return "campaign-menu";
    case "theme":
      return "theme-page";
    case "shop":
      return "shop";
    case "battle":
      return "battle";
    case "campaign-complete":
      return "campaign-complete";
    case "title":
    default:
      return "title";
  }
}

export function createGameSession(): GameSession {
  return withScene(
    {
      ...createCampaignProgress(),
      battleMode: "campaign",
    },
    "title",
  );
}

export function cycleThemeSelection(session: GameSession, direction: number): GameSession {
  const themes = getThemeOrder();

  if (themes.length === 0) {
    return withScene(session, "campaign");
  }

  const currentIndex = Math.max(0, themes.indexOf(session.selectedTheme as ThemeName));
  const nextIndex = (currentIndex + direction + themes.length) % themes.length;
  const nextTheme = themes[nextIndex]!;
  const stageNumber = getThemeStageNumbers(nextTheme)[0] ?? session.selectedStage;

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

export function selectStage(session: GameSession, stageNumber: number): GameSession {
  const stage = getStageDefinition(stageNumber);
  const selected = selectStageForTheme(session, stage.theme, stage.number);

  return withScene(
    {
      ...session,
      ...selected,
    },
    "theme",
  );
}

export function beginBattleFromSelection(session: GameSession): GameSession {
  if (!isStageUnlocked(session, session.selectedStage)) {
    return session;
  }

  return withScene(
    {
      ...session,
      activeStage: session.selectedStage,
      battleMode: "campaign",
    },
    "battle",
  );
}

export function beginEndlessBattle(session: GameSession, metaProgress: unknown): GameSession {
  const normalizedMetaProgress = normalizeMetaProgress(metaProgress);
  if (normalizedMetaProgress.highestClearedStage < getStageCount()) {
    return session;
  }

  return withScene(
    {
      ...session,
      selectedStage: ENDLESS_STAGE_NUMBER,
      activeStage: ENDLESS_STAGE_NUMBER,
      battleMode: "endless",
    },
    "battle",
  );
}

export function retryBattle(session: GameSession): GameSession {
  const activeStage = session.activeStage ?? session.selectedStage;
  if (!isStageUnlocked(session, activeStage)) {
    return session;
  }

  return withScene(
    {
      ...session,
      selectedStage: activeStage,
      activeStage,
      battleMode: session.battleMode ?? "campaign",
    },
    "battle",
  );
}

export function returnFromBattleToTheme(session: GameSession): GameSession {
  return withScene(
    {
      ...session,
      activeStage: null,
      battleMode: "campaign",
    },
    "theme",
  );
}

export function returnToCampaign(session: GameSession): GameSession {
  return withScene(
    {
      ...session,
      activeStage: null,
      battleMode: "campaign",
    },
    "campaign",
  );
}

export function openShop(session: GameSession): GameSession {
  return withScene(
    {
      ...session,
      activeStage: null,
      battleMode: "campaign",
    },
    "shop",
  );
}

export function returnToTitle(session: GameSession): GameSession {
  return withScene(
    {
      ...session,
      activeStage: null,
      battleMode: "campaign",
    },
    "title",
  );
}

export function getCompletedBattleStage(session: GameSession, battleState: Pick<BattleState, "status" | "stage">): number {
  if (battleState.status === "stage-cleared" && session.activeStage) {
    return session.activeStage;
  }

  return battleState.stage;
}

export function completeBattleStage(session: GameSession, stageNumber: number): GameSession {
  const progress = markStageCleared(session, stageNumber);

  if (stageNumber >= getStageCount()) {
    return withScene(
      {
        ...progress,
        selectedTheme: getStageDefinition(stageNumber).theme,
        selectedStage: stageNumber,
        activeStage: null,
        battleMode: "campaign",
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
      battleMode: "campaign",
    },
    "theme",
  );
}

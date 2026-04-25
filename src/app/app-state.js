import {
  beginBattleFromSelection,
  beginEndlessBattle,
  createGameSession,
  cycleThemeSelection,
  openShop,
  returnToCampaign,
  returnToTitle,
  selectStage,
} from "../phaser/state/game-session.js";
import { createMetaProgress, normalizeMetaProgress } from "../game/meta-progress.js";
import { getStageDefinition } from "../game/stages.js";

export const APP_ACTIONS = {
  OPEN_CAMPAIGN: "screen/open-campaign",
  FOCUS_CAMPAIGN_STAGE: "screen/focus-campaign-stage",
  OPEN_THEME: "screen/open-theme",
  OPEN_SHOP: "screen/open-shop",
  RETURN_TITLE: "screen/return-title",
  RETURN_CAMPAIGN: "screen/return-campaign",
  LAUNCH_BATTLE: "screen/launch-battle",
  LAUNCH_ENDLESS: "screen/launch-endless",
  PURCHASE_COMPLETE: "meta/purchase-complete",
  EXIT_BATTLE: "battle/exit-to-menu",
};

function syncSessionFields(appState, session, extra = {}) {
  return {
    ...appState,
    ...extra,
    scene: session.scene,
    selectedTheme: session.selectedTheme,
    selectedStage: session.selectedStage,
    session,
  };
}

export function initializeAppState(metaProgress) {
  return hydrateAppState(createAppState().session, metaProgress);
}

export function createAppState() {
  const session = createGameSession();

  return {
    scene: "title",
    selectedTheme: session.selectedTheme,
    selectedStage: session.selectedStage,
    session,
    metaProgress: createMetaProgress(),
    battleLaunch: null,
  };
}

export function hydrateAppState(session, metaProgress = createMetaProgress()) {
  const normalizedSession = session ?? createGameSession();

  return {
    scene: normalizedSession.scene,
    selectedTheme: normalizedSession.selectedTheme,
    selectedStage: normalizedSession.selectedStage,
    session: normalizedSession,
    metaProgress: normalizeMetaProgress(metaProgress),
    battleLaunch: null,
  };
}

export function openCampaign(appState) {
  const session = cycleThemeSelection(appState.session, 0);
  return syncSessionFields(appState, session, { battleLaunch: null });
}

export function focusCampaignStage(appState, stageNumber) {
  const stage = getStageDefinition(stageNumber);
  const session = {
    ...appState.session,
    scene: "campaign",
    screen: "campaign-menu",
    selectedTheme: stage.theme,
    selectedStage: stage.number,
    activeStage: null,
  };

  return syncSessionFields(appState, session);
}

export function openTheme(appState, stageNumber) {
  const session = selectStage(appState.session, stageNumber);
  return syncSessionFields(appState, session, { battleLaunch: null });
}

export function openShopScreen(appState) {
  const session = openShop(appState.session);
  return syncSessionFields(appState, session, { battleLaunch: null });
}

export function returnToTitleScreen(appState) {
  const session = returnToTitle(appState.session);
  return syncSessionFields(appState, session, { battleLaunch: null });
}

export function returnToCampaignScreen(appState) {
  const session = returnToCampaign(appState.session);
  return syncSessionFields(appState, session, { battleLaunch: null });
}

export function launchBattle(appState) {
  const session = beginBattleFromSelection(appState.session);

  if (session.scene !== "battle") {
    return syncSessionFields(appState, session, { battleLaunch: null });
  }

  return syncSessionFields(appState, session, {
    battleLaunch: {
      session,
      metaProgress: appState.metaProgress,
      mode: session.battleMode ?? "campaign",
      stage: session.activeStage ?? session.selectedStage,
    },
  });
}

export function launchEndless(appState) {
  const session = beginEndlessBattle(appState.session, appState.metaProgress);

  if (session.scene !== "battle") {
    return syncSessionFields(appState, session, { battleLaunch: null });
  }

  return syncSessionFields(appState, session, {
    battleLaunch: {
      session,
      metaProgress: appState.metaProgress,
      mode: "endless",
      stage: session.activeStage ?? session.selectedStage,
    },
  });
}

export function returnFromBattle(appState, session) {
  const nextSession = session.scene === "title"
    ? returnToTitle(session)
    : session.scene === "campaign"
      ? returnToCampaign(session)
      : session;

  return syncSessionFields(appState, nextSession, { battleLaunch: null });
}

export function appReducer(appState, action) {
  switch (action.type) {
    case APP_ACTIONS.OPEN_CAMPAIGN:
      return openCampaign(appState);
    case APP_ACTIONS.FOCUS_CAMPAIGN_STAGE:
      return focusCampaignStage(appState, action.stageNumber);
    case APP_ACTIONS.OPEN_THEME:
      return openTheme(appState, action.stageNumber ?? appState.selectedStage);
    case APP_ACTIONS.OPEN_SHOP:
      return openShopScreen(appState);
    case APP_ACTIONS.RETURN_TITLE:
      return returnToTitleScreen(appState);
    case APP_ACTIONS.RETURN_CAMPAIGN:
      return returnToCampaignScreen(appState);
    case APP_ACTIONS.LAUNCH_BATTLE:
      return launchBattle(appState);
    case APP_ACTIONS.LAUNCH_ENDLESS:
      return launchEndless(appState);
    case APP_ACTIONS.PURCHASE_COMPLETE:
      return {
        ...appState,
        metaProgress: normalizeMetaProgress(action.metaProgress),
      };
    case APP_ACTIONS.EXIT_BATTLE:
      return returnFromBattle(
        {
          ...appState,
          metaProgress: normalizeMetaProgress(action.metaProgress ?? appState.metaProgress),
        },
        action.session,
      );
    default:
      return appState;
  }
}

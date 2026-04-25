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

export function hydrateAppState(session, metaProgress) {
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

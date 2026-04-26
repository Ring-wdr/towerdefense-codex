import { useReducer, useRef } from "react";
import { Toaster } from "sonner";
import {
  APP_ACTIONS,
  appReducer,
  initializeAppState,
} from "./app/app-state.js";
import {
  getCampaignScreenData,
  getShopScreenData,
  getThemeScreenData,
  getTitleScreenData,
} from "./app/screen-data.js";
import BattleHost from "./app/BattleHost";
import BattleControls from "./app/components/BattleControls";
import CampaignScreen from "./app/components/CampaignScreen";
import ShopScreen from "./app/components/ShopScreen";
import ThemeScreen from "./app/components/ThemeScreen";
import TitleScreen from "./app/components/TitleScreen";
import useBattleViewportEffects from "./app/hooks/useBattleViewportEffects";
import useServiceWorkerUpdateToast from "./app/hooks/useServiceWorkerUpdateToast";
import { purchaseUpgrade } from "./game/meta-shop.js";
import { loadMetaProgress, saveMetaProgress } from "./game/meta-progress.js";
import appStyles from "./App.module.css";
import type { MetaShopEntryId } from "./game/meta-shop";
import type { GameSession } from "./phaser/state/game-session";
import type { MetaProgress } from "./game/meta-progress";

export default function App() {
  const battleControlsRef = useRef<HTMLElement | null>(null);
  const [appState, dispatch] = useReducer(appReducer, undefined, () =>
    initializeAppState(loadMetaProgress()),
  );
  useBattleViewportEffects();
  useServiceWorkerUpdateToast();

  const titleData = getTitleScreenData(appState.session, appState.metaProgress);
  const campaignData = getCampaignScreenData(appState.session);
  const themeData = getThemeScreenData(appState.session);
  const shopData = getShopScreenData(appState.metaProgress);
  const handlePurchase = (upgradeId: MetaShopEntryId) => {
    const nextProgress = purchaseUpgrade(appState.metaProgress, upgradeId);
    const savedMetaProgress = saveMetaProgress(nextProgress);

    dispatch({
      type: APP_ACTIONS.PURCHASE_COMPLETE,
      metaProgress: savedMetaProgress,
    });
  };
  const handleExitToMenu = (session: GameSession, metaProgress: MetaProgress) => {
    const savedMetaProgress = saveMetaProgress(metaProgress);

    dispatch({
      type: APP_ACTIONS.EXIT_BATTLE,
      session,
      metaProgress: savedMetaProgress,
    });
  };

  return (
    <main className={appStyles.appRoot}>
      <Toaster position="top-center" richColors />
      {appState.scene === "title" && (
        <TitleScreen
          data={titleData}
          onStartCampaign={() => dispatch({ type: APP_ACTIONS.OPEN_CAMPAIGN })}
          onOpenShop={() => dispatch({ type: APP_ACTIONS.OPEN_SHOP })}
          onStartEndless={() => dispatch({ type: APP_ACTIONS.LAUNCH_ENDLESS })}
        />
      )}
      {appState.scene === "campaign" && (
        <CampaignScreen
          data={campaignData}
          session={appState.session}
          onBack={() => dispatch({ type: APP_ACTIONS.RETURN_TITLE })}
          onPreviewTheme={(stageNumber) =>
            dispatch({
              type: APP_ACTIONS.FOCUS_CAMPAIGN_STAGE,
              stageNumber,
            })
          }
          onOpenBriefing={(stageNumber) =>
            dispatch({
              type: APP_ACTIONS.OPEN_THEME,
              stageNumber,
            })
          }
        />
      )}
      {appState.scene === "theme" && (
        <ThemeScreen
          data={themeData}
          session={appState.session}
          onBack={() => dispatch({ type: APP_ACTIONS.RETURN_CAMPAIGN })}
          onSelectStage={(stageNumber) =>
            dispatch({
              type: APP_ACTIONS.OPEN_THEME,
              stageNumber,
            })
          }
          onEnterBattle={() => dispatch({ type: APP_ACTIONS.LAUNCH_BATTLE })}
        />
      )}
      {appState.scene === "shop" && (
        <ShopScreen
          data={shopData}
          metaProgress={appState.metaProgress}
          onBack={() => dispatch({ type: APP_ACTIONS.RETURN_TITLE })}
          onPurchase={handlePurchase}
        />
      )}
      {appState.scene === "battle" && (
        <BattleHost
          launchPayload={appState.battleLaunch}
          controlsRootRef={battleControlsRef}
          onExitToMenu={handleExitToMenu}
        />
      )}

      <BattleControls controlsRootRef={battleControlsRef} />
    </main>
  );
}

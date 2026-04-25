import { useEffect, useReducer, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import attackTowerIconUrl from "./assets/towers/attack-v2.png";
import cannonTowerIconUrl from "./assets/towers/cannon-v2.png";
import hunterTowerIconUrl from "./assets/towers/hunter-v2.png";
import magicTowerIconUrl from "./assets/towers/magic-v2.png";
import slowTowerIconUrl from "./assets/towers/slow-v2.png";
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
import BattleHost from "./app/BattleHost.jsx";
import CampaignScreen from "./app/components/CampaignScreen.jsx";
import ShopScreen from "./app/components/ShopScreen.jsx";
import ThemeScreen from "./app/components/ThemeScreen.jsx";
import TitleScreen from "./app/components/TitleScreen.jsx";
import { purchaseUpgrade } from "./game/meta-shop.js";
import { loadMetaProgress, saveMetaProgress } from "./game/meta-progress.js";
import appStyles from "./App.module.css";

const BROWSER_SAFE_BOTTOM_VAR = "--browser-safe-bottom";
const TOWER_CHOICES = [
  { type: "attack", key: "1", name: "Attack", iconUrl: attackTowerIconUrl },
  { type: "slow", key: "2", name: "Slow", iconUrl: slowTowerIconUrl },
  { type: "magic", key: "3", name: "Magic", iconUrl: magicTowerIconUrl },
  { type: "cannon", key: "4", name: "Cannon", iconUrl: cannonTowerIconUrl },
  { type: "hunter", key: "5", name: "Hunter", iconUrl: hunterTowerIconUrl },
];
const MOVE_BUTTONS = [
  { move: "up", Icon: ArrowUp, label: "Up", className: "dock-pad__up" },
  { move: "left", Icon: ArrowLeft, label: "Left", className: "dock-pad__left" },
  { move: "right", Icon: ArrowRight, label: "Right", className: "dock-pad__right" },
  { move: "down", Icon: ArrowDown, label: "Down", className: "dock-pad__down" },
];

function renderTowerChoices(keyPrefix = "") {
  return TOWER_CHOICES.map(({ type, key, name, iconUrl }) => (
    <button key={`${keyPrefix}${type}`} type="button" data-tower={type} className="tower-choice">
      <span className="tower-choice__icon">
        <img data-tower-icon={type} src={iconUrl} alt="" />
      </span>
      <span className="tower-choice__meta">
        <span className="tower-choice__key">{key}</span>
        <span className="tower-choice__name">{name}</span>
      </span>
    </button>
  ));
}

function syncBrowserSafeBottomInset() {
  const viewport = window.visualViewport;
  const safeBottomInset = viewport
    ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
    : 0;

  document.documentElement.style.setProperty(BROWSER_SAFE_BOTTOM_VAR, `${safeBottomInset}px`);
}

export default function App() {
  const battleControlsRef = useRef(null);
  const [appState, dispatch] = useReducer(appReducer, undefined, () =>
    initializeAppState(loadMetaProgress()),
  );

  useEffect(() => {
    syncBrowserSafeBottomInset();

    const sync = () => {
      syncBrowserSafeBottomInset();
    };

    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    let lastTouchEndAt = 0;
    const handleTouchEnd = (event) => {
      if (event.touches.length > 0 || event.changedTouches.length > 1) {
        return;
      }

      const now = Date.now();
      if (now - lastTouchEndAt <= 300) {
        event.preventDefault();
      }

      lastTouchEndAt = now;
    };

    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const titleData = getTitleScreenData(appState.session, appState.metaProgress);
  const campaignData = getCampaignScreenData(appState.session);
  const themeData = getThemeScreenData(appState.session);
  const shopData = getShopScreenData(appState.metaProgress);

  return (
    <main className={appStyles.appRoot}>
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
          onPurchase={(upgradeId) => {
            const nextProgress = purchaseUpgrade(appState.metaProgress, upgradeId);
            const savedMetaProgress = saveMetaProgress(nextProgress);

            dispatch({
              type: APP_ACTIONS.PURCHASE_COMPLETE,
              metaProgress: savedMetaProgress,
            });
          }}
        />
      )}
      {appState.scene === "battle" && (
        <BattleHost
          launchPayload={appState.battleLaunch}
          controlsRootRef={battleControlsRef}
          onExitToMenu={(session, metaProgress) => {
            const savedMetaProgress = saveMetaProgress(metaProgress);

            dispatch({
              type: APP_ACTIONS.EXIT_BATTLE,
              session,
              metaProgress: savedMetaProgress,
            });
          }}
        />
      )}

      <section id="battle-controls" className="battle-controls" hidden ref={battleControlsRef}>
        <button id="start-button" className="board-pause-button board-start-button" type="button">
          Start
        </button>
        <button id="pause-button" className="board-pause-button" type="button">
          Pause
        </button>

        <div id="tower-actions" className="tower-actions" hidden>
          <button id="upgrade-action" type="button" aria-label="Upgrade tower">
            Upgrade
          </button>
          <button id="delete-action" type="button" aria-label="Delete tower">
            Delete
          </button>
        </div>

        <aside className="sidebar" hidden>
          <section className="card card--towers">
            <h2>Tower Bay</h2>
            <p className="selection-summary selection-summary--desktop" data-selection-summary></p>
            <div className="tower-grid" id="tower-buttons">
              {renderTowerChoices()}
            </div>
          </section>
        </aside>

        <section
          id="tower-buttons-dock"
          className="control-dock control-dock--hybrid"
          aria-label="Quick play controls"
          hidden
        >
          <div className="dock-section">
            <div className="dock-header">
              <p className="dock-label">Select Tower</p>
              <p className="dock-selection-summary" data-selection-summary></p>
            </div>
            <div className="tower-grid tower-grid--dock">
              {renderTowerChoices("dock-")}
            </div>
          </div>

          <div className="dock-actions-layout">
            <div className="dock-pad" aria-label="Move cursor">
              {MOVE_BUTTONS.map(({ move, Icon, label, className }) => (
                <button key={move} type="button" data-move={move} className={className} aria-label={label}>
                  <Icon aria-hidden="true" size={18} strokeWidth={2.4} />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>

            <div className="dock-actions">
              <button type="button" data-action="build">Build</button>
              <button type="button" data-action="upgrade">Upgrade</button>
              <button type="button" data-action="pause">Pause</button>
              <button type="button" data-action="restart">Restart</button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, createIcons } from "lucide";
import attackTowerIconUrl from "./assets/towers/attack-v2.png";
import cannonTowerIconUrl from "./assets/towers/cannon-v2.png";
import hunterTowerIconUrl from "./assets/towers/hunter-v2.png";
import magicTowerIconUrl from "./assets/towers/magic-v2.png";
import slowTowerIconUrl from "./assets/towers/slow-v2.png";
import {
  createAppState,
  hydrateAppState,
  launchBattle,
  launchEndless,
  openCampaign,
  openShopScreen,
  openTheme,
  returnToCampaignScreen,
  returnFromBattle,
  returnToTitleScreen,
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
import { loadMetaProgress, saveMetaProgress } from "./game/meta-progress.js";
import "./app/menu-shell.css";

const BROWSER_SAFE_BOTTOM_VAR = "--browser-safe-bottom";
const TOWER_CHOICES = [
  { type: "attack", key: "1", name: "Attack", iconUrl: attackTowerIconUrl },
  { type: "slow", key: "2", name: "Slow", iconUrl: slowTowerIconUrl },
  { type: "magic", key: "3", name: "Magic", iconUrl: magicTowerIconUrl },
  { type: "cannon", key: "4", name: "Cannon", iconUrl: cannonTowerIconUrl },
  { type: "hunter", key: "5", name: "Hunter", iconUrl: hunterTowerIconUrl },
];
const MOVE_BUTTONS = [
  { move: "up", icon: "arrow-up", label: "Up", className: "dock-pad__up" },
  { move: "left", icon: "arrow-left", label: "Left", className: "dock-pad__left" },
  { move: "right", icon: "arrow-right", label: "Right", className: "dock-pad__right" },
  { move: "down", icon: "arrow-down", label: "Down", className: "dock-pad__down" },
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
  const [appState, setAppState] = useState(() =>
    hydrateAppState(createAppState().session, loadMetaProgress()),
  );

  useEffect(() => {
    createIcons({
      icons: {
        ArrowUp,
        ArrowLeft,
        ArrowRight,
        ArrowDown,
      },
    });

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

  const titleData = useMemo(
    () => getTitleScreenData(appState.session, appState.metaProgress),
    [appState.session, appState.metaProgress],
  );
  const campaignData = useMemo(
    () => getCampaignScreenData(appState.session),
    [appState.session],
  );
  const themeData = useMemo(
    () => getThemeScreenData(appState.session),
    [appState.session],
  );
  const shopData = useMemo(
    () => getShopScreenData(appState.metaProgress),
    [appState.metaProgress],
  );

  return (
    <main className="app-root">
      {appState.scene === "title" && (
        <TitleScreen
          data={titleData}
          onStartCampaign={() => setAppState((current) => openCampaign(current))}
          onOpenShop={() => setAppState((current) => openShopScreen(current))}
          onStartEndless={() => setAppState((current) => launchEndless(current))}
        />
      )}
      {appState.scene === "campaign" && (
        <CampaignScreen
          data={campaignData}
          session={appState.session}
          onBack={() => setAppState((current) => returnToTitleScreen(current))}
          onSelectStage={(stageNumber) => setAppState((current) => openTheme(current, stageNumber))}
        />
      )}
      {appState.scene === "theme" && (
        <ThemeScreen
          data={themeData}
          onBack={() => setAppState((current) => returnToCampaignScreen(current))}
          onSelectStage={(stageNumber) => setAppState((current) => openTheme(current, stageNumber))}
          onEnterBattle={() => setAppState((current) => launchBattle(current))}
        />
      )}
      {appState.scene === "shop" && (
        <ShopScreen
          data={shopData}
          metaProgress={appState.metaProgress}
          onBack={() => setAppState((current) => returnToTitleScreen(current))}
          onPurchase={(nextProgress) => {
            const saved = saveMetaProgress(nextProgress);
            setAppState((current) => ({ ...current, metaProgress: saved }));
          }}
        />
      )}
      {appState.scene === "battle" && (
        <BattleHost
          launchPayload={appState.battleLaunch}
          onExitToMenu={(session, metaProgress) => {
            const saved = saveMetaProgress(metaProgress);
            setAppState((current) => returnFromBattle({ ...current, metaProgress: saved }, session));
          }}
        />
      )}

      <section id="battle-controls" className="battle-controls" hidden>
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
              {MOVE_BUTTONS.map(({ move, icon, label, className }) => (
                <button key={move} type="button" data-move={move} className={className} aria-label={label}>
                  <i data-lucide={icon} aria-hidden="true"></i>
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

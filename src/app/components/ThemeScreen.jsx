import { WAVES_PER_STAGE } from "../../game/stages.js";
import MenuFrame from "./MenuFrame.jsx";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./ThemeScreen.module.css";

const LOCKED_COPY = "이 구간은 아직 봉쇄 상태다. 캠페인에서 앞선 전장을 먼저 확보해야 한다.";
const THEME_TONES = {
  "기초 방어": "olive",
  "압박 대응": "amber",
  "후반 운용": "blue",
};

function getThemeTone(theme) {
  return THEME_TONES[theme] ?? "olive";
}

function getNodeStatus(stageNumber, locked, selected, session) {
  if (locked) {
    return "LOCKED";
  }

  if (selected) {
    return "SELECTED";
  }

  if (session?.clearedStages?.includes(stageNumber)) {
    return "CLEARED";
  }

  return "READY";
}

function getBattleStatusCopy(stageNumber, locked, session) {
  if (locked) {
    return "Entry Locked";
  }

  if (session?.clearedStages?.includes(stageNumber)) {
    return "Cleared Front";
  }

  return "Ready to Deploy";
}

function getRouteLabel(index, total) {
  return `Route ${index + 1} / ${total}`;
}

export default function ThemeScreen({ data, session, onBack, onSelectStage, onEnterBattle }) {
  const stage = data?.stage ?? null;

  if (!stage) {
    return (
      <MenuFrame
        kicker="Campaign Front"
        title="Stage Briefing"
        tone="olive"
        className={screenStyles.root}
        containerClassName={screenStyles.container}
        footerClassName={screenStyles.footer}
        footerContent={
          <button className={frameStyles.button} type="button" onClick={onBack}>
            Back
          </button>
        }
      >
        <article className={`${frameStyles.panel} ${screenStyles.primaryCard}`}>
          <p className={screenStyles.emptyCopy}>선택된 전장 정보가 없다.</p>
        </article>
      </MenuFrame>
    );
  }

  const selectedEntry = data.stageNumbers.find((entry) => entry.selected) ?? null;
  const battleLocked = selectedEntry?.locked ?? false;
  const selectedIndex = Math.max(0, data.stageNumbers.findIndex((entry) => entry.selected));
  const routeLabel = getRouteLabel(selectedIndex, data.stageNumbers.length);
  const statusLabel = getNodeStatus(stage.number, battleLocked, true, session);
  const statusCopy = getBattleStatusCopy(stage.number, battleLocked, session);

  return (
    <MenuFrame
      kicker={`${stage.theme} 전선`}
      title="Stage Briefing"
      tone={getThemeTone(stage.theme)}
      className={screenStyles.root}
      containerClassName={screenStyles.container}
      footerClassName={screenStyles.footer}
      headerContent={<p className={screenStyles.headerStatus}>{routeLabel}</p>}
      footerContent={
        <>
          <button className={frameStyles.button} type="button" onClick={onBack}>
            Back
          </button>
          <button
            className={frameStyles.button}
            type="button"
            onClick={battleLocked ? undefined : onEnterBattle}
            disabled={battleLocked}
          >
            {battleLocked ? "Locked" : "Enter Battle"}
          </button>
        </>
      }
    >
      <section className={screenStyles.layout}>
        <section className={screenStyles.routeStrip} aria-label={`${stage.theme} routes`}>
          {data.stageNumbers.map(({ stage: entryStage, locked, selected }, index) => (
            <button
              key={entryStage.number}
              className={[
                screenStyles.routeTab,
                selected ? screenStyles.selected : "",
              ].filter(Boolean).join(" ")}
              type="button"
              onClick={() => {
                if (!locked) {
                  onSelectStage(entryStage.number);
                }
              }}
              disabled={locked}
              data-state={locked ? "locked" : selected ? "selected" : "ready"}
            >
              <span className={screenStyles.routeTabLabel}>{`Route ${index + 1}`}</span>
              <strong className={screenStyles.routeTabTitle}>{entryStage.name}</strong>
              <span className={screenStyles.routeTabStatus}>
                {getNodeStatus(entryStage.number, locked, selected, session)}
              </span>
            </button>
          ))}
        </section>

        <article className={`${frameStyles.panel} ${screenStyles.primaryCard}`}>
          <div className={screenStyles.cardHeader}>
            <p className={screenStyles.eyebrow}>{stage.theme}</p>
            <p className={screenStyles.stageNumber}>Stage {stage.number}</p>
          </div>

          <div className={screenStyles.heroBlock}>
            <h2 className={screenStyles.title}>{stage.name}</h2>
            <p className={screenStyles.statusBanner}>{statusCopy}</p>
          </div>

          <div className={screenStyles.metrics}>
            <p className={screenStyles.stat}>
              <span>Status</span>
              <strong>{statusLabel}</strong>
            </p>
            <p className={screenStyles.stat}>
              <span>Route</span>
              <strong>{routeLabel}</strong>
            </p>
            <p className={screenStyles.stat}>
              <span>Waves</span>
              <strong>{WAVES_PER_STAGE} Waves</strong>
            </p>
          </div>

          <p className={screenStyles.summary}>{battleLocked ? LOCKED_COPY : stage.summary}</p>
        </article>
      </section>
    </MenuFrame>
  );
}

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

function getNodeSlotClassName(index) {
  return screenStyles[`nodeSlot${index + 1}`] ?? "";
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
        footerContent={null}
      >
        <section className={screenStyles.layout}>
          <section className={screenStyles.mapBoard} aria-hidden="true">
            <div className={screenStyles.mapBackdrop} />
            <div className={screenStyles.mapLane}>
              <span className={`${screenStyles.segment} ${screenStyles.segmentOne}`} />
              <span className={`${screenStyles.segment} ${screenStyles.segmentTwo}`} />
            </div>
          </section>

          <section className={`${frameStyles.panel} ${screenStyles.hudPanel}`}>
            <div className={screenStyles.hudCopy}>
              <p className={screenStyles.eyebrow}>Campaign Front</p>
              <h2 className={screenStyles.title}>No Stage Selected</h2>
              <p className={screenStyles.summary}>선택된 전장 정보가 없다.</p>
            </div>

            <div className={screenStyles.hudActions}>
              <button className={frameStyles.button} type="button" onClick={onBack}>
                Back
              </button>
            </div>
          </section>
        </section>
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
      footerContent={null}
    >
      <section className={screenStyles.layout}>
        <section className={screenStyles.mapBoard} aria-label={`${stage.theme} tactical map`}>
          <div className={screenStyles.mapBackdrop} aria-hidden="true" />
          <div className={screenStyles.mapLane} aria-hidden="true">
            <span className={`${screenStyles.segment} ${screenStyles.segmentOne}`} />
            <span className={`${screenStyles.segment} ${screenStyles.segmentTwo}`} />
          </div>

          {data.stageNumbers.map(({ stage: entryStage, locked, selected }, index) => (
            <button
              key={entryStage.number}
              className={[
                screenStyles.nodeButton,
                getNodeSlotClassName(index),
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
              <span className={screenStyles.nodeRing} aria-hidden="true" />
              <span className={screenStyles.nodeStage}>{`S${entryStage.number}`}</span>
              <strong className={screenStyles.nodeName}>{entryStage.name}</strong>
              <span className={screenStyles.nodeStatus}>
                {getNodeStatus(entryStage.number, locked, selected, session)}
              </span>
            </button>
          ))}
        </section>

        <section className={`${frameStyles.panel} ${screenStyles.hudPanel}`}>
          <div className={screenStyles.hudMain}>
            <div className={screenStyles.hudCopy}>
              <div className={screenStyles.cardHeader}>
                <p className={screenStyles.eyebrow}>{stage.theme}</p>
                <p className={screenStyles.stageNumber}>Stage {stage.number}</p>
              </div>
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
          </div>

          <div className={screenStyles.hudActions}>
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
          </div>
        </section>
      </section>
    </MenuFrame>
  );
}

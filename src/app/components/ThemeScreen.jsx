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

function getStagePositionLabel(index, total) {
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
        containerClassName={screenStyles.container}
        footerClassName={screenStyles.footer}
        footerContent={
          <button className={frameStyles.button} type="button" onClick={onBack}>
            Back
          </button>
        }
      >
        <article className={`${frameStyles.panel} ${screenStyles.briefing}`}>
          <p className={screenStyles.copy}>선택된 전장 정보가 없다.</p>
        </article>
      </MenuFrame>
    );
  }

  const selectedEntry = data.stageNumbers.find((entry) => entry.selected) ?? null;
  const battleLocked = selectedEntry?.locked ?? false;
  const routeLabel = selectedEntry
    ? `ROUTE ${data.stageNumbers.indexOf(selectedEntry) + 1} OF ${data.stageNumbers.length}`
    : `ROUTE UNKNOWN OF ${data.stageNumbers.length}`;

  return (
    <MenuFrame
      kicker={`${stage.theme} 전선`}
      title="Stage Briefing"
      tone={getThemeTone(stage.theme)}
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
        <article className={`${frameStyles.panel} ${screenStyles.briefing}`}>
          <p className={screenStyles.eyebrow}>{stage.theme}</p>
          <h2 className={screenStyles.title}>{stage.name}</h2>
          <p className={screenStyles.copy}>{battleLocked ? LOCKED_COPY : stage.summary}</p>
          <div className={screenStyles.meta}>
            <p className={screenStyles.stat}>
              <span>Status</span>
              <strong>{battleLocked ? "Entry Locked" : "Ready to Deploy"}</strong>
            </p>
          </div>
        </article>

        <section className={screenStyles.stageGrid} aria-label={`${stage.theme} stages`}>
          {data.stageNumbers.map(({ stage: entryStage, locked, selected }, index) => (
            <button
              key={entryStage.number}
              className={[
                frameStyles.panel,
                screenStyles.stageCard,
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
              <p className={screenStyles.stageLabel}>{getStagePositionLabel(index, data.stageNumbers.length)}</p>
              <h2 className={screenStyles.stageTitle}>{entryStage.name}</h2>
              <p className={screenStyles.stageMeta}>Stage {entryStage.number}</p>
              <p className={screenStyles.stageStatus}>
                {getNodeStatus(entryStage.number, locked, selected, session)}
              </p>
            </button>
          ))}
        </section>
      </section>
    </MenuFrame>
  );
}

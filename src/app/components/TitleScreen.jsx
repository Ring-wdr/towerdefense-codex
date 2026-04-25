import MenuFrame from "./MenuFrame.jsx";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./TitleScreen.module.css";

export default function TitleScreen({ data, onStartCampaign, onOpenShop, onStartEndless }) {
  const footerContent = (
    <>
      <button className={frameStyles.button} type="button" onClick={onStartCampaign}>
        Start Campaign
      </button>
      <button className={frameStyles.button} type="button" onClick={onOpenShop}>
        Shop
      </button>
      {data.isEndlessUnlocked ? (
        <button className={frameStyles.button} type="button" onClick={onStartEndless}>
          Endless Mode
        </button>
      ) : null}
    </>
  );

  return (
    <MenuFrame
      kicker="Campaign Front"
      title="Stage Command"
      tone="olive"
      className={screenStyles.root}
      containerClassName={screenStyles.container}
      footerClassName={screenStyles.footer}
      footerContent={footerContent}
    >
      <article className={`${frameStyles.panel} ${screenStyles.briefing}`}>
        <p className={screenStyles.copy}>{data.helperCopy}</p>
      </article>
    </MenuFrame>
  );
}

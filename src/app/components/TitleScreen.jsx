import MenuFrame from "./MenuFrame.jsx";

export default function TitleScreen({ data, onStartCampaign, onOpenShop, onStartEndless }) {
  return (
    <MenuFrame
      kicker="Campaign Front"
      title="Stage Command"
      tone="olive"
      className="menu-frame--title-screen"
      actions={
        <>
          <button className="menu-button" type="button" onClick={onStartCampaign}>
            Start Campaign
          </button>
          <button className="menu-button" type="button" onClick={onOpenShop}>
            Shop
          </button>
          {data.isEndlessUnlocked ? (
            <button className="menu-button" type="button" onClick={onStartEndless}>
              Endless Mode
            </button>
          ) : null}
        </>
      }
    >
      <article className="menu-card title-briefing">
        <p className="title-briefing__copy">{data.helperCopy}</p>
      </article>
    </MenuFrame>
  );
}

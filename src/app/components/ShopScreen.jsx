import MenuFrame from "./MenuFrame.jsx";

const SHOP_CARD_STYLE_TOKENS = {
  global: "global",
  tower: "tower",
  combat: "combat",
};

function getCardClassName(category) {
  const styleToken = SHOP_CARD_STYLE_TOKENS[category] ?? SHOP_CARD_STYLE_TOKENS.tower;
  return `menu-card shop-card shop-card--${styleToken}`;
}

export default function ShopScreen({ data, metaProgress, onBack, onPurchase }) {
  return (
    <MenuFrame
      kicker="Meta Shop"
      title="Field Arsenal"
      tone="amber"
      className="menu-frame--shop-screen"
      actions={(
        <button className="menu-button" type="button" onClick={onBack}>
          Back
        </button>
      )}
    >
      <article className="menu-card shop-status">
        <div className="shop-status__stats" aria-label="Shop progression">
          <p className="shop-status__stat">
            <span className="shop-status__label">Currency</span>
            <strong className="shop-status__value">{metaProgress.currency} G</strong>
          </p>
          <p className="shop-status__stat">
            <span className="shop-status__label">Cleared</span>
            <strong className="shop-status__value">Stage {metaProgress.highestClearedStage}</strong>
          </p>
        </div>
        <p className="shop-status__copy">영구 보급을 정비해 다음 전투의 기본 전력을 끌어올린다.</p>
      </article>

      <section className="shop-grid" aria-label="Meta shop upgrades">
        {data.map(({ entry, summary }) => (
          <article key={entry.id} className={getCardClassName(entry.category)}>
            <p className="shop-card__category">{entry.category}</p>
            <h2 className="shop-card__title">{entry.label}</h2>
            <p className="shop-card__level">
              Lv {summary.currentLevel}/{entry.maxLevel}
            </p>
            <p className="shop-card__detail">{summary.detailLabel}</p>
            <button
              className="menu-button shop-card__action"
              type="button"
              disabled={!summary.isPurchaseEnabled}
              onClick={() => {
                if (!summary.isPurchaseEnabled) {
                  return;
                }

                onPurchase(entry.id);
              }}
            >
              {summary.buttonLabel}
            </button>
          </article>
        ))}
      </section>
    </MenuFrame>
  );
}

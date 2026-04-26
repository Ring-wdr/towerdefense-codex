import MenuFrame from "./MenuFrame";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./ShopScreen.module.css";
import type { MetaProgress } from "../../game/meta-progress";
import type { MetaShopCategory, MetaShopEntryId } from "../../game/meta-shop";
import type { ShopScreenDataRow } from "../screen-data";
import type { FooterAction } from "./MenuFrame";

const SHOP_CARD_STYLE_TOKENS = {
  global: "global",
  tower: "tower",
  combat: "combat",
} as const;

interface ShopScreenProps {
  data: ShopScreenDataRow[];
  metaProgress: MetaProgress;
  onBack: FooterAction["onClick"];
  onPurchase: (upgradeId: MetaShopEntryId) => void;
}

function getCardClassName(category: MetaShopCategory): string {
  const styleToken = SHOP_CARD_STYLE_TOKENS[category] ?? SHOP_CARD_STYLE_TOKENS.tower;
  const cardVariant = `card${styleToken.charAt(0).toUpperCase()}${styleToken.slice(1)}`;
  return [
    frameStyles.panel,
    screenStyles.card,
    screenStyles[cardVariant],
  ].filter(Boolean).join(" ");
}

export default function ShopScreen({ data, metaProgress, onBack, onPurchase }: ShopScreenProps) {
  return (
    <MenuFrame
      kicker="Meta Shop"
      title="Field Arsenal"
      tone="amber"
      className={screenStyles.root ?? ""}
      containerClassName={screenStyles.container ?? ""}
      headerContent={
        <div className={screenStyles.headerStats}>
          <span className={screenStyles.headerStat}>{metaProgress.currency} G</span>
          <span className={screenStyles.headerStat}>Stage {metaProgress.highestClearedStage}</span>
        </div>
      }
      footerActions={[{ key: "back", label: "Back", onClick: onBack }]}
    >
      <article className={`${frameStyles.panel} ${screenStyles.summary}`}>
        <p className={screenStyles.copy}>영구 보급을 정비해 다음 전투의 기본 전력을 끌어올린다.</p>
      </article>

      <section className={screenStyles.grid} aria-label="Meta shop upgrades">
        {data.map(({ entry, summary }) => (
          <article key={entry.id} className={getCardClassName(entry.category)}>
            <p className={screenStyles.category}>{entry.category}</p>
            <h2 className={screenStyles.title}>{entry.label}</h2>
            <p className={screenStyles.level}>
              Lv {summary.currentLevel}/{entry.maxLevel}
            </p>
            <p className={screenStyles.detail}>{summary.detailLabel}</p>
            <button
              className={screenStyles.action}
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

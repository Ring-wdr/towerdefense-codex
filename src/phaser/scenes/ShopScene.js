import * as Phaser from "phaser";
import {
  loadMetaProgress,
  normalizeMetaProgress,
  saveMetaProgress,
} from "../../game/meta-progress.js";
import { canPurchaseUpgrade, META_SHOP_CATALOG, purchaseUpgrade } from "../../game/meta-shop.js";
import { createGameSession, returnToTitle } from "../state/game-session.js";
import {
  createBackdrop,
  createBodyTextStyle,
  createButton,
  createHeadingTextStyle,
  createPanel,
  createStatusStrip,
  createTitleLockup,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getMetaProgress(scene) {
  return scene.game.registry.get("metaProgress") ?? loadMetaProgress();
}

function getProgressBucket(upgrade) {
  return upgrade.progressBucket === "combatUnlocks" ? "combatUnlocks" : "upgrades";
}

function hideBattleControls() {
  const controls = document.getElementById("battle-controls");
  if (controls) {
    controls.hidden = true;
  }
}

function clampRenderableUpgradeLevel(value, maxLevel) {
  const upperBound = Math.max(maxLevel - 1, 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  const integerValue = Math.trunc(value);

  if (!Number.isInteger(value)) {
    return Math.min(Math.max(integerValue, 0), upperBound);
  }

  if (integerValue < 0) {
    return 0;
  }

  if (integerValue > maxLevel) {
    return upperBound;
  }

  return integerValue;
}

export function getShopEntryState(metaProgress, upgrade) {
  const normalizedProgress = normalizeMetaProgress(metaProgress);
  const progressBucket = getProgressBucket(upgrade);
  const currentLevel = clampRenderableUpgradeLevel(
    normalizedProgress[progressBucket][upgrade.id] ?? 0,
    upgrade.maxLevel,
  );
  const nextLevel = upgrade.levels[currentLevel] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      buttonLabel: "Maxed",
      detailLabel: "All tiers acquired",
      isPurchaseEnabled: false,
    };
  }

  if (normalizedProgress.highestClearedStage < nextLevel.unlockStage) {
    return {
      currentLevel,
      buttonLabel: `S${nextLevel.unlockStage}`,
      detailLabel: `Unlock Stage ${nextLevel.unlockStage}`,
      isPurchaseEnabled: false,
    };
  }

  const isPurchaseEnabled = canPurchaseUpgrade(normalizedProgress, upgrade.id);

  return {
    currentLevel,
    buttonLabel: isPurchaseEnabled ? "Buy" : `${nextLevel.price}G`,
    detailLabel: `Cost ${nextLevel.price}G`,
    isPurchaseEnabled,
  };
}

export function resolveShopPurchase(metaProgress, upgradeId) {
  if (!canPurchaseUpgrade(metaProgress, upgradeId)) {
    return {
      didPurchase: false,
      nextProgress: metaProgress,
    };
  }

  return {
    didPurchase: true,
    nextProgress: purchaseUpgrade(metaProgress, upgradeId),
  };
}

export class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create() {
    hideBattleControls();
    this.cameras.main.setBackgroundColor("#101813");
    this.game.registry.set("session", getSession(this));
    this.game.registry.set("metaProgress", getMetaProgress(this));
    this.renderScene();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    this.scene.restart();
  }

  renderScene() {
    const layout = getSceneLayout(this, {
      safeBottomInset: getBrowserSafeBottomInset(),
    });
    const metaProgress = normalizeMetaProgress(getMetaProgress(this));
    createBackdrop(this, layout, { fillTop: 0x14201b, fillBottom: 0x09110d, accent: 0xd6ae72 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      "META SHOP",
      "Field Arsenal",
      {
        kickerColor: "#d6ae72",
        kickerSize: layout.isMobile ? 17 : 20,
        titleSize: layout.isMobile ? 38 : 54,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    const stripY = lockup.titleText.y + lockup.titleText.height + (layout.isMobile ? 38 : 46);
    const stripWidth = Math.min(layout.isMobile ? 150 : 210, Math.floor(layout.contentWidth / 2) - 10);
    createStatusStrip(this, layout.centerX - stripWidth / 2 - 8, stripY, stripWidth, "CURRENCY", `${metaProgress.currency} G`, {
      labelColor: "#d6ae72",
      valueSize: layout.isMobile ? 20 : 24,
    });
    createStatusStrip(this, layout.centerX + stripWidth / 2 + 8, stripY, stripWidth, "CLEARED", `STAGE ${metaProgress.highestClearedStage}`, {
      labelColor: "#8fb095",
      valueSize: layout.isMobile ? 20 : 24,
    });

    const helperTextY = stripY + (layout.isMobile ? 52 : 60);
    this.add
      .text(layout.centerX, helperTextY, "영구 보급을 정비해 다음 전투의 기본 전력을 끌어올린다.", createBodyTextStyle({
        color: "#d8d1c4",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${layout.isMobile ? 15 : 18}px`,
        align: "center",
        wordWrap: { width: layout.contentWidth - (layout.isMobile ? 24 : 220) },
      }))
      .setOrigin(0.5, 0);

    const columns = 3;
    const rows = Math.ceil(META_SHOP_CATALOG.length / columns);
    const gapX = layout.isMobile ? 10 : 16;
    const gapY = layout.isMobile ? 10 : 14;
    const gridWidth = layout.contentWidth;
    const gridTop = helperTextY + (layout.isMobile ? 34 : 40);
    const gridHeight = Math.max(0, layout.focus.bottom - gridTop - (layout.isMobile ? 8 : 10));
    const cardWidth = Math.floor((gridWidth - gapX * (columns - 1)) / columns);
    const cardHeight = Math.max(layout.isMobile ? 82 : 96, Math.floor((gridHeight - gapY * (rows - 1)) / rows));
    const cardLeft = layout.margin;

    META_SHOP_CATALOG.forEach((upgrade, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = cardLeft + column * (cardWidth + gapX);
      const y = gridTop + row * (cardHeight + gapY);
      const summary = getShopEntryState(metaProgress, upgrade);

      createPanel(this, x, y, cardWidth, cardHeight, {
        fill: upgrade.category === "global"
          ? 0x211912
          : upgrade.category === "combat"
            ? 0x1a1827
            : 0x16231c,
        stroke: upgrade.category === "global"
          ? 0xd6ae72
          : upgrade.category === "combat"
            ? 0x92a0ff
            : 0x8fb095,
      });

      this.add
        .text(x + 12, y + 10, upgrade.label, createBodyTextStyle({
          color: "#f5efe1",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 12 : 15}px`,
          fontStyle: "700",
          wordWrap: { width: cardWidth - 24 },
        }))
        .setOrigin(0, 0);

      this.add
        .text(x + 12, y + (layout.isMobile ? 36 : 40), `Lv ${summary.currentLevel}/${upgrade.maxLevel}`, createHeadingTextStyle({
          color: upgrade.category === "combat" ? "#b9c3ff" : "#d6ae72",
          fontFamily: PHASER_TEXT_FONTS.heading,
          fontSize: `${layout.isMobile ? 16 : 20}px`,
          strokeThickness: 3,
        }))
        .setOrigin(0, 0);

      this.add
        .text(x + 12, y + cardHeight - (layout.isMobile ? 32 : 36), summary.detailLabel, createBodyTextStyle({
          color: "#9eb29f",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 11 : 13}px`,
          wordWrap: { width: cardWidth - 112 },
        }))
        .setOrigin(0, 0.5);

      createButton(
        this,
        x + cardWidth - (layout.isMobile ? 40 : 48),
        y + cardHeight - (layout.isMobile ? 30 : 34),
        layout.isMobile ? 68 : 82,
        layout.isMobile ? 28 : 32,
        summary.buttonLabel,
        () => {
          const purchase = resolveShopPurchase(getMetaProgress(this), upgrade.id);

          if (!purchase.didPurchase) {
            return;
          }

          const savedProgress = saveMetaProgress(purchase.nextProgress);
          this.game.registry.set("metaProgress", savedProgress);
          this.scene.restart();
        },
        {
          backgroundColor: summary.isPurchaseEnabled ? 0xb47b3c : 0x304039,
          strokeColor: summary.isPurchaseEnabled ? 0xf0d3a1 : 0x7f987d,
          fontSize: layout.isMobile ? 14 : 16,
        },
      );
    });

    const backButtonWidth = Math.min(layout.contentWidth - (layout.isMobile ? 20 : 180), layout.isMobile ? 220 : 280);
    createButton(this, layout.centerX, layout.command.centerY, backButtonWidth, layout.isMobile ? 48 : 54, "Back", () => {
      const nextSession = returnToTitle(getSession(this));
      this.game.registry.set("session", nextSession);
      this.scene.start("TitleScene");
    }, {
      backgroundColor: 0x1b2a24,
      strokeColor: 0x7f987d,
      fontSize: layout.isMobile ? 20 : 24,
    });
  }
}

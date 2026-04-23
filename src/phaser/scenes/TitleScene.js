import * as Phaser from "phaser";
import { getStageCount } from "../../game/stages.js";
import { loadMetaProgress } from "../../game/meta-progress.js";
import {
  beginEndlessBattle,
  cycleThemeSelection,
  createGameSession,
  openShop,
} from "../state/game-session.js";
import {
  createBackdrop,
  createBodyTextStyle,
  createCommandButton,
  createTitleLockup,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";
import titleCommandCrestUrl from "../../assets/phaser-ui/title-command-crest.png";

const TITLE_COMMAND_CREST_KEY = "phaser-ui-title-command-crest";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getMetaProgress(scene) {
  const progress = scene.game.registry.get("metaProgress") ?? loadMetaProgress();
  scene.game.registry.set("metaProgress", progress);
  return progress;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    if (!this.textures.exists(TITLE_COMMAND_CREST_KEY)) {
      this.load.image(TITLE_COMMAND_CREST_KEY, titleCommandCrestUrl);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#101813");
    this.game.registry.set("session", getSession(this));
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
    const isCompactTitle = layout.height <= 360 || layout.focus.height < 180;
    createBackdrop(this, layout, { fillTop: 0x16231c, fillBottom: 0x08100c, accent: 0xd3a35d });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + (layout.isMobile ? 8 : 16),
      "CAMPAIGN FRONT",
      "Stage Command",
      {
        kickerSize: layout.isMobile ? 18 : 22,
        titleSize: layout.isMobile ? 46 : 72,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 40 : 120),
      },
    );

    if (!isCompactTitle) {
      const crestY = lockup.titleText.y + lockup.titleText.height + (layout.isMobile ? 132 : 164);
      const crest = this.add.image(layout.centerX, crestY, TITLE_COMMAND_CREST_KEY).setOrigin(0.5);
      crest.setScale(layout.isMobile ? 0.22 : 0.28);
      crest.setAlpha(0.96);
    }

    const helperCopy = "단일 캠페인 루트. 각 전선은 순차적으로 개방된다.";

    const metaProgress = getMetaProgress(this);
    const isEndlessUnlocked = metaProgress.highestClearedStage >= getStageCount();
    const commandCount = isEndlessUnlocked ? 3 : 2;
    const buttonWidth = Math.min(layout.contentWidth - (layout.isMobile ? 20 : 160), layout.isMobile ? 280 : 320);
    const buttonHeight = Math.max(
      44,
      Math.min(
        layout.isMobile ? 48 : 52,
        Math.floor((layout.command.height - (layout.isMobile ? 10 : 12) * (commandCount - 1)) / commandCount),
      ),
    );
    const commandGap = layout.isMobile ? 10 : 12;
    const commandStackHeight = buttonHeight * commandCount + commandGap * (commandCount - 1);
    const commandStackTop = Math.min(layout.command.top, layout.command.bottom - commandStackHeight);
    const primaryButtonY = commandStackTop + buttonHeight / 2;
    const secondaryButtonY = primaryButtonY + buttonHeight + commandGap;
    const endlessButtonY = secondaryButtonY + buttonHeight + commandGap;
    if (!isCompactTitle) {
      this.add
        .text(layout.centerX, layout.focus.bottom - (layout.isMobile ? 58 : 62), helperCopy, {
          ...createBodyTextStyle({
          color: "#8fa18f",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 14 : 17}px`,
          letterSpacing: 1,
          align: "center",
          wordWrap: layout.isMobile ? { width: layout.contentWidth - 56 } : undefined,
          }),
        })
        .setOrigin(0.5, 0.5);
    }

    createCommandButton(
      this,
      layout.centerX,
      primaryButtonY,
      buttonWidth,
      buttonHeight,
      "Start Campaign",
      () => {
        const nextSession = cycleThemeSelection(getSession(this), 0);
        this.game.registry.set("session", nextSession);
        this.scene.start("CampaignScene");
      },
      {
        variant: "primary",
        fontSize: layout.isMobile ? 22 : 28,
      },
    );

    createCommandButton(
      this,
      layout.centerX,
      secondaryButtonY,
      buttonWidth,
      buttonHeight,
      "Shop",
      () => {
        const nextSession = openShop(getSession(this));
        this.game.registry.set("session", nextSession);
        this.scene.start("ShopScene");
      },
      {
        fontSize: layout.isMobile ? 20 : 24,
      },
    );

    if (isEndlessUnlocked) {
      createCommandButton(
        this,
        layout.centerX,
        endlessButtonY,
        buttonWidth,
        buttonHeight,
        "Endless Mode",
        () => {
          const nextSession = beginEndlessBattle(getSession(this), metaProgress);
          this.game.registry.set("session", nextSession);
          this.scene.start("BattleScene", { mode: "endless" });
        },
        {
          fontSize: layout.isMobile ? 20 : 24,
        },
      );
    }
  }
}

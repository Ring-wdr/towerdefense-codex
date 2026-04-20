import Phaser from "phaser";
import { getStageDefinition, getThemeOrder, getThemeStageNumbers } from "../../game/stages.js";
import { beginBattleFromSelection, createGameSession, returnToCampaign, selectStage } from "../state/game-session.js";
import { isStageUnlocked } from "../../game/campaign-progress.js";
import { createBackdrop, createCommandButton, createStatusStrip, createTitleLockup } from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";
import themeFundamentalsSigilUrl from "../../assets/phaser-ui/theme-fundamentals-sigil.png";
import themeLateOperationsSigilUrl from "../../assets/phaser-ui/theme-late-operations-sigil.png";
import themePressureSigilUrl from "../../assets/phaser-ui/theme-pressure-sigil.png";

const THEME_SIGIL_KEYS = [
  { key: "phaser-ui-theme-sigil-0", url: themeFundamentalsSigilUrl },
  { key: "phaser-ui-theme-sigil-1", url: themePressureSigilUrl },
  { key: "phaser-ui-theme-sigil-2", url: themeLateOperationsSigilUrl },
];

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getThemeSigilKey(theme) {
  const themeIndex = getThemeOrder().indexOf(theme);
  return THEME_SIGIL_KEYS[Math.max(0, themeIndex)]?.key ?? THEME_SIGIL_KEYS[0].key;
}

function hideBattleControls() {
  const controls = document.getElementById("battle-controls");
  if (controls) {
    controls.hidden = true;
  }
}

function getThemeStageIndex(stageNumbers, stageNumber) {
  const index = stageNumbers.indexOf(stageNumber);
  return index >= 0 ? index : 0;
}

export class ThemeScene extends Phaser.Scene {
  constructor() {
    super("ThemeScene");
  }

  preload() {
    for (const { key, url } of THEME_SIGIL_KEYS) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }
  }

  create() {
    hideBattleControls();
    this.cameras.main.setBackgroundColor("#101813");
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
    const session = getSession(this);
    const stage = getStageDefinition(session.selectedStage ?? 1);
    const themeStageNumbers = getThemeStageNumbers(stage.theme);
    const themeStageIndex = getThemeStageIndex(themeStageNumbers, stage.number);
    createBackdrop(this, layout, { fillTop: 0x161e1a, fillBottom: 0x0a100d, accent: 0xd2aa65 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      `${stage.theme.toUpperCase()} FRONT`,
      stage.name,
      {
        kickerSize: layout.isMobile ? 15 : 17,
        titleSize: layout.isMobile ? 30 : 46,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 14, `Stage ${stage.number}`, {
        color: "#89a693",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 16 : 20}px`,
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0);

    const stageSelectorRow = layout.getCommandRow(2, layout.isMobile ? 96 : 124);
    const stageSelectorGap = layout.isMobile ? 14 : 18;
    const stageSelectorLabelGap = layout.isMobile ? 8 : 10;
    const stageSelectorTop = layout.header.bottom + (layout.isMobile ? 24 : 30);
    const stageSelectorY = stageSelectorTop + stageSelectorLabelGap + stageSelectorRow.buttonHeight / 2;
    const stageSelectorBottom = stageSelectorY + stageSelectorRow.buttonHeight / 2;
    const selectorBlockBottom = stageSelectorBottom + (layout.isMobile ? 8 : 12);
    const stageLabelY = stageSelectorTop;

    this.add
      .text(layout.centerX, stageLabelY, `Stage ${themeStageIndex + 1} of ${themeStageNumbers.length}`, {
        color: "#c9d5c3",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 13 : 15}px`,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0.5);

    createCommandButton(this, stageSelectorRow.positions[0], stageSelectorY, stageSelectorRow.buttonWidth, stageSelectorRow.buttonHeight, "Prev Stage", () => {
      const previousStage = themeStageNumbers[(themeStageIndex - 1 + themeStageNumbers.length) % themeStageNumbers.length];
      const nextSession = selectStage(getSession(this), previousStage);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    }, {
      fontSize: layout.isMobile ? 14 : 16,
    });

    createCommandButton(this, stageSelectorRow.positions[1], stageSelectorY, stageSelectorRow.buttonWidth, stageSelectorRow.buttonHeight, "Next Stage", () => {
      const nextStage = themeStageNumbers[(themeStageIndex + 1) % themeStageNumbers.length];
      const nextSession = selectStage(getSession(this), nextStage);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    }, {
      fontSize: layout.isMobile ? 14 : 16,
    });

    const battleLocked = !isStageUnlocked(session, stage.number);
    const focusTop = layout.focus.top;
    const focusBottom = layout.command.top;
    const focusHeight = Math.max(0, focusBottom - focusTop);
    const briefingTopBase = selectorBlockBottom + stageSelectorGap;
    const remainingFocusHeight = Math.max(0, focusBottom - briefingTopBase);
    const isCompactBriefing = layout.height <= 420 || remainingFocusHeight < (layout.isMobile ? 150 : 170);
    const summaryTop = briefingTopBase + Math.round(remainingFocusHeight * (isCompactBriefing ? 0.04 : layout.isMobile ? 0.12 : 0.14));
    const summaryWidth = layout.contentWidth - (layout.isMobile ? 22 : 120);
    const routeStripHeight = layout.isMobile ? 56 : 62;
    const routeStripY = focusBottom - routeStripHeight / 2 - (layout.isMobile ? 10 : 12);
    const routeStripVisible = !isCompactBriefing;
    const summaryBottomLimit = routeStripVisible
      ? routeStripY - routeStripHeight / 2 - (layout.isMobile ? 12 : 16)
      : focusBottom - (isCompactBriefing ? 10 : 16);
    const summaryAvailableHeight = Math.max(0, summaryBottomLimit - summaryTop);
    const summaryHeight = Math.min(layout.isMobile ? 180 : 210, summaryAvailableHeight);
    const summaryVisible = summaryHeight >= (layout.isMobile ? 72 : 84);
    const summaryPadding = summaryVisible
      ? Math.max(8, Math.min(layout.isMobile ? 16 : 22, Math.floor(summaryHeight * (isCompactBriefing ? 0.12 : 0.16))))
      : 0;
    const summaryTitleY = summaryTop + summaryPadding;
    const summaryBodyY = summaryVisible
      ? summaryTop + Math.max(
          summaryPadding + (isCompactBriefing ? 16 : 24),
          Math.min(summaryHeight - summaryPadding - (layout.isMobile ? 22 : 34), Math.round(summaryHeight * (isCompactBriefing ? 0.3 : 0.42))),
        )
      : summaryTop;
    const summaryBodyFontSize = summaryHeight < 104 ? (layout.isMobile ? 12 : 14) : summaryHeight < 128 ? (layout.isMobile ? 13 : 15) : summaryHeight < 140 ? (layout.isMobile ? 14 : 17) : layout.isMobile ? 16 : 20;
    const summaryCopy = isCompactBriefing
      ? `${stage.summary.split(".")[0].trim()}.`
      : stage.summary;
    const hasThemeArt = !isCompactBriefing && summaryVisible;
    const sigilY = summaryTop + Math.round(summaryHeight * 0.28);

    if (hasThemeArt) {
      const sigil = this.add.image(layout.centerX, sigilY, getThemeSigilKey(stage.theme)).setOrigin(0.5);
      sigil.setScale(layout.isMobile ? 0.17 : 0.21);
      sigil.setAlpha(0.96);
    }

    const summaryGraphics = this.add.graphics();
    if (summaryVisible) {
      summaryGraphics.fillStyle(0x14201b, 0.72);
      summaryGraphics.fillRoundedRect((layout.width - summaryWidth) / 2, summaryTop, summaryWidth, summaryHeight, 20);
      summaryGraphics.lineStyle(1, 0x7d8f7c, 0.42);
      summaryGraphics.strokeRoundedRect((layout.width - summaryWidth) / 2, summaryTop, summaryWidth, summaryHeight, 20);
    }

    if (summaryVisible) {
      this.add
        .text(layout.centerX, summaryTitleY, "TACTICAL BRIEF", {
          color: "#d6ae72",
          fontFamily: "Trebuchet MS",
          fontSize: `${layout.isMobile ? 15 : 17}px`,
          letterSpacing: 3,
        })
        .setOrigin(0.5, 0);

      this.add
        .text(layout.centerX, hasThemeArt ? summaryBodyY + Math.round(summaryHeight * 0.18) : summaryBodyY, summaryCopy, {
          color: "#ece5d7",
          fontFamily: "Segoe UI",
          fontSize: `${summaryBodyFontSize}px`,
          align: "center",
          wordWrap: { width: summaryWidth - (layout.isMobile ? 48 : 64) },
          lineSpacing: summaryHeight < 140 ? 6 : 8,
        })
        .setOrigin(0.5, 0);
    }

    if (routeStripVisible && summaryVisible) {
      createStatusStrip(this, layout.centerX, routeStripY, Math.min(280, layout.contentWidth - 36), "ROUTE", "Inspect then commit", {
        labelColor: "#90aeb6",
        valueSize: layout.isMobile ? 18 : 22,
      });
    }

    const commandRow = layout.getCommandRow(2, layout.isMobile ? 144 : 196);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Back", () => {
      const nextSession = returnToCampaign(getSession(this));
      this.game.registry.set("session", nextSession);
      this.scene.start("CampaignScene");
    });

    if (battleLocked && !isCompactBriefing) {
      this.add
        .text(layout.centerX, layout.command.top + (layout.isMobile ? 8 : 10), "Stage locked. Clear the prior stage in Campaign first.", {
          color: "#d6ae72",
          fontFamily: "Segoe UI",
          fontSize: `${layout.isMobile ? 13 : 15}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 32 : 120) },
        })
        .setOrigin(0.5, 0);
    }

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, battleLocked ? "Locked" : "Enter Battle", () => {
      if (battleLocked) {
        const nextSession = returnToCampaign(getSession(this));
        this.game.registry.set("session", nextSession);
        this.scene.start("CampaignScene");
        return;
      }

      const nextSession = beginBattleFromSelection(getSession(this));
      this.game.registry.set("session", nextSession);
      if (nextSession.scene === "battle") {
        this.scene.start("BattleScene", { stage: nextSession.activeStage ?? nextSession.selectedStage ?? 1 });
      }
    }, {
      variant: battleLocked ? undefined : "primary",
      fontSize: layout.isMobile ? 18 : 22,
    });
  }
}

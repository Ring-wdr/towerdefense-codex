import Phaser from "phaser";
import { cycleThemeSelection, createGameSession, selectStage } from "../state/game-session.js";
import { createBackdrop, createCommandButton, createStatusStrip, createTitleLockup } from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";
import { getThemeOrder } from "../../game/stages.js";
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

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super("CampaignScene");
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
    createBackdrop(this, layout, { fillTop: 0x12211b, fillBottom: 0x0a120e, accent: 0x7a9b84 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      "CAMPAIGN MAP",
      session.selectedTheme ?? "No Theme",
      {
        kickerColor: "#8fb095",
        kickerSize: layout.isMobile ? 15 : 17,
        titleSize: layout.isMobile ? 34 : 52,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 16, `Stage ${session.selectedStage}`, {
        color: "#e3b879",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 18 : 22}px`,
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0);

    const isCompactLayout = layout.height <= 460 || layout.focus.height < 160;

    if (isCompactLayout) {
      this.add
        .text(
          layout.centerX,
          layout.focus.top + (layout.isMobile ? 68 : 82),
          `${session.selectedTheme ?? "No Theme"} / Stage ${session.selectedStage}.`,
          {
            color: "#d8d1c4",
            fontFamily: "Segoe UI",
            fontSize: `${layout.isMobile ? 14 : 16}px`,
            align: "center",
            wordWrap: { width: layout.contentWidth - (layout.isMobile ? 28 : 120) },
            lineSpacing: 6,
          },
      )
      .setOrigin(0.5, 0);
    } else {
      const sigil = this.add
        .image(layout.centerX, layout.focus.centerY - 8, getThemeSigilKey(session.selectedTheme))
        .setOrigin(0.5);
      sigil.setScale(layout.isMobile ? 0.24 : 0.3);
      sigil.setAlpha(0.95);

      this.add
        .text(
          layout.centerX,
          layout.focus.top + (layout.isMobile ? 176 : 208),
          "Rotate the campaign theater, confirm the current sector, then push forward into the briefing screen.",
          {
            color: "#d8d1c4",
            fontFamily: "Segoe UI",
            fontSize: `${layout.isMobile ? 16 : 20}px`,
            align: "center",
            wordWrap: { width: layout.contentWidth - (layout.isMobile ? 34 : 210) },
            lineSpacing: layout.isMobile ? 6 : 7,
          },
        )
        .setOrigin(0.5, 0);

      const stripY = layout.focus.bottom - (layout.isMobile ? 82 : 88);
      const stripWidth = Math.min(layout.contentWidth / 2 - 12, layout.isMobile ? 148 : 220);
      createStatusStrip(this, layout.centerX - stripWidth / 2 - 8, stripY, stripWidth, "CLEARED", `${session.clearedStages.length} STAGES`, {
        labelColor: "#88a98d",
        valueSize: layout.isMobile ? 20 : 24,
      });
      createStatusStrip(this, layout.centerX + stripWidth / 2 + 8, stripY, stripWidth, "SELECTION", `STAGE ${session.selectedStage}`, {
        labelColor: "#d9af74",
        valueSize: layout.isMobile ? 20 : 24,
      });
    }

    const commandRow = layout.getCommandRow(3, layout.isMobile ? 116 : 176);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Prev", () => {
      const nextSession = cycleThemeSelection(getSession(this), -1);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    });

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Briefing", () => {
      const current = getSession(this);
      const nextSession = selectStage(current, current.selectedStage);
      this.game.registry.set("session", nextSession);
      this.scene.start("ThemeScene");
    }, {
      variant: "primary",
      fontSize: layout.isMobile ? 18 : 22,
    });

    createCommandButton(this, commandRow.positions[2], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Next", () => {
      const nextSession = cycleThemeSelection(getSession(this), 1);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    });
  }
}

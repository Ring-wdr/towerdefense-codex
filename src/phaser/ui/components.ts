import * as Phaser from "phaser";

export const PHASER_TEXT_FONTS = {
  heading: '"Black Ops One", "Arial Black", sans-serif',
  body: '"Barlow Condensed", "Trebuchet MS", sans-serif',
};

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

interface PanelOptions {
  fill?: number;
  alpha?: number;
  stroke?: number;
}

interface ButtonOptions {
  backgroundColor?: number;
  textColor?: string;
  fontSize?: number;
  strokeColor?: number;
  fontStyle?: string;
}

export function createHeadingTextStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    color: "#f5efe1",
    fontFamily: PHASER_TEXT_FONTS.heading,
    stroke: "#0a0d0b",
    strokeThickness: 6,
    shadow: {
      offsetX: 0,
      offsetY: 4,
      color: "rgba(0, 0, 0, 0.45)",
      blur: 8,
      stroke: true,
      fill: true,
    },
    ...overrides,
  };
}

export function createBodyTextStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    color: "#e6dfd2",
    fontFamily: PHASER_TEXT_FONTS.body,
    stroke: "#0d120f",
    strokeThickness: 2,
    lineSpacing: 4,
    shadow: {
      offsetX: 0,
      offsetY: 2,
      color: "rgba(0, 0, 0, 0.35)",
      blur: 4,
      stroke: false,
      fill: true,
    },
    ...overrides,
  };
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PanelOptions = {},
): Phaser.GameObjects.Container {
  const fill = options.fill ?? 0x241d16;
  const alpha = options.alpha ?? 0.94;
  const stroke = options.stroke ?? 0xe4c47a;

  const panel = scene.add.container(x, y);
  const shadow = scene.add.rectangle(8, 10, width, height, 0x000000, 0.18).setOrigin(0);
  const body = scene.add.rectangle(0, 0, width, height, fill, alpha).setOrigin(0);
  const border = scene.add.rectangle(0, 0, width, height).setOrigin(0).setStrokeStyle(2, stroke, 0.72);
  const inset = scene.add
    .rectangle(12, 12, width - 24, height - 24)
    .setOrigin(0)
    .setStrokeStyle(1, 0xffe4b0, 0.12);

  panel.add([shadow, body, border, inset]);
  return panel;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onPress: () => void,
  options: ButtonOptions = {},
): {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
} {
  const backgroundColor = options.backgroundColor ?? 0x31414c;
  const textColor = options.textColor ?? "#f5efe1";
  const fontSize = options.fontSize ?? 26;
  const strokeColor = options.strokeColor ?? 0xe4c47a;

  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(0, 6, width, height, 0x000000, 0.18).setOrigin(0.5);
  const background = scene.add.rectangle(0, 0, width, height, backgroundColor, 0.95).setOrigin(0.5);
  const border = scene.add.rectangle(0, 0, width, height).setOrigin(0.5).setStrokeStyle(2, strokeColor, 0.9);
  const text = scene.add
    .text(0, 0, label, createBodyTextStyle({
      color: textColor,
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: `${fontSize}px`,
      fontStyle: options.fontStyle ?? "700",
      align: "center",
    }))
    .setOrigin(0.5);

  background.setInteractive({ useHandCursor: true });
  background.on("pointerover", () => {
    container.setY(y - 1);
  });
  background.on("pointerout", () => {
    container.setY(y);
  });
  background.on("pointerup", onPress);

  container.add([shadow, background, border, text]);
  return { container, background, border, text };
}

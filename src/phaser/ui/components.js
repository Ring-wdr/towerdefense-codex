function makeText(scene, x, y, value, style) {
  return scene.add.text(x, y, value, style).setOrigin(0.5);
}

export function createBackdrop(scene, layout, options = {}) {
  const fillTop = options.fillTop ?? 0x14231d;
  const fillBottom = options.fillBottom ?? 0x09110d;
  const accent = options.accent ?? 0xd1a45c;
  const graphics = scene.add.graphics();

  graphics.fillGradientStyle(fillTop, fillTop, fillBottom, fillBottom, 1, 1, 1, 1);
  graphics.fillRect(0, 0, layout.width, layout.height);
  graphics.fillStyle(0x000000, 0.14);
  graphics.fillRect(layout.margin, layout.header.bottom + 10, layout.contentWidth, layout.focus.height);
  graphics.lineStyle(2, accent, 0.18);
  graphics.strokeRect(layout.margin, layout.margin, layout.contentWidth, layout.contentHeight);
  graphics.lineStyle(1, accent, 0.28);
  graphics.beginPath();
  graphics.moveTo(layout.margin, layout.command.top - 12);
  graphics.lineTo(layout.width - layout.margin, layout.command.top - 12);
  graphics.strokePath();

  return graphics;
}

export function createTitleLockup(scene, x, top, kicker, title, options = {}) {
  const kickerText = scene.add
    .text(x, top, kicker, {
      color: options.kickerColor ?? "#d0aa6c",
      fontFamily: options.kickerFontFamily ?? "Trebuchet MS",
      fontSize: `${options.kickerSize ?? 18}px`,
      letterSpacing: options.kickerLetterSpacing ?? 6,
    })
    .setOrigin(0.5, 0);

  const titleText = scene.add
    .text(x, kickerText.y + kickerText.height + (options.gap ?? 10), title, {
      color: options.titleColor ?? "#f5efe1",
      fontFamily: options.titleFontFamily ?? "Trebuchet MS",
      fontSize: `${options.titleSize ?? 52}px`,
      fontStyle: options.titleStyle ?? "bold",
      align: "center",
      wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth } : undefined,
    })
    .setOrigin(0.5, 0);

  return { kickerText, titleText };
}

export function createCommandButton(scene, x, y, width, height, label, onPress, options = {}) {
  const container = scene.add.container(x, y);
  const isPrimary = options.variant === "primary";
  const shadow = scene.add.rectangle(0, 7, width, height, 0x000000, 0.28).setOrigin(0.5);
  const background = scene.add
    .rectangle(0, 0, width, height, isPrimary ? 0xb47b3c : 0x1b2a24, 0.96)
    .setOrigin(0.5);
  const border = scene.add
    .rectangle(0, 0, width, height)
    .setOrigin(0.5)
    .setStrokeStyle(2, isPrimary ? 0xf0d3a1 : 0x7f987d, 0.88);
  const labelText = makeText(scene, 0, 0, label, {
    color: isPrimary ? "#16110d" : "#f3efe7",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.fontSize ?? 22}px`,
    fontStyle: "bold",
    align: "center",
  });

  background.setInteractive({ useHandCursor: true });
  background.on("pointerover", () => container.setY(y - 2));
  background.on("pointerout", () => container.setY(y));
  background.on("pointerdown", () => container.setY(y + 1));
  background.on("pointerup", () => {
    container.setY(y - 1);
    onPress();
  });

  container.add([shadow, background, border, labelText]);
  return { container, background, border, labelText };
}

export function createStatusStrip(scene, x, y, width, label, value, options = {}) {
  const container = scene.add.container(x, y);
  const background = scene.add.rectangle(0, 0, width, options.height ?? 72, 0x14201b, 0.74).setOrigin(0.5);
  const border = scene.add.rectangle(0, 0, width, options.height ?? 72).setOrigin(0.5).setStrokeStyle(1, 0x7c8e73, 0.4);
  const labelText = scene.add.text(0, -14, label, {
    color: options.labelColor ?? "#9fb59f",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.labelSize ?? 14}px`,
    letterSpacing: 2,
  }).setOrigin(0.5);
  const valueText = scene.add.text(0, 12, value, {
    color: options.valueColor ?? "#f5efe1",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.valueSize ?? 24}px`,
    fontStyle: "bold",
    align: "center",
    wordWrap: { width: width - 20 },
  }).setOrigin(0.5);

  container.add([background, border, labelText, valueText]);
  return { container, background, border, labelText, valueText };
}

export function createPanel(scene, x, y, width, height, options = {}) {
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

export function createButton(scene, x, y, width, height, label, onPress, options = {}) {
  const backgroundColor = options.backgroundColor ?? 0x31414c;
  const textColor = options.textColor ?? "#f5efe1";
  const fontSize = options.fontSize ?? 24;
  const strokeColor = options.strokeColor ?? 0xe4c47a;

  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(0, 6, width, height, 0x000000, 0.18).setOrigin(0.5);
  const background = scene.add.rectangle(0, 0, width, height, backgroundColor, 0.95).setOrigin(0.5);
  const border = scene.add.rectangle(0, 0, width, height).setOrigin(0.5).setStrokeStyle(2, strokeColor, 0.9);
  const text = scene.add
    .text(0, 0, label, {
      color: textColor,
      fontFamily: "Trebuchet MS",
      fontSize: `${fontSize}px`,
      fontStyle: options.fontStyle ?? "bold",
      align: "center",
    })
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

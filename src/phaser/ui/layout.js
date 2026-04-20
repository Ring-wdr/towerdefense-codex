function getCommandRow(layout, count, preferredWidth = 180) {
  const baseGap = layout.isMobile ? 14 : 20;
  const gap = count > 1 ? Math.min(baseGap, Math.max(0, Math.floor(layout.contentWidth / (count - 1)))) : 0;
  const available = Math.max(0, layout.contentWidth - gap * (count - 1));
  const buttonWidth = Math.max(0, Math.min(preferredWidth, Math.floor(available / Math.max(1, count))));
  const rowWidth = buttonWidth * count + gap * (count - 1);
  const left = Math.max(0, (layout.width - rowWidth) / 2);
  const buttonHeight = Math.max(0, Math.min(layout.isMobile ? 58 : 64, layout.command.height));

  return {
    gap,
    left,
    right: left + rowWidth,
    buttonWidth,
    buttonHeight,
    positions: Array.from({ length: count }, (_, index) => {
      return left + buttonWidth / 2 + index * (buttonWidth + gap);
    }),
  };
}

export function getBattleViewportLayout(scene, boardWidth, boardHeight, options = {}) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const horizontalPadding = options.horizontalPadding ?? Math.max(12, Math.round(width * 0.06));
  const topPadding = options.topPadding ?? Math.max(72, Math.round(height * 0.13));
  const baseBottomPadding = options.bottomPadding ?? Math.max(20, Math.round(height * 0.04));
  const dockBreakpoint = options.dockBreakpoint ?? 0;
  const forceBottomDock = options.forceBottomDock ?? false;
  const compactDockBreakpoint = options.compactDockBreakpoint ?? 680;
  const usesBottomDock = forceBottomDock || (dockBreakpoint > 0 && width <= dockBreakpoint);
  const dockBottomPadding = width <= compactDockBreakpoint
    ? (options.compactDockBottomPadding ?? options.dockBottomPadding ?? 232)
    : (options.dockBottomPadding ?? 220);
  const bottomPadding = usesBottomDock ? Math.max(baseBottomPadding, dockBottomPadding) : baseBottomPadding;
  const maxScale = options.maxScale ?? 1;
  const minScale = options.minScale ?? 0.35;
  const availableWidth = Math.max(0, width - horizontalPadding * 2);
  const availableHeight = Math.max(0, height - topPadding - bottomPadding);
  const widthScale = boardWidth > 0 ? availableWidth / boardWidth : 1;
  const heightScale = boardHeight > 0 ? availableHeight / boardHeight : 1;
  const scale = Math.max(minScale, Math.min(maxScale, widthScale, heightScale));
  const scaledBoardWidth = Math.round(boardWidth * scale);
  const scaledBoardHeight = Math.round(boardHeight * scale);
  const boardLeft = Math.max(0, Math.round((width - scaledBoardWidth) / 2));
  const boardTop = topPadding;

  return {
    width,
    height,
    scale,
    boardLeft,
    boardTop,
    boardWidth: scaledBoardWidth,
    boardHeight: scaledBoardHeight,
    boardRight: boardLeft + scaledBoardWidth,
    boardBottom: boardTop + scaledBoardHeight,
    horizontalPadding,
    topPadding,
    bottomPadding,
    usesBottomDock,
  };
}

export function getSceneLayout(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const desiredMargin = Math.max(18, Math.round(Math.min(width, height) * 0.04));
  const margin = Math.max(0, Math.min(desiredMargin, Math.floor(Math.min(width, height) / 2)));
  const contentWidth = Math.max(0, width - margin * 2);
  const contentHeight = Math.max(0, height - margin * 2);
  const isMobile = width <= 680;
  const isShort = height <= 760;
  const desiredHeaderHeight = isMobile ? 116 : 132;
  const desiredCommandHeight = isShort ? 96 : isMobile ? 110 : 126;
  const desiredFocusHeight = 180;
  const availableBodyHeight = contentHeight;
  const desiredTotalHeight = desiredHeaderHeight + desiredFocusHeight + desiredCommandHeight;
  const scale = desiredTotalHeight > 0 ? Math.min(1, availableBodyHeight / desiredTotalHeight) : 0;
  let headerHeight = Math.floor(desiredHeaderHeight * scale);
  let focusHeight = Math.floor(desiredFocusHeight * scale);
  let commandHeight = Math.floor(desiredCommandHeight * scale);
  const remainder = availableBodyHeight - headerHeight - focusHeight - commandHeight;

  if (remainder > 0) {
    focusHeight += remainder;
  }

  const focusTop = margin + headerHeight;
  const focusBottom = focusTop + focusHeight;
  const commandTop = height - margin - commandHeight;

  return {
    width,
    height,
    margin,
    contentWidth,
    contentHeight,
    centerX: width / 2,
    centerY: height / 2,
    isMobile,
    isShort,
    header: {
      top: margin,
      bottom: margin + headerHeight,
      height: headerHeight,
    },
    focus: {
      top: focusTop,
      bottom: focusBottom,
      height: focusHeight,
      centerY: focusTop + focusHeight / 2,
    },
    command: {
      top: commandTop,
      bottom: height - margin,
      height: commandHeight,
      centerY: commandTop + commandHeight / 2,
    },
    getCommandRow(count, preferredWidth = 180) {
      return getCommandRow(this, count, preferredWidth);
    },
  };
}

export function getViewportFrame(scene) {
  const layout = getSceneLayout(scene);

  return {
    ...layout,
    panelX: layout.margin,
    panelY: layout.margin,
    panelWidth: layout.contentWidth,
    panelHeight: layout.contentHeight,
    footerY: layout.command.centerY,
  };
}

export function getActionLayout(frame, count, preferredWidth = 180) {
  const layout = typeof frame?.getCommandRow === "function" ? frame : getViewportFrame(frame);
  return getCommandRow(layout, count, preferredWidth);
}

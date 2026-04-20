const DESKTOP_PATTERNS = [
  [
    { x: 0.16, y: 0.3, labelDx: 18, labelDy: 54, align: "left" },
    { x: 0.72, y: 0.2, labelDx: -18, labelDy: 52, align: "right" },
    { x: 0.42, y: 0.72, labelDx: 0, labelDy: 58, align: "center" },
  ],
  [
    { x: 0.22, y: 0.2, labelDx: 14, labelDy: 52, align: "left" },
    { x: 0.68, y: 0.48, labelDx: -16, labelDy: 54, align: "right" },
    { x: 0.26, y: 0.78, labelDx: 10, labelDy: 54, align: "left" },
  ],
  [
    { x: 0.18, y: 0.58, labelDx: 14, labelDy: 50, align: "left" },
    { x: 0.54, y: 0.16, labelDx: 0, labelDy: 56, align: "center" },
    { x: 0.78, y: 0.66, labelDx: -16, labelDy: 52, align: "right" },
  ],
];

const MOBILE_PATTERNS = [
  [
    { x: 0.18, y: 0.2, labelDx: 12, labelDy: 40, align: "left" },
    { x: 0.72, y: 0.36, labelDx: -14, labelDy: 40, align: "right" },
    { x: 0.36, y: 0.62, labelDx: 0, labelDy: 42, align: "center" },
  ],
  [
    { x: 0.22, y: 0.18, labelDx: 10, labelDy: 40, align: "left" },
    { x: 0.66, y: 0.44, labelDx: -12, labelDy: 42, align: "right" },
    { x: 0.24, y: 0.66, labelDx: 10, labelDy: 42, align: "left" },
  ],
  [
    { x: 0.16, y: 0.48, labelDx: 12, labelDy: 40, align: "left" },
    { x: 0.5, y: 0.18, labelDx: 0, labelDy: 42, align: "center" },
    { x: 0.8, y: 0.58, labelDx: -12, labelDy: 40, align: "right" },
  ],
];

const LINK_BEND_SIGNS = [
  [1, -1],
  [-1, 1],
  [1, 1],
];

const EXIT_VECTORS = [
  { x: 1, y: -0.18 },
  { x: 1, y: 0.06 },
  { x: 0.92, y: -0.28 },
];

export function getThemeClusterLayout({
  width,
  height,
  stageNumbers,
  selectedStage,
  clearedStages = [],
  unlockedStages = stageNumbers,
  themeIndex = 0,
  themeCount = 1,
  isMobile = false,
}) {
  const patternSet = isMobile ? MOBILE_PATTERNS : DESKTOP_PATTERNS;
  const pattern = patternSet[Math.max(0, themeIndex) % patternSet.length];
  const bendSigns = LINK_BEND_SIGNS[Math.max(0, themeIndex) % LINK_BEND_SIGNS.length];
  const unlockedSet = new Set(unlockedStages);
  const clearedSet = new Set(clearedStages);

  const nodes = stageNumbers.map((stageNumber, index) => {
    const anchor = pattern[index] ?? pattern[pattern.length - 1];
    const state = getNodeState(stageNumber, selectedStage, unlockedSet, clearedSet);

    return {
      stageNumber,
      order: index + 1,
      state,
      x: Math.round(width * anchor.x),
      y: Math.round(height * anchor.y),
      radius: getNodeRadius(state, isMobile),
      labelDx: anchor.labelDx,
      labelDy: anchor.labelDy,
      labelAlign: anchor.align,
      isMobile,
    };
  });

  const roads = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    roads.push(createLinkRoad(nodes[index], nodes[index + 1], {
      tone: nodes[index + 1].stageNumber <= selectedStage ? "active" : "future",
      bendSign: bendSigns[index % bendSigns.length] ?? 1,
    }));
  }

  if (nodes.length > 0) {
    roads.push(createExitRoad(nodes[nodes.length - 1], {
      width,
      height,
      themeIndex,
      themeCount,
      tone: selectedStage === nodes[nodes.length - 1].stageNumber ? "active" : "future",
    }));
  }

  return { width, height, nodes, roads };
}

export function getRoadCurvePoints(road, pointsTotal = 24) {
  const divisions = Math.max(2, pointsTotal);
  const points = [];

  for (let index = 0; index <= divisions; index += 1) {
    const t = index / divisions;
    points.push({
      x: sampleCubicBezier(road.start.x, road.controlA.x, road.controlB.x, road.end.x, t),
      y: sampleCubicBezier(road.start.y, road.controlA.y, road.controlB.y, road.end.y, t),
    });
  }

  return points;
}

function getNodeState(stageNumber, selectedStage, unlockedSet, clearedSet) {
  if (stageNumber === selectedStage) {
    return "selected";
  }

  if (!unlockedSet.has(stageNumber)) {
    return "locked";
  }

  if (clearedSet.has(stageNumber)) {
    return "cleared";
  }

  return "available";
}

function getNodeRadius(state, isMobile) {
  if (state === "selected") {
    return isMobile ? 24 : 30;
  }

  if (state === "locked") {
    return isMobile ? 16 : 20;
  }

  return isMobile ? 18 : 22;
}

function createLinkRoad(startNode, endNode, options) {
  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const curve = Math.max(32, Math.min(94, distance * 0.24)) * (options.bendSign ?? 1);

  return {
    kind: "link",
    fromStage: startNode.stageNumber,
    toStage: endNode.stageNumber,
    tone: options.tone,
    start: { x: startNode.x, y: startNode.y },
    end: { x: endNode.x, y: endNode.y },
    controlA: {
      x: startNode.x + dx * 0.28 + normalX * curve,
      y: startNode.y + dy * 0.28 + normalY * curve,
    },
    controlB: {
      x: startNode.x + dx * 0.72 + normalX * curve,
      y: startNode.y + dy * 0.72 + normalY * curve,
    },
  };
}

function createExitRoad(startNode, options) {
  const vector = EXIT_VECTORS[Math.max(0, options.themeIndex) % EXIT_VECTORS.length];
  const isFinalTheme = options.themeIndex >= Math.max(0, options.themeCount - 1);
  const exitY = isFinalTheme
    ? startNode.y - options.height * 0.18
    : startNode.y + options.height * vector.y;
  const end = {
    x: options.width + (isFinalTheme ? 72 : 112),
    y: exitY,
  };
  const directionX = end.x - startNode.x;
  const directionY = end.y - startNode.y;
  const distance = Math.hypot(directionX, directionY) || 1;
  const normalX = -directionY / distance;
  const normalY = directionX / distance;
  const lift = isFinalTheme ? -1 : 1;
  const curve = Math.max(38, Math.min(110, distance * 0.2));

  return {
    kind: "exit",
    fromStage: startNode.stageNumber,
    toStage: null,
    tone: options.tone,
    start: { x: startNode.x, y: startNode.y },
    end,
    controlA: {
      x: startNode.x + directionX * 0.24 + normalX * curve * 0.7 * lift,
      y: startNode.y + directionY * 0.24 + normalY * curve * 0.7 * lift,
    },
    controlB: {
      x: startNode.x + directionX * 0.76 + normalX * curve * 0.28 * lift,
      y: startNode.y + directionY * 0.76 + normalY * curve * 0.28 * lift,
    },
  };
}

function sampleCubicBezier(p0, p1, p2, p3, t) {
  const inverse = 1 - t;
  return (
    inverse ** 3 * p0
    + 3 * inverse ** 2 * t * p1
    + 3 * inverse * t ** 2 * p2
    + t ** 3 * p3
  );
}

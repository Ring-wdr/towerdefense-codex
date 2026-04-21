export const WAVES_PER_STAGE = 5;
const CELL_SIZE = 60;

const NORMAL_WAVE_BASES = [
  { count: 8, health: 34, reward: 10, speed: 0.16, interval: 12 },
  { count: 10, health: 46, reward: 12, speed: 0.18, interval: 10 },
  { count: 12, health: 60, reward: 14, speed: 0.2, interval: 9 },
  { count: 14, health: 76, reward: 16, speed: 0.22, interval: 8 },
];

const WAVE_PROFILES = {
  "line-pressure": [
    ["grunt", "grunt", "runner"],
    ["grunt", "runner", "grunt", "runner"],
    ["runner", "grunt", "runner", "grunt"],
    ["runner", "grunt", "runner", "runner"],
  ],
  "double-corner": [
    ["grunt", "grunt", "runner"],
    ["grunt", "shellback", "grunt", "runner"],
    ["swarmling", "grunt", "shellback", "swarmling"],
    ["shellback", "swarmling", "runner", "grunt"],
  ],
  "center-cross": [
    ["grunt", "runner", "grunt", "runner"],
    ["grunt", "shellback", "runner", "grunt"],
    ["wisp", "grunt", "shellback", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
  ],
  "outer-ring": [
    ["grunt", "runner", "grunt", "runner"],
    ["grunt", "runner", "shellback", "grunt"],
    ["runner", "wisp", "grunt", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
  ],
  "compress-expand": [
    ["grunt", "grunt", "swarmling", "grunt"],
    ["swarmling", "grunt", "shellback", "swarmling"],
    ["swarmling", "shellback", "runner", "grunt"],
    ["wisp", "shellback", "swarmling", "runner"],
  ],
  "exit-pressure": [
    ["grunt", "runner", "grunt", "runner"],
    ["runner", "grunt", "runner", "shellback"],
    ["runner", "wisp", "grunt", "runner"],
    ["runner", "wisp", "runner", "shellback"],
  ],
  "late-bridge": [
    ["grunt", "runner", "grunt", "shellback"],
    ["swarmling", "grunt", "runner", "shellback"],
    ["wisp", "runner", "shellback", "grunt"],
    ["wisp", "runner", "shellback", "swarmling"],
  ],
  "late-crossfire": [
    ["grunt", "runner", "shellback", "grunt"],
    ["wisp", "grunt", "runner", "shellback"],
    ["wisp", "swarmling", "runner", "shellback"],
    ["wisp", "runner", "shellback", "swarmling"],
  ],
  "last-stand": [
    ["runner", "grunt", "shellback", "runner"],
    ["wisp", "runner", "shellback", "grunt"],
    ["wisp", "swarmling", "runner", "shellback"],
    ["wisp", "runner", "shellback", "runner"],
  ],
};

export const STAGES = [
  {
    number: 1,
    id: "meadow-line",
    name: "초원 전선",
    theme: "기초 방어",
    summary: "긴 직선을 먼저 장악해 초반 화력을 안정시키는 전선이다.",
    waveProfile: "line-pressure",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 1 },
      { x: 6, y: 1 },
      { x: 6, y: 5 },
      { x: 9, y: 5 },
      { x: 9, y: 2 },
      { x: 11, y: 2 },
    ],
  },
  {
    number: 2,
    id: "orchard-turn",
    name: "과수원 굽이",
    theme: "기초 방어",
    summary: "두 번 꺾이는 코너를 묶어 지속 화력을 누적시키는 구간이다.",
    waveProfile: "double-corner",
    pathPoints: [
      { x: 0, y: 4 },
      { x: 3, y: 4 },
      { x: 3, y: 1 },
      { x: 7, y: 1 },
      { x: 7, y: 5 },
      { x: 11, y: 5 },
    ],
  },
  {
    number: 3,
    id: "windmill-cross",
    name: "풍차 교차로",
    theme: "기초 방어",
    summary: "중앙 교차 구역을 선점해 다방향 사선을 확보하는 전장이다.",
    waveProfile: "center-cross",
    pathPoints: [
      { x: 0, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 9, y: 6 },
      { x: 9, y: 1 },
      { x: 11, y: 1 },
    ],
  },
  {
    number: 4,
    id: "ridge-detour",
    name: "능선 우회로",
    theme: "압박 대응",
    summary: "강한 자리가 분산돼 있어 구간별 전담 배치가 필요한 전선이다.",
    waveProfile: "outer-ring",
    pathPoints: [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 2 },
      { x: 10, y: 2 },
      { x: 10, y: 5 },
      { x: 11, y: 5 },
    ],
  },
  {
    number: 5,
    id: "quarry-funnel",
    name: "채석장 병목",
    theme: "압박 대응",
    summary: "초반 병목과 후반 확장 구간이 갈려 운영 전환을 요구한다.",
    waveProfile: "compress-expand",
    pathPoints: [
      { x: 0, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 9, y: 3 },
      { x: 11, y: 3 },
    ],
  },
  {
    number: 6,
    id: "gate-lastbend",
    name: "성문 마지막 굽이",
    theme: "압박 대응",
    summary: "출구 직전 보강이 늦으면 기동 적이 그대로 빠져나가는 구간이다.",
    waveProfile: "exit-pressure",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 1 },
      { x: 8, y: 1 },
      { x: 8, y: 4 },
      { x: 10, y: 4 },
      { x: 10, y: 6 },
      { x: 11, y: 6 },
    ],
  },
  {
    number: 7,
    id: "canal-weave",
    name: "수로 엇갈림",
    theme: "후반 운용",
    summary: "직선 화력과 코너 제압을 함께 굴려야 하는 후반 전선이다.",
    waveProfile: "late-bridge",
    pathPoints: [
      { x: 0, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 6 },
      { x: 1, y: 6 },
      { x: 1, y: 4 },
      { x: 7, y: 4 },
      { x: 7, y: 1 },
      { x: 11, y: 1 },
    ],
  },
  {
    number: 8,
    id: "citadel-loop",
    name: "성채 회랑",
    theme: "후반 운용",
    summary: "장거리 엄호와 압축 화력을 동시에 유지해야 버티는 회랑이다.",
    waveProfile: "late-crossfire",
    pathPoints: [
      { x: 0, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 3 },
      { x: 11, y: 3 },
    ],
  },
  {
    number: 9,
    id: "last-stand",
    name: "최후 방어선",
    theme: "후반 운용",
    summary: "누적된 약점을 순차적으로 시험하는 최종 방어 구간이다.",
    waveProfile: "last-stand",
    pathPoints: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 5 },
      { x: 11, y: 5 },
    ],
  },
];

const GEOMETRY_CACHE = new Map();

export function getStageCount() {
  return STAGES.length;
}

export function getStageDefinition(stageNumber) {
  return STAGES[clamp(stageNumber, 1, STAGES.length) - 1];
}

export function getStageWaveDefinition(stageNumber, waveNumber) {
  if (waveNumber === WAVES_PER_STAGE) {
    const stageTier = stageNumber - 1;
    return {
      boss: true,
      count: 1,
      health: 280 + stageTier * 80,
      interval: 999,
      reward: 80 + stageTier * 15,
      speed: 0.12 + stageTier * 0.01,
      spawnPlan: ["boss"],
      speciesPool: ["boss"],
    };
  }

  const stage = getStageDefinition(stageNumber);
  const base = NORMAL_WAVE_BASES[waveNumber - 1];
  const cycle = WAVE_PROFILES[stage.waveProfile][waveNumber - 1];
  const stageTier = stage.number - 1;
  const countBonus = Math.floor(stageTier / 2) * 2;
  const spawnPlan = Array.from({ length: base.count + countBonus }, (_, index) => cycle[index % cycle.length]);

  return {
    boss: false,
    count: spawnPlan.length,
    health: base.health + stageTier * 12,
    interval: base.interval,
    reward: base.reward + stageTier * 2,
    speed: base.speed + stageTier * 0.01,
    spawnPlan,
    speciesPool: Array.from(new Set(spawnPlan)),
  };
}

export function getStagePathCells(stageNumber) {
  return getStageGeometry(stageNumber).cells;
}

export function getStagePathLength(stageNumber) {
  return getStageGeometry(stageNumber).totalLength;
}

export function getStagePointAlongPath(stageNumber, progress) {
  const { segments, points } = getStageGeometry(stageNumber);
  if (progress <= 0) {
    return getCellCenter(points[0]);
  }

  for (const segment of segments) {
    if (progress <= segment.startProgress + segment.length) {
      const localProgress = (progress - segment.startProgress) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * localProgress,
        y: segment.start.y + (segment.end.y - segment.start.y) * localProgress,
      };
    }
  }

  return getCellCenter(points[points.length - 1]);
}

export function isStageRoadCell(stageNumber, x, y) {
  return getStageGeometry(stageNumber).cellSet.has(`${x},${y}`);
}

export function getThemeOrder() {
  return Array.from(new Set(STAGES.map((stage) => stage.theme)));
}

export function getThemeStageNumbers(theme) {
  return STAGES.filter((stage) => stage.theme === theme).map((stage) => stage.number);
}

function getStageGeometry(stageNumber) {
  const stage = getStageDefinition(stageNumber);
  if (!GEOMETRY_CACHE.has(stage.number)) {
    const cellSet = expandPathToCells(stage.pathPoints);
    GEOMETRY_CACHE.set(stage.number, {
      cellSet,
      cells: Array.from(cellSet, (entry) => {
        const [x, y] = entry.split(",").map(Number);
        return { x, y };
      }),
      points: stage.pathPoints,
      ...buildPathSegments(stage.pathPoints),
    });
  }
  return GEOMETRY_CACHE.get(stage.number);
}

function buildPathSegments(points) {
  const segments = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = getCellCenter(points[index]);
    const end = getCellCenter(points[index + 1]);
    const length = Math.hypot(end.x - start.x, end.y - start.y) / CELL_SIZE;

    segments.push({
      start,
      end,
      startProgress: totalLength,
      length,
    });
    totalLength += length;
  }

  return { segments, totalLength };
}

function expandPathToCells(points) {
  const cells = new Set();

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const stepX = Math.sign(end.x - start.x);
    const stepY = Math.sign(end.y - start.y);
    let x = start.x;
    let y = start.y;

    cells.add(`${x},${y}`);
    while (x !== end.x || y !== end.y) {
      x += stepX;
      y += stepY;
      cells.add(`${x},${y}`);
    }
  }

  return cells;
}

function getCellCenter(cell) {
  return {
    x: cell.x * CELL_SIZE + CELL_SIZE / 2,
    y: cell.y * CELL_SIZE + CELL_SIZE / 2,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

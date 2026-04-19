function formatPlayedAt(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${
    timeZone === "Asia/Seoul" ? "KST" : timeZone
  }`;
}

export function getBuildLabel({ envBuild, packageVersion }) {
  return envBuild || packageVersion || "dev";
}

export function createScoreSnapshot(gameState, options = {}) {
  const now = options.now ? options.now() : new Date();
  const timeZone = options.timeZone || "Asia/Seoul";
  return {
    score: gameState.score,
    wave: gameState.wave,
    lives: gameState.lives,
    playedAt: formatPlayedAt(now, timeZone),
    build: options.buildLabel || "dev",
  };
}

export function buildScoreCommentBody(snapshot) {
  return [
    `Score: ${snapshot.score}`,
    `Wave: ${snapshot.wave}`,
    `Lives: ${snapshot.lives}`,
    `Played at: ${snapshot.playedAt}`,
    `Build: ${snapshot.build}`,
  ].join("\n");
}

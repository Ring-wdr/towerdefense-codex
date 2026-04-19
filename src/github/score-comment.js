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

export async function postScoreComment({
  accessToken,
  body,
  issueNumber,
  repoName,
  repoOwner,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(
    `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ body }),
    },
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "GitHub comment submission failed");
  }
  return { htmlUrl: payload.html_url || "" };
}

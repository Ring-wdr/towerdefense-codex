const REQUIRED_KEYS = [
  "VITE_GITHUB_APP_CLIENT_ID",
  "VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER",
  "VITE_GITHUB_REPO_OWNER",
  "VITE_GITHUB_REPO_NAME",
  "VITE_GITHUB_REDIRECT_URI",
];

export function getGitHubScoreConfig({ env = {}, fallbackLocation = "" } = {}) {
  return {
    clientId: env.VITE_GITHUB_APP_CLIENT_ID || "",
    issueNumber: Number(env.VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER || 0),
    redirectUri: env.VITE_GITHUB_REDIRECT_URI || fallbackLocation,
    repoName: env.VITE_GITHUB_REPO_NAME || "",
    repoOwner: env.VITE_GITHUB_REPO_OWNER || "",
  };
}

export function validateGitHubScoreConfig(config) {
  const source = {
    VITE_GITHUB_APP_CLIENT_ID: config.clientId,
    VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER: config.issueNumber,
    VITE_GITHUB_REPO_OWNER: config.repoOwner,
    VITE_GITHUB_REPO_NAME: config.repoName,
    VITE_GITHUB_REDIRECT_URI: config.redirectUri,
  };
  return REQUIRED_KEYS.filter((key) => !source[key]);
}

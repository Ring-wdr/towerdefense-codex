import test from "node:test";
import assert from "node:assert/strict";

import {
  buildScoreCommentBody,
  createScoreSnapshot,
  getBuildLabel,
} from "../src/github/score-comment.js";
import {
  buildGitHubAuthorizeUrl,
  clearPendingAuth,
  createPkcePair,
  exchangeGitHubCodeForToken,
  parseGitHubAuthResult,
  persistPendingAuth,
  readPendingAuth,
} from "../src/github/auth.js";
import {
  getGitHubScoreConfig,
  validateGitHubScoreConfig,
} from "../src/github/config.js";
import {
  createSubmissionState,
  createScoreSubmissionKey,
  markSubmissionFailed,
  markSubmissionStarted,
  markSubmissionSucceeded,
} from "../src/github/submission-state.js";
import { postScoreComment } from "../src/github/score-comment.js";

test("score snapshot captures game-over values", () => {
  const snapshot = createScoreSnapshot(
    {
      score: 1240,
      wave: 9,
      lives: 0,
    },
    {
      now: () => new Date("2026-04-19T14:10:00.000Z"),
      timeZone: "Asia/Seoul",
      buildLabel: "1.0.0",
    },
  );

  assert.equal(snapshot.score, 1240);
  assert.equal(snapshot.wave, 9);
  assert.equal(snapshot.lives, 0);
  assert.match(snapshot.playedAt, /2026-04-19 23:10/);
  assert.equal(snapshot.build, "1.0.0");
});

test("score comment body is readable and stable", () => {
  const body = buildScoreCommentBody({
    score: 1240,
    wave: 9,
    lives: 0,
    playedAt: "2026-04-19 23:10 KST",
    build: "1.0.0",
  });

  assert.equal(
    body,
    ["Score: 1240", "Wave: 9", "Lives: 0", "Played at: 2026-04-19 23:10 KST", "Build: 1.0.0"].join(
      "\n",
    ),
  );
});

test("submission state blocks duplicate success for the same snapshot", () => {
  const key = createScoreSubmissionKey({
    score: 1240,
    wave: 9,
    lives: 0,
    playedAt: "2026-04-19 23:10 KST",
  });
  let state = createSubmissionState();
  state = markSubmissionStarted(state, key);
  state = markSubmissionSucceeded(state, key);

  assert.equal(state.status, "success");
  assert.equal(state.lastSubmittedKey, key);
});

test("submission state keeps retry available after failure", () => {
  const key = createScoreSubmissionKey({
    score: 1240,
    wave: 9,
    lives: 0,
    playedAt: "2026-04-19 23:10 KST",
  });
  let state = createSubmissionState();
  state = markSubmissionStarted(state, key);
  state = markSubmissionFailed(state, key, "GitHub rejected comment");

  assert.equal(state.status, "error");
  assert.equal(state.errorMessage, "GitHub rejected comment");
});

test("build label falls back to package version", () => {
  assert.equal(getBuildLabel({ envBuild: "", packageVersion: "1.0.0" }), "1.0.0");
});

test("github score config reads Vite env and reports missing values", () => {
  const config = getGitHubScoreConfig({
    env: {
      VITE_GITHUB_APP_CLIENT_ID: "",
      VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER: "12",
      VITE_GITHUB_REPO_OWNER: "ring-wdr",
      VITE_GITHUB_REPO_NAME: "towerdefense-codex",
      VITE_GITHUB_REDIRECT_URI: "https://ring-wdr.github.io/towerdefense-codex/",
    },
  });

  assert.deepEqual(validateGitHubScoreConfig(config), ["VITE_GITHUB_APP_CLIENT_ID"]);
});

test("authorize URL contains PKCE fields", async () => {
  const pair = await createPkcePair();
  const url = new URL(
    buildGitHubAuthorizeUrl({
      clientId: "client123",
      redirectUri: "https://ring-wdr.github.io/towerdefense-codex/",
      state: "state-1",
      codeChallenge: pair.codeChallenge,
    }),
  );

  assert.equal(url.origin, "https://github.com");
  assert.equal(url.searchParams.get("client_id"), "client123");
  assert.equal(url.searchParams.get("redirect_uri"), "https://ring-wdr.github.io/towerdefense-codex/");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
});

test("callback parser returns denied status and code status", () => {
  assert.deepEqual(parseGitHubAuthResult(new URL("https://example.com/?error=access_denied")), {
    code: "",
    error: "access_denied",
    state: "",
    status: "error",
  });

  assert.deepEqual(parseGitHubAuthResult(new URL("https://example.com/?code=abc123&state=state-1")), {
    code: "abc123",
    error: "",
    state: "state-1",
    status: "code",
  });
});

test("pending auth round-trips through session storage", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  persistPendingAuth(storage, {
    codeVerifier: "verifier",
    scoreSnapshot: { score: 1 },
    state: "state-1",
  });
  assert.deepEqual(readPendingAuth(storage), {
    codeVerifier: "verifier",
    scoreSnapshot: { score: 1 },
    state: "state-1",
  });
  clearPendingAuth(storage);
  assert.equal(readPendingAuth(storage), null);
});

test("token exchange posts code verifier to GitHub", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return { ok: true, json: async () => ({ access_token: "token-123" }) };
  };

  const token = await exchangeGitHubCodeForToken({
    clientId: "client123",
    code: "code123",
    codeVerifier: "verifier123",
    fetchImpl,
  });

  assert.equal(token, "token-123");
  assert.match(request.url, /github\.com\/login\/oauth\/access_token/);
  assert.match(String(request.init.body), /code_verifier=verifier123/);
});

test("score comment submission posts markdown body to issue comments api", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return {
      ok: true,
      json: async () => ({ html_url: "https://github.com/example/repo/issues/12#issuecomment-1" }),
    };
  };

  const response = await postScoreComment({
    accessToken: "token-123",
    body: "Score: 1240",
    issueNumber: 12,
    repoName: "towerdefense-codex",
    repoOwner: "ring-wdr",
    fetchImpl,
  });

  assert.equal(response.htmlUrl, "https://github.com/example/repo/issues/12#issuecomment-1");
  assert.match(request.url, /repos\/ring-wdr\/towerdefense-codex\/issues\/12\/comments/);
  assert.match(request.init.headers.Authorization, /^Bearer token-123$/);
});

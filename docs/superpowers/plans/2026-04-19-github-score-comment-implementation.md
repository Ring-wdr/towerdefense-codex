# GitHub Score Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a serverless GitHub App PKCE flow that lets players submit their game-over score as a comment on a fixed leaderboard issue.

**Architecture:** Keep core game logic unchanged and layer the feature into the browser UI. Add focused modules for score snapshot formatting, GitHub PKCE auth, and GitHub comment submission, then wire them into the game-over overlay in `src/main.js` with a small local submission state machine.

**Tech Stack:** Vite, vanilla JavaScript, Node.js test runner, GitHub REST API, GitHub App PKCE auth flow

---

## File Map

- Create: `D:\tower-defense\src\github\config.js`
- Create: `D:\tower-defense\src\github\score-comment.js`
- Create: `D:\tower-defense\src\github\auth.js`
- Create: `D:\tower-defense\src\github\submission-state.js`
- Modify: `D:\tower-defense\src\main.js`
- Modify: `D:\tower-defense\index.html`
- Modify: `D:\tower-defense\styles.css`
- Create: `D:\tower-defense\test\github-score-comment.test.js`
- Modify: `D:\tower-defense\README.md`

### Task 1: Add score snapshot formatting and submission state primitives

**Files:**
- Create: `D:\tower-defense\src\github\score-comment.js`
- Create: `D:\tower-defense\src\github\submission-state.js`
- Create: `D:\tower-defense\test\github-score-comment.test.js`

- [ ] **Step 1: Write the failing tests for comment formatting and duplicate submission locking**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildScoreCommentBody,
  createScoreSnapshot,
  getBuildLabel,
} from "../src/github/score-comment.js";
import {
  createSubmissionState,
  createScoreSubmissionKey,
  markSubmissionFailed,
  markSubmissionStarted,
  markSubmissionSucceeded,
} from "../src/github/submission-state.js";

test("score snapshot captures game-over values", () => {
  const snapshot = createScoreSnapshot({
    score: 1240,
    wave: 9,
    lives: 0,
  }, {
    now: () => new Date("2026-04-19T14:10:00.000Z"),
    timeZone: "Asia/Seoul",
    buildLabel: "1.0.0",
  });

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

  assert.equal(body, [
    "Score: 1240",
    "Wave: 9",
    "Lives: 0",
    "Played at: 2026-04-19 23:10 KST",
    "Build: 1.0.0",
  ].join("\\n"));
});

test("submission state blocks duplicate success for the same snapshot", () => {
  const key = createScoreSubmissionKey({ score: 1240, wave: 9, lives: 0, playedAt: "2026-04-19 23:10 KST" });
  let state = createSubmissionState();
  state = markSubmissionStarted(state, key);
  state = markSubmissionSucceeded(state, key);

  assert.equal(state.status, "success");
  assert.equal(state.lastSubmittedKey, key);
});

test("submission state keeps retry available after failure", () => {
  const key = createScoreSubmissionKey({ score: 1240, wave: 9, lives: 0, playedAt: "2026-04-19 23:10 KST" });
  let state = createSubmissionState();
  state = markSubmissionStarted(state, key);
  state = markSubmissionFailed(state, key, "GitHub rejected comment");

  assert.equal(state.status, "error");
  assert.equal(state.errorMessage, "GitHub rejected comment");
});

test("build label falls back to package version", () => {
  assert.equal(getBuildLabel({ envBuild: "", packageVersion: "1.0.0" }), "1.0.0");
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `node --test test/github-score-comment.test.js`  
Expected: FAIL with module-not-found errors for the new `src/github/*.js` files.

- [ ] **Step 3: Write the minimal formatting and state modules**

```js
// src/github/score-comment.js
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
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${timeZone === "Asia/Seoul" ? "KST" : timeZone}`;
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
  ].join("\\n");
}
```

```js
// src/github/submission-state.js
export function createSubmissionState() {
  return {
    activeKey: null,
    errorMessage: "",
    lastSubmittedKey: null,
    status: "idle",
  };
}

export function createScoreSubmissionKey(snapshot) {
  return `${snapshot.score}:${snapshot.wave}:${snapshot.lives}:${snapshot.playedAt}`;
}

export function markSubmissionStarted(state, key) {
  return {
    ...state,
    activeKey: key,
    errorMessage: "",
    status: "submitting",
  };
}

export function markSubmissionSucceeded(state, key) {
  return {
    ...state,
    activeKey: null,
    errorMessage: "",
    lastSubmittedKey: key,
    status: "success",
  };
}

export function markSubmissionFailed(state, key, message) {
  return {
    ...state,
    activeKey: state.activeKey === key ? null : state.activeKey,
    errorMessage: message,
    status: "error",
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/github-score-comment.test.js`  
Expected: PASS with 5 passing tests.

- [ ] **Step 5: Commit the first slice**

```bash
git add test/github-score-comment.test.js src/github/score-comment.js src/github/submission-state.js
git commit -m "feat: add score comment formatting primitives"
```

### Task 2: Add GitHub App config and PKCE auth helpers

**Files:**
- Create: `D:\tower-defense\src\github\config.js`
- Create: `D:\tower-defense\src\github\auth.js`
- Modify: `D:\tower-defense\test\github-score-comment.test.js`

- [ ] **Step 1: Extend tests to cover auth URL generation and callback parsing**

```js
import {
  buildGitHubAuthorizeUrl,
  createPkcePair,
  parseGitHubAuthResult,
} from "../src/github/auth.js";
import {
  getGitHubScoreConfig,
  validateGitHubScoreConfig,
} from "../src/github/config.js";

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

test("authorize URL contains PKCE and issue write scope", async () => {
  const pair = await createPkcePair();
  const url = new URL(buildGitHubAuthorizeUrl({
    clientId: "client123",
    redirectUri: "https://ring-wdr.github.io/towerdefense-codex/",
    state: "state-1",
    codeChallenge: pair.codeChallenge,
  }));

  assert.equal(url.origin, "https://github.com");
  assert.equal(url.searchParams.get("client_id"), "client123");
  assert.equal(url.searchParams.get("redirect_uri"), "https://ring-wdr.github.io/towerdefense-codex/");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
});

test("callback parser returns denied status and code status", () => {
  assert.deepEqual(
    parseGitHubAuthResult(new URL("https://example.com/?error=access_denied")),
    { code: "", error: "access_denied", state: "", status: "error" },
  );

  assert.deepEqual(
    parseGitHubAuthResult(new URL("https://example.com/?code=abc123&state=state-1")),
    { code: "abc123", error: "", state: "state-1", status: "code" },
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/github-score-comment.test.js`  
Expected: FAIL with missing exports from `src/github/config.js` and `src/github/auth.js`.

- [ ] **Step 3: Implement config and PKCE auth helpers**

```js
// src/github/config.js
const REQUIRED_KEYS = [
  "VITE_GITHUB_APP_CLIENT_ID",
  "VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER",
  "VITE_GITHUB_REPO_OWNER",
  "VITE_GITHUB_REPO_NAME",
  "VITE_GITHUB_REDIRECT_URI",
];

export function getGitHubScoreConfig({ env = import.meta.env } = {}) {
  return {
    clientId: env.VITE_GITHUB_APP_CLIENT_ID || "",
    issueNumber: Number(env.VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER || 0),
    redirectUri: env.VITE_GITHUB_REDIRECT_URI || window.location.origin + window.location.pathname,
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
```

```js
// src/github/auth.js
function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

export async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = toBase64Url(verifierBytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return {
    codeVerifier,
    codeChallenge: toBase64Url(new Uint8Array(digest)),
  };
}

export function buildGitHubAuthorizeUrl({ clientId, redirectUri, state, codeChallenge }) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function parseGitHubAuthResult(url = new URL(window.location.href)) {
  const error = url.searchParams.get("error") || "";
  if (error) {
    return { code: "", error, state: url.searchParams.get("state") || "", status: "error" };
  }
  const code = url.searchParams.get("code") || "";
  return { code, error: "", state: url.searchParams.get("state") || "", status: code ? "code" : "idle" };
}
```

- [ ] **Step 4: Run tests to verify config and auth helpers pass**

Run: `node --test test/github-score-comment.test.js`  
Expected: PASS with config/auth tests included.

- [ ] **Step 5: Commit the auth slice**

```bash
git add test/github-score-comment.test.js src/github/config.js src/github/auth.js
git commit -m "feat: add GitHub score auth helpers"
```

### Task 3: Implement token exchange, comment submission, and browser state persistence

**Files:**
- Modify: `D:\tower-defense\src\github\auth.js`
- Modify: `D:\tower-defense\src\github\score-comment.js`
- Modify: `D:\tower-defense\test\github-score-comment.test.js`

- [ ] **Step 1: Add failing tests for token exchange request shape and comment POST shape**

```js
import {
  exchangeGitHubCodeForToken,
  persistPendingAuth,
  readPendingAuth,
  clearPendingAuth,
} from "../src/github/auth.js";
import { postScoreComment } from "../src/github/score-comment.js";

test("pending auth round-trips through session storage", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  persistPendingAuth(storage, { codeVerifier: "verifier", scoreSnapshot: { score: 1 }, state: "state-1" });
  assert.deepEqual(readPendingAuth(storage), { codeVerifier: "verifier", scoreSnapshot: { score: 1 }, state: "state-1" });
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
  assert.match(request.url, /github\\.com\\/login\\/oauth\\/access_token/);
  assert.match(String(request.init.body), /code_verifier=verifier123/);
});

test("score comment submission posts markdown body to issue comments api", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return { ok: true, json: async () => ({ html_url: "https://github.com/example/repo/issues/12#issuecomment-1" }) };
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
  assert.match(request.url, /repos\\/ring-wdr\\/towerdefense-codex\\/issues\\/12\\/comments/);
  assert.match(request.init.headers.Authorization, /^Bearer token-123$/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/github-score-comment.test.js`  
Expected: FAIL because the persistence, token exchange, and comment POST helpers do not exist yet.

- [ ] **Step 3: Implement persistence, token exchange, and comment submission**

```js
// src/github/auth.js
const PENDING_AUTH_KEY = "tower-defense.github-score.pending-auth";

export function persistPendingAuth(storage, payload) {
  storage.setItem(PENDING_AUTH_KEY, JSON.stringify(payload));
}

export function readPendingAuth(storage) {
  const raw = storage.getItem(PENDING_AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearPendingAuth(storage) {
  storage.removeItem(PENDING_AUTH_KEY);
}

export async function exchangeGitHubCodeForToken({ clientId, code, codeVerifier, fetchImpl = fetch }) {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
  });
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "GitHub token exchange failed");
  }
  return payload.access_token;
}
```

```js
// src/github/score-comment.js
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
```

- [ ] **Step 4: Run tests to verify all helper coverage passes**

Run: `node --test test/github-score-comment.test.js`  
Expected: PASS with persistence, token exchange, and comment POST tests passing.

- [ ] **Step 5: Commit the API slice**

```bash
git add test/github-score-comment.test.js src/github/auth.js src/github/score-comment.js
git commit -m "feat: add GitHub score submission api helpers"
```

### Task 4: Wire the game-over overlay UI into the new GitHub score flow

**Files:**
- Modify: `D:\tower-defense\index.html`
- Modify: `D:\tower-defense\styles.css`
- Modify: `D:\tower-defense\src\main.js`

- [ ] **Step 1: Add the failing DOM expectations by sketching the target selectors in code comments and verifying the build still fails on missing elements**

```js
// src/main.js
const overlayScoreAction = document.getElementById("overlay-score-action");
const overlayScoreStatus = document.getElementById("overlay-score-status");
```

Run: `npm run build`  
Expected: FAIL at runtime or lint-time until matching elements and handlers are added.

- [ ] **Step 2: Add the new game-over overlay markup**

```html
<div class="overlay-actions">
  <button id="overlay-primary" type="button">Start Game</button>
  <button id="overlay-secondary" type="button" hidden>Restart</button>
  <button id="overlay-score-action" type="button" hidden>GitHub에 점수 기록</button>
</div>
<p id="overlay-score-status" class="overlay-status" hidden></p>
```

- [ ] **Step 3: Add the overlay status styling**

```css
.overlay-status {
  margin: 0;
  color: #58606e;
  font: 600 0.92rem/1.4 Georgia, serif;
  text-align: center;
}

.overlay-status.is-error {
  color: #8a2d2d;
}

.overlay-status.is-success {
  color: #2f6b3c;
}
```

- [ ] **Step 4: Implement the browser flow in `src/main.js`**

```js
import packageJson from "../package.json";
import { clearPendingAuth, createPkcePair, buildGitHubAuthorizeUrl, exchangeGitHubCodeForToken, parseGitHubAuthResult, persistPendingAuth, readPendingAuth } from "./github/auth.js";
import { getGitHubScoreConfig, validateGitHubScoreConfig } from "./github/config.js";
import { buildScoreCommentBody, createScoreSnapshot, getBuildLabel, postScoreComment } from "./github/score-comment.js";
import { createSubmissionState, createScoreSubmissionKey, markSubmissionFailed, markSubmissionStarted, markSubmissionSucceeded } from "./github/submission-state.js";

let scoreSubmission = createSubmissionState();
const githubScoreConfig = getGitHubScoreConfig();
const buildLabel = getBuildLabel({
  envBuild: import.meta.env.VITE_APP_BUILD,
  packageVersion: packageJson.version,
});

async function beginScoreSubmission() {
  const missing = validateGitHubScoreConfig(githubScoreConfig);
  if (missing.length > 0) {
    scoreSubmission = markSubmissionFailed(scoreSubmission, "", "GitHub score config is incomplete.");
    render();
    return;
  }

  const snapshot = createScoreSnapshot(state, { buildLabel, timeZone: "Asia/Seoul" });
  const submissionKey = createScoreSubmissionKey(snapshot);
  if (scoreSubmission.lastSubmittedKey === submissionKey || scoreSubmission.status === "submitting") {
    return;
  }

  scoreSubmission = markSubmissionStarted(scoreSubmission, submissionKey);
  render();

  const { codeChallenge, codeVerifier } = await createPkcePair();
  const authState = crypto.randomUUID();
  persistPendingAuth(sessionStorage, { codeVerifier, scoreSnapshot: snapshot, state: authState });
  window.location.assign(buildGitHubAuthorizeUrl({
    clientId: githubScoreConfig.clientId,
    redirectUri: githubScoreConfig.redirectUri,
    state: authState,
    codeChallenge,
  }));
}

async function resumeScoreSubmissionFromCallback() {
  const authResult = parseGitHubAuthResult();
  if (authResult.status === "idle") return;

  const pending = readPendingAuth(sessionStorage);
  if (!pending || pending.state !== authResult.state) {
    clearPendingAuth(sessionStorage);
    return;
  }

  const submissionKey = createScoreSubmissionKey(pending.scoreSnapshot);
  if (authResult.status === "error") {
    scoreSubmission = markSubmissionFailed(scoreSubmission, submissionKey, "GitHub 로그인이 취소되었습니다.");
    clearPendingAuth(sessionStorage);
    render();
    return;
  }

  try {
    scoreSubmission = markSubmissionStarted(scoreSubmission, submissionKey);
    render();
    const accessToken = await exchangeGitHubCodeForToken({
      clientId: githubScoreConfig.clientId,
      code: authResult.code,
      codeVerifier: pending.codeVerifier,
    });
    await postScoreComment({
      accessToken,
      body: buildScoreCommentBody(pending.scoreSnapshot),
      issueNumber: githubScoreConfig.issueNumber,
      repoName: githubScoreConfig.repoName,
      repoOwner: githubScoreConfig.repoOwner,
    });
    scoreSubmission = markSubmissionSucceeded(scoreSubmission, submissionKey);
  } catch (error) {
    scoreSubmission = markSubmissionFailed(scoreSubmission, submissionKey, error.message);
  } finally {
    clearPendingAuth(sessionStorage);
    window.history.replaceState({}, document.title, window.location.pathname);
    render();
  }
}
```

- [ ] **Step 5: Update `syncHud` to show score status only on game over**

```js
overlayScoreAction.hidden = state.status !== "game-over";
overlayScoreAction.disabled = scoreSubmission.status === "submitting" || scoreSubmission.status === "success";
overlayScoreStatus.hidden = state.status !== "game-over" || !getOverlayScoreStatusText();
overlayScoreStatus.textContent = getOverlayScoreStatusText();
overlayScoreStatus.classList.toggle("is-error", scoreSubmission.status === "error");
overlayScoreStatus.classList.toggle("is-success", scoreSubmission.status === "success");
```

- [ ] **Step 6: Add button handlers and restart reset behavior**

```js
overlayScoreAction.addEventListener("click", () => {
  beginScoreSubmission().catch((error) => {
    scoreSubmission = markSubmissionFailed(scoreSubmission, scoreSubmission.activeKey || "", error.message);
    render();
  });
});

function resetRunState() {
  state = restartGame();
  scoreSubmission = createSubmissionState();
  render();
}
```

- [ ] **Step 7: Run the test suite and production build**

Run: `npm test`  
Expected: PASS with existing game logic tests and the new GitHub score helper tests.

Run: `npm run build`  
Expected: PASS and produce a fresh `dist` bundle without unresolved imports.

- [ ] **Step 8: Commit the integrated UI flow**

```bash
git add index.html styles.css src/main.js
git commit -m "feat: wire game over score submission to GitHub"
```

### Task 5: Document configuration and manual verification steps

**Files:**
- Modify: `D:\tower-defense\README.md`

- [ ] **Step 1: Add README setup instructions for the GitHub App variables**

```md
## GitHub Score Submission Setup

Create a GitHub App configured for browser PKCE login and issue comments, then define:

- `VITE_GITHUB_APP_CLIENT_ID`
- `VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER`
- `VITE_GITHUB_REPO_OWNER`
- `VITE_GITHUB_REPO_NAME`
- `VITE_GITHUB_REDIRECT_URI`
- `VITE_APP_BUILD` (optional)

For local development, point `VITE_GITHUB_REDIRECT_URI` to the local Vite URL you registered in the GitHub App. For GitHub Pages, use the deployed app URL exactly.
```

- [ ] **Step 2: Add a manual verification checklist**

```md
Manual check:

1. Reach a game over screen.
2. Click `GitHub에 점수 기록`.
3. Approve the GitHub App.
4. Confirm the page returns to the game.
5. Confirm the fixed leaderboard issue now has a new comment with score, wave, lives, timestamp, and build.
```

- [ ] **Step 3: Run the test suite once more after docs updates**

Run: `npm test`  
Expected: PASS with no behavior regressions after the documentation-only change.

- [ ] **Step 4: Commit the docs handoff**

```bash
git add README.md
git commit -m "docs: add GitHub score submission setup"
```

## Self-Review

- Spec coverage check:
  - Game-over-only CTA and overlay statuses are covered in Task 4.
  - GitHub App PKCE, session persistence, and redirect recovery are covered in Tasks 2 and 3.
  - Fixed-issue comment posting is covered in Task 3 and wired in Task 4.
  - Failure handling and duplicate locking are covered in Tasks 1, 3, and 4.
  - README setup and manual verification are covered in Task 5.
- Placeholder scan:
  - No `TODO`, `TBD`, or “handle later” placeholders remain.
- Type consistency:
  - The plan consistently uses `scoreSnapshot`, `submissionKey`, `scoreSubmission`, `postScoreComment`, and `exchangeGitHubCodeForToken`.

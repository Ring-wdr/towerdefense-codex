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

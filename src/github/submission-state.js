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

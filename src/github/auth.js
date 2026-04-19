function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function toBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getCryptoApi() {
  if (globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API is not available.");
}

const PENDING_AUTH_KEY = "tower-defense.github-score.pending-auth";

export async function createPkcePair() {
  const cryptoApi = getCryptoApi();
  const verifierBytes = cryptoApi.getRandomValues(new Uint8Array(32));
  const codeVerifier = toBase64Url(verifierBytes);
  const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
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

export function parseGitHubAuthResult(url) {
  const searchUrl = url || new URL(globalThis.location?.href || "http://localhost/");
  const error = searchUrl.searchParams.get("error") || "";
  if (error) {
    return {
      code: "",
      error,
      state: searchUrl.searchParams.get("state") || "",
      status: "error",
    };
  }

  const code = searchUrl.searchParams.get("code") || "";
  return {
    code,
    error: "",
    state: searchUrl.searchParams.get("state") || "",
    status: code ? "code" : "idle",
  };
}

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

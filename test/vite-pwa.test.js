import test from "node:test";
import assert from "node:assert/strict";

import {
  createCacheName,
  createManifest,
  createPrecacheUrls,
  createServiceWorkerSource,
  joinBase,
  normalizeBase,
} from "../vite/pwa.js";

test("normalizeBase keeps relative and absolute build bases stable", () => {
  assert.equal(normalizeBase("./"), "./");
  assert.equal(normalizeBase("/tower-defense"), "/tower-defense/");
  assert.equal(normalizeBase("/"), "/");
});

test("joinBase resolves URLs for both relative and absolute deployment bases", () => {
  assert.equal(joinBase("./", "icons/icon-192.png"), "./icons/icon-192.png");
  assert.equal(joinBase("/tower-defense/", "icons/icon-192.png"), "/tower-defense/icons/icon-192.png");
  assert.equal(joinBase("/tower-defense", ""), "/tower-defense/");
});

test("createManifest wires install metadata to the configured base path", () => {
  const manifest = createManifest("/tower-defense/");

  assert.equal(manifest.start_url, "/tower-defense/");
  assert.equal(manifest.scope, "/tower-defense/");
  assert.equal(manifest.icons[0].src, "/tower-defense/icons/icon-192.png");
});

test("createPrecacheUrls includes shell files, icons, and emitted bundle assets", () => {
  const precacheUrls = createPrecacheUrls("./", [
    "assets/index-abc123.js",
    "assets/index-abc123.css",
    "manifest.webmanifest",
    "sw.js",
    "assets/index-abc123.js.map",
  ]);

  assert.deepEqual(
    precacheUrls,
    [
      "./",
      "./index.html",
      "./manifest.webmanifest",
      "./favicon.png",
      "./apple-touch-icon.png",
      "./icons/icon-192.png",
      "./icons/icon-512.png",
      "./icons/icon-maskable-512.png",
      "./assets/index-abc123.css",
      "./assets/index-abc123.js",
    ],
  );
});

test("createServiceWorkerSource embeds the navigation fallback and deterministic cache name", () => {
  const precacheUrls = createPrecacheUrls("/tower-defense/", ["assets/index-abc123.js"]);
  const cacheName = createCacheName(precacheUrls);
  const source = createServiceWorkerSource("/tower-defense/", cacheName, precacheUrls);

  assert.match(cacheName, /^tower-defense-precache-[0-9a-f]{12}$/);
  assert.match(source, /NAVIGATION_FALLBACK_URL = "\/tower-defense\/index\.html"/);
  assert.match(source, /tower-defense-fonts/);
});

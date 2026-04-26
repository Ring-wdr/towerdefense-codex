import { describe, expect, test } from "vitest";

if (process.env.VITEST) {
  describe("vite/pwa.ts", () => {
    test("normalizes relative and absolute base paths", async () => {
      const { normalizeBase } = await import(new URL("../vite/pwa.ts", import.meta.url).href);

      expect(normalizeBase("./")).toBe("./");
      expect(normalizeBase("/tower-defense")).toBe("/tower-defense/");
    });

    test("joins asset paths against the configured base", async () => {
      const { joinBase } = await import(new URL("../vite/pwa.ts", import.meta.url).href);

      expect(joinBase("./", "icons/icon-192.png")).toBe("./icons/icon-192.png");
      expect(joinBase("/tower-defense/", "icons/icon-192.png")).toBe(
        "/tower-defense/icons/icon-192.png",
      );
    });

    test("creates a manifest with base-aware icon urls", async () => {
      const { createManifest } = await import(new URL("../vite/pwa.ts", import.meta.url).href);

      const manifest = createManifest("/tower-defense/");

      expect(manifest.id).toBe("/tower-defense/");
      expect(manifest.prefer_related_applications).toBe(false);
      expect(manifest.orientation).toBe("portrait-primary");
      expect(manifest.icons[0]?.src).toBe("/tower-defense/icons/icon-192.png");
      expect(manifest.screenshots[0]?.src).toBe("/tower-defense/screenshots/install-home.png");
      expect(manifest.shortcuts[0]?.url).toBe("/tower-defense/");
      expect(manifest.shortcuts[1]?.url).toBe("/tower-defense/?screen=shop");
    });

    test("includes shell files, icons, and emitted bundles in the precache list", async () => {
      const { createPrecacheUrls } = await import(new URL("../vite/pwa.ts", import.meta.url).href);

      expect(
        createPrecacheUrls("./", [
          "assets/index-abc123.js",
          "assets/index-abc123.css",
          "manifest.webmanifest",
          "sw.js",
          "assets/index-abc123.js.map",
        ]),
      ).toEqual([
        "./",
        "./index.html",
        "./manifest.webmanifest",
        "./favicon.png",
        "./apple-touch-icon.png",
        "./icons/icon-192.png",
        "./icons/icon-512.png",
        "./icons/icon-maskable-512.png",
        "./screenshots/install-home.png",
        "./screenshots/install-battle.png",
        "./assets/index-abc123.css",
        "./assets/index-abc123.js",
      ]);
    });

    test("builds a deterministic service worker source for the navigation shell", async () => {
      const { createCacheName, createPrecacheUrls, createServiceWorkerSource } = await import(
        new URL("../vite/pwa.ts", import.meta.url).href
      );

      const precacheUrls = createPrecacheUrls("/tower-defense/", ["assets/index-abc123.js"]);
      const cacheName = createCacheName(precacheUrls);
      const source = createServiceWorkerSource("/tower-defense/", cacheName, precacheUrls);

      expect(cacheName).toMatch(/^tower-defense-precache-[0-9a-f]{12}$/);
      expect(source).toMatch(/NAVIGATION_FALLBACK_URL = "\/tower-defense\/index\.html"/);
      expect(source).toMatch(/tower-defense-fonts/);
    });
  });
}

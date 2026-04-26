import { createHash } from "node:crypto";

const APP_NAME = "Tower Defense";
const APP_DESCRIPTION =
  "Lightweight wave-based tower defense with campaign progression, touchscreen support, and offline-ready play.";
const APP_THEME_COLOR = "#1b2a28";
const APP_BACKGROUND_COLOR = "#14201f";
const MANIFEST_FILE_NAME = "manifest.webmanifest";
const ICON_DEFINITIONS = [
  {
    fileName: "icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
  },
  {
    fileName: "icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
  },
  {
    fileName: "icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any maskable",
  },
];

export function normalizeBase(base) {
  if (!base || base === "/") {
    return "/";
  }

  if (base === "." || base === "./") {
    return "./";
  }

  return base.endsWith("/") ? base : `${base}/`;
}

export function joinBase(base, path = "") {
  const normalizedBase = normalizeBase(base);
  const cleanPath = path.replace(/^\/+/, "");

  if (!cleanPath) {
    return normalizedBase;
  }

  if (normalizedBase === "./") {
    return `./${cleanPath}`;
  }

  return `${normalizedBase}${cleanPath}`;
}

export function createManifest(base) {
  return {
    id: "tower-defense",
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: joinBase(base),
    scope: joinBase(base),
    display: "standalone",
    orientation: "landscape",
    background_color: APP_BACKGROUND_COLOR,
    theme_color: APP_THEME_COLOR,
    icons: ICON_DEFINITIONS.map((icon) => ({
      ...icon,
      src: joinBase(base, icon.fileName),
    })),
  };
}

function shouldPrecache(fileName) {
  if (fileName === "sw.js" || fileName === MANIFEST_FILE_NAME) {
    return false;
  }

  return !fileName.endsWith(".map");
}

export function createPrecacheUrls(base, bundleFileNames) {
  const urls = new Set([
    joinBase(base),
    joinBase(base, "index.html"),
    joinBase(base, MANIFEST_FILE_NAME),
    joinBase(base, "favicon.png"),
    joinBase(base, "apple-touch-icon.png"),
    ...ICON_DEFINITIONS.map((icon) => joinBase(base, icon.fileName)),
  ]);

  for (const fileName of [...bundleFileNames].sort()) {
    if (!shouldPrecache(fileName)) {
      continue;
    }

    urls.add(joinBase(base, fileName));
  }

  return [...urls];
}

export function createCacheName(precacheUrls) {
  const hash = createHash("sha256")
    .update(precacheUrls.join("|"))
    .digest("hex")
    .slice(0, 12);

  return `tower-defense-precache-${hash}`;
}

export function createServiceWorkerSource(base, cacheName, precacheUrls) {
  const navigationFallbackUrl = joinBase(base, "index.html");
  const fontHosts = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

  return `const CACHE_NAME = ${JSON.stringify(cacheName)};
const STATIC_CACHE_PREFIX = "tower-defense-precache-";
const FONT_CACHE_NAME = "tower-defense-fonts";
const NAVIGATION_FALLBACK_URL = ${JSON.stringify(navigationFallbackUrl)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const FONT_HOSTS = new Set(${JSON.stringify(fontHosts)});

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(STATIC_CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  if (FONT_HOSTS.has(url.origin)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE_NAME));
  }
});

async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const fallbackResponse = await cache.match(NAVIGATION_FALLBACK_URL);

    if (fallbackResponse) {
      return fallbackResponse;
    }

    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (response.ok || response.type === "opaque") {
        await cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}
`;
}

export function towerDefensePwa() {
  let resolvedBase = "./";

  return {
    name: "tower-defense-pwa",
    configResolved(config) {
      resolvedBase = config.base;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/manifest.webmanifest") {
          next();
          return;
        }

        const manifest = createManifest(resolvedBase);
        res.setHeader("Content-Type", "application/manifest+json");
        res.end(`${JSON.stringify(manifest, null, 2)}\n`);
      });
    },
    generateBundle(_outputOptions, bundle) {
      const manifest = createManifest(resolvedBase);
      const precacheUrls = createPrecacheUrls(resolvedBase, Object.keys(bundle));
      const cacheName = createCacheName(precacheUrls);

      this.emitFile({
        type: "asset",
        fileName: MANIFEST_FILE_NAME,
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });

      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: createServiceWorkerSource(resolvedBase, cacheName, precacheUrls),
      });
    },
  };
}

function hasController() {
  return typeof navigator !== "undefined" && Boolean(navigator.serviceWorker?.controller);
}

export function watchServiceWorkerUpdate(
  registration,
  {
    onUpdateReady,
    hasActiveController = hasController,
  } = {},
) {
  if (!registration) {
    return () => {};
  }

  let announcedWorker = null;
  let activeInstallingWorker = null;
  let handleInstallingStateChange = null;

  const detachInstallingWorker = () => {
    if (activeInstallingWorker && handleInstallingStateChange) {
      activeInstallingWorker.removeEventListener?.("statechange", handleInstallingStateChange);
    }

    activeInstallingWorker = null;
    handleInstallingStateChange = null;
  };

  const announce = (worker) => {
    if (!worker || worker === announcedWorker) {
      return;
    }

    announcedWorker = worker;
    onUpdateReady?.(worker);
  };

  announce(registration.waiting);

  const handleUpdateFound = () => {
    const worker = registration.installing;

    detachInstallingWorker();

    if (!worker) {
      return;
    }

    activeInstallingWorker = worker;
    handleInstallingStateChange = () => {
      if (worker.state === "installed" && hasActiveController()) {
        announce(registration.waiting ?? worker);
      }
    };

    worker.addEventListener("statechange", handleInstallingStateChange);
  };

  registration.addEventListener("updatefound", handleUpdateFound);

  return () => {
    registration.removeEventListener?.("updatefound", handleUpdateFound);
    detachInstallingWorker();
  };
}

export function activateServiceWorkerUpdate(
  registration,
  {
    serviceWorker = navigator.serviceWorker,
    location = window.location,
  } = {},
) {
  if (!registration?.waiting) {
    return false;
  }

  let reloaded = false;
  const handleControllerChange = () => {
    if (reloaded) {
      return;
    }

    reloaded = true;
    serviceWorker?.removeEventListener?.("controllerchange", handleControllerChange);
    location.reload();
  };

  serviceWorker?.addEventListener("controllerchange", handleControllerChange);

  registration.waiting.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export async function registerServiceWorker({ onUpdateReady } = {}) {
  if (!import.meta.env.PROD || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return {
      cleanup() {},
      registration: null,
    };
  }

  const serviceWorkerUrl = new URL(/* @vite-ignore */ "../sw.js", import.meta.url);

  try {
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
    const cleanup = watchServiceWorkerUpdate(registration, { onUpdateReady });
    registration.update().catch(() => {});
    return {
      cleanup,
      registration,
    };
  } catch (error) {
    console.error("Service worker registration failed.", error);
    return {
      cleanup() {},
      registration: null,
    };
  }
}

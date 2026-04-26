function hasController() {
  return typeof navigator !== "undefined" && Boolean(navigator.serviceWorker?.controller);
}

type UpdateReadyHandler = (worker: ServiceWorker) => void;

interface WatchServiceWorkerUpdateOptions {
  onUpdateReady?: UpdateReadyHandler | undefined;
  hasActiveController?: (() => boolean) | undefined;
}

interface ActivateServiceWorkerUpdateOptions {
  serviceWorker?: ServiceWorkerContainer | undefined;
  location?: Pick<Location, "reload"> | undefined;
}

export interface ServiceWorkerRegistrationResult {
  cleanup: () => void;
  registration: ServiceWorkerRegistration | null;
}

export function watchServiceWorkerUpdate(
  registration: ServiceWorkerRegistration | null | undefined,
  {
    onUpdateReady,
    hasActiveController = hasController,
  }: WatchServiceWorkerUpdateOptions = {},
): () => void {
  if (!registration) {
    return () => {};
  }

  let announcedWorker: ServiceWorker | null = null;
  let activeInstallingWorker: ServiceWorker | null = null;
  let handleInstallingStateChange: EventListener | null = null;

  const detachInstallingWorker = (): void => {
    if (activeInstallingWorker && handleInstallingStateChange) {
      activeInstallingWorker.removeEventListener("statechange", handleInstallingStateChange);
    }

    activeInstallingWorker = null;
    handleInstallingStateChange = null;
  };

  const announce = (worker: ServiceWorker | null): void => {
    if (!worker || worker === announcedWorker) {
      return;
    }

    announcedWorker = worker;
    onUpdateReady?.(worker);
  };

  announce(registration.waiting);

  const handleUpdateFound = (): void => {
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
  registration: ServiceWorkerRegistration | null | undefined,
  {
    serviceWorker = navigator.serviceWorker,
    location = window.location,
  }: ActivateServiceWorkerUpdateOptions = {},
): boolean {
  if (!registration?.waiting) {
    return false;
  }

  let reloaded = false;
  const handleControllerChange = (): void => {
    if (reloaded) {
      return;
    }

    reloaded = true;
    serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
    location.reload();
  };

  serviceWorker?.addEventListener("controllerchange", handleControllerChange);

  registration.waiting.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export async function registerServiceWorker(
  { onUpdateReady }: WatchServiceWorkerUpdateOptions = {},
): Promise<ServiceWorkerRegistrationResult> {
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

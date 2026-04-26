import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  activateServiceWorkerUpdate,
  watchServiceWorkerUpdate,
} from "../src/pwa/register-service-worker.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

function createWorker(initialState = "installed") {
  const listeners = new Map();

  return {
    state: initialState,
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    removeEventListener(type, callback) {
      if (listeners.get(type) === callback) {
        listeners.delete(type);
      }
    },
    dispatch(type) {
      listeners.get(type)?.();
    },
    hasListener(type) {
      return listeners.has(type);
    },
  };
}

function createRegistration({ waiting = null, installing = null } = {}) {
  const listeners = new Map();

  return {
    waiting,
    installing,
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    removeEventListener(type, callback) {
      if (listeners.get(type) === callback) {
        listeners.delete(type);
      }
    },
    dispatch(type) {
      listeners.get(type)?.();
    },
    hasListener(type) {
      return listeners.has(type);
    },
  };
}

test("app renders a sonner toaster and wires a refresh action for PWA updates", () => {
  assert.match(appSource, /from "sonner"/);
  assert.match(appSource, /<Toaster/);
  assert.match(appSource, /toast\.info\(/);
  assert.match(appSource, /Refresh now/);
  assert.doesNotMatch(appSource, /registerServiceWorker/);
});

test("main entry owns service worker registration and forwards update notifications", () => {
  assert.match(mainSource, /registerServiceWorker/);
  assert.match(mainSource, /onUpdateReady/);
});

test("watchServiceWorkerUpdate announces an already waiting service worker immediately", () => {
  const waiting = { postMessage() {} };
  const registration = createRegistration({ waiting });
  const seen = [];

  const cleanup = watchServiceWorkerUpdate(registration, {
    onUpdateReady(worker) {
      seen.push(worker);
    },
  });

  assert.deepEqual(seen, [waiting]);
  cleanup();
});

test("watchServiceWorkerUpdate announces a newly installed worker only when a controller exists", () => {
  const seen = [];
  const waitingWorker = createWorker("installing");
  const registration = createRegistration({ installing: waitingWorker });

  const cleanup = watchServiceWorkerUpdate(registration, {
    onUpdateReady(worker) {
      seen.push(worker);
    },
    hasActiveController() {
      return true;
    },
  });

  registration.dispatch("updatefound");
  waitingWorker.state = "installed";
  registration.waiting = waitingWorker;
  waitingWorker.dispatch("statechange");

  assert.deepEqual(seen, [waitingWorker]);

  cleanup();
});

test("watchServiceWorkerUpdate cleanup removes registration and worker listeners", () => {
  const waitingWorker = createWorker("installing");
  const registration = createRegistration({ installing: waitingWorker });

  const cleanup = watchServiceWorkerUpdate(registration, {
    hasActiveController() {
      return true;
    },
  });

  registration.dispatch("updatefound");

  assert.equal(registration.hasListener("updatefound"), true);
  assert.equal(waitingWorker.hasListener("statechange"), true);

  cleanup();

  assert.equal(registration.hasListener("updatefound"), false);
  assert.equal(waitingWorker.hasListener("statechange"), false);
});

test("activateServiceWorkerUpdate asks the waiting worker to skip waiting and reloads once on controller change", () => {
  const messages = [];
  let reloadCount = 0;
  const listeners = new Map();
  const waiting = {
    postMessage(message) {
      messages.push(message);
    },
  };
  const registration = createRegistration({ waiting });
  const serviceWorker = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };

  activateServiceWorkerUpdate(registration, {
    serviceWorker,
    location: {
      reload() {
        reloadCount += 1;
      },
    },
  });

  listeners.get("controllerchange")?.();
  listeners.get("controllerchange")?.();

  assert.deepEqual(messages, [{ type: "SKIP_WAITING" }]);
  assert.equal(reloadCount, 1);
});

test("activateServiceWorkerUpdate cleans up the controllerchange listener after reload", () => {
  const waiting = { postMessage() {} };
  const registration = createRegistration({ waiting });
  const listeners = new Map();
  const serviceWorker = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    removeEventListener(type, callback) {
      if (listeners.get(type) === callback) {
        listeners.delete(type);
      }
    },
  };

  activateServiceWorkerUpdate(registration, {
    serviceWorker,
    location: {
      reload() {},
    },
  });

  assert.equal(listeners.has("controllerchange"), true);

  listeners.get("controllerchange")?.();

  assert.equal(listeners.has("controllerchange"), false);
});

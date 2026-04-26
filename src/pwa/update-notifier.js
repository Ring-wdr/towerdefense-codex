const updateListeners = new Set();

export function notifyServiceWorkerUpdateReady() {
  for (const listener of updateListeners) {
    listener();
  }
}

export function subscribeToServiceWorkerUpdateReady(listener) {
  updateListeners.add(listener);

  return () => {
    updateListeners.delete(listener);
  };
}

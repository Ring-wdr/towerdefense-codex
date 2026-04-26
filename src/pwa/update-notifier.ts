type UpdateListener = () => void;

const updateListeners = new Set<UpdateListener>();

export function notifyServiceWorkerUpdateReady(): void {
  for (const listener of updateListeners) {
    listener();
  }
}

export function subscribeToServiceWorkerUpdateReady(listener: UpdateListener): () => void {
  updateListeners.add(listener);

  return () => {
    updateListeners.delete(listener);
  };
}

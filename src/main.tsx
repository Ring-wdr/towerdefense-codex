import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./pwa/register-service-worker.js";
import { notifyServiceWorkerUpdateReady } from "./pwa/update-notifier.js";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' was not found.");
}

ReactDOM.createRoot(rootElement).render(<App />);
void registerServiceWorker({
  onUpdateReady() {
    notifyServiceWorkerUpdateReady();
  },
});

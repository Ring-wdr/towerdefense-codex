import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker } from "./pwa/register-service-worker.js";
import { notifyServiceWorkerUpdateReady } from "./pwa/update-notifier.js";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
void registerServiceWorker({
  onUpdateReady() {
    notifyServiceWorkerUpdateReady();
  },
});

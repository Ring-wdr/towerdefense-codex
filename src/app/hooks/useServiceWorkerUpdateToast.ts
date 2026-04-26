import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { activateServiceWorkerUpdate } from "../../pwa/register-service-worker.js";
import { subscribeToServiceWorkerUpdateReady } from "../../pwa/update-notifier.js";

type ToastId = string | number;

export default function useServiceWorkerUpdateToast() {
  const updateToastIdRef = useRef<ToastId | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToServiceWorkerUpdateReady(() => {
      if (updateToastIdRef.current) {
        return;
      }

      updateToastIdRef.current = toast.info("A new version is ready.", {
        action: {
          label: "Refresh now",
          onClick: async () => {
            const registration = await navigator.serviceWorker.getRegistration();

            if (activateServiceWorkerUpdate(registration)) {
              if (updateToastIdRef.current != null) {
                toast.dismiss(updateToastIdRef.current);
              }
              updateToastIdRef.current = null;
            }
          },
        },
        duration: Infinity,
        onDismiss() {
          updateToastIdRef.current = null;
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);
}

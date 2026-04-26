// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "../src/App";

const mocks = vi.hoisted(() => ({
  activateServiceWorkerUpdate: vi.fn(),
  dismissToast: vi.fn(),
  getRegistration: vi.fn(),
  subscribeToServiceWorkerUpdateReady: vi.fn(),
  toastInfo: vi.fn<
    (
      message: string,
      options: {
        action: {
          label: string;
          onClick: () => Promise<void>;
        };
        duration: number;
        onDismiss: () => void;
      },
    ) => string
  >(() => "toast-id"),
  unsubscribe: vi.fn(),
  updateReadyListener: null as null | (() => void),
}));

vi.mock("../src/app/BattleHost", () => ({
  default: () => <div data-testid="battle-host-stub" />,
}));

vi.mock("../src/game/meta-progress.js", () => {
  const metaProgress = {
    currency: 0,
    highestClearedStage: 0,
    combatUnlocks: {},
    upgrades: {},
  };

  return {
    createMetaProgress: () => ({ ...metaProgress }),
    loadMetaProgress: () => ({ ...metaProgress }),
    normalizeMetaProgress: (value: typeof metaProgress) => value,
    saveMetaProgress: (value: typeof metaProgress) => value,
  };
});

vi.mock("../src/pwa/register-service-worker.js", () => ({
  activateServiceWorkerUpdate: mocks.activateServiceWorkerUpdate,
}));

vi.mock("../src/pwa/update-notifier.js", () => ({
  subscribeToServiceWorkerUpdateReady: mocks.subscribeToServiceWorkerUpdateReady.mockImplementation(
    (listener: () => void) => {
      mocks.updateReadyListener = listener;
      return mocks.unsubscribe;
    },
  ),
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    dismiss: mocks.dismissToast,
    info: mocks.toastInfo,
  },
}));

describe("pwa refresh toast", () => {
  beforeEach(() => {
    mocks.activateServiceWorkerUpdate.mockReset();
    mocks.dismissToast.mockReset();
    mocks.getRegistration.mockReset();
    mocks.subscribeToServiceWorkerUpdateReady.mockClear();
    mocks.toastInfo.mockClear();
    mocks.unsubscribe.mockReset();
    mocks.updateReadyListener = null;

    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: mocks.getRegistration,
      },
    });
  });

  test("subscribes on mount and shows one refresh toast until it is cleared", () => {
    const view = render(<App />);

    expect(mocks.subscribeToServiceWorkerUpdateReady).toHaveBeenCalledTimes(1);
    expect(typeof mocks.updateReadyListener).toBe("function");

    mocks.updateReadyListener?.();
    mocks.updateReadyListener?.();

    expect(mocks.toastInfo).toHaveBeenCalledTimes(1);
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      "A new version is ready.",
      expect.objectContaining({
        action: expect.objectContaining({
          label: "Refresh now",
          onClick: expect.any(Function),
        }),
        duration: Infinity,
        onDismiss: expect.any(Function),
      }),
    );

    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("refresh action activates the waiting worker, dismisses the toast, and allows future prompts", async () => {
    const registration = { waiting: { postMessage: vi.fn() } };
    mocks.getRegistration.mockResolvedValue(registration);
    mocks.activateServiceWorkerUpdate.mockReturnValue(true);

    render(<App />);
    mocks.updateReadyListener?.();

    const toastOptions = mocks.toastInfo.mock.calls[0]?.[1] as
      | {
          action: {
            label: string;
            onClick: () => Promise<void>;
          };
        }
      | undefined;

    expect(toastOptions?.action.label).toBe("Refresh now");
    if (!toastOptions) {
      throw new Error("Expected the update toast options to be captured.");
    }

    await toastOptions.action.onClick();

    expect(mocks.getRegistration).toHaveBeenCalledTimes(1);
    expect(mocks.activateServiceWorkerUpdate).toHaveBeenCalledWith(registration);
    expect(mocks.dismissToast).toHaveBeenCalledWith("toast-id");

    mocks.updateReadyListener?.();
    expect(mocks.toastInfo).toHaveBeenCalledTimes(2);
  });
});

// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import App from "../src/App.jsx";

vi.mock("../src/app/BattleHost.jsx", () => ({
  default: () => <div data-testid="battle-host-stub" />,
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    info: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
  },
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

if (process.env.VITEST) {
  describe("rtl smoke", () => {
    test("renders the real app shell through RTL and uses jest-dom matchers", () => {
      render(<App />);

      expect(screen.getByTestId("toaster")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Stage Command" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start Campaign" })).toBeInTheDocument();
    });
  });
}

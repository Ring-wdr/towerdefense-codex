// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "../src/App";

const battleHostPropsSpy = vi.fn<(props: unknown) => void>();

vi.mock("../src/app/BattleHost", () => ({
  default: (props: unknown) => {
    battleHostPropsSpy(props);
    return <div data-testid="battle-host-stub" />;
  },
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

describe("app screen flow", () => {
  beforeEach(() => {
    battleHostPropsSpy.mockClear();
  });

  test("routes title to campaign to theme to battle through React-owned screens", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stage Command" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start Campaign" }));
    expect(screen.getByText("Campaign Map")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Briefing" }));
    expect(screen.getByRole("heading", { name: "Stage Briefing" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enter Battle" }));
    expect(screen.getByTestId("battle-host-stub")).toBeInTheDocument();
    expect(battleHostPropsSpy).toHaveBeenCalledTimes(1);
  });

  test("routes title to shop and back through React-owned screens", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Shop" }));
    expect(screen.getByRole("heading", { name: "Field Arsenal" })).toBeInTheDocument();
    expect(screen.getByText("Meta Shop")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Stage Command" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Campaign" })).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import { createRef } from "react";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import BattleControls from "../src/app/components/BattleControls";

describe("BattleControls", () => {
  test("renders the existing Phaser control ids through the extracted component", () => {
    const controlsRootRef = createRef<HTMLElement>();
    render(<BattleControls controlsRootRef={controlsRootRef} />);

    expect(controlsRootRef.current?.id).toBe("battle-controls");
    expect(document.getElementById("start-button")?.textContent).toBe("Start");
    expect(document.getElementById("pause-button")?.textContent).toBe("Pause");
    expect(document.getElementById("tower-actions")).toBeTruthy();
    expect(document.getElementById("tower-buttons-dock")).toBeTruthy();
    expect(document.querySelector('[data-action="build"]')?.textContent).toBe("Build");
  });
});

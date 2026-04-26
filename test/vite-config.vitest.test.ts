import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

if (process.env.VITEST) {
  describe("vite.config.ts", () => {
    test("keeps the canonical TS config as the source of truth", async () => {
      const { default: config } = await import(new URL("../vite.config.ts", import.meta.url).href);

      expect(config.base).toBe("./");
      expect(Array.isArray(config.plugins)).toBe(true);
      expect(config.plugins?.length).toBeGreaterThanOrEqual(2);
      expect(config.plugins?.some((plugin: unknown) => plugin && typeof plugin === "object")).toBe(
        true,
      );
    });

    test("declares the Vitest include convention for the future-facing lane", async () => {
      const { default: config } = await import(new URL("../vite.config.ts", import.meta.url).href);

      expect(config.test?.include).toEqual([
        "test/**/*.vitest.test.{js,jsx,ts,tsx}",
        "test/app-screen-flow.test.tsx",
        "test/battle-particles.test.ts",
        "test/phaser-layout.test.ts",
      ]);
      expect(config.test?.setupFiles).toBe("./vitest/setup.ts");
    });

    test("still enables the React compiler in the canonical TS config source", () => {
      const source = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

      expect(source).toContain("babel-plugin-react-compiler");
    });
  });
}

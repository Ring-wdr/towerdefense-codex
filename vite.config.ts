import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { towerDefensePwa } from "./vite/pwa";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    towerDefensePwa(),
  ],
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./vitest/setup.ts",
    include: [
      "test/**/*.vitest.test.{js,jsx,ts,tsx}",
      "test/app-screen-flow.test.tsx",
      "test/battle-particles.test.ts",
      "test/phaser-layout.test.ts",
    ],
    exclude: [
      ...configDefaults.exclude,
      ".merge-backup/**",
      ".worktrees/**",
      "dist/**",
      "output/**",
      "node_modules/**",
    ],
  },
  base: "./",
});

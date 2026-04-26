import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { towerDefensePwa } from "./vite/pwa.js";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    towerDefensePwa(),
  ],
  base: "./",
});

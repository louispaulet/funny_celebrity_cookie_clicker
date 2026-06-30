import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/funny_celebrity_cookie_clicker/" : "/",
  build: {
    chunkSizeWarningLimit: 1600
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    globals: true
  }
}));

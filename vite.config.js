import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const thymioApi = fileURLToPath(
  new URL("./vendor/thymio3-ts-api/dist/thymio.mjs", import.meta.url),
);

export default defineConfig({
  // Project Pages live under /Thymio3-ANN-Edu/; local `npm run dev` stays at `/`.
  base: process.env.GITHUB_PAGES === "1" ? "/Thymio3-ANN-Edu/" : "/",
  plugins: [react()],
  resolve: {
    alias: { "thymio3-ts-api": thymioApi },
  },
  server: {
    port: 5182,
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const thymioApi = fileURLToPath(
  new URL("./vendor/thymio3-ts-api/dist/thymio.mjs", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "thymio3-ts-api": thymioApi },
  },
  server: {
    port: 5182,
  },
});

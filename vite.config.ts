import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Modules are addressed from the source root as "@/...", so moving a file
  // between folders does not rewrite the imports of everything around it.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // The domain is plain TypeScript with no DOM in it, so its tests run in Node.
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});

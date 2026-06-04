import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

import { staticRoutesPrerender } from "./scripts/vite-plugin-static-routes.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const baseUrl = mode === "development" ? "/" : env.VITE_BASE_URL || "/";

  return {
    base: baseUrl,
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      staticRoutesPrerender({
        routeTreePath: path.resolve(__dirname, "./src/routeTree.gen.ts"),
      }),
    ],
    build: {
      rolldownOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) {
              return;
            }
            if (id.includes("node_modules/ai/") || id.includes("node_modules/@ai-sdk/")) {
              return "vendor-ai";
            }
            if (
              id.includes("node_modules/react-markdown") ||
              id.includes("node_modules/remark-") ||
              id.includes("node_modules/mdast-") ||
              id.includes("node_modules/micromark")
            ) {
              return "vendor-markdown";
            }
            if (id.includes("node_modules/framer-motion")) {
              return "vendor-motion";
            }
            if (
              id.includes("node_modules/@emoji-mart/") ||
              id.includes("node_modules/emoji-mart/")
            ) {
              return "vendor-emoji";
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

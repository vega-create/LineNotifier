import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(async () => {
  const shadcnThemeJson = await import("@replit/vite-plugin-shadcn-theme-json");

  return {
    plugins: [react(), shadcnThemeJson.default()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared"),
      },
    },
    root: __dirname,
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

// ❗ 在 Vite 設定中不允許 await import，所以移除 cartographer（也不能在 Render 用）
export default defineConfig({
  plugins: [
    react(),
    themePlugin(), // OK
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  // ❗ 你的 index.html 在 /client 裡面
  // 所以前端 Root 要設定成 client
  root: path.resolve(__dirname, "client"),

  build: {
    // ❗ 靜態網站放在 dist 就好，不要放 dist/public
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "./initTables"; // 系統啟動時建立資料表

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(join(__dirname, "../public")));

// 簡單的後端 log function（避免使用 Vite 的 log）
function log(message: string) {
  const ts = new Date().toLocaleString("zh-TW", {
    hour12: false
  });
  console.log(`[${ts}] ${message}`);
}

// API 請求紀錄
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJson: any = undefined;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJson = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJson) {
        const jsonStr = JSON.stringify(capturedJson);
        line += ` :: ${jsonStr.length > 60 ? jsonStr.slice(0, 60) + "…" : jsonStr}`;
      }
      log(line);
    }
  });

  next();
});

(async () => {
  // 註冊後端 API
  const server = await registerRoutes(app);

  // 全域錯誤處理
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`ERROR ${status} :: ${message}`);
      res.status(status).json({ message });
    }
  );

  // 🚀 Render 不使用 Vite Dev Server，只跑純後端
  log("Running in production mode (no Vite dev server)");

  // Render 的 PORT 必須用 process.env.PORT
  const port = process.env.PORT ? Number(process.env.PORT) : 5000;

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Server running on port ${port}`);
    }
  );
})();

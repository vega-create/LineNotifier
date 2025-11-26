import { drizzle } from "drizzle-orm/sqlite";
import { Database } from "sqlite3";
import * as schema from "@shared/schema";

// SQLite 資料庫檔案 (本地端)
const sqlite = new Database("sqlite.db");

export const db = drizzle(sqlite, { schema });

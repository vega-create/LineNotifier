import pkg from "pg";
const { Pool } = pkg;

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon 必須
});

export const db = drizzle(pool, { schema });

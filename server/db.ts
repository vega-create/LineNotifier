import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "DATABASE_URL must be set in production. Please configure it in deployment secrets.",
    );
  }
  console.warn("DATABASE_URL not set, using default development URL");
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/dev";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

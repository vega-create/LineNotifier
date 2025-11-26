import { pool } from "./db"; // 你已經在 db.ts 建立好的 Postgres pool

async function initTables() {
  const client = await pool.connect();

  try {
    console.log("🟦 開始建立資料表...");

    // === groups ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        line_id TEXT NOT NULL UNIQUE
      );
    `);
    console.log("✔️  groups 建立完成");

    // === templates =========================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL
      );
    `);
    console.log("✔️  templates 建立完成");

    // === messages ==========================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        end_time TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TEXT NOT NULL DEFAULT '',
        group_ids TEXT[] NOT NULL,
        currency TEXT,
        amount TEXT,
        recurring_type TEXT,
        last_sent TEXT,
        recurring_active BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("✔️  messages 建立完成");

    // === settings ==========================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        line_api_token TEXT,
        line_channel_secret TEXT,
        last_synced TEXT,
        is_connected BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("✔️  settings 建立完成");

    console.log("🎉 所有資料表建立完成！");
  } catch (err) {
    console.error("❌ 建立資料表時發生錯誤：", err);
  } finally {
    client.release();
  }
}

initTables();

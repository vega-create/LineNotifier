import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// LINE Group schema
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lineId: text("line_id").notNull().unique(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  lineId: true,
});

// Message Template schema
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // e.g., 'meeting', 'holiday', 'project'
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  content: true,
  type: true,
});

// Message schema - 使用字符串表示日期，這樣更容易與前端交互
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  scheduledTime: text("scheduled_time").notNull(), // 改用text而不是timestamp
  endTime: text("end_time"),                       // 改用text而不是timestamp
  type: text("type").notNull(), // 'single' or 'periodic'
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'sent', 'failed'
  createdAt: text("created_at").notNull().default(''),
  groupIds: text("group_ids").array().notNull(), // Array of group IDs
  currency: text("currency"), // 'TWD', 'AUD', 'USD'
  amount: text("amount"), // 金額
});

// 對於Insert操作，使用自定義的Zod schema以確保更好的驗證
export const insertMessageSchema = z.object({
  title: z.string(),
  content: z.string(),
  scheduledTime: z.string(), // 明確使用string類型
  endTime: z.string().nullable().optional(), // 明確使用string類型，且可為空
  type: z.string(),
  status: z.string().default("scheduled"),
  groupIds: z.array(z.string()),
  currency: z.string().nullable().optional(),
  amount: z.string().nullable().optional(),
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  lineApiToken: text("line_api_token"),
  lineChannelSecret: text("line_channel_secret"),
  lastSynced: text("last_synced"), // 改用text而不是timestamp
  isConnected: boolean("is_connected").default(false),
});

// 直接使用基本schema
export const insertSettingsSchema = createInsertSchema(settings).pick({
  lineApiToken: true,
  lineChannelSecret: true,
  lastSynced: true,
  isConnected: true,
});

// Type definitions
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Frontend state types
export type MessageFormData = {
  title: string;
  content: string;
  type: 'single' | 'periodic';
  multiGroup: boolean;
  groups: string[];
  template: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  currency?: string; // 'TWD', 'AUD', 'USD'
  amount?: string; // 金額
};

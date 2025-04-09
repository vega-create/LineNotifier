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

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  endTime: timestamp("end_time"),
  type: text("type").notNull(), // 'single' or 'periodic'
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'sent', 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  groupIds: text("group_ids").array().notNull(), // Array of group IDs
  currency: text("currency"), // 'TWD', 'AUD', 'USD'
  amount: text("amount"), // 金額
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  title: true,
  content: true,
  scheduledTime: true,
  endTime: true,
  type: true,
  status: true,
  groupIds: true,
  currency: true,
  amount: true,
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  lineApiToken: text("line_api_token"),
  lineChannelSecret: text("line_channel_secret"),
  lastSynced: timestamp("last_synced"),
  isConnected: boolean("is_connected").default(false),
});

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

import { 
  Group, InsertGroup, 
  Template, InsertTemplate, 
  Message, InsertMessage, 
  Settings, InsertSettings,
  groups, templates, messages, settings
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Group operations
  getGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;

  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  // Group operations
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(groups)
      .set(group)
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup || undefined;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const result = await db.delete(groups).where(eq(groups.id, id));
    return !!result;
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return !!result;
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const now = new Date();
    const messageWithCreatedAt = {
      ...message,
      createdAt: now.toISOString(),
    };
    const [newMessage] = await db.insert(messages).values(messageWithCreatedAt).returning();
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set(message)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return !!result;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const allSettings = await db.select().from(settings);
    return allSettings[0] || undefined;
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    // 檢查是否已有設置
    const existingSettings = await this.getSettings();
    
    if (!existingSettings) {
      // 創建新設置
      const newSettings = {
        lineApiToken: settingsData.lineApiToken || "",
        lineChannelSecret: settingsData.lineChannelSecret || "",
        lastSynced: settingsData.lastSynced || new Date().toISOString(),
        isConnected: settingsData.isConnected || false,
      };
      const [created] = await db.insert(settings).values(newSettings).returning();
      return created;
    } else {
      // 更新現有設置
      const [updated] = await db
        .update(settings)
        .set(settingsData)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updated;
    }
  }
}

// Initialize with database storage
export const storage = new DatabaseStorage();

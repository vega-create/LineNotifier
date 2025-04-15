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

// 初始化數據
async function initializeDefaultData() {
  console.log("檢查並初始化默認數據...");
  
  try {
    // 檢查是否已有群組
    const existingGroups = await storage.getGroups();
    if (existingGroups.length === 0) {
      console.log("添加默認群組...");
      const defaultGroups: InsertGroup[] = [
        { name: "小幫手", lineId: "C24f17b1dc3008dc83f4c60bfe80f0db0" },
        { name: "Anna群", lineId: "Cc01842ccc97459ae901b6d4779d8f345" }, // 已確認此ID可以正常發送
        { name: "雅涵群", lineId: "C03ac887829a325a840fc462b91fcbbd7" },
        { name: "架站工作室（文良）", lineId: "Ce22eadb63c13baf632b0c7d5ac5536f4" },
        { name: "網站工程師（佑展工程師）", lineId: "Cc4237c4173ca718ab0e30eae2e7ca529" },
        { name: "Tina群", lineId: "C164037891996ce50ce13c0cba24e154f" },
        { name: "網站設計師（土蓉）", lineId: "Cf1b26d83e385242632b3970b3f8c622f" },
        { name: "工程師組", lineId: "C536c0214d33c80eeac1b084953dd168b" }
      ];

      for (const group of defaultGroups) {
        await storage.createGroup(group);
      }
    }

    // 檢查是否已有模板
    const existingTemplates = await storage.getTemplates();
    if (existingTemplates.length === 0) {
      console.log("添加默認模板...");
      const defaultTemplates: InsertTemplate[] = [
        { name: "自訂", content: "", type: "custom" },
        { name: "會議提醒", content: "【每日提醒】 明天早上開會囉！\n時間點：每週四 早上 10:00-11:00\n會議連結為：https://meet.google.com/wta-wwbd-yiw\n請填寫會議表單：https://mommystartup.work/開會表單\n專案表模板（請建立副本後再製作）：https://mommystartup.work/專案模板\n請確認報告內容：\n0.其他週表單填寫\n1.最後一週專案計畫進度與成效\n2.本週需要大家協助的地方", type: "meeting" },
        { name: "放假通知", content: "各位同仁好，\n智慧媽咪將於 5/1 勞動節放假一天，5/2 正常上班。\n如有緊急事項請聯繫主管。\n祝大家連假愉快！", type: "holiday" },
        { name: "專案進度詢問", content: "親愛的團隊成員：\n\nOOO客戶的網站專案進度如何？\n請回報最新進度，謝謝。", type: "project" },
        { name: "入帳通知", content: "親愛的客戶您好，\n我們已收到您的 6 月份款項。\n感謝您的支持！如有任何問題，歡迎隨時聯繫我們。", type: "payment" },
        { name: "發票寄送通知", content: "親愛的客戶您好，\n您的電子發票（FY-12345678）已寄至您的電子郵件信箱，請查收。\n如有任何問題，歡迎隨時聯繫我們。", type: "invoice" },
        { name: "自我介紹", content: "您好，\n\n我是智慧媽咪LINE通知系統，\n負責提醒各項事項，包含：\n會議通知、請款、入款、發票等寄送通知。", type: "introduction" },
        { name: "收款通知", content: "親愛的客戶您好，\n這是7月份的服務費用通知。請於5日前匯款至：\n\n彰化銀行 009\n帳號：96038605494000\n戶名：智慧媽咪國際有限公司\n\n發票將於收到款項後提供，感謝您的合作。", type: "payment" }
      ];

      for (const template of defaultTemplates) {
        await storage.createTemplate(template);
      }
    }

    // 檢查是否已有默認設置
    const existingSettings = await storage.getSettings();
    if (!existingSettings) {
      console.log("添加默認設置...");
      await storage.updateSettings({
        lineApiToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
        lineChannelSecret: process.env.LINE_CHANNEL_SECRET || "",
        lastSynced: new Date().toISOString(),
        isConnected: true
      });
    }

    console.log("數據初始化完成!");
  } catch (error) {
    console.error("初始化數據時出錯:", error);
  }
}

// 在應用啟動時初始化數據
initializeDefaultData().catch(err => {
  console.error("初始化數據失敗:", err);
});

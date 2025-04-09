import { 
  Group, InsertGroup, 
  Template, InsertTemplate, 
  Message, InsertMessage, 
  Settings, InsertSettings 
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private groups: Map<number, Group>;
  private templates: Map<number, Template>;
  private messages: Map<number, Message>;
  private settings: Settings | undefined;

  private groupId: number;
  private templateId: number;
  private messageId: number;

  constructor() {
    this.groups = new Map();
    this.templates = new Map();
    this.messages = new Map();
    
    this.groupId = 1;
    this.templateId = 1;
    this.messageId = 1;

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default groups
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

    defaultGroups.forEach(group => {
      this.createGroup(group);
    });

    // Add default templates
    const defaultTemplates: InsertTemplate[] = [
      { name: "自訂", content: "", type: "custom" },
      { name: "會議提醒", content: "親愛的團隊成員，請記得參加今天 14:00 的專案會議。地點：台北市松山區南京東路三段275號。", type: "meeting" },
      { name: "放假通知", content: "各位同仁好，\n智慧媽咪將於 5/1 勞動節放假一天，5/2 正常上班。\n如有緊急事項請聯繫主管。\n祝大家連假愉快！", type: "holiday" },
      { name: "專案進度詢問", content: "OOO客戶的網站專案進度如何？是否已完成首頁設計稿？請回報最新進度，謝謝。", type: "project" },
      { name: "入帳通知", content: "親愛的客戶您好，\n我們已收到您的 6 月份款項。\n感謝您的支持！如有任何問題，歡迎隨時聯繫我們。", type: "payment" },
      { name: "發票寄送通知", content: "親愛的客戶您好，\n您的電子發票（FY-12345678）已寄至您的電子郵件信箱，請查收。\n如有任何問題，歡迎隨時聯繫我們。", type: "invoice" },
      { name: "自我介紹", content: "您好，我是智慧媽咪LINE通知系統，負責提醒各項事項，包含：會議通知、請款、入款、發票等寄送通知。\n如需協助請洽客服：02-1234-5678", type: "introduction" },
      { name: "收款通知", content: "親愛的客戶您好，\n這是7月份的服務費用通知。請於5日前匯款至：\n\n彰化銀行 009\n帳號：96038605494000\n戶名：智慧媽咪國際有限公司\n\n發票將於收到款項後提供，感謝您的合作。", type: "payment" }
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });

    // Add sample messages
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const defaultMessages: InsertMessage[] = [
      {
        title: "會議提醒",
        content: "親愛的團隊成員，請記得參加今天 14:00 的專案會議。地點：台北市松山區南京東路三段275號。",
        scheduledTime: now.toISOString(),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        type: "single",
        status: "scheduled",
        groupIds: ["1"], // 小幫手群組
        currency: null,
        amount: null
      },
      {
        title: "專案進度詢問",
        content: "OOO客戶的網站專案進度如何？是否已完成首頁設計稿？請回報最新進度，謝謝。",
        scheduledTime: yesterday.toISOString(),
        endTime: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour later
        type: "single",
        status: "sent",
        groupIds: ["8"], // 工程師組
        currency: null,
        amount: null
      },
      {
        title: "收款通知",
        content: "親愛的客戶您好，\n這是7月份的服務費用通知。請於5日前匯款至：\n\n彰化銀行 009\n帳號：96038605494000\n戶名：智慧媽咪國際有限公司\n\n發票將於收到款項後提供，感謝您的合作。",
        scheduledTime: new Date(yesterday.setDate(yesterday.getDate() - 3)).toISOString(),
        endTime: new Date(yesterday.getTime() + 30 * 60 * 1000).toISOString(), // 30 min later
        type: "single",
        status: "sent",
        groupIds: ["2"], // Anna群
        currency: "TWD",
        amount: "5000"
      },
      {
        title: "入帳通知",
        content: "親愛的客戶您好，\n我們已收到您的 6 月份款項。\n感謝您的支持！如有任何問題，歡迎隨時聯繫我們。",
        scheduledTime: new Date(now.setDate(now.getDate() - 5)).toISOString(),
        endTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour later
        type: "single",
        status: "sent",
        groupIds: ["6"], // Tina群
        currency: "USD",
        amount: "1500"
      }
    ];

    defaultMessages.forEach(message => {
      this.createMessage(message);
    });

    // Initialize settings
    this.settings = {
      id: 1,
      lineApiToken: process.env.LINE_API_TOKEN || "",
      lineChannelSecret: process.env.LINE_CHANNEL_SECRET || "",
      lastSynced: new Date().toISOString(),
      isConnected: true
    };
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.groupId++;
    const newGroup: Group = { ...group, id };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  async updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group | undefined> {
    const existingGroup = this.groups.get(id);
    if (!existingGroup) {
      return undefined;
    }
    
    const updatedGroup: Group = { ...existingGroup, ...group };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<boolean> {
    return this.groups.delete(id);
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const id = this.templateId++;
    const newTemplate: Template = { ...template, id };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existingTemplate = this.templates.get(id);
    if (!existingTemplate) {
      return undefined;
    }
    
    const updatedTemplate: Template = { ...existingTemplate, ...template };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    
    // 直接使用字符串格式的日期
    const newMessage: Message = {
      id,
      title: messageData.title,
      content: messageData.content,
      type: messageData.type,
      status: messageData.status || "scheduled",
      createdAt: now.toISOString(),
      groupIds: messageData.groupIds,
      currency: messageData.currency || null,
      amount: messageData.amount || null,
      scheduledTime: messageData.scheduledTime || '',
      endTime: messageData.endTime || null
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message | undefined> {
    const existingMessage = this.messages.get(id);
    if (!existingMessage) {
      return undefined;
    }
    
    // 直接使用字符串格式的日期，不需要特殊處理
    const updatedMessage = { ...existingMessage, ...messageData };
    
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    // 直接使用字符串格式的日期，不需要特殊處理
    if (!this.settings) {
      // 創建新設置
      this.settings = {
        id: 1,
        lineApiToken: settingsData.lineApiToken || "",
        lineChannelSecret: settingsData.lineChannelSecret || "",
        lastSynced: settingsData.lastSynced || new Date().toISOString(),
        isConnected: settingsData.isConnected || false
      };
    } else {
      // 更新現有設置
      this.settings = { ...this.settings, ...settingsData };
    }
    
    return this.settings;
  }
}

export const storage = new MemStorage();

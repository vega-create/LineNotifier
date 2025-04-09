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
      { name: "小幫手", lineId: "line_group_1" },
      { name: "專案群組", lineId: "line_group_2" },
      { name: "部門通知", lineId: "line_group_3" },
      { name: "企劃部", lineId: "line_group_4" },
      { name: "研發團隊", lineId: "line_group_5" },
      { name: "行政部門", lineId: "line_group_6" }
    ];

    defaultGroups.forEach(group => {
      this.createGroup(group);
    });

    // Add default templates
    const defaultTemplates: InsertTemplate[] = [
      { name: "會議提醒", content: "親愛的團隊成員，請記得參加今天的會議。", type: "meeting" },
      { name: "放假通知", content: "親愛的同仁，公司將於下週一放假一天，請知悉。", type: "holiday" },
      { name: "專案進度詢問", content: "請各位夥伴回報目前的專案進度，謝謝！", type: "project" },
      { name: "入帳通知", content: "本月薪資已入帳，請查收，謝謝。", type: "payment" },
      { name: "發票寄送通知", content: "本月發票已寄出，請查收，謝謝。", type: "invoice" },
      { name: "自我介紹", content: "大家好，我是新加入的團隊成員。", type: "introduction" },
      { name: "收款通知", content: "本期款項已於今日收到，請確認入帳，謝謝。", type: "payment" }
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
        content: "親愛的團隊成員，請記得參加今天的會議。",
        scheduledTime: now,
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        type: "single",
        status: "scheduled",
        groupIds: ["1"] // Small helper group
      },
      {
        title: "專案進度詢問",
        content: "請各位夥伴回報目前的專案進度，謝謝！",
        scheduledTime: yesterday,
        endTime: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000), // 1 hour later
        type: "single",
        status: "sent",
        groupIds: ["5"] // Development team
      },
      {
        title: "收款通知",
        content: "本期款項已於今日收到，請確認入帳，謝謝。",
        scheduledTime: new Date(yesterday.setDate(yesterday.getDate() - 3)),
        endTime: new Date(yesterday.getTime() + 30 * 60 * 1000), // 30 min later
        type: "single",
        status: "sent",
        groupIds: ["6"] // Admin team
      }
    ];

    defaultMessages.forEach(message => {
      this.createMessage(message);
    });

    // Initialize settings
    this.settings = {
      id: 1,
      lineApiToken: process.env.LINE_API_TOKEN || "",
      lastSynced: new Date(),
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

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id,
      createdAt: now
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message | undefined> {
    const existingMessage = this.messages.get(id);
    if (!existingMessage) {
      return undefined;
    }
    
    const updatedMessage: Message = { ...existingMessage, ...message };
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

  async updateSettings(settings: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      this.settings = {
        id: 1,
        lineApiToken: settings.lineApiToken || "",
        lastSynced: settings.lastSynced || new Date(),
        isConnected: settings.isConnected || false
      };
    } else {
      this.settings = { ...this.settings, ...settings };
    }
    return this.settings;
  }
}

export const storage = new MemStorage();

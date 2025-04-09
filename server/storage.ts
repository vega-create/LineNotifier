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
      { name: "會議提醒", content: "【每日提醒】 明天早上開會囉！\n時間點：每週四 早上 10:00-11:00\n會議連結為：https://meet.google.com/wta-wwbd-yiw\n請填寫會議表單：https://mommystartup.work/開會表單\n專案表模板（請建立副本後再製作）：https://mommystartup.work/專案模板\n請確認報告內容：\n0.其他週表單填寫\n1.最後一週專案計畫進度與成效\n2.本週需要大家協助的地方", type: "meeting" },
      { name: "放假通知", content: "各位同仁好，\n智慧媽咪將於 5/1 勞動節放假一天，5/2 正常上班。\n如有緊急事項請聯繫主管。\n祝大家連假愉快！", type: "holiday" },
      { name: "專案進度詢問", content: "親愛的團隊成員：\n\nOOO客戶的網站專案進度如何？\n是否已完成首頁設計稿？\n請回報最新進度，謝謝。", type: "project" },
      { name: "入帳通知", content: "親愛的客戶您好，\n我們已收到您的 6 月份款項。\n感謝您的支持！如有任何問題，歡迎隨時聯繫我們。", type: "payment" },
      { name: "發票寄送通知", content: "親愛的客戶您好，\n您的電子發票（FY-12345678）已寄至您的電子郵件信箱，請查收。\n如有任何問題，歡迎隨時聯繫我們。", type: "invoice" },
      { name: "自我介紹", content: "您好，\n\n我是智慧媽咪LINE通知系統，\n負責提醒各項事項，包含：\n會議通知、請款、入款、發票等寄送通知。", type: "introduction" },
      { name: "收款通知", content: "親愛的客戶您好，\n這是7月份的服務費用通知。請於5日前匯款至：\n\n彰化銀行 009\n帳號：96038605494000\n戶名：智慧媽咪國際有限公司\n\n發票將於收到款項後提供，感謝您的合作。", type: "payment" }
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });

    // Add sample message
    const now = new Date();
    
    const defaultMessages: InsertMessage[] = [
      {
        title: "會議提醒",
        content: "【每日提醒】 明天早上開會囉！\n時間點：每週四 早上 10:00-11:00\n會議連結為：https://meet.google.com/wta-wwbd-yiw\n請填寫會議表單：https://mommystartup.work/開會表單\n專案表模板（請建立副本後再製作）：https://mommystartup.work/專案模板\n請確認報告內容：\n0.其他週表單填寫\n1.最後一週專案計畫進度與成效\n2.本週需要大家協助的地方",
        scheduledTime: now.toISOString(),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        type: "single",
        status: "scheduled",
        groupIds: ["2"], // Anna群
        currency: null,
        amount: null
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

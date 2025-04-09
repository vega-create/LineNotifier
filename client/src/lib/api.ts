import { apiRequest } from "./queryClient";
import { Group, Template, Message, Settings } from "@shared/schema";

export const api = {
  // Group endpoints
  getGroups: async (): Promise<Group[]> => {
    const res = await apiRequest("GET", "/api/groups");
    return await res.json();
  },
  
  createGroup: async (data: Omit<Group, "id">): Promise<Group> => {
    const res = await apiRequest("POST", "/api/groups", data);
    return await res.json();
  },
  
  updateGroup: async (id: number, data: Partial<Omit<Group, "id">>): Promise<Group> => {
    const res = await apiRequest("PUT", `/api/groups/${id}`, data);
    return await res.json();
  },
  
  deleteGroup: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/groups/${id}`);
  },
  
  // Template endpoints
  getTemplates: async (): Promise<Template[]> => {
    const res = await apiRequest("GET", "/api/templates");
    return await res.json();
  },
  
  createTemplate: async (data: Omit<Template, "id">): Promise<Template> => {
    const res = await apiRequest("POST", "/api/templates", data);
    return await res.json();
  },
  
  updateTemplate: async (id: number, data: Partial<Omit<Template, "id">>): Promise<Template> => {
    const res = await apiRequest("PUT", `/api/templates/${id}`, data);
    return await res.json();
  },
  
  deleteTemplate: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/templates/${id}`);
  },
  
  // Message endpoints
  getMessages: async (): Promise<Message[]> => {
    const res = await apiRequest("GET", "/api/messages");
    return await res.json();
  },
  
  createMessage: async (data: Omit<Message, "id" | "createdAt">): Promise<Message> => {
    const res = await apiRequest("POST", "/api/messages", data);
    return await res.json();
  },
  
  updateMessage: async (id: number, data: Partial<Omit<Message, "id" | "createdAt">>): Promise<Message> => {
    const res = await apiRequest("PUT", `/api/messages/${id}`, data);
    return await res.json();
  },
  
  deleteMessage: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/messages/${id}`);
  },
  
  // Settings endpoints
  getSettings: async (): Promise<Settings> => {
    const res = await apiRequest("GET", "/api/settings");
    return await res.json();
  },
  
  updateSettings: async (data: Partial<Omit<Settings, "id">>): Promise<Settings> => {
    const res = await apiRequest("PUT", "/api/settings", data);
    return await res.json();
  },
  
  // Send message
  sendMessage: async (messageId: number): Promise<void> => {
    await apiRequest("POST", "/api/send-message", { messageId });
  },
  
  // 測試發送功能 - 直接發送訊息不經過排程
  testSend: async (groupId: number, content: string): Promise<any> => {
    const res = await apiRequest("POST", "/api/test-send", { groupId, content });
    return await res.json();
  }
};

import express, { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertGroupSchema,
  insertTemplateSchema,
  insertMessageSchema,
  insertSettingsSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Error handling middleware for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  };

  // Group endpoints
  router.get("/groups", async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  router.post("/groups", async (req: Request, res: Response) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.put("/groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const groupData = insertGroupSchema.partial().parse(req.body);
      const updatedGroup = await storage.updateGroup(id, groupData);
      
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json(updatedGroup);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.delete("/groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGroup(id);
      
      if (!success) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting group:", err);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Template endpoints
  router.get("/templates", async (_req: Request, res: Response) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  router.post("/templates", async (req: Request, res: Response) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.put("/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = insertTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateTemplate(id, templateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.delete("/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTemplate(id);
      
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting template:", err);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Message endpoints
  router.get("/messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  router.post("/messages", async (req: Request, res: Response) => {
    try {
      // 將ISO字符串轉換為Date對象
      const requestData = { ...req.body };
      
      // 處理scheduledTime
      if (requestData.scheduledTime && typeof requestData.scheduledTime === 'string') {
        try {
          requestData.scheduledTime = new Date(requestData.scheduledTime);
        } catch (e) {
          return res.status(400).json({ error: "Invalid scheduledTime date format" });
        }
      }
      
      // 處理endTime
      if (requestData.endTime && typeof requestData.endTime === 'string') {
        try {
          requestData.endTime = new Date(requestData.endTime);
        } catch (e) {
          return res.status(400).json({ error: "Invalid endTime date format" });
        }
      }
      
      const messageData = insertMessageSchema.parse(requestData);
      const message = await storage.createMessage(messageData);

      // In a real implementation, this would send the message to LINE
      // or schedule it for sending later
      
      res.status(201).json(message);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.put("/messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // 將ISO字符串轉換為Date對象
      const requestData = { ...req.body };
      
      // 處理scheduledTime
      if (requestData.scheduledTime && typeof requestData.scheduledTime === 'string') {
        try {
          requestData.scheduledTime = new Date(requestData.scheduledTime);
        } catch (e) {
          return res.status(400).json({ error: "Invalid scheduledTime date format" });
        }
      }
      
      // 處理endTime
      if (requestData.endTime && typeof requestData.endTime === 'string') {
        try {
          requestData.endTime = new Date(requestData.endTime);
        } catch (e) {
          return res.status(400).json({ error: "Invalid endTime date format" });
        }
      }
      
      const messageData = insertMessageSchema.partial().parse(requestData);
      const updatedMessage = await storage.updateMessage(id, messageData);
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(updatedMessage);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  router.delete("/messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMessage(id);
      
      if (!success) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Settings endpoints
  router.get("/settings", async (_req: Request, res: Response) => {
    try {
      let settings = await storage.getSettings();
      
      // 將環境變量設定優先於數據庫設定
      const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const envSecret = process.env.LINE_CHANNEL_SECRET;
      
      // 如果存在環境變量設定，優先使用環境變量
      if (envToken || envSecret) {
        const lastSyncedDate = settings?.lastSynced ? new Date(settings.lastSynced) : new Date();
        
        const updatedSettings = {
          ...(settings || {}),
          lineApiToken: envToken || settings?.lineApiToken,
          lineChannelSecret: envSecret || settings?.lineChannelSecret,
          // 如果有環境變量，表示我們有正確的設定，可以標記為已連接
          isConnected: Boolean(envToken && envSecret) || settings?.isConnected || false,
          lastSynced: lastSyncedDate
        };
        
        // 更新資料庫中的設定
        settings = await storage.updateSettings(updatedSettings);
      }
      
      res.json(settings || {});
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  router.put("/settings", async (req: Request, res: Response) => {
    try {
      // 確保lastSynced是一個有效的日期
      let settingsData = { ...req.body };
      if (typeof settingsData.lastSynced === 'string') {
        try {
          // 嘗試解析日期字符串
          new Date(settingsData.lastSynced);
        } catch (e) {
          // 如果無法解析，使用當前時間
          settingsData.lastSynced = new Date().toISOString();
        }
      }
      
      const parsedData = insertSettingsSchema.partial().parse(settingsData);
      const updatedSettings = await storage.updateSettings(parsedData);
      res.json(updatedSettings);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Helper function to send LINE messages
  async function sendLineMessage(
    lineGroupId: string, 
    content: string, 
    lineApiToken?: string
  ) {
    try {
      const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
      
      // 優先使用環境變量中的ACCESS TOKEN，如果沒有則使用傳入的token
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || lineApiToken;
      
      if (!token) {
        throw new Error("LINE Channel Access Token not found");
      }
      
      const response = await fetch(LINE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          to: lineGroupId,
          messages: [
            {
              type: "text",
              text: content
            }
          ]
        })
      });
      
      const result = await response.json() as any;
      
      if (!response.ok) {
        console.error("LINE API Error:", result);
        throw new Error(`LINE API Error: ${result.message || JSON.stringify(result)}`);
      }
      
      return result;
    } catch (error) {
      console.error("Failed to send LINE message:", error);
      throw error;
    }
  }

  // Send message to LINE
  router.post("/send-message", async (req: Request, res: Response) => {
    try {
      const { messageId } = req.body;
      
      if (!messageId) {
        return res.status(400).json({ error: "messageId is required" });
      }
      
      const message = await storage.getMessage(parseInt(messageId));
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      // Get LINE API settings
      const settings = await storage.getSettings();
      
      if (!settings || !settings.lineApiToken) {
        return res.status(400).json({ error: "LINE API Token is not configured" });
      }
      
      // Ensure lineApiToken is not null
      const lineApiToken = settings.lineApiToken || "";
      
      // Get groups to send to
      const groups = await Promise.all(
        message.groupIds.map(async (groupId) => {
          return await storage.getGroup(parseInt(groupId));
        })
      );
      
      const validGroups = groups.filter(g => g !== undefined) as any[];
      
      if (validGroups.length === 0) {
        return res.status(400).json({ error: "No valid groups found for this message" });
      }
      
      // Format message content - add currency and amount if present
      let finalContent = message.content;
      
      if (message.currency && message.amount) {
        let currencySymbol = "";
        if (message.currency === "TWD") currencySymbol = "NT$";
        else if (message.currency === "USD") currencySymbol = "US$";
        else if (message.currency === "AUD") currencySymbol = "AU$";
        
        // Add currency+amount if not already in the content
        if (!finalContent.includes(`${currencySymbol}${message.amount}`)) {
          finalContent += `\n\n金額: ${currencySymbol}${message.amount}`;
        }
      }
      
      // Send message to all groups
      const results = await Promise.all(
        validGroups.map(async (group) => {
          try {
            // Using actual LINE API integration
            const result = await sendLineMessage(
              group.lineId, 
              finalContent, 
              lineApiToken
            );
            return { groupId: group.id, success: true, result };
          } catch (error) {
            console.error(`Failed to send to group ${group.name}:`, error);
            return { groupId: group.id, success: false, error: String(error) };
          }
        })
      );
      
      // Update message status based on sending results
      const allSuccessful = results.every(r => r.success);
      const newStatus = allSuccessful ? "sent" : "partial";
      
      // If message was successfully sent, delete it
      let response;
      if (allSuccessful) {
        // Delete the message if successfully sent
        await storage.deleteMessage(message.id);
        response = { 
          success: true, 
          deleted: true,
          results
        };
      } else {
        // If not fully successful, just update status
        const updatedMessage = await storage.updateMessage(message.id, {
          status: newStatus
        });
        
        response = { 
          success: false, 
          message: updatedMessage,
          results
        };
      }
      
      res.json(response);
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // 測試 LINE API 連接
  router.post("/test-line-connection", async (req: Request, res: Response) => {
    try {
      // 檢查環境變量是否設定
      const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const envSecret = process.env.LINE_CHANNEL_SECRET;
      
      if (!envToken || !envSecret) {
        // 嘗試從請求中獲取
        const { lineApiToken, lineChannelSecret } = req.body;
        
        if (!lineApiToken || !lineChannelSecret) {
          return res.status(400).json({ 
            success: false, 
            error: "缺少 LINE API Token 或 Channel Secret" 
          });
        }
        
        // 使用請求中的憑證
        // 這裡我們只是測試連接，不實際發送訊息
        // 可以用下面的代碼檢查 TOKEN 是否有效
        const LINE_API_URL = "https://api.line.me/v2/bot/info";
        
        const response = await fetch(LINE_API_URL, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${lineApiToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`LINE API 連接失敗: ${response.status} ${response.statusText}`);
        }
        
        // 更新設置
        const settings = await storage.getSettings();
        await storage.updateSettings({
          ...(settings || {}),
          lineApiToken,
          lineChannelSecret,
          isConnected: true,
          lastSynced: new Date()
        });
        
        res.json({ success: true });
      } else {
        // 使用環境變量測試連接
        const LINE_API_URL = "https://api.line.me/v2/bot/info";
        
        const response = await fetch(LINE_API_URL, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${envToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`LINE API 連接失敗: ${response.status} ${response.statusText}`);
        }
        
        // 更新設置
        const settings = await storage.getSettings();
        await storage.updateSettings({
          ...(settings || {}),
          lineApiToken: envToken,
          lineChannelSecret: envSecret,
          isConnected: true,
          lastSynced: new Date()
        });
        
        res.json({ success: true });
      }
    } catch (error) {
      console.error("LINE API 連接測試失敗:", error);
      res.status(400).json({ 
        success: false, 
        error: `連線測試失敗: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

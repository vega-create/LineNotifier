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
      // 直接使用body數據，但先進行驗證
      const messageData = req.body;
      console.log("POST /messages - Received data:", JSON.stringify(messageData));
      
      // 手動驗證Zod schema
      try {
        const validated = insertMessageSchema.parse(messageData);
        console.log("Validation passed:", validated);
        const message = await storage.createMessage(validated);
        
        // In a real implementation, this would send the message to LINE
        // or schedule it for sending later
        
        res.status(201).json(message);
      } catch (zodError) {
        console.error("Zod validation error:", zodError);
        return res.status(400).json({ 
          error: `Validation error: ${zodError instanceof Error ? zodError.message : String(zodError)}`
        });
      }
    } catch (err) {
      console.error("POST /messages - Error:", err);
      console.error("Request body:", JSON.stringify(req.body));
      if (err instanceof Error) {
        return res.status(500).json({ error: err.message });
      }
      handleZodError(err, res);
    }
  });

  router.put("/messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // 直接使用body數據，但先進行驗證
      const messageData = req.body;
      console.log("PUT /messages/:id - Received data:", JSON.stringify(messageData));
      
      // 手動驗證Zod schema，使用partial()允許部分更新
      try {
        // 使用partial()允許只更新部分字段
        const validated = insertMessageSchema.partial().parse(messageData);
        console.log("Validation passed:", validated);
        const updatedMessage = await storage.updateMessage(id, validated);
        
        if (!updatedMessage) {
          return res.status(404).json({ error: "Message not found" });
        }
        
        res.json(updatedMessage);
      } catch (zodError) {
        console.error("Zod validation error:", zodError);
        return res.status(400).json({ 
          error: `Validation error: ${zodError instanceof Error ? zodError.message : String(zodError)}`
        });
      }
    } catch (err) {
      console.error("PUT /messages/:id - Error:", err);
      if (err instanceof Error) {
        return res.status(500).json({ error: err.message });
      }
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
        const lastSyncedDate = new Date().toISOString();
        
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
      // 直接使用body數據，因為我們已經修改了insertSettingsSchema來接受字符串日期
      const parsedData = insertSettingsSchema.partial().parse(req.body);
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
      
      console.log(`實際發送Line訊息：群組ID=${lineGroupId}，Token長度=${token.length}字元，內容長度=${content.length}字元`);
      
      // 檢查LINE群組ID是否有效
      if (!lineGroupId || lineGroupId.trim() === "") {
        throw new Error("Invalid LINE Group ID - Group ID is empty");
      }
      
      // 檢查GROUP ID格式，LINE群組ID通常以C開頭並且長度約為33個字元
      if (!lineGroupId.startsWith("C") || lineGroupId.length < 20) {
        console.warn(`Suspicious LINE Group ID: ${lineGroupId} - format may be invalid`);
      }
      
      const requestBody = {
        to: lineGroupId,
        messages: [
          {
            type: "text",
            text: content
          }
        ]
      };
      
      console.log("發送LINE訊息requestBody:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(LINE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // 不論是否成功都獲取響應
      let resultText = '';
      try {
        resultText = await response.text();
        console.log(`LINE API原始回應: ${resultText}`);
      } catch (e) {
        console.error("無法讀取回應內容:", e);
      }
      
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        result = { raw: resultText };
        console.error("無法解析JSON回應:", e);
      }
      
      if (!response.ok) {
        console.error(`LINE API錯誤: 狀態碼=${response.status}, 訊息=${response.statusText}`);
        console.error("LINE API錯誤詳情:", result);
        throw new Error(`LINE API Error (${response.status}): ${result.message || resultText}`);
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
            console.log(`嘗試發送訊息到群組: ${group.name} (ID: ${group.lineId})`);
            console.log(`使用的訊息內容: ${finalContent}`);
            console.log(`Line API Token長度: ${lineApiToken ? lineApiToken.length : 0}`);
            
            // Using actual LINE API integration
            const result = await sendLineMessage(
              group.lineId, 
              finalContent, 
              lineApiToken
            );
            
            console.log(`發送成功，API回應:`, result);
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
        try {
          // Delete the message if successfully sent
          const deleteResult = await storage.deleteMessage(message.id);
          
          console.log(`Message ${message.id} was successfully sent and deleted (result: ${deleteResult})`);
          
          response = { 
            success: true, 
            deleted: true,
            results
          };
        } catch (err) {
          console.error(`Error deleting message: ${err}`);
          
          // 如果刪除失敗，仍然將狀態更新為已發送
          try {
            const updatedMessage = await storage.updateMessage(message.id, {
              status: "sent"
            });
            
            response = { 
              success: true, 
              message: updatedMessage,
              deleteError: `刪除訊息失敗: ${err}`,
              results
            };
          } catch (updateErr) {
            console.error(`Also failed to update message status: ${updateErr}`);
            response = { 
              success: true, 
              error: `訊息發送成功但刪除及更新狀態均失敗: ${err}, ${updateErr}`,
              results
            };
          }
        }
      } else {
        // If not fully successful, just update status
        try {
          const updatedMessage = await storage.updateMessage(message.id, {
            status: newStatus
          });
          
          response = { 
            success: false, 
            message: updatedMessage,
            results
          };
        } catch (err) {
          console.error(`Error updating message status to ${newStatus}: ${err}`);
          response = { 
            success: false, 
            error: `更新訊息狀態失敗: ${err}`,
            results
          };
        }
      }
      
      res.json(response);
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ 
        error: "Failed to send message", 
        details: err instanceof Error ? err.message : String(err) 
      });
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
          lastSynced: new Date().toISOString()
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
          lastSynced: new Date().toISOString()
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

import express, { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertGroupSchema,
  insertTemplateSchema,
  insertMessageSchema,
  insertSettingsSchema,
  Group
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fetch from "node-fetch";
import moment from "moment-timezone";

// 將默認時區設置為台灣時間
moment.tz.setDefault("Asia/Taipei");

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // LINE相關功能已移除 - 使用者使用另一個機器人處理群組ID查詢
  
  // 新增訊息檢查計時器 - 每分鐘檢查一次，查找需要發送的訊息
  let messageCheckInterval: NodeJS.Timeout | null = null;

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
  
  // 查詢群組ID - 支持模糊搜索
  router.get("/groups/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: "查詢關鍵字是必須的" });
      }
      
      const searchQuery = String(query).toLowerCase();
      const groups = await storage.getGroups();
      
      // 根據名稱或ID模糊匹配
      const matchedGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery) || 
        group.lineId.toLowerCase().includes(searchQuery)
      );
      
      if (matchedGroups.length === 0) {
        return res.json({ 
          found: false, 
          message: `沒有找到包含 "${query}" 的群組`,
          groups: []
        });
      }
      
      res.json({ 
        found: true, 
        message: `找到 ${matchedGroups.length} 個匹配的群組`,
        groups: matchedGroups
      });
    } catch (error) {
      console.error("搜索群組時發生錯誤:", error);
      res.status(500).json({ error: "搜索群組失敗", details: String(error) });
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
      
      try {
        // 驗證數據
        const validated = insertMessageSchema.parse(messageData);
        console.log("Validation passed:", validated);
        
        // 創建消息
        const message = await storage.createMessage(validated);
        
        // 處理排程發送邏輯 - 使用moment-timezone確保時區一致性
        // 將排程時間和當前時間都轉換為台灣時間
        const scheduledTimeTW = moment(message.scheduledTime || Date.now()).tz("Asia/Taipei");
        const nowTW = moment().tz("Asia/Taipei");
        
        console.log(`訊息已創建 ID: ${message.id}`);
        console.log(`排程時間 (UTC): ${scheduledTimeTW.toDate().toISOString()}`);
        console.log(`當前時間 (UTC): ${nowTW.toDate().toISOString()}`);
        
        // 使用moment格式化日期時間
        console.log(`排程時間 (台灣): ${scheduledTimeTW.format("YYYY/MM/DD HH:mm:ss")} 台灣時間`);
        console.log(`當前時間 (台灣): ${nowTW.format("YYYY/MM/DD HH:mm:ss")} 台灣時間`);
        
        // 計算距離排程時間的毫秒數 - 使用moment的diff函數
        let timeToScheduled = scheduledTimeTW.diff(nowTW);
        console.log(`預計等待時間: ${Math.round(timeToScheduled / 60000)} 分鐘`);
        
        // 僅當排程時間已過才立即發送，否則按照排程時間發送
        if (timeToScheduled <= 0) {
          console.log(`排程時間已過，立即發送訊息 (ID: ${message.id})`);
          timeToScheduled = 1000; // 使用1秒延遲讓伺服器有時間回應API請求
        }

        // 輸出預計發送時間
        console.log(`訊息將在指定時間（${scheduledTimeTW.format("YYYY/MM/DD HH:mm:ss")} 台灣時間）自動發送 (ID: ${message.id})`);
        
        // 設定發送任務
        setTimeout(async () => {
          try {
            // 檢查訊息是否仍然存在
            const messageToSend = await storage.getMessage(message.id);
            if (!messageToSend) {
              console.log(`訊息 ID: ${message.id} 已不存在，跳過自動發送`);
              return;
            }
            
            console.log(`開始發送排程訊息 (ID: ${message.id})`);
            
            // 獲取LINE API設定
            const settings = await storage.getSettings();
            if (!settings || !settings.lineApiToken) {
              console.error("無法獲取LINE API設定，跳過發送");
              return;
            }
            
            // 獲取群組資訊
            const groups = await Promise.all(
              messageToSend.groupIds.map(async groupId => {
                return await storage.getGroup(parseInt(groupId));
              })
            );
            
            const validGroups = groups.filter(g => g !== undefined) as Group[];
            
            if (validGroups.length === 0) {
              console.error("找不到有效的群組，跳過發送");
              return;
            }
            
            // 格式化訊息內容
            let finalContent = messageToSend.content;
            
            // 添加幣別和金額
            if (messageToSend.currency && messageToSend.amount) {
              let currencySymbol = "";
              if (messageToSend.currency === "TWD") currencySymbol = "NT$";
              else if (messageToSend.currency === "USD") currencySymbol = "US$";
              else if (messageToSend.currency === "AUD") currencySymbol = "AU$";
              
              if (!finalContent.includes(`${currencySymbol}${messageToSend.amount}`)) {
                finalContent += `\n\n金額: ${currencySymbol}${messageToSend.amount}`;
              }
            }
            
            // 進行分段處理
            finalContent = finalContent.replace(/。(?!\n)/g, "。\n");
            
            // 發送訊息到所有群組
            let allSuccess = true;
            for (const group of validGroups) {
              try {
                console.log(`嘗試發送訊息到群組: ${group.name} (ID: ${group.lineId})`);
                
                // 使用實際的LINE API發送訊息
                await sendLineMessage(
                  group.lineId,
                  finalContent,
                  settings.lineApiToken || ""
                );
                
                console.log(`發送成功到群組: ${group.name}`);
              } catch (error) {
                console.error(`發送到群組 ${group.name} 失敗:`, error);
                allSuccess = false;
              }
            }
            
            // 更新訊息狀態
            const newStatus = allSuccess ? "sent" : "partial";
            await storage.updateMessage(message.id, { status: newStatus });
            
            // 處理訊息發送後的邏輯 - 支持週期性發送
            if (allSuccess) {
              if (messageToSend.type === "periodic" && messageToSend.recurringActive) {
                // 週期性訊息：更新最後發送時間，並將狀態重設為排程中
                const now = new Date();
                await storage.updateMessage(message.id, { 
                  lastSent: now.toISOString(),
                  status: "scheduled" // 重置狀態，等待下次發送
                });
                console.log(`週期性訊息 ID: ${message.id} 已更新最後發送時間並保留排程`);
              } else {
                // 單次訊息：發送成功後刪除
                console.log(`訊息 ID: ${message.id} 已成功發送，現在將其刪除`);
                await storage.deleteMessage(message.id);
              }
            }
            
            console.log(`排程訊息處理完成 (ID: ${message.id})`);
          } catch (error) {
            console.error(`發送排程訊息時發生錯誤 (ID: ${message.id}):`, error);
          }
        }, timeToScheduled);
        
        // 回應客戶端
        res.status(201).json(message);
        
      } catch (zodError) {
        console.error("Zod validation error:", zodError);
        return res.status(400).json({ 
          error: `驗證錯誤: ${zodError instanceof Error ? zodError.message : String(zodError)}`
        });
      }
    } catch (err) {
      console.error("POST /messages - Error:", err);
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

  // 檢查並發送週期性訊息
  // 設置定時任務，每分鐘檢查一次
  setInterval(async () => {
    try {
      console.log("檢查週期性訊息排程...");
      const messages = await storage.getMessages();
      
      // 篩選出週期性且啟用的訊息
      const recurringMessages = messages.filter(m => 
        m.type === "periodic" && m.recurringActive && m.status === "scheduled");
      
      if (recurringMessages.length === 0) {
        console.log("沒有找到啟用的週期性訊息");
        return;
      }
      
      console.log(`找到 ${recurringMessages.length} 個啟用的週期性訊息`);
      
      // 使用moment-timezone獲取台灣當前時間
      const nowTW = moment().tz("Asia/Taipei");
      
      for (const message of recurringMessages) {
        try {
          // 使用moment-timezone轉換時間
          // 如果沒有最後發送時間，則設置為訊息創建時間
          const lastSentTW = message.lastSent 
            ? moment(message.lastSent).tz("Asia/Taipei") 
            : moment(message.createdAt || message.scheduledTime).tz("Asia/Taipei");
            
          const scheduledTimeTW = moment(message.scheduledTime).tz("Asia/Taipei");
          
          // 檢查是否應該發送（根據週期性類型判斷）
          let shouldSend = false;
          
          // 從排程時間獲取台灣時間的小時和分鐘，作為每天發送的時間點
          const scheduledHour = scheduledTimeTW.hour();
          const scheduledMinute = scheduledTimeTW.minute();
          
          // 當前台灣時間的小時和分鐘
          const currentHour = nowTW.hour();
          const currentMinute = nowTW.minute();
          
          console.log(`檢查週期性訊息 ID: ${message.id}, 標題: ${message.title}`);
          console.log(`上次發送時間: ${lastSentTW.format("YYYY/MM/DD HH:mm:ss")}`);
          console.log(`排程時間: ${scheduledTimeTW.format("YYYY/MM/DD HH:mm:ss")}, ${scheduledHour}:${scheduledMinute}`);
          console.log(`當前時間: ${nowTW.format("YYYY/MM/DD HH:mm:ss")}, ${currentHour}:${currentMinute}`);
          console.log(`週期類型: ${message.recurringType}`);
          
          // 使用moment-timezone處理週期性判斷
          switch (message.recurringType) {
            case "daily":
              // 如果當前時間與設定時間相符（小時和分鐘），且上次發送不是今天
              if (currentHour === scheduledHour && 
                  currentMinute >= scheduledMinute && 
                  currentMinute < scheduledMinute + 5) { // 5分鐘內為有效執行時間
                  
                // 檢查是否已經在今天發送過
                const isSameDay = lastSentTW.isSame(nowTW, 'day');
                if (!isSameDay) {
                  shouldSend = true;
                  console.log(`每日訊息該發送了: ${message.title}`);
                } else {
                  console.log(`每日訊息今天已發送過: ${message.title}`);
                }
              }
              break;
              
            case "weekly":
              // 如果當前時間與設定時間相符，且是同一個星期幾，且上次發送不是本週
              if (currentHour === scheduledHour && 
                  currentMinute >= scheduledMinute && 
                  currentMinute < scheduledMinute + 5 &&
                  nowTW.day() === scheduledTimeTW.day()) { // 同一個星期幾
                  
                // 檢查是否已經在本週發送過
                const isSameWeek = lastSentTW.isSame(nowTW, 'week');
                if (!isSameWeek) {
                  shouldSend = true;
                  console.log(`每週訊息該發送了: ${message.title}`);
                } else {
                  console.log(`每週訊息本週已發送過: ${message.title}`);
                }
              }
              break;
              
            case "monthly":
              // 如果當前時間與設定時間相符，且是同一個月份日期，且上次發送不是本月
              if (currentHour === scheduledHour && 
                  currentMinute >= scheduledMinute && 
                  currentMinute < scheduledMinute + 5 &&
                  nowTW.date() === scheduledTimeTW.date()) { // 同一個月份日期
                  
                // 檢查是否已經在本月發送過
                const isSameMonth = lastSentTW.isSame(nowTW, 'month');
                if (!isSameMonth) {
                  shouldSend = true;
                  console.log(`每月訊息該發送了: ${message.title}`);
                } else {
                  console.log(`每月訊息本月已發送過: ${message.title}`);
                }
              }
              break;
              
            case "yearly":
              // 如果當前時間與設定時間相符，且是同一個月份和日期，且上次發送不是今年
              if (currentHour === scheduledHour && 
                  currentMinute >= scheduledMinute && 
                  currentMinute < scheduledMinute + 5 &&
                  nowTW.date() === scheduledTimeTW.date() && 
                  nowTW.month() === scheduledTimeTW.month()) { // 同一個月份和日期
                  
                // 檢查是否已經在今年發送過
                const isSameYear = lastSentTW.isSame(nowTW, 'year');
                if (!isSameYear) {
                  shouldSend = true;
                  console.log(`每年訊息該發送了: ${message.title}`);
                } else {
                  console.log(`每年訊息今年已發送過: ${message.title}`);
                }
              }
              break;
          }
          
          // 如果應該發送，執行發送邏輯
          if (shouldSend) {
            console.log(`正在發送週期性訊息 ID: ${message.id}, 標題: ${message.title}`);
            
            // 獲取所有群組
            const groups = await Promise.all(
              message.groupIds.map(async (groupId) => {
                return await storage.getGroup(parseInt(groupId));
              })
            );
            
            const validGroups = groups.filter(g => g !== undefined) as Group[];
            
            if (validGroups.length === 0) {
              console.error("找不到有效的群組，跳過發送");
              continue;
            }
            
            // 格式化訊息內容
            let finalContent = message.content;
            
            if (message.currency && message.amount) {
              let currencySymbol = "";
              if (message.currency === "TWD") currencySymbol = "NT$";
              else if (message.currency === "USD") currencySymbol = "US$";
              else if (message.currency === "AUD") currencySymbol = "AU$";
              
              if (!finalContent.includes(`${currencySymbol}${message.amount}`)) {
                finalContent += `\n\n金額: ${currencySymbol}${message.amount}`;
              }
            }
            
            // 進行分段處理
            finalContent = finalContent.replace(/。(?!\n)/g, "。\n");
            
            // 獲取LINE API設定
            const settings = await storage.getSettings();
            
            if (!settings || (!settings.lineApiToken && !process.env.LINE_CHANNEL_ACCESS_TOKEN)) {
              console.error("LINE API Token未配置，跳過發送");
              continue;
            }
            
            // 發送訊息到所有群組
            let allSuccess = true;
            for (const group of validGroups) {
              try {
                console.log(`嘗試發送週期性訊息到群組: ${group.name} (ID: ${group.lineId})`);
                console.log(`使用的訊息內容: ${finalContent}`);
                
                // 使用實際的LINE API發送訊息
                await sendLineMessage(
                  group.lineId,
                  finalContent,
                  settings.lineApiToken || ""
                );
                
                console.log(`週期性訊息發送成功到群組: ${group.name}`);
              } catch (error) {
                console.error(`週期性訊息發送到群組 ${group.name} 失敗:`, error);
                allSuccess = false;
              }
            }
            
            // 更新訊息狀態和最後發送時間
            const newStatus = "scheduled"; // 週期性訊息保持排程狀態
            await storage.updateMessage(message.id, { 
              status: newStatus,
              lastSent: nowTW.toDate().toISOString() // 使用moment的台灣時間
            });
            
            console.log(`週期性訊息 ID: ${message.id} 已處理完畢，結果: ${allSuccess ? '成功' : '部分失敗'}`);
          }
        } catch (error) {
          console.error(`處理週期性訊息 ID: ${message.id} 時發生錯誤:`, error);
        }
      }
    } catch (error) {
      console.error("檢查週期性訊息時發生錯誤:", error);
    }
  }, 1 * 60 * 1000); // 1分鐘檢查一次
  
  // 輔助函數：使用moment-timezone格式化台灣時間（GMT+8）
  function formatTaiwanTime(date: Date): string {
    // 使用moment-timezone將UTC時間轉換為台灣時間
    return moment(date).tz("Asia/Taipei").format("YYYY/MM/DD HH:mm:ss") + " 台灣時間";
  }
  
  // 輔助函數：取得台灣當前時間(Date物件)
  function getTaiwanTime(): Date {
    return moment().tz("Asia/Taipei").toDate();
  }
  
  // 輔助函數：將UTC日期轉換為台灣時間的Date物件
  function convertToTaiwanTime(date: Date): Date {
    return moment(date).tz("Asia/Taipei").toDate();
  }

  // Helper function to send LINE messages
  async function sendLineMessage(
    lineGroupId: string, 
    content: string, 
    lineApiToken?: string
  ) {
    try {
      // 使用原始的push API
      const LINE_API_URL = "https://api.line.me/v2/bot/message/push"; 
      console.log(`發送訊息到LINE API的URL: ${LINE_API_URL}`);
      
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
      
      // 修改為最新的LINE API規範格式
      let requestBody;
      
      // 使用原始的push API格式
      requestBody = {
        to: lineGroupId,
        messages: [
          {
            type: "text",
            text: content
          }
        ]
      };
      console.log("使用Push訊息API");
      
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
      
      // 檢查回應是否為HTML格式（通常是錯誤頁面）
      if (resultText.trim().startsWith('<!DOCTYPE') || resultText.trim().startsWith('<html')) {
        console.error("收到HTML回應而非JSON:", resultText.substring(0, 200) + "...");
        throw new Error("LINE API 返回了HTML頁面而非JSON，可能是TOKEN無效或API伺服器問題");
      }
      
      let result;
      try {
        if (resultText.trim()) {
          result = JSON.parse(resultText);
        } else {
          // 空回應處理
          result = { success: true, note: "Empty response from LINE API (this is sometimes normal)" };
        }
      } catch (e) {
        console.error("無法解析JSON回應:", e);
        console.error("原始文本:", resultText);
        result = { raw: resultText };
        // 不拋出錯誤，繼續處理
      }
      
      if (!response.ok) {
        console.error(`LINE API錯誤: 狀態碼=${response.status}, 訊息=${response.statusText}`);
        console.error("LINE API錯誤詳情:", result);
        throw new Error(`LINE API Error (${response.status}): ${result?.message || response.statusText || resultText}`);
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
      
      // 不再添加發送時間
      // 對訊息內容進行分段處理
      finalContent = finalContent.replace(/。(?!\n)/g, "。\n");
      
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
      
      // 處理成功發送後的邏輯
      let response;
      if (allSuccessful) {
        try {
          // 檢查是否為週期性訊息並且已啟用週期性發送
          if (message.type === "periodic" && message.recurringActive) {
            // 更新最後發送時間並重置狀態為排程中 (使用台灣時間)
            const taiwanNow = moment().tz("Asia/Taipei");
            const updatedMessage = await storage.updateMessage(message.id, {
              lastSent: taiwanNow.toDate().toISOString(),
              status: "scheduled" // 重置狀態，等待下次發送
            });
            
            console.log(`週期性訊息 ID: ${message.id} [${message.title}] 已更新最後發送時間並保留排程`);
            
            response = {
              success: true,
              recurring: true,
              message: updatedMessage,
              results
            };
          } else {
            // 非週期性訊息或未啟用週期，則刪除
            const deleteResult = await storage.deleteMessage(message.id);
            
            console.log(`Message ${message.id} was successfully sent and deleted (result: ${deleteResult})`);
            
            response = { 
              success: true, 
              deleted: true,
              results
            };
          }
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

  // 測試發送LINE訊息
  router.post("/test-send", async (req: Request, res: Response) => {
    try {
      const { groupId, content } = req.body;
      
      if (!groupId || !content) {
        return res.status(400).json({ 
          success: false, 
          error: "缺少群組ID或訊息內容" 
        });
      }
      
      // 獲取群組訊息
      const group = await storage.getGroup(Number(groupId));
      
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: `找不到 ID 為 ${groupId} 的群組` 
        });
      }
      
      console.log(`測試發送訊息到群組: ${group.name} (${group.lineId})`);
      
      // 不再添加時間到測試訊息內容，僅對內容進行分段處理
      let finalContent = content;
      // 對訊息內容進行分段處理
      finalContent = finalContent.replace(/。(?!\n)/g, "。\n");
      
      console.log(`訊息內容: ${finalContent}`);
      
      // 使用 LINE API 發送訊息
      try {
        const result = await sendLineMessage(group.lineId, finalContent);
        
        return res.json({ 
          success: true, 
          message: `已發送訊息到群組: ${group.name}`,
          result,
          group: {
            id: group.id,
            name: group.name,
            lineId: group.lineId
          }
        });
      } catch (sendError) {
        console.error("發送LINE訊息時出錯:", sendError);
        let errorMessage = String(sendError);
        
        // 檢查是否為HTML回應（通常是LINE API問題）
        if (sendError instanceof Error && sendError.message.includes("<!DOCTYPE")) {
          errorMessage = "LINE API回傳了非預期的HTML回應，請檢查API配置及Token是否有效";
        }
        
        return res.status(500).json({ 
          success: false, 
          error: errorMessage,
          details: sendError instanceof Error ? sendError.message : String(sendError)
        });
      }
    } catch (error) {
      console.error("測試發送失敗:", error);
      return res.status(500).json({ 
        success: false, 
        error: `發送失敗: ${error instanceof Error ? error.message : String(error)}` 
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

  // 已移除所有LINE Webhook相關處理代碼
  // 用戶使用另一個LINE機器人實現群組ID查詢功能
  
  // 已移除所有LINE Webhook和群組ID查詢相關的API端點
  // 用戶使用另一個LINE機器人實現群組ID查詢功能
  
  // 最後設置API路由
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

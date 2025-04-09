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
      const messageData = insertMessageSchema.parse(req.body);
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
      const messageData = insertMessageSchema.partial().parse(req.body);
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
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  router.put("/settings", async (req: Request, res: Response) => {
    try {
      const settingsData = insertSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateSettings(settingsData);
      res.json(updatedSettings);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Helper function to send LINE messages
  async function sendLineMessage(
    lineGroupId: string, 
    content: string, 
    lineApiToken: string
  ) {
    try {
      const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
      
      const response = await fetch(LINE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lineApiToken}`
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
      
      const result = await response.json();
      
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
              settings.lineApiToken
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

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

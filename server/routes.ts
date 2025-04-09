import express, { Request, Response } from "express";
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
      
      // In a real implementation, this would use the LINE Messaging API SDK
      // to send the message to the specified groups
      // For this MVP, we'll just mark the message as sent
      
      const updatedMessage = await storage.updateMessage(message.id, {
        status: "sent"
      });
      
      res.json({ success: true, message: updatedMessage });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

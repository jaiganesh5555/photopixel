import express from "express";
import type { Request, Response } from "express";
import { Webhook } from "svix";
import { prismaClient } from "db";

const router = express.Router();

/**
 * POST api/webhook/clerk
 * Clerk webhook endpoint
 */
router.post("/clerk", async (req: Request, res: Response) => {
  try {
    const SIGNING_SECRET = process.env.SIGNING_SECRET;

    if (!SIGNING_SECRET) {
      throw new Error(
        "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env"
      );
    }

    const wh = new Webhook(SIGNING_SECRET);
    const headers = req.headers;
    const payload = req.body;

    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({
        success: false,
        message: "Error: Missing svix headers",
      });
      return;
    }

    let evt: any;

    try {
      evt = wh.verify(JSON.stringify(payload), {
        "svix-id": svix_id as string,
        "svix-timestamp": svix_timestamp as string,
        "svix-signature": svix_signature as string,
      });
    } catch (err) {
      console.error("Error: Could not verify webhook:", (err as Error).message);
      res.status(400).json({
        success: false,
        message: (err as Error).message,
      });
      return;
    }

    const { id } = evt.data;
    const eventType = evt.type;

    // Process the webhook event
    console.log(`Processing webhook event: ${eventType} for user ${id}`);
    
    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
});

export default router;

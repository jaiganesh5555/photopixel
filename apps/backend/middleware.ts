import type { NextFunction, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/clerk-sdk-node";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        email: string;
      };
    }
  }
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Get and properly format the public key
    const publicKey = process.env.CLERK_JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");
    
    if (!publicKey) {
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: process.env.CLERK_ISSUER,
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      res.status(403).json({ message: "Invalid token" });
      return;
    }

    const userId = (decoded as any).sub;
    if (!userId) {
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }

    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      res.status(400).json({ message: "User email not found" });
      return;
    }

    req.userId = userId;
    req.user = {
      email: primaryEmail.emailAddress,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({
      message: "Error processing authentication",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
};
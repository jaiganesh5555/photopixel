import express from "express";
import type { Request, Response } from "express";
import { PaymentService } from "../services/payment";
import { authMiddleware } from "../middleware";

const router = express.Router();

// Create Razorpay order
router.post("/create-order", authMiddleware, async (req: Request, res: Response) => {
    try {
    const { plan } = req.body;
    const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

    if (!plan || !["basic", "premium"].includes(plan)) {
      res.status(400).json({ message: "Invalid plan" });
      return;
    }

    const order = await PaymentService.createRazorpayOrder(userId, plan);
    res.json(order);
    } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
    }
});

// Verify Razorpay payment
router.post("/verify", authMiddleware, async (req: Request, res: Response) => {
    try {
    const { paymentId, orderId, signature, plan } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!paymentId || !orderId || !signature || !plan) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const isValid = await PaymentService.verifyRazorpaySignature({
      paymentId,
      orderId,
      signature,
            userId,
            plan,
          });

    if (isValid) {
      await PaymentService.createSubscriptionRecord(userId, plan, paymentId, orderId);
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

export default router;

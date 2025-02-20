import Stripe from "stripe";
import Razorpay from "razorpay";
import { prismaClient } from "db";
import crypto from "crypto";
import { PlanType } from "@prisma/client";

// Validate environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY");
}

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Missing Razorpay credentials");
}

// Initialize payment providers
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia",
    })
  : null;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Define plan prices (in paise)
export const PLAN_PRICES = {
  basic: {
    monthly: 100, // ₹1
    annual: 1000, // ₹10
  },
  premium: {
    monthly: 100, // ₹1,999
    annual: 1000, // ₹19,990
  },
} as const;

// Define credit amounts per plan
export const CREDITS_PER_PLAN = {
  basic: 500,
  premium: 1000,
} as const;

export async function createStripeSession(
  userId: string,
  plan: "basic" | "premium",
  isAnnual: boolean,
  email: string
) {
  try {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    console.log("Creating Stripe session:", { userId, plan, isAnnual, email });

    // Validate plan type
    if (!PLAN_PRICES[plan]) {
      throw new Error("Invalid plan type");
    }

    // Get the correct price
    const price = PLAN_PRICES[plan][isAnnual ? "annual" : "monthly"];
    console.log("Selected price:", price);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `${isAnnual ? "Annual" : "Monthly"} subscription`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: email,
      metadata: {
        userId,
        plan,
        isAnnual: String(isAnnual),
      },
    });

    console.log("Stripe session created:", session);
    return session;
  } catch (error) {
    console.error("Stripe session creation error:", error);
    throw error;
  }
}

export async function getStripeSession(sessionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return await stripe.checkout.sessions.retrieve(sessionId);
}

export async function createRazorpayOrder(
  userId: string,
  plan: keyof typeof PLAN_PRICES,
  isAnnual: boolean
) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    const amount = isAnnual
      ? PLAN_PRICES[plan].annual
      : PLAN_PRICES[plan].monthly;

    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `rcpt_${userId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId,
        plan,
        isAnnual: String(isAnnual),
      },
    };

    const order = await razorpay.orders.create(orderOptions);
    console.log("Razorpay order created:", order);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "PhotoAI",
      description: `${plan.toUpperCase()} Plan ${isAnnual ? "(Annual)" : "(Monthly)"}`,
      prefill: {
        name: "User",
        email: "user@example.com",
      },
      notes: orderOptions.notes,
      theme: {
        color: "#000000",
      },
    };
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    throw error;
  }
}

export async function verifyStripePayment(sessionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid";
}

export const verifyRazorpaySignature = ({
  paymentId,
  orderId,
  signature,
}: {
  paymentId: string;
  orderId: string;
  signature: string;
}) => {
  try {
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret key not configured");
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === signature;
    console.log("Signature verification:", { isValid, orderId, paymentId });
    
    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    throw error;
  }
};

export async function addCreditsForPlan(userId: string, plan: PlanType) {
  try {
    const credits = CREDITS_PER_PLAN[plan];
    console.log("Adding credits:", { userId, plan, credits });

    return await prismaClient.userCredit.upsert({
      where: { userId },
      update: { amount: { increment: credits } },
      create: {
        userId,
        amount: credits,
      },
    });
  } catch (error) {
    console.error("Credit addition error:", error);
    throw error;
  }
}

export async function createSubscriptionRecord(
  userId: string,
  plan: PlanType,
  paymentId: string,
  orderId: string,
  isAnnual: boolean = false
) {
  try {
    return await prismaClient.$transaction(async (prisma) => {
      console.log("Creating subscription:", {
        userId,
        plan,
        paymentId,
        orderId,
        isAnnual,
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          paymentId,
          orderId,
        },
      });

      console.log("Adding credits for plan:", plan);
      await addCreditsForPlan(userId, plan);

      return subscription;
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    throw error;
  }
}

export const PaymentService = {
  createStripeSession,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getStripeSession,
  createSubscriptionRecord,
  addCreditsForPlan,
};

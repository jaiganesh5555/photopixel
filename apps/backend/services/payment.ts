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

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      })
    : null;

// Define plan prices
export const PLAN_PRICES = {
  basic: {
    monthly: 999, // $9.99
    annual: 9990, // $99.90
  },
  premium: {
    monthly: 1999, // $19.99
    annual: 19990, // $199.90
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
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Missing Razorpay credentials");
    throw new Error("Payment service not configured");
  }

  try {
    // Calculate amount in INR (Razorpay only accepts INR)
    const baseAmount = isAnnual 
      ? PLAN_PRICES[plan].annual 
      : PLAN_PRICES[plan].monthly;
    
    // Convert to paise (Razorpay expects amount in paise)
    const amountInPaise = Math.round(baseAmount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        isAnnual: String(isAnnual)
      }
    };

    console.log("Creating Razorpay order with options:", orderOptions);

    if (!razorpay) {
      throw new Error("Razorpay is not configured");
    }

    const order = await razorpay.orders.create(orderOptions);

    console.log("Razorpay order created:", order);

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      key: RAZORPAY_KEY_ID,
      name: "Photo AI",
      description: `${plan.toUpperCase()} Plan ${isAnnual ? '(Annual)' : '(Monthly)'}`,
      prefill: {
        name: "User",
        email: "user@example.com"
      },
      notes: orderOptions.notes
    };
  } catch (error) {
    console.error("Detailed Razorpay error:", error);
    if (error instanceof Error) {
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
    throw new Error("Payment initialization failed: Service unavailable");
  }
}

export async function verifyStripePayment(sessionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid";
}

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured");
  }

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
};

export async function addCreditsForPlan(userId: string, plan: PlanType) {
  const credits = CREDITS_PER_PLAN[plan];

  return await prismaClient.userCredit.upsert({
    where: { userId },
    update: { amount: { increment: credits } },
    create: {
      userId,
      amount: credits,
    },
  });
}

export async function createSubscriptionRecord(
  userId: string,
  plan: PlanType,
  paymentId: string,
  orderId: string
) {
  return await prismaClient.$transaction(async (prisma) => {
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        paymentId,
        orderId,
      },
    });
    await addCreditsForPlan(userId, plan);
    return subscription;
  });
}

export const PaymentService = {
  createStripeSession,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getStripeSession,
  createSubscriptionRecord,
  addCreditsForPlan,
};

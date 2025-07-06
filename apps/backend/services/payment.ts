import Razorpay from "razorpay";
import crypto from "crypto";
import { prismaClient } from "db";

export type PlanType = "basic" | "premium";

// Validate environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Log warning instead of throwing error immediately
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn("⚠️  Razorpay credentials are not configured. Payment features will be disabled.");
}

// Initialize Razorpay only if credentials are available
const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET 
  ? new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  : null;

// Define plan prices (in rupees)
const PLAN_PRICES = {
  basic: 500,
  premium: 1000,
} as const;

// Define credit amounts per plan
const CREDITS_PER_PLAN = {
  basic: 50,
  premium: 100,
} as const;

export async function createTransactionRecord(
  userId: string,
  amount: number,
  currency: string,
  paymentId: string,
  orderId: string,
  plan: PlanType,
  status: "PENDING" | "SUCCESS" | "FAILED" = "PENDING"
) {
  try {
    return await withRetry(() =>
      prismaClient.transaction.create({
        data: {
          userId,
          amount,
          currency,
          paymentId,
          orderId,
          plan,
          status,
        },
      })
    );
  } catch (error) {
    console.error("Transaction creation error:", error);
    throw error;
  }
}

export async function createRazorpayOrder(
  userId: string,
  plan: keyof typeof PLAN_PRICES
) {
  try {
    if (!razorpay) {
      throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
    }

    const amount = PLAN_PRICES[plan];
    const amountInPaise = amount * 100;

    const orderData = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    };

    const order = await new Promise((resolve, reject) => {
      razorpay.orders.create(orderData, (err: any, result: any) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    await createTransactionRecord(
      userId,
      amount,
      "INR",
      "",
      (order as any).id,
      plan,
      "PENDING"
    );

    return {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      name: "PhotoAI",
      description: `${plan.toUpperCase()} Plan - ${CREDITS_PER_PLAN[plan]} Credits`,
      order_id: (order as any).id,
      prefill: {
        name: "",
        email: "",
      },
      notes: {
        userId,
        plan,
      },
      theme: {
        color: "#000000",
      },
    };
  } catch (error) {
    console.error("Razorpay Error:", error);
    throw error;
  }
}

export const verifyRazorpaySignature = async ({
  paymentId,
  orderId,
  signature,
  userId,
  plan,
}: {
  paymentId: string;
  orderId: string;
  signature: string;
  userId: string;
  plan: PlanType;
}) => {
  try {
    if (!razorpay) {
      throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
    }

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

    const order = await razorpay.orders.fetch(orderId);
    const amount = order.amount;
    const currency = order.currency;

    // Find existing pending transaction
    const existingTransaction = await prismaClient.transaction.findFirst({
      where: {
        orderId: orderId,
        userId: userId,
        status: "PENDING",
      },
    });

    if (!existingTransaction) {
      throw new Error("No pending transaction found for this order");
    }

    // Update the transaction status
    await prismaClient.transaction.update({
      where: {
        id: existingTransaction.id,
      },
      data: {
        paymentId,
        status: isValid ? "SUCCESS" : "FAILED",
      },
    });

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    throw error;
  }
};

// Add retry logic for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      retries > 0 &&
      error instanceof Error &&
      error.message.includes("Can't reach database server")
    ) {
      console.log(`Retrying operation, ${retries} attempts left`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function addCreditsForPlan(userId: string, plan: PlanType) {
  try {
    const credits = CREDITS_PER_PLAN[plan];
    console.log("Adding credits:", { userId, plan, credits });

    return await withRetry(() =>
      prismaClient.userCredit.upsert({
        where: { userId },
        update: { amount: { increment: credits } },
        create: {
          userId,
          amount: credits,
        },
      })
    );
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
    return await withRetry(async () => {
      console.log("Creating subscription:", {
        userId,
        plan,
        paymentId,
        orderId,
        isAnnual,
      });

      const subscription = await prismaClient.subscription.create({
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
  } catch (error) {
    console.error("Subscription creation error:", error);
    throw error;
  }
}

export const PaymentService = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createSubscriptionRecord,
  addCreditsForPlan,
};

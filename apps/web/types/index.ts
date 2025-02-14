export enum PlanType {
  basic = "basic",
  premium = "premium",
}

export interface PaymentResponse {
  sessionId?: string;
  url?: string;
  id?: string;
  amount?: number;
  currency?: string;
  success?: boolean;
  message?: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface SubscriptionStatus {
  plan: PlanType;
  createdAt: string;
  credits: number;
}

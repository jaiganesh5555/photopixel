"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { creditUpdateEvent } from "@/hooks/usePayment";

export function PaymentSuccessContent() {
  const [verifying, setVerifying] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get("session_id");
        const paymentId = searchParams.get("razorpay_payment_id");
        const orderId = searchParams.get("razorpay_order_id");
        const signature = searchParams.get("razorpay_signature");

        if (!sessionId && !paymentId) {
          router.push("/payment/cancel");
          return;
        }

        const token = await getToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        // Handle Razorpay verification
        if (paymentId && orderId && signature) {
          const response = await fetch(
            `${BACKEND_URL}/payment/razorpay/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentId,
                razorpay_order_id: orderId,
                razorpay_signature: signature,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            // Trigger credit update
            const event = new Event("creditUpdate");
            window.dispatchEvent(event);
            creditUpdateEvent.dispatchEvent(event);

            router.push("/payment/success");
          } else {
            router.push("/payment/cancel");
          }
        }
        // Handle Stripe verification
        else if (sessionId) {
          const response = await fetch(`${BACKEND_URL}/payment/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Trigger credit update
            const event = new Event("creditUpdate");
            window.dispatchEvent(event);
            creditUpdateEvent.dispatchEvent(event);

            router.push("/payment/success");
          } else {
            router.push("/payment/cancel");
          }
        } else {
          router.push("/payment/cancel");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        router.push("/payment/cancel");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, getToken, toast]);

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-lg text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  return null;
}

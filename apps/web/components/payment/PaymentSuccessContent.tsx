"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentSuccessContent() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
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

        // If no payment parameters, assume direct navigation after successful payment
        if (!sessionId && !paymentId) {
          setVerified(true);
          setVerifying(false);
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
            setVerified(true);
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
            setVerified(true);
          } else {
            router.push("/payment/cancel");
          }
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

  if (verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold text-white-900">
          Payment Successful!
        </h1>
        <p className="text-lg text-gray-200 text-center max-w-md">
          Your credits have been added to your account.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return null;
}

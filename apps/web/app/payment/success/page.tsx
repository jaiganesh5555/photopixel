"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { creditUpdateEvent } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [verifying, setVerifying] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const sessionId = searchParams.get("session_id");
  const baseurl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        router.push("/pricing");
        return;
      }

      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${baseurl}/payment/stripe/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Trigger credit update
          creditUpdateEvent.dispatchEvent(new Event("creditUpdate"));

          toast({
            title: "Payment Successful",
            description: "Your subscription has been activated",
          });

          setVerifying(false);
        } else {
          throw new Error(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast({
          title: "Payment Failed",
          description:
            error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
        setTimeout(() => router.push("/pricing"), 3000);
      }
    }

    verifyPayment();
  }, [sessionId, router, getToken, toast]);

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verifying your payment...</h1>
          <p className="mt-4">
            Please wait while we confirm your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600">
          Payment Successful!
        </h1>
        <p className="mt-4">Your subscription has been activated.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-8 rounded-md bg-primary px-4 py-2 text-black"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

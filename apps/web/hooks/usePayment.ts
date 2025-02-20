import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/app/config";
import { RazorpayResponse } from "@/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
const apiUrl = BACKEND_URL;

// Create an event bus for credit updates
export const creditUpdateEvent = new EventTarget();

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const router = useRouter();

  const handlePaymentResult = async (
    success: boolean,
    data?: any,
    error?: any
  ) => {
    try {
      if (success) {
        console.log("Processing successful payment:", data);
        
        // Update credits first
        if (data?.credits) {
          creditUpdateEvent.dispatchEvent(
            new CustomEvent("creditUpdate", { detail: data.credits })
          );
        }

        // Show success toast
        toast({
          title: "Payment Successful",
          description: "Your credits have been added to your account",
        });

        // Use router for programmatic navigation
        router.push("/payment/success");
        return;
      }

      // Handle failure cases
      console.error("Payment error:", error);

      // Special handling for database connectivity issues
      if (error?.details?.includes("Can't reach database server")) {
        toast({
          title: "Payment Processed",
          description:
            "Your payment was successful but credits may take a few minutes to reflect. Please refresh later.",
          duration: 6000,
        });
        router.push("/payment/success");
        return;
      }

      toast({
        title: "Payment Failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
      router.push("/payment/cancel");
    } catch (navigationError) {
      console.error("Navigation error:", navigationError);
      router.push(success ? "/payment/success" : "/payment/cancel");
    }
  };

  const handlePayment = async (
    plan: "basic" | "premium",
    isAnnual: boolean,
    method: "stripe" | "razorpay"
  ) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${apiUrl}/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, isAnnual, method }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Payment failed");

      if (method === "stripe" && data.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe failed to load");

        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          console.error("Stripe redirect error:", error);
          throw error;
        }
      } else if (method === "razorpay") {
        // Load Razorpay SDK dynamically
        await loadRazorpayScript();

        const options = {
          key: data.key,
          amount: String(data.amount), // Convert to string
          currency: data.currency,
          name: data.name,
          description: data.description,
          order_id: data.order_id,
          handler: async function (response: RazorpayResponse) {
            console.log("Payment completed:", response);
            try {
              const verifyToken = await getToken({ skipCache: true });

              const verifyResponse = await fetch(
                `${apiUrl}/payment/razorpay/verify`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${verifyToken}`,
                  },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                    isAnnual,
                  }),
                }
              );

              const verifyData = await verifyResponse.json();
              console.log("Verification response:", verifyData);

              if (!verifyResponse.ok) {
                await handlePaymentResult(false, null, verifyData);
                return;
              }

              await handlePaymentResult(true, verifyData);
            } catch (error) {
              await handlePaymentResult(false, null, error);
            }
          },
          modal: {
            ondismiss: function () {
              console.log("Payment modal dismissed");
              handlePaymentResult(false, null, "Payment cancelled by user");
            },
            escape: false,
            backdropClose: false,
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          notes: {
            ...data.notes,
          },
          theme: {
            color: "#000000",
          },
        };

        const razorpay = (window as any).Razorpay(options);
        razorpay.on(
          "payment.failed",
          function (response: { error?: { description?: string } }) {
            console.error("Payment failed:", response);
            handlePaymentResult(
              false,
              null,
              response.error?.description || "Payment failed"
            );
          }
        );

        razorpay.open();
      }
    } catch (error) {
      await handlePaymentResult(false, null, error);
    } finally {
      setLoading(false);
    }
  };

  return { handlePayment, loading };
}
// Helper function to load Razorpay SDK
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/app/config";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
const apiUrl = BACKEND_URL;

// Create an event bus for credit updates
export const creditUpdateEvent = new EventTarget();

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const router = useRouter();

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
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch(
                `${apiUrl}/payment/razorpay/verify`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                    isAnnual: String(isAnnual),
                  }),
                }
              );

              const verifyData = await verifyResponse.json();
              if (!verifyResponse.ok) throw new Error(verifyData.message);

              window.dispatchEvent(new Event("creditUpdate"));
              router.push("/payment/success");
            } catch (error) {
              console.error("Verification error:", error);
              router.push("/payment/cancel");
            }
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

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response.error);
          router.push("/payment/cancel");
        });
        razorpay.open();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      router.push("/payment/cancel");
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

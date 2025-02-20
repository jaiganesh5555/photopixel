"use client";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Payment Cancelled</h1>
        <p className="mt-4">Your payment was cancelled.</p>
        <button
          onClick={() => router.push("/pricing")}
          className="mt-8 rounded-md bg-primary  px-4 py-2 text-black hover:bg-primary/80 transition-colors duration-300 border border-black hover:border-primary"
        >
          Return to Pricing
        </button>
      </div>
    </div>
  );
}

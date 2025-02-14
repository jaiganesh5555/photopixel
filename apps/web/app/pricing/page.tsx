"use client";
import { useState } from "react";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PaymentModal } from "@/components/subscription/PaymentModal";
import { PlanType } from "@/types";
import { usePayment } from "@/hooks/usePayment";

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: PlanType;
    isAnnual: boolean;
  } | null>(null);

  const { handlePayment, loading } = usePayment();

  const plans = [
    {
      type: PlanType.basic,
      name: "Basic Plan",
      price: 500, // $50
      credits: 500,
      features: [
        "500 Credits",
        "Basic Support",
        "Standard Processing",
        "24/7 Email Support",
      ],
    },
    {
      type: PlanType.premium,
      name: "Premium Plan",
      price: 1000, // $100
      credits: 1000,
      features: [
        "1000 Credits",
        "Priority Support",
        "Fast Processing",
        "Advanced Features",
        "24/7 Priority Support",
        "Custom Solutions",
      ],
    },
  ] as const;

  const handlePlanSelect = (plan: PlanType, isAnnual: boolean) => {
    setSelectedPlan({ plan, isAnnual });
  };

  const handlePaymentSubmit = async (method: "stripe" | "razorpay") => {
    if (!selectedPlan) return;

    await handlePayment(selectedPlan.plan, selectedPlan.isAnnual, method);
    setSelectedPlan(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Select a plan that best fits your needs. All plans include access to
          our core features.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.type}
              plan={{
                type: plan.type,
                name: plan.name,
                price: plan.price,
                credits: plan.credits,
                features: [...plan.features],
              }}
              onSelect={(isAnnual) => handlePlanSelect(plan.type, isAnnual)}
            />
          ))}
        </div>

        {selectedPlan && (
          <PaymentModal
            plan={selectedPlan.plan}
            isAnnual={selectedPlan.isAnnual}
            onClose={() => setSelectedPlan(null)}
            onPaymentSubmit={handlePaymentSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

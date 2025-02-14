import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CheckIcon } from "lucide-react";
import { useState } from "react";

interface PlanCardProps {
  plan: {
    type: string;
    name: string;
    price: number;
    credits: number;
    features: string[];
  };
  onSelect: (isAnnual: boolean) => void;
}

export function PlanCard({ plan, onSelect }: PlanCardProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const annualPrice = Math.round(plan.price * 12 * 0.8); // 20% discount

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl font-bold">
          ${isAnnual ? annualPrice : plan.price}
        </span>
        <div className="flex items-center gap-2">
          <span>Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span>Annual</span>
        </div>
      </div>

      <ul className="mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 mb-2">
            <CheckIcon className="w-5 h-5" />
            {feature}
          </li>
        ))}
      </ul>

      <Button className="w-full" onClick={() => onSelect(isAnnual)}>
        Select Plan
      </Button>
    </Card>
  );
}

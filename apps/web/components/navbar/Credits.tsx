"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { creditUpdateEvent } from "@/hooks/usePayment";
import { BACKEND_URL } from "@/app/config";

export function Credits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const router = useRouter();
  const baseurl = BACKEND_URL;

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${baseurl}/payment/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Disable caching
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    // Listen for credit updates
    const handleCreditUpdate = () => {
      console.log("Credit update event received");
      fetchCredits();
    };

    window.addEventListener("creditUpdate", handleCreditUpdate);

    // Refresh credits every minute
    const interval = setInterval(fetchCredits, 60 * 1000);

    return () => {
      window.removeEventListener("creditUpdate", handleCreditUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-9 px-4 py-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              <span className="font-medium">
                {credits?.toLocaleString() ?? 0} Credits
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
          onClick={() => router.push("/pricing")}
        >
          <span>Add Credits</span>
          <Plus className="h-4 w-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

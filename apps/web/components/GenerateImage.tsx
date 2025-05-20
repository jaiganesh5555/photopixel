"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { SelectModel } from "./Models";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useRouter } from "next/navigation";
import CustomLabel from "./ui/customLabel";
import { GlowEffect } from "./GlowEffect";

const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 10;

export function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const { credits } = useCredits();
  const router = useRouter();

  useEffect(() => {
    return () => {
      // Cleanup any pending requests if component unmounts
      setIsGenerating(false);
      setError(null);
    };
  }, []);

  const validatePrompt = () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return false;
    }
    if (prompt.length < MIN_PROMPT_LENGTH) {
      setError(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters`);
      return false;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      setError(`Prompt must be less than ${MAX_PROMPT_LENGTH} characters`);
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!prompt || !selectedModel) return;
    setError(null);

    if (!validatePrompt()) return;

    if (credits <= 0) {
      router.push("/pricing");
      return;
    }

    setIsGenerating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await axios.post(
        `${BACKEND_URL}/ai/generate`,
        {
          prompt,
          modelId: selectedModel,
          num: 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Image generation started!");
      setPrompt("");
    } catch (error) {
      console.error("Failed to generate image:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to generate image");
      } else {
        setError("An unexpected error occurred");
      }
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        <SelectModel
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full"
        >
          <CustomLabel label="Enter your prompt here..." />
          <Textarea
            className="w-full min-h-24"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError(null);
            }}
            maxLength={MAX_PROMPT_LENGTH}
            placeholder={`Enter a prompt (${MIN_PROMPT_LENGTH}-${MAX_PROMPT_LENGTH} characters)`}
          />
          <div className="text-sm text-muted-foreground mt-1 text-right">
            {prompt.length}/{MAX_PROMPT_LENGTH} characters
          </div>
        </motion.div>

        <div className="flex justify-end pt-4">
          <div className="relative">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt || !selectedModel}
              variant={"outline"}
              className="relative z-20 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Image <Sparkles size={24} />
                </>
              )}
            </Button>
            {(prompt && selectedModel) && (
              <GlowEffect
                colors={["#FF5733", "#33FF57", "#3357FF", "#F1C40F"]}
                mode="colorShift"
                blur="soft"
                duration={3}
                scale={0.9}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

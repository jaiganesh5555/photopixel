"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TModel {
  id: string;
  thumbnail: string;
  name: string;
  trainingStatus: "Generated" | "Pending";
}

export function SelectModel({
  setSelectedModel,
  selectedModel,
}: {
  setSelectedModel: (model: string) => void;
  selectedModel?: string;
}) {
  const { getToken } = useAuth();
  const [modelLoading, setModalLoading] = useState(true);
  const [models, setModels] = useState<TModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchModels = async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${BACKEND_URL}/models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setModels(response.data.models);
      if (response.data.models.length > 0 && !selectedModel) {
        setSelectedModel(response.data.models[0]?.id);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch models");
      } else {
        setError("An unexpected error occurred");
      }
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchModels, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    return () => {
      setModalLoading(false);
      setError(null);
    };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
          {retryCount < MAX_RETRIES && (
            <button
              onClick={() => {
                setRetryCount(0);
                fetchModels();
              }}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div className="md:space-y-1">
          <h2 className="md:text-2xl text-xl font-semibold tracking-tight">
            Select Model
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose an AI model to generate your images
          </p>
        </div>
        {models.find((x) => x.trainingStatus !== "Generated") && (
          <Badge variant="secondary" className="animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Training in progress
          </Badge>
        )}
      </div>

      {modelLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="h-[220px] animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {models
            .filter((model) => model.trainingStatus === "Generated")
            .map((model) => (
              <motion.div key={model.id} variants={item}>
                <Card
                  className={cn(
                    "group relative max-w-96 overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer",
                    selectedModel === model.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={model.thumbnail}
                      alt={`Thumbnail for ${model.name}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-image.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {model.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </motion.div>
      )}

      {!modelLoading && models.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed"
        >
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No models available</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Start by training a new model
          </p>
        </motion.div>
      )}
    </div>
  );
}

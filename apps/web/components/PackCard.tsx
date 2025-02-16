"use client"
import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, ImageIcon, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export interface TPack {
  id: string;
  name: string;
  imageUrl1: string;
  imageUrl2: string;
  description: string;
  category?: string;
  imagesCount?: number;
  createdAt?: string;
}

export function PackCard(props: TPack & { selectedModelId: string }) {
  const { getToken } = useAuth();

  const handleGenerate = async () => {
    try {
      toast.promise(
        generatePack(),
        {
          loading: 'Starting pack generation...',
          success: 'Pack generation started successfully!',
          error: 'Failed to start generation'
        }
      );
    } catch (error) {
      console.error("Failed to generate pack:", error);
    }
  };

  const generatePack = async () => {
    const token = await getToken();
    await axios.post(
      `${BACKEND_URL}/pack/generate`,
      {
        packId: props.id,
        modelId: props.selectedModelId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full"
          >
            <Card className="group h-full overflow-hidden border bg-card hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
              <CardHeader className="p-0">
                <div className="grid grid-cols-2 gap-0.5 bg-muted/20">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={props.imageUrl1}
                      alt={`${props.name} preview 1`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={props.imageUrl2}
                      alt={`${props.name} preview 2`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold tracking-tight text-lg">
                      {props.name}
                    </h3>
                    {props.category && (
                      <Badge variant="secondary" className="mt-1">
                        {props.category}
                      </Badge>
                    )}
                  </div>
                  {props.imagesCount && (
                    <Badge variant="outline" className="gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {props.imagesCount}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {props.description}
                </p>
                
                {props.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(props.createdAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with Pack
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{props.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

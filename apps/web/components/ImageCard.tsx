import { ArrowDown, AlertCircle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import { TImage } from "./Camera";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageCardProps extends TImage {
  onClick: () => void;
}

export function ImageCard({ id, status, imageUrl, onClick, prompt }: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!imageUrl) return null;

  return (
    <div onClick={onClick} className="group relative rounded-none overflow-hidden max-w-[400px] cursor-zoom-in">
      <div className="flex gap-4 min-h-32">
        {error ? (
          <div className="w-full h-[300px] flex items-center justify-center bg-destructive/10 border border-destructive text-destructive p-4">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm text-center">Failed to load image</p>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-muted/50 animate-pulse" />
            )}
            <Image
              key={id}
              src={imageUrl}
              alt={status === "Generated" ? "Generated image" : "Loading image"}
              width={400}
              height={500}
              className={cn(
                "w-full transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              priority
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load image");
              }}
            />
          </>
        )}
      </div>
      <div className="opacity-0 absolute transition-normal duration-200 group-hover:opacity-100 flex items-center justify-between bottom-0 left-0 right-0 p-4 bg-opacity-70 text-white line-clamp-1">
        <p>{prompt}</p>
        <span className="flex items-center justify-between bg-primary-foreground text-muted-foreground rounded-md px-2 py-1">
          <ArrowDown />
        </span>
      </div>
    </div>
  );
}

export function ImageCardSkeleton() {
  return (
    <div className="rounded-none mb-4 overflow-hidden max-w-[400px] cursor-pointer">
      <div className="flex gap-4 min-h-32">
        <Skeleton className={`w-full h-[300px] rounded-none`} />
      </div>
    </div>
  );
}
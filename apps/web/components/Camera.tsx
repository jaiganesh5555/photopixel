"use client";

import { useAuth } from "@clerk/nextjs";
import { BACKEND_URL } from "@/app/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { ImageCard } from "./ImageCard";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";

export interface TImage {
  id: string;
  imageUrl: string;
  modelId: string;
  userId: string;
  prompt: string;
  falAiRequestId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function Camera() {
  const [images, setImages] = useState<TImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<TImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const { getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchImages = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        setImagesLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/image/bulk`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(response.data.images);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to fetch images");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleImageClick = (image: TImage, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    if (!imageUrl) {
      setError("No image URL provided");
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${imageName}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
      setError(error instanceof Error ? error.message : "Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNavigation = (direction: "previous" | "next") => {
    const newIndex =
      direction === "previous" ? currentImageIndex - 1 : currentImageIndex + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
      setSelectedImage(images[newIndex] || null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Gallery</h2>
        <span className="text-xs select-none bg-secondary/40 font-semibold border border-secondary text-muted-foreground px-2 py-1 rounded-full">
          {images.length} images
        </span>
      </div>

      <motion.div
        className="columns-1 md:columns-3 lg:columns-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {imagesLoading
          ? [...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="bg-neutral-300 h-48 rounded-lg animate-pulse"
              />
            ))
          : images.map((image, index) => (
              <div
                key={image.id +index}
                className="cursor-pointer transition-transform mb-4 hover:scale-[1.02]"
                onClick={() => handleImageClick(image, index)}
              >
                <ImageCard
                  id={image.id}
                  status={image.status}
                  imageUrl={image.imageUrl}
                  onClick={() => handleImageClick(image, index)}
                  modelId={image.modelId}
                  userId={image.userId}
                  prompt={image.prompt}
                  falAiRequestId={image.falAiRequestId}
                  createdAt={image.createdAt}
                  updatedAt={image.updatedAt}
                />
              </div>
            ))}
      </motion.div>

      {!imagesLoading && images.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">
            No images yet. Start by generating some!
          </p>
        </motion.div>
      )}

      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedImage(null);
              setError(null);
            }
          }}
        >
          <DialogContent className="max-w-5xl p-10 overflow-hidden bg-black/90 backdrop-blur-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="absolute top-4 left-4 right-4 text-white">
                <p className="text-lg font-medium truncate">
                  {selectedImage?.prompt}
                </p>
                <p className="text-sm">{formatDate(selectedImage.createdAt)}</p>
              </div>

              <div className="relative aspect-square w-full">
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt || "Generated image"}
                  fill
                  className="object-contain"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 85vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  variant="default"
                  onClick={() =>
                    handleDownload(
                      selectedImage.imageUrl,
                      selectedImage.prompt || "generated-image"
                    )
                  }
                  disabled={isDownloading || !selectedImage.imageUrl}
                  className="relative z-10 hover:cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </>
                  )}
                </Button>
              </div>

              <div className="absolute inset-0 flex items-center justify-between p-4">
                {currentImageIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigation("previous")}
                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 hover:cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                {currentImageIndex < images.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigation("next")}
                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 hover:cursor-pointer"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

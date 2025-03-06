"use client";

import Image from "next/image";
import { TImage } from "@/components/Camera";

interface ImageCardProps extends TImage {
  onClick: () => void;
}

export function ImageCard({ id, status, imageUrl, onClick }: ImageCardProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="relative border rounded-lg overflow-hidden shadow-lg transition-transform duration-200 hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <Image
        key={id}
        src={imageUrl}
        alt={status === "Generated" ? "Generated image" : "Loading image"}
        width={400}
        height={300}
        className="object-cover w-full h-48"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-200 opacity-0 hover:opacity-100">
        <span className="text-white font-semibold">{status}</span>
      </div>
    </div>
  );
}

export function ImageCardSkeleton() {
  return (
    <div className="relative border rounded-lg overflow-hidden shadow-lg animate-pulse">
      <div className="bg-gray-300 w-full h-48" />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
        <span className="text-white font-semibold">Loading...</span>
      </div>
    </div>
  );
}

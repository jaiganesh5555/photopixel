<<<<<<< HEAD
import { ArrowDown } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export interface TImage {
  id: string;
  status: string;
  imageUrl: string;
  title: string;
=======
"use client";

import Image from "next/image";
import { TImage } from "@/components/Camera";

interface ImageCardProps extends TImage {
  onClick: () => void;
>>>>>>> main
}

export function ImageCard({ id, status, imageUrl, onClick }: ImageCardProps) {
  if (!imageUrl) return null;

  return (
<<<<<<< HEAD
    <div className="group relative rounded-none overflow-hidden max-w-[400px] cursor-zoom-in">
      <div className="flex gap-4 min-h-32">
        {props.status === "Generated" ? (
          <img src={props.imageUrl} />
        ) : (
          <img src={DEFAULT_BLUR_IMAGE} />
        )}
=======
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
>>>>>>> main
      </div>
      <div className="opacity-0 absolute transition-normal duration-200 group-hover:opacity-100 flex items-center justify-between bottom-0 left-0 right-0 p-4 bg-opacity-70 text-white ">
        <p>{props.title}</p>
        <span className="flex items-center justify-between bg-primary-foreground text-muted-foreground rounded-md px-2 py-1">
          <ArrowDown/>
        </span>
      </div>
    </div>
  );
}

export function ImageCardSkeleton() {
  return (
<<<<<<< HEAD
    <div className="rounded-none mb-4 overflow-hidden max-w-[400px] cursor-pointer">
      <div className="flex gap-4 min-h-32">
        <Skeleton className={`w-full h-[300px] rounded-none`} />
=======
    <div className="relative border rounded-lg overflow-hidden shadow-lg animate-pulse">
      <div className="bg-gray-300 w-full h-48" />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
        <span className="text-white font-semibold">Loading...</span>
>>>>>>> main
      </div>
    </div>
  );
}

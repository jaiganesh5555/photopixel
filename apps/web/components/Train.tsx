"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadModal } from "@/components/ui/upload";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL, getBackendUrl, CLOUDFLARE_URL } from "@/app/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import JSZip from "jszip";

interface UploadedFile {
  name: string;
  status: "uploaded" | "failed";
  timestamp: Date;
}

export function Train() {
  const { getToken } = useAuth();
  const [zipUrl, setZipUrl] = useState("");
  const [zipKey, setZipKey] = useState("");
  const [type, setType] = useState("Man");
  const [age, setAge] = useState<string>("25");
  const [ethinicity, setEthinicity] = useState<string>("White");
  const [eyeColor, setEyeColor] = useState<string>("Brown");
  const [bald, setBald] = useState(false);
  const [name, setName] = useState("");
  const [modelTraining, setModelTraining] = useState(false);
  const router = useRouter();
  const { credits } = useCredits();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelId, setModelId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);

  // Check training status periodically if we have a modelId
  useEffect(() => {
    if (!modelId) return;

    const checkStatus = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${BACKEND_URL}/model/status/${modelId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setTrainingStatus(response.data.model.status);

          // If training is complete, stop checking
          if (
            response.data.model.status === "Generated" ||
            response.data.model.status === "Failed"
          ) {
            if (response.data.model.status === "Generated") {
              toast.success("Model training completed successfully!");
              router.refresh();
            } else {
              toast.error("Model training failed. Please try again.");
            }
            setModelId(null);
            setModelTraining(false);
          }
        }
      } catch (error) {
        console.error("Error checking model status:", error);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [modelId, getToken, router]);

  async function trainModal() {
    if (credits <= 0) {
      toast.error("You don't have enough credits");
      router.push("/pricing");
      return;
    }

    if (!zipUrl) {
      toast.error("Please upload images first");
      return;
    }

    if (!name) {
      toast.error("Please enter a model name");
      return;
    }

    if (!type || !age || !ethinicity || !eyeColor) {
      toast.error("Please fill in all required fields");
      return;
    }

    const input = {
      zipUrl,
      type,
      age: Number.parseInt(age ?? "25"),
      ethinicity,
      eyeColor,
      bald,
      name,
    };

    try {
      const token = await getToken();
      setModelTraining(true);

      const response = await axios.post(`${getBackendUrl()}/ai/training`, input, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.modelId) {
        setModelId(response.data.modelId);
        toast.success(
          "Model training started! This will take approximately 20 minutes."
        );
      } else {
        toast.error("Failed to start model training");
        setModelTraining(false);
      }
    } catch (error) {
      console.error("Training error:", error);
      toast.error(
        (error as any).response?.data?.message ||
          "Failed to start model training"
      );
      setModelTraining(false);
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove);
      if (newFiles.length === 0) {
        setZipUrl("");
        setZipKey("");
      }
      return newFiles;
    });
  };

  const handleUpload = async (files: File[]) => {
    if (files.length > 50) {
      toast.error("Maximum 50 images allowed");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setPreviewFiles(files);

    try {
      // Get auth token first
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const backendUrl = getBackendUrl();
      console.log("Local Development Debug:");
      console.log("1. Backend URL:", backendUrl);
      console.log("2. Auth token:", token.substring(0, 10) + "...");
      console.log("3. Number of files:", files.length);
      console.log("4. Total size:", files.reduce((acc, file) => acc + file.size, 0), "bytes");

      // Get pre-signed URL with detailed error handling
      let res;
      try {
        console.log("5. Requesting pre-signed URL from:", `${backendUrl}/pre-signed-url`);
        res = await axios.get(`${backendUrl}/pre-signed-url`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000, // 10 second timeout
          validateStatus: (status) => status < 500
        });
        
        console.log("6. Pre-signed URL response:", {
          status: res.status,
          statusText: res.statusText,
          data: res.data
        });

        if (res.status !== 200) {
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("7. Pre-signed URL request failed:", {
            message: error.message,
            code: error.code,
            response: error.response ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            } : 'No response',
            request: error.request ? 'Request was made but no response received' : 'No request was made'
          });

          if (error.code === 'ERR_NETWORK') {
            throw new Error("Network error: Cannot connect to the server. Please ensure the backend is running on port 8080.");
          }
          throw new Error(`Failed to get pre-signed URL: ${error.message}`);
        }
        throw error;
      }
      
      if (!res.data?.url || !res.data?.key) {
        throw new Error("Invalid response from server: missing url or key");
      }

      const { url, key } = res.data;

      // Create zip file
      const zip = new JSZip();
      const fileNames: string[] = [];

      for (const file of files) {
        zip.file(file.name, await file.arrayBuffer());
        fileNames.push(file.name);
        setUploadProgress((prev) => Math.min(prev + 50 / files.length, 50));
      }

      const content = await zip.generateAsync({ type: "blob" });
      console.log("Generated zip file size:", content.size);

      // Upload to R2 with detailed error handling
      try {
        console.log("Uploading to R2 URL:", url);
        console.log("Request headers:", {
          "Content-Type": "application/zip",
          "Content-Length": content.size
        });

        const uploadResponse = await axios.put(url, content, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Length": content.size.toString()
        },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = 50 + Math.round((progressEvent.loaded * 50) / progressEvent.total);
              console.log("Upload progress:", progress + "%");
              setUploadProgress(progress);
            }
          },
          timeout: 30000, // 30 second timeout for upload
          validateStatus: (status) => status < 500,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        console.log("Upload response:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          headers: uploadResponse.headers
        });

        // Use the same R2 URL format as the upload URL
        const fullZipUrl = `${process.env.NEXT_PUBLIC_R2_URL || 'https://a8ec3fab43eb1d9dfe4ff82a6a400aec.r2.cloudflarestorage.com'}/${key}`;
        console.log("Setting zip URL to:", fullZipUrl);
      setZipUrl(fullZipUrl);
      setZipKey(key);

      setUploadedFiles((prev) => [
        ...prev,
          ...files.map((file) => ({
            name: file.name,
          status: "uploaded" as const,
          timestamp: new Date(),
        })),
      ]);

      toast.success("Images uploaded successfully!");
    } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("R2 upload error details:", {
            message: error.message,
            code: error.code,
            response: error.response ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              headers: error.response.headers
            } : 'No response',
            request: error.request ? {
              method: error.request.method,
              url: error.request.url,
              headers: error.request.headers
            } : 'No request was made',
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              timeout: error.config?.timeout,
              maxContentLength: error.config?.maxContentLength,
              maxBodyLength: error.config?.maxBodyLength
            }
          });

          if (error.code === 'ERR_NETWORK') {
            throw new Error("Network error: Cannot connect to R2. Please check your internet connection and try again.");
          } else if (error.code === 'ECONNABORTED') {
            throw new Error("Upload timed out. Please try again with a smaller file or better internet connection.");
          } else if (error.response?.status === 403) {
            throw new Error("Access denied to R2. The pre-signed URL may have expired.");
          }
          throw new Error(`Failed to upload to R2: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to upload images. Please try again."
      );
      setZipUrl("");
      setZipKey("");
      setUploadedFiles([]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = name && zipUrl && type && age && ethinicity && eyeColor;

  return (
    <motion.div
      className="flex flex-col items-center justify-center pt-4 md:px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <div>
            <h1 className="md:text-2xl text-xl font-semibold">
              Train New Model
            </h1>
            <p className="md:text-sm text-xs text-muted-foreground">
              Create a custom AI model with your photos
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="h-full border-none shadow-none ">
            <CardContent className="p-0">
              <motion.div
                className="grid gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter model name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Man">Man</SelectItem>
                        <SelectItem value="Woman">Woman</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bald</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-input"
                        checked={bald}
                        onCheckedChange={setBald}
                      />
                      <span className="text-sm text-muted-foreground">
                        {bald ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ethnicity</Label>
                    <Select value={ethinicity} onValueChange={setEthinicity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Asian_American">
                          Asian American
                        </SelectItem>
                        <SelectItem value="East_Asian">East Asian</SelectItem>
                        <SelectItem value="South_East_Asian">
                          South East Asian
                        </SelectItem>
                        <SelectItem value="South_Asian">South Asian</SelectItem>
                        <SelectItem value="Middle_Eastern">
                          Middle Eastern
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Eye Color</Label>
                    <Select value={eyeColor} onValueChange={setEyeColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select eye color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Hazel">Hazel</SelectItem>
                        <SelectItem value="Gray">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <UploadModal
                    handleUpload={handleUpload}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                  <AnimatePresence>
                    {uploadedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="my-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Uploaded Files ({uploadedFiles.length})
                          </p>
                          {uploadedFiles.length > 1 && (
                            <button
                              onClick={() => {
                                setUploadedFiles([]);
                                setZipUrl("");
                                setZipKey("");
                              }}
                              className="text-xs text-red-500 cursor-pointer bg-red-500/20 border border-red-500/60 px-3 py-1 rounded-lg font-semibold hover:text-red-600 transition-colors"
                            >
                              Remove all
                            </button>
                          )}
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                          <AnimatePresence>
                            {uploadedFiles.map((file, index) => (
                              <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between text-sm p-2 rounded-md 
                                           bg-neutral-50 dark:bg-neutral-900 group hover:bg-neutral-100 
                                           dark:hover:bg-neutral-800 transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <motion.svg
                                    className="w-4 h-4 text-green-500 flex-shrink-0"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <path d="M5 13l4 4L19 7" />
                                  </motion.svg>
                                  <span
                                    className="truncate max-w-[200px]"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-neutral-500">
                                    {new Date(
                                      file.timestamp
                                    ).toLocaleTimeString()}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="p-1 rounded-full hover:bg-neutral-200 cursor-pointer dark:hover:bg-neutral-700 
                                               text-neutral-400 hover:text-red-500 transition-all
                                               opacity-0 group-hover:opacity-100 focus:opacity-100
                                               focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    title="Remove file"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </CardContent>
            <CardFooter className="flex justify-end px-0">
              <Button
                onClick={trainModal}
                disabled={modelTraining || !isFormValid}
                className="gap-2"
              >
                {modelTraining ? (
                  <>
                    {trainingStatus
                      ? `Training: ${trainingStatus}...`
                      : "Training..."}
                  </>
                ) : (
                  <>Train Model (20 credits)</>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full border-l-0 md:border-l border-r-0 border-t-0 border-b-0 shadow-none rounded-none">
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
              <CardDescription>Preview of your uploaded images</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center w-full h-full">
              {previewFiles.length > 0 ? (
                <Carousel className="w-full md:max-w-md max-w-xs">
                  <CarouselContent>
                    {previewFiles.map((file, index) => {
                      const imageUrl = URL.createObjectURL(file);
                      return (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <div className="flex flex-col items-center p-2">
                              <div className="relative aspect-square w-full md:max-w-[400px] max-w-[200px] overflow-hidden rounded-xl">
                                <Image
                                  src={imageUrl}
                                  alt={file.name}
                                  fill
                                  className="object-cover"
                                  onLoad={() => URL.revokeObjectURL(imageUrl)}
                                />
                              </div>
                              <p className="mt-2 text-sm font-medium text-center truncate max-w-[250px]">
                                {file.name}
                              </p>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-muted mb-4">
                    <ImageIcon className="h-20 w-20 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No images uploaded</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload images using the form on the left to see previews
                    here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

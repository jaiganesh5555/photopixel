"use client"
import { useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { BACKEND_URL } from "@/app/config"
import { SelectModel } from "./Models"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function GenerateImage() {
    const [prompt, setPrompt] = useState("")
    const [selectedModel, setSelectedModel] = useState<string>()
    const [isGenerating, setIsGenerating] = useState(false)
    const { getToken } = useAuth()

    const handleGenerate = async () => {
        if (!prompt || !selectedModel) return
        
        setIsGenerating(true)
        try {
            const token = await getToken()
            await axios.post(`${BACKEND_URL}/ai/generate`, {
                prompt,
                modelId: selectedModel,
                num: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Image generation started!")
            setPrompt("")
        } catch (error) {
            toast.error("Failed to generate image")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <motion.div 
            className="max-w-2xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Generate Image</h2>
                <p className="text-muted-foreground">
                    Describe your imagination and let AI bring it to life
                </p>
            </div>

            <div className="space-y-4">
                <SelectModel
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A serene landscape with mountains reflecting in a crystal-clear lake at sunset..."
                        className="min-h-[120px] text-lg resize-none"
                    />
                </motion.div>

                <motion.div 
                    className="flex justify-end"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt || !selectedModel}
                        className="px-8"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    )
}
"use client"
import { useAuth } from "@clerk/nextjs"
import { BACKEND_URL } from "@/app/config"
import axios from "axios"
import { useEffect, useState } from "react"
import { ImageCard, ImageCardSkeleton, TImage } from "./ImageCard"
import { motion } from "framer-motion"

export function Camera() {
    const [images, setImages] = useState<TImage[]>([])
    const [imagesLoading, setImagesLoading] = useState(true)
    const { getToken } = useAuth()

    useEffect(() => {
        fetchImages()
    }, [])

    useEffect(() => {
        const pollImages = async () => {
            if (images.find(x => x.status !== "Generated")) {
                await new Promise((r) => setTimeout(r, 5000))
                await fetchImages()
            }
        }
        pollImages()
    }, [images])

    const fetchImages = async () => {
        try {
            const token = await getToken()
            const response = await axios.get(`${BACKEND_URL}/image/bulk`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            setImages(response.data.images)
            setImagesLoading(false)
        } catch (error) {
            console.error("Failed to fetch images:", error)
            setImagesLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Gallery</h2>
                <span className="text-sm text-muted-foreground">
                    {images.length} images
                </span>
            </div>
            
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {imagesLoading ? (
                    [...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <ImageCardSkeleton />
                        </motion.div>
                    ))
                ) : (
                    images.map((image, index) => (
                        <motion.div
                            key={image.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="transform transition-all duration-200"
                        >
                            <ImageCard {...image} />
                        </motion.div>
                    ))
                )}
            </motion.div>
            
            {!imagesLoading && images.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No images yet. Start by generating some!</p>
                </div>
            )}
        </div>
    )
}

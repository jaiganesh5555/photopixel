"use client";

import { useState } from "react";
import { SelectModel } from "./Models";
import { PackCard, TPack } from "./PackCard";
import { motion } from "framer-motion";
import { Package, Search, Sparkles, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export function PacksClient({ packs }: { packs: TPack[] }) {
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPacks = packs.filter(pack => 
    pack.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              AI Model Packs
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Transform your ideas into stunning visuals with our curated collection of AI models
            </p>
          </motion.div>
        </div>

        {/* Filters Section */}
        <motion.div 
          className="bg-card border rounded-lg p-6 mb-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Select Model
              </label>
              <SelectModel
                selectedModel={selectedModelId}
                setSelectedModel={setSelectedModelId}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Search Packs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by pack name..."
                  className="pl-9 bg-background/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          {selectedModelId && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Model Selected
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" />
                {filteredPacks.length} Packs Available
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Packs Grid */}
        <motion.div 
          className={cn(
            "grid gap-6",
            "grid-cols-1",
            "sm:grid-cols-2",
            "lg:grid-cols-3",
            "xl:grid-cols-4"
          )}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {filteredPacks.length > 0 ? (
            filteredPacks.map((pack, index) => (
              <motion.div
                key={pack.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="group"
              >
                <PackCard 
                  {...pack} 
                  selectedModelId={selectedModelId!}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="col-span-full"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
            >
              <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed bg-card/50">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-xl font-medium">
                  {searchQuery ? "No matching packs found" : "No packs available"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                  {searchQuery 
                    ? "Try adjusting your search terms or clear the filter"
                    : "Select a model above to view compatible packs"
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

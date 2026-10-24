"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Download } from "lucide-react"

export default function ModelViewer({
  autoRotate = true,
  autoRotateSpeed = 0.3,
  environmentPreset = "sunset",
  enableControls = true,
  showScreenshotButton = false,
  ambientIntensity = 0.6,
  directionalIntensity = 1.5,
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleImageLoad = () => {
    setIsLoaded(true)
    setIsError(false)
  }

  const handleImageError = () => {
    setIsError(true)
    setIsLoaded(false)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d174b27d-662f-40e8-9914-8ab2d847314b.jpg-urrEtJhfbO8ltP1lZFkAOrf1dx0ru6.jpeg"
    link.download = "tech-meeting-demo.jpg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main Container */}
      <motion.div
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 p-[2px] animate-pulse">
          <div className="w-full h-full rounded-2xl bg-gray-900" />
        </div>

        {/* Loading State */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading amazing tech demo...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Failed to load image</p>
              <button
                onClick={() => window.location.reload()}
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Main Image */}
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d174b27d-662f-40e8-9914-8ab2d847314b.jpg-urrEtJhfbO8ltP1lZFkAOrf1dx0ru6.jpeg"
          alt="AI Technology Team Meeting - Futuristic Business Automation"
          className={`absolute inset-[2px] w-[calc(100%-4px)] h-[calc(100%-4px)] object-cover rounded-2xl transition-all duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating Particles */}
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 400,
                  opacity: 0,
                }}
                animate={{
                  y: [null, Math.random() * 400],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </>
        )}

        {/* Corner Accents */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400 opacity-60" />
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-purple-400 opacity-60" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-purple-400 opacity-60" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-400 opacity-60" />

        {/* Info Panel */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-sm rounded-b-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 100, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              {/* <h3 className="text-white font-semibold text-lg mb-1">Live Technology</h3> */}
              <p className="text-gray-300 text-sm">AI-Powered Business Solutions</p>
            </div>
            {/* <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Save</span>
            </button> */}
          </div>
        </motion.div>

        {/* Status Badge */}
        {/* <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">LIVE DEMO</span>
          </div>
        </div> */}
      </motion.div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl scale-110 -z-10" />
    </div>
  )
}

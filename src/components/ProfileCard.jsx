"use client"

import { useEffect, useRef, useCallback } from "react"

const ProfileCard = ({
  avatarUrl = "./src/components/images/ChatGPT_Image_Mar_30__2025__10_12_12_AM-removebg-preview.png",
  name = "Vikas Choudhary",
  title = "Software Engineer",
  handle = "vikashchaudhari103",
  status = "Online",
  contactText = "Contact Me",
  onContactClick,
  enableTilt = true,
}) => {
  const cardRef = useRef(null)
  const glowRef = useRef(null)

  const handleMouseMove = useCallback(
    (e) => {
      if (!enableTilt || !cardRef.current) return

      const card = cardRef.current
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = (y - centerY) / 15
      const rotateY = (centerX - x) / 15

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(139, 92, 246, 0.4), transparent 50%)`
        glowRef.current.style.opacity = "1"
      }
    },
    [enableTilt],
  )

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    if (glowRef.current) {
      glowRef.current.style.opacity = "0"
    }
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    card.addEventListener("mousemove", handleMouseMove)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  const statusColor = status === "Online" ? "#10B981" : "#06B6D4"

  return (
    <div className="relative group">
      <div
        ref={cardRef}
        className="relative w-96 h-[520px] rounded-3xl transition-all duration-300 ease-out cursor-pointer"
        style={{
          background: "linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Glow Effect */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            background: "transparent",
          }}
        />

        {/* Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/30 via-transparent to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="text-center pt-8 pb-4">
            <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
            <p className="text-gray-400 text-base font-medium">{title}</p>
          </div>

          {/* Avatar - Perfect Fit Section */}
          <div className="flex-1 flex items-center justify-center px-6 py-6">
            <div className="relative">
              {/* Main Avatar Container with Perfect Fit */}
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 shadow-2xl relative">
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={name}
                  className="absolute inset-0 w-full h-full transform hover:scale-105 transition-all duration-300"
                  style={{
                    filter: "contrast(1.1) brightness(1.05) saturate(1.1)",
                    objectFit: "cover",
                    objectPosition: "center top"
                  }}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=300&width=300"
                  }}
                />
                {/* Perfect fit overlay for better blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
              </div>
              
              {/* Enhanced glow around avatar */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 mt-auto">
            <div
              className="flex items-center justify-between p-4 rounded-2xl backdrop-blur-sm"
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(148, 163, 184, 0.15)",
              }}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                  <img
                    src={avatarUrl || "/placeholder.svg"}
                    alt={name}
                    className="w-full h-full"
                    style={{
                      objectFit: "cover",
                      objectPosition: "center top"
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=300&width=300"
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-base font-semibold">@{handle}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
                    <p className="text-sm font-medium" style={{ color: statusColor }}>
                      {status}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onContactClick}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex-shrink-0 ml-3"
              >
                {contactText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard

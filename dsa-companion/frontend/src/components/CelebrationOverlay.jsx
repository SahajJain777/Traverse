import React, { useMemo } from "react"
import { createPortal } from "react-dom"
import { RIBBON_COLORS, RIBBON_COUNT } from "../constants"

export default function CelebrationOverlay({ show }) {
  if (!show) return null

  // Generate randomized properties once per overlay mount
  const ribbons = useMemo(() => {
    return Array.from({ length: RIBBON_COUNT }).map((_, index) => {
      const left = Math.random() * 100 // 0 - 100 vw
      const duration = 1.8 + Math.random() * 1.0 // 1.8s - 2.8s
      const delay = Math.random() * 0.4 // 0 - 0.4s
      const startAngle = -30 + Math.random() * 60 // -30 to +30 deg
      const height = 14 + Math.random() * 14 // 14px - 28px
      const width = 2 + Math.random() * 2 // 2px - 4px
      const color = RIBBON_COLORS[Math.floor(Math.random() * RIBBON_COLORS.length)]

      return {
        id: index,
        left: `${left}vw`,
        height: `${height}px`,
        width: `${width}px`,
        backgroundColor: color,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        startAngle: `${startAngle}deg`,
        // Custom styling variables to feed keyframes cleanly
        style: {
          left: `${left}vw`,
          height: `${height}px`,
          width: `${width}px`,
          backgroundColor: color,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          "--start-angle": `${startAngle}deg`,
          top: "-30px",
          position: "absolute",
        },
      }
    })
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1000 }}
    >
      {ribbons.map((ribbon) => (
        <div
          key={ribbon.id}
          style={ribbon.style}
          className="animate-fall"
        />
      ))}
    </div>,
    document.body
  )
}

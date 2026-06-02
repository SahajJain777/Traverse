import React from "react"

export default function ComplexityBadge({ complexity, isBetter }) {
  const styles = isBetter
    ? {
        backgroundColor: "var(--complexity-better)",
        color: "var(--complexity-better-text)",
      }
    : {
        backgroundColor: "var(--complexity-worse)",
        color: "var(--complexity-worse-text)",
      }

  return (
    <span
      style={styles}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium"
    >
      {complexity}
    </span>
  )
}

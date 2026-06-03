import React from "react"

/**
 * Wraps tab content panels in a sliding horizontal container.
 * Each child is shown/hidden with a CSS translateX transition.
 *
 * @param {number}  activeIndex - 0-based index of the active tab
 * @param {React.ReactNode[]} children - one element per tab
 * @param {string}  [className] - additional classes for the outer wrapper
 */
export default function TabSlider({ activeIndex, children, className = "" }) {
  const count = React.Children.count(children)

  return (
    <div className={`overflow-hidden w-full h-full ${className}`}>
      <div
        className="flex transition-transform duration-300 ease-in-out h-full"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(-${(activeIndex / count) * 100}%)`,
        }}
      >
        {React.Children.map(children, (child, i) => (
          <div key={i} className="flex-shrink-0 h-full" style={{ width: `${100 / count}%` }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

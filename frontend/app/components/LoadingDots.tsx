'use client'

import { useEffect, useRef } from 'react'

interface LoadingDotsProps {
  color?: string
  size?: number
  space?: number
  className?: string
}

export default function LoadingDots({ 
  color = "currentColor", 
  size = 4, 
  space = 1,
  className = ""
}: LoadingDotsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Ensure animations are smooth
    const container = containerRef.current
    if (container) {
      container.style.opacity = '1'
    }
    
    return () => {
      if (container) {
        container.style.opacity = '0'
      }
    }
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className={`loading-dots transition-opacity ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            margin: `0 ${space}px`,
            backgroundColor: color,
            borderRadius: '50%',
            display: 'inline-block',
            animationDelay: `${i * 0.15}s`
          }}
          className="animate-pulse"
        />
      ))}
    </div>
  )
}

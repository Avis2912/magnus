'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [currentChildren, setCurrentChildren] = useState(children)
  
  useEffect(() => {
    // Always immediately display the new page to avoid black screen issues
    setCurrentChildren(children)
    
    // Ensure the background color is always set
    document.body.style.backgroundColor = "#0A0A0A"
    document.documentElement.style.backgroundColor = "#0A0A0A"
  }, [pathname, children])
  
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      {currentChildren}
    </div>
  )
}

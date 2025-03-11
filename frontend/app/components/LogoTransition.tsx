'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function LogoTransition() {
  const [show, setShow] = useState(true)

  return (
    <div className="logo-animation">
      <div className="logo-container">
        <img 
          src="/png.logo" 
          alt="Magnus Logo" 
          width={60} 
          height={60} 
          className="mr-2"
        />
        <h1 className="text-white im-fell-great-primer-regular">
          <span>Magnus</span>
        </h1>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-4">
        <Loader2 className="h-8 w-8 text-[#10A37F] animate-spin mx-auto" />
      </div>
    </div>
  )
}

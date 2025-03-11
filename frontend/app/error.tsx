'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/70 p-8 rounded-lg border border-red-500/20">
        <div className="w-16 h-16 mx-auto text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-center mb-4">Something went wrong!</h2>
        
        <p className="text-gray-300 mb-6 text-center">
          {error?.message || 'An unexpected error occurred'}
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Try again
          </button>
          
          <Link
            href="/"
            className="px-4 py-2 bg-[#10A37F] hover:bg-[#0D8A6C] rounded transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}

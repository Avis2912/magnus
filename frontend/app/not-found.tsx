import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-8">
          <img 
            src="/png.logo" 
            alt="Magnus Logo" 
            width={40} 
            height={40} 
            className="mr-2" 
          />
          <h2 className="text-xl brand-heading font-light">Magnus</h2>
        </div>
        
        <h1 className="brand-heading text-4xl font-light mb-4">
          <span>404</span>
          <span className="text-[#10A37F]">.</span>
        </h1>
        <p className="text-[#BBBBBB] text-lg mb-8">We couldn't find the page you're looking for.</p>
        <Link 
          href="/"
          className="inline-block px-5 py-3 bg-[#111] hover:bg-[#222] border border-[#363636] rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

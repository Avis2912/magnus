import './globals.css'
import Script from 'next/script'
import { Raleway } from 'next/font/google'

// Load Raleway font from Google Fonts
const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
  weight: ['300', '400', '500', '600', '700']
})

// IM Fell Great Primer will be loaded via <link> tags instead of next/font
// since it's not part of the common Google fonts in next/font/google

export const metadata = {
  title: 'Magnus - Your AI Assistant',
  description: 'A versatile AI agent that can solve any task using multiple tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${raleway.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IM+Fell+Great+Primer:ital@0;1&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { 
            background-color: #000000 !important; 
            color: white !important;
          }
        ` }} />
      </head>
      <body style={{ backgroundColor: '#000000', color: 'white' }}>
        <Script id="preventFlash" strategy="beforeInteractive">
          {`
            document.documentElement.style.backgroundColor = "#000000";
            document.documentElement.style.color = "white";
            document.body.style.backgroundColor = "#000000";
            document.body.style.color = "white";
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
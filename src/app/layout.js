// src/app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PartnerLogic - Partner Relationship Management by AmpleLogic',
  description: 'The unified Partner Relationship Management platform that empowers your partners to drive revenue growth together.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}  // Add this line
      >
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
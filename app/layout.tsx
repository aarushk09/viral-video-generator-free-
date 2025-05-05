import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Nebula - Create Viral Videos with AI',
  description: 'Transform your stories into stunning videos with automatic captions and professional editing',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-route-test="root-layout">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

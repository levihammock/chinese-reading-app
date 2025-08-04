import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KanKan - Chinese Learning App',
  description: 'Learn Chinese with personalized lessons and interactive exercises',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-gilroy">
        {children}
      </body>
    </html>
  )
}

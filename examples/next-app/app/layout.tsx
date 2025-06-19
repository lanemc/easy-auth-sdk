import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextAuthProvider } from 'easy-auth-sdk/next/client'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Easy Auth SDK Example',
  description: 'Example app using Easy Auth SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider basePath="/api/auth">
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
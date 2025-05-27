'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Layout = ({children}: {children: React.ReactNode}) => {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <h1 className="text-3xl">{isDashboard ? 'DASHBOARD' : 'NAVBAR'}</h1>
        {children}
    </div>
  )
}

export default Layout
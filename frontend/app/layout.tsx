import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { DataRefreshProvider } from '@/contexts/data-refresh-context'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChromaDB Dashboard',
  description: 'Visual management panel for ChromaDB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DataRefreshProvider>
            {children}
            <Toaster />
          </DataRefreshProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

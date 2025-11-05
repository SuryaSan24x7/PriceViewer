import type { Metadata } from 'next'
import '../styles/globals.css' // Corrected import path
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Price - Tracker',
  description: 'Price Tracker',
  generator: 'suraj',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

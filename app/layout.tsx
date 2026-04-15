import type { Metadata } from 'next'
import { Space_Mono, Inter, Cinzel, Spectral } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

// Global — used everywhere except Wolf Club chat
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Wolf Club exclusive — scoped via font-wc-label / font-wc Tailwind classes
const cinzel = Cinzel({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const spectral = Spectral({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-spectral',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ROA',
  description: 'Sitio oficial de ROA — Artista puertorriqueño',
  openGraph: {
    title: 'ROA',
    description: 'Sitio oficial de ROA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${spaceMono.variable} ${inter.variable} ${cinzel.variable} ${spectral.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

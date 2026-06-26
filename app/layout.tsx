import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NT Automação Hub',
  description: 'Hub de automação de processos — Nova Trindade SSC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

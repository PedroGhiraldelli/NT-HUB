import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NT Automação Hub',
  description: 'Hub de automação de processos — Nova Trindade SSC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('nt-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}

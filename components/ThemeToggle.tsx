'use client'

import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from './Icons'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('nt-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('nt-theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Modo dia' : 'Modo noite'}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      <span>{dark ? 'Modo dia' : 'Modo noite'}</span>
    </button>
  )
}

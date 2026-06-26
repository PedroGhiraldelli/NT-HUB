'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginAction(email, password)

    if ('error' in result) {
      setError(
        result.error.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos.'
          : `Erro de autenticação: ${result.error}`
      )
      setLoading(false)
      return
    }

    // Server Action setou os cookies de sessão na resposta HTTP.
    // window.location.href força requisição completa com esses cookies.
    window.location.href = '/dashboard'
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-card bg-white shadow-lg overflow-hidden">
        <div className="bg-nt-primary px-8 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <span className="text-2xl font-bold text-white">NT</span>
          </div>
          <h1 className="text-xl font-bold text-white">NT Automação Hub</h1>
          <p className="mt-1 text-sm text-blue-200">Nova Trindade SSC</p>
        </div>

        <div className="px-8 py-8">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-700">
            Entrar na plataforma
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="block w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-nt-accent focus:outline-none focus:ring-1 focus:ring-nt-accent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-nt-accent focus:outline-none focus:ring-1 focus:ring-nt-accent"
              />
            </div>

            {error && (
              <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-input bg-nt-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#142d55] disabled:opacity-60"
            >
              {loading && <LoadingSpinner size="sm" className="text-white" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Acesso restrito a colaboradores da Nova Trindade SSC.<br />
            Entre em contato com o administrador para obter acesso.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/app/actions/users'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CheckCircleIcon, XIcon } from '@/components/Icons'
import { COMPANIES } from '@/lib/constants'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewUserPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(generatePassword())
  const [role, setRole] = useState('collaborator')
  const [company, setCompany] = useState('')
  const [managedCompany, setManagedCompany] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [createdPassword, setCreatedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Nome é obrigatório'
    if (!email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    if (!password || password.length < 8) e.password = 'Senha deve ter ao menos 8 caracteres'
    if (!role) e.role = 'Perfil é obrigatório'
    if (!company) e.company = 'Empresa é obrigatória'
    if (role === 'director' && !managedCompany) e.managedCompany = 'Empresa gerenciada é obrigatória para Diretores'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const result = await createUser({
      full_name: fullName,
      email,
      password,
      role,
      company,
      managed_company: role === 'director' ? managedCompany : undefined,
    })

    if (result.error) {
      setErrors({ submit: result.error })
      setSubmitting(false)
      return
    }

    setCreatedPassword(password)
    setSuccessModal(true)
    setSubmitting(false)
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Novo Usuário</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crie um novo acesso ao NT Automação Hub</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-nt-accent hover:underline">← Voltar</button>
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha temporária *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 rounded-input border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-nt-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="rounded-input border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 shrink-0"
              >
                Gerar nova
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil *</label>
              <select
                value={role}
                onChange={e => { setRole(e.target.value); if (e.target.value !== 'director') setManagedCompany('') }}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white"
              >
                <option value="collaborator">Colaborador</option>
                <option value="director">Diretor</option>
                <option value="analyst">Analista</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa *</label>
              <select
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white"
              >
                <option value="">Selecione...</option>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company}</p>}
            </div>
          </div>

          {role === 'director' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa que gerencia *</label>
              <select
                value={managedCompany}
                onChange={e => setManagedCompany(e.target.value)}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white"
              >
                <option value="">Selecione a empresa gerenciada...</option>
                {COMPANIES.filter(c => c !== 'Nova Trindade SSC').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.managedCompany && <p className="mt-1 text-xs text-red-500">{errors.managedCompany}</p>}
              <p className="mt-1 text-xs text-gray-400">O diretor poderá visualizar os usuários e chamados desta empresa.</p>
            </div>
          )}

          {errors.submit && (
            <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-input border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-input bg-nt-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-60 transition-colors"
            >
              {submitting && <LoadingSpinner size="sm" className="text-white" />}
              {submitting ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de sucesso */}
      <Modal isOpen={successModal} onClose={() => { setSuccessModal(false); router.push('/admin/users') }} title="Usuário criado com sucesso!">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircleIcon size={24} />
            <p className="text-sm font-medium">O acesso foi criado para <strong>{email}</strong>.</p>
          </div>

          <div className="rounded-input border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Senha temporária</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-base font-bold text-nt-primary break-all">{createdPassword}</code>
              <button
                onClick={copyToClipboard}
                className="rounded px-3 py-1.5 text-xs font-medium border border-gray-300 hover:bg-gray-100 shrink-0 transition-colors"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-input px-3 py-2">
            Compartilhe esta senha com o usuário e peça para ele alterar no primeiro acesso.
          </p>

          <button
            onClick={() => { setSuccessModal(false); router.push('/admin/users') }}
            className="w-full rounded-input bg-nt-primary py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors"
          >
            Ir para lista de usuários
          </button>
        </div>
      </Modal>
    </div>
  )
}

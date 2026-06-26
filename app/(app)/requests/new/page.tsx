'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { StepWizard } from '@/components/StepWizard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { WizardFormData } from '@/lib/types'
import { COMPANIES, FREQUENCIES, TIMES_PER_EXECUTION, DATA_SOURCES, DATA_DESTINATIONS } from '@/lib/constants'

const STEP_TITLES = ['Identificação', 'Tarefa', 'Contexto Técnico', 'Impacto', 'Revisão']

const emptyForm: WizardFormData = {
  full_name: '', company: '', email: '',
  title: '', task_description: '', frequency: '', time_per_execution: '', people_count: 1,
  only_m365: '', systems_involved: '', requires_external_login: '', has_captcha: '',
  data_sources: [], data_destinations: [],
  business_justification: '', business_rules: '',
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">{children}</h3>
}

function ReviewItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value || <span className="italic text-gray-400">Não informado</span>}</p>
    </div>
  )
}

export default function NewRequestPage() {
  const { profile } = useUser()
  const router = useRouter()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<WizardFormData>({
    ...emptyForm,
    full_name: profile.full_name,
    company: profile.company,
    email: profile.email,
  })
  const [errors, setErrors] = useState<Partial<WizardFormData & Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof WizardFormData, value: WizardFormData[keyof WizardFormData]) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function toggleArray(field: 'data_sources' | 'data_destinations', value: string) {
    setFormData(prev => {
      const arr = prev[field] as string[]
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  function validateStep(s: number): boolean {
    const e: Partial<Record<string, string>> = {}
    if (s === 1) {
      if (!formData.full_name.trim()) e.full_name = 'Nome é obrigatório'
      if (!formData.company) e.company = 'Empresa é obrigatória'
      if (!formData.email.trim()) e.email = 'E-mail é obrigatório'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'E-mail inválido'
    }
    if (s === 2) {
      if (!formData.title.trim()) e.title = 'Nome da tarefa é obrigatório'
      if (!formData.task_description.trim()) e.task_description = 'Descrição é obrigatória'
      if (!formData.frequency) e.frequency = 'Frequência é obrigatória'
      if (!formData.time_per_execution) e.time_per_execution = 'Tempo é obrigatório'
    }
    if (s === 3) {
      if (!formData.only_m365) e.only_m365 = 'Selecione uma opção'
      if (!formData.requires_external_login) e.requires_external_login = 'Selecione uma opção'
      if (!formData.has_captcha) e.has_captcha = 'Selecione uma opção'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 5))
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('automation_requests')
      .insert({
        request_number: '',
        title: formData.title,
        company: formData.company,
        submitter_id: profile.id,
        submitter_name: formData.full_name,
        submitter_email: formData.email,
        task_description: formData.task_description,
        frequency: formData.frequency,
        time_per_execution: formData.time_per_execution,
        people_count: formData.people_count,
        only_m365: formData.only_m365,
        systems_involved: formData.systems_involved || null,
        requires_external_login: formData.requires_external_login,
        has_captcha: formData.has_captcha,
        data_sources: formData.data_sources,
        data_destinations: formData.data_destinations,
        business_justification: formData.business_justification || null,
        business_rules: formData.business_rules || null,
        status: 'new',
      })
      .select('request_number')
      .single()

    if (error) {
      showToast('Erro ao enviar chamado: ' + error.message, 'error')
      setSubmitting(false)
      return
    }

    showToast(`Chamado ${data.request_number} enviado com sucesso!`, 'success')
    router.push('/requests')
  }

  const RadioGroup = ({ field, options }: { field: keyof WizardFormData; options: { value: string; label: string }[] }) => (
    <div className="space-y-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name={field}
            value={opt.value}
            checked={(formData[field] as string) === opt.value}
            onChange={() => update(field, opt.value)}
            className="h-4 w-4 text-nt-accent border-gray-300 focus:ring-nt-accent"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
      {errors[field as string] && <FieldError msg={errors[field as string]!} />}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nt-primary">Novo Chamado de Automação</h1>
        <p className="text-sm text-gray-500 mt-1">Descreva o processo que deseja automatizar</p>
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm">
        <StepWizard currentStep={step} totalSteps={5} stepTitles={STEP_TITLES} />

        {/* Etapa 1 — Identificação */}
        {step === 1 && (
          <div className="space-y-5">
            <SectionTitle>Etapa 1 — Identificação</SectionTitle>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={e => update('full_name', e.target.value)}
                className="input-base"
              />
              {errors.full_name && <FieldError msg={errors.full_name} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa / Setor</label>
              <select
                value={formData.company}
                onChange={e => update('company', e.target.value)}
                className="input-base"
              >
                <option value="">Selecione...</option>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.company && <FieldError msg={errors.company} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => update('email', e.target.value)}
                className="input-base"
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>
          </div>
        )}

        {/* Etapa 2 — Tarefa */}
        {step === 2 && (
          <div className="space-y-5">
            <SectionTitle>Etapa 2 — Descrição da tarefa</SectionTitle>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da tarefa</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Ex: Baixar extratos bancários todo dia"
                className="input-base"
              />
              {errors.title && <FieldError msg={errors.title} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Como você executa essa tarefa hoje?</label>
              <textarea
                value={formData.task_description}
                onChange={e => update('task_description', e.target.value)}
                rows={5}
                placeholder="Passo a passo: o que você abre, onde clica, o que copia, o que digita, onde salva..."
                className="input-base resize-none"
              />
              {errors.task_description && <FieldError msg={errors.task_description} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequência</label>
                <select value={formData.frequency} onChange={e => update('frequency', e.target.value)} className="input-base">
                  <option value="">Selecione...</option>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {errors.frequency && <FieldError msg={errors.frequency} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tempo por execução</label>
                <select value={formData.time_per_execution} onChange={e => update('time_per_execution', e.target.value)} className="input-base">
                  <option value="">Selecione...</option>
                  {TIMES_PER_EXECUTION.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.time_per_execution && <FieldError msg={errors.time_per_execution} />}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantas pessoas fazem essa tarefa?</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.people_count}
                onChange={e => update('people_count', parseInt(e.target.value) || 1)}
                className="input-base w-32"
              />
            </div>
          </div>
        )}

        {/* Etapa 3 — Contexto técnico */}
        {step === 3 && (
          <div className="space-y-6">
            <SectionTitle>Etapa 3 — Contexto técnico</SectionTitle>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Envolve apenas ferramentas Microsoft 365?</label>
              <RadioGroup field="only_m365" options={[
                { value: 'yes', label: 'Sim, apenas M365 (Word, Excel, Outlook, SharePoint, Teams...)' },
                { value: 'no', label: 'Não, usa outros sistemas' },
                { value: 'unknown', label: 'Não sei' },
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quais sistemas ou sites estão envolvidos?</label>
              <textarea
                value={formData.systems_involved}
                onChange={e => update('systems_involved', e.target.value)}
                rows={2}
                placeholder="Ex: portal da Receita Federal, sistema do banco, SAP..."
                className="input-base resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exige login em sistema externo?</label>
              <RadioGroup field="requires_external_login" options={[
                { value: 'yes', label: 'Sim' },
                { value: 'no', label: 'Não' },
                { value: 'unknown', label: 'Não sei' },
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Existe CAPTCHA em algum portal?</label>
              <RadioGroup field="has_captcha" options={[
                { value: 'yes', label: 'Sim' },
                { value: 'no', label: 'Não' },
                { value: 'unknown', label: 'Não sei' },
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dados vêm de onde?</label>
              <div className="grid grid-cols-2 gap-2">
                {DATA_SOURCES.map(src => (
                  <label key={src} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.data_sources.includes(src)}
                      onChange={() => toggleArray('data_sources', src)}
                      className="h-4 w-4 rounded text-nt-accent border-gray-300 focus:ring-nt-accent"
                    />
                    <span className="text-sm text-gray-700">{src}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultado vai para onde?</label>
              <div className="grid grid-cols-2 gap-2">
                {DATA_DESTINATIONS.map(dst => (
                  <label key={dst} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.data_destinations.includes(dst)}
                      onChange={() => toggleArray('data_destinations', dst)}
                      className="h-4 w-4 rounded text-nt-accent border-gray-300 focus:ring-nt-accent"
                    />
                    <span className="text-sm text-gray-700">{dst}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Etapa 4 — Impacto */}
        {step === 4 && (
          <div className="space-y-5">
            <SectionTitle>Etapa 4 — Impacto e justificativa</SectionTitle>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Por que é importante automatizar?</label>
              <textarea
                value={formData.business_justification}
                onChange={e => update('business_justification', e.target.value)}
                rows={4}
                placeholder="Qual o risco se esquecer? O que trava quando não é feito?"
                className="input-base resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Regras de negócio específicas?</label>
              <textarea
                value={formData.business_rules}
                onChange={e => update('business_rules', e.target.value)}
                rows={4}
                placeholder="Ex: só rodar em dias úteis, validar valor antes de gravar..."
                className="input-base resize-none"
              />
            </div>
          </div>
        )}

        {/* Etapa 5 — Revisão */}
        {step === 5 && (
          <div>
            <SectionTitle>Etapa 5 — Revisão</SectionTitle>
            <div className="rounded-input border border-gray-200 p-4 mb-5 space-y-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Identificação</p>
              <ReviewItem label="Nome" value={formData.full_name} />
              <ReviewItem label="Empresa" value={formData.company} />
              <ReviewItem label="E-mail" value={formData.email} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-3">Tarefa</p>
              <ReviewItem label="Nome da tarefa" value={formData.title} />
              <ReviewItem label="Descrição" value={formData.task_description} />
              <ReviewItem label="Frequência" value={formData.frequency} />
              <ReviewItem label="Tempo por execução" value={formData.time_per_execution} />
              <ReviewItem label="Pessoas envolvidas" value={formData.people_count} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-3">Contexto Técnico</p>
              <ReviewItem label="Apenas M365" value={{ yes: 'Sim', no: 'Não', unknown: 'Não sei' }[formData.only_m365]} />
              <ReviewItem label="Sistemas envolvidos" value={formData.systems_involved} />
              <ReviewItem label="Login externo" value={{ yes: 'Sim', no: 'Não', unknown: 'Não sei' }[formData.requires_external_login]} />
              <ReviewItem label="CAPTCHA" value={{ yes: 'Sim', no: 'Não', unknown: 'Não sei' }[formData.has_captcha]} />
              <ReviewItem label="Dados de" value={formData.data_sources.join(', ')} />
              <ReviewItem label="Dados para" value={formData.data_destinations.join(', ')} />
              {formData.business_justification && (
                <>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-3">Impacto</p>
                  <ReviewItem label="Justificativa" value={formData.business_justification} />
                  <ReviewItem label="Regras de negócio" value={formData.business_rules} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Navegação */}
        <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="rounded-input border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Voltar
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="rounded-input bg-nt-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors"
            >
              Próxima etapa
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-input bg-nt-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {submitting && <LoadingSpinner size="sm" className="text-white" />}
              {submitting ? 'Enviando...' : 'Enviar Chamado'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

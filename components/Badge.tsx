interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gray'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
  gray: 'bg-gray-100 text-gray-700',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    new:       { label: 'Novo',        variant: 'info' },
    analyzing: { label: 'Em Análise', variant: 'warning' },
    approved:  { label: 'Aprovado',   variant: 'success' },
    backlog:   { label: 'Backlog',    variant: 'gray' },
    discarded: { label: 'Descartado', variant: 'error' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}

export function ComplexityBadge({ complexity }: { complexity: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    simple:  { label: 'Simples',  variant: 'success' },
    medium:  { label: 'Médio',    variant: 'warning' },
    complex: { label: 'Complexo', variant: 'error' },
  }
  const { label, variant } = map[complexity] ?? { label: complexity, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    admin:        { label: 'Admin',        variant: 'error' },
    analyst:      { label: 'Analista',     variant: 'info' },
    director:     { label: 'Diretor',      variant: 'warning' },
    collaborator: { label: 'Colaborador',  variant: 'success' },
  }
  const { label, variant } = map[role] ?? { label: role, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}

export function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    operational_process: 'Processo',
    fiscal: 'Fiscal',
    accounting: 'Contábil',
    hr: 'RH',
    it: 'TI',
    tool_system: 'Ferramenta',
    policy: 'Política',
    other: 'Outro',
  }
  return <Badge variant="info">{labels[category] ?? category}</Badge>
}

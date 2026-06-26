export const COMPANIES = [
  'IA Tecnologia',
  'Safe Conversão Digital',
  'DBSeller',
  'TX Capital',
  'Brasbuilding',
  'Fazenda Nova Trindade',
  'PIQL South America',
  'Nova Trindade SSC',
  'Outro',
]

export const FREQUENCIES = [
  'Várias vezes por dia',
  'Diariamente',
  'Semanalmente',
  'Quinzenalmente',
  'Mensalmente',
  'Sob demanda',
]

export const TIMES_PER_EXECUTION = [
  'Menos de 5 min',
  '5–15 min',
  '15–30 min',
  '30–60 min',
  'Mais de 1 hora',
]

export const DATA_SOURCES = [
  'Planilha Excel',
  'E-mail',
  'SharePoint',
  'Sistema interno',
  'Portal web',
  'Digitação manual',
  'Outro',
]

export const DATA_DESTINATIONS = [
  'Planilha Excel',
  'E-mail',
  'SharePoint',
  'Sistema interno',
  'Impressão/PDF',
  'Outro',
]

export const ARTICLE_CATEGORIES: Record<string, string> = {
  operational_process: 'Processo Operacional',
  fiscal: 'Fiscal',
  accounting: 'Contábil',
  hr: 'RH',
  it: 'TI',
  tool_system: 'Ferramenta/Sistema',
  policy: 'Política Interna',
  other: 'Outro',
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  analyzing: 'Em Análise',
  approved: 'Aprovado',
  backlog: 'Backlog',
  discarded: 'Descartado',
}

export const COMPLEXITY_LABELS: Record<string, string> = {
  simple: 'Simples',
  medium: 'Médio',
  complex: 'Complexo',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  analyst: 'Analista',
  director: 'Diretor',
  collaborator: 'Colaborador',
}

export const AUTOMATION_STATUS_LABELS: Record<string, string> = {
  planned: 'Planejada',
  development: 'Em Desenvolvimento',
  active: 'Ativa',
  paused: 'Pausada',
}

export const AUTOMATION_STATUS_COLORS: Record<string, string> = {
  planned: '#9CA3AF',
  development: '#D97706',
  active: '#16A34A',
  paused: '#DC2626',
}

export const AUTOMATION_CATEGORIES: Record<string, string> = {
  rpa: 'RPA / Automação Web',
  fiscal: 'Financeiro / Fiscal',
  data_integration: 'Integração de Dados',
  report: 'Relatórios / Dashboard',
  email: 'E-mail / Comunicação',
  document: 'Documentos / PDF',
  erp: 'ERP / Sistema Interno',
  api: 'API / Webhook',
  other: 'Outro',
}

export const AUTOMATION_TOOLS = [
  'Power Automate',
  'n8n',
  'Python',
  'Excel VBA',
  'Power BI',
  'Make (Integromat)',
  'Zapier',
  'Outro',
]

export const BOTTLENECK_PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export const BOTTLENECK_PRIORITY_COLORS: Record<string, string> = {
  high: '#DC2626',
  medium: '#D97706',
  low: '#16A34A',
}

export const BOTTLENECK_STATUS_LABELS: Record<string, string> = {
  evaluating: 'Avaliando',
  approved: 'Aprovado',
  pipeline: 'Pipeline',
  discarded: 'Descartado',
}

// Frequência → multiplicador mensal
export const FREQUENCY_MONTHLY: Record<string, number> = {
  'Várias vezes por dia': 100,
  'Diariamente': 22,
  'Semanalmente': 4.3,
  'Quinzenalmente': 2,
  'Mensalmente': 1,
  'Sob demanda': 0,
}

// Tempo por execução → minutos (ponto médio)
export const TIME_MINUTES: Record<string, number> = {
  'Menos de 5 min': 2.5,
  '5–15 min': 10,
  '15–30 min': 22.5,
  '30–60 min': 45,
  'Mais de 1 hora': 90,
}

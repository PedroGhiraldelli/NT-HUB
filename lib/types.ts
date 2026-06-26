export type Role = 'admin' | 'analyst' | 'director' | 'collaborator'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  company: string
  managed_company?: string | null
  created_at: string
  created_by?: string | null
  active: boolean
}

export type RequestStatus = 'new' | 'analyzing' | 'approved' | 'backlog' | 'discarded'
export type Complexity = 'simple' | 'medium' | 'complex'

export interface AutomationRequest {
  id: string
  request_number: string
  title: string
  company: string
  submitter_id: string
  submitter_name: string
  submitter_email: string
  task_description: string
  frequency: string
  time_per_execution: string
  people_count: number
  only_m365: string
  systems_involved?: string | null
  requires_external_login: string
  has_captcha: string
  data_sources: string[]
  data_destinations: string[]
  business_justification?: string | null
  business_rules?: string | null
  status: RequestStatus
  complexity: Complexity
  analyst_notes?: string | null
  created_at: string
  updated_at: string
}

export type ArticleStatus = 'published' | 'archived'
export type ArticleCategory =
  | 'operational_process'
  | 'fiscal'
  | 'accounting'
  | 'hr'
  | 'it'
  | 'tool_system'
  | 'policy'
  | 'other'

export interface KnowledgeArticle {
  id: string
  article_number: string
  title: string
  company: string
  category: ArticleCategory
  tags: string[]
  content: string
  author_id: string
  author_name: string
  status: ArticleStatus
  created_at: string
  updated_at: string
}

export interface RequestComment {
  id: string
  request_id: string
  author_id: string
  author_name: string
  author_role: string
  content: string
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

export type AutomationStatus = 'planned' | 'development' | 'active' | 'paused'
export type BottleneckPriority = 'high' | 'medium' | 'low'
export type BottleneckStatus = 'evaluating' | 'approved' | 'pipeline' | 'discarded'

export interface Automation {
  id: string
  name: string
  company: string
  status: AutomationStatus
  tool: string | null
  category: string | null
  description: string | null
  workflow_steps: string | null
  icon: string
  color: string
  technical_notes: string | null
  monthly_hours_saved: number
  hourly_cost: number
  development_hours: number
  monthly_license_cost: number
  go_live_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Bottleneck {
  id: string
  need: string
  proposed_tool: string | null
  priority: BottleneckPriority
  status: BottleneckStatus
  estimated_monthly_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WizardFormData {
  full_name: string
  company: string
  email: string
  title: string
  task_description: string
  frequency: string
  time_per_execution: string
  people_count: number
  only_m365: string
  systems_involved: string
  requires_external_login: string
  has_captcha: string
  data_sources: string[]
  data_destinations: string[]
  business_justification: string
  business_rules: string
}

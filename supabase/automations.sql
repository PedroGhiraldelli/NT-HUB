-- ============================================================
-- NT Automação Hub — Módulo de Automações e Gargalos (Admin)
-- Execute no SQL Editor do Supabase após schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.automations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  company               text NOT NULL,
  status                text NOT NULL DEFAULT 'planned'
                        CHECK (status IN ('planned', 'development', 'active', 'paused')),
  tool                  text,
  category              text,
  description           text,
  workflow_steps        text,
  icon                  text NOT NULL DEFAULT '🤖',
  color                 text NOT NULL DEFAULT '#4A90D9',
  technical_notes       text,

  -- ROI real (diferente das estimativas dos chamados)
  monthly_hours_saved   numeric NOT NULL DEFAULT 0,
  hourly_cost           numeric NOT NULL DEFAULT 25,
  development_hours     numeric NOT NULL DEFAULT 0,
  monthly_license_cost  numeric NOT NULL DEFAULT 0,
  go_live_date          date,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  created_by            uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.bottlenecks (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need                    text NOT NULL,
  proposed_tool           text,
  priority                text NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('high', 'medium', 'low')),
  status                  text NOT NULL DEFAULT 'evaluating'
                          CHECK (status IN ('evaluating', 'approved', 'pipeline', 'discarded')),
  estimated_monthly_cost  numeric NOT NULL DEFAULT 0,
  notes                   text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE OR REPLACE TRIGGER trigger_updated_at_automations
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_updated_at_bottlenecks
  BEFORE UPDATE ON public.bottlenecks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.automations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottlenecks  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automations_admin_all" ON public.automations
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "bottlenecks_admin_all" ON public.bottlenecks
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_automations_company ON public.automations (company);
CREATE INDEX IF NOT EXISTS idx_automations_status  ON public.automations (status);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_status  ON public.bottlenecks (status);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_priority ON public.bottlenecks (priority);

-- ============================================================
-- NT Automação Hub — Schema completo
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- Tabela de perfis (extende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'analyst', 'director', 'collaborator')),
  company       text NOT NULL,
  managed_company text,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  created_by    uuid REFERENCES public.profiles(id)
);

-- Sequências para numeração automática
CREATE TABLE IF NOT EXISTS public.request_sequences (
  year         integer PRIMARY KEY,
  last_number  integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.article_sequences (
  year         integer PRIMARY KEY,
  last_number  integer NOT NULL DEFAULT 0
);

-- Chamados de automação
CREATE TABLE IF NOT EXISTS public.automation_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number       text UNIQUE NOT NULL,
  title                text NOT NULL,
  company              text NOT NULL,
  submitter_id         uuid REFERENCES public.profiles(id),
  submitter_name       text NOT NULL,
  submitter_email      text NOT NULL,

  -- Etapa 2
  task_description     text NOT NULL,
  frequency            text NOT NULL,
  time_per_execution   text NOT NULL,
  people_count         integer NOT NULL DEFAULT 1,

  -- Etapa 3
  only_m365            text NOT NULL,
  systems_involved     text,
  requires_external_login text NOT NULL,
  has_captcha          text NOT NULL,
  data_sources         text[] NOT NULL DEFAULT '{}',
  data_destinations    text[] NOT NULL DEFAULT '{}',

  -- Etapa 4
  business_justification text,
  business_rules         text,

  -- Gestão
  status      text NOT NULL DEFAULT 'new'
              CHECK (status IN ('new', 'analyzing', 'approved', 'backlog', 'discarded')),
  complexity  text GENERATED ALWAYS AS (
                CASE
                  WHEN has_captcha = 'yes' THEN 'complex'
                  WHEN only_m365 = 'yes' AND requires_external_login = 'no' THEN 'simple'
                  ELSE 'medium'
                END
              ) STORED,
  analyst_notes text,

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Artigos da base de conhecimento
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_number text UNIQUE NOT NULL,
  title          text NOT NULL,
  company        text NOT NULL,
  category       text NOT NULL
                 CHECK (category IN ('operational_process','fiscal','accounting','hr','it','tool_system','policy','other')),
  tags           text[] NOT NULL DEFAULT '{}',
  content        text NOT NULL,
  author_id      uuid REFERENCES public.profiles(id),
  author_name    text NOT NULL,
  status         text NOT NULL DEFAULT 'published'
                 CHECK (status IN ('published', 'archived')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================
-- Funções auxiliares (SECURITY DEFINER para evitar recursão RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_managed_company()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT managed_company FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_company()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT company FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- Funções de geração de número sequencial
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  current_year  integer;
  next_num      integer;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO public.request_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = request_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'NT-' || current_year || '-' || LPAD(next_num::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_article_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  current_year  integer;
  next_num      integer;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO public.article_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = article_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'KB-' || current_year || '-' || LPAD(next_num::text, 3, '0');
END;
$$;

-- ============================================================
-- Triggers para numeração automática
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_request_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := public.generate_request_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_set_request_number
  BEFORE INSERT ON public.automation_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_request_number();

CREATE OR REPLACE FUNCTION public.set_article_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.article_number IS NULL OR NEW.article_number = '' THEN
    NEW.article_number := public.generate_article_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_set_article_number
  BEFORE INSERT ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_article_number();

-- ============================================================
-- Trigger para updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_updated_at_requests
  BEFORE UPDATE ON public.automation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trigger_updated_at_articles
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_sequences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_sequences     ENABLE ROW LEVEL SECURITY;

-- Sequências: acesso total apenas para funções (SECURITY DEFINER já bypassa)
CREATE POLICY "sequences_all" ON public.request_sequences FOR ALL USING (true);
CREATE POLICY "art_sequences_all" ON public.article_sequences FOR ALL USING (true);

-- --- profiles ---
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.get_my_role() IN ('admin', 'analyst')
    OR (public.get_my_role() = 'director' AND company = public.get_my_managed_company())
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- --- automation_requests ---
CREATE POLICY "requests_select" ON public.automation_requests
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'analyst')
    OR (public.get_my_role() = 'director' AND company = public.get_my_managed_company())
    OR submitter_id = auth.uid()
  );

CREATE POLICY "requests_insert" ON public.automation_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "requests_update" ON public.automation_requests
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'analyst')
    OR submitter_id = auth.uid()
  );

-- --- knowledge_articles ---
CREATE POLICY "articles_select" ON public.knowledge_articles
  FOR SELECT USING (
    status = 'published'
    OR public.get_my_role() IN ('admin', 'analyst')
  );

CREATE POLICY "articles_insert" ON public.knowledge_articles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "articles_update" ON public.knowledge_articles
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'analyst')
    OR author_id = auth.uid()
  );

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role    ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles (company);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON public.automation_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_company ON public.automation_requests (company);
CREATE INDEX IF NOT EXISTS idx_requests_submitter ON public.automation_requests (submitter_id);
CREATE INDEX IF NOT EXISTS idx_articles_status  ON public.knowledge_articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_company ON public.knowledge_articles (company);

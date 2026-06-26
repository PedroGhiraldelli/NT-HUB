-- =============================================================
-- NT Automação Hub — Notificações
-- Execute este script no Supabase SQL Editor
-- =============================================================

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  link       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê e atualiza apenas as próprias notificações
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Habilitar Realtime (necessário para push em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================================
-- Trigger 1: Notificar solicitante quando status muda
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_label TEXT;
BEGIN
  -- Só age se o status realmente mudou
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_label := CASE NEW.status
    WHEN 'new'       THEN 'Novo'
    WHEN 'analyzing' THEN 'Em Análise'
    WHEN 'approved'  THEN 'Aprovado'
    WHEN 'backlog'   THEN 'Backlog'
    WHEN 'discarded' THEN 'Descartado'
    ELSE NEW.status
  END;

  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (
    NEW.submitter_id,
    'Chamado ' || NEW.request_number || ' atualizado',
    '"' || NEW.title || '" foi movido para ' || v_label,
    '/requests/' || NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_request_status_change
  AFTER UPDATE ON public.automation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_request_status_change();

-- =============================================================
-- Trigger 2: Notificar analistas/admins quando novo chamado chega
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT
    p.id,
    'Novo chamado: ' || NEW.request_number,
    '"' || NEW.title || '" aguarda análise · ' || NEW.company,
    '/requests/' || NEW.id
  FROM public.profiles p
  WHERE p.role IN ('admin', 'analyst')
    AND p.active = TRUE
    AND p.id != NEW.submitter_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_request
  AFTER INSERT ON public.automation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();

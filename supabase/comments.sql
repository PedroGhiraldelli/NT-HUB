-- =============================================================
-- NT Automação Hub — Comentários por chamado
-- Execute este script no Supabase SQL Editor
-- Pré-requisito: notifications.sql já executado
-- =============================================================

CREATE TABLE IF NOT EXISTS public.request_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES public.automation_requests(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT        NOT NULL,
  author_role TEXT        NOT NULL,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- Admins e analistas veem todos os comentários
-- Directors/Collaborators veem comentários dos chamados da sua empresa
CREATE POLICY "comments_select" ON public.request_comments
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'analyst')
    OR request_id IN (
      SELECT id FROM public.automation_requests
      WHERE company = public.get_my_company()
    )
  );

-- Qualquer usuário autenticado pode criar comentários (apenas com seu próprio author_id)
CREATE POLICY "comments_insert" ON public.request_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- Apenas o autor pode excluir o próprio comentário
CREATE POLICY "comments_delete" ON public.request_comments
  FOR DELETE USING (author_id = auth.uid());

-- Realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_comments;

-- =============================================================
-- Trigger: notificar participantes quando há novo comentário
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req RECORD;
  v_preview TEXT;
BEGIN
  SELECT title, request_number, submitter_id
  INTO v_req
  FROM public.automation_requests
  WHERE id = NEW.request_id;

  v_preview := '"' || LEFT(NEW.content, 80) || CASE WHEN LENGTH(NEW.content) > 80 THEN '..."' ELSE '"' END;

  -- Notifica o solicitante (se não for ele quem comentou)
  IF v_req.submitter_id IS DISTINCT FROM NEW.author_id THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      v_req.submitter_id,
      NEW.author_name || ' comentou em ' || v_req.request_number,
      v_preview,
      '/requests/' || NEW.request_id
    );
  END IF;

  -- Notifica analistas e admins que não são o autor do comentário
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT
    p.id,
    NEW.author_name || ' comentou em ' || v_req.request_number,
    v_preview,
    '/requests/' || NEW.request_id
  FROM public.profiles p
  WHERE p.role IN ('admin', 'analyst')
    AND p.active = TRUE
    AND p.id IS DISTINCT FROM NEW.author_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_comment
  AFTER INSERT ON public.request_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

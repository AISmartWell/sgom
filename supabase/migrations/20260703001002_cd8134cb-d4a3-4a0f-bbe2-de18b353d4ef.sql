
-- 1) KNOWLEDGE BASE
CREATE TABLE public.sgom_knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  stage INT,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_url TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  language TEXT NOT NULL DEFAULT 'en',
  is_published BOOLEAN NOT NULL DEFAULT true,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sgom_kb_refresh_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags,' '),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.content,'')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sgom_kb_search
  BEFORE INSERT OR UPDATE ON public.sgom_knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.sgom_kb_refresh_search_vector();

CREATE INDEX sgom_kb_search_idx ON public.sgom_knowledge_articles USING GIN (search_vector);
CREATE INDEX sgom_kb_category_idx ON public.sgom_knowledge_articles (category);
CREATE INDEX sgom_kb_stage_idx ON public.sgom_knowledge_articles (stage);
CREATE INDEX sgom_kb_tags_idx ON public.sgom_knowledge_articles USING GIN (tags);

GRANT SELECT ON public.sgom_knowledge_articles TO authenticated;
GRANT ALL ON public.sgom_knowledge_articles TO service_role;

ALTER TABLE public.sgom_knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read published articles" ON public.sgom_knowledge_articles
  FOR SELECT TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert articles" ON public.sgom_knowledge_articles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update articles" ON public.sgom_knowledge_articles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete articles" ON public.sgom_knowledge_articles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_sgom_kb_updated
  BEFORE UPDATE ON public.sgom_knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) THREADS
CREATE TABLE public.sgom_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sgom_threads_user_idx ON public.sgom_chat_threads (user_id, last_message_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sgom_chat_threads TO authenticated;
GRANT ALL ON public.sgom_chat_threads TO service_role;
ALTER TABLE public.sgom_chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own threads" ON public.sgom_chat_threads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sgom_threads_updated
  BEFORE UPDATE ON public.sgom_chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) MESSAGES
CREATE TABLE public.sgom_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.sgom_chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  tokens_prompt INT,
  tokens_completion INT,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sgom_msgs_thread_idx ON public.sgom_chat_messages (thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sgom_chat_messages TO authenticated;
GRANT ALL ON public.sgom_chat_messages TO service_role;
ALTER TABLE public.sgom_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own thread messages" ON public.sgom_chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sgom_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users insert own thread messages" ON public.sgom_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.sgom_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users delete own messages" ON public.sgom_chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4) FEEDBACK
CREATE TABLE public.sgom_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.sgom_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  category TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX sgom_feedback_msg_idx ON public.sgom_chat_feedback (message_id);
CREATE INDEX sgom_feedback_rating_idx ON public.sgom_chat_feedback (rating);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sgom_chat_feedback TO authenticated;
GRANT ALL ON public.sgom_chat_feedback TO service_role;
ALTER TABLE public.sgom_chat_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own feedback or admins all" ON public.sgom_chat_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own feedback" ON public.sgom_chat_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own feedback" ON public.sgom_chat_feedback
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own feedback" ON public.sgom_chat_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5) SEARCH RPC
CREATE OR REPLACE FUNCTION public.search_sgom_knowledge(q TEXT, match_count INT DEFAULT 8)
RETURNS TABLE (
  id UUID, slug TEXT, title TEXT, category TEXT, stage INT,
  summary TEXT, content TEXT, tags TEXT[], source_url TEXT, rank REAL
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.slug, a.title, a.category, a.stage, a.summary, a.content, a.tags, a.source_url,
    ts_rank(a.search_vector, websearch_to_tsquery('simple', q)) AS rank
  FROM public.sgom_knowledge_articles a
  WHERE a.is_published = true
    AND a.search_vector @@ websearch_to_tsquery('simple', q)
  ORDER BY rank DESC
  LIMIT match_count;
$$;
GRANT EXECUTE ON FUNCTION public.search_sgom_knowledge(TEXT, INT) TO authenticated;

-- 6) THREAD BUMP TRIGGER
CREATE OR REPLACE FUNCTION public.bump_sgom_thread_last_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.sgom_chat_threads
     SET last_message_at = NEW.created_at, updated_at = now()
   WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_sgom_bump_thread
  AFTER INSERT ON public.sgom_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_sgom_thread_last_message();

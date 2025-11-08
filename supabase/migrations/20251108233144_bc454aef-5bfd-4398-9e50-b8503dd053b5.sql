-- Criar tabela para análises emocionais
CREATE TABLE IF NOT EXISTS public.emotional_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar análises por universo
CREATE INDEX IF NOT EXISTS idx_emotional_analyses_universe_id ON public.emotional_analyses(universe_id);

-- RLS
ALTER TABLE public.emotional_analyses ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar análises emocionais
CREATE POLICY "Admins can manage emotional analyses"
  ON public.emotional_analyses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Qualquer um pode ver análises de universos ativos
CREATE POLICY "Anyone can view emotional analyses from active universes"
  ON public.emotional_analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE universes.id = emotional_analyses.universe_id
      AND (universes.status = 'active' OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_emotional_analyses_updated_at
  BEFORE UPDATE ON public.emotional_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
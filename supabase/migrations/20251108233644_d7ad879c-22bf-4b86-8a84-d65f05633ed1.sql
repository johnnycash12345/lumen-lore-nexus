-- Criar tabela para estruturas narrativas
CREATE TABLE IF NOT EXISTS public.narrative_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  structure_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar estruturas por universo
CREATE INDEX IF NOT EXISTS idx_narrative_structures_universe_id ON public.narrative_structures(universe_id);

-- RLS
ALTER TABLE public.narrative_structures ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar estruturas narrativas
CREATE POLICY "Admins can manage narrative structures"
  ON public.narrative_structures
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Qualquer um pode ver estruturas de universos ativos
CREATE POLICY "Anyone can view narrative structures from active universes"
  ON public.narrative_structures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE universes.id = narrative_structures.universe_id
      AND (universes.status = 'active' OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_narrative_structures_updated_at
  BEFORE UPDATE ON public.narrative_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
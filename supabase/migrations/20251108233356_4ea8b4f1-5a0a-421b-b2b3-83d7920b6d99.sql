-- Criar tabela para redes de relacionamentos
CREATE TABLE IF NOT EXISTS public.relationship_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  network_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar redes por universo
CREATE INDEX IF NOT EXISTS idx_relationship_networks_universe_id ON public.relationship_networks(universe_id);

-- RLS
ALTER TABLE public.relationship_networks ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar redes de relacionamentos
CREATE POLICY "Admins can manage relationship networks"
  ON public.relationship_networks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Qualquer um pode ver redes de universos ativos
CREATE POLICY "Anyone can view relationship networks from active universes"
  ON public.relationship_networks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE universes.id = relationship_networks.universe_id
      AND (universes.status = 'active' OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_relationship_networks_updated_at
  BEFORE UPDATE ON public.relationship_networks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
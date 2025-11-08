-- Create relationships table
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  from_entity_id UUID NOT NULL,
  from_entity_type TEXT NOT NULL CHECK (from_entity_type IN ('character', 'location', 'event', 'object')),
  to_entity_id UUID NOT NULL,
  to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('character', 'location', 'event', 'object')),
  relationship_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- Enable RLS
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Admins can manage all relationships
CREATE POLICY "Admins can manage relationships"
ON public.relationships
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view relationships from active universes
CREATE POLICY "Anyone can view relationships from active universes"
ON public.relationships
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.universes
    WHERE universes.id = relationships.universe_id
      AND (universes.status = 'active' OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_relationships_universe_id ON public.relationships(universe_id);
CREATE INDEX idx_relationships_from_entity ON public.relationships(from_entity_id, from_entity_type);
CREATE INDEX idx_relationships_to_entity ON public.relationships(to_entity_id, to_entity_type);
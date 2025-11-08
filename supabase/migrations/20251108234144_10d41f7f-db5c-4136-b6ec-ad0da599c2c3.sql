-- Create complete_extractions table for comprehensive universe analysis
CREATE TABLE IF NOT EXISTS public.complete_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  extraction_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complete_extractions ENABLE ROW LEVEL SECURITY;

-- Admins can manage complete extractions
CREATE POLICY "Admins can manage complete extractions"
  ON public.complete_extractions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view complete extractions from active universes
CREATE POLICY "Anyone can view complete extractions from active universes"
  ON public.complete_extractions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE universes.id = complete_extractions.universe_id
      AND (universes.status = 'active' OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_complete_extractions_universe_id ON public.complete_extractions(universe_id);

-- Trigger for updated_at
CREATE TRIGGER update_complete_extractions_updated_at
  BEFORE UPDATE ON public.complete_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
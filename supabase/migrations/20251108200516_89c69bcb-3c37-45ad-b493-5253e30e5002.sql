-- Create pages metadata table
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('UNIVERSE', 'CHARACTER', 'LOCATION', 'EVENT', 'OBJECT')),
  entity_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(universe_id, entity_type, entity_id),
  UNIQUE(slug)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create index for faster slug lookups
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_pages_universe_id ON public.pages(universe_id);
CREATE INDEX idx_pages_entity_type ON public.pages(entity_type);

-- RLS Policy: Anyone can read published pages
CREATE POLICY "Anyone can read published pages"
  ON public.pages
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Only admins can modify pages
CREATE POLICY "Only admins can modify pages"
  ON public.pages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
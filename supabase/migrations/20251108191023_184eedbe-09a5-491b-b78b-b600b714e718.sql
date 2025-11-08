-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create universes table
CREATE TABLE public.universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('Livro', 'Filme', 'Série', 'Jogo', 'Outro')),
  author TEXT,
  publication_year INTEGER,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'active', 'error')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.universes ENABLE ROW LEVEL SECURITY;

-- Create characters table
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  aliases TEXT[],
  description TEXT,
  role TEXT,
  abilities TEXT[],
  personality TEXT,
  occupation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  country TEXT,
  significance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  significance TEXT,
  characters_involved UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create objects table
CREATE TABLE public.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  owner_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  powers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- Create processing_jobs table
CREATE TABLE public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  universe_id UUID REFERENCES public.universes(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_universes_updated_at BEFORE UPDATE ON public.universes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON public.objects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for universes
CREATE POLICY "Anyone can view active universes"
  ON public.universes FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert universes"
  ON public.universes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update universes"
  ON public.universes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete universes"
  ON public.universes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for characters
CREATE POLICY "Anyone can view characters from active universes"
  ON public.characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE id = universe_id AND (status = 'active' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage characters"
  ON public.characters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for locations
CREATE POLICY "Anyone can view locations from active universes"
  ON public.locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE id = universe_id AND (status = 'active' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Anyone can view events from active universes"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE id = universe_id AND (status = 'active' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for objects
CREATE POLICY "Anyone can view objects from active universes"
  ON public.objects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.universes
      WHERE id = universe_id AND (status = 'active' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage objects"
  ON public.objects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for processing_jobs
CREATE POLICY "Admins can view all processing jobs"
  ON public.processing_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage processing jobs"
  ON public.processing_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_universes_status ON public.universes(status);
CREATE INDEX idx_universes_created_by ON public.universes(created_by);
CREATE INDEX idx_characters_universe_id ON public.characters(universe_id);
CREATE INDEX idx_locations_universe_id ON public.locations(universe_id);
CREATE INDEX idx_events_universe_id ON public.events(universe_id);
CREATE INDEX idx_objects_universe_id ON public.objects(universe_id);
CREATE INDEX idx_processing_jobs_universe_id ON public.processing_jobs(universe_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
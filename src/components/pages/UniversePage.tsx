import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Universe {
  id: string;
  name: string;
  description: string;
  source_type: string;
  author?: string;
  publication_year?: number;
}

interface UniversePageProps {
  universeId: string;
}

export function UniversePage({ universeId }: UniversePageProps) {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    characters: 0,
    locations: 0,
    events: 0,
    objects: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: universeData, error: universeError } = await supabase
          .from('universes')
          .select('*')
          .eq('id', universeId)
          .single();

        if (universeError) throw universeError;
        setUniverse(universeData);

        const [charsRes, locsRes, eventsRes, objsRes] = await Promise.all([
          supabase
            .from('characters')
            .select('id', { count: 'exact' })
            .eq('universe_id', universeId),
          supabase
            .from('locations')
            .select('id', { count: 'exact' })
            .eq('universe_id', universeId),
          supabase
            .from('events')
            .select('id', { count: 'exact' })
            .eq('universe_id', universeId),
          supabase
            .from('objects')
            .select('id', { count: 'exact' })
            .eq('universe_id', universeId),
        ]);

        setStats({
          characters: charsRes.count || 0,
          locations: locsRes.count || 0,
          events: eventsRes.count || 0,
          objects: objsRes.count || 0,
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar universo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [universeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !universe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <h2 className="font-serif text-xl font-bold">Erro</h2>
              <p className="text-sm text-muted-foreground">{error || 'Universo não encontrado'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4">
            {universe.name}
          </h1>
          <p className="text-base md:text-lg text-foreground/70 mb-4">{universe.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {universe.source_type && <span>Tipo: {universe.source_type}</span>}
            {universe.author && <span>Autor: {universe.author}</span>}
            {universe.publication_year && <span>Ano: {universe.publication_year}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 md:mb-12">
          <Card className="p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stats.characters}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Personagens</div>
          </Card>
          <Card className="p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stats.locations}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Locais</div>
          </Card>
          <Card className="p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stats.events}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Eventos</div>
          </Card>
          <Card className="p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stats.objects}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Objetos</div>
          </Card>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="characters">Personagens</TabsTrigger>
            <TabsTrigger value="locations">Locais</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="objects">Objetos</TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-6">
            <CharactersList universeId={universeId} />
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <LocationsList universeId={universeId} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <EventsList universeId={universeId} />
          </TabsContent>

          <TabsContent value="objects" className="mt-6">
            <ObjectsList universeId={universeId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CharactersList({ universeId }: { universeId: string }) {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('universe_id', universeId);
      setCharacters(data || []);
      setLoading(false);
    };
    fetchCharacters();
  }, [universeId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {characters.map((char) => (
        <Card key={char.id} className="p-6">
          <h3 className="font-serif text-lg font-bold mb-2">{char.name}</h3>
          {char.role && <p className="text-sm text-muted-foreground mb-2">{char.role}</p>}
          {char.description && <p className="text-sm line-clamp-3">{char.description}</p>}
        </Card>
      ))}
    </div>
  );
}

function LocationsList({ universeId }: { universeId: string }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('universe_id', universeId);
      setLocations(data || []);
      setLoading(false);
    };
    fetchLocations();
  }, [universeId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {locations.map((loc) => (
        <Card key={loc.id} className="p-6">
          <h3 className="font-serif text-lg font-bold mb-2">{loc.name}</h3>
          {loc.type && <p className="text-sm text-muted-foreground mb-2">{loc.type}</p>}
          {loc.description && <p className="text-sm line-clamp-3">{loc.description}</p>}
        </Card>
      ))}
    </div>
  );
}

function EventsList({ universeId }: { universeId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('universe_id', universeId);
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [universeId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((evt) => (
        <Card key={evt.id} className="p-6">
          <h3 className="font-serif text-lg font-bold mb-2">{evt.name}</h3>
          {evt.event_date && <p className="text-sm text-muted-foreground mb-2">{evt.event_date}</p>}
          {evt.description && <p className="text-sm line-clamp-3">{evt.description}</p>}
        </Card>
      ))}
    </div>
  );
}

function ObjectsList({ universeId }: { universeId: string }) {
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjects = async () => {
      const { data } = await supabase
        .from('objects')
        .select('*')
        .eq('universe_id', universeId);
      setObjects(data || []);
      setLoading(false);
    };
    fetchObjects();
  }, [universeId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {objects.map((obj) => (
        <Card key={obj.id} className="p-6">
          <h3 className="font-serif text-lg font-bold mb-2">{obj.name}</h3>
          {obj.type && <p className="text-sm text-muted-foreground mb-2">{obj.type}</p>}
          {obj.description && <p className="text-sm line-clamp-3">{obj.description}</p>}
        </Card>
      ))}
    </div>
  );
}

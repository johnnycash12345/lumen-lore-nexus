import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Package, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Character {
  id: string;
  name: string;
  description: string | null;
  role: string | null;
  occupation: string | null;
  abilities: string[] | null;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  country: string | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  significance: string | null;
}

interface Object {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  powers: string | null;
}

export const ExtractedEntitiesView = ({ universeId }: { universeId: string }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
  }, [universeId]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      
      const [charsRes, locsRes, eventsRes, objsRes] = await Promise.all([
        supabase.from("characters").select("*").eq("universe_id", universeId),
        supabase.from("locations").select("*").eq("universe_id", universeId),
        supabase.from("events").select("*").eq("universe_id", universeId),
        supabase.from("objects").select("*").eq("universe_id", universeId),
      ]);

      if (charsRes.error) throw charsRes.error;
      if (locsRes.error) throw locsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (objsRes.error) throw objsRes.error;

      setCharacters(charsRes.data || []);
      setLocations(locsRes.data || []);
      setEvents(eventsRes.data || []);
      setObjects(objsRes.data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
      toast({
        title: "Erro ao carregar entidades",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBySearch = <T extends { name: string }>(items: T[]) => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleEdit = (id: string, type: string) => {
    toast({
      title: "Editar " + type,
      description: "Funcionalidade em desenvolvimento",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando entidades...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters">
            <User className="h-4 w-4 mr-2" />
            Personagens ({characters.length})
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="h-4 w-4 mr-2" />
            Locais ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Eventos ({events.length})
          </TabsTrigger>
          <TabsTrigger value="objects">
            <Package className="h-4 w-4 mr-2" />
            Objetos ({objects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          {filterBySearch(characters).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum personagem encontrado
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterBySearch(characters).map((char) => (
                <Card key={char.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <User className="h-8 w-8 text-primary" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(char.id, "Personagem")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle>{char.name}</CardTitle>
                    {char.role && (
                      <CardDescription>{char.role}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {char.occupation && (
                      <p className="text-sm">
                        <strong>Ocupação:</strong> {char.occupation}
                      </p>
                    )}
                    {char.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {char.description}
                      </p>
                    )}
                    {char.abilities && char.abilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {char.abilities.slice(0, 3).map((ability, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            {ability}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          {filterBySearch(locations).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum local encontrado
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterBySearch(locations).map((loc) => (
                <Card key={loc.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <MapPin className="h-8 w-8 text-primary" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(loc.id, "Local")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle>{loc.name}</CardTitle>
                    {loc.type && <CardDescription>{loc.type}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loc.country && (
                      <p className="text-sm">
                        <strong>País:</strong> {loc.country}
                      </p>
                    )}
                    {loc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {loc.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {filterBySearch(events).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum evento encontrado
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterBySearch(events).map((evt) => (
                <Card key={evt.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Calendar className="h-8 w-8 text-primary" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(evt.id, "Evento")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle>{evt.name}</CardTitle>
                    {evt.event_date && (
                      <CardDescription>{evt.event_date}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {evt.significance && (
                      <p className="text-sm">
                        <strong>Significado:</strong> {evt.significance}
                      </p>
                    )}
                    {evt.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {evt.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          {filterBySearch(objects).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum objeto encontrado
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterBySearch(objects).map((obj) => (
                <Card key={obj.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Package className="h-8 w-8 text-primary" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(obj.id, "Objeto")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle>{obj.name}</CardTitle>
                    {obj.type && <CardDescription>{obj.type}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {obj.powers && (
                      <p className="text-sm">
                        <strong>Poderes:</strong> {obj.powers}
                      </p>
                    )}
                    {obj.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {obj.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

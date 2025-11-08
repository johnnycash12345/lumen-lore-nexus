import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavigationBar } from "@/components/NavigationBar";
import { DecorativeDots } from "@/components/DecorativeDots";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Book, Users, MapPin, Calendar } from "lucide-react";

interface Universe {
  id: string;
  name: string;
  description: string;
  source_type: string;
  author: string | null;
  publication_year: number | null;
  characters_count?: number;
  locations_count?: number;
  events_count?: number;
}

export default function Universes() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUniverses();
  }, []);

  const fetchUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from("universes")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch counts for each universe
      const universesWithCounts = await Promise.all(
        (data || []).map(async (universe) => {
          const [chars, locs, evts] = await Promise.all([
            supabase.from("characters").select("*", { count: "exact", head: true }).eq("universe_id", universe.id),
            supabase.from("locations").select("*", { count: "exact", head: true }).eq("universe_id", universe.id),
            supabase.from("events").select("*", { count: "exact", head: true }).eq("universe_id", universe.id),
          ]);

          return {
            ...universe,
            characters_count: chars.count || 0,
            locations_count: locs.count || 0,
            events_count: evts.count || 0,
          };
        })
      );

      setUniverses(universesWithCounts);
    } catch (error) {
      console.error("Error fetching universes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniverses = universes.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (type: string) => {
    const icons: Record<string, string> = {
      Livro: "📚",
      Filme: "🎬",
      Série: "📺",
      Jogo: "🎮",
      Outro: "📋",
    };
    return icons[type] || "📋";
  };

  return (
    <div className="min-h-screen bg-background relative">
      <DecorativeDots />
      <NavigationBar />

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4">
            Explore Universos
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra mundos analisados por IA
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar universos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-lg"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumen-navy"></div>
          </div>
        )}

        {/* Universes Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUniverses.map((universe) => (
              <Card
                key={universe.id}
                className="group p-5 hover:shadow-elegant transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => navigate(`/universe/${universe.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-lumen-navy transition-colors flex-1 pr-2">
                    {universe.name}
                  </h3>
                  <span className="text-2xl">{getSourceIcon(universe.source_type)}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {universe.description}
                </p>

                {universe.author && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {universe.author}
                    {universe.publication_year && ` • ${universe.publication_year}`}
                  </p>
                )}

                <Badge variant="secondary" className="mb-4 text-xs">
                  {universe.source_type}
                </Badge>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                  <div className="text-center">
                    <Users className="w-4 h-4 text-lumen-navy mx-auto mb-1" />
                    <div className="text-sm font-medium text-foreground">{universe.characters_count}</div>
                    <div className="text-xs text-muted-foreground">Personagens</div>
                  </div>
                  <div className="text-center">
                    <MapPin className="w-4 h-4 text-lumen-navy mx-auto mb-1" />
                    <div className="text-sm font-medium text-foreground">{universe.locations_count}</div>
                    <div className="text-xs text-muted-foreground">Locais</div>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-4 h-4 text-lumen-navy mx-auto mb-1" />
                    <div className="text-sm font-medium text-foreground">{universe.events_count}</div>
                    <div className="text-xs text-muted-foreground">Eventos</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUniverses.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-serif text-foreground mb-2">
              Nenhum universo encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Em breve teremos novos universos"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}
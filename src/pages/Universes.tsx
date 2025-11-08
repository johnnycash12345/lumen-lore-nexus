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

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-3 md:mb-4">
            Explore Universos
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Descubra mundos narrativos analisados profundamente por inteligência artificial
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar universos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 md:h-14 text-base md:text-lg rounded-xl"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredUniverses.map((universe) => (
              <Card
                key={universe.id}
                className="group p-5 md:p-6 hover:shadow-elegant transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-95"
                onClick={() => navigate(`/universe/${universe.id}`)}
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground group-hover:text-lumen-navy transition-colors flex-1 pr-2">
                    {universe.name}
                  </h3>
                  <span className="text-2xl flex-shrink-0">{getSourceIcon(universe.source_type)}</span>
                </div>

                <p className="text-muted-foreground text-sm md:text-base mb-3 md:mb-4 line-clamp-3">
                  {universe.description}
                </p>

                {universe.author && (
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                    por {universe.author}
                    {universe.publication_year && ` • ${universe.publication_year}`}
                  </p>
                )}

                <Badge variant="secondary" className="mb-3 md:mb-4 text-xs">
                  {universe.source_type}
                </Badge>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-lumen-navy" />
                    </div>
                    <div className="text-sm md:text-base font-medium text-foreground">{universe.characters_count}</div>
                    <div className="text-xs text-muted-foreground">Personagens</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MapPin className="w-4 h-4 text-lumen-navy" />
                    </div>
                    <div className="text-sm md:text-base font-medium text-foreground">{universe.locations_count}</div>
                    <div className="text-xs text-muted-foreground">Locais</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="w-4 h-4 text-lumen-navy" />
                    </div>
                    <div className="text-sm md:text-base font-medium text-foreground">{universe.events_count}</div>
                    <div className="text-xs text-muted-foreground">Eventos</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUniverses.length === 0 && (
          <div className="text-center py-16">
            <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-serif text-foreground mb-2">
              Nenhum universo encontrado
            </h3>
            <p className="text-muted-foreground px-4">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Em breve teremos novos universos para explorar"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-8 px-4 mt-12 md:mt-20">
        <div className="container mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Enciclopédia Interativa Multiagente de Universos Narrativos
          </p>
        </div>
      </footer>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Universe {
  id: string;
  name: string;
  description: string;
  source_type: string;
  status: string;
  created_at: string;
  characters_count?: number;
  locations_count?: number;
  events_count?: number;
}

export default function Universes() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUniverses();
  }, []);

  const fetchUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from("universes")
        .select("*")
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os universos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o universo "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("universes").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Universo deletado com sucesso.",
      });

      fetchUniverses();
    } catch (error) {
      console.error("Error deleting universe:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o universo.",
        variant: "destructive",
      });
    }
  };

  const filteredUniverses = universes.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      processing: "secondary",
      error: "destructive",
    };

    const labels: Record<string, string> = {
      active: "Ativo",
      processing: "Processando",
      error: "Erro",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-navy mb-2">Universos</h1>
          <p className="text-gray-600">Gerencie todos os universos narrativos</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar universos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Universes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniverses.map((universe) => (
          <Card key={universe.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-serif text-navy">{universe.name}</h3>
              {getStatusBadge(universe.status)}
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {universe.description}
            </p>

            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <span>📚 {universe.source_type}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-navy">{universe.characters_count}</div>
                <div className="text-xs text-gray-600">Personagens</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-navy">{universe.locations_count}</div>
                <div className="text-xs text-gray-600">Locais</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-bold text-navy">{universe.events_count}</div>
                <div className="text-xs text-gray-600">Eventos</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/universe/${universe.id}`)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(universe.id, universe.name)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredUniverses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhum universo encontrado.</p>
        </div>
      )}
    </div>
  );
}
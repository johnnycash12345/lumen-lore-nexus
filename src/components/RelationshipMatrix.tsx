import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters">;
type Relationship = Tables<"relationships">;

interface RelationshipMatrixProps {
  universeId: string;
}

export const RelationshipMatrix = ({ universeId }: RelationshipMatrixProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [universeId]);

  const fetchData = async () => {
    try {
      const [charsResult, relsResult] = await Promise.all([
        supabase
          .from('characters')
          .select('*')
          .eq('universe_id', universeId)
          .order('name'),
        supabase
          .from('relationships')
          .select('*')
          .eq('universe_id', universeId)
      ]);

      if (charsResult.error) throw charsResult.error;
      if (relsResult.error) throw relsResult.error;

      setCharacters(charsResult.data || []);
      setRelationships(relsResult.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar matriz de relacionamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const getRelationship = (fromId: string, toId: string): Relationship | null => {
    return relationships.find(
      r => r.from_entity_id === fromId && r.to_entity_id === toId && 
           r.from_entity_type === 'character' && r.to_entity_type === 'character'
    ) || null;
  };

  const getRelationshipColor = (type?: string) => {
    if (!type) return "bg-gray-100 dark:bg-gray-800";
    const lower = type.toLowerCase();
    if (lower.includes("amizade") || lower.includes("aliança")) return "bg-green-100 dark:bg-green-900";
    if (lower.includes("inimizade") || lower.includes("rival")) return "bg-red-100 dark:bg-red-900";
    if (lower.includes("família") || lower.includes("parente")) return "bg-blue-100 dark:bg-blue-900";
    if (lower.includes("amor") || lower.includes("romance")) return "bg-pink-100 dark:bg-pink-900";
    return "bg-yellow-100 dark:bg-yellow-900";
  };

  const stats = {
    total: relationships.filter(r => r.from_entity_type === 'character' && r.to_entity_type === 'character').length,
    friendship: relationships.filter(r => r.relationship_type?.toLowerCase().includes("amizade")).length,
    rivalry: relationships.filter(r => r.relationship_type?.toLowerCase().includes("inimizade")).length,
    family: relationships.filter(r => r.relationship_type?.toLowerCase().includes("família")).length,
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando matriz...</div>;
  }

  if (characters.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhum personagem encontrado para criar matriz
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Matriz de Relacionamentos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Visualize todas as conexões entre personagens
        </p>
        
        <div className="flex gap-4 mb-6">
          <Badge variant="outline" className="gap-2">
            Total: <span className="font-semibold">{stats.total}</span>
          </Badge>
          <Badge variant="outline" className="gap-2 bg-green-50 dark:bg-green-950">
            Amizades: <span className="font-semibold">{stats.friendship}</span>
          </Badge>
          <Badge variant="outline" className="gap-2 bg-red-50 dark:bg-red-950">
            Rivalidades: <span className="font-semibold">{stats.rivalry}</span>
          </Badge>
          <Badge variant="outline" className="gap-2 bg-blue-50 dark:bg-blue-950">
            Família: <span className="font-semibold">{stats.family}</span>
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-semibold text-left sticky left-0 z-10">
                De / Para
              </th>
              {characters.map(char => (
                <th key={char.id} className="border p-2 bg-muted min-w-[120px]">
                  <div className="text-xs font-medium truncate" title={char.name}>
                    {char.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {characters.map(fromChar => (
              <tr key={fromChar.id}>
                <td className="border p-2 bg-muted font-medium sticky left-0 z-10">
                  <div className="text-sm truncate" title={fromChar.name}>
                    {fromChar.name}
                  </div>
                </td>
                {characters.map(toChar => {
                  if (fromChar.id === toChar.id) {
                    return (
                      <td key={toChar.id} className="border p-2 bg-muted/50 text-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </td>
                    );
                  }

                  const rel = getRelationship(fromChar.id, toChar.id);
                  
                  return (
                    <td 
                      key={toChar.id} 
                      className={`border p-2 text-center ${rel ? getRelationshipColor(rel.relationship_type || undefined) : ''}`}
                      title={rel ? `${rel.relationship_type}${rel.description ? `: ${rel.description}` : ''}` : 'Sem relacionamento'}
                    >
                      {rel ? (
                        <div className="text-xs font-medium">
                          {rel.relationship_type || "?"}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border" />
          <span>Amizade/Aliança</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900 border" />
          <span>Inimizade/Rivalidade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border" />
          <span>Família</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-100 dark:bg-pink-900 border" />
          <span>Romance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border" />
          <span>Outros</span>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { z } from "zod";

type Relationship = Tables<"relationships">;
type Character = Tables<"characters">;
type Location = Tables<"locations">;
type Event = Tables<"events">;
type Object = Tables<"objects">;

interface Entity {
  id: string;
  name: string;
  type: "character" | "location" | "event" | "object";
}

interface GraphNode {
  id: string;
  label: string;
  fill?: string;
  data?: {
    type: string;
    originalName: string;
  };
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  fill?: string;
  data?: {
    relationshipId: string;
    type: string;
  };
}

const relationshipSchema = z.object({
  from_entity_id: z.string().uuid("ID inválido"),
  from_entity_type: z.enum(["character", "location", "event", "object"]),
  to_entity_id: z.string().uuid("ID inválido"),
  to_entity_type: z.enum(["character", "location", "event", "object"]),
  relationship_type: z.string().min(1, "Tipo é obrigatório").max(50, "Tipo muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional().nullable(),
});

const RELATIONSHIP_TYPES = [
  { value: "friend", label: "Amigo", color: "#22c55e" },
  { value: "enemy", label: "Inimigo", color: "#ef4444" },
  { value: "family", label: "Família", color: "#8b5cf6" },
  { value: "colleague", label: "Colega", color: "#3b82f6" },
  { value: "romantic", label: "Romântico", color: "#ec4899" },
  { value: "mentor", label: "Mentor", color: "#f59e0b" },
  { value: "rival", label: "Rival", color: "#f97316" },
  { value: "neutral", label: "Neutro", color: "#6b7280" },
];

const ENTITY_COLORS = {
  character: "#3b82f6",
  location: "#10b981",
  event: "#f59e0b",
  object: "#8b5cf6",
};

export const RelationshipEditor = ({ universeId }: { universeId: string }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphLink[] }>({
    nodes: [],
    edges: [],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [formData, setFormData] = useState({
    from_entity_id: "",
    from_entity_type: "character" as const,
    to_entity_id: "",
    to_entity_type: "character" as const,
    relationship_type: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [universeId]);

  useEffect(() => {
    buildGraphData();
  }, [entities, relationships]);

  const fetchData = async () => {
    try {
      const [charsRes, locsRes, eventsRes, objsRes, relsRes] = await Promise.all([
        supabase.from("characters").select("id, name").eq("universe_id", universeId),
        supabase.from("locations").select("id, name").eq("universe_id", universeId),
        supabase.from("events").select("id, name").eq("universe_id", universeId),
        supabase.from("objects").select("id, name").eq("universe_id", universeId),
        supabase.from("relationships").select("*").eq("universe_id", universeId),
      ]);

      const allEntities: Entity[] = [
        ...(charsRes.data || []).map((c) => ({ ...c, type: "character" as const })),
        ...(locsRes.data || []).map((l) => ({ ...l, type: "location" as const })),
        ...(eventsRes.data || []).map((e) => ({ ...e, type: "event" as const })),
        ...(objsRes.data || []).map((o) => ({ ...o, type: "object" as const })),
      ];

      setEntities(allEntities);
      setRelationships(relsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    }
  };

  const buildGraphData = () => {
    const nodes: GraphNode[] = entities.map((entity) => ({
      id: entity.id,
      label: entity.name,
      fill: ENTITY_COLORS[entity.type],
      data: {
        type: entity.type,
        originalName: entity.name,
      },
    }));

    const edges: GraphLink[] = relationships.map((rel) => {
      const relType = RELATIONSHIP_TYPES.find((t) => t.value === rel.relationship_type);
      return {
        id: rel.id,
        source: rel.from_entity_id,
        target: rel.to_entity_id,
        label: relType?.label,
        fill: relType?.color || "#6b7280",
        data: {
          relationshipId: rel.id,
          type: rel.relationship_type,
        },
      };
    });

    setGraphData({ nodes, edges });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = relationshipSchema.parse({
        ...formData,
        description: formData.description || null,
      });

      if (editingRelationship) {
        const { error } = await supabase
          .from("relationships")
          .update(validated)
          .eq("id", editingRelationship.id);

        if (error) throw error;

        toast({
          title: "Atualizado!",
          description: "Relacionamento atualizado com sucesso.",
        });
      } else {
        const insertData = {
          ...validated,
          universe_id: universeId,
        };
        
        const { error } = await supabase
          .from("relationships")
          .insert(insertData as any);

        if (error) throw error;

        toast({
          title: "Criado!",
          description: "Relacionamento criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingRelationship(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: error.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("relationships").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Excluído",
        description: "Relacionamento excluído com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setFormData({
      from_entity_id: relationship.from_entity_id,
      from_entity_type: relationship.from_entity_type as any,
      to_entity_id: relationship.to_entity_id,
      to_entity_type: relationship.to_entity_type as any,
      relationship_type: relationship.relationship_type,
      description: relationship.description || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      from_entity_id: "",
      from_entity_type: "character",
      to_entity_id: "",
      to_entity_type: "character",
      relationship_type: "",
      description: "",
    });
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    toast({
      title: node.label,
      description: `Tipo: ${node.data?.type}`,
    });
  }, [toast]);

  const handleEdgeClick = useCallback((edge: GraphLink) => {
    const rel = relationships.find((r) => r.id === edge.data?.relationshipId);
    if (rel) {
      handleEdit(rel);
    }
  }, [relationships]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Editor de Relacionamentos</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingRelationship(null);
                    resetForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Relacionamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRelationship ? "Editar" : "Novo"} Relacionamento
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>De (Entidade)</Label>
                      <Select
                        value={formData.from_entity_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, from_entity_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name} ({entity.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Para (Entidade)</Label>
                      <Select
                        value={formData.to_entity_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, to_entity_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name} ({entity.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tipo de Relacionamento</Label>
                    <Select
                      value={formData.relationship_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, relationship_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descreva o relacionamento..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingRelationship(null);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingRelationship ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {graphData.nodes.length > 0 ? (
              <div className="border rounded-lg p-6 bg-muted/20 min-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {graphData.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-4 border rounded-lg bg-background hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleNodeClick(node)}
                      style={{ borderLeftColor: node.fill, borderLeftWidth: '4px' }}
                    >
                      <h4 className="font-semibold">{node.label}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{node.data?.type}</p>
                      <div className="mt-2 space-y-1">
                        {graphData.edges
                          .filter(e => e.source === node.id || e.target === node.id)
                          .slice(0, 3)
                          .map((edge) => {
                            const otherNodeId = edge.source === node.id ? edge.target : edge.source;
                            const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                            return (
                              <div key={edge.id} className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: edge.fill }} />
                                <span>{edge.label} → {otherNode?.label}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground border rounded-lg">
                Nenhuma entidade encontrada. Adicione personagens, locais ou eventos primeiro.
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-sm">Legenda de Tipos:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {RELATIONSHIP_TYPES.map((type) => (
                <div key={type.value} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relationships List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Relacionamentos ({relationships.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {relationships.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum relacionamento criado ainda.
              </p>
            ) : (
              relationships.map((rel) => {
                const fromEntity = entities.find((e) => e.id === rel.from_entity_id);
                const toEntity = entities.find((e) => e.id === rel.to_entity_id);
                const relType = RELATIONSHIP_TYPES.find(
                  (t) => t.value === rel.relationship_type
                );

                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: relType?.color }}
                      />
                      <div>
                        <div className="font-medium">
                          {fromEntity?.name} → {toEntity?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {relType?.label}
                          {rel.description && ` • ${rel.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(rel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rel.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

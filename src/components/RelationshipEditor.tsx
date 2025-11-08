import { useState, useEffect, useCallback, useRef } from "react";
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
// @ts-ignore - react-force-graph doesn't have types
import { ForceGraph2D } from "react-force-graph";
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
  name: string;
  type: string;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  color: string;
  relationshipId: string;
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
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
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
  const forceRef = useRef<any>();

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
      name: entity.name,
      type: entity.type,
      color: ENTITY_COLORS[entity.type],
    }));

    const links: GraphLink[] = relationships.map((rel) => {
      const relType = RELATIONSHIP_TYPES.find((t) => t.value === rel.relationship_type);
      return {
        source: rel.from_entity_id,
        target: rel.to_entity_id,
        type: rel.relationship_type,
        color: relType?.color || "#6b7280",
        relationshipId: rel.id,
      };
    });

    setGraphData({ nodes, links });
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

  const handleNodeClick = useCallback((node: any) => {
    const entity = entities.find((e) => e.id === node.id);
    if (entity) {
      toast({
        title: entity.name,
        description: `Tipo: ${entity.type}`,
      });
    }
  }, [entities, toast]);

  const handleLinkClick = useCallback((link: any) => {
    const relationship = relationships.find((r) => r.id === link.relationshipId);
    if (relationship) {
      handleEdit(relationship);
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
          <div className="h-[600px] border rounded-lg bg-muted/20">
            {graphData.nodes.length > 0 ? (
              <ForceGraph2D
                ref={forceRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor="color"
                nodeRelSize={8}
                linkColor="color"
                linkWidth={2}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                onNodeClick={handleNodeClick}
                onLinkClick={handleLinkClick}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = node.color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
                  ctx.fill();
                  ctx.fillStyle = "white";
                  ctx.fillText(label, node.x, node.y + 15);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
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

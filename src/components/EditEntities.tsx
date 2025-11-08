import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Calendar, Package, Plus, Save, Trash2, Check } from "lucide-react";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

// Validation schemas
const characterSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().max(1000, "Descrição muito longa").optional().nullable(),
  role: z.string().trim().max(100, "Role muito longo").optional().nullable(),
  occupation: z.string().trim().max(100, "Ocupação muito longa").optional().nullable(),
  personality: z.string().trim().max(500, "Personalidade muito longa").optional().nullable(),
});

const locationSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().max(1000, "Descrição muito longa").optional().nullable(),
  type: z.string().trim().max(50, "Tipo muito longo").optional().nullable(),
  country: z.string().trim().max(100, "País muito longo").optional().nullable(),
});

const eventSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().max(1000, "Descrição muito longa").optional().nullable(),
  event_date: z.string().trim().max(100, "Data muito longa").optional().nullable(),
  significance: z.string().trim().max(500, "Significância muito longa").optional().nullable(),
});

const objectSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().max(1000, "Descrição muito longa").optional().nullable(),
  type: z.string().trim().max(50, "Tipo muito longo").optional().nullable(),
  powers: z.string().trim().max(500, "Poderes muito longo").optional().nullable(),
});

type Character = Tables<"characters">;
type Location = Tables<"locations">;
type Event = Tables<"events">;
type Object = Tables<"objects">;

interface EditEntitiesProps {
  universeId: string;
}

export const EditEntities = ({ universeId }: EditEntitiesProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
  }, [universeId]);

  const fetchEntities = async () => {
    try {
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
        title: "Erro ao carregar",
        description: "Não foi possível carregar as entidades.",
        variant: "destructive",
      });
    }
  };

  const saveEntity = async (
    table: "characters" | "locations" | "events" | "objects",
    id: string,
    data: any,
    schema: z.ZodSchema
  ) => {
    try {
      // Validate
      const validated = schema.parse(data);
      
      setSavingStates((prev) => ({ ...prev, [id]: true }));

      const { error } = await supabase
        .from(table)
        .update(validated)
        .eq("id", id);

      if (error) throw error;

      setSavingStates((prev) => ({ ...prev, [id]: false }));
      
      toast({
        title: "Salvo!",
        description: "As alterações foram salvas automaticamente.",
        duration: 2000,
      });
    } catch (error: any) {
      setSavingStates((prev) => ({ ...prev, [id]: false }));
      
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

  const deleteEntity = async (
    table: "characters" | "locations" | "events" | "objects",
    id: string
  ) => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;

      // Update local state
      if (table === "characters") setCharacters((prev) => prev.filter((e) => e.id !== id));
      if (table === "locations") setLocations((prev) => prev.filter((e) => e.id !== id));
      if (table === "events") setEvents((prev) => prev.filter((e) => e.id !== id));
      if (table === "objects") setObjects((prev) => prev.filter((e) => e.id !== id));

      toast({
        title: "Excluído",
        description: "Entidade excluída com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addNewEntity = async (
    table: "characters" | "locations" | "events" | "objects",
    schema: z.ZodSchema
  ) => {
    try {
      const newEntity = {
        name: "Nova Entidade",
        universe_id: universeId,
      };

      const validated = schema.parse(newEntity);

      const { data, error } = await supabase
        .from(table)
        .insert(validated)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (table === "characters") setCharacters((prev) => [...prev, data as Character]);
      if (table === "locations") setLocations((prev) => [...prev, data as Location]);
      if (table === "events") setEvents((prev) => [...prev, data as Event]);
      if (table === "objects") setObjects((prev) => [...prev, data as Object]);

      setEditingId(data.id);
      
      toast({
        title: "Criado!",
        description: "Nova entidade criada. Edite as informações.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const EntityCard = ({
    entity,
    table,
    schema,
    fields,
  }: {
    entity: any;
    table: "characters" | "locations" | "events" | "objects";
    schema: z.ZodSchema;
    fields: { key: string; label: string; multiline?: boolean }[];
  }) => {
    const [localData, setLocalData] = useState(entity);
    const isSaving = savingStates[entity.id];
    const isEditing = editingId === entity.id;

    const handleChange = (key: string, value: string) => {
      const updated = { ...localData, [key]: value };
      setLocalData(updated);
    };

    const handleBlur = () => {
      saveEntity(table, entity.id, localData, schema);
      setEditingId(null);
    };

    return (
      <Card className={isEditing ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{entity.name}</CardTitle>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Save className="h-3 w-3 animate-pulse" />
                  Salvando...
                </span>
              )}
              {!isSaving && editingId === entity.id && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Salvo
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteEntity(table, entity.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={`${entity.id}-${field.key}`}>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  id={`${entity.id}-${field.key}`}
                  value={localData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={() => setEditingId(entity.id)}
                  onBlur={handleBlur}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <Input
                  id={`${entity.id}-${field.key}`}
                  value={localData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={() => setEditingId(entity.id)}
                  onBlur={handleBlur}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="characters" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="characters">
          <User className="h-4 w-4 mr-2" />
          Personagens
        </TabsTrigger>
        <TabsTrigger value="locations">
          <MapPin className="h-4 w-4 mr-2" />
          Locais
        </TabsTrigger>
        <TabsTrigger value="events">
          <Calendar className="h-4 w-4 mr-2" />
          Eventos
        </TabsTrigger>
        <TabsTrigger value="objects">
          <Package className="h-4 w-4 mr-2" />
          Objetos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="characters" className="space-y-4">
        <Button onClick={() => addNewEntity("characters", characterSchema)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Personagem
        </Button>
        <div className="grid gap-4 md:grid-cols-2">
          {characters.map((char) => (
            <EntityCard
              key={char.id}
              entity={char}
              table="characters"
              schema={characterSchema}
              fields={[
                { key: "name", label: "Nome" },
                { key: "role", label: "Role" },
                { key: "occupation", label: "Ocupação" },
                { key: "description", label: "Descrição", multiline: true },
                { key: "personality", label: "Personalidade", multiline: true },
              ]}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="locations" className="space-y-4">
        <Button onClick={() => addNewEntity("locations", locationSchema)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Local
        </Button>
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc) => (
            <EntityCard
              key={loc.id}
              entity={loc}
              table="locations"
              schema={locationSchema}
              fields={[
                { key: "name", label: "Nome" },
                { key: "type", label: "Tipo" },
                { key: "country", label: "País" },
                { key: "description", label: "Descrição", multiline: true },
              ]}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="events" className="space-y-4">
        <Button onClick={() => addNewEntity("events", eventSchema)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Evento
        </Button>
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((evt) => (
            <EntityCard
              key={evt.id}
              entity={evt}
              table="events"
              schema={eventSchema}
              fields={[
                { key: "name", label: "Nome" },
                { key: "event_date", label: "Data" },
                { key: "significance", label: "Significância" },
                { key: "description", label: "Descrição", multiline: true },
              ]}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="objects" className="space-y-4">
        <Button onClick={() => addNewEntity("objects", objectSchema)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Objeto
        </Button>
        <div className="grid gap-4 md:grid-cols-2">
          {objects.map((obj) => (
            <EntityCard
              key={obj.id}
              entity={obj}
              table="objects"
              schema={objectSchema}
              fields={[
                { key: "name", label: "Nome" },
                { key: "type", label: "Tipo" },
                { key: "powers", label: "Poderes" },
                { key: "description", label: "Descrição", multiline: true },
              ]}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

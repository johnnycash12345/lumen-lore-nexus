import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

interface InteractiveTimelineProps {
  universeId: string;
}

export const InteractiveTimeline = ({ universeId }: InteractiveTimelineProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState("");
  const [characterFilter, setCharacterFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [universeId]);

  useEffect(() => {
    applyFilters();
  }, [events, dateFilter, characterFilter]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('universe_id', universeId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast.error("Erro ao carregar eventos");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (dateFilter) {
      filtered = filtered.filter(e => 
        e.event_date?.toLowerCase().includes(dateFilter.toLowerCase())
      );
    }

    if (characterFilter) {
      filtered = filtered.filter(e => 
        e.characters_involved?.some(c => 
          c.toLowerCase().includes(characterFilter.toLowerCase())
        )
      );
    }

    setFilteredEvents(filtered);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getSignificanceColor = (significance?: string) => {
    if (!significance) return "bg-gray-500";
    const lower = significance.toLowerCase();
    if (lower.includes("alto") || lower.includes("crucial")) return "bg-red-500";
    if (lower.includes("médio") || lower.includes("importante")) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Timeline Interativa de Eventos</h3>
        
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por data..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por personagem..."
                value={characterFilter}
                onChange={(e) => setCharacterFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {(dateFilter || characterFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setDateFilter("");
                setCharacterFilter("");
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Nenhum evento encontrado
            </Card>
          ) : (
            filteredEvents.map((event, idx) => {
              const isExpanded = expandedIds.has(event.id);
              
              return (
                <div key={event.id} className="relative pl-10">
                  <div 
                    className={`absolute left-2.5 w-3 h-3 rounded-full ${getSignificanceColor(event.significance || undefined)} ring-4 ring-background`}
                  />
                  
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div 
                      className="cursor-pointer"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{event.name}</h4>
                          {event.event_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Calendar className="h-4 w-4" />
                              <span>{event.event_date}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {!isExpanded && event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t">
                        {event.description && (
                          <p className="text-sm">{event.description}</p>
                        )}
                        
                        {event.significance && (
                          <div>
                            <span className="text-sm font-medium">Significância: </span>
                            <Badge className={getSignificanceColor(event.significance)}>
                              {event.significance}
                            </Badge>
                          </div>
                        )}

                        {event.characters_involved && event.characters_involved.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Personagens Envolvidos:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {event.characters_involved.map((char, i) => (
                                <Badge key={i} variant="secondary">
                                  {char}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

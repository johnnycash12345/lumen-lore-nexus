import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  significance: string;
  characters_involved: string[];
  location_id: string;
}

interface EventPageProps {
  eventId: string;
}

export function EventPage({ eventId }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (err) throw err;
        setEvent(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <h2 className="font-serif text-xl font-bold">Erro</h2>
              <p className="text-sm text-muted-foreground">{error || 'Evento não encontrado'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4">
          {event.name}
        </h1>

        {event.event_date && (
          <p className="text-sm text-muted-foreground mb-6">Data: {event.event_date}</p>
        )}

        <div className="grid grid-cols-1 gap-6 md:gap-8 mb-8 md:mb-12">
          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Descrição</h2>
            <p className="text-sm leading-relaxed">{event.description}</p>
          </Card>

          {event.significance && (
            <Card className="p-6">
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Significância</h2>
              <p className="text-sm leading-relaxed">{event.significance}</p>
            </Card>
          )}

          {event.characters_involved && event.characters_involved.length > 0 && (
            <Card className="p-6">
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Personagens Envolvidos</h2>
              <div className="flex flex-wrap gap-2">
                {event.characters_involved.map((char, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {char}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

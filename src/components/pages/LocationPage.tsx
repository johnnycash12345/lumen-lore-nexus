import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  description: string;
  type: string;
  country: string;
  significance: string;
}

interface LocationPageProps {
  locationId: string;
}

export function LocationPage({ locationId }: LocationPageProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single();

        if (err) throw err;
        setLocation(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar local');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [locationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <h2 className="font-serif text-xl font-bold">Erro</h2>
              <p className="text-sm text-muted-foreground">{error || 'Local não encontrado'}</p>
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
          {location.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Informações</h2>
            <div className="space-y-4">
              {location.type && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold">{location.type}</p>
                </div>
              )}
              {location.country && (
                <div>
                  <p className="text-sm text-muted-foreground">País</p>
                  <p className="font-semibold">{location.country}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Descrição</h2>
            <p className="text-sm leading-relaxed">{location.description}</p>
          </Card>
        </div>

        {location.significance && (
          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Significância</h2>
            <p className="text-sm leading-relaxed">{location.significance}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

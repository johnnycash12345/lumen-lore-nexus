import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  role: string;
  abilities: string[];
  personality: string;
  occupation: string;
}

interface CharacterPageProps {
  characterId: string;
}

export function CharacterPage({ characterId }: CharacterPageProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (err) throw err;
        setCharacter(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar personagem');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [characterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <h2 className="font-serif text-xl font-bold">Erro</h2>
              <p className="text-sm text-muted-foreground">{error || 'Personagem não encontrado'}</p>
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
          {character.name}
        </h1>

        {character.aliases && character.aliases.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Também conhecido como: {character.aliases.join(', ')}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Informações</h2>
            <div className="space-y-4">
              {character.role && (
                <div>
                  <p className="text-sm text-muted-foreground">Papel</p>
                  <p className="font-semibold">{character.role}</p>
                </div>
              )}
              {character.occupation && (
                <div>
                  <p className="text-sm text-muted-foreground">Ocupação</p>
                  <p className="font-semibold">{character.occupation}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Descrição</h2>
            <p className="text-sm leading-relaxed">{character.description}</p>
          </Card>
        </div>

        {character.abilities && character.abilities.length > 0 && (
          <Card className="p-6 mb-6 md:mb-8">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {character.abilities.map((ability, idx) => (
                <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {ability}
                </span>
              ))}
            </div>
          </Card>
        )}

        {character.personality && (
          <Card className="p-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-4">Personalidade</h2>
            <p className="text-sm leading-relaxed">{character.personality}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

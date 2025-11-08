import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, universeId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing question for universe: ${universeId}`);

    // Buscar informações do universo e entidades
    const [universeData, charactersData, locationsData, eventsData, objectsData, relationshipsData] = await Promise.all([
      supabase.from('universes').select('*').eq('id', universeId).single(),
      supabase.from('characters').select('*').eq('universe_id', universeId).limit(50),
      supabase.from('locations').select('*').eq('universe_id', universeId).limit(30),
      supabase.from('events').select('*').eq('universe_id', universeId).limit(30),
      supabase.from('objects').select('*').eq('universe_id', universeId).limit(30),
      supabase.from('relationships').select('*').eq('universe_id', universeId).limit(50),
    ]);

    // Build entity maps for relationship context
    const entityMap = new Map<string, any>();
    charactersData.data?.forEach(c => entityMap.set(`CHARACTER:${c.id}`, c));
    locationsData.data?.forEach(l => entityMap.set(`LOCATION:${l.id}`, l));
    eventsData.data?.forEach(e => entityMap.set(`EVENT:${e.id}`, e));
    objectsData.data?.forEach(o => entityMap.set(`OBJECT:${o.id}`, o));

    // Build relationship context
    let relationshipContext = '';
    if (relationshipsData.data && relationshipsData.data.length > 0) {
      relationshipContext = '\nRelacionamentos:\n';
      relationshipsData.data.forEach(rel => {
        const from = entityMap.get(`${rel.from_entity_type}:${rel.from_entity_id}`);
        const to = entityMap.get(`${rel.to_entity_type}:${rel.to_entity_id}`);
        if (from && to) {
          relationshipContext += `- ${from.name} (${rel.relationship_type}) ${to.name}: ${rel.description || ''}\n`;
        }
      });
    }

    // Construir contexto completo
    const context = `
Universo: ${universeData.data?.name}
Descrição: ${universeData.data?.description}
Autor: ${universeData.data?.author || 'N/A'}
Ano: ${universeData.data?.publication_year || 'N/A'}

Personagens (${charactersData.data?.length || 0}):
${charactersData.data?.slice(0, 20).map(c => {
  const abilities = c.abilities && c.abilities.length > 0 ? ` | Habilidades: ${c.abilities.join(', ')}` : '';
  return `- ${c.name}: ${c.description || 'Sem descrição'} | Papel: ${c.role || 'N/A'}${abilities}`;
}).join('\n') || 'Nenhum'}

Locais (${locationsData.data?.length || 0}):
${locationsData.data?.slice(0, 15).map(l => `- ${l.name}: ${l.description || 'Sem descrição'} | Tipo: ${l.type || 'N/A'}`).join('\n') || 'Nenhum'}

Eventos (${eventsData.data?.length || 0}):
${eventsData.data?.slice(0, 15).map(e => `- ${e.name}: ${e.description || 'Sem descrição'} | Data: ${e.event_date || 'N/A'}`).join('\n') || 'Nenhum'}

Objetos (${objectsData.data?.length || 0}):
${objectsData.data?.slice(0, 15).map(o => `- ${o.name}: ${o.description || 'Sem descrição'} | Tipo: ${o.type || 'N/A'}`).join('\n') || 'Nenhum'}
${relationshipContext}
`;

    console.log('Sending to Deepseek with context length:', context.length);

    const systemPrompt = `Você é um enciclopedista especializado no universo de "${universeData.data?.name}".

REGRAS IMPORTANTES:
1. Responda APENAS com base no contexto fornecido
2. Se não souber a resposta, diga claramente "Não tenho essa informação no contexto disponível"
3. Seja detalhado e preciso nas suas respostas
4. Use os relacionamentos para enriquecer suas respostas
5. Cite fontes específicas quando possível (ex: "Segundo o personagem X...")
6. Formate sua resposta de forma clara e estruturada

Contexto:
${context}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepseek API error:', response.status, errorText);
      throw new Error(`Erro ao chamar Deepseek: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    console.log('Answer generated successfully');

    return new Response(JSON.stringify({ 
      answer,
      stats: {
        characters: charactersData.data?.length || 0,
        locations: locationsData.data?.length || 0,
        events: eventsData.data?.length || 0,
        objects: objectsData.data?.length || 0,
        relationships: relationshipsData.data?.length || 0,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in universe-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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

    // Buscar informações do universo e entidades
    const [universeData, charactersData, locationsData, eventsData, objectsData] = await Promise.all([
      supabase.from('universes').select('*').eq('id', universeId).single(),
      supabase.from('characters').select('*').eq('universe_id', universeId),
      supabase.from('locations').select('*').eq('universe_id', universeId),
      supabase.from('events').select('*').eq('universe_id', universeId),
      supabase.from('objects').select('*').eq('universe_id', universeId),
    ]);

    // Construir contexto
    const context = `
Universo: ${universeData.data?.name}
Descrição: ${universeData.data?.description}

Personagens (${charactersData.data?.length || 0}):
${charactersData.data?.map(c => `- ${c.name}: ${c.description || ''} (${c.role || ''})`).join('\n') || 'Nenhum'}

Locais (${locationsData.data?.length || 0}):
${locationsData.data?.map(l => `- ${l.name}: ${l.description || ''}`).join('\n') || 'Nenhum'}

Eventos (${eventsData.data?.length || 0}):
${eventsData.data?.map(e => `- ${e.name}: ${e.description || ''}`).join('\n') || 'Nenhum'}

Objetos (${objectsData.data?.length || 0}):
${objectsData.data?.map(o => `- ${o.name}: ${o.description || ''}`).join('\n') || 'Nenhum'}
`;

    console.log('Enviando para Deepseek com contexto:', context.substring(0, 200));

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
            content: `Você é um enciclopedista especializado neste universo literário. Use o contexto fornecido para responder perguntas de forma detalhada, precisa e educativa. Se não souber a resposta baseado no contexto, diga claramente.\n\nContexto:\n${context}`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Deepseek:', response.status, errorText);
      throw new Error(`Erro ao chamar Deepseek: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro em universe-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

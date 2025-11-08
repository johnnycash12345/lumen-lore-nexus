import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { universeId, pdfText } = await req.json();
    
    if (!universeId || !pdfText) {
      throw new Error('Missing required fields');
    }

    console.log(`Processing PDF for universe: ${universeId}`);

    // Update processing job
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        status: 'processing', 
        current_step: 'Extraindo entidades com IA',
        progress: 30 
      })
      .eq('universe_id', universeId);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Call Deepseek API to extract entities
    const prompt = `Analise o seguinte texto de um universo literário e extraia as entidades em formato JSON:

Texto:
${pdfText.substring(0, 8000)}

Retorne APENAS um objeto JSON válido com esta estrutura (sem markdown, sem explicações):
{
  "characters": [
    {
      "name": "Nome do personagem",
      "aliases": ["apelido1", "apelido2"],
      "description": "Descrição detalhada",
      "role": "Protagonista/Antagonista/Secundário",
      "abilities": ["habilidade1", "habilidade2"],
      "personality": "Descrição da personalidade",
      "occupation": "Ocupação"
    }
  ],
  "locations": [
    {
      "name": "Nome do local",
      "type": "Cidade/Castelo/Floresta/etc",
      "description": "Descrição",
      "country": "País (se aplicável)",
      "significance": "Importância no universo"
    }
  ],
  "events": [
    {
      "name": "Nome do evento",
      "description": "Descrição",
      "date": "Data ou período",
      "significance": "Importância"
    }
  ],
  "objects": [
    {
      "name": "Nome do objeto",
      "type": "Arma/Artefato/Item/etc",
      "description": "Descrição",
      "powers": "Poderes ou habilidades especiais"
    }
  ]
}`;

    console.log('Calling Deepseek API...');
    
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Você é um especialista em análise literária. Retorne apenas JSON válido, sem markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('Deepseek API error:', deepseekResponse.status, errorText);
      throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    const content = deepseekData.choices[0].message.content;
    
    console.log('Deepseek response:', content);

    // Parse the JSON response
    let entities;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      entities = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Deepseek response:', content);
      throw new Error('Failed to parse AI response');
    }

    // Update progress
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        current_step: 'Criando entidades no banco de dados',
        progress: 60 
      })
      .eq('universe_id', universeId);

    // Insert characters
    if (entities.characters && entities.characters.length > 0) {
      const charactersToInsert = entities.characters.map((char: any) => ({
        universe_id: universeId,
        name: char.name,
        aliases: char.aliases || [],
        description: char.description,
        role: char.role,
        abilities: char.abilities || [],
        personality: char.personality,
        occupation: char.occupation,
      }));

      const { error: charError } = await supabaseClient
        .from('characters')
        .insert(charactersToInsert);

      if (charError) {
        console.error('Error inserting characters:', charError);
      }
    }

    // Insert locations
    if (entities.locations && entities.locations.length > 0) {
      const locationsToInsert = entities.locations.map((loc: any) => ({
        universe_id: universeId,
        name: loc.name,
        type: loc.type,
        description: loc.description,
        country: loc.country,
        significance: loc.significance,
      }));

      const { error: locError } = await supabaseClient
        .from('locations')
        .insert(locationsToInsert);

      if (locError) {
        console.error('Error inserting locations:', locError);
      }
    }

    // Insert events
    if (entities.events && entities.events.length > 0) {
      const eventsToInsert = entities.events.map((evt: any) => ({
        universe_id: universeId,
        name: evt.name,
        description: evt.description,
        event_date: evt.date,
        significance: evt.significance,
      }));

      const { error: evtError } = await supabaseClient
        .from('events')
        .insert(eventsToInsert);

      if (evtError) {
        console.error('Error inserting events:', evtError);
      }
    }

    // Insert objects
    if (entities.objects && entities.objects.length > 0) {
      const objectsToInsert = entities.objects.map((obj: any) => ({
        universe_id: universeId,
        name: obj.name,
        type: obj.type,
        description: obj.description,
        powers: obj.powers,
      }));

      const { error: objError } = await supabaseClient
        .from('objects')
        .insert(objectsToInsert);

      if (objError) {
        console.error('Error inserting objects:', objError);
      }
    }

    // Update universe status to active
    await supabaseClient
      .from('universes')
      .update({ status: 'active' })
      .eq('id', universeId);

    // Complete processing job
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        status: 'completed', 
        current_step: 'Concluído',
        progress: 100 
      })
      .eq('universe_id', universeId);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Universe processed successfully',
        stats: {
          characters: entities.characters?.length || 0,
          locations: entities.locations?.length || 0,
          events: entities.events?.length || 0,
          objects: entities.objects?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-pdf function:', error);
    
    // Update processing job with error
    if (error.universeId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('processing_jobs')
        .update({ 
          status: 'error',
          error_message: error.message || 'Unknown error'
        })
        .eq('universe_id', error.universeId);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
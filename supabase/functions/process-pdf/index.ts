import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Gera um slug amigável a partir de um texto
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
}

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

    // Insert characters and capture IDs
    let characters: any[] = [];
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

      const { data: insertedCharacters, error: charError } = await supabaseClient
        .from('characters')
        .insert(charactersToInsert)
        .select();

      if (charError) {
        console.error('Error inserting characters:', charError);
      } else {
        characters = insertedCharacters || [];
        console.log(`Inserted ${characters.length} characters`);
      }
    }

    // Insert locations and capture IDs
    let locations: any[] = [];
    if (entities.locations && entities.locations.length > 0) {
      const locationsToInsert = entities.locations.map((loc: any) => ({
        universe_id: universeId,
        name: loc.name,
        type: loc.type,
        description: loc.description,
        country: loc.country,
        significance: loc.significance,
      }));

      const { data: insertedLocations, error: locError } = await supabaseClient
        .from('locations')
        .insert(locationsToInsert)
        .select();

      if (locError) {
        console.error('Error inserting locations:', locError);
      } else {
        locations = insertedLocations || [];
        console.log(`Inserted ${locations.length} locations`);
      }
    }

    // Insert events and capture IDs
    let events: any[] = [];
    if (entities.events && entities.events.length > 0) {
      const eventsToInsert = entities.events.map((evt: any) => ({
        universe_id: universeId,
        name: evt.name,
        description: evt.description,
        event_date: evt.date,
        significance: evt.significance,
      }));

      const { data: insertedEvents, error: evtError } = await supabaseClient
        .from('events')
        .insert(eventsToInsert)
        .select();

      if (evtError) {
        console.error('Error inserting events:', evtError);
      } else {
        events = insertedEvents || [];
        console.log(`Inserted ${events.length} events`);
      }
    }

    // Insert objects and capture IDs
    let objects: any[] = [];
    if (entities.objects && entities.objects.length > 0) {
      const objectsToInsert = entities.objects.map((obj: any) => ({
        universe_id: universeId,
        name: obj.name,
        type: obj.type,
        description: obj.description,
        powers: obj.powers,
      }));

      const { data: insertedObjects, error: objError } = await supabaseClient
        .from('objects')
        .insert(objectsToInsert)
        .select();

      if (objError) {
        console.error('Error inserting objects:', objError);
      } else {
        objects = insertedObjects || [];
        console.log(`Inserted ${objects.length} objects`);
      }
    }

    // ===== FASE 8: GERAR PÁGINAS =====
    
    console.log('Generating pages for universe...');

    // Update progress
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        current_step: 'Gerando páginas',
        progress: 85 
      })
      .eq('universe_id', universeId);

    let pagesCreated = 0;

    try {
      // Fetch universe data
      const { data: universeData, error: fetchError } = await supabaseClient
        .from('universes')
        .select('*')
        .eq('id', universeId)
        .single();

      if (fetchError) {
        console.error('Error fetching universe:', fetchError);
        throw new Error(`Failed to fetch universe: ${fetchError.message}`);
      }

      const universe = universeData;
      const universeSlug = generateSlug(universe.name);
      
      // 1. Create universe page
      const { error: universePageError } = await supabaseClient
        .from('pages')
        .upsert({
          universe_id: universeId,
          entity_type: 'UNIVERSE',
          entity_id: universeId,
          slug: universeSlug,
          title: universe.name,
          description: universe.description,
          status: 'published',
        }, {
          onConflict: 'universe_id,entity_type,entity_id'
        });

      if (universePageError) {
        console.error('Error creating universe page:', universePageError);
      } else {
        console.log(`Created universe page: ${universeSlug}`);
        pagesCreated++;
      }

      // 2. Create character pages
      if (characters.length > 0) {
        const characterPages = characters.map((char: any) => ({
          universe_id: universeId,
          entity_type: 'CHARACTER',
          entity_id: char.id,
          slug: `${universeSlug}/characters/${generateSlug(char.name)}`,
          title: char.name,
          description: char.description || '',
          status: 'published',
        }));

        const { error: pageError } = await supabaseClient
          .from('pages')
          .upsert(characterPages, {
            onConflict: 'universe_id,entity_type,entity_id'
          });

        if (pageError) {
          console.error('Error creating character pages:', pageError);
        } else {
          console.log(`Created ${characterPages.length} character pages`);
          pagesCreated += characterPages.length;
        }
      }

      // 3. Create location pages
      if (locations.length > 0) {
        const locationPages = locations.map((loc: any) => ({
          universe_id: universeId,
          entity_type: 'LOCATION',
          entity_id: loc.id,
          slug: `${universeSlug}/locations/${generateSlug(loc.name)}`,
          title: loc.name,
          description: loc.description || '',
          status: 'published',
        }));

        const { error: pageError } = await supabaseClient
          .from('pages')
          .upsert(locationPages, {
            onConflict: 'universe_id,entity_type,entity_id'
          });

        if (pageError) {
          console.error('Error creating location pages:', pageError);
        } else {
          console.log(`Created ${locationPages.length} location pages`);
          pagesCreated += locationPages.length;
        }
      }

      // 4. Create event pages
      if (events.length > 0) {
        const eventPages = events.map((evt: any) => ({
          universe_id: universeId,
          entity_type: 'EVENT',
          entity_id: evt.id,
          slug: `${universeSlug}/events/${generateSlug(evt.name)}`,
          title: evt.name,
          description: evt.description || '',
          status: 'published',
        }));

        const { error: pageError } = await supabaseClient
          .from('pages')
          .upsert(eventPages, {
            onConflict: 'universe_id,entity_type,entity_id'
          });

        if (pageError) {
          console.error('Error creating event pages:', pageError);
        } else {
          console.log(`Created ${eventPages.length} event pages`);
          pagesCreated += eventPages.length;
        }
      }

      // 5. Create object pages
      if (objects.length > 0) {
        const objectPages = objects.map((obj: any) => ({
          universe_id: universeId,
          entity_type: 'OBJECT',
          entity_id: obj.id,
          slug: `${universeSlug}/objects/${generateSlug(obj.name)}`,
          title: obj.name,
          description: obj.description || '',
          status: 'published',
        }));

        const { error: pageError } = await supabaseClient
          .from('pages')
          .upsert(objectPages, {
            onConflict: 'universe_id,entity_type,entity_id'
          });

        if (pageError) {
          console.error('Error creating object pages:', pageError);
        } else {
          console.log(`Created ${objectPages.length} object pages`);
          pagesCreated += objectPages.length;
        }
      }

      console.log(`All pages created successfully. Total: ${pagesCreated}`);

    } catch (error: any) {
      console.error('Error generating pages:', error);
      // Don't throw - continue processing even if page generation fails
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
          characters: characters.length,
          locations: locations.length,
          events: events.length,
          objects: objects.length,
          pagesCreated: pagesCreated,
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
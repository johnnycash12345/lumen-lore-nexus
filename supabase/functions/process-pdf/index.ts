import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyzeRelationships } from '../shared/deepseek-utils.ts';

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

// ===== FUZZY MATCHING UTILITIES =====

/**
 * Calcula a distância de edição (Levenshtein distance) entre duas strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

/**
 * Calcula a similaridade entre duas strings usando Levenshtein distance
 * Retorna um valor entre 0 e 1 (1 = idêntico, 0 = completamente diferente)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Verifica se uma string contém outra (para detectar aliases)
 */
function isSubstring(str1: string, str2: string): boolean {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  return s1.includes(s2) || s2.includes(s1);
}

/**
 * Encontra duplicatas em um array de entidades
 */
function findDuplicates(
  entities: any[],
  nameField: string = 'name',
  threshold: number = 0.8
): Map<number, number[]> {
  const duplicates = new Map<number, number[]>();

  for (let i = 0; i < entities.length; i++) {
    if (duplicates.has(i)) continue;

    const group: number[] = [i];

    for (let j = i + 1; j < entities.length; j++) {
      if (duplicates.has(j)) continue;

      const name1 = entities[i][nameField];
      const name2 = entities[j][nameField];

      if (name1.toLowerCase() === name2.toLowerCase()) {
        group.push(j);
        continue;
      }

      if (isSubstring(name1, name2)) {
        group.push(j);
        continue;
      }

      const similarity = calculateSimilarity(name1, name2);
      if (similarity >= threshold) {
        group.push(j);
      }
    }

    if (group.length > 1) {
      duplicates.set(i, group);
    }
  }

  return duplicates;
}

// ===== CONSOLIDATION FUNCTIONS =====

/**
 * Mescla múltiplos personagens em um
 */
function mergeCharacters(characters: any[]): any {
  if (characters.length === 0) return null;
  if (characters.length === 1) return characters[0];

  const base = characters.reduce((prev, curr) =>
    (curr.description?.length || 0) > (prev.description?.length || 0) ? curr : prev
  );

  const allAliases = new Set<string>();
  characters.forEach(char => {
    if (char.name) allAliases.add(char.name);
    if (char.aliases && Array.isArray(char.aliases)) {
      char.aliases.forEach((alias: string) => allAliases.add(alias));
    }
  });
  allAliases.delete(base.name);

  const allAbilities = new Set<string>();
  characters.forEach(char => {
    if (char.abilities && Array.isArray(char.abilities)) {
      char.abilities.forEach((ability: string) => allAbilities.add(ability));
    }
  });

  const roleHierarchy: Record<string, number> = { 
    'Protagonista': 3, 
    'Antagonista': 2, 
    'Secundário': 1, 
    'Menor': 0 
  };
  
  const bestRole = characters.reduce((prev, curr) => {
    const prevScore = roleHierarchy[prev.role] || 0;
    const currScore = roleHierarchy[curr.role] || 0;
    return currScore > prevScore ? curr : prev;
  }).role;

  return {
    ...base,
    name: base.name,
    aliases: Array.from(allAliases),
    role: bestRole,
    abilities: Array.from(allAbilities),
    personality: base.personality || characters.find(c => c.personality)?.personality,
    occupation: base.occupation || characters.find(c => c.occupation)?.occupation,
  };
}

/**
 * Consolida personagens duplicados
 */
function consolidateCharacters(characters: any[]): any[] {
  if (!characters || characters.length === 0) return [];

  const duplicates = findDuplicates(characters, 'name', 0.8);
  const consolidated: any[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < characters.length; i++) {
    if (processedIndices.has(i)) continue;

    const group = duplicates.get(i) || [i];
    const merged = mergeCharacters(group.map(idx => characters[idx]));

    if (merged) consolidated.push(merged);
    group.forEach(idx => processedIndices.add(idx));
  }

  return consolidated;
}

/**
 * Mescla múltiplos locais em um
 */
function mergeLocations(locations: any[]): any {
  if (locations.length === 0) return null;
  if (locations.length === 1) return locations[0];

  const base = locations.reduce((prev, curr) =>
    (curr.description?.length || 0) > (prev.description?.length || 0) ? curr : prev
  );

  return {
    ...base,
    type: base.type || locations.find(l => l.type)?.type,
    country: base.country || locations.find(l => l.country)?.country,
    significance: base.significance || locations.find(l => l.significance)?.significance,
  };
}

/**
 * Consolida locais duplicados
 */
function consolidateLocations(locations: any[]): any[] {
  if (!locations || locations.length === 0) return [];

  const duplicates = findDuplicates(locations, 'name', 0.85);
  const consolidated: any[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < locations.length; i++) {
    if (processedIndices.has(i)) continue;

    const group = duplicates.get(i) || [i];
    const merged = mergeLocations(group.map(idx => locations[idx]));

    if (merged) consolidated.push(merged);
    group.forEach(idx => processedIndices.add(idx));
  }

  return consolidated;
}

/**
 * Mescla múltiplos eventos em um
 */
function mergeEvents(events: any[]): any {
  if (events.length === 0) return null;
  if (events.length === 1) return events[0];

  const base = events.reduce((prev, curr) =>
    (curr.description?.length || 0) > (prev.description?.length || 0) ? curr : prev
  );

  const involvedCharacters = new Set<string>();
  events.forEach(evt => {
    if (evt.characters_involved && Array.isArray(evt.characters_involved)) {
      evt.characters_involved.forEach((char: string) => involvedCharacters.add(char));
    }
  });

  return {
    ...base,
    date: base.date || events.find(e => e.date)?.date,
    significance: base.significance || events.find(e => e.significance)?.significance,
    characters_involved: Array.from(involvedCharacters),
  };
}

/**
 * Consolida eventos duplicados
 */
function consolidateEvents(events: any[]): any[] {
  if (!events || events.length === 0) return [];

  const duplicates = findDuplicates(events, 'name', 0.85);
  const consolidated: any[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < events.length; i++) {
    if (processedIndices.has(i)) continue;

    const group = duplicates.get(i) || [i];
    const merged = mergeEvents(group.map(idx => events[idx]));

    if (merged) consolidated.push(merged);
    group.forEach(idx => processedIndices.add(idx));
  }

  return consolidated;
}

/**
 * Mescla múltiplos objetos em um
 */
function mergeObjects(objects: any[]): any {
  if (objects.length === 0) return null;
  if (objects.length === 1) return objects[0];

  const base = objects.reduce((prev, curr) =>
    (curr.description?.length || 0) > (prev.description?.length || 0) ? curr : prev
  );

  return {
    ...base,
    type: base.type || objects.find(o => o.type)?.type,
    powers: base.powers || objects.find(o => o.powers)?.powers,
  };
}

/**
 * Consolida objetos duplicados
 */
function consolidateObjects(objects: any[]): any[] {
  if (!objects || objects.length === 0) return [];

  const duplicates = findDuplicates(objects, 'name', 0.85);
  const consolidated: any[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < objects.length; i++) {
    if (processedIndices.has(i)) continue;

    const group = duplicates.get(i) || [i];
    const merged = mergeObjects(group.map(idx => objects[idx]));

    if (merged) consolidated.push(merged);
    group.forEach(idx => processedIndices.add(idx));
  }

  return consolidated;
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

    // ===== FASE 5: CONSOLIDAR DUPLICATAS =====
    
    console.log('Consolidating duplicate entities...');

    await supabaseClient
      .from('processing_jobs')
      .update({ 
        current_step: 'Consolidando entidades duplicadas',
        progress: 50 
      })
      .eq('universe_id', universeId);

    try {
      // Consolidate characters
      if (entities.characters && entities.characters.length > 0) {
        const originalCount = entities.characters.length;
        entities.characters = consolidateCharacters(entities.characters);
        const removedCount = originalCount - entities.characters.length;
        console.log(`Characters: ${originalCount} → ${entities.characters.length} (removed ${removedCount} duplicates)`);
      }

      // Consolidate locations
      if (entities.locations && entities.locations.length > 0) {
        const originalCount = entities.locations.length;
        entities.locations = consolidateLocations(entities.locations);
        const removedCount = originalCount - entities.locations.length;
        console.log(`Locations: ${originalCount} → ${entities.locations.length} (removed ${removedCount} duplicates)`);
      }

      // Consolidate events
      if (entities.events && entities.events.length > 0) {
        const originalCount = entities.events.length;
        entities.events = consolidateEvents(entities.events);
        const removedCount = originalCount - entities.events.length;
        console.log(`Events: ${originalCount} → ${entities.events.length} (removed ${removedCount} duplicates)`);
      }

      // Consolidate objects
      if (entities.objects && entities.objects.length > 0) {
        const originalCount = entities.objects.length;
        entities.objects = consolidateObjects(entities.objects);
        const removedCount = originalCount - entities.objects.length;
        console.log(`Objects: ${originalCount} → ${entities.objects.length} (removed ${removedCount} duplicates)`);
      }

      console.log('Consolidation completed');

    } catch (error: any) {
      console.error('Error consolidating entities:', error);
      // Continue processing even if consolidation fails
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

    // ===== FASE 9: ANALISAR RELACIONAMENTOS =====
    
    console.log('Analyzing relationships between entities...');

    await supabaseClient
      .from('processing_jobs')
      .update({ 
        current_step: 'Analisando relacionamentos',
        progress: 90 
      })
      .eq('universe_id', universeId);

    let relationshipsCreated = 0;

    try {
      // Only analyze if we have entities
      if (characters.length > 0 || locations.length > 0 || events.length > 0) {
        const { data: universeData } = await supabaseClient
          .from('universes')
          .select('*')
          .eq('id', universeId)
          .single();

        if (universeData) {
          console.log('Calling Deepseek for relationship analysis...');
          
          const relationships = await analyzeRelationships(
            characters.slice(0, 20), // Limit to top 20 to avoid token limits
            locations.slice(0, 10),
            events.slice(0, 10),
            universeData.description || ''
          );

          console.log(`Deepseek identified ${relationships.length} relationships`);

          // Map entity names to IDs
          const entityMap = new Map<string, { type: string; id: string }>();
          
          characters.forEach((char: any) => {
            entityMap.set(char.name.toLowerCase(), { type: 'CHARACTER', id: char.id });
          });
          locations.forEach((loc: any) => {
            entityMap.set(loc.name.toLowerCase(), { type: 'LOCATION', id: loc.id });
          });
          events.forEach((evt: any) => {
            entityMap.set(evt.name.toLowerCase(), { type: 'EVENT', id: evt.id });
          });
          objects.forEach((obj: any) => {
            entityMap.set(obj.name.toLowerCase(), { type: 'OBJECT', id: obj.id });
          });

          // Process and insert relationships
          const relationshipsToInsert = relationships
            .map((rel: any) => {
              const fromEntity = entityMap.get(rel.from_entity_name?.toLowerCase() || '');
              const toEntity = entityMap.get(rel.to_entity_name?.toLowerCase() || '');

              if (!fromEntity || !toEntity) {
                console.warn(`Could not find entities for relationship: ${rel.from_entity_name} -> ${rel.to_entity_name}`);
                return null;
              }

              return {
                universe_id: universeId,
                from_entity_type: fromEntity.type,
                from_entity_id: fromEntity.id,
                to_entity_type: toEntity.type,
                to_entity_id: toEntity.id,
                relationship_type: rel.relationship_type || 'RELATED',
                description: rel.description || '',
              };
            })
            .filter((rel: any) => rel !== null);

          if (relationshipsToInsert.length > 0) {
            const { error: relError } = await supabaseClient
              .from('relationships')
              .insert(relationshipsToInsert);

            if (relError) {
              console.error('Error inserting relationships:', relError);
            } else {
              relationshipsCreated = relationshipsToInsert.length;
              console.log(`Created ${relationshipsCreated} relationships`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error analyzing relationships:', error);
      // Don't throw - continue even if relationship analysis fails
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
          relationshipsCreated: relationshipsCreated,
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
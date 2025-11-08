import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyzeRelationships } from '../shared/deepseek-utils.ts';
import { Logger } from './logger.ts';
import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { validatePdfText, validateExtractedEntities, sanitizeExtractedData } from './validation-utils.ts';
import { ProcessingErrorHandler } from './error-handler.ts';
import { consolidateCharacters, consolidateLocations, consolidateEvents, consolidateObjects } from './consolidation-utils.ts';
import { ProcessingResult } from './types.ts';

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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Atualiza o progresso do job de processamento
 */
async function updateProgress(
  supabaseClient: any,
  universeId: string,
  step: string,
  progress: number,
  logger: Logger
) {
  try {
    await supabaseClient
      .from('processing_jobs')
      .update({
        current_step: step,
        progress,
      })
      .eq('universe_id', universeId);

    logger.debug('Progress Update', `${step} - ${progress}%`);
  } catch (error: any) {
    logger.warn('Progress Update', `Failed to update progress: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let universeId: string | null = null;
  let logger: Logger | null = null;

  try {
    // ===== FASE 0: INICIALIZAÇÃO =====
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { universeId: inputUniverseId, pdfText } = await req.json();

    if (!inputUniverseId || !pdfText) {
      throw new ProcessingErrorHandler(
        'INVALID_INPUT',
        'Missing required fields: universeId, pdfText',
        'Initialization',
        false
      );
    }

    universeId = inputUniverseId;
    logger = new Logger(inputUniverseId);

    logger.info('Initialization', `Starting PDF processing for universe: ${inputUniverseId}`);

    // ===== FASE 1: VALIDAÇÃO DO PDF =====
    logger.info('PDF Validation', 'Validating PDF text...');

    const pdfValidation = validatePdfText(pdfText);
    if (!pdfValidation.valid) {
      throw new ProcessingErrorHandler(
        'INVALID_PDF',
        `PDF validation failed: ${pdfValidation.errors.join(', ')}`,
        'PDF Validation',
        false
      );
    }

    logger.info('PDF Validation', `PDF is valid (${pdfText.length} characters)`);

    await updateProgress(supabaseClient, inputUniverseId, 'Validação do PDF', 10, logger);

    // ===== FASE 2: EXTRAÇÃO DE ENTIDADES =====
    await updateProgress(supabaseClient, inputUniverseId, 'Extraindo entidades com IA', 30, logger);
    logger.info('Entity Extraction', 'Extracting entities with Deepseek...');

    const extractionPrompt = `Analise o seguinte texto de um universo literário e extraia as entidades em formato JSON.

Texto (primeiras 8000 caracteres):
${pdfText.substring(0, 8000)}

Retorne APENAS um objeto JSON válido com esta estrutura (sem markdown, sem explicações):
{
  "characters": [
    {
      "name": "Nome do personagem",
      "aliases": ["apelido1", "apelido2"],
      "description": "Descrição detalhada",
      "role": "Protagonista/Antagonista/Secundário/Menor",
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

    const extractionResponse = await callDeepseek(
      extractionPrompt,
      'Você é um especialista em extração de entidades de textos literários. Retorne apenas JSON válido, sem markdown.',
      { temperature: 0.3, maxTokens: 4000 },
      logger,
      'Entity Extraction'
    );

    let entities = extractJSON(extractionResponse, logger, 'Entity Extraction');

    // Validate extracted entities
    const entityValidation = validateExtractedEntities(entities);
    if (!entityValidation.valid) {
      logger.warn('Entity Extraction', `Validation warnings: ${entityValidation.errors.join(', ')}`);
    }

    // Sanitize data
    entities = sanitizeExtractedData(entities);

    logger.info('Entity Extraction', `Extracted ${entities.characters?.length || 0} characters, ${entities.locations?.length || 0} locations, ${entities.events?.length || 0} events, ${entities.objects?.length || 0} objects`);

    await updateProgress(supabaseClient, inputUniverseId, 'Extração concluída', 40, logger);

    // ===== FASE 3: CONSOLIDAÇÃO =====
    logger.info('Consolidation', 'Consolidating duplicate entities...');
    await updateProgress(supabaseClient, inputUniverseId, 'Consolidando entidades duplicadas', 50, logger);

    const consolidationStats = {
      characters: 0,
      locations: 0,
      events: 0,
      objects: 0,
    };

    try {
      if (entities.characters && entities.characters.length > 0) {
        const charResult = await consolidateCharacters(entities.characters, logger);
        entities.characters = charResult.consolidated as any[];
        consolidationStats.characters = charResult.statistics.duplicatesRemoved;
      }

      if (entities.locations && entities.locations.length > 0) {
        const locResult = await consolidateLocations(entities.locations, logger);
        entities.locations = locResult.consolidated as any[];
        consolidationStats.locations = locResult.statistics.duplicatesRemoved;
      }

      if (entities.events && entities.events.length > 0) {
        const evtResult = await consolidateEvents(entities.events, logger);
        entities.events = evtResult.consolidated as any[];
        consolidationStats.events = evtResult.statistics.duplicatesRemoved;
      }

      if (entities.objects && entities.objects.length > 0) {
        const objResult = await consolidateObjects(entities.objects, logger);
        entities.objects = objResult.consolidated as any[];
        consolidationStats.objects = objResult.statistics.duplicatesRemoved;
      }

      const totalConsolidations = consolidationStats.characters + consolidationStats.locations + consolidationStats.events + consolidationStats.objects;
      logger.info('Consolidation', `Consolidation complete. Total duplicates removed: ${totalConsolidations}`, consolidationStats);
    } catch (error: any) {
      logger.error('Consolidation', 'Error consolidating entities', error);
    }

    // ===== FASE 4: INSERÇÃO NO BANCO DE DADOS =====
    await updateProgress(supabaseClient, inputUniverseId, 'Criando entidades no banco de dados', 60, logger);
    logger.info('Database Insertion', 'Inserting entities into database...');

    // Insert characters and capture IDs
    let characters: any[] = [];
    if (entities.characters && entities.characters.length > 0) {
      const charactersToInsert = entities.characters.map((char: any) => ({
        universe_id: inputUniverseId,
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
        universe_id: inputUniverseId,
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
        universe_id: inputUniverseId,
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
        universe_id: inputUniverseId,
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
      .eq('universe_id', inputUniverseId);

    let pagesCreated = 0;

    try {
      // Fetch universe data
      const { data: universeData, error: fetchError } = await supabaseClient
        .from('universes')
        .select('*')
        .eq('id', inputUniverseId)
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
          universe_id: inputUniverseId,
          entity_type: 'UNIVERSE',
          entity_id: inputUniverseId,
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
          universe_id: inputUniverseId,
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
          universe_id: inputUniverseId,
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
          universe_id: inputUniverseId,
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
          universe_id: inputUniverseId,
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
      .eq('universe_id', inputUniverseId);

    let relationshipsCreated = 0;

    try {
      // Only analyze if we have entities
      if (characters.length > 0 || locations.length > 0 || events.length > 0) {
        const { data: universeData } = await supabaseClient
          .from('universes')
          .select('*')
          .eq('id', inputUniverseId)
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
                universe_id: inputUniverseId,
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
      .eq('id', inputUniverseId);

    // Complete processing job
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        status: 'completed', 
        current_step: 'Concluído',
        progress: 100 
      })
      .eq('universe_id', inputUniverseId);

    // ===== FASE 6: FINALIZAÇÃO =====
    logger.info('Finalization', 'Completing processing job...');

    const duration = Date.now() - startTime;

    const result: ProcessingResult = {
      success: true,
      universeId: inputUniverseId,
      stats: {
        characters: characters.length,
        locations: locations.length,
        events: events.length,
        objects: objects.length,
        pagesCreated: pagesCreated,
        relationshipsCreated: relationshipsCreated,
        consolidationsPerformed: consolidationStats.characters + consolidationStats.locations + consolidationStats.events + consolidationStats.objects,
      },
      duration,
      warnings: logger.getLogs().filter(l => l.level === 'WARN').map(l => l.message),
    };

    logger.info('Finalization', `Processing completed successfully in ${duration}ms`);
    logger.info('Summary', JSON.stringify(result.stats));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (logger) {
      logger.error('Error Handler', 'Processing failed', error);
    }

    // Update processing job with error
    if (universeId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const errorMessage = error instanceof ProcessingErrorHandler
        ? error.message
        : error.message || 'Unknown error';

      await supabaseClient
        .from('processing_jobs')
        .update({
          status: 'error',
          error_message: errorMessage,
          current_step: 'Erro',
          progress: 0,
        })
        .eq('universe_id', universeId);
    }

    const errorResponse = error instanceof ProcessingErrorHandler
      ? error.toJSON()
      : {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error',
          phase: 'Unknown',
          recoverable: false,
        };

    return new Response(
      JSON.stringify({
        success: false,
        error: errorResponse,
        duration,
        logs: logger?.getLogs() || [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
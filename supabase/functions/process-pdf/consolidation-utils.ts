import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { Logger } from './logger.ts';
import { ConsolidationResult, Character, Location, Event, LumenObject } from './types.ts';

/**
 * Calcula similaridade entre duas strings usando Levenshtein distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Calcula similaridade entre 0 e 1
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Encontra potenciais duplicatas em personagens
 */
export function findDuplicateCharacters(
  characters: Character[],
  threshold: number = 0.7
): Array<{ indices: number[]; similarity: number }> {
  const duplicates: Array<{ indices: number[]; similarity: number }> = [];

  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const similarity = calculateSimilarity(
        characters[i].name,
        characters[j].name
      );

      if (similarity >= threshold) {
        duplicates.push({
          indices: [i, j],
          similarity,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Encontra potenciais duplicatas em locais
 */
export function findDuplicateLocations(
  locations: Location[],
  threshold: number = 0.7
): Array<{ indices: number[]; similarity: number }> {
  const duplicates: Array<{ indices: number[]; similarity: number }> = [];

  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const similarity = calculateSimilarity(
        locations[i].name,
        locations[j].name
      );

      if (similarity >= threshold) {
        duplicates.push({
          indices: [i, j],
          similarity,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Encontra potenciais duplicatas em eventos
 */
export function findDuplicateEvents(
  events: Event[],
  threshold: number = 0.7
): Array<{ indices: number[]; similarity: number }> {
  const duplicates: Array<{ indices: number[]; similarity: number }> = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const similarity = calculateSimilarity(
        events[i].name,
        events[j].name
      );

      if (similarity >= threshold) {
        duplicates.push({
          indices: [i, j],
          similarity,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Encontra potenciais duplicatas em objetos
 */
export function findDuplicateObjects(
  objects: LumenObject[],
  threshold: number = 0.7
): Array<{ indices: number[]; similarity: number }> {
  const duplicates: Array<{ indices: number[]; similarity: number }> = [];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const similarity = calculateSimilarity(
        objects[i].name,
        objects[j].name
      );

      if (similarity >= threshold) {
        duplicates.push({
          indices: [i, j],
          similarity,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Consolida personagens duplicados usando Deepseek
 */
export async function consolidateCharacters(
  characters: Character[],
  logger?: Logger
): Promise<ConsolidationResult> {
  logger?.info('Character Consolidation', `Checking ${characters.length} characters for duplicates...`);

  const duplicates = findDuplicateCharacters(characters, 0.7);

  if (duplicates.length === 0) {
    logger?.info('Character Consolidation', 'No duplicates found');
    return {
      consolidated: characters,
      merges: [],
      statistics: {
        originalCount: characters.length,
        consolidatedCount: characters.length,
        duplicatesRemoved: 0,
      },
    };
  }

  logger?.info('Character Consolidation', `Found ${duplicates.length} potential duplicates`);

  const merges: Array<{
    originalNames: string[];
    mergedInto: string;
    confidence: number;
  }> = [];

  let consolidated = [...characters];
  const indicesToRemove = new Set<number>();

  for (const duplicate of duplicates) {
    const [idx1, idx2] = duplicate.indices;

    if (indicesToRemove.has(idx1) || indicesToRemove.has(idx2)) {
      continue;
    }

    const char1 = consolidated[idx1];
    const char2 = consolidated[idx2];

    const prompt = `
São estes dois personagens a mesma pessoa?

Personagem 1:
Nome: ${char1.name}
Aliases: ${char1.aliases?.join(', ') || 'Nenhum'}
Descrição: ${char1.description}
Papel: ${char1.role}

Personagem 2:
Nome: ${char2.name}
Aliases: ${char2.aliases?.join(', ') || 'Nenhum'}
Descrição: ${char2.description}
Papel: ${char2.role}

Responda com JSON:
{
  "isSamePerson": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em análise de personagens literários.',
        { temperature: 0.1, maxTokens: 500 },
        logger,
        'Character Consolidation'
      );

      const result = extractJSON(response, logger, 'Character Consolidation');

      if (result.isSamePerson && result.confidence > 0.7) {
        const mergedCharacter: Character = {
          name: char1.name,
          aliases: [
            ...new Set([
              ...(char1.aliases || []),
              ...(char2.aliases || []),
              char2.name,
            ]),
          ],
          description: `${char1.description} ${char2.description}`.trim(),
          role: char1.role,
          abilities: [...new Set([...(char1.abilities || []), ...(char2.abilities || [])])],
          personality: `${char1.personality || ''} ${char2.personality || ''}`.trim(),
          occupation: char1.occupation || char2.occupation,
        };

        consolidated[idx1] = mergedCharacter;
        indicesToRemove.add(idx2);

        merges.push({
          originalNames: [char1.name, char2.name],
          mergedInto: mergedCharacter.name,
          confidence: result.confidence,
        });

        logger?.info('Character Consolidation', `Merged "${char1.name}" and "${char2.name}"`);
      }
    } catch (error: any) {
      logger?.warn('Character Consolidation', `Failed to consolidate "${char1.name}" and "${char2.name}": ${error.message}`);
    }
  }

  consolidated = consolidated.filter((_, idx) => !indicesToRemove.has(idx));

  logger?.info('Character Consolidation', `Consolidated ${characters.length} → ${consolidated.length} characters`);

  return {
    consolidated,
    merges,
    statistics: {
      originalCount: characters.length,
      consolidatedCount: consolidated.length,
      duplicatesRemoved: indicesToRemove.size,
    },
  };
}

/**
 * Consolida locais duplicados
 */
export async function consolidateLocations(
  locations: Location[],
  logger?: Logger
): Promise<ConsolidationResult> {
  logger?.info('Location Consolidation', `Checking ${locations.length} locations for duplicates...`);

  const duplicates = findDuplicateLocations(locations, 0.7);

  if (duplicates.length === 0) {
    logger?.info('Location Consolidation', 'No duplicates found');
    return {
      consolidated: locations,
      merges: [],
      statistics: {
        originalCount: locations.length,
        consolidatedCount: locations.length,
        duplicatesRemoved: 0,
      },
    };
  }

  logger?.info('Location Consolidation', `Found ${duplicates.length} potential duplicates`);

  const merges: Array<{
    originalNames: string[];
    mergedInto: string;
    confidence: number;
  }> = [];

  let consolidated = [...locations];
  const indicesToRemove = new Set<number>();

  for (const duplicate of duplicates) {
    const [idx1, idx2] = duplicate.indices;

    if (indicesToRemove.has(idx1) || indicesToRemove.has(idx2)) {
      continue;
    }

    const loc1 = consolidated[idx1];
    const loc2 = consolidated[idx2];

    const prompt = `
São estes dois locais o mesmo lugar?

Local 1:
Nome: ${loc1.name}
Tipo: ${loc1.type}
Descrição: ${loc1.description}
País: ${loc1.country || 'Não especificado'}

Local 2:
Nome: ${loc2.name}
Tipo: ${loc2.type}
Descrição: ${loc2.description}
País: ${loc2.country || 'Não especificado'}

Responda com JSON:
{
  "isSameLocation": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em análise de locais em narrativas literárias.',
        { temperature: 0.1, maxTokens: 500 },
        logger,
        'Location Consolidation'
      );

      const result = extractJSON(response, logger, 'Location Consolidation');

      if (result.isSameLocation && result.confidence > 0.7) {
        const mergedLocation: Location = {
          name: loc1.name,
          aliases: [
            ...new Set([
              ...(loc1.aliases || []),
              ...(loc2.aliases || []),
              loc2.name,
            ]),
          ],
          type: loc1.type || loc2.type,
          description: `${loc1.description} ${loc2.description}`.trim(),
          country: loc1.country || loc2.country,
          significance: `${loc1.significance} ${loc2.significance}`.trim(),
        };

        consolidated[idx1] = mergedLocation;
        indicesToRemove.add(idx2);

        merges.push({
          originalNames: [loc1.name, loc2.name],
          mergedInto: mergedLocation.name,
          confidence: result.confidence,
        });

        logger?.info('Location Consolidation', `Merged "${loc1.name}" and "${loc2.name}"`);
      }
    } catch (error: any) {
      logger?.warn('Location Consolidation', `Failed to consolidate "${loc1.name}" and "${loc2.name}": ${error.message}`);
    }
  }

  consolidated = consolidated.filter((_, idx) => !indicesToRemove.has(idx));

  logger?.info('Location Consolidation', `Consolidated ${locations.length} → ${consolidated.length} locations`);

  return {
    consolidated,
    merges,
    statistics: {
      originalCount: locations.length,
      consolidatedCount: consolidated.length,
      duplicatesRemoved: indicesToRemove.size,
    },
  };
}

/**
 * Consolida eventos duplicados
 */
export async function consolidateEvents(
  events: Event[],
  logger?: Logger
): Promise<ConsolidationResult> {
  logger?.info('Event Consolidation', `Checking ${events.length} events for duplicates...`);

  const duplicates = findDuplicateEvents(events, 0.7);

  if (duplicates.length === 0) {
    logger?.info('Event Consolidation', 'No duplicates found');
    return {
      consolidated: events,
      merges: [],
      statistics: {
        originalCount: events.length,
        consolidatedCount: events.length,
        duplicatesRemoved: 0,
      },
    };
  }

  logger?.info('Event Consolidation', `Found ${duplicates.length} potential duplicates`);

  const merges: Array<{
    originalNames: string[];
    mergedInto: string;
    confidence: number;
  }> = [];

  let consolidated = [...events];
  const indicesToRemove = new Set<number>();

  for (const duplicate of duplicates) {
    const [idx1, idx2] = duplicate.indices;

    if (indicesToRemove.has(idx1) || indicesToRemove.has(idx2)) {
      continue;
    }

    const evt1 = consolidated[idx1];
    const evt2 = consolidated[idx2];

    const prompt = `
São estes dois eventos o mesmo evento?

Evento 1:
Nome: ${evt1.name}
Descrição: ${evt1.description}
Data: ${evt1.date}
Personagens: ${evt1.involvedCharacters?.join(', ') || 'Nenhum'}

Evento 2:
Nome: ${evt2.name}
Descrição: ${evt2.description}
Data: ${evt2.date}
Personagens: ${evt2.involvedCharacters?.join(', ') || 'Nenhum'}

Responda com JSON:
{
  "isSameEvent": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em análise de eventos em narrativas literárias.',
        { temperature: 0.1, maxTokens: 500 },
        logger,
        'Event Consolidation'
      );

      const result = extractJSON(response, logger, 'Event Consolidation');

      if (result.isSameEvent && result.confidence > 0.7) {
        const mergedEvent: Event = {
          name: evt1.name,
          description: `${evt1.description} ${evt2.description}`.trim(),
          date: evt1.date || evt2.date,
          significance: evt1.significance,
          involvedCharacters: [...new Set([...(evt1.involvedCharacters || []), ...(evt2.involvedCharacters || [])])],
        };

        consolidated[idx1] = mergedEvent;
        indicesToRemove.add(idx2);

        merges.push({
          originalNames: [evt1.name, evt2.name],
          mergedInto: mergedEvent.name,
          confidence: result.confidence,
        });

        logger?.info('Event Consolidation', `Merged "${evt1.name}" and "${evt2.name}"`);
      }
    } catch (error: any) {
      logger?.warn('Event Consolidation', `Failed to consolidate "${evt1.name}" and "${evt2.name}": ${error.message}`);
    }
  }

  consolidated = consolidated.filter((_, idx) => !indicesToRemove.has(idx));

  logger?.info('Event Consolidation', `Consolidated ${events.length} → ${consolidated.length} events`);

  return {
    consolidated,
    merges,
    statistics: {
      originalCount: events.length,
      consolidatedCount: consolidated.length,
      duplicatesRemoved: indicesToRemove.size,
    },
  };
}

/**
 * Consolida objetos duplicados
 */
export async function consolidateObjects(
  objects: LumenObject[],
  logger?: Logger
): Promise<ConsolidationResult> {
  logger?.info('Object Consolidation', `Checking ${objects.length} objects for duplicates...`);

  const duplicates = findDuplicateObjects(objects, 0.7);

  if (duplicates.length === 0) {
    logger?.info('Object Consolidation', 'No duplicates found');
    return {
      consolidated: objects,
      merges: [],
      statistics: {
        originalCount: objects.length,
        consolidatedCount: objects.length,
        duplicatesRemoved: 0,
      },
    };
  }

  logger?.info('Object Consolidation', `Found ${duplicates.length} potential duplicates`);

  const merges: Array<{
    originalNames: string[];
    mergedInto: string;
    confidence: number;
  }> = [];

  let consolidated = [...objects];
  const indicesToRemove = new Set<number>();

  for (const duplicate of duplicates) {
    const [idx1, idx2] = duplicate.indices;

    if (indicesToRemove.has(idx1) || indicesToRemove.has(idx2)) {
      continue;
    }

    const obj1 = consolidated[idx1];
    const obj2 = consolidated[idx2];

    const prompt = `
São estes dois objetos o mesmo objeto?

Objeto 1:
Nome: ${obj1.name}
Tipo: ${obj1.type}
Descrição: ${obj1.description}
Poderes: ${obj1.powers?.join(', ') || 'Nenhum'}

Objeto 2:
Nome: ${obj2.name}
Tipo: ${obj2.type}
Descrição: ${obj2.description}
Poderes: ${obj2.powers?.join(', ') || 'Nenhum'}

Responda com JSON:
{
  "isSameObject": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Explicação breve"
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em análise de objetos em narrativas literárias.',
        { temperature: 0.1, maxTokens: 500 },
        logger,
        'Object Consolidation'
      );

      const result = extractJSON(response, logger, 'Object Consolidation');

      if (result.isSameObject && result.confidence > 0.7) {
        const mergedObject: LumenObject = {
          name: obj1.name,
          aliases: [
            ...new Set([
              ...(obj1.aliases || []),
              ...(obj2.aliases || []),
              obj2.name,
            ]),
          ],
          type: obj1.type || obj2.type,
          description: `${obj1.description} ${obj2.description}`.trim(),
          owner: obj1.owner || obj2.owner,
          powers: [...new Set([...(obj1.powers || []), ...(obj2.powers || [])])],
        };

        consolidated[idx1] = mergedObject;
        indicesToRemove.add(idx2);

        merges.push({
          originalNames: [obj1.name, obj2.name],
          mergedInto: mergedObject.name,
          confidence: result.confidence,
        });

        logger?.info('Object Consolidation', `Merged "${obj1.name}" and "${obj2.name}"`);
      }
    } catch (error: any) {
      logger?.warn('Object Consolidation', `Failed to consolidate "${obj1.name}" and "${obj2.name}": ${error.message}`);
    }
  }

  consolidated = consolidated.filter((_, idx) => !indicesToRemove.has(idx));

  logger?.info('Object Consolidation', `Consolidated ${objects.length} → ${consolidated.length} objects`);

  return {
    consolidated,
    merges,
    statistics: {
      originalCount: objects.length,
      consolidatedCount: consolidated.length,
      duplicatesRemoved: indicesToRemove.size,
    },
  };
}

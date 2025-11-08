import { ExtractedEntities } from './types.ts';

/**
 * Valida se o texto extraído do PDF é válido
 */
export function validatePdfText(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push('PDF text is empty');
  }

  if (text.length < 100) {
    errors.push('PDF text is too short (less than 100 characters)');
  }

  if (text.length > 10000000) {
    errors.push('PDF text is too long (more than 10MB)');
  }

  // Check for binary/encoded PDF content
  const binaryIndicators = [
    '%PDF',           // PDF header
    'endstream',      // PDF stream marker
    'endobj',         // PDF object marker
    '\x00',           // Null bytes
    'JFIF',           // JPEG header
    '\xFF\xD8\xFF',   // JPEG magic bytes
  ];

  const containsBinary = binaryIndicators.some(indicator => text.includes(indicator));
  if (containsBinary) {
    errors.push('PDF text appears to be binary/unprocessed. The PDF may be scanned or text extraction failed.');
  }

  // Check for valid readable characters (at least 50% should be readable)
  const readableChars = text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?'"()\-]/g);
  const readableRatio = readableChars ? readableChars.length / text.length : 0;
  
  if (readableRatio < 0.5) {
    errors.push(`PDF text has low readability (${(readableRatio * 100).toFixed(1)}%). May be binary or poorly extracted.`);
  }

  // Check for valid characters
  if (!/[a-zA-Z0-9]/.test(text)) {
    errors.push('PDF text contains no valid alphanumeric characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida entidades extraídas
 */
export function validateExtractedEntities(entities: ExtractedEntities): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate characters
  if (entities.characters && entities.characters.length > 0) {
    entities.characters.forEach((char, idx) => {
      if (!char.name || char.name.trim().length === 0) {
        errors.push(`Character ${idx} has no name`);
      }
      if (!char.description || char.description.trim().length === 0) {
        errors.push(`Character ${char.name} has no description`);
      }
      if (!char.role) {
        errors.push(`Character ${char.name} has no role`);
      }
    });
  }

  // Validate locations
  if (entities.locations && entities.locations.length > 0) {
    entities.locations.forEach((loc, idx) => {
      if (!loc.name || loc.name.trim().length === 0) {
        errors.push(`Location ${idx} has no name`);
      }
      if (!loc.description || loc.description.trim().length === 0) {
        errors.push(`Location ${loc.name} has no description`);
      }
    });
  }

  // Validate events
  if (entities.events && entities.events.length > 0) {
    entities.events.forEach((evt, idx) => {
      if (!evt.name || evt.name.trim().length === 0) {
        errors.push(`Event ${idx} has no name`);
      }
      if (!evt.description || evt.description.trim().length === 0) {
        errors.push(`Event ${evt.name} has no description`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida resposta do Deepseek
 */
export function validateDeepseekResponse(response: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!response) {
    errors.push('Deepseek response is empty');
    return { valid: false, errors };
  }

  if (!response.choices || response.choices.length === 0) {
    errors.push('Deepseek response has no choices');
  }

  if (!response.choices?.[0]?.message?.content) {
    errors.push('Deepseek response has no content');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida JSON extraído
 */
export function validateJSON(jsonStr: string): { valid: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    return { valid: true, data };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Sanitiza dados extraídos
 */
export function sanitizeExtractedData(entities: ExtractedEntities): ExtractedEntities {
  return {
    characters: entities.characters?.map(c => ({
      ...c,
      name: c.name?.trim() || '',
      description: c.description?.trim() || '',
      aliases: c.aliases?.filter(a => a && a.trim()) || [],
      abilities: c.abilities?.filter(a => a && a.trim()) || [],
    })) || [],
    locations: entities.locations?.map(l => ({
      ...l,
      name: l.name?.trim() || '',
      description: l.description?.trim() || '',
      aliases: l.aliases?.filter(a => a && a.trim()) || [],
    })) || [],
    events: entities.events?.map(e => ({
      ...e,
      name: e.name?.trim() || '',
      description: e.description?.trim() || '',
      involvedCharacters: e.involvedCharacters?.filter(c => c && c.trim()) || [],
    })) || [],
    objects: entities.objects?.map(o => ({
      ...o,
      name: o.name?.trim() || '',
      description: o.description?.trim() || '',
      aliases: o.aliases?.filter(a => a && a.trim()) || [],
    })) || [],
  };
}

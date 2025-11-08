/**
 * Gera um slug amigável a partir de um texto
 * Exemplo: "Harry Potter" → "harry-potter"
 * Exemplo: "Sherlock Holmes" → "sherlock-holmes"
 */
export function generateSlug(text: string): string {
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

/**
 * Gera slug completo para uma entidade
 * Exemplo: "harry-potter/characters/harry-potter"
 */
export function generateFullSlug(
  universeSlug: string,
  entityType: string,
  entityName: string
): string {
  const entitySlug = generateSlug(entityName);
  const typeMap: Record<string, string> = {
    UNIVERSE: '',
    CHARACTER: 'characters',
    LOCATION: 'locations',
    EVENT: 'events',
    OBJECT: 'objects',
  };

  const typePath = typeMap[entityType];
  if (!typePath) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  if (typePath === '') {
    return universeSlug;
  }

  return `${universeSlug}/${typePath}/${entitySlug}`;
}

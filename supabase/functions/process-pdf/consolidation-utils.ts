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
export function consolidateCharacters(characters: any[]): any[] {
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
export function consolidateLocations(locations: any[]): any[] {
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
    if (evt.involvedCharacters && Array.isArray(evt.involvedCharacters)) {
      evt.involvedCharacters.forEach((char: string) => involvedCharacters.add(char));
    }
  });

  return {
    ...base,
    date: base.date || events.find(e => e.date)?.date,
    significance: base.significance || events.find(e => e.significance)?.significance,
    involvedCharacters: Array.from(involvedCharacters),
  };
}

/**
 * Consolida eventos duplicados
 */
export function consolidateEvents(events: any[]): any[] {
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
export function consolidateObjects(objects: any[]): any[] {
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

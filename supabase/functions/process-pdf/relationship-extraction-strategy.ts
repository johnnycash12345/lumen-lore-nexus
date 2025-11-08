import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { Logger } from './logger.ts';
import {
  RelationshipDynamics,
  RelationshipNetwork,
} from './relationship-types.ts';

/**
 * Fase 1: Identificar todos os relacionamentos mencionados
 */
export async function identifyAllRelationships(
  pdfText: string,
  characters: string[],
  logger?: Logger
): Promise<Array<{ character1: string; character2: string; type: string }>> {
  logger?.info('Relationship Identification', `Identifying relationships between ${characters.length} characters...`);

  const characterList = characters.join(', ');

  const prompt = `
Analise o seguinte texto e identifique TODOS os relacionamentos entre personagens.

Personagens: ${characterList}

Texto:
${pdfText.substring(0, 20000)} ${pdfText.length > 20000 ? '[... texto continua ...]' : ''}

Para CADA par de personagens, determine:
1. Se há relacionamento entre eles
2. Tipo de relacionamento (romance, amizade, rivalidade, etc)
3. Se é mencionado no texto

Retorne JSON com esta estrutura:
{
  "relationships": [
    {
      "character1": "Nome",
      "character2": "Nome",
      "type": "ROMANTIC_LOVE|FAMILIAL_LOVE|DEEP_FRIENDSHIP|CASUAL_FRIENDSHIP|MENTORSHIP|RIVALRY|ANTAGONISM|ALLIANCE|COMPLEX",
      "mentioned": true,
      "evidence": "Breve descrição de como sabemos que existe"
    }
  ]
}

IMPORTANTE:
1. Inclua TODOS os relacionamentos, mesmo pequenos
2. Não invente relacionamentos que não existem
3. Seja preciso na classificação
4. Inclua evidência do texto
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de relacionamentos em narrativas.',
      { temperature: 0.2, maxTokens: 3000 },
      logger,
      'Relationship Identification'
    );

    const result = extractJSON(response, logger, 'Relationship Identification');

    logger?.info('Relationship Identification', `Identified ${result.relationships?.length || 0} relationships`);

    return (result.relationships || []).filter((r: any) => r.mentioned);
  } catch (error: any) {
    logger?.error('Relationship Identification', 'Failed to identify relationships', error);
    throw error;
  }
}

/**
 * Fase 2: Analisar dinâmica de cada relacionamento
 */
export async function analyzeRelationshipDynamics(
  character1: string,
  character2: string,
  relationshipType: string,
  pdfText: string,
  logger?: Logger
): Promise<RelationshipDynamics> {
  logger?.info('Relationship Analysis', `Analyzing ${character1} <-> ${character2}...`);

  const prompt = `
Analise em DETALHES o relacionamento entre ${character1} e ${character2}.

Tipo de relacionamento: ${relationshipType}

Texto:
${pdfText.substring(0, 25000)} ${pdfText.length > 25000 ? '[... texto continua ...]' : ''}

Analise:
1. FORÇA do relacionamento (0-100)
2. INTIMIDADE entre eles (0-100)
3. CONFIANÇA mútua (0-100)
4. COMPATIBILIDADE (0-100)
5. Quem DOMINA o relacionamento (0-100 para cada um)
6. TODOS os conflitos entre eles
7. TODAS as interações importantes
8. Se se APOIAM mutuamente
9. OBJETIVOS compartilhados
10. OBJETIVOS conflitantes
11. DEPENDÊNCIA emocional
12. Como o relacionamento EVOLUI
13. MOMENTOS-CHAVE
14. FUTURO do relacionamento

Retorne JSON com esta estrutura:
{
  "character1": "${character1}",
  "character2": "${character2}",
  "relationshipType": "${relationshipType}",
  "currentStatus": "FORMING",
  "strength": 75,
  "intimacy": 60,
  "trust": 55,
  "compatibility": 70,
  "dominance": {
    "character1": 60,
    "character2": 40
  },
  "interactions": [
    {
      "sceneNumber": 1,
      "sceneTitle": "Título",
      "interaction": "Descrição detalhada do que acontece",
      "emotionalTone": "Positivo",
      "significance": "MAJOR",
      "beforeStatus": "FORMING",
      "afterStatus": "ESTABLISHED",
      "quotes": ["Diálogo relevante"]
    }
  ],
  "conflicts": [
    {
      "conflictType": "Tipo de conflito",
      "severity": 4,
      "trigger": "O que causou",
      "manifestation": "Como se manifesta",
      "resolution": "Como foi resolvido",
      "resolutionType": "RESOLVED",
      "emotionalImpact": "Como afeta"
    }
  ],
  "supportDynamics": {
    "character1SupportsCharacter2": true,
    "character2SupportsCharacter1": false,
    "mutualSupport": false
  },
  "sharedGoals": ["Objetivo1", "Objetivo2"],
  "conflictingGoals": ["Objetivo conflitante"],
  "emotionalDependency": {
    "character1DependsOn": 30,
    "character2DependsOn": 70
  },
  "trajectory": "Como o relacionamento evolui ao longo da história",
  "keyMoments": [
    {
      "moment": "Descrição do momento",
      "impact": "Como afeta o relacionamento",
      "turning_point": true
    }
  ],
  "futureOutlook": "Prognóstico para o relacionamento"
}

IMPORTANTE: Seja ESPECÍFICO com exemplos do texto, cite TRECHOS exatos quando possível.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise profunda de relacionamentos.',
      { temperature: 0.3, maxTokens: 5000 },
      logger,
      'Relationship Analysis'
    );

    const result = extractJSON(response, logger, 'Relationship Analysis');

    logger?.info('Relationship Analysis', `Analyzed ${character1} <-> ${character2}`, {
      strength: result.strength,
      intimacy: result.intimacy,
      trust: result.trust,
      conflicts: result.conflicts?.length || 0,
    });

    return result as RelationshipDynamics;
  } catch (error: any) {
    logger?.error('Relationship Analysis', `Failed to analyze relationship`, error);
    throw error;
  }
}

/**
 * Fase 3: Identificar clusters de relacionamentos
 */
export async function identifyRelationshipClusters(
  relationships: RelationshipDynamics[],
  logger?: Logger
): Promise<
  Array<{
    name: string;
    characters: string[];
    description: string;
  }>
> {
  logger?.info('Cluster Identification', 'Identifying relationship clusters...');

  const characterMap = new Map<string, Set<string>>();

  relationships.forEach(rel => {
    if (!characterMap.has(rel.character1)) {
      characterMap.set(rel.character1, new Set());
    }
    if (!characterMap.has(rel.character2)) {
      characterMap.set(rel.character2, new Set());
    }

    characterMap.get(rel.character1)!.add(rel.character2);
    characterMap.get(rel.character2)!.add(rel.character1);
  });

  const visited = new Set<string>();
  const clusters = [];

  for (const character of characterMap.keys()) {
    if (!visited.has(character)) {
      const cluster = new Set<string>();
      const queue = [character];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.add(current);

        for (const neighbor of characterMap.get(current) || []) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (cluster.size > 1) {
        clusters.push({
          characters: Array.from(cluster),
          size: cluster.size,
        });
      }
    }
  }

  const clusterDescriptions = [];

  for (const cluster of clusters) {
    const prompt = `
Dê um nome descritivo para este grupo de personagens que formam um cluster de relacionamentos:

Personagens: ${cluster.characters.join(', ')}

Retorne JSON com:
{
  "name": "Nome do cluster",
  "description": "Descrição breve do que une este grupo"
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em análise narrativa.',
        { temperature: 0.3, maxTokens: 500 },
        logger,
        'Cluster Identification'
      );

      const result = extractJSON(response, logger, 'Cluster Identification');

      clusterDescriptions.push({
        name: result.name,
        characters: cluster.characters,
        description: result.description,
      });
    } catch (error: any) {
      logger?.warn('Cluster Identification', `Failed to name cluster`, error);
      clusterDescriptions.push({
        name: `Grupo de ${cluster.characters.length} personagens`,
        characters: cluster.characters,
        description: 'Grupo de personagens relacionados',
      });
    }
  }

  logger?.info('Cluster Identification', `Identified ${clusterDescriptions.length} clusters`);

  return clusterDescriptions;
}

/**
 * Fase 4: Identificar alianças e rivalidades principais
 */
export async function identifyAlliancesAndRivalries(
  relationships: RelationshipDynamics[],
  logger?: Logger
): Promise<{
  alliances: Array<{ name: string; characters: string[]; purpose: string; strength: number }>;
  rivalries: Array<{ characters: string[]; reason: string; intensity: number }>;
}> {
  logger?.info('Alliance/Rivalry Analysis', 'Identifying alliances and rivalries...');

  const alliances = [];
  const rivalries = [];

  const allianceRels = relationships.filter(
    r =>
      (['ALLIANCE', 'MENTORSHIP', 'DEEP_FRIENDSHIP'].includes(r.relationshipType) ||
        (r.supportDynamics.mutualSupport && r.strength > 70)) &&
      r.strength > 60
  );

  for (const rel of allianceRels) {
    alliances.push({
      name: `${rel.character1} & ${rel.character2}`,
      characters: [rel.character1, rel.character2],
      purpose: rel.sharedGoals.join(', ') || 'Aliança estratégica',
      strength: rel.strength,
    });
  }

  const rivalryRels = relationships.filter(
    r =>
      (['RIVALRY', 'ANTAGONISM', 'BETRAYAL'].includes(r.relationshipType) ||
        (r.conflicts.length > 0 && r.strength < 50)) &&
      r.conflicts.length > 0
  );

  for (const rel of rivalryRels) {
    const maxConflictSeverity = Math.max(...rel.conflicts.map(c => c.severity));
    rivalries.push({
      characters: [rel.character1, rel.character2],
      reason: rel.conflicts.map(c => c.conflictType).join(', '),
      intensity: maxConflictSeverity,
    });
  }

  logger?.info('Alliance/Rivalry Analysis', `Found ${alliances.length} alliances and ${rivalries.length} rivalries`);

  return { alliances, rivalries };
}

/**
 * Consolidar tudo em uma rede de relacionamentos
 */
export async function consolidateRelationshipNetwork(
  universeId: string,
  relationships: RelationshipDynamics[],
  clusters: Array<{ name: string; characters: string[]; description: string }>,
  alliances: Array<{ name: string; characters: string[]; purpose: string; strength: number }>,
  rivalries: Array<{ characters: string[]; reason: string; intensity: number }>,
  logger?: Logger
): Promise<RelationshipNetwork> {
  logger?.info('Network Consolidation', 'Consolidating relationship network...');

  const characterRelationshipMap: Record<string, string[]> = {};

  relationships.forEach(rel => {
    if (!characterRelationshipMap[rel.character1]) {
      characterRelationshipMap[rel.character1] = [];
    }
    if (!characterRelationshipMap[rel.character2]) {
      characterRelationshipMap[rel.character2] = [];
    }

    characterRelationshipMap[rel.character1].push(rel.character2);
    characterRelationshipMap[rel.character2].push(rel.character1);
  });

  const keyRelationships = relationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, Math.ceil(relationships.length * 0.3));

  const relationshipsByType: Record<string, number> = {};
  relationships.forEach(rel => {
    relationshipsByType[rel.relationshipType] = (relationshipsByType[rel.relationshipType] || 0) + 1;
  });

  const avgStrength = relationships.length > 0 
    ? relationships.reduce((acc, r) => acc + r.strength, 0) / relationships.length 
    : 0;
  const avgIntimacy = relationships.length > 0
    ? relationships.reduce((acc, r) => acc + r.intimacy, 0) / relationships.length
    : 0;
  const avgTrust = relationships.length > 0
    ? relationships.reduce((acc, r) => acc + r.trust, 0) / relationships.length
    : 0;

  const network: RelationshipNetwork = {
    universeId,
    relationships,
    characterRelationshipMap,
    relationshipClusters: clusters,
    keyRelationships,
    relationshipConflicts: relationships
      .filter(r => r.conflicts.length > 0)
      .map(r => ({
        characters: [r.character1, r.character2],
        conflict: r.conflicts.map(c => c.conflictType).join(', '),
        impact: r.conflicts.map(c => c.emotionalImpact).join('; '),
      })),
    alliances,
    rivalries,
    statistics: {
      totalRelationships: relationships.length,
      averageStrength: Math.round(avgStrength),
      averageIntimacy: Math.round(avgIntimacy),
      averageTrust: Math.round(avgTrust),
      relationshipsByType,
    },
  };

  logger?.info('Network Consolidation', 'Network consolidated', network.statistics);

  return network;
}

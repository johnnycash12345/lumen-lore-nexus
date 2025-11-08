import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { Logger } from './logger.ts';
import {
  NarrativeArc,
  NarrativeEvent,
  CompleteNarrativeStructure,
  NarrativePhase,
} from './narrative-arc-types.ts';

/**
 * Fase 1: Identificar estrutura narrativa geral
 */
export async function identifyNarrativeStructure(
  pdfText: string,
  logger?: Logger
): Promise<{
  type: string;
  description: string;
  phases: Array<{ phase: NarrativePhase; description: string; percentage: number }>;
}> {
  logger?.info('Structure Identification', 'Identifying narrative structure...');

  const prompt = `
Analise a estrutura narrativa geral do texto.

Texto:
${pdfText.substring(0, 30000)} ${pdfText.length > 30000 ? '[... texto continua ...]' : ''}

Identifique:
1. Tipo de estrutura (Three-Act, Hero's Journey, Save the Cat, etc)
2. As FASES da história (Exposition, Rising Action, Climax, Falling Action, Resolution)
3. Quanto do texto (%) cada fase ocupa
4. Descrição de cada fase

Retorne JSON com:
{
  "type": "Three-Act Structure",
  "description": "Descrição breve",
  "phases": [
    {
      "phase": "EXPOSITION",
      "description": "O que acontece nesta fase",
      "percentage": 15
    },
    {
      "phase": "RISING_ACTION",
      "description": "...",
      "percentage": 35
    },
    {
      "phase": "CLIMAX",
      "description": "...",
      "percentage": 10
    },
    {
      "phase": "FALLING_ACTION",
      "description": "...",
      "percentage": 25
    },
    {
      "phase": "RESOLUTION",
      "description": "...",
      "percentage": 15
    }
  ]
}

IMPORTANTE: Seja preciso nas percentagens, identifique a estrutura REAL.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em estrutura narrativa.',
      { temperature: 0.2, maxTokens: 2000 },
      logger,
      'Structure Identification'
    );

    const result = extractJSON(response, logger, 'Structure Identification');

    logger?.info('Structure Identification', `Identified structure: ${result.type}`);

    return result;
  } catch (error: any) {
    logger?.error('Structure Identification', 'Failed to identify structure', error);
    throw error;
  }
}

/**
 * Fase 2: Extrair todos os eventos principais
 */
export async function extractNarrativeEvents(
  pdfText: string,
  narrativeStructure: any,
  logger?: Logger
): Promise<NarrativeEvent[]> {
  logger?.info('Event Extraction', 'Extracting narrative events...');

  const prompt = `
Extraia TODOS os eventos principais da narrativa.

Estrutura narrativa: ${JSON.stringify(narrativeStructure, null, 2)}

Texto:
${pdfText.substring(0, 30000)} ${pdfText.length > 30000 ? '[... texto continua ...]' : ''}

Para CADA evento importante, identifique:
1. Nome do evento
2. Descrição detalhada
3. Fase narrativa
4. Importância
5. Personagens afetados
6. Locais envolvidos
7. Impacto emocional (0-100)
8. Impacto narrativo (0-100)
9. Posição na timeline (0-100)
10. Consequências a longo prazo

Retorne JSON com:
{
  "events": [
    {
      "eventNumber": 1,
      "eventName": "Nome do evento",
      "eventDescription": "Descrição detalhada",
      "phase": "EXPOSITION",
      "importance": "MAJOR",
      "affectedCharacters": ["Personagem1"],
      "affectedLocations": ["Local1"],
      "emotionalImpact": 75,
      "narrativeImpact": 80,
      "timelinePosition": 25,
      "consequences": "Consequências"
    }
  ]
}

IMPORTANTE: Inclua TODOS os eventos importantes, não invente eventos que não existem.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise narrativa.',
      { temperature: 0.3, maxTokens: 5000 },
      logger,
      'Event Extraction'
    );

    const result = extractJSON(response, logger, 'Event Extraction');

    logger?.info('Event Extraction', `Extracted ${result.events?.length || 0} events`);

    return result.events || [];
  } catch (error: any) {
    logger?.error('Event Extraction', 'Failed to extract events', error);
    throw error;
  }
}

/**
 * Fase 3: Analisar arco principal
 */
export async function analyzeMainArc(
  pdfText: string,
  events: NarrativeEvent[],
  logger?: Logger
): Promise<NarrativeArc> {
  logger?.info('Main Arc Analysis', 'Analyzing main narrative arc...');

  const eventSummary = events
    .slice(0, 20)
    .map(e => `${e.eventNumber}. ${e.eventName} (${e.phase}) - Importância: ${e.importance}`)
    .join('\n');

  const prompt = `
Analise o ARCO PRINCIPAL da narrativa.

Eventos principais:
${eventSummary}

Texto:
${pdfText.substring(0, 30000)} ${pdfText.length > 30000 ? '[... texto continua ...]' : ''}

Analise:
1. Qual é o OBJETIVO principal
2. Quais são os OBSTÁCULOS
3. Como o CLÍMAX é alcançado
4. Como é RESOLVIDO
5. Qual é o TEMA central
6. Quais são os TURNING POINTS
7. Como é a PACING
8. Qual é a TENSÃO ao longo

Retorne JSON com:
{
  "arcId": "main_arc",
  "arcName": "Nome do arco",
  "arcType": "MAIN",
  "mainCharacters": ["Protagonista"],
  "description": "Descrição do arco",
  "theme": "Tema central",
  "climax": {
    "event": {
      "eventName": "Nome do clímax",
      "eventDescription": "Descrição",
      "importance": "CLIMACTIC",
      "emotionalImpact": 100,
      "narrativeImpact": 100,
      "eventNumber": 0,
      "phase": "CLIMAX",
      "affectedCharacters": [],
      "affectedLocations": [],
      "timelinePosition": 75,
      "consequences": "Consequências"
    },
    "buildup": "Como chegou ao clímax",
    "consequence": "Consequência do clímax",
    "emotionalPeak": 100
  },
  "resolution": {
    "type": "HAPPY",
    "description": "Como é resolvido",
    "satisfactionLevel": 85
  },
  "themes": ["Tema1", "Tema2"],
  "tension": {
    "startTension": 20,
    "peakTension": 100,
    "endTension": 30,
    "tensionCurve": "Descrição da curva"
  }
}
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de arcos narrativos.',
      { temperature: 0.3, maxTokens: 3000 },
      logger,
      'Main Arc Analysis'
    );

    const result = extractJSON(response, logger, 'Main Arc Analysis');

    logger?.info('Main Arc Analysis', `Analyzed main arc: ${result.arcName}`);

    return result as NarrativeArc;
  } catch (error: any) {
    logger?.error('Main Arc Analysis', 'Failed to analyze main arc', error);
    throw error;
  }
}

/**
 * Fase 4: Identificar arcos secundários
 */
export async function identifySecondaryArcs(
  pdfText: string,
  mainArc: NarrativeArc,
  characters: string[],
  logger?: Logger
): Promise<NarrativeArc[]> {
  logger?.info('Secondary Arc Identification', 'Identifying secondary arcs...');

  const prompt = `
Identifique os ARCOS SECUNDÁRIOS da narrativa.

Arco principal: ${mainArc.arcName}
Personagens: ${characters.slice(0, 10).join(', ')}

Texto:
${pdfText.substring(0, 30000)} ${pdfText.length > 30000 ? '[... texto continua ...]' : ''}

Identifique:
1. Quais são os arcos secundários (subtramas principais)
2. Qual é o objetivo de cada um
3. Como se conectam ao arco principal
4. Como são resolvidos

Retorne JSON com:
{
  "arcs": [
    {
      "arcId": "secondary_arc_1",
      "arcName": "Nome do arco",
      "arcType": "SECONDARY",
      "mainCharacters": ["Personagem"],
      "description": "Descrição",
      "theme": "Tema",
      "themes": ["Tema1"],
      "resolution": {
        "type": "HAPPY",
        "description": "Como é resolvido",
        "satisfactionLevel": 75
      }
    }
  ]
}

IMPORTANTE: Identifique APENAS arcos secundários reais, não invente subtramas.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em estrutura narrativa.',
      { temperature: 0.3, maxTokens: 3000 },
      logger,
      'Secondary Arc Identification'
    );

    const result = extractJSON(response, logger, 'Secondary Arc Identification');

    logger?.info('Secondary Arc Identification', `Identified ${result.arcs?.length || 0} secondary arcs`);

    return (result.arcs || []) as NarrativeArc[];
  } catch (error: any) {
    logger?.error('Secondary Arc Identification', 'Failed to identify secondary arcs', error);
    return [];
  }
}

/**
 * Fase 5: Analisar arcos de personagens
 */
export async function analyzeCharacterArcs(
  characters: string[],
  events: NarrativeEvent[],
  logger?: Logger
): Promise<NarrativeArc[]> {
  logger?.info('Character Arc Analysis', `Analyzing character arcs for ${Math.min(characters.length, 5)} characters...`);

  const characterArcs: NarrativeArc[] = [];
  const maxCharacters = Math.min(characters.length, 5);

  for (let i = 0; i < maxCharacters; i++) {
    const character = characters[i];
    const characterEvents = events.filter(e => e.affectedCharacters.includes(character));

    if (characterEvents.length === 0) continue;

    const prompt = `
Analise o ARCO DE PERSONAGEM para ${character}.

Eventos principais:
${characterEvents
  .slice(0, 10)
  .map(e => `${e.eventNumber}. ${e.eventName} - ${e.eventDescription}`)
  .join('\n')}

Analise:
1. Como o personagem COMEÇA
2. Como EVOLUI ao longo da história
3. Qual é seu OBJETIVO pessoal
4. Quais são seus CONFLITOS internos
5. Como CRESCE ou MUDA
6. Qual é sua RESOLUÇÃO pessoal

Retorne JSON com:
{
  "arcId": "character_arc_${character.replace(/\s/g, '_')}",
  "arcName": "${character} - Character Arc",
  "arcType": "CHARACTER",
  "mainCharacters": ["${character}"],
  "description": "Descrição do arco",
  "theme": "Tema pessoal",
  "themes": ["Tema1"],
  "resolution": {
    "type": "HAPPY",
    "description": "Como o personagem é resolvido",
    "satisfactionLevel": 80
  }
}
`;

    try {
      const response = await callDeepseek(
        prompt,
        'Você é um especialista em desenvolvimento de personagens.',
        { temperature: 0.3, maxTokens: 2000 },
        logger,
        'Character Arc Analysis'
      );

      const result = extractJSON(response, logger, 'Character Arc Analysis');
      characterArcs.push(result as NarrativeArc);
    } catch (error: any) {
      logger?.warn('Character Arc Analysis', `Failed to analyze arc for ${character}`, error);
    }
  }

  logger?.info('Character Arc Analysis', `Analyzed ${characterArcs.length} character arcs`);

  return characterArcs;
}

/**
 * Consolidar tudo em estrutura narrativa completa
 */
export async function consolidateNarrativeStructure(
  universeId: string,
  narrativeStructure: any,
  mainArc: NarrativeArc,
  secondaryArcs: NarrativeArc[],
  characterArcs: NarrativeArc[],
  allEvents: NarrativeEvent[],
  logger?: Logger
): Promise<CompleteNarrativeStructure> {
  logger?.info('Narrative Consolidation', 'Consolidating complete narrative structure...');

  const turningPoints = allEvents.filter(e => e.importance === 'TURNING_POINT').length;
  const climacticMoments = allEvents.filter(e => e.importance === 'CLIMACTIC').length;

  const themes = [
    ...new Set([
      ...mainArc.themes,
      ...secondaryArcs.flatMap(a => a.themes),
      ...characterArcs.flatMap(a => a.themes),
    ]),
  ];

  const structure: CompleteNarrativeStructure = {
    universeId,
    mainArc,
    secondaryArcs,
    characterArcs,
    subplots: secondaryArcs.filter(a => a.arcType === 'SUBPLOT'),
    thematicArcs: [],
    allEvents,
    timeline: {
      totalDuration: 'Duração da história',
      startDate: 'Data de início',
      endDate: 'Data de fim',
      eventDensity: allEvents.length,
    },
    pacing: {
      overallPacing: 'MODERATE',
      fastestSection: 'Seção mais rápida',
      slowestSection: 'Seção mais lenta',
      pacingVariation: 50,
    },
    tension: {
      overallTensionCurve: 'Descrição da curva de tensão',
      peakTension: mainArc.tension?.peakTension || 100,
      averageTension: 60,
    },
    themes: themes.map(t => ({
      theme: t,
      arcsExploring: [mainArc.arcName],
      resolution: 'Como é resolvido',
      significance: 'MAJOR' as const,
    })),
    structure: {
      type: narrativeStructure.type,
      description: narrativeStructure.description,
    },
    statistics: {
      totalArcs: 1 + secondaryArcs.length + characterArcs.length,
      totalEvents: allEvents.length,
      averageArcLength: Math.round(allEvents.length / Math.max(1, 1 + secondaryArcs.length + characterArcs.length)),
      longestArc: mainArc.arcName,
      shortestArc: secondaryArcs[0]?.arcName || 'N/A',
      turningPoints,
      climacticMoments,
    },
  };

  logger?.info('Narrative Consolidation', 'Narrative structure consolidated', structure.statistics);

  return structure;
}

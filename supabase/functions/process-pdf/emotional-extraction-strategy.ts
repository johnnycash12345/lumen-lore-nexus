import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { Logger } from './logger.ts';
import {
  SceneEmotionalAnalysis,
  CharacterEmotionalJourney,
  RelationshipEmotionalDynamics,
  EventEmotionalImpact,
  CompleteEmotionalAnalysis,
} from './emotional-types.ts';

/**
 * Fase 1: Identificar e descrever cenas
 */
export async function identifyScenes(
  pdfText: string,
  logger?: Logger
): Promise<Array<{ sceneNumber: number; sceneTitle: string; sceneText: string }>> {
  logger?.info('Scene Identification', 'Identifying scenes in the text...');

  const prompt = `
Analise o seguinte texto literário e identifique as CENAS principais.

Uma CENA é uma sequência de eventos que ocorrem no mesmo tempo e lugar, com os mesmos personagens.

Texto:
${pdfText.substring(0, 15000)} ${pdfText.length > 15000 ? '[... texto continua ...]' : ''}

Retorne JSON com esta estrutura:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneTitle": "Título descritivo da cena",
      "startMarker": "Primeira frase ou palavra-chave que marca o início",
      "endMarker": "Última frase ou palavra-chave que marca o fim",
      "summary": "Resumo de 1-2 frases do que acontece",
      "mainCharacters": ["Personagem1", "Personagem2"],
      "location": "Onde a cena acontece",
      "timeframe": "Quando a cena acontece"
    }
  ]
}

IMPORTANTE:
1. Identifique TODAS as cenas principais
2. Seja preciso nos marcadores
3. Inclua apenas personagens que aparecem
4. Não invente cenas que não existem
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise estrutural de narrativas literárias.',
      { temperature: 0.2, maxTokens: 3000 },
      logger,
      'Scene Identification'
    );

    const result = extractJSON(response, logger, 'Scene Identification');

    logger?.info('Scene Identification', `Identified ${result.scenes.length} scenes`);

    const scenes = result.scenes.map((scene: any) => ({
      sceneNumber: scene.sceneNumber,
      sceneTitle: scene.sceneTitle,
      sceneText: extractSceneText(pdfText, scene.startMarker, scene.endMarker),
    }));

    return scenes;
  } catch (error: any) {
    logger?.error('Scene Identification', 'Failed to identify scenes', error);
    throw error;
  }
}

function extractSceneText(fullText: string, startMarker: string, endMarker: string): string {
  const startIdx = fullText.indexOf(startMarker);
  const endIdx = fullText.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    return '';
  }

  return fullText.substring(startIdx, endIdx + endMarker.length);
}

/**
 * Fase 2: Analisar emoções em cada cena
 */
export async function analyzeSceneEmotions(
  sceneNumber: number,
  sceneTitle: string,
  sceneText: string,
  characters: string[],
  logger?: Logger
): Promise<SceneEmotionalAnalysis> {
  logger?.info('Scene Emotion Analysis', `Analyzing emotions in scene ${sceneNumber}: ${sceneTitle}`);

  const prompt = `
Analise a seguinte cena literária e extraia TODAS as emoções presentes.

CENA ${sceneNumber}: ${sceneTitle}

Texto da cena:
${sceneText.substring(0, 5000)}${sceneText.length > 5000 ? ' [...]' : ''}

Personagens na cena: ${characters.join(', ')}

INSTRUÇÕES CRÍTICAS:
1. Identifique CADA momento emocional no texto
2. Para cada momento, cite o TRECHO EXATO do texto
3. Analise a emoção de CADA personagem
4. Identifique mudanças de emoção (turning points)
5. Descreva a ATMOSFERA geral da cena
6. Avalie o IMPACTO na narrativa geral

EMOÇÕES POSSÍVEIS: Joy, Sadness, Anger, Fear, Surprise, Disgust, Trust, Anticipation

Retorne JSON com esta estrutura:
{
  "sceneNumber": ${sceneNumber},
  "sceneTitle": "${sceneTitle}",
  "sceneDescription": "Descrição breve do que acontece",
  "primaryEmotion": "Emoção dominante",
  "emotionIntensity": 3,
  "atmosphere": "Descrição da atmosfera",
  "emotionalMarkers": [
    {
      "text": "Trecho exato do texto",
      "emotion": "Emoção identificada",
      "intensity": 4,
      "confidence": 0.95,
      "characterName": "Personagem que sente",
      "context": "Por que essa emoção?"
    }
  ],
  "characterEmotions": {
    "Personagem1": {
      "emotion": "Emoção principal",
      "intensity": 4,
      "emotionalArc": "Como a emoção muda durante a cena"
    }
  },
  "emotionalTurningPoints": [
    {
      "moment": "Descrição do momento",
      "beforeEmotion": "Emoção antes",
      "afterEmotion": "Emoção depois",
      "trigger": "O que causou a mudança"
    }
  ],
  "impactLevel": "HIGH"
}

IMPORTANTE: Seja PRECISO nos trechos citados, não invente emoções que não existem no texto.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise emocional de narrativas literárias. Analise com PRECISÃO.',
      { temperature: 0.3, maxTokens: 4000 },
      logger,
      'Scene Emotion Analysis'
    );

    const result = extractJSON(response, logger, 'Scene Emotion Analysis');

    logger?.info('Scene Emotion Analysis', `Analyzed scene ${sceneNumber}`, {
      primaryEmotion: result.primaryEmotion,
      intensity: result.emotionIntensity,
      markers: result.emotionalMarkers?.length || 0,
    });

    return result as SceneEmotionalAnalysis;
  } catch (error: any) {
    logger?.error('Scene Emotion Analysis', `Failed to analyze scene ${sceneNumber}`, error);
    throw error;
  }
}

/**
 * Fase 3: Analisar jornada emocional de um personagem
 */
export async function analyzeCharacterEmotionalJourney(
  characterName: string,
  characterDescription: string,
  scenes: SceneEmotionalAnalysis[],
  logger?: Logger
): Promise<CharacterEmotionalJourney> {
  logger?.info('Character Journey Analysis', `Analyzing emotional journey of ${characterName}...`);

  const characterScenes = scenes.filter(s =>
    s.characterEmotions && characterName in s.characterEmotions
  );

  const scenesInfo = characterScenes
    .map(s => ({
      sceneNumber: s.sceneNumber,
      sceneTitle: s.sceneTitle,
      emotion: s.characterEmotions?.[characterName]?.emotion,
      intensity: s.characterEmotions?.[characterName]?.intensity,
      arc: s.characterEmotions?.[characterName]?.emotionalArc,
    }))
    .map(s => `Cena ${s.sceneNumber} (${s.sceneTitle}): ${s.emotion} (intensidade ${s.intensity}) - ${s.arc}`)
    .join('\n');

  const prompt = `
Analise a jornada emocional completa do personagem ${characterName}.

DESCRIÇÃO DO PERSONAGEM:
${characterDescription}

EMOÇÕES EM CADA CENA:
${scenesInfo}

Analise:
1. Como o personagem COMEÇA emocionalmente
2. Como evolui ao longo da história
3. Quais são seus PONTOS VULNERÁVEIS emocionais
4. Quais são suas FORÇAS emocionais
5. Quais CONFLITOS emocionais enfrenta
6. Como CRESCE emocionalmente

Retorne JSON com esta estrutura:
{
  "characterName": "${characterName}",
  "phases": [
    {
      "phase": "INTRODUCTION",
      "emotion": "Emoção dominante",
      "intensity": 3,
      "description": "O que acontece nesta fase",
      "scenes": [1, 2, 3],
      "emotionalGrowth": "Como o personagem cresce"
    }
  ],
  "emotionalVulnerabilities": [
    {
      "vulnerability": "Descrição da vulnerabilidade",
      "triggers": ["Gatilho1", "Gatilho2"],
      "consequences": "O que acontece quando acionada"
    }
  ],
  "emotionalStrengths": [
    {
      "strength": "Força emocional",
      "demonstrations": ["Exemplo1", "Exemplo2"],
      "impact": "Como ajuda o personagem"
    }
  ],
  "emotionalConflicts": [
    {
      "conflict": "Descrição do conflito",
      "characters": ["Outro personagem envolvido"],
      "resolution": "Como é resolvido"
    }
  ],
  "overallEmotionalArc": "Descrição geral da jornada emocional",
  "emotionalGrowthPercentage": 75
}
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de desenvolvimento de personagens.',
      { temperature: 0.3, maxTokens: 3000 },
      logger,
      'Character Journey Analysis'
    );

    const result = extractJSON(response, logger, 'Character Journey Analysis');

    logger?.info('Character Journey Analysis', `Analyzed ${characterName}`, {
      phases: result.phases?.length || 0,
      vulnerabilities: result.emotionalVulnerabilities?.length || 0,
      strengths: result.emotionalStrengths?.length || 0,
      growth: result.emotionalGrowthPercentage,
    });

    return result as CharacterEmotionalJourney;
  } catch (error: any) {
    logger?.error('Character Journey Analysis', `Failed to analyze ${characterName}`, error);
    throw error;
  }
}

/**
 * Fase 4: Analisar dinâmica emocional entre dois personagens
 */
export async function analyzeRelationshipEmotionalDynamics(
  character1: string,
  character2: string,
  scenes: SceneEmotionalAnalysis[],
  logger?: Logger
): Promise<RelationshipEmotionalDynamics> {
  logger?.info('Relationship Analysis', `Analyzing relationship between ${character1} and ${character2}...`);

  const sharedScenes = scenes.filter(s =>
    s.characterEmotions &&
    character1 in s.characterEmotions &&
    character2 in s.characterEmotions
  );

  if (sharedScenes.length === 0) {
    logger?.warn('Relationship Analysis', `No shared scenes found between ${character1} and ${character2}`);
    return {
      character1,
      character2,
      relationshipType: 'COMPLEX',
      emotionalIntensity: 0,
      dominantEmotions: [],
      emotionalTurningPoints: [],
      conflictPoints: [],
      emotionalBalance: {
        character1Dominance: 50,
        character2Dominance: 50,
        mutualSupport: 0,
      },
      emotionalTrajectory: 'No interactions found',
    };
  }

  const scenesInfo = sharedScenes
    .map(s => ({
      sceneNumber: s.sceneNumber,
      sceneTitle: s.sceneTitle,
      char1Emotion: s.characterEmotions?.[character1]?.emotion,
      char2Emotion: s.characterEmotions?.[character2]?.emotion,
    }))
    .map(s => `Cena ${s.sceneNumber}: ${character1} sente ${s.char1Emotion}, ${character2} sente ${s.char2Emotion}`)
    .join('\n');

  const prompt = `
Analise a dinâmica emocional entre ${character1} e ${character2}.

CENAS COMPARTILHADAS:
${scenesInfo}

Retorne JSON com esta estrutura:
{
  "character1": "${character1}",
  "character2": "${character2}",
  "relationshipType": "FRIENDSHIP",
  "emotionalIntensity": 4,
  "dominantEmotions": ["Emoção1", "Emoção2"],
  "emotionalTurningPoints": [],
  "conflictPoints": [],
  "emotionalBalance": {
    "character1Dominance": 60,
    "character2Dominance": 40,
    "mutualSupport": 75
  },
  "emotionalTrajectory": "Como a relação evolui emocionalmente"
}
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de relacionamentos em narrativas.',
      { temperature: 0.3, maxTokens: 2500 },
      logger,
      'Relationship Analysis'
    );

    const result = extractJSON(response, logger, 'Relationship Analysis');

    logger?.info('Relationship Analysis', `Analyzed ${character1} x ${character2}`, {
      type: result.relationshipType,
      intensity: result.emotionalIntensity,
    });

    return result as RelationshipEmotionalDynamics;
  } catch (error: any) {
    logger?.error('Relationship Analysis', `Failed to analyze relationship`, error);
    throw error;
  }
}

/**
 * Fase 5: Analisar impacto emocional de eventos principais
 */
export async function analyzeEventEmotionalImpact(
  eventName: string,
  eventDescription: string,
  affectedCharacters: string[],
  logger?: Logger
): Promise<EventEmotionalImpact> {
  logger?.info('Event Impact Analysis', `Analyzing emotional impact of ${eventName}...`);

  const prompt = `
Analise o impacto emocional do evento: ${eventName}

DESCRIÇÃO DO EVENTO: ${eventDescription}
PERSONAGENS AFETADOS: ${affectedCharacters.join(', ')}

Retorne JSON:
{
  "eventName": "${eventName}",
  "eventDescription": "${eventDescription}",
  "primaryEmotion": "Sadness",
  "emotionIntensity": 5,
  "atmosphere": "Atmosfera do evento",
  "affectedCharacters": [],
  "narrativeSignificance": "MAJOR",
  "emotionalConsequences": "Consequências emocionais",
  "readerEmotionalResponse": {
    "expectedEmotion": "Sadness",
    "intensity": 5,
    "reasoning": "Por que o leitor sente isso"
  }
}
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de impacto narrativo.',
      { temperature: 0.3, maxTokens: 2000 },
      logger,
      'Event Impact Analysis'
    );

    const result = extractJSON(response, logger, 'Event Impact Analysis');

    logger?.info('Event Impact Analysis', `Analyzed ${eventName}`, {
      significance: result.narrativeSignificance,
    });

    return result as EventEmotionalImpact;
  } catch (error: any) {
    logger?.error('Event Impact Analysis', `Failed to analyze event`, error);
    throw error;
  }
}

/**
 * Consolidar tudo em uma análise emocional completa
 */
export async function consolidateEmotionalAnalysis(
  universeId: string,
  scenes: SceneEmotionalAnalysis[],
  characterJourneys: CharacterEmotionalJourney[],
  relationships: RelationshipEmotionalDynamics[],
  events: EventEmotionalImpact[],
  logger?: Logger
): Promise<CompleteEmotionalAnalysis> {
  logger?.info('Consolidation', 'Consolidating complete emotional analysis...');

  const emotionalTurningPoints = scenes.reduce(
    (acc, scene) => acc + (scene.emotionalTurningPoints?.length || 0),
    0
  );

  const avgCharacterGrowth =
    characterJourneys.length > 0
      ? characterJourneys.reduce((acc, char) => acc + char.emotionalGrowthPercentage, 0) / characterJourneys.length
      : 0;

  const relationshipChanges = relationships.reduce(
    (acc, rel) => acc + (rel.emotionalTurningPoints?.length || 0),
    0
  );

  const emotionCounts: Record<string, number> = {};
  scenes.forEach(scene => {
    emotionCounts[scene.primaryEmotion] = (emotionCounts[scene.primaryEmotion] || 0) + 1;
  });

  const overallEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Joy';

  const analysis: CompleteEmotionalAnalysis = {
    universeId,
    scenes,
    characterJourneys,
    relationships,
    events,
    overallNarrativeEmotion: {
      primaryEmotion: overallEmotion as any,
      emotionalArc: `A narrativa evolui através de ${emotionalTurningPoints} pontos de virada emocionais`,
      emotionalThemes: [...new Set(scenes.map(s => s.primaryEmotion))],
      readerJourney: 'Jornada emocional completa do leitor através da narrativa',
    },
    statistics: {
      totalScenes: scenes.length,
      emotionalTurningPoints,
      characterGrowth: Math.round(avgCharacterGrowth),
      relationshipChanges,
    },
  };

  logger?.info('Consolidation', 'Emotional analysis consolidated', analysis.statistics);

  return analysis;
}

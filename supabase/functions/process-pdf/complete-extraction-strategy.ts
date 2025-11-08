import { callDeepseek, extractJSON } from './deepseek-utils.ts';
import { Logger } from './logger.ts';
import {
  CompleteCharacter,
  CompleteLocation,
  CompleteObject,
  CompleteEvent,
  CompleteDialogue,
  CompleteTheme,
  CompleteUniverseExtraction,
} from './complete-extraction-types.ts';

/**
 * ESTRATÉGIA: Extração em CAMADAS
 * 1. Extração Bruta (análise profunda)
 * 2. Enriquecimento (contexto, significado)
 * 3. Indexação (para busca rápida)
 * 4. Validação (qualidade)
 */

/**
 * FASE 1: Extração Completa de Personagens
 */
export async function extractCompleteCharacters(
  pdfText: string,
  logger?: Logger
): Promise<CompleteCharacter[]> {
  logger?.info('Complete Character Extraction', 'Extracting ALL character information...');

  const prompt = `
Analise ABSOLUTAMENTE TUDO sobre CADA personagem no livro.

Para CADA personagem, identifique:

1. IDENTIDADE COMPLETA
   - Nome completo, apelidos, aliases

2. APARÊNCIA FÍSICA DETALHADA
   - Idade, gênero, altura, constituição
   - Cores (pele, cabelo, olhos)
   - Características distintivas
   - Roupas típicas, acessórios
   - Condição física

3. PERSONALIDADE PROFUNDA
   - Traços, pontos fortes/fracos
   - Medos, desejos, motivações
   - Valores, crenças
   - Hábitos, maneirismos, padrões de fala
   - Senso de humor, temperamento

4. HABILIDADES COMPLETAS
   - Skills com níveis (NOVICE/INTERMEDIATE/EXPERT/MASTER)
   - Talentos, expertise, treinamento

5. ANTECEDENTES COMPLETOS
   - Local/data de nascimento
   - Família (nomes, relações, descrições)
   - Educação, classe social, profissão
   - Segredos, traumas, realizações

6. TODOS OS RELACIONAMENTOS
   - Com cada personagem
   - Tipo, dinâmica, história, status

7. JORNADA EMOCIONAL
   - Estado inicial/final
   - Transformações-chave
   - Crescimento (0-100)

8. ENVOLVIMENTO NA HISTÓRIA
   - Primeira/última aparição (capítulo, cena)
   - Tempo de tela (%)
   - Papel (PROTAGONIST/ANTAGONIST/SUPPORTING/MINOR/CAMEO)
   - Importância (0-100)
   - Cenas-chave, momentos pivotais

9. CITAÇÕES MEMORÁVEIS (máximo 2-3 frases cada)
   - Diálogos mais importantes
   - Contexto e significado

10. SIMBOLISMO
    - O que representa
    - Arquétipos, temas

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON estruturado:
{
  "characters": [
    {
      "id": "char_1",
      "name": "Nome Completo",
      "aliases": ["Apelido1"],
      "fullName": "Nome Completo",
      "nickname": "Apelido",
      "appearance": {
        "age": "25 anos",
        "ageRange": {"min": 23, "max": 27},
        "gender": "Masculino",
        "height": "1.80m",
        "build": "Atlético",
        "skinColor": "Morena",
        "hairColor": "Preto",
        "eyeColor": "Castanho",
        "distinguishingFeatures": ["Cicatriz no rosto"],
        "clothing": "Roupas escuras",
        "accessories": ["Anel de prata"],
        "physicalCondition": "Excelente"
      },
      "personality": {
        "traits": ["Corajoso", "Impulsivo"],
        "strengths": ["Liderança"],
        "weaknesses": ["Teimosia"],
        "fears": ["Perder amigos"],
        "desires": ["Justiça"],
        "motivations": ["Proteger os fracos"],
        "values": ["Honra"],
        "beliefs": ["O bem vence"],
        "quirks": ["Estrala dedos"],
        "habits": ["Acorda cedo"],
        "mannerisms": ["Cruza braços"],
        "speechPatterns": "Direto e conciso",
        "sense_of_humor": "Sarcástico",
        "temperament": "Intenso"
      },
      "abilities": {
        "skills": [{"skill": "Espada", "level": "EXPERT", "description": "Mestre espadachim"}],
        "talents": ["Estratégia"],
        "expertise": ["Combate"],
        "weaknesses": ["Magia"],
        "training": ["Academia militar"]
      },
      "background": {
        "birthPlace": "Capital",
        "birthDate": "1/1/1200",
        "family": [{"relation": "Pai", "name": "João", "description": "Comerciante"}],
        "upbringing": "Classe média",
        "education": "Escola militar",
        "socialClass": "Média",
        "occupation": "Soldado",
        "pastOccupations": ["Aprendiz"],
        "secrets": ["Origem nobre"],
        "traumas": ["Morte da mãe"],
        "achievements": ["Herói de guerra"]
      },
      "relationships": [
        {
          "characterName": "Maria",
          "relationshipType": "ROMANTIC_LOVE",
          "description": "Amor proibido",
          "dynamics": "Tensa mas profunda",
          "history": "Conheceram-se na juventude",
          "currentStatus": "Complicado"
        }
      ],
      "emotionalJourney": {
        "initialState": "Inocente",
        "keyTransformations": [
          {
            "moment": "Batalha decisiva",
            "before": "Idealista",
            "after": "Realista",
            "trigger": "Perda de aliado"
          }
        ],
        "finalState": "Maduro",
        "growth": 85,
        "arc": "De inocente a líder experiente"
      },
      "storyInvolvement": {
        "firstAppearance": {"chapter": 1, "scene": "Abertura"},
        "lastAppearance": {"chapter": 30, "scene": "Conclusão"},
        "screenTime": 75,
        "roleType": "PROTAGONIST",
        "importanceLevel": 100,
        "keyScenes": [{"sceneNumber": 15, "sceneTitle": "Clímax", "significance": "Turning point"}],
        "pivotalMoments": ["Descoberta da verdade"]
      },
      "quotes": [
        {
          "quote": "A justiça prevalecerá",
          "context": "No momento de decisão",
          "chapter": 10,
          "significance": "Define seu caráter",
          "revealsAbout": ["Valores", "Motivação"]
        }
      ],
      "textReferences": [
        {
          "chapter": 1,
          "page": 5,
          "description": "Primeira descrição física do personagem",
          "type": "PHYSICAL_DESCRIPTION"
        }
      ],
      "symbolism": {
        "represents": "Esperança",
        "archetypes": ["Herói"],
        "themes": ["Justiça", "Sacrifício"]
      },
      "metadata": {
        "firstMentionedChapter": 1,
        "totalMentions": 450,
        "totalDialogueLines": 200,
        "pov_chapters": 10,
        "aliases_used": 2
      }
    }
  ]
}

CRÍTICO:
- NÃO omita NENHUM personagem
- Seja ESPECÍFICO e DETALHADO
- Para citações, use APENAS 1-2 frases mais importantes
- Analise profundamente cada aspecto
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise completa de personagens literários.',
      { temperature: 0.2, maxTokens: 8000 },
      logger,
      'Complete Character Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Character Extraction');
    logger?.info('Complete Character Extraction', `Extracted ${result.characters.length} characters`);

    return result.characters as CompleteCharacter[];
  } catch (error: any) {
    logger?.error('Complete Character Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * FASE 2: Extração Completa de Locais
 */
export async function extractCompleteLocations(
  pdfText: string,
  logger?: Logger
): Promise<CompleteLocation[]> {
  logger?.info('Complete Location Extraction', 'Extracting ALL location information...');

  const prompt = `
Analise ABSOLUTAMENTE TUDO sobre CADA local no livro.

Para CADA local, identifique:

1. IDENTIDADE - Nome, aliases
2. GEOGRAFIA - País, região, clima, terreno, tamanho
3. DESCRIÇÃO FÍSICA - Aparência, arquitetura, marcos, características, atmosfera
4. DETALHES SENSORIAIS - Visões, sons, cheiros, texturas
5. HISTÓRIA - Fundação, eventos históricos, significância cultural
6. SOCIEDADE - População, habitantes, governo, cultura, costumes
7. IMPORTÂNCIA NARRATIVA - Cenas, eventos, simbolismo, importância (0-100)
8. CONEXÕES - Locais relacionados, habitantes, visitantes

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON completo para CADA local encontrado.

IMPORTANTE: Seja detalhado e específico com cada aspecto.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de mundos literários.',
      { temperature: 0.2, maxTokens: 6000 },
      logger,
      'Complete Location Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Location Extraction');
    logger?.info('Complete Location Extraction', `Extracted ${result.locations.length} locations`);

    return result.locations as CompleteLocation[];
  } catch (error: any) {
    logger?.error('Complete Location Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * FASE 3: Extração Completa de Objetos
 */
export async function extractCompleteObjects(
  pdfText: string,
  logger?: Logger
): Promise<CompleteObject[]> {
  logger?.info('Complete Object Extraction', 'Extracting ALL objects...');

  const prompt = `
Extraia TODOS os objetos importantes do livro.

Para CADA objeto:
1. IDENTIDADE - Nome, aliases
2. DESCRIÇÃO FÍSICA - Aparência, tamanho, peso, material, cor, condição
3. PROPRIEDADES - Poderes, habilidades, limitações, fraquezas
4. SIGNIFICÂNCIA - Propósito, simbolismo, importância (0-100)
5. POSSE - Proprietário atual/anterior, desejado por, história
6. ENVOLVIMENTO - Primeira aparição, cenas-chave, impacto

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON completo.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de artefatos literários.',
      { temperature: 0.2, maxTokens: 4000 },
      logger,
      'Complete Object Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Object Extraction');
    logger?.info('Complete Object Extraction', `Extracted ${result.objects.length} objects`);

    return result.objects as CompleteObject[];
  } catch (error: any) {
    logger?.error('Complete Object Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * FASE 4: Extração Completa de Eventos
 */
export async function extractCompleteEvents(
  pdfText: string,
  logger?: Logger
): Promise<CompleteEvent[]> {
  logger?.info('Complete Event Extraction', 'Extracting ALL events...');

  const prompt = `
Extraia TODOS os eventos importantes.

Para CADA evento:
1. IDENTIDADE - Nome, descrição, descrição detalhada
2. TIMING - Capítulo, cena, tempo, duração, data
3. ENVOLVIDOS - Personagens principais/secundários, testemunhas, afetados
4. LOCALIZAÇÃO - Local principal, secundários
5. CONTEXTO - Eventos anteriores, causas, gatilhos
6. CONSEQUÊNCIAS - Imediatas, curto/longo prazo, permanentes
7. IMPACTO - Tipo (MINOR/MAJOR/TURNING_POINT/CLIMACTIC), importância (0-100), impacto emocional (0-100)
8. DIÁLOGOS-CHAVE - Citações breves (1-2 frases)

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON completo.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de eventos narrativos.',
      { temperature: 0.2, maxTokens: 7000 },
      logger,
      'Complete Event Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Event Extraction');
    logger?.info('Complete Event Extraction', `Extracted ${result.events.length} events`);

    return result.events as CompleteEvent[];
  } catch (error: any) {
    logger?.error('Complete Event Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * FASE 5: Extração Completa de Diálogos
 */
export async function extractCompleteDialogues(
  pdfText: string,
  characters: string[],
  logger?: Logger
): Promise<CompleteDialogue[]> {
  logger?.info('Complete Dialogue Extraction', 'Extracting important dialogues...');

  const prompt = `
Extraia os diálogos mais importantes do livro.

Personagens: ${characters.join(', ')}

Para CADA diálogo importante:
1. DIÁLOGO - Quem fala, para quem, resumo (citação breve se crítico)
2. CONTEXTO - Capítulo, cena, local, tempo
3. ANÁLISE - Tom, emoção, significância, o que revela, antecipa
4. FUNÇÃO NARRATIVA - O que faz na história

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON. Use citações diretas APENAS para diálogos críticos (1-2 frases).
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise de diálogos.',
      { temperature: 0.2, maxTokens: 6000 },
      logger,
      'Complete Dialogue Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Dialogue Extraction');
    logger?.info('Complete Dialogue Extraction', `Extracted ${result.dialogues.length} dialogues`);

    return result.dialogues as CompleteDialogue[];
  } catch (error: any) {
    logger?.error('Complete Dialogue Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * FASE 6: Extração Completa de Temas
 */
export async function extractCompleteThemes(
  pdfText: string,
  logger?: Logger
): Promise<CompleteTheme[]> {
  logger?.info('Complete Theme Extraction', 'Extracting ALL themes...');

  const prompt = `
Extraia TODOS os temas do livro.

Para CADA tema:
1. TEMA - Nome, descrição
2. MANIFESTAÇÕES - Cenas, personagens, eventos, objetos (como)
3. DESENVOLVIMENTO - Introdução, exploração, clímax, resolução
4. SIGNIFICÂNCIA - Significado, importância (0-100), relevância universal

Texto:
${pdfText.substring(0, 50000)}${pdfText.length > 50000 ? '\n[... continua ...]' : ''}

Retorne JSON completo.
`;

  try {
    const response = await callDeepseek(
      prompt,
      'Você é um especialista em análise temática.',
      { temperature: 0.2, maxTokens: 5000 },
      logger,
      'Complete Theme Extraction'
    );

    const result = extractJSON(response, logger, 'Complete Theme Extraction');
    logger?.info('Complete Theme Extraction', `Extracted ${result.themes.length} themes`);

    return result.themes as CompleteTheme[];
  } catch (error: any) {
    logger?.error('Complete Theme Extraction', 'Failed', error);
    throw error;
  }
}

/**
 * CONSOLIDAÇÃO FINAL
 */
export async function consolidateCompleteExtraction(
  universeId: string,
  characters: CompleteCharacter[],
  locations: CompleteLocation[],
  objects: CompleteObject[],
  events: CompleteEvent[],
  dialogues: CompleteDialogue[],
  themes: CompleteTheme[],
  pdfText: string,
  logger?: Logger
): Promise<CompleteUniverseExtraction> {
  logger?.info('Consolidation', 'Consolidating complete extraction...');

  const extraction: CompleteUniverseExtraction = {
    universeId,
    characters,
    locations,
    objects,
    events,
    dialogues,
    themes,
    statistics: {
      totalCharacters: characters.length,
      totalLocations: locations.length,
      totalObjects: objects.length,
      totalEvents: events.length,
      totalDialogues: dialogues.length,
      totalThemes: themes.length,
      totalChapters: Math.max(...events.map(e => e.timing.chapter), 0),
      totalPages: 0,
      totalWords: pdfText.split(/\s+/).length,
      totalCharacterCount: pdfText.length,
    },
    metadata: {
      extractionDate: new Date().toISOString(),
      extractionDuration: 0,
      deepseekCallsUsed: 6,
      tokensUsed: 0,
      completenessScore: 95,
    },
  };

  logger?.info('Consolidation', 'Complete extraction consolidated', extraction.statistics);

  return extraction;
}

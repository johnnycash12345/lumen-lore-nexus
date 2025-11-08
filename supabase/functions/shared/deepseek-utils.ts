const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

interface DeepseekOptions {
  temperature?: number;
  maxTokens?: number;
  retries?: number;
}

/**
 * Chama Deepseek API com retry logic
 */
export async function callDeepseek(
  prompt: string,
  systemPrompt: string = 'Você é um assistente especializado em análise literária.',
  options: DeepseekOptions = {}
): Promise<string> {
  const {
    temperature = 0.3,
    maxTokens = 4000,
    retries = 3,
  } = options;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Deepseek API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${retries} failed:`, error.message);

      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to call Deepseek after retries');
}

/**
 * Extrai JSON da resposta do Deepseek
 */
export function extractJSON(text: string): any {
  try {
    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Invalid JSON response from Deepseek');
  }
}

/**
 * Analisa relacionamentos usando Deepseek
 */
export async function analyzeRelationships(
  characters: any[],
  locations: any[],
  events: any[],
  universeDescription: string
): Promise<any[]> {
  const prompt = `Analise os personagens, locais e eventos abaixo e identifique relacionamentos importantes.

Personagens:
${JSON.stringify(characters, null, 2)}

Locais:
${JSON.stringify(locations, null, 2)}

Eventos:
${JSON.stringify(events, null, 2)}

Contexto do universo:
${universeDescription}

Retorne APENAS um objeto JSON válido com esta estrutura (sem markdown):
{
  "relationships": [
    {
      "from_entity_type": "CHARACTER",
      "from_entity_id": "id_do_personagem",
      "from_entity_name": "Nome do Personagem",
      "to_entity_type": "CHARACTER",
      "to_entity_id": "id_do_outro_personagem",
      "to_entity_name": "Nome do Outro Personagem",
      "relationship_type": "FRIEND",
      "description": "Descrição breve do relacionamento",
      "strength": 0.95
    }
  ]
}

Tipos de relacionamento válidos:
- FRIEND (amigos)
- ENEMY (inimigos)
- FAMILY (família)
- ROMANTIC (romântico)
- MENTOR (mentor/aprendiz)
- RIVAL (rivais)
- ALLY (aliados)
- OWNER (dono/propriedade)
- LOCATED_AT (está localizado em)
- OCCURS_AT (ocorre em)
- PARTICIPATES_IN (participa de)

Regras:
1. Foque nos relacionamentos mais importantes e óbvios
2. Strength entre 0 e 1 (1 = relacionamento muito forte)
3. Inclua relacionamentos entre personagens, personagens e locais, personagens e eventos
4. Limite a 20-30 relacionamentos mais relevantes`;

  const response = await callDeepseek(
    prompt,
    'Você é um especialista em análise de relacionamentos em narrativas. Retorne apenas JSON válido, sem markdown.',
    {
      temperature: 0.3,
      maxTokens: 4000,
    }
  );

  const parsed = extractJSON(response);
  return parsed.relationships || [];
}

/**
 * Analisa conflitos entre personagens usando Deepseek
 */
export async function analyzeConflicts(
  characters: any[],
  events: any[]
): Promise<any> {
  const prompt = `Analise os personagens e eventos para identificar conflitos, tensões e rivalidades.

Personagens:
${JSON.stringify(characters, null, 2)}

Eventos:
${JSON.stringify(events, null, 2)}

Retorne APENAS um objeto JSON válido (sem markdown):
{
  "conflicts": [
    {
      "character1": "Nome do Personagem 1",
      "character2": "Nome do Personagem 2",
      "conflictType": "IDEOLOGICAL",
      "intensity": 0.9,
      "resolution": "Descrição da resolução ou 'Não resolvido'",
      "keyEvents": ["Evento 1", "Evento 2"],
      "analysis": "Análise do conflito"
    }
  ]
}

Tipos de conflito: PERSONAL, IDEOLOGICAL, POWER, ROMANTIC, FAMILY
Intensity: 0-1 (0 = leve, 1 = extremo)`;

  const response = await callDeepseek(
    prompt,
    'Você é um especialista em análise de conflitos narrativos. Retorne apenas JSON válido, sem markdown.',
    {
      temperature: 0.3,
      maxTokens: 3000,
    }
  );

  return extractJSON(response);
}

/**
 * Gera resumo de entidade usando Deepseek
 */
export async function generateSummary(
  entityType: string,
  entityName: string,
  entity: any
): Promise<any> {
  const prompt = `Gere um resumo conciso e envolvente para o seguinte:

Tipo: ${entityType}
Nome: ${entityName}
Dados: ${JSON.stringify(entity, null, 2)}

Retorne APENAS um objeto JSON válido (sem markdown):
{
  "shortSummary": "1-2 frases (para cards)",
  "mediumSummary": "3-5 frases (para páginas)",
  "longSummary": "1 parágrafo detalhado",
  "keyPoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "interestingFact": "Um fato interessante"
}`;

  const response = await callDeepseek(
    prompt,
    'Você é um especialista em síntese de informações literárias. Retorne apenas JSON válido, sem markdown.',
    {
      temperature: 0.4,
      maxTokens: 1500,
    }
  );

  return extractJSON(response);
}

/**
 * Valida qualidade das entidades extraídas
 */
export async function validateQuality(
  characters: any[],
  locations: any[],
  events: any[],
  objects: any[]
): Promise<any> {
  const prompt = `Valide a qualidade das entidades extraídas e sugira melhorias.

Personagens: ${characters.length}
Locais: ${locations.length}
Eventos: ${events.length}
Objetos: ${objects.length}

Amostra de dados:
- Personagens: ${JSON.stringify(characters.slice(0, 3), null, 2)}
- Locais: ${JSON.stringify(locations.slice(0, 3), null, 2)}
- Eventos: ${JSON.stringify(events.slice(0, 3), null, 2)}

Retorne APENAS um objeto JSON válido (sem markdown):
{
  "overallQuality": 0.85,
  "completeness": {
    "characters": 0.9,
    "locations": 0.8,
    "events": 0.7,
    "objects": 0.6
  },
  "issues": [
    {
      "entity": "Identificação da entidade",
      "issue": "Descrição do problema",
      "severity": "LOW",
      "suggestion": "Como melhorar"
    }
  ],
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "recommendations": ["Recomendação 1", "Recomendação 2"]
}

Severidade: LOW, MEDIUM, HIGH`;

  const response = await callDeepseek(
    prompt,
    'Você é um especialista em validação de dados de narrativas. Retorne apenas JSON válido, sem markdown.',
    {
      temperature: 0.2,
      maxTokens: 2000,
    }
  );

  return extractJSON(response);
}

import { ProcessingConfig } from './types.ts';

export const DEFAULT_CONFIG: ProcessingConfig = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  chunkSize: 2000, // characters
  overlapSize: 200, // characters
  deepseekModel: 'deepseek-chat',
  deepseekTemperature: 0.3,
  deepseekMaxTokens: 4000,
  timeoutMs: 30000, // 30 seconds
};

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

export const DEEPSEEK_EXTRACTION_PROMPT = `
Analise o seguinte texto de um universo literário e extraia as entidades em formato JSON.

IMPORTANTE:
1. Retorne APENAS um objeto JSON válido
2. Sem markdown, sem explicações
3. Se um campo não existir, use array vazio ou null
4. Nomes de personagens devem ser únicos
5. Descrições devem ser detalhadas

Retorne JSON com esta estrutura exata:
{
  "characters": [
    {
      "name": "Nome completo",
      "aliases": ["apelido1", "apelido2"],
      "description": "Descrição detalhada (2-3 frases)",
      "role": "Protagonista/Antagonista/Secundário/Menor",
      "abilities": ["habilidade1", "habilidade2"],
      "personality": "Descrição breve",
      "occupation": "Ocupação"
    }
  ],
  "locations": [
    {
      "name": "Nome do local",
      "type": "Tipo (cidade, castelo, floresta, etc)",
      "description": "Descrição",
      "country": "País (opcional)",
      "significance": "Por que é importante"
    }
  ],
  "events": [
    {
      "name": "Nome do evento",
      "description": "Descrição",
      "date": "Data ou período",
      "significance": "Importância",
      "involvedCharacters": ["Personagem1", "Personagem2"]
    }
  ],
  "objects": [
    {
      "name": "Nome do objeto",
      "type": "Tipo (artefato mágico, arma, livro, etc)",
      "description": "Descrição",
      "owner": "Proprietário (opcional)",
      "powers": "Poderes ou habilidades especiais"
    }
  ]
}
`;

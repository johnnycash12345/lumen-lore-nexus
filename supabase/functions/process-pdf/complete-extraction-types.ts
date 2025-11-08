/**
 * TIPOS COMPLETOS PARA EXTRAÇÃO TOTAL
 * Versão otimizada com referências ao invés de texto literal extenso
 */

// ===== PERSONAGENS COMPLETOS =====
export interface CompleteCharacter {
  // Identidade
  id: string;
  name: string;
  aliases: string[];
  fullName: string;
  nickname: string;
  
  // Aparência Física
  appearance: {
    age: string;
    ageRange: { min: number; max: number };
    gender: string;
    height: string;
    build: string;
    skinColor: string;
    hairColor: string;
    eyeColor: string;
    distinguishingFeatures: string[];
    clothing: string;
    accessories: string[];
    physicalCondition: string;
  };

  // Personalidade e Psicologia
  personality: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    fears: string[];
    desires: string[];
    motivations: string[];
    values: string[];
    beliefs: string[];
    quirks: string[];
    habits: string[];
    mannerisms: string[];
    speechPatterns: string;
    sense_of_humor: string;
    temperament: string;
  };

  // Habilidades e Competências
  abilities: {
    skills: Array<{ skill: string; level: 'NOVICE' | 'INTERMEDIATE' | 'EXPERT' | 'MASTER'; description: string }>;
    talents: string[];
    expertise: string[];
    weaknesses: string[];
    training: string[];
  };

  // Antecedentes
  background: {
    birthPlace: string;
    birthDate: string;
    family: Array<{ relation: string; name: string; description: string }>;
    upbringing: string;
    education: string;
    socialClass: string;
    occupation: string;
    pastOccupations: string[];
    secrets: string[];
    traumas: string[];
    achievements: string[];
  };

  // Relacionamentos
  relationships: Array<{
    characterName: string;
    relationshipType: string;
    description: string;
    dynamics: string;
    history: string;
    currentStatus: string;
  }>;

  // Jornada Emocional
  emotionalJourney: {
    initialState: string;
    keyTransformations: Array<{
      moment: string;
      before: string;
      after: string;
      trigger: string;
    }>;
    finalState: string;
    growth: number; // 0-100
    arc: string;
  };

  // Envolvimento na História
  storyInvolvement: {
    firstAppearance: { chapter: number; scene: string };
    lastAppearance: { chapter: number; scene: string };
    screenTime: number; // Percentual de aparições
    roleType: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR' | 'CAMEO';
    importanceLevel: number; // 0-100
    keyScenes: Array<{ sceneNumber: number; sceneTitle: string; significance: string }>;
    pivotalMoments: string[];
  };

  // Citações e Diálogos (breves, para análise)
  quotes: Array<{
    quote: string; // Máximo 2-3 frases
    context: string;
    chapter: number;
    significance: string;
    revealsAbout: string[];
  }>;

  // Referências a Descrições no Texto (ao invés de texto literal)
  textReferences: Array<{
    chapter: number;
    page?: number;
    description: string; // Paráfrase/análise, não texto literal
    type: 'PHYSICAL_DESCRIPTION' | 'DIALOGUE' | 'ACTION' | 'THOUGHT';
  }>;

  // Símbolos e Significado
  symbolism: {
    represents: string;
    archetypes: string[];
    themes: string[];
  };

  // Metadata
  metadata: {
    firstMentionedChapter: number;
    totalMentions: number;
    totalDialogueLines: number;
    pov_chapters: number;
    aliases_used: number;
  };
}

// ===== LOCAIS COMPLETOS =====
export interface CompleteLocation {
  id: string;
  name: string;
  aliases: string[];
  
  // Geográfico
  geography: {
    country: string;
    region: string;
    coordinates: { latitude: string; longitude: string };
    climate: string;
    terrain: string;
    size: string;
    borders: string[];
  };

  // Descrição Física (análise, não literal)
  description: {
    appearance: string;
    architecture: string;
    landmarks: string[];
    naturalFeatures: string[];
    manMadeStructures: string[];
    atmosphere: string;
    sensoryDetails: {
      sights: string[];
      sounds: string[];
      smells: string[];
      textures: string[];
      tastes: string[];
    };
  };

  // História e Contexto
  history: {
    founded: string;
    historicalEvents: string[];
    culturalSignificance: string;
    legends: string[];
    mythology: string[];
  };

  // Habitantes e Sociedade
  society: {
    population: string;
    inhabitants: string[];
    government: string;
    culture: string;
    language: string;
    customs: string[];
    traditions: string[];
  };

  // Importância Narrativa
  narrativeImportance: {
    scenes: Array<{ sceneNumber: number; sceneTitle: string; significance: string }>;
    events: string[];
    symbolism: string;
    themes: string[];
    importance: number; // 0-100
  };

  // Conexões
  connections: {
    relatedLocations: Array<{ location: string; relationship: string }>;
    inhabitants: string[];
    visitedBy: string[];
  };

  // Referências ao Texto
  textReferences: Array<{
    chapter: number;
    page?: number;
    descriptionType: string;
    summary: string;
  }>;

  // Metadata
  metadata: {
    firstMentionedChapter: number;
    totalMentions: number;
    scenes_located_here: number;
  };
}

// ===== OBJETOS COMPLETOS =====
export interface CompleteObject {
  id: string;
  name: string;
  aliases: string[];
  
  // Descrição Física
  description: {
    appearance: string;
    size: string;
    weight: string;
    material: string;
    color: string;
    condition: string;
    age: string;
    origin: string;
  };

  // Propriedades e Poderes
  properties: {
    powers: string[];
    abilities: string[];
    limitations: string[];
    weaknesses: string[];
    enchantments: string[];
    curses: string[];
  };

  // Importância Narrativa
  significance: {
    purpose: string;
    symbolism: string;
    themes: string[];
    importance: number; // 0-100
  };

  // Posse e Relacionamentos
  ownership: {
    currentOwner: string;
    previousOwners: string[];
    desiredBy: string[];
    history: string;
  };

  // Envolvimento na História
  storyInvolvement: {
    firstAppearance: { chapter: number; scene: string };
    keyScenes: Array<{ sceneNumber: number; significance: string }>;
    impact: string;
  };

  // Metadata
  metadata: {
    firstMentionedChapter: number;
    totalMentions: number;
  };
}

// ===== EVENTOS COMPLETOS =====
export interface CompleteEvent {
  id: string;
  name: string;
  
  // Descrição
  description: string;
  detailedDescription: string;
  
  // Timing
  timing: {
    chapter: number;
    sceneNumber: number;
    timeInStory: string;
    duration: string;
    date: string;
  };

  // Envolvidos
  participants: {
    mainCharacters: string[];
    supportingCharacters: string[];
    witnesses: string[];
    affected: string[];
  };

  // Localização
  location: {
    primary: string;
    secondary: string[];
  };

  // Contexto e Causas
  context: {
    precedingEvents: string[];
    causes: string[];
    triggers: string[];
    background: string;
  };

  // Consequências
  consequences: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    permanent: string[];
    rippleEffects: string[];
  };

  // Impacto Narrativo
  narrativeImpact: {
    type: 'MINOR' | 'MAJOR' | 'TURNING_POINT' | 'CLIMACTIC';
    importance: number; // 0-100
    emotionalImpact: number; // 0-100
    themes: string[];
    symbolism: string;
  };

  // Diálogos-Chave (breves citações)
  keyDialogues: Array<{
    speaker: string;
    dialogue: string; // Breve citação ou paráfrase
    significance: string;
  }>;

  // Referências ao Texto
  textReferences: Array<{
    chapter: number;
    page?: number;
    eventPhase: string;
  }>;

  // Metadata
  metadata: {
    chapter: number;
    pageNumbers: number[];
    wordCount: number;
  };
}

// ===== DIÁLOGOS COMPLETOS =====
export interface CompleteDialogue {
  id: string;
  speaker: string;
  listener: string;
  dialogueSummary: string; // Paráfrase/resumo
  keyQuote?: string; // Citação breve se relevante
  
  // Contexto
  context: {
    chapter: number;
    scene: string;
    location: string;
    timeInStory: string;
  };

  // Análise
  analysis: {
    tone: string;
    emotion: string;
    significance: string;
    revealsAbout: string[];
    foreshadows: string[];
    themes: string[];
  };

  // Relacionamento com Trama
  narrativeFunction: string;
}

// ===== TEMAS COMPLETOS =====
export interface CompleteTheme {
  id: string;
  theme: string;
  
  // Descrição
  description: string;
  
  // Manifestações
  manifestations: {
    scenes: Array<{ sceneNumber: number; how: string }>;
    characters: Array<{ character: string; how: string }>;
    events: Array<{ event: string; how: string }>;
    objects: Array<{ object: string; how: string }>;
  };

  // Desenvolvimento
  development: {
    introduction: string;
    exploration: string;
    climax: string;
    resolution: string;
  };

  // Significado
  significance: {
    meaning: string;
    importance: number; // 0-100
    universalRelevance: string;
  };

  // Referências a Citações
  relatedQuoteReferences: Array<{
    chapter: number;
    speaker?: string;
    context: string;
  }>;
}

// ===== ESTRUTURA COMPLETA =====
export interface CompleteUniverseExtraction {
  universeId: string;
  
  // Tudo Extraído
  characters: CompleteCharacter[];
  locations: CompleteLocation[];
  objects: CompleteObject[];
  events: CompleteEvent[];
  dialogues: CompleteDialogue[];
  themes: CompleteTheme[];

  // Estatísticas Completas
  statistics: {
    totalCharacters: number;
    totalLocations: number;
    totalObjects: number;
    totalEvents: number;
    totalDialogues: number;
    totalThemes: number;
    totalChapters: number;
    totalPages: number;
    totalWords: number;
    totalCharacterCount: number;
  };

  // Metadata
  metadata: {
    extractionDate: string;
    extractionDuration: number;
    deepseekCallsUsed: number;
    tokensUsed: number;
    completenessScore: number; // 0-100
  };
}

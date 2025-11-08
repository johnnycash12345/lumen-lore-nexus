/**
 * Tipos para o sistema de processamento de PDF
 */

export interface ProcessingConfig {
  maxRetries: number;
  retryDelay: number;
  chunkSize: number;
  overlapSize: number;
  deepseekModel: string;
  deepseekTemperature: number;
  deepseekMaxTokens: number;
  timeoutMs: number;
}

export interface ProcessingJob {
  universeId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ExtractedEntities {
  characters: Character[];
  locations: Location[];
  events: Event[];
  objects: LumenObject[];
}

export interface Character {
  name: string;
  aliases: string[];
  description: string;
  role: string;
  abilities: string[];
  personality: string;
  occupation: string;
  emotionalVulnerabilities?: string[];
  emotionalStrengths?: string[];
}

export interface Location {
  name: string;
  aliases?: string[];
  type: string;
  description: string;
  country?: string;
  significance: string;
}

export interface Event {
  name: string;
  description: string;
  date: string;
  significance: string;
  involvedCharacters?: string[];
  primaryEmotion?: string;
  emotionIntensity?: number;
  atmosphere?: string;
}

export interface LumenObject {
  name: string;
  aliases?: string[];
  type: string;
  description: string;
  owner?: string;
  powers: string[];
}

export interface ProcessingResult {
  success: boolean;
  universeId: string;
  stats: {
    characters: number;
    locations: number;
    events: number;
    objects: number;
    pagesCreated: number;
    relationshipsCreated: number;
    consolidationsPerformed: number;
  };
  duration: number;
  warnings: string[];
}

export interface ProcessingError {
  code: string;
  message: string;
  phase: string;
  details?: any;
  recoverable: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  languageName: string;
  confidence: number;
  isTranslated: boolean;
}

export interface ConsolidationResult {
  consolidated: any[];
  merges: Array<{
    originalNames: string[];
    mergedInto: string;
    confidence: number;
  }>;
  statistics: {
    originalCount: number;
    consolidatedCount: number;
    duplicatesRemoved: number;
  };
}

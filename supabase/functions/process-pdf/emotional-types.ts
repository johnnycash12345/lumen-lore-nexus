/**
 * Tipos para análise emocional avançada
 */

export type PrimaryEmotion = 
  | 'Joy' 
  | 'Sadness' 
  | 'Anger' 
  | 'Fear' 
  | 'Surprise' 
  | 'Disgust' 
  | 'Trust' 
  | 'Anticipation';

export type EmotionalIntensity = 0 | 1 | 2 | 3 | 4 | 5;

export interface EmotionalMarker {
  text: string;
  emotion: PrimaryEmotion;
  intensity: EmotionalIntensity;
  confidence: number;
  characterName?: string;
  context: string;
  lineNumber?: number;
}

export interface SceneEmotionalAnalysis {
  sceneNumber: number;
  sceneTitle: string;
  sceneDescription: string;
  primaryEmotion: PrimaryEmotion;
  emotionIntensity: EmotionalIntensity;
  atmosphere: string;
  emotionalMarkers: EmotionalMarker[];
  characterEmotions?: Record<string, {
    emotion: PrimaryEmotion;
    intensity: EmotionalIntensity;
    emotionalArc: string;
  }>;
  emotionalTurningPoints?: Array<{
    moment: string;
    beforeEmotion: PrimaryEmotion;
    afterEmotion: PrimaryEmotion;
    trigger: string;
  }>;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CharacterEmotionalJourney {
  characterName: string;
  phases: Array<{
    phase: 'INTRODUCTION' | 'RISING_ACTION' | 'CLIMAX' | 'FALLING_ACTION' | 'RESOLUTION';
    emotion: PrimaryEmotion;
    intensity: EmotionalIntensity;
    description: string;
    scenes: number[];
    emotionalGrowth: string;
  }>;
  emotionalVulnerabilities: Array<{
    vulnerability: string;
    triggers: string[];
    consequences: string;
  }>;
  emotionalStrengths: Array<{
    strength: string;
    demonstrations: string[];
    impact: string;
  }>;
  emotionalConflicts: Array<{
    conflict: string;
    characters: string[];
    resolution: string;
  }>;
  overallEmotionalArc: string;
  emotionalGrowthPercentage: number;
}

export interface RelationshipEmotionalDynamics {
  character1: string;
  character2: string;
  relationshipType: 'LOVE' | 'FRIENDSHIP' | 'RIVALRY' | 'FAMILY' | 'ANTAGONISM' | 'COMPLEX';
  emotionalIntensity: EmotionalIntensity;
  dominantEmotions: PrimaryEmotion[];
  emotionalTurningPoints: Array<{
    moment: string;
    beforeDynamics: string;
    afterDynamics: string;
    emotionalShift: string;
  }>;
  conflictPoints: Array<{
    conflict: string;
    emotionalImpact: PrimaryEmotion;
    resolution: string;
  }>;
  emotionalBalance: {
    character1Dominance: number;
    character2Dominance: number;
    mutualSupport: number;
  };
  emotionalTrajectory: string;
}

export interface EventEmotionalImpact {
  eventName: string;
  eventDescription: string;
  primaryEmotion: PrimaryEmotion;
  emotionIntensity: EmotionalIntensity;
  atmosphere: string;
  affectedCharacters: Array<{
    name: string;
    emotion: PrimaryEmotion;
    intensity: EmotionalIntensity;
    reaction: string;
    longTermImpact: string;
  }>;
  narrativeSignificance: 'MINOR' | 'MAJOR' | 'TURNING_POINT' | 'CLIMACTIC';
  emotionalConsequences: string;
  readerEmotionalResponse: {
    expectedEmotion: PrimaryEmotion;
    intensity: EmotionalIntensity;
    reasoning: string;
  };
}

export interface CompleteEmotionalAnalysis {
  universeId: string;
  scenes: SceneEmotionalAnalysis[];
  characterJourneys: CharacterEmotionalJourney[];
  relationships: RelationshipEmotionalDynamics[];
  events: EventEmotionalImpact[];
  overallNarrativeEmotion: {
    primaryEmotion: PrimaryEmotion;
    emotionalArc: string;
    emotionalThemes: string[];
    readerJourney: string;
  };
  statistics: {
    totalScenes: number;
    emotionalTurningPoints: number;
    characterGrowth: number;
    relationshipChanges: number;
  };
}

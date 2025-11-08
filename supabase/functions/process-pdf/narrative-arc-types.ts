/**
 * Tipos para análise de arcos narrativos
 */

export type NarrativePhase =
  | 'EXPOSITION'
  | 'RISING_ACTION'
  | 'CLIMAX'
  | 'FALLING_ACTION'
  | 'RESOLUTION'
  | 'EPILOGUE';

export type ArcType = 'MAIN' | 'SECONDARY' | 'CHARACTER' | 'SUBPLOT' | 'THEMATIC';

export interface NarrativeEvent {
  eventNumber: number;
  eventName: string;
  eventDescription: string;
  phase: NarrativePhase;
  importance: 'MINOR' | 'MAJOR' | 'TURNING_POINT' | 'CLIMACTIC';
  affectedCharacters: string[];
  affectedLocations: string[];
  causedBy?: string;
  causes?: string[];
  emotionalImpact: number;
  narrativeImpact: number;
  timelinePosition: number;
  sceneNumber?: number;
  quotes?: string[];
  consequences: string;
}

export interface NarrativeArc {
  arcId: string;
  arcName: string;
  arcType: ArcType;
  mainCharacters: string[];
  description: string;
  theme: string;
  startEvent?: NarrativeEvent;
  endEvent?: NarrativeEvent;
  events?: NarrativeEvent[];
  phases?: Array<{
    phase: NarrativePhase;
    description: string;
    events: NarrativeEvent[];
    emotionalTone: string;
    pacing: 'SLOW' | 'MODERATE' | 'FAST';
  }>;
  climax?: {
    event: NarrativeEvent;
    buildup: string;
    consequence: string;
    emotionalPeak: number;
  };
  resolution: {
    type: 'HAPPY' | 'SAD' | 'BITTERSWEET' | 'AMBIGUOUS' | 'OPEN_ENDING';
    description: string;
    satisfactionLevel: number;
  };
  turnPoints?: Array<{
    event: NarrativeEvent;
    beforeState: string;
    afterState: string;
    impact: string;
  }>;
  subplots?: string[];
  themes: string[];
  symbolism?: Array<{
    symbol: string;
    meaning: string;
    appearances: number;
  }>;
  pacing?: {
    averageEventDensity: number;
    fastestPhase: NarrativePhase;
    slowestPhase: NarrativePhase;
    overallPacing: 'SLOW' | 'MODERATE' | 'FAST';
  };
  tension?: {
    startTension: number;
    peakTension: number;
    endTension: number;
    tensionCurve: string;
  };
  satisfaction?: {
    setupPayoff: number;
    characterDevelopment: number;
    thematicResonance: number;
    overallSatisfaction: number;
  };
}

export interface CompleteNarrativeStructure {
  universeId: string;
  mainArc: NarrativeArc;
  secondaryArcs: NarrativeArc[];
  characterArcs: NarrativeArc[];
  subplots: NarrativeArc[];
  thematicArcs: NarrativeArc[];
  allEvents: NarrativeEvent[];
  timeline: {
    totalDuration: string;
    startDate: string;
    endDate: string;
    eventDensity: number;
  };
  pacing: {
    overallPacing: 'SLOW' | 'MODERATE' | 'FAST';
    fastestSection: string;
    slowestSection: string;
    pacingVariation: number;
  };
  tension: {
    overallTensionCurve: string;
    peakTension: number;
    averageTension: number;
  };
  themes: Array<{
    theme: string;
    arcsExploring: string[];
    resolution: string;
    significance: 'MINOR' | 'MAJOR' | 'CENTRAL';
  }>;
  structure: {
    type: string;
    description: string;
  };
  statistics: {
    totalArcs: number;
    totalEvents: number;
    averageArcLength: number;
    longestArc: string;
    shortestArc: string;
    turningPoints: number;
    climacticMoments: number;
  };
}

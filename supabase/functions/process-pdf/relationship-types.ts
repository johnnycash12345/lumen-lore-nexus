/**
 * Tipos para análise avançada de relacionamentos
 */

export type RelationshipType =
  | 'ROMANTIC_LOVE'
  | 'FAMILIAL_LOVE'
  | 'DEEP_FRIENDSHIP'
  | 'CASUAL_FRIENDSHIP'
  | 'MENTORSHIP'
  | 'RIVALRY'
  | 'ANTAGONISM'
  | 'ALLIANCE'
  | 'BETRAYAL'
  | 'COMPLEX'
  | 'UNREQUITED_LOVE'
  | 'FORBIDDEN_LOVE';

export type RelationshipStatus = 'FORMING' | 'ESTABLISHED' | 'STRAINED' | 'BROKEN' | 'RECONCILED' | 'EVOLVING';

export interface RelationshipInteraction {
  sceneNumber: number;
  sceneTitle: string;
  interaction: string;
  emotionalTone: string;
  significance: 'MINOR' | 'MAJOR' | 'TURNING_POINT';
  beforeStatus: RelationshipStatus;
  afterStatus: RelationshipStatus;
  quotes?: string[];
}

export interface RelationshipConflict {
  conflictType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  trigger: string;
  manifestation: string;
  resolution: string;
  resolutionType: 'RESOLVED' | 'ONGOING' | 'SUPPRESSED' | 'ESCALATED';
  emotionalImpact: string;
}

export interface RelationshipDynamics {
  character1: string;
  character2: string;
  relationshipType: RelationshipType;
  currentStatus: RelationshipStatus;
  strength: number;
  intimacy: number;
  trust: number;
  compatibility: number;
  dominance: {
    character1: number;
    character2: number;
  };
  interactions: RelationshipInteraction[];
  conflicts: RelationshipConflict[];
  supportDynamics: {
    character1SupportsCharacter2: boolean;
    character2SupportsCharacter1: boolean;
    mutualSupport: boolean;
  };
  sharedGoals: string[];
  conflictingGoals: string[];
  emotionalDependency: {
    character1DependsOn: number;
    character2DependsOn: number;
  };
  trajectory: string;
  keyMoments: Array<{
    moment: string;
    impact: string;
    turning_point: boolean;
  }>;
  futureOutlook: string;
}

export interface RelationshipNetwork {
  universeId: string;
  relationships: RelationshipDynamics[];
  characterRelationshipMap: Record<string, string[]>;
  relationshipClusters: Array<{
    name: string;
    characters: string[];
    description: string;
  }>;
  keyRelationships: RelationshipDynamics[];
  relationshipConflicts: Array<{
    characters: string[];
    conflict: string;
    impact: string;
  }>;
  alliances: Array<{
    name: string;
    characters: string[];
    purpose: string;
    strength: number;
  }>;
  rivalries: Array<{
    characters: string[];
    reason: string;
    intensity: number;
  }>;
  statistics: {
    totalRelationships: number;
    averageStrength: number;
    averageIntimacy: number;
    averageTrust: number;
    relationshipsByType: Record<string, number>;
  };
}

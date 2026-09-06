export interface AnimalArchetype {
  id: string;
  name: string;
  hp: number;
  speed: number;
  attack: number;
  attackRange: number;
  isRanged: boolean;
  specialTag: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface HybridCreature {
  id: string;
  parent1: AnimalArchetype;
  parent2: AnimalArchetype;
  name: string;
  hp: number;
  speed: number;
  attack: number;
  attackRange: number;
  isRanged: boolean;
  specialTag: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ArmySlot {
  hybrid: HybridCreature | null;
  count: number;
}

export type GamePhase = 'forge' | 'army' | 'battle' | 'gameover';

export interface AnimalArchetype {
  id: string;
  name: string;
  nameHebrew: string;
  role: string;
  hp: number;
  speed: number;
  attack: number;
  range: number;
  vision: number;
  special: string;
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
  range: number;
  vision: number;
  specialPrimary: string;
  specialSecondary: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ArmySlot {
  hybrid: HybridCreature | null;
  count: number;
}

export type GamePhase = 'forge' | 'army' | 'battle' | 'gameover';

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
  costDNA: number;
  costBiomass: number;
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
  costDNA: number;
  costBiomass: number;
}

export interface ArmySlot {
  hybrid: HybridCreature | null;
  count: number;
}

export type GamePhase = 'forge' | 'army' | 'battle' | 'gameover';

// Economy System Types
export interface ResourceType {
  id: 'biomass' | 'dna';
  name: string;
  nameHebrew: string;
  color: number;
}

export interface ResourceNode {
  id: string;
  type: 'biomass';
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
}

export interface EconomyState {
  biomass: number;
  dna: number;
}

export type UnitRole = 'worker' | 'combat';

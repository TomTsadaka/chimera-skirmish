import { AnimalArchetype, HybridCreature } from './types';

export const ANIMAL_ARCHETYPES: AnimalArchetype[] = [
  {
    id: 'shadowpaw',
    name: 'Shadowpaw',
    hp: 80,
    speed: 100,
    attack: 15,
    attackRange: 50,
    isRanged: false,
    specialTag: 'agile',
    primaryColor: '#2c3e50',
    secondaryColor: '#34495e'
  },
  {
    id: 'skystalker',
    name: 'Skystalker',
    hp: 50,
    speed: 150,
    attack: 12,
    attackRange: 200,
    isRanged: true,
    specialTag: 'aerial',
    primaryColor: '#3498db',
    secondaryColor: '#2980b9'
  },
  {
    id: 'ironjaw',
    name: 'Ironjaw',
    hp: 120,
    speed: 60,
    attack: 20,
    attackRange: 60,
    isRanged: false,
    specialTag: 'armored',
    primaryColor: '#16a085',
    secondaryColor: '#1abc9c'
  },
  {
    id: 'sparkshell',
    name: 'Sparkshell',
    hp: 60,
    speed: 70,
    attack: 18,
    attackRange: 40,
    isRanged: false,
    specialTag: 'electric',
    primaryColor: '#f39c12',
    secondaryColor: '#f1c40f'
  },
  {
    id: 'hornguard',
    name: 'Hornguard',
    hp: 100,
    speed: 80,
    attack: 16,
    attackRange: 50,
    isRanged: false,
    specialTag: 'defensive',
    primaryColor: '#8e44ad',
    secondaryColor: '#9b59b6'
  },
  {
    id: 'voltfin',
    name: 'Voltfin',
    hp: 70,
    speed: 90,
    attack: 14,
    attackRange: 150,
    isRanged: true,
    specialTag: 'aquatic',
    primaryColor: '#e74c3c',
    secondaryColor: '#c0392b'
  }
];

export class GameData {
  static createHybrid(parent1: AnimalArchetype, parent2: AnimalArchetype): HybridCreature {
    const hp = Math.round((parent1.hp + parent2.hp) / 2);
    const speed = Math.round((parent1.speed + parent2.speed) / 2);
    const attack = Math.round((parent1.attack + parent2.attack) / 2);
    const attackRange = Math.round((parent1.attackRange + parent2.attackRange) / 2);
    const isRanged = parent1.isRanged || parent2.isRanged;
    
    const name = this.generateHybridName(parent1, parent2);
    const specialTag = Math.random() > 0.5 ? parent1.specialTag : parent2.specialTag;
    
    return {
      id: `hybrid_${parent1.id}_${parent2.id}_${Date.now()}`,
      parent1,
      parent2,
      name,
      hp,
      speed,
      attack,
      attackRange,
      isRanged,
      specialTag,
      primaryColor: parent1.primaryColor,
      secondaryColor: parent2.primaryColor
    };
  }

  private static generateHybridName(parent1: AnimalArchetype, parent2: AnimalArchetype): string {
    const firstHalf = parent1.name.substring(0, Math.ceil(parent1.name.length / 2));
    const secondHalf = parent2.name.substring(Math.floor(parent2.name.length / 2));
    return firstHalf + secondHalf;
  }
}

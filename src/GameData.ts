import { AnimalArchetype, HybridCreature } from './types';
import animalsData from '../data/animals-100.json';

// Load 100 animals from JSON data file
export const ANIMAL_ARCHETYPES: AnimalArchetype[] = animalsData.map(animal => ({
  id: animal.id,
  name: animal.nameEn,
  nameHebrew: animal.nameHe,
  role: animal.tags[0] || 'combat', // Use first tag as role
  hp: animal.hp,
  speed: animal.speed,
  attack: animal.attack,
  range: animal.range,
  vision: 5, // Default vision
  special: animal.special, // Hebrew special
  primaryColor: generateColorFromId(animal.id, 0),
  secondaryColor: generateColorFromId(animal.id, 1),
  costDNA: animal.dnaCost,
  costBiomass: animal.biomassCost,
  size: animal.size,
  researchTier: animal.researchTier
}));

// Generate consistent colors from animal ID
function generateColorFromId(id: string, seed: number): string {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  const s = 60 + (Math.abs(hash) % 30);
  const l = 40 + (Math.abs(hash >> 4) % 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export class GameData {
  static createHybrid(parent1: AnimalArchetype, parent2: AnimalArchetype): HybridCreature {
    const hp = Math.round((parent1.hp + parent2.hp) / 2);
    
    let speed = Math.round((parent1.speed + parent2.speed) / 2);
    if (Math.abs(parent1.speed - parent2.speed) >= 5) {
      speed += 1;
    }
    
    const attack = Math.round(((parent1.attack + parent2.attack) / 2) * 1.1);
    
    const range = Math.max(parent1.range, parent2.range);
    
    const vision = Math.max(parent1.vision, parent2.vision);
    
    const stronger = parent1.attack >= parent2.attack ? parent1 : parent2;
    const weaker = parent1.attack >= parent2.attack ? parent2 : parent1;
    const specialPrimary = stronger.special;
    const specialSecondary = weaker.special;
    
    const name = this.generateHybridName(parent1, parent2);
    
    // Calculate production costs using fusion formula
    const costDNA = Math.round((parent1.costDNA + parent2.costDNA) * 0.85);
    const costBiomass = Math.round((parent1.costBiomass + parent2.costBiomass) * 0.5);
    
    // Size and tier are max of parents (per meta-size-tier.json)
    const size = Math.max(parent1.size, parent2.size);
    const researchTier = Math.max(parent1.researchTier, parent2.researchTier);
    
    return {
      id: `hybrid_${parent1.id}_${parent2.id}_${Date.now()}`,
      parent1,
      parent2,
      name,
      hp,
      speed,
      attack,
      range,
      vision,
      specialPrimary,
      specialSecondary,
      primaryColor: parent1.primaryColor,
      secondaryColor: parent2.primaryColor,
      costDNA,
      costBiomass,
      size,
      researchTier
    };
  }

  private static generateHybridName(parent1: AnimalArchetype, parent2: AnimalArchetype): string {
    const firstHalf = parent1.name.substring(0, Math.ceil(parent1.name.length / 2));
    const secondHalf = parent2.name.substring(Math.floor(parent2.name.length / 2));
    return firstHalf + secondHalf;
  }
}

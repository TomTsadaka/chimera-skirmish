import { AnimalArchetype, HybridCreature } from './types';

export const ANIMAL_ARCHETYPES: AnimalArchetype[] = [
  {
    id: 'bat-echo',
    name: 'Bat-Echo',
    nameHebrew: 'עטלף-הד',
    role: 'scout',
    hp: 50,
    speed: 9,
    attack: 10,
    range: 1,
    special: 'fog reveal small AoE',
    primaryColor: '#4a4a4a',
    secondaryColor: '#6b5b95'
  },
  {
    id: 'basalt-rhino',
    name: 'Basalt-Rhino',
    nameHebrew: 'קרנף-בזלת',
    role: 'tank',
    hp: 180,
    speed: 3,
    attack: 18,
    range: 1,
    special: 'shield shove',
    primaryColor: '#3e3e3e',
    secondaryColor: '#5d5d5d'
  },
  {
    id: 'quill-snake',
    name: 'Quill-Snake',
    nameHebrew: 'נחש-זיפים',
    role: 'assassin',
    hp: 55,
    speed: 8,
    attack: 28,
    range: 1,
    special: 'poison DoT',
    primaryColor: '#2ecc71',
    secondaryColor: '#27ae60'
  },
  {
    id: 'vinegar-eagle',
    name: 'Vinegar-Eagle',
    nameHebrew: 'עיט-חומץ',
    role: 'mobile ranged',
    hp: 70,
    speed: 8,
    attack: 16,
    range: 4,
    special: 'dive (+dmg, CD)',
    primaryColor: '#e67e22',
    secondaryColor: '#d35400'
  },
  {
    id: 'crystal-crab',
    name: 'Crystal-Crab',
    nameHebrew: 'סרטן-גביש',
    role: 'defense',
    hp: 160,
    speed: 2,
    attack: 12,
    range: 1,
    special: 'armor + light reflect',
    primaryColor: '#3498db',
    secondaryColor: '#5dade2'
  },
  {
    id: 'ink-octopus',
    name: 'Ink-Octopus',
    nameHebrew: 'תמנון-דיו',
    role: 'control',
    hp: 90,
    speed: 4,
    attack: 11,
    range: 3,
    special: 'ink cloud slow',
    primaryColor: '#9b59b6',
    secondaryColor: '#8e44ad'
  },
  {
    id: 'horn-deer',
    name: 'Horn-Deer',
    nameHebrew: 'צבי-קרן',
    role: 'skirmish',
    hp: 85,
    speed: 7,
    attack: 20,
    range: 2,
    special: 'ram shove',
    primaryColor: '#a0826d',
    secondaryColor: '#c9b29a'
  },
  {
    id: 'thunder-frog',
    name: 'Thunder-Frog',
    nameHebrew: 'צפרדע-רעם',
    role: 'artillery',
    hp: 60,
    speed: 3,
    attack: 32,
    range: 5,
    special: 'shock hop AoE',
    primaryColor: '#f1c40f',
    secondaryColor: '#f39c12'
  }
];

export class GameData {
  static createHybrid(parent1: AnimalArchetype, parent2: AnimalArchetype): HybridCreature {
    const hp = Math.round((parent1.hp + parent2.hp) / 2);
    
    let speed = Math.round((parent1.speed + parent2.speed) / 2);
    if (Math.abs(parent1.speed - parent2.speed) >= 5) {
      speed += 1;
    }
    
    const attack = Math.round(((parent1.attack + parent2.attack) / 2) * 1.1);
    
    const range = Math.max(parent1.range, parent2.range);
    
    const stronger = parent1.attack >= parent2.attack ? parent1 : parent2;
    const weaker = parent1.attack >= parent2.attack ? parent2 : parent1;
    const specialPrimary = stronger.special;
    const specialSecondary = weaker.special;
    
    const name = this.generateHybridName(parent1, parent2);
    
    return {
      id: `hybrid_${parent1.id}_${parent2.id}_${Date.now()}`,
      parent1,
      parent2,
      name,
      hp,
      speed,
      attack,
      range,
      specialPrimary,
      specialSecondary,
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

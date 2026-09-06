import Phaser from 'phaser';
import { Unit } from './Unit';
import { Building } from './Building';
import { ResourceNode } from './ResourceNode';
import { EconomyState, AnimalArchetype } from './types';
import { GAME_CONSTANTS, getAggroRadius, getLeashDistance } from './constants';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';

export class AI {
  private units: Unit[];
  private playerUnits: Unit[];
  private hq: Building;
  private resources: EconomyState;
  private resourceNodes: ResourceNode[];
  private spawnPositions: Map<Unit, { x: number; y: number }> = new Map();
  private lastRetargetTime: Map<Unit, number> = new Map();
  private lastTrainTime: number = 0;
  private readonly TRAIN_INTERVAL = 5000; // Train every 5 seconds
  
  // P0 Wave logic
  private waveState: 'bat' | 'deer' | 'snake' | 'cheapest' = 'bat';
  private waveCount: { bat: number; deer: number; snake: number } = { bat: 0, deer: 0, snake: 0 };
  private readonly WAVE_TARGETS = { bat: 2, deer: 2, snake: 2 }; // 2 bat, 2 deer, 1-2 snake if resources allow

  constructor(
    units: Unit[], 
    playerUnits: Unit[], 
    hq: Building, 
    resources: EconomyState, 
    resourceNodes: ResourceNode[]
  ) {
    this.units = units;
    this.playerUnits = playerUnits;
    this.hq = hq;
    this.resources = resources;
    this.resourceNodes = resourceNodes;
    
    for (const unit of units) {
      this.spawnPositions.set(unit, { x: unit.x, y: unit.y });
      this.lastRetargetTime.set(unit, 0);
    }
  }

  // Update AI with current unit arrays (called after filtering dead units)
  updateUnits(units: Unit[], playerUnits: Unit[]): void {
    this.units = units;
    this.playerUnits = playerUnits;
  }

  update(): void {
    const currentTime = Date.now();
    
    // Economy management
    this.manageEconomy(currentTime);
    
    // Assign idle workers to gather
    this.manageWorkers();
    
    // Combat unit AI
    for (const unit of this.units) {
      if (unit.currentHp <= 0 || unit.role === 'worker') continue;
      
      const spawnPos = this.spawnPositions.get(unit);
      if (!spawnPos) continue;

      const aggroRadius = getAggroRadius(unit.creature.vision);
      const leashDistance = getLeashDistance(aggroRadius);

      if (unit.targetEnemy && unit.targetEnemy.currentHp <= 0) {
        unit.targetEnemy = null;
      }

      if (unit.targetEnemy) {
        const distanceToSpawn = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          spawnPos.x,
          spawnPos.y
        );

        if (distanceToSpawn > leashDistance) {
          unit.targetEnemy = null;
          unit.moveToPosition(spawnPos.x, spawnPos.y);
          continue;
        }
      }

      const lastRetarget = this.lastRetargetTime.get(unit) || 0;
      if (!unit.targetEnemy && (currentTime - lastRetarget >= GAME_CONSTANTS.AI_RETARGET_INTERVAL)) {
        unit.targetEnemy = this.findBestTarget(unit, aggroRadius);
        this.lastRetargetTime.set(unit, currentTime);
      }

      if (unit.targetEnemy) {
        const distanceToTarget = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          unit.targetEnemy.x,
          unit.targetEnemy.y
        );

        if (distanceToTarget > unit.creature.range * GAME_CONSTANTS.TILE_SIZE * 0.8) {
          unit.moveToPosition(unit.targetEnemy.x, unit.targetEnemy.y);
        } else {
          unit.attackTarget(unit.targetEnemy);
        }
      }
    }
  }
  
  private manageEconomy(currentTime: number): void {
    // Train units periodically if resources allow
    if (currentTime - this.lastTrainTime >= this.TRAIN_INTERVAL) {
      this.lastTrainTime = currentTime;
      
      const workers = this.units.filter(u => u.role === 'worker').length;
      
      // Maintain worker count (2-4 workers)
      if (workers < 4 && 
          this.resources.dna >= GAME_CONSTANTS.WORKER_COST_DNA &&
          this.resources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
        this.trainWorker();
        return;
      }
      
      // P0 Wave logic: bat×2 → deer×2 → snake×1-2 → cheapest loop
      if (workers >= 2) {
        const batEcho = ANIMAL_ARCHETYPES.find(a => a.id === 'bat-echo');
        const hornDeer = ANIMAL_ARCHETYPES.find(a => a.id === 'horn-deer');
        const quillSnake = ANIMAL_ARCHETYPES.find(a => a.id === 'quill-snake');
        
        if (this.waveState === 'bat' && batEcho) {
          if (this.resources.dna >= batEcho.costDNA && this.resources.biomass >= batEcho.costBiomass) {
            this.trainCombatUnit(batEcho);
            this.waveCount.bat++;
            if (this.waveCount.bat >= this.WAVE_TARGETS.bat) {
              this.waveState = 'deer';
            }
          }
        } else if (this.waveState === 'deer' && hornDeer) {
          if (this.resources.dna >= hornDeer.costDNA && this.resources.biomass >= hornDeer.costBiomass) {
            this.trainCombatUnit(hornDeer);
            this.waveCount.deer++;
            if (this.waveCount.deer >= this.WAVE_TARGETS.deer) {
              this.waveState = 'snake';
            }
          }
        } else if (this.waveState === 'snake' && quillSnake) {
          if (this.resources.dna >= quillSnake.costDNA && this.resources.biomass >= quillSnake.costBiomass) {
            this.trainCombatUnit(quillSnake);
            this.waveCount.snake++;
            if (this.waveCount.snake >= this.WAVE_TARGETS.snake) {
              this.waveState = 'cheapest';
            }
          }
        } else if (this.waveState === 'cheapest') {
          // Train cheapest affordable unit
          const affordable = [batEcho, hornDeer, quillSnake]
            .filter(a => a && this.resources.dna >= a.costDNA && this.resources.biomass >= a.costBiomass)
            .sort((a, b) => (a!.costDNA + a!.costBiomass) - (b!.costDNA + b!.costBiomass));
          
          if (affordable.length > 0 && affordable[0]) {
            this.trainCombatUnit(affordable[0]);
          }
        }
      }
    }
  }
  
  private manageWorkers(): void {
    const workers = this.units.filter(u => u.role === 'worker' && u.currentHp > 0);
    
    for (const worker of workers) {
      // If worker is idle, assign it to gather
      if (worker.gatherState === 'idle' && !worker.targetResourceNode) {
        const nearestNode = this.findNearestResourceNode(worker);
        if (nearestNode && !nearestNode.isEmpty()) {
          worker.orderGather(nearestNode);
        }
      }
    }
  }
  
  private findNearestResourceNode(worker: Unit): ResourceNode | null {
    let nearest: ResourceNode | null = null;
    let minDistance = Infinity;
    
    for (const node of this.resourceNodes) {
      if (node.isEmpty()) continue;
      
      const distance = Phaser.Math.Distance.Between(worker.x, worker.y, node.x, node.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }
    
    return nearest;
  }
  
  private trainWorker(): void {
    if (this.resources.dna >= GAME_CONSTANTS.WORKER_COST_DNA &&
        this.resources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
      this.resources.dna -= GAME_CONSTANTS.WORKER_COST_DNA;
      this.resources.biomass -= GAME_CONSTANTS.WORKER_COST_BIOMASS;
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 80;
      const x = this.hq.x + Math.cos(angle) * radius;
      const y = this.hq.y + Math.sin(angle) * radius;
      
      const workerCreature = {
        id: 'worker',
        parent1: ANIMAL_ARCHETYPES[0],
        parent2: ANIMAL_ARCHETYPES[1],
        name: 'Worker',
        hp: 50,
        speed: 5,
        attack: 1,
        range: 1,
        vision: 6,
        specialPrimary: '',
        specialSecondary: '',
        primaryColor: '#FACC15',
        secondaryColor: '#854D0E',
        costDNA: 0,
        costBiomass: 0
      };
      
      const worker = new Unit(this.hq.scene, x, y, workerCreature, 'enemy', 'worker', this.hq);
      this.units.push(worker);
      this.spawnPositions.set(worker, { x, y });
    }
  }
  
  private trainCombatUnit(archetype: AnimalArchetype): void {
    if (this.resources.dna >= archetype.costDNA &&
        this.resources.biomass >= archetype.costBiomass) {
      this.resources.dna -= archetype.costDNA;
      this.resources.biomass -= archetype.costBiomass;
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 100;
      const x = this.hq.x + Math.cos(angle) * radius;
      const y = this.hq.y + Math.sin(angle) * radius;
      
      // Create a random hybrid for the enemy
      const animal1 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES);
      const animal2 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES.filter(a => a.id !== animal1.id));
      const hybrid = GameData.createHybrid(animal1, animal2);
      
      const unit = new Unit(this.hq.scene, x, y, hybrid, 'enemy', 'combat');
      this.units.push(unit);
      this.spawnPositions.set(unit, { x, y });
    }
  }

  private findBestTarget(unit: Unit, aggroRadius: number): Unit | null {
    // Only target alive player units
    const validTargets = this.playerUnits.filter(target => {
      if (target.currentHp <= 0) return false;
      const distance = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
      return distance <= aggroRadius;
    });

    if (validTargets.length === 0) return null;

    // Prioritize units attacking this AI unit
    const attackingMe = validTargets.find(target => target.targetEnemy === unit);
    if (attackingMe) return attackingMe;

    // Otherwise, find nearest
    let nearest: Unit | null = null;
    let minDistance = Infinity;
    for (const target of validTargets) {
      const distance = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = target;
      }
    }

    return nearest;
  }
}

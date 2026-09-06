import Phaser from 'phaser';
import { Unit } from './Unit';
import { Building } from './Building';
import { ResourceNode } from './ResourceNode';
import { EconomyState } from './types';
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
  private readonly TRAIN_INTERVAL = 5000; // Train every 5 seconds if resources allow

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
      
      // Maintain a good worker count
      if (workers < 6 && this.resources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
        this.trainWorker();
      }
      // Train combat units if we have enough resources and workers
      else if (workers >= 4 && 
               this.resources.biomass >= GAME_CONSTANTS.COMBAT_UNIT_COST_BIOMASS &&
               this.resources.energy >= GAME_CONSTANTS.COMBAT_UNIT_COST_ENERGY) {
        this.trainCombatUnit();
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
    if (this.resources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
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
        secondaryColor: '#854D0E'
      };
      
      const worker = new Unit(this.hq.scene, x, y, workerCreature, 'enemy', 'worker', this.hq);
      this.units.push(worker);
      this.spawnPositions.set(worker, { x, y });
    }
  }
  
  private trainCombatUnit(): void {
    if (this.resources.biomass >= GAME_CONSTANTS.COMBAT_UNIT_COST_BIOMASS &&
        this.resources.energy >= GAME_CONSTANTS.COMBAT_UNIT_COST_ENERGY) {
      this.resources.biomass -= GAME_CONSTANTS.COMBAT_UNIT_COST_BIOMASS;
      this.resources.energy -= GAME_CONSTANTS.COMBAT_UNIT_COST_ENERGY;
      
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

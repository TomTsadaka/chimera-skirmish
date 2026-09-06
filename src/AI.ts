import Phaser from 'phaser';
import { Unit } from './Unit';
import { GAME_CONSTANTS, getAggroRadius, getLeashDistance } from './constants';

export class AI {
  private units: Unit[];
  private playerUnits: Unit[];
  private spawnPositions: Map<Unit, { x: number; y: number }> = new Map();
  private lastRetargetTime: Map<Unit, number> = new Map();

  constructor(units: Unit[], playerUnits: Unit[]) {
    this.units = units;
    this.playerUnits = playerUnits;
    
    for (const unit of units) {
      this.spawnPositions.set(unit, { x: unit.x, y: unit.y });
      this.lastRetargetTime.set(unit, 0);
    }
  }

  update(): void {
    const currentTime = Date.now();
    
    for (const unit of this.units) {
      const spawnPos = this.spawnPositions.get(unit);
      if (!spawnPos) continue;

      const aggroRadius = getAggroRadius(unit.creature.vision);
      const leashDistance = getLeashDistance(aggroRadius);

      // Check if target is still valid
      if (unit.targetEnemy && unit.targetEnemy.currentHp <= 0) {
        unit.targetEnemy = null;
      }

      // Check leash - drop target immediately if outside leash from spawn
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

      // Retarget at interval (not every frame)
      const lastRetarget = this.lastRetargetTime.get(unit) || 0;
      if (!unit.targetEnemy && (currentTime - lastRetarget >= GAME_CONSTANTS.AI_RETARGET_INTERVAL)) {
        unit.targetEnemy = this.findBestTarget(unit, aggroRadius);
        this.lastRetargetTime.set(unit, currentTime);
      }

      // Execute behavior
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

  private findBestTarget(unit: Unit, aggroRadius: number): Unit | null {
    const validTargets = this.playerUnits.filter(target => {
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

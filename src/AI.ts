import { Unit } from './Unit';

export class AI {
  private units: Unit[];
  private playerUnits: Unit[];
  private readonly AGGRO_RADIUS = 250;
  private readonly LEASH_DISTANCE = 400;
  private spawnPositions: Map<Unit, { x: number; y: number }> = new Map();

  constructor(units: Unit[], playerUnits: Unit[]) {
    this.units = units;
    this.playerUnits = playerUnits;
    
    for (const unit of units) {
      this.spawnPositions.set(unit, { x: unit.x, y: unit.y });
    }
  }

  update(): void {
    for (const unit of this.units) {
      const spawnPos = this.spawnPositions.get(unit);
      if (!spawnPos) continue;

      if (!unit.targetEnemy || unit.targetEnemy.currentHp <= 0) {
        unit.targetEnemy = this.findBestTarget(unit, spawnPos);
      }

      if (unit.targetEnemy) {
        const distanceToTarget = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          unit.targetEnemy.x,
          unit.targetEnemy.y
        );
        
        const distanceToSpawn = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          spawnPos.x,
          spawnPos.y
        );

        if (distanceToSpawn > this.LEASH_DISTANCE) {
          unit.targetEnemy = null;
          unit.moveToPosition(spawnPos.x, spawnPos.y);
          continue;
        }

        if (distanceToTarget > unit.creature.range * 30 * 0.8) {
          unit.moveToPosition(unit.targetEnemy.x, unit.targetEnemy.y);
        } else {
          unit.attackTarget(unit.targetEnemy);
        }
      }
    }
  }

  private findBestTarget(unit: Unit, _spawnPos: { x: number; y: number }): Unit | null {
    const validTargets = this.playerUnits.filter(target => {
      const distance = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y);
      return distance <= this.AGGRO_RADIUS;
    });

    if (validTargets.length === 0) return null;

    const attackingMe = validTargets.find(target => target.targetEnemy === unit);
    if (attackingMe) return attackingMe;

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

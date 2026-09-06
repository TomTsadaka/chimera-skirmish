import { Unit } from './Unit';

export class AI {
  private units: Unit[];
  private playerUnits: Unit[];

  constructor(units: Unit[], playerUnits: Unit[]) {
    this.units = units;
    this.playerUnits = playerUnits;
  }

  update(): void {
    for (const unit of this.units) {
      if (!unit.targetEnemy || unit.targetEnemy.currentHp <= 0) {
        unit.targetEnemy = unit.findNearestEnemy(this.playerUnits);
      }

      if (unit.targetEnemy) {
        const distance = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          unit.targetEnemy.x,
          unit.targetEnemy.y
        );

        if (distance > unit.creature.range * 30 * 0.8) {
          unit.moveToPosition(unit.targetEnemy.x, unit.targetEnemy.y);
        } else {
          unit.attackTarget(unit.targetEnemy);
        }
      }
    }
  }
}

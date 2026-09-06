import Phaser from 'phaser';
import { ArmySlot } from './types';
import { Unit } from './Unit';
import { AI } from './AI';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';

export class BattleScene extends Phaser.Scene {
  private playerUnits: Unit[] = [];
  private enemyUnits: Unit[] = [];
  private selectedUnits: Unit[] = [];
  private ai!: AI;
  private selectionBox: Phaser.GameObjects.Rectangle | null = null;
  private selectionStart: { x: number; y: number } | null = null;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(data: { armySlots: ArmySlot[] }): void {
    this.add.text(400, 20, 'BATTLE ARENA', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(100, 20, 'Left-click: Select | Right-click: Move/Attack', {
      fontSize: '14px',
      color: '#aaaaaa'
    });

    this.add.rectangle(400, 300, 700, 500, 0x1a3a1a, 0.3);

    this.spawnPlayerArmy(data.armySlots);
    this.spawnEnemyArmy();

    this.ai = new AI(this.enemyUnits, this.playerUnits);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.input.mouse!.disableContextMenu();
  }

  private spawnPlayerArmy(armySlots: ArmySlot[]): void {
    let unitIndex = 0;
    const startX = 150;
    const startY = 300;
    const spacing = 60;

    for (const slot of armySlots) {
      if (slot.hybrid && slot.count > 0) {
        for (let i = 0; i < slot.count; i++) {
          const col = unitIndex % 4;
          const row = Math.floor(unitIndex / 4);
          const x = startX + col * spacing;
          const y = startY + row * spacing;
          
          const unit = new Unit(this, x, y, slot.hybrid, 'player');
          this.playerUnits.push(unit);
          unitIndex++;
        }
      }
    }
  }

  private spawnEnemyArmy(): void {
    const enemyCount = Math.min(10, this.playerUnits.length + 2);
    const startX = 650;
    const startY = 300;
    const spacing = 60;

    for (let i = 0; i < enemyCount; i++) {
      const animal1 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES);
      const animal2 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES.filter(a => a.id !== animal1.id));
      const hybrid = GameData.createHybrid(animal1, animal2);

      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * spacing;
      const y = startY + row * spacing;

      const unit = new Unit(this, x, y, hybrid, 'enemy');
      this.enemyUnits.push(unit);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown()) {
      this.selectionStart = { x: pointer.x, y: pointer.y };
      
      const clickedUnit = this.getUnitAtPosition(pointer.x, pointer.y);
      if (clickedUnit && clickedUnit.team === 'player') {
        if (!pointer.event.shiftKey) {
          this.clearSelection();
        }
        clickedUnit.setSelected(true);
        if (!this.selectedUnits.includes(clickedUnit)) {
          this.selectedUnits.push(clickedUnit);
        }
      } else if (!pointer.event.shiftKey) {
        this.clearSelection();
      }
    } else if (pointer.rightButtonDown()) {
      this.issueOrderToSelected(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown() && this.selectionStart) {
      if (!this.selectionBox) {
        this.selectionBox = this.add.rectangle(0, 0, 0, 0)
          .setStrokeStyle(2, 0x00ff00)
          .setFillStyle(0x00ff00, 0.1);
      }

      const x = Math.min(this.selectionStart.x, pointer.x);
      const y = Math.min(this.selectionStart.y, pointer.y);
      const width = Math.abs(pointer.x - this.selectionStart.x);
      const height = Math.abs(pointer.y - this.selectionStart.y);

      this.selectionBox.setPosition(x + width / 2, y + height / 2);
      this.selectionBox.setSize(width, height);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.selectionBox && this.selectionStart) {
      const bounds = this.selectionBox.getBounds();
      
      if (!pointer.event.shiftKey) {
        this.clearSelection();
      }

      for (const unit of this.playerUnits) {
        if (bounds.contains(unit.x, unit.y)) {
          unit.setSelected(true);
          if (!this.selectedUnits.includes(unit)) {
            this.selectedUnits.push(unit);
          }
        }
      }

      this.selectionBox.destroy();
      this.selectionBox = null;
      this.selectionStart = null;
    }
  }

  private getUnitAtPosition(x: number, y: number): Unit | null {
    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      const distance = Phaser.Math.Distance.Between(x, y, unit.x, unit.y);
      if (distance < 25) {
        return unit;
      }
    }
    return null;
  }

  private issueOrderToSelected(x: number, y: number): void {
    const targetUnit = this.getUnitAtPosition(x, y);

    for (const unit of this.selectedUnits) {
      if (targetUnit && targetUnit.team === 'enemy') {
        unit.targetEnemy = targetUnit;
        unit.moveToPosition(targetUnit.x, targetUnit.y);
      } else {
        unit.targetEnemy = null;
        unit.moveToPosition(x, y);
      }
    }
  }

  private clearSelection(): void {
    for (const unit of this.selectedUnits) {
      unit.setSelected(false);
    }
    this.selectedUnits = [];
  }

  update(_time: number, delta: number): void {
    this.playerUnits = this.playerUnits.filter(unit => unit.currentHp > 0);
    this.enemyUnits = this.enemyUnits.filter(unit => unit.currentHp > 0);

    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      unit.update(delta);

      if (unit.targetEnemy) {
        const distance = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          unit.targetEnemy.x,
          unit.targetEnemy.y
        );

        const effectiveRange = unit.creature.range * 30;
        if (distance <= effectiveRange) {
          unit.attackTarget(unit.targetEnemy);
        }
      }
    }

    this.ai.update();

    if (this.playerUnits.length === 0) {
      this.scene.start('GameOverScene', { victory: false });
    } else if (this.enemyUnits.length === 0) {
      this.scene.start('GameOverScene', { victory: true });
    }
  }
}

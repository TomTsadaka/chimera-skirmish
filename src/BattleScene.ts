import Phaser from 'phaser';
import { HybridCreature } from './types';
import { Unit } from './Unit';
import { AI } from './AI';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';
import { strings, colors } from './i18n';

export class BattleScene extends Phaser.Scene {
  private playerUnits: Unit[] = [];
  private enemyUnits: Unit[] = [];
  private selectedUnits: Unit[] = [];
  private ai!: AI;
  private selectionBox: Phaser.GameObjects.Rectangle | null = null;
  private selectionStart: { x: number; y: number } | null = null;
  private gameEnded: boolean = false;
  private clickMarker: Phaser.GameObjects.Arc | null = null;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private rivalHPBar!: Phaser.GameObjects.Graphics;
  private onboardingShown: boolean = false;
  private selectedUnitText!: Phaser.GameObjects.Text;
  private selectedHPText!: Phaser.GameObjects.Text;
  private selectedHPBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(data: { hybrid: HybridCreature }): void {
    this.gameEnded = false;
    
    this.registry.set('lastHybrid', data.hybrid);
    
    this.add.text(400, 20, strings.battle.title, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(100, 60, strings.deploy.you, {
      fontSize: '18px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    });

    this.playerHPBar = this.add.graphics();

    this.add.text(700, 60, strings.deploy.rival, {
      fontSize: '18px',
      color: colors.rivalHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(1, 0);

    this.rivalHPBar = this.add.graphics();

    this.add.rectangle(400, 340, 700, 480, 0x1a3a1a, 0.3);

    this.spawnPlayerArmy(data.hybrid);
    this.spawnEnemyArmy();

    this.ai = new AI(this.enemyUnits, this.playerUnits);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.input.keyboard!.on('keydown-A', (event: KeyboardEvent) => {
      if (event.ctrlKey && !this.gameEnded) {
        this.selectAllPlayerUnits();
      }
    });

    this.input.mouse!.disableContextMenu();

    this.createSelectedUnitPanel();

    if (!this.onboardingShown) {
      this.time.delayedCall(500, () => {
        this.showOnboardingTip(strings.onboard.battle, 400, 520);
      });
    }
  }

  private spawnPlayerArmy(hybrid: HybridCreature): void {
    const unitCount = 8;
    const startX = 150;
    const startY = 300;
    const spacing = 60;

    for (let i = 0; i < unitCount; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      
      const unit = new Unit(this, x, y, hybrid, 'player');
      this.playerUnits.push(unit);
    }
  }

  private spawnEnemyArmy(): void {
    const enemyCount = Math.min(6, Math.max(3, this.playerUnits.length));
    const spawnPoints = [
      { x: 650, y: 200 },
      { x: 680, y: 250 },
      { x: 650, y: 300 },
      { x: 680, y: 350 },
      { x: 650, y: 400 },
      { x: 680, y: 450 }
    ];

    for (let i = 0; i < enemyCount; i++) {
      const animal1 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES);
      const animal2 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES.filter(a => a.id !== animal1.id));
      const hybrid = GameData.createHybrid(animal1, animal2);

      const spawnPoint = spawnPoints[i];
      const unit = new Unit(this, spawnPoint.x, spawnPoint.y, hybrid, 'enemy');
      this.enemyUnits.push(unit);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded) return;
    
    if (pointer.leftButtonDown()) {
      this.selectionStart = { x: pointer.x, y: pointer.y };
      
      const clickedUnit = this.getUnitAtPosition(pointer.x, pointer.y);
      if (clickedUnit && clickedUnit.team === 'player') {
        if (!pointer.event.shiftKey) {
          this.clearSelection();
        } else {
          if (this.selectedUnits.includes(clickedUnit)) {
            clickedUnit.setSelected(false);
            this.selectedUnits = this.selectedUnits.filter(u => u !== clickedUnit);
            return;
          }
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
      this.showClickMarker(pointer.x, pointer.y);
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
    if (this.gameEnded) return;
    
    if (this.selectionBox && this.selectionStart) {
      const bounds = this.selectionBox.getBounds();
      const boxWidth = Math.abs(pointer.x - this.selectionStart.x);
      const boxHeight = Math.abs(pointer.y - this.selectionStart.y);
      
      if (boxWidth > 5 || boxHeight > 5) {
        if (!pointer.event.shiftKey) {
          this.clearSelection();
        }

        let foundAny = false;
        for (const unit of this.playerUnits) {
          if (bounds.contains(unit.x, unit.y)) {
            unit.setSelected(true);
            if (!this.selectedUnits.includes(unit)) {
              this.selectedUnits.push(unit);
            }
            foundAny = true;
          }
        }
        
        if (!foundAny && !pointer.event.shiftKey) {
          this.clearSelection();
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

  private selectAllPlayerUnits(): void {
    this.clearSelection();
    for (const unit of this.playerUnits) {
      unit.setSelected(true);
      this.selectedUnits.push(unit);
    }
  }

  private showClickMarker(x: number, y: number): void {
    if (this.clickMarker) {
      this.clickMarker.destroy();
    }
    
    this.clickMarker = this.add.circle(x, y, 8, 0x00ff00, 0.6);
    
    this.tweens.add({
      targets: this.clickMarker,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => {
        if (this.clickMarker) {
          this.clickMarker.destroy();
          this.clickMarker = null;
        }
      }
    });
  }

  update(_time: number, delta: number): void {
    this.playerUnits = this.playerUnits.filter(unit => {
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    this.enemyUnits = this.enemyUnits.filter(unit => {
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    this.selectedUnits = this.selectedUnits.filter(unit => unit.currentHp > 0);

    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      unit.update(delta);

      if (unit.targetEnemy && unit.targetEnemy.currentHp <= 0) {
        const nearest = unit.findNearestEnemy(unit.team === 'player' ? this.enemyUnits : this.playerUnits);
        unit.targetEnemy = nearest;
        if (nearest) {
          unit.moveToPosition(nearest.x, nearest.y);
        }
      }

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

    this.updateHPBars();
    this.updateSelectedPanel();

    this.ai.update();

    if (!this.gameEnded) {
      if (this.playerUnits.length === 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: false });
        });
      } else if (this.enemyUnits.length === 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: true });
        });
      }
    }
  }

  private updateHPBars(): void {
    this.playerHPBar.clear();
    this.rivalHPBar.clear();

    const playerMaxHP = this.playerUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const playerCurrentHP = this.playerUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const playerPercent = playerMaxHP > 0 ? playerCurrentHP / playerMaxHP : 0;

    const rivalMaxHP = this.enemyUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const rivalCurrentHP = this.enemyUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const rivalPercent = rivalMaxHP > 0 ? rivalCurrentHP / rivalMaxHP : 0;

    const barWidth = 200;
    const barHeight = 20;
    const playerX = 100;
    const rivalX = 600;
    const barY = 80;

    this.playerHPBar.fillStyle(0x000000, 0.5);
    this.playerHPBar.fillRect(playerX, barY, barWidth, barHeight);
    this.playerHPBar.fillStyle(colors.player, 1);
    this.playerHPBar.fillRect(playerX, barY, barWidth * playerPercent, barHeight);

    this.rivalHPBar.fillStyle(0x000000, 0.5);
    this.rivalHPBar.fillRect(rivalX, barY, barWidth, barHeight);
    this.rivalHPBar.fillStyle(colors.rival, 1);
    this.rivalHPBar.fillRect(rivalX, barY, barWidth * rivalPercent, barHeight);
  }

  private createSelectedUnitPanel(): void {
    this.add.rectangle(400, 570, 700, 50, 0x000000, 0.85);
    
    this.selectedUnitText = this.add.text(120, 560, strings.battle.noneSelected, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });

    this.selectedHPText = this.add.text(550, 560, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    this.selectedHPBar = this.add.graphics();
  }

  private updateSelectedPanel(): void {
    if (this.selectedUnits.length === 0) {
      this.selectedUnitText.setText(strings.battle.noneSelected);
      this.selectedUnitText.setColor('#aaaaaa');
      this.selectedHPText.setText('');
      this.selectedHPBar.clear();
    } else if (this.selectedUnits.length === 1) {
      const unit = this.selectedUnits[0];
      this.selectedUnitText.setText(`${strings.battle.selected}: ${unit.creature.name}`);
      this.selectedUnitText.setColor(colors.playerHex);
      
      const hpPercent = unit.currentHp / unit.creature.hp;
      this.selectedHPText.setText(`${strings.stat.hp}: ${unit.currentHp}/${unit.creature.hp}`);
      
      this.selectedHPBar.clear();
      const barWidth = 150;
      const barHeight = 8;
      const barX = 550;
      const barY = 572;
      
      this.selectedHPBar.fillStyle(0x000000, 0.5);
      this.selectedHPBar.fillRect(barX, barY, barWidth, barHeight);
      
      let color: number;
      if (hpPercent > 0.5) {
        color = 0x00ff00;
      } else if (hpPercent > 0.25) {
        color = 0xffff00;
      } else {
        color = 0xff0000;
      }
      
      this.selectedHPBar.fillStyle(color, 1);
      this.selectedHPBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    } else {
      this.selectedUnitText.setText(`${strings.battle.selected}: ${this.selectedUnits.length} יחידות`);
      this.selectedUnitText.setColor(colors.playerHex);
      this.selectedHPText.setText('');
      this.selectedHPBar.clear();
    }
  }

  private showOnboardingTip(text: string, x: number, y: number): void {
    const tip = this.add.rectangle(x, y, 650, 60, 0x000000, 0.85);
    const tipText = this.add.text(x, y - 10, text, {
      fontSize: '13px',
      color: '#ffcc00',
      align: 'center',
      wordWrap: { width: 600 },
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const dismissBtn = this.add.rectangle(x, y + 20, 100, 25, 0x444444)
      .setInteractive({ useHandCursor: true });
    const dismissText = this.add.text(x, y + 20, strings.onboard.dismiss, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    dismissBtn.on('pointerdown', () => {
      tip.destroy();
      tipText.destroy();
      dismissBtn.destroy();
      dismissText.destroy();
      this.onboardingShown = true;
    });
  }
}

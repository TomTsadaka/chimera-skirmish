import Phaser from 'phaser';
import { HybridCreature } from './types';
import { Unit } from './Unit';
import { AI } from './AI';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';
import { strings, colors } from './i18n';
import { FogOfWar } from './FogOfWar';
import { Minimap } from './Minimap';
import { GAME_CONSTANTS } from './constants';

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
  private onboardingTip: Phaser.GameObjects.Container | null = null;
  private selectedUnitText!: Phaser.GameObjects.Text;
  private selectedHPText!: Phaser.GameObjects.Text;
  private selectedHPBar!: Phaser.GameObjects.Graphics;
  private fogOfWar!: FogOfWar;
  private minimap!: Minimap;
  private controlGroups: Map<number, Unit[]> = new Map();
  private helpOverlay: Phaser.GameObjects.Container | null = null;
  private pointerInWindow: boolean = true;
  
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;
  private readonly CAMERA_SPEED = GAME_CONSTANTS.CAMERA_PAN_SPEED;
  private readonly MIN_ZOOM = GAME_CONSTANTS.CAMERA_ZOOM_MIN;
  private readonly MAX_ZOOM = GAME_CONSTANTS.CAMERA_ZOOM_MAX;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(data: { hybrid: HybridCreature }): void {
    this.gameEnded = false;
    this.controlGroups.clear(); // Clear control groups on restart
    
    // Clear old units if restarting
    this.playerUnits = [];
    this.enemyUnits = [];
    this.selectedUnits = [];
    
    // Destroy old fog/minimap if they exist
    if (this.fogOfWar) {
      this.fogOfWar.destroy();
    }
    if (this.minimap) {
      this.minimap.destroy();
    }
    
    this.registry.set('lastHybrid', data.hybrid);

    this.add.rectangle(this.MAP_WIDTH / 2, this.MAP_HEIGHT / 2, this.MAP_WIDTH, this.MAP_HEIGHT, 0x1a3a1a);
    
    const cam = this.cameras.main;
    const margin = GAME_CONSTANTS.CAMERA_MARGIN_PERCENT / 100;
    const marginX = this.MAP_WIDTH * margin;
    const marginY = this.MAP_HEIGHT * margin;
    cam.setBounds(-marginX, -marginY, this.MAP_WIDTH + marginX * 2, this.MAP_HEIGHT + marginY * 2);
    cam.setZoom(1);

    this.fogOfWar = new FogOfWar(this, this.MAP_WIDTH, this.MAP_HEIGHT);

    this.spawnPlayerArmy(data.hybrid);
    this.spawnEnemyArmy();

    cam.centerOn(this.playerUnits[0].x, this.playerUnits[0].y);

    this.minimap = new Minimap(this, this.MAP_WIDTH, this.MAP_HEIGHT);

    this.ai = new AI(this.enemyUnits, this.playerUnits);

    this.setupUI();
    this.setupInput();
    this.setupKeyboard();

    if (!this.onboardingShown) {
      this.time.delayedCall(500, () => {
        this.showOnboardingTip(strings.onboard.cameraFog, 400, 520);
      });
    }
  }

  private setupUI(): void {
    this.add.text(400, 20, strings.battle.title, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(100, 60, strings.deploy.you, {
      fontSize: '18px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    this.playerHPBar = this.add.graphics().setScrollFactor(0);

    this.add.text(700, 60, strings.deploy.rival, {
      fontSize: '18px',
      color: colors.rivalHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(1, 0).setScrollFactor(0);

    this.rivalHPBar = this.add.graphics().setScrollFactor(0);

    this.createSelectedUnitPanel();
  }

  private setupInput(): void {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Use game-level events for canvas leave/enter (more reliable than pointer events)
    this.game.events.on('blur', this.onGameBlur, this);
    this.game.events.on('focus', this.onGameFocus, this);
    this.game.events.on('hidden', this.onGameBlur, this);
    this.game.events.on('visible', this.onGameFocus, this);

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.gameEnded) return;
      
      const cam = this.cameras.main;
      const zoomDirection = deltaY > 0 ? -1 : 1;
      const newZoom = Phaser.Math.Clamp(
        cam.zoom + zoomDirection * GAME_CONSTANTS.CAMERA_ZOOM_STEP,
        this.MIN_ZOOM,
        this.MAX_ZOOM
      );
      
      if (newZoom !== cam.zoom) {
        const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
        cam.setZoom(newZoom);
        const newWorldPoint = cam.getWorldPoint(pointer.x, pointer.y);
        cam.scrollX += worldPoint.x - newWorldPoint.x;
        cam.scrollY += worldPoint.y - newWorldPoint.y;
      }
    });

    this.input.mouse!.disableContextMenu();
  }

  private onGameBlur = (): void => {
    this.pointerInWindow = false;
  };

  private onGameFocus = (): void => {
    this.pointerInWindow = true;
  };

  shutdown(): void {
    // Clean up game event listeners
    this.game.events.off('blur', this.onGameBlur, this);
    this.game.events.off('focus', this.onGameFocus, this);
    this.game.events.off('hidden', this.onGameBlur, this);
    this.game.events.off('visible', this.onGameFocus, this);
  }

  private setupKeyboard(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.gameEnded && this.selectedUnits.length > 0) {
        this.centerCameraOnSelection();
      }
    });

    this.input.keyboard!.on('keydown-A', (event: KeyboardEvent) => {
      if (event.ctrlKey && !this.gameEnded) {
        this.selectAllPlayerUnits();
      }
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.helpOverlay) {
        this.closeHelpOverlay();
      } else if (!this.gameEnded) {
        this.clearSelection();
      }
    });

    this.input.keyboard!.on('keydown-X', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-DELETE', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-BACK_SPACE', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-F1', (event: KeyboardEvent) => {
      event.preventDefault();
      this.toggleHelpOverlay();
    });

    this.input.keyboard!.on('keydown-SLASH', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        this.toggleHelpOverlay();
      }
    });

    const numberKeys = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    for (let i = 0; i <= 9; i++) {
      const keyCode = numberKeys[i];
      this.input.keyboard!.on(`keydown-${keyCode}`, (event: KeyboardEvent) => {
        if (event.ctrlKey && !this.gameEnded) {
          event.preventDefault();
          this.assignControlGroup(i);
        } else if (!this.gameEnded) {
          this.recallControlGroup(i);
        }
      });
    }
  }

  private spawnPlayerArmy(hybrid: HybridCreature): void {
    const unitCount = 8;
    const startX = 300;
    const startY = this.MAP_HEIGHT / 2;
    const spacing = 70;

    for (let i = 0; i < unitCount; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * spacing;
      const y = startY - 100 + row * spacing;
      
      const unit = new Unit(this, x, y, hybrid, 'player');
      this.playerUnits.push(unit);
    }
  }

  private spawnEnemyArmy(): void {
    const enemyCount = Math.min(6, Math.max(3, this.playerUnits.length));
    const spawnPoints = [
      { x: this.MAP_WIDTH - 400, y: this.MAP_HEIGHT / 2 - 200 },
      { x: this.MAP_WIDTH - 350, y: this.MAP_HEIGHT / 2 - 100 },
      { x: this.MAP_WIDTH - 400, y: this.MAP_HEIGHT / 2 },
      { x: this.MAP_WIDTH - 350, y: this.MAP_HEIGHT / 2 + 100 },
      { x: this.MAP_WIDTH - 400, y: this.MAP_HEIGHT / 2 + 200 },
      { x: this.MAP_WIDTH - 450, y: this.MAP_HEIGHT / 2 + 300 }
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
      this.selectionStart = { x: pointer.worldX, y: pointer.worldY };
      
      const clickedUnit = this.getUnitAtPosition(pointer.worldX, pointer.worldY);
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
      this.issueOrderToSelected(pointer.worldX, pointer.worldY);
      this.showClickMarker(pointer.worldX, pointer.worldY);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown() && this.selectionStart) {
      if (!this.selectionBox) {
        this.selectionBox = this.add.rectangle(0, 0, 0, 0)
          .setStrokeStyle(2, 0x00ff00)
          .setFillStyle(0x00ff00, 0.1);
      }

      const x = Math.min(this.selectionStart.x, pointer.worldX);
      const y = Math.min(this.selectionStart.y, pointer.worldY);
      const width = Math.abs(pointer.worldX - this.selectionStart.x);
      const height = Math.abs(pointer.worldY - this.selectionStart.y);

      this.selectionBox.setPosition(x + width / 2, y + height / 2);
      this.selectionBox.setSize(width, height);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.helpOverlay) return;
    
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    
    if (this.selectionBox && this.selectionStart) {
      const bounds = this.selectionBox.getBounds();
      const boxWidth = Math.abs(worldX - this.selectionStart.x);
      const boxHeight = Math.abs(worldY - this.selectionStart.y);
      
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
      // Kill existing movement tweens before issuing new orders
      this.tweens.killTweensOf(unit);
      
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
    if (!this.gameEnded) {
      this.updateCameraPan(delta);
    }

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
    
    // Update AI with current unit arrays after filtering
    this.ai.updateUnits(this.enemyUnits, this.playerUnits);
    
    this.selectedUnits = this.selectedUnits.filter(unit => unit.currentHp > 0);

    this.fogOfWar.update(this.playerUnits);

    this.minimap.update(this.playerUnits, this.enemyUnits, this.cameras.main);

    for (const enemy of this.enemyUnits) {
      enemy.setVisible(this.fogOfWar.isVisible(enemy.x, enemy.y));
    }

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

  private updateCameraPan(delta: number): void {
    const cam = this.cameras.main;
    const pointer = this.input.activePointer;
    // Convert wu/s to wu/ms, then multiply by delta (ms)
    const panSpeed = (this.CAMERA_SPEED / 1000) * delta;
    
    let cameraMoved = false;

    // WASD/Arrow keys - no acceleration
    if (this.cursors.left.isDown || this.wasdKeys.a.isDown) {
      cam.scrollX -= panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.right.isDown || this.wasdKeys.d.isDown) {
      cam.scrollX += panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.up.isDown || this.wasdKeys.w.isDown) {
      cam.scrollY -= panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.down.isDown || this.wasdKeys.s.isDown) {
      cam.scrollY += panSpeed;
      cameraMoved = true;
    }
    
    // Dismiss onboarding tip after first camera move
    if (cameraMoved && !this.onboardingShown && this.onboardingTip) {
      this.dismissOnboardingTip();
    }

    // Edge-pan: 2.5% of screen with min/max constraints
    if (this.pointerInWindow && !this.helpOverlay) {
      const edgeBandSize = Math.max(
        GAME_CONSTANTS.CAMERA_EDGE_PAN_MIN,
        Math.min(
          GAME_CONSTANTS.CAMERA_EDGE_PAN_MAX,
          this.scale.width * (GAME_CONSTANTS.CAMERA_EDGE_PAN_PERCENT / 100)
        )
      );

      if (pointer.x < edgeBandSize) {
        cam.scrollX -= panSpeed;
      } else if (pointer.x > this.scale.width - edgeBandSize) {
        cam.scrollX += panSpeed;
      }

      if (pointer.y < edgeBandSize) {
        cam.scrollY -= panSpeed;
      } else if (pointer.y > this.scale.height - edgeBandSize) {
        cam.scrollY += panSpeed;
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
    this.add.rectangle(400, 570, 700, 50, 0x000000, 0.85).setScrollFactor(0);
    
    this.selectedUnitText = this.add.text(120, 560, strings.battle.noneSelected, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    this.selectedHPText = this.add.text(550, 560, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    this.selectedHPBar = this.add.graphics().setScrollFactor(0);
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

  private centerCameraOnSelection(): void {
    if (this.selectedUnits.length === 0) return;

    const avgX = this.selectedUnits.reduce((sum, u) => sum + u.x, 0) / this.selectedUnits.length;
    const avgY = this.selectedUnits.reduce((sum, u) => sum + u.y, 0) / this.selectedUnits.length;

    this.cameras.main.pan(avgX, avgY, 500, 'Sine.easeInOut');
  }

  private stopSelectedUnits(): void {
    for (const unit of this.selectedUnits) {
      unit.targetEnemy = null;
      this.tweens.killTweensOf(unit);
    }
  }

  private assignControlGroup(groupNumber: number): void {
    // Only assign player units (never enemies)
    const playerOnlyUnits = this.selectedUnits.filter(unit => this.playerUnits.includes(unit));
    
    if (playerOnlyUnits.length > 0) {
      this.controlGroups.set(groupNumber, [...playerOnlyUnits]);
    }
  }

  private recallControlGroup(groupNumber: number): void {
    const group = this.controlGroups.get(groupNumber);
    if (!group) return; // Empty group = no-op

    // Filter out dead units
    const aliveUnits = group.filter(unit => unit.currentHp > 0 && this.playerUnits.includes(unit));
    
    // Update the stored group to remove dead units
    if (aliveUnits.length === 0) {
      this.controlGroups.delete(groupNumber); // Remove empty group
      return; // Empty group = no-op
    }
    
    this.controlGroups.set(groupNumber, aliveUnits);

    // Select the alive units
    this.clearSelection();
    for (const unit of aliveUnits) {
      unit.setSelected(true);
      this.selectedUnits.push(unit);
    }
  }

  private toggleHelpOverlay(): void {
    if (this.helpOverlay) {
      this.closeHelpOverlay();
    } else {
      this.showHelpOverlay();
    }
  }

  private showHelpOverlay(): void {
    this.helpOverlay = this.add.container(0, 0).setDepth(10000);
    
    // Dim overlay background
    const bg = this.add.rectangle(400, 300, 650, 520, 0x000000, 0.92).setScrollFactor(0);
    this.helpOverlay.add(bg);
    
    // Title
    const title = this.add.text(400, 70, strings.help.title, {
      fontSize: '28px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    this.helpOverlay.add(title);

    // Two-column layout: Key | Action
    let y = 120;
    const leftColX = 180; // Key column
    const rightColX = 380; // Action column
    const rowSpacing = 28;

    const addRow = (key: string, action: string) => {
      const keyText = this.add.text(leftColX, y, key, {
        fontSize: '15px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setScrollFactor(0);
      
      const actionText = this.add.text(rightColX, y, action, {
        fontSize: '15px',
        color: '#cccccc',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setScrollFactor(0);
      
      this.helpOverlay!.add(keyText);
      this.helpOverlay!.add(actionText);
      y += rowSpacing;
    };

    // Help rows in Hebrew
    addRow(strings.help.keyWasd, strings.help.actionWasd);
    addRow(strings.help.keyZoom, strings.help.actionZoom);
    addRow(strings.help.keyMinimap, strings.help.actionMinimap);
    y += 10; // Section spacing
    
    addRow(strings.help.keySelect, strings.help.actionSelect);
    addRow(strings.help.keyMove, strings.help.actionMove);
    addRow(strings.help.keyDeselect, strings.help.actionDeselect);
    y += 10;
    
    addRow('Ctrl+1-0', 'הקצאת קבוצת בקרה');
    addRow('1-0', 'קריאת קבוצת בקרה');
    y += 10;
    
    addRow('Space', 'מרכז על בחירה');
    addRow('F1 / ?', strings.help.openHint);
    
    // Fog legend line at bottom
    y += 20;
    const fogLegend = this.add.text(400, y, strings.fog.helpLine, {
      fontSize: '13px',
      color: '#888888',
      fontFamily: 'Arial',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.helpOverlay.add(fogLegend);

    // Close button
    y += 40;
    const closeBtn = this.add.rectangle(400, y, 140, 38, colors.player)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.helpOverlay.add(closeBtn);
    
    const closeText = this.add.text(400, y, strings.help.close, {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    this.helpOverlay.add(closeText);

    closeBtn.on('pointerdown', () => {
      this.closeHelpOverlay();
    });
  }

  private closeHelpOverlay(): void {
    if (this.helpOverlay) {
      this.helpOverlay.destroy();
      this.helpOverlay = null;
    }
  }

  private showOnboardingTip(text: string, x: number, y: number): void {
    this.onboardingTip = this.add.container(0, 0);
    
    const tip = this.add.rectangle(x, y, 650, 60, 0x000000, 0.85).setScrollFactor(0);
    const tipText = this.add.text(x, y - 10, text, {
      fontSize: '13px',
      color: '#ffcc00',
      align: 'center',
      wordWrap: { width: 600 },
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    const dismissBtn = this.add.rectangle(x, y + 20, 100, 25, 0x444444)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    const dismissText = this.add.text(x, y + 20, strings.onboard.dismiss, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.onboardingTip.add([tip, tipText, dismissBtn, dismissText]);

    dismissBtn.on('pointerdown', () => {
      this.dismissOnboardingTip();
    });
  }

  private dismissOnboardingTip(): void {
    if (this.onboardingTip) {
      this.onboardingTip.destroy();
      this.onboardingTip = null;
      this.onboardingShown = true;
    }
  }
}

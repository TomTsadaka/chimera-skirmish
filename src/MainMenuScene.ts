import Phaser from 'phaser';
import { AnimalArchetype, HybridCreature, ArmySlot } from './types';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';

export class MainMenuScene extends Phaser.Scene {
  private selectedAnimal1: AnimalArchetype | null = null;
  private selectedAnimal2: AnimalArchetype | null = null;
  private createdHybrids: HybridCreature[] = [];
  private armySlots: ArmySlot[] = [
    { hybrid: null, count: 0 },
    { hybrid: null, count: 0 },
    { hybrid: null, count: 0 }
  ];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.add.text(400, 30, 'CHIMERA SKIRMISH', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.showForgeUI();
  }

  private showForgeUI(): void {
    this.children.removeAll();

    this.add.text(400, 30, 'CHIMERA SKIRMISH', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 90, 'CREATURE FORGE - Select two animals to combine', {
      fontSize: '24px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    const gridStartX = 100;
    const gridStartY = 150;
    const spacing = 120;

    ANIMAL_ARCHETYPES.forEach((animal, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = gridStartX + col * spacing;
      const y = gridStartY + row * spacing;

      this.createAnimalCard(animal, x, y);
    });

    this.add.text(400, 430, 'Selected:', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    
    const selected1Text = this.selectedAnimal1 ? this.selectedAnimal1.name : '---';
    const selected2Text = this.selectedAnimal2 ? this.selectedAnimal2.name : '---';
    
    this.add.text(300, 470, `1: ${selected1Text}`, { fontSize: '18px', color: '#00ff00' }).setOrigin(0.5);
    this.add.text(500, 470, `2: ${selected2Text}`, { fontSize: '18px', color: '#00ff00' }).setOrigin(0.5);

    if (this.selectedAnimal1 && this.selectedAnimal2) {
      const fuseBtn = this.add.rectangle(400, 530, 150, 40, 0x00aa00)
        .setInteractive({ useHandCursor: true });
      this.add.text(400, 530, 'FUSE!', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      
      fuseBtn.on('pointerdown', () => {
        this.fuseAnimals();
      });
    }
  }

  private createAnimalCard(animal: AnimalArchetype, x: number, y: number): void {
    const isSelected = this.selectedAnimal1?.id === animal.id || this.selectedAnimal2?.id === animal.id;
    const color = isSelected ? 0xffff00 : 0x333333;
    
    const card = this.add.rectangle(x, y, 100, 100, color)
      .setInteractive({ useHandCursor: true });

    const graphics = this.add.graphics();
    graphics.fillStyle(parseInt(animal.primaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x, y - 10, 20);
    graphics.fillStyle(parseInt(animal.secondaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x - 10, y + 10, 15);

    this.add.text(x, y + 40, animal.name, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

    card.on('pointerdown', () => {
      if (!this.selectedAnimal1) {
        this.selectedAnimal1 = animal;
      } else if (!this.selectedAnimal2 && this.selectedAnimal1.id !== animal.id) {
        this.selectedAnimal2 = animal;
      } else {
        this.selectedAnimal1 = animal;
        this.selectedAnimal2 = null;
      }
      this.showForgeUI();
    });
  }

  private fuseAnimals(): void {
    if (!this.selectedAnimal1 || !this.selectedAnimal2) return;

    const hybrid = GameData.createHybrid(this.selectedAnimal1, this.selectedAnimal2);
    this.createdHybrids.push(hybrid);

    this.selectedAnimal1 = null;
    this.selectedAnimal2 = null;

    this.showArmyUI();
  }

  private showArmyUI(): void {
    this.children.removeAll();

    this.add.text(400, 30, 'CHIMERA SKIRMISH', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 90, 'BUILD YOUR ARMY', {
      fontSize: '24px',
      color: '#ffcc00'
    }).setOrigin(0.5);

    this.add.text(100, 130, 'Your Hybrids:', { fontSize: '20px', color: '#ffffff' });

    this.createdHybrids.forEach((hybrid, index) => {
      const y = 170 + index * 80;
      this.createHybridInfo(hybrid, 100, y);
      
      this.add.text(400, y + 10, 'Add to army:', { fontSize: '16px', color: '#ffffff' });

      for (let slot = 0; slot < 3; slot++) {
        const slotX = 520 + slot * 60;
        const slotBtn = this.add.rectangle(slotX, y + 10, 50, 30, 0x0066cc)
          .setInteractive({ useHandCursor: true });
        this.add.text(slotX, y + 10, `Slot ${slot + 1}`, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
        
        slotBtn.on('pointerdown', () => {
          this.armySlots[slot].hybrid = hybrid;
          this.armySlots[slot].count = Math.min(4, this.armySlots[slot].count + 1);
          this.showArmyUI();
        });
      }
    });

    const totalUnits = this.armySlots.reduce((sum, slot) => sum + slot.count, 0);
    this.add.text(100, 420, `Army Composition (${totalUnits}/12 units):`, { fontSize: '20px', color: '#ffffff' });

    this.armySlots.forEach((slot, index) => {
      if (slot.hybrid) {
        const y = 460 + index * 40;
        this.add.text(120, y, `Slot ${index + 1}: ${slot.hybrid.name} x${slot.count}`, {
          fontSize: '16px',
          color: '#00ff00'
        });
      }
    });

    const hasUnits = this.armySlots.some(slot => slot.count > 0);

    if (hasUnits) {
      const battleBtn = this.add.rectangle(400, 540, 200, 50, 0x00aa00)
        .setInteractive({ useHandCursor: true });
      this.add.text(400, 540, 'START BATTLE!', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      
      battleBtn.on('pointerdown', () => {
        this.startBattle();
      });
    }

    const backBtn = this.add.rectangle(100, 540, 150, 40, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.add.text(100, 540, 'Create More', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    
    backBtn.on('pointerdown', () => {
      this.showForgeUI();
    });
  }

  private createHybridInfo(hybrid: HybridCreature, x: number, y: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(parseInt(hybrid.primaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x + 20, y + 10, 15);
    graphics.fillStyle(parseInt(hybrid.secondaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x + 10, y + 20, 10);

    this.add.text(x + 50, y, hybrid.name, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(x + 50, y + 20, `HP:${hybrid.hp} ATK:${hybrid.attack} SPD:${hybrid.speed} RNG:${hybrid.attackRange}`, {
      fontSize: '12px',
      color: '#aaaaaa'
    });
    this.add.text(x + 50, y + 35, `Type: ${hybrid.specialTag}`, {
      fontSize: '11px',
      color: '#ffaa00'
    });
  }

  private startBattle(): void {
    this.scene.start('BattleScene', { armySlots: this.armySlots });
  }
}

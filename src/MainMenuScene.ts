import Phaser from 'phaser';
import { AnimalArchetype, HybridCreature } from './types';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';
import { strings } from './i18n';

export class MainMenuScene extends Phaser.Scene {
  private selectedAnimal1: AnimalArchetype | null = null;
  private selectedAnimal2: AnimalArchetype | null = null;
  private currentHybrid: HybridCreature | null = null;
  private onboardingShown: boolean = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.add.text(400, 30, strings.forge.title, {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.showForgeUI();
    
    if (!this.onboardingShown) {
      this.showOnboardingTip(strings.onboard.forge, 400, 520);
    }
  }

  private showForgeUI(): void {
    this.children.removeAll();

    this.add.text(400, 30, strings.forge.title, {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const gridStartX = 80;
    const gridStartY = 120;
    const spacing = 110;

    ANIMAL_ARCHETYPES.forEach((animal, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = gridStartX + col * spacing + (col >= 2 ? 120 : 0);
      const y = gridStartY + row * spacing;

      this.createAnimalCard(animal, x, y);
    });

    this.add.text(400, 390, strings.forge.slotEmpty + ' 1:', { 
      fontSize: '18px', 
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    const selected1Text = this.selectedAnimal1 ? this.selectedAnimal1.nameHebrew : '---';
    this.add.text(400, 415, selected1Text, { 
      fontSize: '20px', 
      color: '#2DD4BF',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(400, 445, strings.forge.slotEmpty + ' 2:', { 
      fontSize: '18px', 
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    const selected2Text = this.selectedAnimal2 ? this.selectedAnimal2.nameHebrew : '---';
    this.add.text(400, 470, selected2Text, { 
      fontSize: '20px', 
      color: '#2DD4BF',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    if (this.selectedAnimal1 && this.selectedAnimal2) {
      const mergeBtn = this.add.rectangle(400, 520, 120, 40, 0x00aa00)
        .setInteractive({ useHandCursor: true });
      this.add.text(400, 520, strings.forge.merge, { 
        fontSize: '22px', 
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      mergeBtn.on('pointerdown', () => {
        this.fuseAnimals();
      });

      const resetBtn = this.add.rectangle(280, 520, 100, 40, 0x666666)
        .setInteractive({ useHandCursor: true });
      this.add.text(280, 520, strings.forge.reset, { 
        fontSize: '16px', 
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      resetBtn.on('pointerdown', () => {
        this.selectedAnimal1 = null;
        this.selectedAnimal2 = null;
        this.currentHybrid = null;
        this.showForgeUI();
      });
    } else if (this.selectedAnimal1 || this.selectedAnimal2) {
      this.add.text(400, 520, strings.forge.mergeDisabledHint, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    if (this.currentHybrid) {
      this.showHybridPreview(this.currentHybrid, 400, 320);
      
      const deployBtn = this.add.rectangle(520, 520, 140, 40, 0x2DD4BF)
        .setInteractive({ useHandCursor: true });
      this.add.text(520, 520, strings.forge.toDeploy, { 
        fontSize: '20px', 
        color: '#000000',
        fontStyle: 'bold',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      deployBtn.on('pointerdown', () => {
        this.scene.start('DeployScene', { hybrid: this.currentHybrid });
      });

      if (!this.onboardingShown) {
        this.showOnboardingTip(strings.onboard.afterMerge, 400, 560);
        this.onboardingShown = true;
      }
    }
  }

  private createAnimalCard(animal: AnimalArchetype, x: number, y: number): void {
    const isSelected = this.selectedAnimal1?.id === animal.id || this.selectedAnimal2?.id === animal.id;
    const color = isSelected ? 0xffff00 : 0x333333;
    
    const card = this.add.rectangle(x, y, 95, 95, color)
      .setInteractive({ useHandCursor: true });

    const graphics = this.add.graphics();
    graphics.fillStyle(parseInt(animal.primaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x, y - 10, 18);
    graphics.fillStyle(parseInt(animal.secondaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x - 10, y + 10, 13);

    this.add.text(x, y + 35, animal.nameHebrew, { 
      fontSize: '11px', 
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

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
    this.currentHybrid = hybrid;

    this.selectedAnimal1 = null;
    this.selectedAnimal2 = null;

    this.showForgeUI();
  }

  private showHybridPreview(hybrid: HybridCreature, x: number, y: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(parseInt(hybrid.primaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x, y, 25);
    graphics.fillStyle(parseInt(hybrid.secondaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x - 15, y + 15, 18);

    this.add.text(x, y - 40, hybrid.name, { 
      fontSize: '20px', 
      color: '#ffffff', 
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.add.text(x, y + 45, `${strings.stat.hp}:${hybrid.hp} ${strings.stat.atk}:${hybrid.attack} ${strings.stat.spd}:${hybrid.speed}`, {
      fontSize: '13px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private showOnboardingTip(text: string, x: number, y: number): void {
    const tip = this.add.rectangle(x, y, 650, 60, 0x000000, 0.85);
    const tipText = this.add.text(x, y - 10, text, {
      fontSize: '14px',
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

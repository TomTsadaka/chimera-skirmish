import Phaser from 'phaser';
import { AnimalArchetype, HybridCreature } from './types';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';
import { strings } from './i18n';

export class MainMenuScene extends Phaser.Scene {
  private selectedAnimal1: AnimalArchetype | null = null;
  private selectedAnimal2: AnimalArchetype | null = null;
  private currentHybrid: HybridCreature | null = null;
  private armyRoster: HybridCreature[] = []; // Army list (up to 9)
  private readonly MAX_ARMY_SIZE = 9;
  private onboardingShown: boolean = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // Load army roster from registry if it exists
    const savedArmy = this.registry.get('armyRoster');
    if (savedArmy && Array.isArray(savedArmy)) {
      this.armyRoster = savedArmy;
    }
    
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
      
      const canAddToArmy = this.armyRoster.length < this.MAX_ARMY_SIZE;
      
      if (canAddToArmy) {
        const addToArmyBtn = this.add.rectangle(400, 520, 180, 40, 0x2DD4BF)
          .setInteractive({ useHandCursor: true });
        this.add.text(400, 520, 'הוסף לרשימה', { 
          fontSize: '18px', 
          color: '#000000',
          fontStyle: 'bold',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        addToArmyBtn.on('pointerdown', () => {
          if (this.currentHybrid) {
            this.armyRoster.push(this.currentHybrid);
            this.registry.set('armyRoster', this.armyRoster);
            this.currentHybrid = null;
            this.showForgeUI();
          }
        });
      } else {
        this.add.text(400, 520, 'הרשימה מלאה (9/9)', {
          fontSize: '16px',
          color: '#ff6666',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
      }

      if (!this.onboardingShown) {
        this.showOnboardingTip(strings.onboard.afterMerge, 400, 560);
        this.onboardingShown = true;
      }
    }
    
    // Show army roster on the right side
    this.showArmyRoster();
    
    // Show "To Battle" button if army has at least 1 unit
    if (this.armyRoster.length > 0) {
      const deployBtn = this.add.rectangle(680, 550, 140, 40, 0xF97316)
        .setInteractive({ useHandCursor: true });
      this.add.text(680, 550, 'לקרב', { 
        fontSize: '20px', 
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      
      deployBtn.on('pointerdown', () => {
        this.scene.start('DeployScene', { armyRoster: this.armyRoster });
      });
    }
  }
  
  private showArmyRoster(): void {
    const rosterX = 640;
    const rosterY = 120;
    
    this.add.rectangle(rosterX, rosterY - 40, 200, 30, 0x000000, 0.7);
    this.add.text(rosterX, rosterY - 40, `רשימת צבא (${this.armyRoster.length}/${this.MAX_ARMY_SIZE})`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    for (let i = 0; i < this.MAX_ARMY_SIZE; i++) {
      const slotY = rosterY + i * 45;
      const hybrid = this.armyRoster[i];
      
      if (hybrid) {
        // Show filled slot
        this.add.rectangle(rosterX, slotY, 190, 40, 0x2DD4BF, 0.3)
          .setStrokeStyle(2, 0x2DD4BF);
        
        // Mini preview circle
        const graphics = this.add.graphics();
        graphics.fillStyle(parseInt(hybrid.primaryColor.replace('#', '0x')), 1);
        graphics.fillCircle(rosterX - 70, slotY, 12);
        graphics.fillStyle(parseInt(hybrid.secondaryColor.replace('#', '0x')), 1);
        graphics.fillCircle(rosterX - 75, slotY + 5, 8);
        
        this.add.text(rosterX - 50, slotY, hybrid.name, {
          fontSize: '12px',
          color: '#ffffff',
          fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        // Remove button
        const removeBtn = this.add.text(rosterX + 80, slotY, 'X', {
          fontSize: '16px',
          color: '#ff6666',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        removeBtn.on('pointerdown', () => {
          this.armyRoster.splice(i, 1);
          this.registry.set('armyRoster', this.armyRoster);
          this.showForgeUI();
        });
      } else {
        // Show empty slot
        this.add.rectangle(rosterX, slotY, 190, 40, 0x333333, 0.3)
          .setStrokeStyle(1, 0x666666);
        this.add.text(rosterX, slotY, '---', {
          fontSize: '16px',
          color: '#666666',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
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

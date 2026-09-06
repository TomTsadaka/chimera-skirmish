import Phaser from 'phaser';
import { HybridCreature } from './types';
import { strings, colors } from './i18n';

export class DeployScene extends Phaser.Scene {
  private onboardingShown: boolean = false;

  constructor() {
    super({ key: 'DeployScene' });
  }

  create(data: { armyRoster: HybridCreature[] }): void {
    const armyRoster = data.armyRoster || [];
    
    if (armyRoster.length === 0) {
      // No army, go back to forge
      this.scene.start('MainMenuScene');
      return;
    }

    this.add.text(400, 30, strings.deploy.title, {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.rectangle(200, 300, 280, 450, 0x1a1a2e, 0.9);
    this.add.text(200, 100, strings.deploy.you, {
      fontSize: '28px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Show army roster on left
    this.add.text(200, 135, `${armyRoster.length} יחידות`, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Show first 3 hybrids as preview
    for (let i = 0; i < Math.min(3, armyRoster.length); i++) {
      const hybrid = armyRoster[i];
      const y = 180 + i * 100;
      
      const graphics = this.add.graphics();
      graphics.fillStyle(parseInt(hybrid.primaryColor.replace('#', '0x')), 1);
      graphics.fillCircle(200, y, 20);
      graphics.fillStyle(parseInt(hybrid.secondaryColor.replace('#', '0x')), 1);
      graphics.fillCircle(190, y + 10, 14);
      
      this.add.text(200, y + 35, hybrid.name, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: 150 }
      }).setOrigin(0.5);
    }
    
    if (armyRoster.length > 3) {
      this.add.text(200, 480, `+${armyRoster.length - 3} עוד`, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    this.add.rectangle(600, 300, 280, 350, 0x1a1a2e, 0.9);
    this.add.text(600, 150, strings.deploy.rival, {
      fontSize: '28px',
      color: colors.rivalHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(600, 250, '???', {
      fontSize: '48px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add.text(600, 310, 'AI יריב', {
      fontSize: '18px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const startBtn = this.add.rectangle(400, 500, 180, 50, colors.player)
      .setInteractive({ useHandCursor: true });
    this.add.text(400, 500, strings.deploy.start, {
      fontSize: '24px',
      color: '#000000',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    startBtn.on('pointerdown', () => {
      this.scene.start('BattleScene', { armyRoster: armyRoster });
    });

    const backBtn = this.add.rectangle(400, 560, 160, 40, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.add.text(400, 560, strings.deploy.back, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    if (!this.onboardingShown) {
      this.showOnboardingTip(strings.onboard.deploy, 400, 430);
    }
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

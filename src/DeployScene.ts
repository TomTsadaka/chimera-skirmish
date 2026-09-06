import Phaser from 'phaser';
import { HybridCreature } from './types';
import { strings, colors } from './i18n';

export class DeployScene extends Phaser.Scene {
  private hybrid!: HybridCreature;
  private onboardingShown: boolean = false;

  constructor() {
    super({ key: 'DeployScene' });
  }

  create(data: { hybrid: HybridCreature }): void {
    this.hybrid = data.hybrid;

    this.add.text(400, 30, strings.deploy.title, {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.rectangle(200, 300, 280, 350, 0x1a1a2e, 0.9);
    this.add.text(200, 150, strings.deploy.you, {
      fontSize: '28px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.showHybridCard(this.hybrid, 200, 300);

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
    this.add.text(600, 310, '3-6 יריבים', {
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
      this.scene.start('BattleScene', { hybrid: this.hybrid });
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

  private showHybridCard(hybrid: HybridCreature, x: number, y: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(parseInt(hybrid.primaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x, y - 60, 30);
    graphics.fillStyle(parseInt(hybrid.secondaryColor.replace('#', '0x')), 1);
    graphics.fillCircle(x - 20, y - 40, 22);

    this.add.text(x, y - 10, hybrid.name, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const statY = y + 20;
    const lineHeight = 28;

    this.add.text(x - 80, statY, strings.stat.hp, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    this.add.text(x + 40, statY, hybrid.hp.toString(), {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    this.add.text(x - 80, statY + lineHeight, strings.stat.atk, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    this.add.text(x + 40, statY + lineHeight, hybrid.attack.toString(), {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    this.add.text(x - 80, statY + lineHeight * 2, strings.stat.spd, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    this.add.text(x + 40, statY + lineHeight * 2, hybrid.speed.toString(), {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    this.add.text(x, statY + lineHeight * 3.5, strings.stat.tag + ':', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(x, statY + lineHeight * 4.2, hybrid.specialPrimary, {
      fontSize: '12px',
      color: '#ffaa00',
      wordWrap: { width: 240 },
      align: 'center',
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

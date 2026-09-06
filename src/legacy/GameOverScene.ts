import Phaser from 'phaser';
import { strings, colors } from './i18n';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { victory: boolean; message?: string }): void {
    const { victory, message } = data;

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

    const title = victory ? strings.win.title : strings.lose.title;
    const color = victory ? colors.playerHex : colors.rivalHex;
    
    this.add.text(400, 180, title, {
      fontSize: '64px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Show custom message if provided
    if (message) {
      this.add.text(400, 260, message, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5);
    }

    const againBtn = this.add.rectangle(400, 360, 200, 50, colors.player)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(400, 360, strings.battle.again, {
      fontSize: '24px',
      color: '#000000',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    againBtn.on('pointerover', () => {
      againBtn.setFillStyle(0x3FE8D4);
    });

    againBtn.on('pointerout', () => {
      againBtn.setFillStyle(colors.player);
    });

    againBtn.on('pointerdown', () => {
      const armyRoster = this.registry.get('armyRoster');
      if (armyRoster && armyRoster.length > 0) {
        this.scene.start('DeployScene', { armyRoster: armyRoster });
      } else {
        const lastHybrid = this.registry.get('lastHybrid');
        if (lastHybrid) {
          this.scene.start('DeployScene', { armyRoster: [lastHybrid] });
        } else {
          this.scene.start('MainMenuScene');
        }
      }
    });

    const forgeBtn = this.add.rectangle(400, 430, 200, 50, 0x666666)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(400, 430, strings.battle.forge, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    forgeBtn.on('pointerover', () => {
      forgeBtn.setFillStyle(0x888888);
    });

    forgeBtn.on('pointerout', () => {
      forgeBtn.setFillStyle(0x666666);
    });

    forgeBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}

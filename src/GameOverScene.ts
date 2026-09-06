import Phaser from 'phaser';
import { strings, colors } from './i18n';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { victory: boolean }): void {
    const { victory } = data;

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

    const title = victory ? strings.battle.win : strings.battle.lose;
    const color = victory ? colors.playerHex : colors.rivalHex;
    
    this.add.text(400, 200, title, {
      fontSize: '64px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const againBtn = this.add.rectangle(400, 340, 200, 50, colors.player)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(400, 340, strings.battle.again, {
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
      this.scene.start('DeployScene', this.registry.get('lastHybrid'));
    });

    const forgeBtn = this.add.rectangle(400, 410, 200, 50, 0x666666)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(400, 410, strings.battle.forge, {
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

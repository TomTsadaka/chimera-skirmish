import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { victory: boolean }): void {
    const { victory } = data;

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

    const title = victory ? 'VICTORY!' : 'DEFEAT';
    const color = victory ? '#00ff00' : '#ff0000';
    
    this.add.text(400, 200, title, {
      fontSize: '64px',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const message = victory 
      ? 'Your chimeras have conquered the battlefield!'
      : 'Your army has been defeated...';
    
    this.add.text(400, 280, message, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const restartBtn = this.add.rectangle(400, 380, 200, 50, 0x0066cc)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(400, 380, 'PLAY AGAIN', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtn.on('pointerover', () => {
      restartBtn.setFillStyle(0x0088ff);
    });

    restartBtn.on('pointerout', () => {
      restartBtn.setFillStyle(0x0066cc);
    });

    restartBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}

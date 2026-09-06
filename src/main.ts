import Phaser from 'phaser';
import { MainMenuScene } from './MainMenuScene';
import { DeployScene } from './DeployScene';
import { BattleScene } from './BattleScene';
import { GameOverScene } from './GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [MainMenuScene, DeployScene, BattleScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

import Phaser from 'phaser';
import { GAME_CONSTANTS } from './constants';

export class Building extends Phaser.GameObjects.Container {
  public currentHp: number;
  public maxHp: number;
  public team: 'player' | 'enemy';
  public buildingType: 'hq';
  
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    team: 'player' | 'enemy',
    label: string
  ) {
    super(scene, x, y);
    
    this.team = team;
    this.buildingType = 'hq';
    this.maxHp = GAME_CONSTANTS.HQ_HP;
    this.currentHp = this.maxHp;

    this.bodyGraphics = new Phaser.GameObjects.Graphics(scene);
    this.drawBody();
    this.add(this.bodyGraphics);

    this.labelText = new Phaser.GameObjects.Text(scene, 0, -GAME_CONSTANTS.HQ_SIZE / 2 - 15, label, {
      fontSize: '14px',
      color: team === 'player' ? '#2DD4BF' : '#F97316',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add(this.labelText);

    this.hpBar = new Phaser.GameObjects.Graphics(scene);
    this.updateHpBar();
    this.add(this.hpBar);

    (scene.add as any).existing(this);
  }

  private drawBody(): void {
    this.bodyGraphics.clear();
    
    const size = GAME_CONSTANTS.HQ_SIZE / 2;
    const color = this.team === 'player' ? 0x2DD4BF : 0xF97316;
    
    // Main building body
    this.bodyGraphics.fillStyle(color, 0.8);
    this.bodyGraphics.fillRect(-size, -size, size * 2, size * 2);
    
    // Border
    this.bodyGraphics.lineStyle(3, color, 1);
    this.bodyGraphics.strokeRect(-size, -size, size * 2, size * 2);
    
    // Center emblem
    this.bodyGraphics.fillStyle(0xFFFFFF, 0.9);
    this.bodyGraphics.fillCircle(0, 0, size * 0.4);
    
    // Cross pattern
    this.bodyGraphics.lineStyle(2, color, 1);
    this.bodyGraphics.lineBetween(-size * 0.3, 0, size * 0.3, 0);
    this.bodyGraphics.lineBetween(0, -size * 0.3, 0, size * 0.3);
  }

  private updateHpBar(): void {
    this.hpBar.clear();
    const barWidth = GAME_CONSTANTS.HQ_SIZE;
    const barHeight = 6;
    const hpPercent = this.currentHp / this.maxHp;
    
    const barY = GAME_CONSTANTS.HQ_SIZE / 2 + 10;
    
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    
    let color: number;
    if (hpPercent > 0.5) {
      color = 0x00ff00;
    } else if (hpPercent > 0.25) {
      color = 0xffff00;
    } else {
      color = 0xff0000;
    }
    
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
  }

  takeDamage(damage: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - damage);
    this.updateHpBar();
    
    if (this.currentHp <= 0) {
      return true; // Building destroyed
    }
    return false;
  }

  public getDropOffPoint(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}

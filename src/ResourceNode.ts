import Phaser from 'phaser';
import { ResourceNode as ResourceNodeType } from './types';

export class ResourceNode extends Phaser.GameObjects.Container {
  public nodeData: ResourceNodeType;
  
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private amountText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, nodeData: ResourceNodeType) {
    super(scene, nodeData.x, nodeData.y);
    
    this.nodeData = nodeData;

    this.bodyGraphics = new Phaser.GameObjects.Graphics(scene);
    this.add(this.bodyGraphics);

    // Hebrew label "ביומסה" for high visibility
    this.labelText = new Phaser.GameObjects.Text(scene, 0, -45, 'ביומסה', {
      fontSize: '14px',
      color: '#FFD700', // Gold
      fontStyle: 'bold',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.labelText);

    this.amountText = new Phaser.GameObjects.Text(scene, 0, 0, `${nodeData.amount}`, {
      fontSize: '16px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add(this.amountText);

    (scene.add as any).existing(this);
    
    // Initial draw
    this.drawBody();
    
    // Update animation for pulsing effect
    scene.events.on('update', this.onUpdate, this);
  }
  
  private onUpdate = (): void => {
    this.drawBody();
  };

  private drawBody(): void {
    this.bodyGraphics.clear();
    
    // High-contrast bright green/gold resource pile
    const fillColor = 0x22FF55; // Bright vibrant green
    const outlineColor = 0xFFD700; // Gold outline
    const size = 30; // Larger for visibility
    
    // Pulsing effect for visibility
    const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
    
    // Gold outline
    this.bodyGraphics.lineStyle(3, outlineColor, 1);
    // Bright green fill
    this.bodyGraphics.fillStyle(fillColor, 0.9);
    
    // Draw resource pile as hexagon (more distinct than circle)
    this.bodyGraphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * size * pulseScale;
      const y = Math.sin(angle) * size * pulseScale;
      if (i === 0) {
        this.bodyGraphics.moveTo(x, y);
      } else {
        this.bodyGraphics.lineTo(x, y);
      }
    }
    this.bodyGraphics.closePath();
    this.bodyGraphics.fillPath();
    this.bodyGraphics.strokePath();
    
    // Add inner glow effect
    this.bodyGraphics.fillStyle(0xFFFFFF, 0.3);
    this.bodyGraphics.fillCircle(0, 0, size * 0.5 * pulseScale);
  }

  public gather(amount: number): number {
    const actualAmount = Math.min(amount, this.nodeData.amount);
    this.nodeData.amount -= actualAmount;
    this.updateDisplay();
    return actualAmount;
  }

  private updateDisplay(): void {
    this.amountText.setText(`${this.nodeData.amount}`);
    
    if (this.nodeData.amount <= 0) {
      this.setAlpha(0.3);
    }
  }

  public isEmpty(): boolean {
    return this.nodeData.amount <= 0;
  }

  public refill(): void {
    this.nodeData.amount = this.nodeData.maxAmount;
    this.setAlpha(1);
    this.updateDisplay();
  }
  
  destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.events.off('update', this.onUpdate, this);
    }
    super.destroy(fromScene);
  }
}

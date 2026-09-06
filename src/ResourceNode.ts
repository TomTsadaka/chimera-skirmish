import Phaser from 'phaser';
import { ResourceNode as ResourceNodeType } from './types';

export class ResourceNode extends Phaser.GameObjects.Container {
  public nodeData: ResourceNodeType;
  
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private amountText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    nodeData: ResourceNodeType
  ) {
    super(scene, nodeData.x, nodeData.y);
    
    this.nodeData = nodeData;

    this.bodyGraphics = new Phaser.GameObjects.Graphics(scene);
    this.drawBody();
    this.add(this.bodyGraphics);

    const label = 'B'; // Biomass only
    this.labelText = new Phaser.GameObjects.Text(scene, 0, -5, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add(this.labelText);

    this.amountText = new Phaser.GameObjects.Text(scene, 0, 28, `${nodeData.amount}`, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add(this.amountText);

    (scene.add as any).existing(this);
  }

  private drawBody(): void {
    this.bodyGraphics.clear();
    
    const size = this.nodeData.type === 'biomass' ? 20 : 20;
    const color = 0x22C55E; // Green for biomass
    
    // Main resource node
    this.bodyGraphics.fillStyle(color, 0.7);
    this.bodyGraphics.fillCircle(0, 0, size);
    
    // Inner glow
    this.bodyGraphics.fillStyle(0xFFFFFF, 0.3);
    this.bodyGraphics.fillCircle(0, 0, size * 0.6);
    
    // Border
    this.bodyGraphics.lineStyle(2, color, 1);
    this.bodyGraphics.strokeCircle(0, 0, size);
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
}

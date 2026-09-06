import Phaser from 'phaser';
import { HybridCreature } from './types';

export class Unit extends Phaser.GameObjects.Container {
  public creature: HybridCreature;
  public currentHp: number;
  public team: 'player' | 'enemy';
  public isSelected: boolean = false;
  public targetEnemy: Unit | null = null;
  
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private selectionCircle: Phaser.GameObjects.Arc;
  private attackCooldown: number = 0;
  private readonly ATTACK_COOLDOWN_MS = 1000;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    creature: HybridCreature,
    team: 'player' | 'enemy'
  ) {
    super(scene, x, y);
    
    this.creature = creature;
    this.currentHp = creature.hp;
    this.team = team;

    this.selectionCircle = new Phaser.GameObjects.Arc(scene, 0, 0, 25, 0, 360, false, 0x00ff00, 0);
    this.add(this.selectionCircle);

    this.bodyGraphics = new Phaser.GameObjects.Graphics(scene);
    this.drawBody();
    this.add(this.bodyGraphics);

    this.hpBar = new Phaser.GameObjects.Graphics(scene);
    this.updateHpBar();
    this.add(this.hpBar);

    (scene.add as any).existing(this);
  }

  private drawBody(): void {
    this.bodyGraphics.clear();
    
    const size = 20;
    this.bodyGraphics.fillStyle(parseInt(this.creature.primaryColor.replace('#', '0x')), 1);
    this.bodyGraphics.fillCircle(0, 0, size);
    
    this.bodyGraphics.fillStyle(parseInt(this.creature.secondaryColor.replace('#', '0x')), 1);
    this.bodyGraphics.fillCircle(-8, -8, size * 0.4);
    this.bodyGraphics.fillCircle(8, 8, size * 0.4);

    if (this.team === 'enemy') {
      this.bodyGraphics.lineStyle(2, 0xff0000, 1);
      this.bodyGraphics.strokeCircle(0, 0, size);
    }
  }

  private updateHpBar(): void {
    this.hpBar.clear();
    const barWidth = 40;
    const barHeight = 4;
    const hpPercent = this.currentHp / this.creature.hp;
    
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-barWidth / 2, -30, barWidth, barHeight);
    
    let color: number;
    if (hpPercent > 0.5) {
      color = 0x00ff00;
    } else if (hpPercent > 0.25) {
      color = 0xffff00;
    } else {
      color = 0xff0000;
    }
    
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(-barWidth / 2, -30, barWidth * hpPercent, barHeight);
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (this.currentHp > 0) {
      this.selectionCircle.setStrokeStyle(3, 0x00ff00, selected ? 1 : 0);
    } else {
      this.selectionCircle.setStrokeStyle(0, 0x00ff00, 0);
    }
  }

  takeDamage(damage: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - damage);
    this.updateHpBar();
    
    if (this.currentHp <= 0) {
      this.setSelected(false);
      return true;
    }
    return false;
  }

  moveToPosition(targetX: number, targetY: number): void {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const duration = (distance / (this.creature.speed * 10)) * 1000;
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear'
    });
  }

  attackTarget(target: Unit): void {
    if (this.attackCooldown > 0) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const effectiveRange = this.creature.range * 30;
    
    if (distance <= effectiveRange) {
      const killed = target.takeDamage(this.creature.attack);
      this.attackCooldown = this.ATTACK_COOLDOWN_MS;
      
      if (this.creature.range > 2) {
        this.showProjectile(target);
      }
      
      if (killed) {
        this.targetEnemy = null;
      }
    }
  }

  private showProjectile(target: Unit): void {
    const projectile = this.scene.add.circle(this.x, this.y, 4, 0xffff00);
    this.scene.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      duration: 200,
      onComplete: () => projectile.destroy()
    });
  }

  update(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    }
  }

  findNearestEnemy(enemies: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }

    return nearest;
  }
}

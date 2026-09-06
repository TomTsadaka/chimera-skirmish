import Phaser from 'phaser';
import { Unit } from './Unit';
import { colors, strings } from './i18n';

export class Minimap {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private mapGraphics: Phaser.GameObjects.Graphics;
  private viewportRect: Phaser.GameObjects.Rectangle;
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  
  private readonly MINIMAP_SIZE = 180; // Square minimap
  private readonly MINIMAP_X = 610; // Bottom-start (right in RTL)
  private readonly MINIMAP_Y = 510;
  
  private scaleX: number;
  private scaleY: number;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.scene = scene;
    
    this.scaleX = this.MINIMAP_SIZE / mapWidth;
    this.scaleY = this.MINIMAP_SIZE / mapHeight;

    this.container = scene.add.container(this.MINIMAP_X, this.MINIMAP_Y).setScrollFactor(0).setDepth(2000);

    // Background with slight transparency
    this.bg = scene.add.rectangle(0, 0, this.MINIMAP_SIZE, this.MINIMAP_SIZE, 0x000000, 0.7)
      .setOrigin(0, 0);
    
    // Label above minimap
    this.label = scene.add.text(this.MINIMAP_SIZE / 2, -20, strings.minimap.label, {
      fontSize: '14px',
      color: colors.playerHex,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5, 1);
    
    this.mapGraphics = scene.add.graphics();
    
    this.viewportRect = scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0xffffff, 1)
      .setOrigin(0, 0);

    this.container.add([this.bg, this.mapGraphics, this.viewportRect, this.label]);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', this.onMinimapClick, this);
  }

  update(playerUnits: Unit[], enemyUnits: Unit[], camera: Phaser.Cameras.Scene2D.Camera): void {
    this.mapGraphics.clear();

    // Draw player units (always visible)
    for (const unit of playerUnits) {
      const x = unit.x * this.scaleX;
      const y = unit.y * this.scaleY;
      this.mapGraphics.fillStyle(colors.player, 1);
      this.mapGraphics.fillCircle(x, y, 3);
    }

    // Draw enemy units (only if visible)
    for (const unit of enemyUnits) {
      if (unit.visible) {
        const x = unit.x * this.scaleX;
        const y = unit.y * this.scaleY;
        this.mapGraphics.fillStyle(colors.rival, 1);
        this.mapGraphics.fillCircle(x, y, 3);
      }
    }

    // Draw camera viewport rectangle
    const viewX = camera.scrollX * this.scaleX;
    const viewY = camera.scrollY * this.scaleY;
    const viewWidth = (camera.width / camera.zoom) * this.scaleX;
    const viewHeight = (camera.height / camera.zoom) * this.scaleY;

    this.viewportRect.setPosition(viewX, viewY);
    this.viewportRect.setSize(viewWidth, viewHeight);
  }

  private onMinimapClick(pointer: Phaser.Input.Pointer): void {
    const cam = this.scene.cameras.main;
    const screenX = pointer.x - cam.worldView.x;
    const screenY = pointer.y - cam.worldView.y;
    
    const localX = screenX - this.MINIMAP_X;
    const localY = screenY - this.MINIMAP_Y;

    if (localX < 0 || localX > this.MINIMAP_SIZE || localY < 0 || localY > this.MINIMAP_SIZE) {
      return;
    }

    const worldX = localX / this.scaleX;
    const worldY = localY / this.scaleY;

    // Camera jump only (not unit orders)
    cam.pan(worldX, worldY, 300, 'Sine.easeOut');
  }

  destroy(): void {
    this.container.destroy();
  }
}

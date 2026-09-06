import Phaser from 'phaser';
import { Unit } from './Unit';
import { colors } from './i18n';

export class Minimap {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private mapGraphics: Phaser.GameObjects.Graphics;
  private viewportRect: Phaser.GameObjects.Rectangle;
  private bg: Phaser.GameObjects.Rectangle;
  
  private readonly MINIMAP_WIDTH = 180;
  private readonly MINIMAP_HEIGHT = 135;
  private readonly MINIMAP_X = 610;
  private readonly MINIMAP_Y = 510;
  
  private scaleX: number;
  private scaleY: number;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.scene = scene;
    
    this.scaleX = this.MINIMAP_WIDTH / mapWidth;
    this.scaleY = this.MINIMAP_HEIGHT / mapHeight;

    this.container = scene.add.container(this.MINIMAP_X, this.MINIMAP_Y).setScrollFactor(0).setDepth(2000);

    this.bg = scene.add.rectangle(0, 0, this.MINIMAP_WIDTH, this.MINIMAP_HEIGHT, 0x000000, 0.7)
      .setOrigin(0, 0);
    
    this.mapGraphics = scene.add.graphics();
    
    this.viewportRect = scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0xffffff, 1)
      .setOrigin(0, 0);

    this.container.add([this.bg, this.mapGraphics, this.viewportRect]);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', this.onMinimapClick, this);
  }

  update(playerUnits: Unit[], enemyUnits: Unit[], camera: Phaser.Cameras.Scene2D.Camera): void {
    this.mapGraphics.clear();

    for (const unit of playerUnits) {
      const x = unit.x * this.scaleX;
      const y = unit.y * this.scaleY;
      this.mapGraphics.fillStyle(colors.player, 1);
      this.mapGraphics.fillCircle(x, y, 3);
    }

    for (const unit of enemyUnits) {
      if (unit.visible) {
        const x = unit.x * this.scaleX;
        const y = unit.y * this.scaleY;
        this.mapGraphics.fillStyle(colors.rival, 1);
        this.mapGraphics.fillCircle(x, y, 3);
      }
    }

    const viewX = camera.scrollX * this.scaleX;
    const viewY = camera.scrollY * this.scaleY;
    const viewWidth = (camera.width / camera.zoom) * this.scaleX;
    const viewHeight = (camera.height / camera.zoom) * this.scaleY;

    this.viewportRect.setPosition(viewX, viewY);
    this.viewportRect.setSize(viewWidth, viewHeight);
  }

  private onMinimapClick(pointer: Phaser.Input.Pointer): void {
    const localX = pointer.x - this.MINIMAP_X;
    const localY = pointer.y - this.MINIMAP_Y;

    const worldX = localX / this.scaleX;
    const worldY = localY / this.scaleY;

    const cam = this.scene.cameras.main;
    cam.pan(worldX, worldY, 300, 'Sine.easeOut');
  }

  destroy(): void {
    this.container.destroy();
  }
}

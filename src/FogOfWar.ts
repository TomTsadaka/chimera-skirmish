import Phaser from 'phaser';

export class FogOfWar {
  private fogGraphics: Phaser.GameObjects.Graphics;
  private exploredMap: boolean[][];
  private visibleMap: boolean[][];
  private gridSize: number = 32;
  private mapWidth: number;
  private mapHeight: number;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.mapWidth = Math.ceil(mapWidth / this.gridSize);
    this.mapHeight = Math.ceil(mapHeight / this.gridSize);

    this.exploredMap = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));
    this.visibleMap = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));

    this.fogGraphics = scene.add.graphics();
    this.fogGraphics.setDepth(1000);
  }

  update(playerUnits: Array<{ x: number; y: number; creature: { vision: number } }>): void {
    this.visibleMap = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));

    for (const unit of playerUnits) {
      const sightRadius = this.getSightRadius(unit);
      this.revealArea(unit.x, unit.y, sightRadius);
    }

    this.render();
  }

  private getSightRadius(unit: { creature: { vision: number } }): number {
    return unit.creature.vision * this.gridSize;
  }

  private revealArea(centerX: number, centerY: number, radius: number): void {
    const gridX = Math.floor(centerX / this.gridSize);
    const gridY = Math.floor(centerY / this.gridSize);
    const gridRadius = Math.ceil(radius / this.gridSize);

    for (let y = -gridRadius; y <= gridRadius; y++) {
      for (let x = -gridRadius; x <= gridRadius; x++) {
        const gx = gridX + x;
        const gy = gridY + y;

        if (gx < 0 || gx >= this.mapWidth || gy < 0 || gy >= this.mapHeight) continue;

        const distance = Math.sqrt(x * x + y * y);
        if (distance <= gridRadius) {
          this.exploredMap[gy][gx] = true;
          this.visibleMap[gy][gx] = true;
        }
      }
    }
  }

  private render(): void {
    this.fogGraphics.clear();

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const screenX = x * this.gridSize;
        const screenY = y * this.gridSize;

        if (!this.exploredMap[y][x]) {
          this.fogGraphics.fillStyle(0x000000, 0.95);
          this.fogGraphics.fillRect(screenX, screenY, this.gridSize, this.gridSize);
        } else if (!this.visibleMap[y][x]) {
          this.fogGraphics.fillStyle(0x000000, 0.6);
          this.fogGraphics.fillRect(screenX, screenY, this.gridSize, this.gridSize);
        }
      }
    }
  }

  isVisible(x: number, y: number): boolean {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);

    if (gridX < 0 || gridX >= this.mapWidth || gridY < 0 || gridY >= this.mapHeight) return false;

    return this.visibleMap[gridY][gridX];
  }

  destroy(): void {
    this.fogGraphics.destroy();
  }
}

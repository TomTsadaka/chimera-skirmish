import { Unit3D } from './Unit3D';
import { Building3D } from './Building3D';
import { ResourceNode3D } from './ResourceNode3D';
import { RTSCamera } from './RTSCamera';

export class Minimap3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private mapWidth: number;
  private mapHeight: number;
  private minimapSize = 180;
  
  constructor(mapWidth: number, mapHeight: number) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    
    // Create minimap container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: ${this.minimapSize}px;
      height: ${this.minimapSize}px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #666;
      border-radius: 4px;
      cursor: pointer;
      pointer-events: auto;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.minimapSize;
    this.canvas.height = this.minimapSize;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d')!;
    
    // Click to jump camera
    this.canvas.addEventListener('click', this.onMinimapClick.bind(this));
  }
  
  private onMinimapClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    const worldX = x * this.mapWidth;
    const worldZ = y * this.mapHeight;
    
    // Dispatch custom event for camera jump
    this.container.dispatchEvent(new CustomEvent('minimap-click', {
      detail: { x: worldX, z: worldZ }
    }));
  }
  
  public update(
    playerUnits: Unit3D[],
    enemyUnits: Unit3D[],
    _camera: RTSCamera,
    playerHQ: Building3D,
    enemyHQ: Building3D,
    resourceNodes: ResourceNode3D[]
  ): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a3a1a';
    this.ctx.fillRect(0, 0, this.minimapSize, this.minimapSize);
    
    // Draw resource nodes
    this.ctx.fillStyle = '#22C55E';
    for (const node of resourceNodes) {
      if (node.isEmpty()) continue;
      const x = (node.x / this.mapWidth) * this.minimapSize;
      const y = (node.y / this.mapHeight) * this.minimapSize;
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    
    // Draw HQs
    this.ctx.fillStyle = '#2DD4BF'; // Player HQ
    const playerHQX = (playerHQ.x / this.mapWidth) * this.minimapSize;
    const playerHQY = (playerHQ.y / this.mapHeight) * this.minimapSize;
    this.ctx.fillRect(playerHQX - 4, playerHQY - 4, 8, 8);
    
    this.ctx.fillStyle = '#F97316'; // Enemy HQ
    const enemyHQX = (enemyHQ.x / this.mapWidth) * this.minimapSize;
    const enemyHQY = (enemyHQ.y / this.mapHeight) * this.minimapSize;
    this.ctx.fillRect(enemyHQX - 4, enemyHQY - 4, 8, 8);
    
    // Draw player units
    this.ctx.fillStyle = '#2DD4BF';
    for (const unit of playerUnits) {
      const pos = unit.getPosition();
      const x = (pos.x / this.mapWidth) * this.minimapSize;
      const y = (pos.z / this.mapHeight) * this.minimapSize;
      this.ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    
    // Draw enemy units
    this.ctx.fillStyle = '#F97316';
    for (const unit of enemyUnits) {
      const pos = unit.getPosition();
      const x = (pos.x / this.mapWidth) * this.minimapSize;
      const y = (pos.z / this.mapHeight) * this.minimapSize;
      this.ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    
    // Draw camera viewport (approximate)
    // This would need camera frustum calculation for accuracy
    // For now, just show a center marker
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      this.minimapSize * 0.3,
      this.minimapSize * 0.3,
      this.minimapSize * 0.4,
      this.minimapSize * 0.4
    );
  }
  
  public show(): void {
    if (!this.container.parentNode) {
      document.body.appendChild(this.container);
    }
  }
  
  public hide(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
  
  public onMinimapClickCallback(callback: (x: number, z: number) => void): void {
    this.container.addEventListener('minimap-click', ((event: CustomEvent) => {
      callback(event.detail.x, event.detail.z);
    }) as EventListener);
  }
  
  public destroy(): void {
    this.hide();
  }
}

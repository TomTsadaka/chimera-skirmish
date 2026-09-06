import * as THREE from 'three';
import { ResourceNode as ResourceNodeType } from '../types';

export class ResourceNode3D {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private data: ResourceNodeType;
  
  private textMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, nodeData: ResourceNodeType) {
    this.scene = scene;
    this.data = nodeData;
    
    this.mesh = new THREE.Group();
    this.mesh.position.set(nodeData.x, 0, nodeData.y);
    
    this.createNodeMesh();
    this.updateLabel();
    
    scene.add(this.mesh);
  }

  private createNodeMesh(): void {
    if (this.data.type === 'biomass') {
      // Hexagonal crystal formation for biomass
      const hexGeometry = new THREE.CylinderGeometry(2, 2, 3, 6);
      const hexMaterial = new THREE.MeshStandardMaterial({
        color: 0x22C55E,
        emissive: 0x22C55E,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.6
      });
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);
      hex.position.y = 1.5;
      hex.castShadow = true;
      this.mesh.add(hex);
      
      // Add smaller crystals around it
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const smallHex = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6),
          hexMaterial
        );
        smallHex.position.set(
          Math.cos(angle) * 2,
          0.75,
          Math.sin(angle) * 2
        );
        smallHex.castShadow = true;
        this.mesh.add(smallHex);
      }
    }
    
    // Base platform
    const platformGeometry = new THREE.CylinderGeometry(3.5, 4, 0.3, 16);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.15;
    platform.receiveShadow = true;
    this.mesh.add(platform);
  }

  private updateLabel(): void {
    if (this.textMesh) {
      this.mesh.remove(this.textMesh);
    }
    
    // Simple text representation using a plane
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.data.amount.toString(), canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      transparent: true,
      side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(4, 2);
    this.textMesh = new THREE.Mesh(geometry, material);
    this.textMesh.position.y = 4;
    this.mesh.add(this.textMesh);
  }

  public gather(amount: number): number {
    if (this.isEmpty()) return 0;
    
    const gathered = Math.min(amount, this.data.amount);
    this.data.amount -= gathered;
    this.updateLabel();
    
    // Visual feedback - pulse
    if (this.mesh.children[0]) {
      const original = this.mesh.children[0].scale.clone();
      this.mesh.children[0].scale.multiplyScalar(1.2);
      setTimeout(() => {
        if (this.mesh.children[0]) {
          this.mesh.children[0].scale.copy(original);
        }
      }, 100);
    }
    
    return gathered;
  }

  public isEmpty(): boolean {
    return this.data.amount <= 0;
  }

  public update(): void {
    // Make label face camera (billboard)
    if (this.textMesh && this.scene.userData.cameraPosition) {
      this.textMesh.lookAt(this.scene.userData.cameraPosition);
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public get x(): number {
    return this.mesh.position.x;
  }

  public get y(): number {
    return this.mesh.position.z;
  }

  public destroy(): void {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

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
      // Create glowing crystal cluster
      
      // Central large crystal (cone pointing up)
      const mainCrystalGeometry = new THREE.ConeGeometry(1.5, 5, 6);
      const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FFAA,
        emissive: 0x00FFAA,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9
      });
      const mainCrystal = new THREE.Mesh(mainCrystalGeometry, crystalMaterial);
      mainCrystal.position.y = 2.5;
      mainCrystal.castShadow = true;
      this.mesh.add(mainCrystal);
      
      // Add smaller surrounding crystals at different angles
      const smallPositions = [
        { x: 1.5, y: 1.2, z: 0, scale: 0.6, rotZ: 0.3 },
        { x: -1.2, y: 1.5, z: 0.5, scale: 0.7, rotZ: -0.2 },
        { x: 0, y: 1, z: 1.5, scale: 0.5, rotZ: 0.4 },
        { x: -0.8, y: 1.3, z: -1.2, scale: 0.6, rotZ: -0.3 }
      ];
      
      smallPositions.forEach(pos => {
        const smallCrystalGeometry = new THREE.ConeGeometry(0.8, 3, 6);
        const smallCrystal = new THREE.Mesh(smallCrystalGeometry, crystalMaterial);
        smallCrystal.position.set(pos.x, pos.y, pos.z);
        smallCrystal.scale.setScalar(pos.scale);
        smallCrystal.rotation.z = pos.rotZ;
        smallCrystal.castShadow = true;
        this.mesh.add(smallCrystal);
      });
      
      // Add a subtle point light for glow effect
      const light = new THREE.PointLight(0x00FFAA, 0.8, 10);
      light.position.y = 3;
      this.mesh.add(light);
    }
    
    // Base platform with glowing edge
    const platformGeometry = new THREE.CylinderGeometry(2.5, 3, 0.5, 16);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AA88,
      emissive: 0x00AA88,
      emissiveIntensity: 0.3,
      roughness: 0.7,
      metalness: 0.5
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.25;
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

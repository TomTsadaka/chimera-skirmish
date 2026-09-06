import * as THREE from 'three';

export class Building3D {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  public currentHp: number;
  public maxHp: number = 500;
  public team: 'player' | 'enemy';
  public buildingType: string;
  
  private hpBarContainer: THREE.Group;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    team: 'player' | 'enemy',
    buildingType: string = 'HQ'
  ) {
    this.scene = scene;
    this.team = team;
    this.buildingType = buildingType;
    this.currentHp = this.maxHp;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    this.createBuildingMesh();
    
    this.hpBarContainer = new THREE.Group();
    this.updateHpBar();
    this.mesh.add(this.hpBarContainer);
    
    scene.add(this.mesh);
  }

  private createBuildingMesh(): void {
    const teamColor = this.team === 'player' ? 0x2DD4BF : 0xF97316;
    
    if (this.buildingType === 'HQ') {
      // Tall tower base
      const baseGeometry = new THREE.CylinderGeometry(6, 7, 15, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.6,
        metalness: 0.4,
        emissive: teamColor,
        emissiveIntensity: 0.2
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 7.5;
      base.castShadow = true;
      base.receiveShadow = true;
      this.mesh.add(base);
      
      // Middle section
      const midGeometry = new THREE.CylinderGeometry(5, 6, 8, 8);
      const mid = new THREE.Mesh(midGeometry, baseMaterial);
      mid.position.y = 19;
      mid.castShadow = true;
      this.mesh.add(mid);
      
      // Top section with roof
      const topGeometry = new THREE.ConeGeometry(6, 6, 8);
      const topMaterial = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.5,
        metalness: 0.6,
        emissive: teamColor,
        emissiveIntensity: 0.3
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 26;
      top.castShadow = true;
      this.mesh.add(top);
      
      // Glowing beacon on top
      const beaconGeometry = new THREE.SphereGeometry(1, 16, 16);
      const beaconMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.8,
        metalness: 0.9
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.y = 29;
      this.mesh.add(beacon);
      
      // Windows/details
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const windowGeom = new THREE.BoxGeometry(0.8, 1.5, 0.3);
        const windowMat = new THREE.MeshStandardMaterial({
          color: 0xFFFFAA,
          emissive: 0xFFFFAA,
          emissiveIntensity: 0.5
        });
        const window = new THREE.Mesh(windowGeom, windowMat);
        window.position.set(
          Math.cos(angle) * 6.5,
          10 + (i % 3) * 3,
          Math.sin(angle) * 6.5
        );
        window.lookAt(0, window.position.y, 0);
        this.mesh.add(window);
      }
    }
    
    // Large base platform
    const platformGeometry = new THREE.CylinderGeometry(10, 12, 1, 16);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.5;
    platform.receiveShadow = true;
    this.mesh.add(platform);
  }

  private updateHpBar(): void {
    this.hpBarContainer.clear();
    
    const hpPercent = this.currentHp / this.maxHp;
    const barWidth = 12;
    const barHeight = 0.6;
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.y = 32;
    this.hpBarContainer.add(bg);
    
    // HP bar
    let color: number;
    if (hpPercent > 0.5) {
      color = 0x00ff00;
    } else if (hpPercent > 0.25) {
      color = 0xffff00;
    } else {
      color = 0xff0000;
    }
    
    const hpGeometry = new THREE.PlaneGeometry(barWidth * hpPercent, barHeight);
    const hpMaterial = new THREE.MeshBasicMaterial({ color });
    const hpBar = new THREE.Mesh(hpGeometry, hpMaterial);
    hpBar.position.set(-(barWidth * (1 - hpPercent)) / 2, 32, 0.01);
    this.hpBarContainer.add(hpBar);
  }

  public takeDamage(damage: number): void {
    this.currentHp = Math.max(0, this.currentHp - damage);
    this.updateHpBar();
  }

  public update(): void {
    // Make HP bar face camera (billboard)
    if (this.hpBarContainer && this.scene.userData.cameraPosition) {
      this.hpBarContainer.lookAt(this.scene.userData.cameraPosition);
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getMesh(): THREE.Group {
    return this.mesh;
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

  public get x(): number {
    return this.mesh.position.x;
  }

  public get y(): number {
    return this.mesh.position.z;
  }
}

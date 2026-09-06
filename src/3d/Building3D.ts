import * as THREE from 'three';
import { HybridCreature, AnimalArchetype } from '../types';

export type BuildingType = 'HQ' | 'Camp' | 'ProductionCell' | 'EnergyMast';
export type BuildingState = 'placing' | 'constructing' | 'complete';

export interface TrainQueueItem {
  type: 'worker' | 'hybrid' | 'archetype';
  creature?: HybridCreature | AnimalArchetype;
  totalTime: number;
  elapsedTime: number;
  costDNA: number;
  costBiomass: number;
}

export class Building3D {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  public currentHp: number;
  public maxHp: number;
  public team: 'player' | 'enemy';
  public buildingType: BuildingType;
  public buildingState: BuildingState = 'complete';
  public constructionProgress: number = 0; // 0-1
  public constructionTotalTime: number; // milliseconds
  public assignedWorkers: Set<string> = new Set(); // worker unit IDs
  
  private hpBarContainer: THREE.Group;
  private progressBarContainer: THREE.Group;
  
  // Train queue
  public trainQueue: TrainQueueItem[] = [];
  public maxQueueSize: number = 5;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    team: 'player' | 'enemy',
    buildingType: BuildingType = 'HQ',
    state: BuildingState = 'complete'
  ) {
    this.scene = scene;
    this.team = team;
    this.buildingType = buildingType;
    this.buildingState = state;
    
    // Set max HP and construction time based on building type
    switch (buildingType) {
      case 'HQ':
        this.maxHp = 500;
        this.constructionTotalTime = 0; // HQs start complete
        break;
      case 'Camp':
        this.maxHp = 200;
        this.constructionTotalTime = 25000; // 25 seconds
        break;
      case 'ProductionCell':
        this.maxHp = 250;
        this.constructionTotalTime = 35000; // 35 seconds
        break;
      case 'EnergyMast':
        this.maxHp = 150;
        this.constructionTotalTime = 20000; // 20 seconds
        break;
    }
    
    this.currentHp = state === 'complete' ? this.maxHp : 0;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    this.createBuildingMesh();
    
    this.hpBarContainer = new THREE.Group();
    this.updateHpBar();
    this.mesh.add(this.hpBarContainer);
    
    this.progressBarContainer = new THREE.Group();
    if (state === 'constructing') {
      this.updateProgressBar();
    }
    this.mesh.add(this.progressBarContainer);
    
    scene.add(this.mesh);
  }

  private createBuildingMesh(): void {
    const teamColor = this.team === 'player' ? 0x2DD4BF : 0xF97316;
    const opacity = this.buildingState === 'constructing' ? 0.5 : 1.0;
    
    if (this.buildingType === 'HQ') {
      // Tall tower base
      const baseGeometry = new THREE.CylinderGeometry(6, 7, 15, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.6,
        metalness: 0.4,
        emissive: teamColor,
        emissiveIntensity: 0.2,
        transparent: this.buildingState === 'constructing',
        opacity
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
        emissiveIntensity: 0.3,
        transparent: this.buildingState === 'constructing',
        opacity
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
        metalness: 0.9,
        transparent: this.buildingState === 'constructing',
        opacity
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
          emissiveIntensity: 0.5,
          transparent: this.buildingState === 'constructing',
          opacity
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
    } else if (this.buildingType === 'Camp') {
      // Small DNA drip building - tent-like structure
      const baseMat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.7,
        metalness: 0.3,
        transparent: this.buildingState === 'constructing',
        opacity
      });
      
      // Base platform
      const baseGeom = new THREE.CylinderGeometry(3, 3.5, 1, 8);
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 0.5;
      base.castShadow = true;
      this.mesh.add(base);
      
      // Tent/dome structure
      const tentGeom = new THREE.ConeGeometry(3, 5, 8);
      const tent = new THREE.Mesh(tentGeom, baseMat);
      tent.position.y = 3.5;
      tent.castShadow = true;
      this.mesh.add(tent);
      
      // Flag on top
      const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 4);
      const pole = new THREE.Mesh(poleGeom, baseMat);
      pole.position.y = 7;
      this.mesh.add(pole);
    } else if (this.buildingType === 'ProductionCell') {
      // Production building - industrial look
      const baseMat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.8,
        metalness: 0.5,
        transparent: this.buildingState === 'constructing',
        opacity
      });
      
      // Main cube
      const cubeGeom = new THREE.BoxGeometry(5, 6, 5);
      const cube = new THREE.Mesh(cubeGeom, baseMat);
      cube.position.y = 3;
      cube.castShadow = true;
      this.mesh.add(cube);
      
      // Chimney/vent
      const ventGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
      const vent = new THREE.Mesh(ventGeom, baseMat);
      vent.position.set(1.5, 7.5, 1.5);
      this.mesh.add(vent);
      
      // Glow effect if complete
      if (this.buildingState === 'complete') {
        const glowGeom = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshStandardMaterial({
          color: 0x00FFFF,
          emissive: 0x00FFFF,
          emissiveIntensity: 0.8
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = 5;
        this.mesh.add(glow);
      }
    } else if (this.buildingType === 'EnergyMast') {
      // Energy tower - tall and thin
      const baseMat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.5,
        metalness: 0.7,
        transparent: this.buildingState === 'constructing',
        opacity
      });
      
      // Base
      const baseGeom = new THREE.CylinderGeometry(2, 2.5, 2, 6);
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 1;
      base.castShadow = true;
      this.mesh.add(base);
      
      // Tower
      const towerGeom = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
      const tower = new THREE.Mesh(towerGeom, baseMat);
      tower.position.y = 6;
      tower.castShadow = true;
      this.mesh.add(tower);
      
      // Energy sphere on top
      if (this.buildingState === 'complete') {
        const sphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0xFFFF00,
          emissive: 0xFFFF00,
          emissiveIntensity: 0.9,
          metalness: 0.8
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.y = 11;
        this.mesh.add(sphere);
      }
    }
    
    // Base platform for all buildings
    const platformGeometry = new THREE.CylinderGeometry(
      this.buildingType === 'HQ' ? 10 : 4,
      this.buildingType === 'HQ' ? 12 : 5,
      1,
      16
    );
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9,
      transparent: this.buildingState === 'constructing',
      opacity
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
    
    // Make progress bar face camera
    if (this.progressBarContainer && this.scene.userData.cameraPosition) {
      this.progressBarContainer.lookAt(this.scene.userData.cameraPosition);
    }
  }
  
  public advanceConstruction(deltaMs: number): void {
    if (this.buildingState !== 'constructing') return;
    
    // Calculate build rate: base 1× + 0.3× per worker (max 2×)
    const workerCount = this.assignedWorkers.size;
    const buildRate = Math.min(1.0 + (workerCount * 0.3), 2.0);
    
    const progressDelta = (deltaMs / this.constructionTotalTime) * buildRate;
    this.constructionProgress += progressDelta;
    
    if (this.constructionProgress >= 1.0) {
      this.constructionProgress = 1.0;
      this.buildingState = 'complete';
      this.currentHp = this.maxHp;
      // Rebuild mesh to show complete state
      this.mesh.clear();
      this.createBuildingMesh();
      this.hpBarContainer = new THREE.Group();
      this.updateHpBar();
      this.mesh.add(this.hpBarContainer);
      this.progressBarContainer.clear();
    } else {
      this.updateProgressBar();
    }
  }
  
  public advanceTrainQueue(deltaMs: number): void {
    if (this.buildingState !== 'complete') return;
    if (this.trainQueue.length === 0) return;
    
    const currentItem = this.trainQueue[0];
    currentItem.elapsedTime += deltaMs;
    
    if (currentItem.elapsedTime >= currentItem.totalTime) {
      // Training complete - remove from queue
      // GameManager will handle spawning the unit
      this.trainQueue.shift();
    }
  }
  
  public addToTrainQueue(item: TrainQueueItem): boolean {
    if (this.trainQueue.length >= this.maxQueueSize) {
      return false;
    }
    this.trainQueue.push(item);
    return true;
  }
  
  public cancelTrainQueueItem(index: number): { dna: number; biomass: number } | null {
    if (index < 0 || index >= this.trainQueue.length) return null;
    
    const item = this.trainQueue[index];
    this.trainQueue.splice(index, 1);
    
    // Refund 50%
    return {
      dna: Math.floor(item.costDNA * 0.5),
      biomass: Math.floor(item.costBiomass * 0.5)
    };
  }
  
  private updateProgressBar(): void {
    this.progressBarContainer.clear();
    
    if (this.buildingState !== 'constructing') return;
    
    const barWidth = 8;
    const barHeight = 0.5;
    const yOffset = this.buildingType === 'HQ' ? 35 : 12;
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.8 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.y = yOffset;
    this.progressBarContainer.add(bg);
    
    // Progress bar
    const progressGeometry = new THREE.PlaneGeometry(barWidth * this.constructionProgress, barHeight);
    const progressMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    const progressBar = new THREE.Mesh(progressGeometry, progressMaterial);
    progressBar.position.set(-(barWidth * (1 - this.constructionProgress)) / 2, yOffset, 0.01);
    this.progressBarContainer.add(progressBar);
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

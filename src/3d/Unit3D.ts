import * as THREE from 'three';
import { HybridCreature, UnitRole } from '../types';
import { ResourceNode3D } from './ResourceNode3D';
import { Building3D } from './Building3D';
import { GAME_CONSTANTS } from '../constants';

export class Unit3D {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  public creature: HybridCreature;
  public currentHp: number;
  public team: 'player' | 'enemy';
  public role: UnitRole;
  public isSelected: boolean = false;
  public targetEnemy: Unit3D | null = null;
  
  // Worker properties
  public targetResourceNode: ResourceNode3D | null = null;
  public targetConstructionBuilding: Building3D | null = null;
  public homeBuilding: Building3D | null = null;
  public carryingBiomass: number = 0;
  public gatherState: 'idle' | 'moving_to_resource' | 'gathering' | 'returning' | 'moving_to_dropoff' | 'constructing' = 'idle';
  private gatherTimer: number = 0;
  public unitId: string = Math.random().toString(36).substr(2, 9);
  
  // Movement
  private targetPosition: THREE.Vector3 | null = null;
  
  // Combat
  public attackCooldown: number = 0;
  private readonly ATTACK_COOLDOWN_MS = 1000;
  
  // Visual elements
  private selectionRing: THREE.Mesh | null = null;
  private hpBarContainer: THREE.Group;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    creature: HybridCreature,
    team: 'player' | 'enemy',
    role: UnitRole = 'combat',
    homeBuilding: Building3D | null = null
  ) {
    this.scene = scene;
    this.creature = creature;
    this.currentHp = creature.hp;
    this.team = team;
    this.role = role;
    this.homeBuilding = homeBuilding;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    // Create unit visual
    this.createUnitMesh();
    
    // Create selection ring
    this.createSelectionRing();
    
    // Create HP bar
    this.hpBarContainer = new THREE.Group();
    this.updateHpBar();
    this.mesh.add(this.hpBarContainer);
    
    scene.add(this.mesh);
  }

  private createUnitMesh(): void {
    const size = this.role === 'worker' ? 1.5 : 2;
    const teamColor = this.team === 'player' ? 0x2DD4BF : 0xF97316;
    
    if (this.role === 'worker') {
      // Worker: clear head/body/legs structure
      
      // Legs (two cylinders)
      const legGeometry = new THREE.CylinderGeometry(0.3, 0.25, 1, 8);
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0xFACC15,
        roughness: 0.7,
        metalness: 0.2
      });
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.4, 0.5, 0);
      leftLeg.castShadow = true;
      this.mesh.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.4, 0.5, 0);
      rightLeg.castShadow = true;
      this.mesh.add(rightLeg);
      
      // Torso (box)
      const torsoGeometry = new THREE.BoxGeometry(size, size * 0.8, size * 0.6);
      const torso = new THREE.Mesh(torsoGeometry, legMaterial);
      torso.position.y = 1.6;
      torso.castShadow = true;
      torso.receiveShadow = true;
      this.mesh.add(torso);
      
      // Head (sphere)
      const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const head = new THREE.Mesh(headGeometry, legMaterial);
      head.position.y = 2.5;
      head.castShadow = true;
      this.mesh.add(head);
      
      // Tool (pickaxe)
      const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, size * 1.2);
      const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x854D0E });
      const handle = new THREE.Mesh(handleGeometry, toolMaterial);
      handle.rotation.z = Math.PI / 4;
      handle.position.set(size * 0.5, 1.5, 0);
      handle.castShadow = true;
      this.mesh.add(handle);
      
      const pickGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.2);
      const pick = new THREE.Mesh(pickGeometry, toolMaterial);
      pick.position.set(size * 0.9, 2.2, 0);
      pick.castShadow = true;
      this.mesh.add(pick);
    } else {
      // Combat unit: clear multi-part creature (head/torso/legs)
      const primaryColor = parseInt(this.creature.primaryColor.replace('#', '0x'));
      const secondaryColor = parseInt(this.creature.secondaryColor.replace('#', '0x'));
      
      // Legs (primary color, sturdy)
      const legGeometry = new THREE.CylinderGeometry(0.4, 0.35, 1.2, 8);
      const legMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.6,
        metalness: 0.2
      });
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.5, 0.6, 0);
      leftLeg.castShadow = true;
      this.mesh.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.5, 0.6, 0);
      rightLeg.castShadow = true;
      this.mesh.add(rightLeg);
      
      // Torso (primary color, larger)
      const torsoGeometry = new THREE.SphereGeometry(size * 0.7, 16, 16);
      const torso = new THREE.Mesh(torsoGeometry, legMaterial);
      torso.position.y = 2;
      torso.scale.y = 1.2;
      torso.castShadow = true;
      torso.receiveShadow = true;
      this.mesh.add(torso);
      
      // Head (secondary color, hybrid trait)
      const headGeometry = new THREE.ConeGeometry(size * 0.5, size * 0.8, 8);
      const headMaterial = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.6,
        metalness: 0.3
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 3.2;
      head.castShadow = true;
      this.mesh.add(head);
      
      // Arms/claws (secondary color, hybrid trait)
      const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      const leftArm = new THREE.Mesh(armGeometry, headMaterial);
      leftArm.position.set(-size * 0.6, 2, size * 0.3);
      leftArm.rotation.z = Math.PI / 6;
      leftArm.castShadow = true;
      this.mesh.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, headMaterial);
      rightArm.position.set(size * 0.6, 2, size * 0.3);
      rightArm.rotation.z = -Math.PI / 6;
      rightArm.castShadow = true;
      this.mesh.add(rightArm);
      
      // Claws (secondary color)
      const clawGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
      const leftClaw = new THREE.Mesh(clawGeometry, headMaterial);
      leftClaw.position.set(-size * 0.7, 1.2, size * 0.5);
      leftClaw.rotation.x = Math.PI;
      leftClaw.castShadow = true;
      this.mesh.add(leftClaw);
      
      const rightClaw = new THREE.Mesh(clawGeometry, headMaterial);
      rightClaw.position.set(size * 0.7, 1.2, size * 0.5);
      rightClaw.rotation.x = Math.PI;
      rightClaw.castShadow = true;
      this.mesh.add(rightClaw);
    }
    
    // Team indicator (ring around base)
    const ringGeometry = new THREE.TorusGeometry(size * 0.8, 0.12, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: teamColor,
      emissive: teamColor,
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    this.mesh.add(ring);
  }

  private createSelectionRing(): void {
    const ringGeometry = new THREE.TorusGeometry(3, 0.15, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0
    });
    this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.selectionRing.rotation.x = Math.PI / 2;
    this.selectionRing.position.y = 0.1;
    this.mesh.add(this.selectionRing);
  }

  private updateHpBar(): void {
    // Clear existing HP bar
    this.hpBarContainer.clear();
    
    const hpPercent = this.currentHp / this.creature.hp;
    const barWidth = 3;
    const barHeight = 0.3;
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.y = 4;
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
    hpBar.position.set(-(barWidth * (1 - hpPercent)) / 2, 4, 0.01);
    this.hpBarContainer.add(hpBar);
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (this.selectionRing) {
      (this.selectionRing.material as THREE.MeshBasicMaterial).opacity = selected ? 0.8 : 0;
    }
  }

  public takeDamage(damage: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - damage);
    this.updateHpBar();
    
    if (this.currentHp <= 0) {
      this.setSelected(false);
      return true;
    }
    return false;
  }

  public moveToPosition(targetX: number, targetZ: number): void {
    this.targetPosition = new THREE.Vector3(targetX, 0, targetZ);
  }

  public orderGather(resourceNode: ResourceNode3D): void {
    if (this.role !== 'worker' || !this.homeBuilding) return;
    
    // Clear construction assignment
    if (this.targetConstructionBuilding) {
      this.targetConstructionBuilding.assignedWorkers.delete(this.unitId);
      this.targetConstructionBuilding = null;
    }
    
    this.targetResourceNode = resourceNode;
    this.gatherState = 'moving_to_resource';
    this.targetEnemy = null;
    this.moveToPosition(resourceNode.getPosition().x, resourceNode.getPosition().z);
  }
  
  public orderConstruct(building: Building3D): void {
    if (this.role !== 'worker') return;
    if (building.buildingState !== 'constructing') return;
    
    // Clear gathering assignment
    this.targetResourceNode = null;
    this.gatherState = 'constructing';
    this.targetEnemy = null;
    
    // Assign to building
    this.targetConstructionBuilding = building;
    building.assignedWorkers.add(this.unitId);
    this.moveToPosition(building.getPosition().x, building.getPosition().z);
  }

  public attackTarget(target: Unit3D): void {
    if (this.attackCooldown > 0) return;
    
    const distance = this.getPosition().distanceTo(target.getPosition());
    const effectiveRange = this.creature.range * 3;
    
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

  private showProjectile(target: Unit3D): void {
    const projectileGeometry = new THREE.SphereGeometry(0.3);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.copy(this.getPosition());
    projectile.position.y += 2;
    this.scene.add(projectile);
    
    // Animate projectile (simple lerp)
    const start = projectile.position.clone();
    const end = target.getPosition().clone();
    end.y += 2;
    
    let t = 0;
    const animate = () => {
      t += 0.05;
      if (t >= 1) {
        this.scene.remove(projectile);
        return;
      }
      projectile.position.lerpVectors(start, end, t);
      requestAnimationFrame(animate);
    };
    animate();
  }

  public update(delta: number): void {
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    }
    
    // Movement
    if (this.targetPosition) {
      const currentPos = this.getPosition();
      const direction = new THREE.Vector3().subVectors(this.targetPosition, currentPos);
      const distance = direction.length();
      
      if (distance > 0.5) {
        const speed = this.role === 'worker' 
          ? this.creature.speed * GAME_CONSTANTS.WORKER_SPEED
          : this.creature.speed;
        
        direction.normalize();
        const moveAmount = speed * 0.01 * delta;
        
        currentPos.add(direction.multiplyScalar(Math.min(moveAmount, distance)));
        this.mesh.position.set(currentPos.x, 0, currentPos.z);
        
        // Face movement direction
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
      } else {
        this.targetPosition = null;
      }
    }
    
    // Worker gathering logic
    if (this.role === 'worker' && this.gatherState !== 'idle') {
      this.updateGatherBehavior(delta);
    }
    
    // Make HP bar face camera (billboard)
    if (this.hpBarContainer) {
      this.hpBarContainer.lookAt(this.scene.userData.cameraPosition || new THREE.Vector3(0, 50, 50));
    }
  }

  private updateGatherBehavior(delta: number): void {
    // Handle construction mode
    if (this.gatherState === 'constructing') {
      if (!this.targetConstructionBuilding || this.targetConstructionBuilding.buildingState !== 'constructing') {
        // Building finished or destroyed
        if (this.targetConstructionBuilding) {
          this.targetConstructionBuilding.assignedWorkers.delete(this.unitId);
        }
        this.targetConstructionBuilding = null;
        this.gatherState = 'idle';
        return;
      }
      
      // Stay near building (within 5 units)
      const distanceToBuilding = this.getPosition().distanceTo(this.targetConstructionBuilding.getPosition());
      if (distanceToBuilding > 5) {
        this.moveToPosition(this.targetConstructionBuilding.getPosition().x, this.targetConstructionBuilding.getPosition().z);
      }
      return;
    }
    
    if (!this.targetResourceNode || !this.homeBuilding) {
      this.gatherState = 'idle';
      return;
    }
    
    const distanceToNode = this.getPosition().distanceTo(this.targetResourceNode.getPosition());
    const distanceToHome = this.getPosition().distanceTo(this.homeBuilding.getPosition());
    
    switch (this.gatherState) {
      case 'moving_to_resource':
        if (distanceToNode < 3) {
          this.gatherState = 'gathering';
          this.gatherTimer = 0;
          this.targetPosition = null;
        }
        break;
        
      case 'gathering':
        this.gatherTimer += delta;
        if (this.gatherTimer >= GAME_CONSTANTS.WORKER_GATHER_INTERVAL) {
          if (!this.targetResourceNode.isEmpty()) {
            const gathered = this.targetResourceNode.gather(GAME_CONSTANTS.WORKER_GATHER_RATE);
            this.carryingBiomass = gathered;
            this.gatherState = 'returning';
            const homePos = this.homeBuilding.getPosition();
            this.moveToPosition(homePos.x, homePos.z);
          } else {
            this.gatherState = 'idle';
            this.targetResourceNode = null;
          }
        }
        break;
        
      case 'returning':
      case 'moving_to_dropoff':
        if (distanceToHome < 5) {
          if (this.carryingBiomass > 0) {
            // Emit resource gathered event
            this.scene.dispatchEvent({
              type: 'resource-gathered',
              team: this.team,
              amount: this.carryingBiomass
            } as any);
            this.carryingBiomass = 0;
          }
          
          if (this.targetResourceNode && !this.targetResourceNode.isEmpty()) {
            this.gatherState = 'moving_to_resource';
            const nodePos = this.targetResourceNode.getPosition();
            this.moveToPosition(nodePos.x, nodePos.z);
          } else {
            this.gatherState = 'idle';
            this.targetResourceNode = null;
          }
        }
        break;
    }
  }

  public findNearestEnemy(enemies: Unit3D[]): Unit3D | null {
    let nearest: Unit3D | null = null;
    let minDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = this.getPosition().distanceTo(enemy.getPosition());
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }

  public destroy(): void {
    // Clean up construction assignment
    if (this.targetConstructionBuilding) {
      this.targetConstructionBuilding.assignedWorkers.delete(this.unitId);
    }
    
    this.scene.remove(this.mesh);
    // Dispose geometries and materials
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

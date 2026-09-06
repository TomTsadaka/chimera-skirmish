import * as THREE from 'three';
import { InputManager } from './InputManager';
import { Unit3D } from './Unit3D';
import { Building3D } from './Building3D';
import { ResourceNode3D } from './ResourceNode3D';
import { UIManager } from './UIManager';
import { Minimap3D } from './Minimap3D';
import { RTSCamera } from './RTSCamera';
import { HybridCreature, EconomyState, ResourceNode as ResourceNodeType, AnimalArchetype } from '../types';
import { ANIMAL_ARCHETYPES, GameData } from '../GameData';
import { GAME_CONSTANTS } from '../constants';
import { strings } from '../i18n';

export class GameManager {
  private scene: THREE.Scene;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private camera: RTSCamera;
  private minimap: Minimap3D;
  
  private playerUnits: Unit3D[] = [];
  private enemyUnits: Unit3D[] = [];
  private selectedUnits: Unit3D[] = [];
  private playerHQ!: Building3D;
  private enemyHQ!: Building3D;
  private resourceNodes: ResourceNode3D[] = [];
  
  private playerResources: EconomyState = { biomass: 0, dna: 0 };
  private enemyResources: EconomyState = { biomass: 0, dna: 0 };
  private dnaTrickleTimer: number = 0;
  
  private armyRoster: HybridCreature[] = [];
  
  private gameEnded: boolean = false;
  private aiUpdateTimer: number = 0;
  
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;

  constructor(scene: THREE.Scene, inputManager: InputManager, camera: RTSCamera) {
    this.scene = scene;
    this.inputManager = inputManager;
    this.camera = camera;
    this.uiManager = new UIManager();
    this.minimap = new Minimap3D(this.MAP_WIDTH, this.MAP_HEIGHT);
    
    // Setup input callbacks
    this.setupInputCallbacks();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Listen for resource gathering (custom event)
    // @ts-ignore - custom event type
    this.scene.addEventListener('resource-gathered', this.onResourceGathered.bind(this));
  }

  private setupInputCallbacks(): void {
    this.inputManager.on('leftclick', (worldPos: THREE.Vector3, shift: boolean) => {
      if (this.gameEnded) return;
      this.handleLeftClick(worldPos, shift);
    });
    
    this.inputManager.on('rightclick', (worldPos: THREE.Vector3) => {
      if (this.gameEnded) return;
      this.handleRightClick(worldPos);
    });
    
    this.inputManager.on('boxselect', (start: THREE.Vector3, end: THREE.Vector3, shift: boolean) => {
      if (this.gameEnded) return;
      this.handleBoxSelect(start, end, shift);
    });
    
    // Minimap click callback
    this.minimap.onMinimapClickCallback((x: number, z: number) => {
      if (!this.gameEnded) {
        this.camera.panTo(x, z);
      }
    });
  }
  
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (this.gameEnded) return;
      
      // Space: center on selection
      if (event.code === 'Space' && this.selectedUnits.length > 0) {
        event.preventDefault();
        this.centerCameraOnSelection();
      }
      
      // F1: toggle help overlay
      if (event.code === 'F1') {
        event.preventDefault();
        this.uiManager.toggleHelpOverlay();
        // Notify camera about help overlay state
        this.camera.setHelpOverlayOpen(this.uiManager.isHelpOverlayOpen());
      }
      
      // Esc: close help or deselect
      if (event.code === 'Escape') {
        if (this.uiManager.isHelpOverlayOpen()) {
          this.uiManager.closeHelpOverlay();
          this.camera.setHelpOverlayOpen(false);
        } else {
          this.clearSelection();
        }
      }
      
      // Debug key K: force win modal (gated behind ?debug=1)
      if (event.code === 'KeyK' && window.location.search.includes('debug=1')) {
        event.preventDefault();
        if (!this.gameEnded) {
          this.gameEnded = true;
          this.uiManager.showGameOver(true, strings.win.destroyBase);
        }
      }
    });
  }
  
  private centerCameraOnSelection(): void {
    if (this.selectedUnits.length === 0) return;
    
    let sumX = 0, sumZ = 0;
    for (const unit of this.selectedUnits) {
      const pos = unit.getPosition();
      sumX += pos.x;
      sumZ += pos.z;
    }
    
    const avgX = sumX / this.selectedUnits.length;
    const avgZ = sumZ / this.selectedUnits.length;
    this.camera.panTo(avgX, avgZ);
  }

  public start(): void {
    // Initialize economy
    this.playerResources = { 
      biomass: GAME_CONSTANTS.STARTING_BIOMASS, 
      dna: GAME_CONSTANTS.STARTING_DNA 
    };
    this.enemyResources = { 
      biomass: GAME_CONSTANTS.STARTING_BIOMASS, 
      dna: GAME_CONSTANTS.STARTING_DNA 
    };
    
    // Create default army roster (for MVP, use 3 pre-made hybrids)
    this.createDefaultArmyRoster();
    
    // Spawn structures and units
    this.spawnHQs();
    this.spawnResourceNodes();
    this.spawnWorkers();
    this.spawnPlayerArmy(this.armyRoster[0]);
    this.spawnEnemyArmy();
    
    // Frame camera to show player base and units
    const playerBaseX = this.playerHQ.x;
    const playerBaseZ = this.playerHQ.y;
    this.camera.frameView(playerBaseX + 30, playerBaseZ, 60);
    
    // Setup UI
    this.uiManager.show();
    this.uiManager.updateResources(this.playerResources);
    this.uiManager.updateHQHP(this.playerHQ, this.enemyHQ);
    // Train panel will be shown/hidden based on selection
    this.uiManager.hideTrainPanel();
    
    // Show minimap
    this.minimap.show();
    
    this.gameEnded = false;
  }

  private createDefaultArmyRoster(): void {
    // Create 3 cheap hybrids for MVP
    const batEcho = ANIMAL_ARCHETYPES.find(a => a.id === 'bat-echo')!;
    const hornDeer = ANIMAL_ARCHETYPES.find(a => a.id === 'horn-deer')!;
    const quillSnake = ANIMAL_ARCHETYPES.find(a => a.id === 'quill-snake')!;
    
    this.armyRoster = [
      GameData.createHybrid(batEcho, hornDeer),
      GameData.createHybrid(quillSnake, batEcho),
      GameData.createHybrid(hornDeer, quillSnake)
    ];
  }

  private spawnHQs(): void {
    this.playerHQ = new Building3D(
      this.scene,
      new THREE.Vector3(20, 0, this.MAP_HEIGHT / 2),
      'player',
      'HQ'
    );
    
    this.enemyHQ = new Building3D(
      this.scene,
      new THREE.Vector3(this.MAP_WIDTH - 20, 0, this.MAP_HEIGHT / 2),
      'enemy',
      'HQ'
    );
  }

  private spawnResourceNodes(): void {
    const nodes: ResourceNodeType[] = [
      { id: 'b1', type: 'biomass', x: 40, y: 40, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b2', type: 'biomass', x: 50, y: this.MAP_HEIGHT - 40, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b3', type: 'biomass', x: this.MAP_WIDTH / 2, y: 35, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b4', type: 'biomass', x: this.MAP_WIDTH / 2, y: this.MAP_HEIGHT - 35, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b5', type: 'biomass', x: this.MAP_WIDTH - 40, y: 40, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b6', type: 'biomass', x: this.MAP_WIDTH - 50, y: this.MAP_HEIGHT - 40, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
    ];
    
    for (const nodeData of nodes) {
      const node = new ResourceNode3D(this.scene, nodeData);
      this.resourceNodes.push(node);
    }
  }

  private spawnWorkers(): void {
    // Player workers
    for (let i = 0; i < GAME_CONSTANTS.STARTING_WORKERS; i++) {
      const angle = (i / GAME_CONSTANTS.STARTING_WORKERS) * Math.PI * 2;
      const radius = 8;
      const pos = new THREE.Vector3(
        this.playerHQ.x + Math.cos(angle) * radius,
        0,
        this.playerHQ.y + Math.sin(angle) * radius
      );
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit3D(this.scene, pos, workerCreature, 'player', 'worker', this.playerHQ);
      this.playerUnits.push(worker);
    }
    
    // Enemy workers
    for (let i = 0; i < GAME_CONSTANTS.STARTING_WORKERS; i++) {
      const angle = (i / GAME_CONSTANTS.STARTING_WORKERS) * Math.PI * 2;
      const radius = 8;
      const pos = new THREE.Vector3(
        this.enemyHQ.x + Math.cos(angle) * radius,
        0,
        this.enemyHQ.y + Math.sin(angle) * radius
      );
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit3D(this.scene, pos, workerCreature, 'enemy', 'worker', this.enemyHQ);
      this.enemyUnits.push(worker);
    }
  }

  private createWorkerCreature(): HybridCreature {
    return {
      id: 'worker',
      parent1: ANIMAL_ARCHETYPES[0],
      parent2: ANIMAL_ARCHETYPES[1],
      name: 'עובד',
      hp: 50,
      speed: 5,
      attack: 1,
      range: 1,
      vision: 6,
      specialPrimary: '',
      specialSecondary: '',
      primaryColor: '#FACC15',
      secondaryColor: '#854D0E',
      costDNA: 0,
      costBiomass: 0
    };
  }

  private spawnPlayerArmy(hybrid: HybridCreature): void {
    const unitCount = 3;
    const startX = this.playerHQ.x + 15;
    const startZ = this.playerHQ.y;
    const spacing = 7;
    
    for (let i = 0; i < unitCount; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const pos = new THREE.Vector3(
        startX + col * spacing,
        0,
        startZ - 5 + row * spacing
      );
      
      const unit = new Unit3D(this.scene, pos, hybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }

  private spawnEnemyArmy(): void {
    const enemyCount = 2;
    const spawnX = this.enemyHQ.x - 15;
    const spawnZ = this.enemyHQ.y;
    const spacing = 7;
    
    for (let i = 0; i < enemyCount; i++) {
      const animal1 = ANIMAL_ARCHETYPES[Math.floor(Math.random() * ANIMAL_ARCHETYPES.length)];
      const animal2 = ANIMAL_ARCHETYPES[Math.floor(Math.random() * ANIMAL_ARCHETYPES.length)];
      const hybrid = GameData.createHybrid(animal1, animal2);
      
      const pos = new THREE.Vector3(
        spawnX - (i % 2) * spacing,
        0,
        spawnZ - 5 + Math.floor(i / 2) * spacing
      );
      
      const unit = new Unit3D(this.scene, pos, hybrid, 'enemy', 'combat');
      this.enemyUnits.push(unit);
    }
  }

  private handleLeftClick(worldPos: THREE.Vector3, shift: boolean): void {
    // Check if clicking on HQ first
    const clickedHQ = this.getHQAtPosition(worldPos);
    if (clickedHQ === this.playerHQ) {
      // Select player HQ - show train panel
      if (!shift) {
        this.clearSelection();
      }
      this.uiManager.showTrainPanel(this.armyRoster, this.playerResources, {
        onTrainWorker: () => this.trainWorker(),
        onTrainUnit: (hybrid: HybridCreature) => this.trainCombatUnit(hybrid),
        onTrainArchetype: (archetype: AnimalArchetype) => this.trainArchetype(archetype)
      });
      this.updateSelectionUI();
      return;
    }
    
    // Raycast to find unit at click position
    const clickedUnit = this.getUnitAtPosition(worldPos);
    
    if (clickedUnit && clickedUnit.team === 'player') {
      if (!shift) {
        this.clearSelection();
      } else {
        if (this.selectedUnits.includes(clickedUnit)) {
          clickedUnit.setSelected(false);
          this.selectedUnits = this.selectedUnits.filter(u => u !== clickedUnit);
          return;
        }
      }
      clickedUnit.setSelected(true);
      if (!this.selectedUnits.includes(clickedUnit)) {
        this.selectedUnits.push(clickedUnit);
      }
      // Hide train panel when selecting units (not HQ)
      this.uiManager.hideTrainPanel();
    } else if (!shift) {
      this.clearSelection();
      this.uiManager.hideTrainPanel();
    }
    
    this.updateSelectionUI();
  }
  
  private getHQAtPosition(worldPos: THREE.Vector3): Building3D | null {
    const distanceToPlayerHQ = worldPos.distanceTo(this.playerHQ.getPosition());
    const distanceToEnemyHQ = worldPos.distanceTo(this.enemyHQ.getPosition());
    
    if (distanceToPlayerHQ < 10) return this.playerHQ;
    if (distanceToEnemyHQ < 10) return this.enemyHQ;
    return null;
  }

  private handleRightClick(worldPos: THREE.Vector3): void {
    if (this.selectedUnits.length === 0) return;
    
    // Check for HQ click first (priority target)
    const clickedHQ = this.getHQAtPosition(worldPos);
    if (clickedHQ && clickedHQ === this.enemyHQ) {
      // Attack enemy HQ!
      const combatUnits = this.selectedUnits.filter(u => u.role === 'combat');
      for (const unit of combatUnits) {
        unit.targetEnemy = null; // Clear enemy unit target
        unit.moveToPosition(this.enemyHQ.getPosition().x, this.enemyHQ.getPosition().z);
      }
      return;
    }
    
    // Check for resource node
    const clickedNode = this.getResourceNodeAtPosition(worldPos);
    if (clickedNode && !clickedNode.isEmpty()) {
      const workers = this.selectedUnits.filter(u => u.role === 'worker');
      for (const worker of workers) {
        worker.orderGather(clickedNode);
      }
      return;
    }
    
    // Check for enemy unit or move command
    const targetUnit = this.getUnitAtPosition(worldPos);
    
    for (const unit of this.selectedUnits) {
      if (targetUnit && targetUnit.team === 'enemy') {
        unit.targetEnemy = targetUnit;
        unit.moveToPosition(targetUnit.getPosition().x, targetUnit.getPosition().z);
      } else {
        unit.targetEnemy = null;
        unit.moveToPosition(worldPos.x, worldPos.z);
      }
    }
  }

  private handleBoxSelect(start: THREE.Vector3, end: THREE.Vector3, shift: boolean): void {
    if (!shift) {
      this.clearSelection();
    }
    
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);
    
    for (const unit of this.playerUnits) {
      const pos = unit.getPosition();
      if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
        unit.setSelected(true);
        if (!this.selectedUnits.includes(unit)) {
          this.selectedUnits.push(unit);
        }
      }
    }
    
    this.updateSelectionUI();
  }

  private getUnitAtPosition(worldPos: THREE.Vector3): Unit3D | null {
    const allUnits = [...this.playerUnits, ...this.enemyUnits];
    for (const unit of allUnits) {
      const distance = worldPos.distanceTo(unit.getPosition());
      if (distance < 3) {
        return unit;
      }
    }
    return null;
  }

  private getResourceNodeAtPosition(worldPos: THREE.Vector3): ResourceNode3D | null {
    for (const node of this.resourceNodes) {
      const distance = worldPos.distanceTo(node.getPosition());
      if (distance < 4) {
        return node;
      }
    }
    return null;
  }

  private clearSelection(): void {
    for (const unit of this.selectedUnits) {
      unit.setSelected(false);
    }
    this.selectedUnits = [];
    this.updateSelectionUI();
  }

  private updateSelectionUI(): void {
    this.uiManager.updateSelection(this.selectedUnits);
  }

  private onResourceGathered(event: any): void {
    if (event.team === 'player') {
      this.playerResources.biomass += event.amount;
      this.updateResourceUI();
    } else {
      this.enemyResources.biomass += event.amount;
    }
  }

  private updateResourceUI(): void {
    this.uiManager.updateResources(this.playerResources);
    this.uiManager.updateHQHP(this.playerHQ, this.enemyHQ);
    this.uiManager.refreshTrainPanel(this.playerResources);
  }

  private trainWorker(): void {
    if (this.playerResources.dna >= GAME_CONSTANTS.WORKER_COST_DNA &&
        this.playerResources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
      this.playerResources.dna -= GAME_CONSTANTS.WORKER_COST_DNA;
      this.playerResources.biomass -= GAME_CONSTANTS.WORKER_COST_BIOMASS;
      this.updateResourceUI();
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 8;
      const pos = new THREE.Vector3(
        this.playerHQ.x + Math.cos(angle) * radius,
        0,
        this.playerHQ.y + Math.sin(angle) * radius
      );
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit3D(this.scene, pos, workerCreature, 'player', 'worker', this.playerHQ);
      this.playerUnits.push(worker);
      
      // Auto-assign to nearest node
      const nearestNode = this.findNearestResourceNode(worker);
      if (nearestNode && !nearestNode.isEmpty()) {
        worker.orderGather(nearestNode);
      }
    }
  }

  private findNearestResourceNode(worker: Unit3D): ResourceNode3D | null {
    let nearest: ResourceNode3D | null = null;
    let minDistance = Infinity;
    
    for (const node of this.resourceNodes) {
      if (node.isEmpty()) continue;
      const distance = worker.getPosition().distanceTo(node.getPosition());
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }
    
    return nearest;
  }

  private trainCombatUnit(hybrid: HybridCreature): void {
    if (this.playerResources.dna >= hybrid.costDNA &&
        this.playerResources.biomass >= hybrid.costBiomass) {
      this.playerResources.dna -= hybrid.costDNA;
      this.playerResources.biomass -= hybrid.costBiomass;
      this.updateResourceUI();
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 10;
      const pos = new THREE.Vector3(
        this.playerHQ.x + Math.cos(angle) * radius,
        0,
        this.playerHQ.y + Math.sin(angle) * radius
      );
      
      const unit = new Unit3D(this.scene, pos, hybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }

  private trainArchetype(archetype: AnimalArchetype): void {
    if (this.playerResources.dna >= archetype.costDNA &&
        this.playerResources.biomass >= archetype.costBiomass) {
      this.playerResources.dna -= archetype.costDNA;
      this.playerResources.biomass -= archetype.costBiomass;
      this.updateResourceUI();
      
      const archetypeHybrid: HybridCreature = {
        id: `archetype_${archetype.id}_${Date.now()}`,
        parent1: archetype,
        parent2: archetype,
        name: archetype.nameHebrew,
        hp: archetype.hp,
        speed: archetype.speed,
        attack: archetype.attack,
        range: archetype.range,
        vision: archetype.vision,
        specialPrimary: archetype.special,
        specialSecondary: '',
        primaryColor: archetype.primaryColor,
        secondaryColor: archetype.secondaryColor,
        costDNA: archetype.costDNA,
        costBiomass: archetype.costBiomass
      };
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 10;
      const pos = new THREE.Vector3(
        this.playerHQ.x + Math.cos(angle) * radius,
        0,
        this.playerHQ.y + Math.sin(angle) * radius
      );
      
      const unit = new Unit3D(this.scene, pos, archetypeHybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }

  public update(delta: number): void {
    if (this.gameEnded) return;
    
    // DNA trickle
    this.dnaTrickleTimer += delta * 1000;
    if (this.dnaTrickleTimer >= GAME_CONSTANTS.DNA_TRICKLE_INTERVAL) {
      this.dnaTrickleTimer -= GAME_CONSTANTS.DNA_TRICKLE_INTERVAL;
      this.playerResources.dna += GAME_CONSTANTS.DNA_TRICKLE_RATE;
      this.enemyResources.dna += GAME_CONSTANTS.DNA_TRICKLE_RATE;
      this.updateResourceUI();
    }
    
    // Update all units
    this.playerUnits = this.playerUnits.filter(unit => {
      unit.update(delta * 1000);
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    this.enemyUnits = this.enemyUnits.filter(unit => {
      unit.update(delta * 1000);
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    this.selectedUnits = this.selectedUnits.filter(unit => unit.currentHp > 0);
    
    // Update buildings
    this.playerHQ.update();
    this.enemyHQ.update();
    
    // Update resource nodes
    for (const node of this.resourceNodes) {
      node.update();
    }
    
    // Combat logic
    this.updateCombat(delta * 1000);
    
    // Simple AI
    this.updateAI(delta * 1000);
    
    // Update minimap
    this.minimap.update(
      this.playerUnits,
      this.enemyUnits,
      this.camera,
      this.playerHQ,
      this.enemyHQ,
      this.resourceNodes
    );
    
    // Check win/lose conditions
    this.checkGameEnd();
    
    // Update UI
    this.uiManager.updateHPBars(this.playerUnits, this.enemyUnits);
    
    // Store camera position for billboards
    this.scene.userData.cameraPosition = this.scene.userData.cameraPosition || new THREE.Vector3();
  }

  private updateCombat(_delta: number): void {
    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      // Skip workers - they don't attack
      if (unit.role !== 'combat') continue;
      
      // Retarget if target is dead
      if (unit.targetEnemy && unit.targetEnemy.currentHp <= 0) {
        const enemies = unit.team === 'player' ? this.enemyUnits : this.playerUnits;
        const nearest = unit.findNearestEnemy(enemies.filter(u => u.role === 'combat'));
        unit.targetEnemy = nearest;
        if (nearest) {
          unit.moveToPosition(nearest.getPosition().x, nearest.getPosition().z);
        }
      }
      
      // Chase target if it has moved
      if (unit.targetEnemy) {
        const distance = unit.getPosition().distanceTo(unit.targetEnemy.getPosition());
        const effectiveRange = unit.creature.range * 3;
        
        // Chase if target moved out of range
        if (distance > effectiveRange) {
          unit.moveToPosition(unit.targetEnemy.getPosition().x, unit.targetEnemy.getPosition().z);
        }
        
        // Attack if in range
        if (distance <= effectiveRange) {
          unit.attackTarget(unit.targetEnemy);
        }
      } else {
        // Auto-acquire: attack nearby enemies
        const enemies = unit.team === 'player' ? this.enemyUnits : this.playerUnits;
        const nearestEnemy = unit.findNearestEnemy(enemies.filter(u => u.role === 'combat'));
        
        if (nearestEnemy) {
          const distance = unit.getPosition().distanceTo(nearestEnemy.getPosition());
          const aggroRange = 20; // Auto-acquire range
          
          if (distance <= aggroRange) {
            unit.targetEnemy = nearestEnemy;
            unit.moveToPosition(nearestEnemy.getPosition().x, nearestEnemy.getPosition().z);
          }
        }
        
        // If still no target, attack enemy HQ if close
        if (!unit.targetEnemy) {
          const enemyHQ = unit.team === 'player' ? this.enemyHQ : this.playerHQ;
          const distanceToHQ = unit.getPosition().distanceTo(enemyHQ.getPosition());
          
          if (distanceToHQ <= unit.creature.range * 5) {
            if (unit.attackCooldown === 0) {
              const damage = unit.creature.attack;
              enemyHQ.takeDamage(damage);
              console.log(`[Combat] ${unit.team} unit attacking ${enemyHQ === this.playerHQ ? 'player' : 'enemy'} HQ for ${damage} damage. HQ HP: ${enemyHQ.currentHp}/${enemyHQ.maxHp}`);
              unit.attackCooldown = 1000;
            }
          }
        }
      }
    }
  }

  private updateAI(delta: number): void {
    // Simple AI: enemy units patrol and attack nearby player units
    this.aiUpdateTimer += delta;
    if (this.aiUpdateTimer < 400) return; // Update every 400ms
    this.aiUpdateTimer = 0;
    
    for (const enemyUnit of this.enemyUnits) {
      if (enemyUnit.role !== 'combat') continue;
      
      // Find nearest player combat unit
      let nearestPlayer: Unit3D | null = null;
      let minDistance = Infinity;
      
      for (const playerUnit of this.playerUnits) {
        if (playerUnit.role !== 'combat') continue;
        const distance = enemyUnit.getPosition().distanceTo(playerUnit.getPosition());
        if (distance < minDistance && distance < 25) {
          minDistance = distance;
          nearestPlayer = playerUnit;
        }
      }
      
      if (nearestPlayer && !enemyUnit.targetEnemy) {
        enemyUnit.targetEnemy = nearestPlayer;
        enemyUnit.moveToPosition(nearestPlayer.getPosition().x, nearestPlayer.getPosition().z);
      }
    }
  }

  private checkGameEnd(): void {
    if (this.playerHQ.currentHp <= 0) {
      this.gameEnded = true;
      console.log('[GameManager] Player HQ destroyed - showing lose modal');
      this.uiManager.showGameOver(false, strings.lose.baseDown);
    } else if (this.enemyHQ.currentHp <= 0) {
      this.gameEnded = true;
      console.log('[GameManager] Enemy HQ destroyed - showing win modal');
      this.uiManager.showGameOver(true, strings.win.destroyBase);
    }
  }

  public dispose(): void {
    // Clean up all entities
    for (const unit of this.playerUnits) {
      unit.destroy();
    }
    for (const unit of this.enemyUnits) {
      unit.destroy();
    }
    for (const node of this.resourceNodes) {
      node.destroy();
    }
    this.playerHQ.destroy();
    this.enemyHQ.destroy();
    
    this.uiManager.hide();
    this.minimap.destroy();
  }
}

import Phaser from 'phaser';
import { HybridCreature, EconomyState, ResourceNode as ResourceNodeType, AnimalArchetype } from './types';
import { Unit } from './Unit';
import { Building } from './Building';
import { ResourceNode } from './ResourceNode';
import { AI } from './AI';
import { ANIMAL_ARCHETYPES, GameData } from './GameData';
import { strings, colors } from './i18n';
import { FogOfWar } from './FogOfWar';
import { Minimap } from './Minimap';
import { GAME_CONSTANTS } from './constants';

export class BattleScene extends Phaser.Scene {
  private playerUnits: Unit[] = [];
  private enemyUnits: Unit[] = [];
  private selectedUnits: Unit[] = [];
  private ai!: AI;
  private selectionBox: Phaser.GameObjects.Rectangle | null = null;
  private selectionStart: { x: number; y: number } | null = null;
  private gameEnded: boolean = false;
  private clickMarker: Phaser.GameObjects.Arc | null = null;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private rivalHPBar!: Phaser.GameObjects.Graphics;
  private onboardingShown: boolean = false;
  private onboardingTip: Phaser.GameObjects.Container | null = null;
  private selectedUnitText!: Phaser.GameObjects.Text;
  private selectedHPText!: Phaser.GameObjects.Text;
  private selectedHPBar!: Phaser.GameObjects.Graphics;
  private fogOfWar!: FogOfWar;
  private minimap!: Minimap;
  private controlGroups: Map<number, Unit[]> = new Map();
  private helpOverlay: Phaser.GameObjects.Container | null = null;
  private pointerInWindow: boolean = true;
  
  // Economy system
  private playerResources: EconomyState = { biomass: 0, dna: 0 };
  private enemyResources: EconomyState = { biomass: 0, dna: 0 };
  private playerHQ!: Building;
  private enemyHQ!: Building;
  private resourceNodes: ResourceNode[] = [];
  private resourceTexts: { biomass: Phaser.GameObjects.Text; dna: Phaser.GameObjects.Text } | null = null;
  private trainPanel: Phaser.GameObjects.Container | null = null;
  private dnaTrickleTimer: number = 0;
  private armyRoster: HybridCreature[] = [];
  private selectedUnitToTrain: HybridCreature | null = null;
  
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;
  private readonly CAMERA_SPEED = GAME_CONSTANTS.CAMERA_PAN_SPEED;
  private readonly MIN_ZOOM = GAME_CONSTANTS.CAMERA_ZOOM_MIN;
  private readonly MAX_ZOOM = GAME_CONSTANTS.CAMERA_ZOOM_MAX;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(data: { armyRoster?: HybridCreature[]; hybrid?: HybridCreature }): void {
    this.gameEnded = false;
    this.controlGroups.clear();
    
    // Support both old (hybrid) and new (armyRoster) formats for compatibility
    if (data.armyRoster && data.armyRoster.length > 0) {
      this.armyRoster = data.armyRoster;
      this.selectedUnitToTrain = this.armyRoster[0]; // Default to first unit
      this.registry.set('lastHybrid', this.armyRoster[0]); // For compatibility
    } else if (data.hybrid) {
      // Fallback for old single-hybrid format
      this.armyRoster = [data.hybrid];
      this.selectedUnitToTrain = data.hybrid;
      this.registry.set('lastHybrid', data.hybrid);
    } else {
      // No army at all, shouldn't happen
      this.armyRoster = [];
    }
    
    // Clear old units if restarting
    this.playerUnits = [];
    this.enemyUnits = [];
    this.selectedUnits = [];
    this.resourceNodes = [];
    
    // Initialize economy
    this.playerResources = { 
      biomass: GAME_CONSTANTS.STARTING_BIOMASS, 
      dna: GAME_CONSTANTS.STARTING_DNA 
    };
    this.enemyResources = { 
      biomass: GAME_CONSTANTS.STARTING_BIOMASS, 
      dna: GAME_CONSTANTS.STARTING_DNA 
    };
    this.dnaTrickleTimer = 0;
    
    // Destroy old fog/minimap if they exist
    if (this.fogOfWar) {
      this.fogOfWar.destroy();
    }
    if (this.minimap) {
      this.minimap.destroy();
    }

    this.add.rectangle(this.MAP_WIDTH / 2, this.MAP_HEIGHT / 2, this.MAP_WIDTH, this.MAP_HEIGHT, 0x1a3a1a);
    
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    cam.setZoom(1);

    this.fogOfWar = new FogOfWar(this, this.MAP_WIDTH, this.MAP_HEIGHT);

    // Spawn economy structures first
    this.spawnHQs();
    this.spawnResourceNodes();
    this.spawnWorkers();
    
    // Spawn starting combat army (small starting force)
    if (this.armyRoster.length > 0) {
      this.spawnPlayerArmy(this.armyRoster[0]);
    }
    this.spawnEnemyArmy();

    // Center camera on player HQ
    cam.centerOn(this.playerHQ.x, this.playerHQ.y);

    this.minimap = new Minimap(this, this.MAP_WIDTH, this.MAP_HEIGHT);

    this.ai = new AI(this.enemyUnits, this.playerUnits, this.enemyHQ, this.enemyResources, this.resourceNodes);

    this.setupUI();
    this.setupInput();
    this.setupKeyboard();
    
    // Listen for resource gathering events
    this.events.on('resource-gathered', this.onResourceGathered, this);

    if (!this.onboardingShown) {
      this.time.delayedCall(500, () => {
        this.showOnboardingTip(strings.onboard.cameraFog, 400, 520);
      });
    }
  }

  private setupUI(): void {
    // Battle title with semi-transparent background for better readability
    this.add.rectangle(400, 20, 200, 40, 0x000000, 0.7).setOrigin(0.5).setScrollFactor(0);
    this.add.text(400, 20, strings.battle.title, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setScrollFactor(0);

    // Resource counters
    this.createResourceUI();

    // Player label with background and shadow
    this.add.rectangle(100, 68, 80, 28, 0x000000, 0.6).setOrigin(0, 0.5).setScrollFactor(0);
    this.add.text(100, 60, strings.deploy.you, {
      fontSize: '18px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
    }).setScrollFactor(0);

    this.playerHPBar = this.add.graphics().setScrollFactor(0);

    // Rival label with background and shadow
    this.add.rectangle(700, 68, 80, 28, 0x000000, 0.6).setOrigin(1, 0.5).setScrollFactor(0);
    this.add.text(700, 60, strings.deploy.rival, {
      fontSize: '18px',
      color: colors.rivalHex,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
    }).setOrigin(1, 0).setScrollFactor(0);

    this.rivalHPBar = this.add.graphics().setScrollFactor(0);

    this.createSelectedUnitPanel();
    this.createTrainPanel();
  }
  
  private createResourceUI(): void {
    const bgWidth = 200;
    const bgHeight = 30;
    const startX = 400 - bgWidth / 2;
    const startY = 60;
    
    this.add.rectangle(400, startY, bgWidth, bgHeight, 0x000000, 0.8).setScrollFactor(0);
    
    const biomassText = this.add.text(startX + 10, startY, `${strings.economy.biomass}: ${this.playerResources.biomass}`, {
      fontSize: '14px',
      color: '#22C55E',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    
    const dnaText = this.add.text(startX + 110, startY, `${strings.economy.dna}: ${this.playerResources.dna}`, {
      fontSize: '14px',
      color: '#9b59b6',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    
    this.resourceTexts = { biomass: biomassText, dna: dnaText };
  }
  
  private createTrainPanel(): void {
    this.trainPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    
    const panelX = 50;
    const panelY = 150;
    const panelWidth = 180;
    const panelHeight = 300;
    
    const bg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.85)
      .setOrigin(0, 0).setScrollFactor(0);
    this.trainPanel.add(bg);
    
    const title = this.add.text(panelX + panelWidth / 2, panelY + 15, strings.panel.train, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.trainPanel.add(title);
    
    // P0: Worker + 3 cheap units only (Bat-Echo, Horn-Deer, Quill-Snake)
    const p0Units: Array<{ name: string; cost: { dna: number; biomass: number }; type: 'worker' | 'unit' | 'archetype'; hybrid?: HybridCreature; archetype?: AnimalArchetype }> = [
      { name: strings.panel.worker, cost: { dna: GAME_CONSTANTS.WORKER_COST_DNA, biomass: GAME_CONSTANTS.WORKER_COST_BIOMASS }, type: 'worker' },
      ...this.armyRoster.filter(h => 
        h.parent1.id === 'bat-echo' || h.parent2.id === 'bat-echo' ||
        h.parent1.id === 'horn-deer' || h.parent2.id === 'horn-deer' ||
        h.parent1.id === 'quill-snake' || h.parent2.id === 'quill-snake'
      ).slice(0, 3).map(h => ({ name: h.name, cost: { dna: h.costDNA, biomass: h.costBiomass }, type: 'unit' as const, hybrid: h }))
    ];
    
    // If no matching P0 units in roster, add defaults
    if (p0Units.length < 4) {
      const batEcho = ANIMAL_ARCHETYPES.find(a => a.id === 'bat-echo');
      const hornDeer = ANIMAL_ARCHETYPES.find(a => a.id === 'horn-deer');
      const quillSnake = ANIMAL_ARCHETYPES.find(a => a.id === 'quill-snake');
      
      if (batEcho && p0Units.length === 1) {
        p0Units.push({ name: batEcho.nameHebrew, cost: { dna: batEcho.costDNA, biomass: batEcho.costBiomass }, type: 'archetype', archetype: batEcho });
      }
      if (hornDeer && p0Units.length === 2) {
        p0Units.push({ name: hornDeer.nameHebrew, cost: { dna: hornDeer.costDNA, biomass: hornDeer.costBiomass }, type: 'archetype', archetype: hornDeer });
      }
      if (quillSnake && p0Units.length === 3) {
        p0Units.push({ name: quillSnake.nameHebrew, cost: { dna: quillSnake.costDNA, biomass: quillSnake.costBiomass }, type: 'archetype', archetype: quillSnake });
      }
    }
    
    let yOffset = 50;
    for (let i = 0; i < p0Units.length; i++) {
      const unitData = p0Units[i];
      const unitY = panelY + yOffset + i * 60;
      
      const canAfford = this.playerResources.dna >= unitData.cost.dna && 
                       this.playerResources.biomass >= unitData.cost.biomass;
      
      const unitBtn = this.add.rectangle(panelX + panelWidth / 2, unitY, 160, 50, canAfford ? 0x2DD4BF : 0x666666, 0.8)
        .setInteractive({ useHandCursor: canAfford }).setScrollFactor(0);
      this.trainPanel.add(unitBtn);
      
      const unitName = this.add.text(panelX + panelWidth / 2, unitY - 10, unitData.name, {
        fontSize: '13px',
        color: canAfford ? '#ffffff' : '#888888',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0);
      this.trainPanel.add(unitName);
      
      const unitCostText = this.add.text(panelX + panelWidth / 2, unitY + 10, `${unitData.cost.dna}D ${unitData.cost.biomass}B`, {
        fontSize: '11px',
        color: canAfford ? '#ffffff' : '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0);
      this.trainPanel.add(unitCostText);
      
      if (canAfford) {
        unitBtn.on('pointerdown', () => {
          if (unitData.type === 'worker') {
            this.trainWorker();
          } else if (unitData.type === 'unit' && unitData.hybrid) {
            this.selectedUnitToTrain = unitData.hybrid;
            this.trainCombatUnit();
          } else if (unitData.type === 'archetype' && unitData.archetype) {
            this.trainArchetype(unitData.archetype);
          }
          // Refresh panel after training
          this.trainPanel?.destroy();
          this.createTrainPanel();
        });
      }
    }
  }

  private setupInput(): void {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Canvas-specific pointer enter/leave events (primary edge-pan guard)
    this.input.on('gameout', this.onGameOut, this);
    this.input.on('gameover', this.onGameOver, this);
    
    // Browser window-level blur/focus (reliable window focus detection)
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('focus', this.onWindowFocus);
    
    // Document visibility change (tab switching)
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.gameEnded) return;
      
      const cam = this.cameras.main;
      const zoomDirection = deltaY > 0 ? -1 : 1;
      const newZoom = Phaser.Math.Clamp(
        cam.zoom + zoomDirection * GAME_CONSTANTS.CAMERA_ZOOM_STEP,
        this.MIN_ZOOM,
        this.MAX_ZOOM
      );
      
      if (newZoom !== cam.zoom) {
        const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
        cam.setZoom(newZoom);
        const newWorldPoint = cam.getWorldPoint(pointer.x, pointer.y);
        cam.scrollX += worldPoint.x - newWorldPoint.x;
        cam.scrollY += worldPoint.y - newWorldPoint.y;
      }
    });

    this.input.mouse!.disableContextMenu();
  }

  private onGameOut = (): void => {
    this.pointerInWindow = false;
  };

  private onGameOver = (): void => {
    this.pointerInWindow = true;
  };

  private onWindowBlur = (): void => {
    this.pointerInWindow = false;
  };

  private onWindowFocus = (): void => {
    // Don't force true - only resume if pointer is actually in canvas
    // Let gameover event handle re-entry
  };
  
  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.pointerInWindow = false;
    }
    // On visible: don't force true, wait for gameover
  };

  shutdown(): void {
    // Clean up ALL event listeners to prevent stacked handlers on rematch
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.off('gameout', this.onGameOut, this);
    this.input.off('gameover', this.onGameOver, this);
    
    // Remove economy event listener
    this.events.off('resource-gathered', this.onResourceGathered, this);
    
    // Remove browser window/document listeners
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('focus', this.onWindowFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    
    // Remove keyboard listeners
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }
  }

  private setupKeyboard(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    
    // Prevent WASD keys from bubbling to browser (prevents D key navigation, etc)
    this.wasdKeys.w.on('down', (event: KeyboardEvent) => event.preventDefault());
    this.wasdKeys.a.on('down', (event: KeyboardEvent) => event.preventDefault());
    this.wasdKeys.s.on('down', (event: KeyboardEvent) => event.preventDefault());
    this.wasdKeys.d.on('down', (event: KeyboardEvent) => event.preventDefault());

    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.gameEnded && this.selectedUnits.length > 0) {
        this.centerCameraOnSelection();
      }
    });

    this.input.keyboard!.on('keydown-A', (event: KeyboardEvent) => {
      if (event.ctrlKey && !this.gameEnded) {
        this.selectAllPlayerUnits();
      }
    });

    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      // Priority: Always close help first, then deselect
      if (this.helpOverlay) {
        event.preventDefault();
        this.closeHelpOverlay();
        // Do NOT deselect when closing help
      } else if (!this.gameEnded) {
        this.clearSelection();
      }
    });

    this.input.keyboard!.on('keydown-X', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-DELETE', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-BACK_SPACE', () => {
      if (!this.gameEnded) this.stopSelectedUnits();
    });

    this.input.keyboard!.on('keydown-F1', (event: KeyboardEvent) => {
      event.preventDefault();
      this.toggleHelpOverlay();
    });

    this.input.keyboard!.on('keydown-SLASH', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        this.toggleHelpOverlay();
      }
    });

    const numberKeys = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    for (let i = 0; i <= 9; i++) {
      const keyCode = numberKeys[i];
      this.input.keyboard!.on(`keydown-${keyCode}`, (event: KeyboardEvent) => {
        if (event.ctrlKey && !this.gameEnded) {
          event.preventDefault();
          this.assignControlGroup(i);
        } else if (!this.gameEnded) {
          this.recallControlGroup(i);
        }
      });
    }
  }

  private spawnHQs(): void {
    // Player HQ on the left
    const playerHQX = 200;
    const playerHQY = this.MAP_HEIGHT / 2;
    this.playerHQ = new Building(this, playerHQX, playerHQY, 'player', strings.economy.hq);
    
    // Enemy HQ on the right
    const enemyHQX = this.MAP_WIDTH - 200;
    const enemyHQY = this.MAP_HEIGHT / 2;
    this.enemyHQ = new Building(this, enemyHQX, enemyHQY, 'enemy', strings.economy.hq);
  }
  
  private spawnResourceNodes(): void {
    const nodes: ResourceNodeType[] = [
      // Left side (near player) - biomass only
      { id: 'b1', type: 'biomass', x: 400, y: 400, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b2', type: 'biomass', x: 500, y: this.MAP_HEIGHT - 400, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      
      // Center - biomass only
      { id: 'b3', type: 'biomass', x: this.MAP_WIDTH / 2, y: 350, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b4', type: 'biomass', x: this.MAP_WIDTH / 2, y: this.MAP_HEIGHT - 350, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      
      // Right side (near enemy) - biomass only
      { id: 'b5', type: 'biomass', x: this.MAP_WIDTH - 400, y: 400, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
      { id: 'b6', type: 'biomass', x: this.MAP_WIDTH - 500, y: this.MAP_HEIGHT - 400, amount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT, maxAmount: GAME_CONSTANTS.RESOURCE_NODE_BIOMASS_AMOUNT },
    ];
    
    for (const nodeData of nodes) {
      const node = new ResourceNode(this, nodeData);
      this.resourceNodes.push(node);
    }
  }
  
  private spawnWorkers(): void {
    // Spawn player workers near player HQ
    for (let i = 0; i < GAME_CONSTANTS.STARTING_WORKERS; i++) {
      const angle = (i / GAME_CONSTANTS.STARTING_WORKERS) * Math.PI * 2;
      const radius = 80;
      const x = this.playerHQ.x + Math.cos(angle) * radius;
      const y = this.playerHQ.y + Math.sin(angle) * radius;
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit(this, x, y, workerCreature, 'player', 'worker', this.playerHQ);
      this.playerUnits.push(worker);
    }
    
    // Spawn enemy workers near enemy HQ
    for (let i = 0; i < GAME_CONSTANTS.STARTING_WORKERS; i++) {
      const angle = (i / GAME_CONSTANTS.STARTING_WORKERS) * Math.PI * 2;
      const radius = 80;
      const x = this.enemyHQ.x + Math.cos(angle) * radius;
      const y = this.enemyHQ.y + Math.sin(angle) * radius;
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit(this, x, y, workerCreature, 'enemy', 'worker', this.enemyHQ);
      this.enemyUnits.push(worker);
    }
  }
  
  private createWorkerCreature(): HybridCreature {
    // Simple worker stats
    return {
      id: 'worker',
      parent1: ANIMAL_ARCHETYPES[0],
      parent2: ANIMAL_ARCHETYPES[1],
      name: strings.economy.worker,
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
    const unitCount = 3; // Reduced initial army, economy will produce more
    const startX = this.playerHQ.x + 150;
    const startY = this.playerHQ.y;
    const spacing = 70;

    for (let i = 0; i < unitCount; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = startX + col * spacing;
      const y = startY - 50 + row * spacing;
      
      const unit = new Unit(this, x, y, hybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }

  private spawnEnemyArmy(): void {
    const enemyCount = 2; // Reduced initial army
    const spawnX = this.enemyHQ.x - 150;
    const spawnY = this.enemyHQ.y;
    const spacing = 70;

    for (let i = 0; i < enemyCount; i++) {
      const animal1 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES);
      const animal2 = Phaser.Math.RND.pick(ANIMAL_ARCHETYPES.filter(a => a.id !== animal1.id));
      const hybrid = GameData.createHybrid(animal1, animal2);

      const x = spawnX - (i % 2) * spacing;
      const y = spawnY - 50 + Math.floor(i / 2) * spacing;
      const unit = new Unit(this, x, y, hybrid, 'enemy', 'combat');
      this.enemyUnits.push(unit);
    }
  }
  
  private onResourceGathered(data: { team: 'player' | 'enemy'; amount: number }): void {
    if (data.team === 'player') {
      this.playerResources.biomass += data.amount;
      this.updateResourceUI();
    } else {
      this.enemyResources.biomass += data.amount;
    }
  }
  
  private updateResourceUI(): void {
    if (this.resourceTexts) {
      this.resourceTexts.biomass.setText(`${strings.economy.biomass}: ${this.playerResources.biomass}`);
      this.resourceTexts.dna.setText(`${strings.economy.dna}: ${this.playerResources.dna}`);
    }
  }
  
  private trainWorker(): void {
    if (this.playerResources.dna >= GAME_CONSTANTS.WORKER_COST_DNA &&
        this.playerResources.biomass >= GAME_CONSTANTS.WORKER_COST_BIOMASS) {
      this.playerResources.dna -= GAME_CONSTANTS.WORKER_COST_DNA;
      this.playerResources.biomass -= GAME_CONSTANTS.WORKER_COST_BIOMASS;
      this.updateResourceUI();
      
      // Spawn worker near HQ
      const angle = Math.random() * Math.PI * 2;
      const radius = 80;
      const x = this.playerHQ.x + Math.cos(angle) * radius;
      const y = this.playerHQ.y + Math.sin(angle) * radius;
      
      const workerCreature = this.createWorkerCreature();
      const worker = new Unit(this, x, y, workerCreature, 'player', 'worker', this.playerHQ);
      this.playerUnits.push(worker);
    }
  }
  
  private trainCombatUnit(): void {
    // Use the selected unit from army roster
    const hybrid = this.selectedUnitToTrain || this.armyRoster[0];
    
    if (!hybrid) return;
    
    if (this.playerResources.dna >= hybrid.costDNA &&
        this.playerResources.biomass >= hybrid.costBiomass) {
      this.playerResources.dna -= hybrid.costDNA;
      this.playerResources.biomass -= hybrid.costBiomass;
      this.updateResourceUI();
      
      // Spawn unit near HQ
      const angle = Math.random() * Math.PI * 2;
      const radius = 100;
      const x = this.playerHQ.x + Math.cos(angle) * radius;
      const y = this.playerHQ.y + Math.sin(angle) * radius;
      
      const unit = new Unit(this, x, y, hybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }
  
  private trainArchetype(archetype: AnimalArchetype): void {
    if (this.playerResources.dna >= archetype.costDNA &&
        this.playerResources.biomass >= archetype.costBiomass) {
      this.playerResources.dna -= archetype.costDNA;
      this.playerResources.biomass -= archetype.costBiomass;
      this.updateResourceUI();
      
      // Create a simple single-archetype "hybrid" for this unit
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
      
      // Spawn unit near HQ
      const angle = Math.random() * Math.PI * 2;
      const radius = 100;
      const x = this.playerHQ.x + Math.cos(angle) * radius;
      const y = this.playerHQ.y + Math.sin(angle) * radius;
      
      const unit = new Unit(this, x, y, archetypeHybrid, 'player', 'combat');
      this.playerUnits.push(unit);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.helpOverlay) return;
    
    const cam = this.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const worldX = worldPoint.x;
    const worldY = worldPoint.y;
    
    if (pointer.leftButtonDown()) {
      this.selectionStart = { x: worldX, y: worldY };
      
      const clickedUnit = this.getUnitAtPosition(worldX, worldY);
      
      if (clickedUnit && clickedUnit.team === 'player') {
        if (!pointer.event.shiftKey) {
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
      } else if (!pointer.event.shiftKey) {
        this.clearSelection();
      }
    } else if (pointer.rightButtonDown()) {
      // Check if clicking on a resource node
      const clickedNode = this.getResourceNodeAtPosition(worldX, worldY);
      if (clickedNode && !clickedNode.isEmpty()) {
        // Order selected workers to gather
        const workers = this.selectedUnits.filter(u => u.role === 'worker');
        for (const worker of workers) {
          worker.orderGather(clickedNode);
        }
        this.showClickMarker(worldX, worldY);
      } else {
        // Normal move/attack order
        this.issueOrderToSelected(worldX, worldY);
        this.showClickMarker(worldX, worldY);
      }
    }
  }
  
  private getResourceNodeAtPosition(x: number, y: number): ResourceNode | null {
    for (const node of this.resourceNodes) {
      const distance = Phaser.Math.Distance.Between(x, y, node.x, node.y);
      if (distance < 30) {
        return node;
      }
    }
    return null;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown() && this.selectionStart) {
      const cam = this.cameras.main;
      const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
      
      if (!this.selectionBox) {
        this.selectionBox = this.add.rectangle(0, 0, 0, 0)
          .setStrokeStyle(2, 0x00ff00)
          .setFillStyle(0x00ff00, 0.1);
      }

      const x = Math.min(this.selectionStart.x, worldPoint.x);
      const y = Math.min(this.selectionStart.y, worldPoint.y);
      const width = Math.abs(worldPoint.x - this.selectionStart.x);
      const height = Math.abs(worldPoint.y - this.selectionStart.y);

      this.selectionBox.setPosition(x + width / 2, y + height / 2);
      this.selectionBox.setSize(width, height);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.helpOverlay) return;
    
    const cam = this.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const worldX = worldPoint.x;
    const worldY = worldPoint.y;
    
    if (this.selectionBox && this.selectionStart) {
      const bounds = this.selectionBox.getBounds();
      const boxWidth = Math.abs(worldX - this.selectionStart.x);
      const boxHeight = Math.abs(worldY - this.selectionStart.y);
      
      if (boxWidth > 5 || boxHeight > 5) {
        if (!pointer.event.shiftKey) {
          this.clearSelection();
        }

        let foundAny = false;
        for (const unit of this.playerUnits) {
          if (bounds.contains(unit.x, unit.y)) {
            unit.setSelected(true);
            if (!this.selectedUnits.includes(unit)) {
              this.selectedUnits.push(unit);
            }
            foundAny = true;
          }
        }

        if (!foundAny && !pointer.event.shiftKey) {
          this.clearSelection();
        }
      }
      
      this.selectionBox.destroy();
      this.selectionBox = null;
      this.selectionStart = null;
    }
  }

  private getUnitAtPosition(x: number, y: number): Unit | null {
    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      const distance = Phaser.Math.Distance.Between(x, y, unit.x, unit.y);
      if (distance < 25) {
        return unit;
      }
    }
    return null;
  }

  private issueOrderToSelected(x: number, y: number): void {
    const targetUnit = this.getUnitAtPosition(x, y);

    for (const unit of this.selectedUnits) {
      // Kill existing movement tweens before issuing new orders
      this.tweens.killTweensOf(unit);
      
      if (targetUnit && targetUnit.team === 'enemy') {
        unit.targetEnemy = targetUnit;
        unit.moveToPosition(targetUnit.x, targetUnit.y);
      } else {
        unit.targetEnemy = null;
        unit.moveToPosition(x, y);
      }
    }
  }

  private clearSelection(): void {
    for (const unit of this.selectedUnits) {
      unit.setSelected(false);
    }
    this.selectedUnits = [];
  }

  private selectAllPlayerUnits(): void {
    this.clearSelection();
    for (const unit of this.playerUnits) {
      unit.setSelected(true);
      this.selectedUnits.push(unit);
    }
  }

  private showClickMarker(x: number, y: number): void {
    if (this.clickMarker) {
      this.clickMarker.destroy();
    }
    
    this.clickMarker = this.add.circle(x, y, 8, 0x00ff00, 0.6);
    
    this.tweens.add({
      targets: this.clickMarker,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => {
        if (this.clickMarker) {
          this.clickMarker.destroy();
          this.clickMarker = null;
        }
      }
    });
  }

  update(_time: number, delta: number): void {
    if (!this.gameEnded) {
      this.updateCameraPan(delta);
      
      // DNA trickle for both teams
      this.dnaTrickleTimer += delta;
      if (this.dnaTrickleTimer >= GAME_CONSTANTS.DNA_TRICKLE_INTERVAL) {
        this.dnaTrickleTimer -= GAME_CONSTANTS.DNA_TRICKLE_INTERVAL;
        this.playerResources.dna += GAME_CONSTANTS.DNA_TRICKLE_RATE;
        this.enemyResources.dna += GAME_CONSTANTS.DNA_TRICKLE_RATE;
        this.updateResourceUI();
      }
    }

    this.playerUnits = this.playerUnits.filter(unit => {
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    this.enemyUnits = this.enemyUnits.filter(unit => {
      if (unit.currentHp <= 0) {
        unit.destroy();
        return false;
      }
      return true;
    });
    
    // Update AI with current unit arrays after filtering
    this.ai.updateUnits(this.enemyUnits, this.playerUnits);
    
    this.selectedUnits = this.selectedUnits.filter(unit => unit.currentHp > 0);

    this.fogOfWar.update(this.playerUnits);

    this.minimap.update(this.playerUnits, this.enemyUnits, this.cameras.main, this.playerHQ, this.enemyHQ, this.resourceNodes);

    for (const enemy of this.enemyUnits) {
      enemy.setVisible(this.fogOfWar.isVisible(enemy.x, enemy.y));
    }

    for (const unit of [...this.playerUnits, ...this.enemyUnits]) {
      unit.update(delta);

      if (unit.targetEnemy && unit.targetEnemy.currentHp <= 0) {
        const nearest = unit.findNearestEnemy(unit.team === 'player' ? this.enemyUnits : this.playerUnits);
        unit.targetEnemy = nearest;
        if (nearest) {
          unit.moveToPosition(nearest.x, nearest.y);
        }
      }

      // Combat units can attack enemy HQ
      if (unit.role === 'combat' && unit.targetEnemy === null) {
        const enemyHQ = unit.team === 'player' ? this.enemyHQ : this.playerHQ;
        const distanceToHQ = Phaser.Math.Distance.Between(unit.x, unit.y, enemyHQ.x, enemyHQ.y);
        
        // Auto-attack nearby enemy HQ if no other target
        if (distanceToHQ <= unit.creature.range * 50) {
          if (unit.attackCooldown === 0) {
            enemyHQ.takeDamage(unit.creature.attack);
            unit.attackCooldown = 1000;
          }
        }
      }

      if (unit.targetEnemy) {
        const distance = Phaser.Math.Distance.Between(
          unit.x,
          unit.y,
          unit.targetEnemy.x,
          unit.targetEnemy.y
        );

        const effectiveRange = unit.creature.range * 30;
        if (distance <= effectiveRange) {
          unit.attackTarget(unit.targetEnemy);
        }
      }
    }

    this.updateHPBars();
    this.updateSelectedPanel();

    this.ai.update();

    if (!this.gameEnded) {
      // Check for HQ destruction first (primary win condition)
      if (this.playerHQ.currentHp <= 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: false, message: strings.lose.baseDown });
        });
      } else if (this.enemyHQ.currentHp <= 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: true, message: strings.win.destroyBase });
        });
      }
      // Fallback: army wipeout
      else if (this.playerUnits.length === 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: false });
        });
      } else if (this.enemyUnits.length === 0 && this.enemyHQ.currentHp <= 0) {
        this.gameEnded = true;
        this.time.delayedCall(500, () => {
          this.scene.start('GameOverScene', { victory: true });
        });
      }
    }
  }

  private updateCameraPan(delta: number): void {
    const cam = this.cameras.main;
    const pointer = this.input.activePointer;
    // Convert wu/s to wu/ms, then multiply by delta (ms)
    const panSpeed = (this.CAMERA_SPEED / 1000) * delta;
    
    let cameraMoved = false;

    // WASD/Arrow keys - no acceleration
    if (this.cursors.left.isDown || this.wasdKeys.a.isDown) {
      cam.scrollX -= panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.right.isDown || this.wasdKeys.d.isDown) {
      cam.scrollX += panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.up.isDown || this.wasdKeys.w.isDown) {
      cam.scrollY -= panSpeed;
      cameraMoved = true;
    }
    if (this.cursors.down.isDown || this.wasdKeys.s.isDown) {
      cam.scrollY += panSpeed;
      cameraMoved = true;
    }
    
    // Dismiss onboarding tip after first camera move
    if (cameraMoved && !this.onboardingShown && this.onboardingTip) {
      this.dismissOnboardingTip();
    }

    // Edge-pan: 2.5% of screen with min/max constraints
    if (this.pointerInWindow && !this.helpOverlay) {
      const edgeBandSize = Math.max(
        GAME_CONSTANTS.CAMERA_EDGE_PAN_MIN,
        Math.min(
          GAME_CONSTANTS.CAMERA_EDGE_PAN_MAX,
          this.scale.width * (GAME_CONSTANTS.CAMERA_EDGE_PAN_PERCENT / 100)
        )
      );

      if (pointer.x < edgeBandSize) {
        cam.scrollX -= panSpeed;
      } else if (pointer.x > this.scale.width - edgeBandSize) {
        cam.scrollX += panSpeed;
      }

      if (pointer.y < edgeBandSize) {
        cam.scrollY -= panSpeed;
      } else if (pointer.y > this.scale.height - edgeBandSize) {
        cam.scrollY += panSpeed;
      }
    }
  }

  private updateHPBars(): void {
    this.playerHPBar.clear();
    this.rivalHPBar.clear();

    const playerMaxHP = this.playerUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const playerCurrentHP = this.playerUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const playerPercent = playerMaxHP > 0 ? playerCurrentHP / playerMaxHP : 0;

    const rivalMaxHP = this.enemyUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const rivalCurrentHP = this.enemyUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const rivalPercent = rivalMaxHP > 0 ? rivalCurrentHP / rivalMaxHP : 0;

    const barWidth = 200;
    const barHeight = 20;
    const playerX = 100;
    const rivalX = 600;
    const barY = 80;

    this.playerHPBar.fillStyle(0x000000, 0.5);
    this.playerHPBar.fillRect(playerX, barY, barWidth, barHeight);
    this.playerHPBar.fillStyle(colors.player, 1);
    this.playerHPBar.fillRect(playerX, barY, barWidth * playerPercent, barHeight);

    this.rivalHPBar.fillStyle(0x000000, 0.5);
    this.rivalHPBar.fillRect(rivalX, barY, barWidth, barHeight);
    this.rivalHPBar.fillStyle(colors.rival, 1);
    this.rivalHPBar.fillRect(rivalX, barY, barWidth * rivalPercent, barHeight);
  }

  private createSelectedUnitPanel(): void {
    this.add.rectangle(400, 570, 700, 50, 0x000000, 0.85).setScrollFactor(0);
    
    this.selectedUnitText = this.add.text(120, 560, strings.battle.noneSelected, {
      fontSize: '16px',
      color: '#cccccc', // Lighter gray for better readability
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    this.selectedHPText = this.add.text(550, 560, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    this.selectedHPBar = this.add.graphics().setScrollFactor(0);
  }

  private updateSelectedPanel(): void {
    if (this.selectedUnits.length === 0) {
      this.selectedUnitText.setText(strings.battle.noneSelected);
      this.selectedUnitText.setColor('#aaaaaa');
      this.selectedHPText.setText('');
      this.selectedHPBar.clear();
    } else if (this.selectedUnits.length === 1) {
      const unit = this.selectedUnits[0];
      this.selectedUnitText.setText(`${strings.battle.selected}: ${unit.creature.name}`);
      this.selectedUnitText.setColor(colors.playerHex);
      
      const hpPercent = unit.currentHp / unit.creature.hp;
      this.selectedHPText.setText(`${strings.stat.hp}: ${unit.currentHp}/${unit.creature.hp}`);
      
      this.selectedHPBar.clear();
      const barWidth = 150;
      const barHeight = 8;
      const barX = 550;
      const barY = 572;
      
      this.selectedHPBar.fillStyle(0x000000, 0.5);
      this.selectedHPBar.fillRect(barX, barY, barWidth, barHeight);
      
      let color: number;
      if (hpPercent > 0.5) {
        color = 0x00ff00;
      } else if (hpPercent > 0.25) {
        color = 0xffff00;
      } else {
        color = 0xff0000;
      }
      
      this.selectedHPBar.fillStyle(color, 1);
      this.selectedHPBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    } else {
      this.selectedUnitText.setText(`${strings.battle.selected}: ${this.selectedUnits.length} יחידות`);
      this.selectedUnitText.setColor(colors.playerHex);
      this.selectedHPText.setText('');
      this.selectedHPBar.clear();
    }
  }

  private centerCameraOnSelection(): void {
    if (this.selectedUnits.length === 0) return;

    const avgX = this.selectedUnits.reduce((sum, u) => sum + u.x, 0) / this.selectedUnits.length;
    const avgY = this.selectedUnits.reduce((sum, u) => sum + u.y, 0) / this.selectedUnits.length;

    this.cameras.main.pan(avgX, avgY, 500, 'Sine.easeInOut');
  }

  private stopSelectedUnits(): void {
    for (const unit of this.selectedUnits) {
      unit.targetEnemy = null;
      this.tweens.killTweensOf(unit);
    }
  }

  private assignControlGroup(groupNumber: number): void {
    // Only assign player units (never enemies)
    const playerOnlyUnits = this.selectedUnits.filter(unit => this.playerUnits.includes(unit));
    
    if (playerOnlyUnits.length > 0) {
      this.controlGroups.set(groupNumber, [...playerOnlyUnits]);
    }
  }

  private recallControlGroup(groupNumber: number): void {
    const group = this.controlGroups.get(groupNumber);
    if (!group) return; // Empty group = no-op

    // Filter out dead units
    const aliveUnits = group.filter(unit => unit.currentHp > 0 && this.playerUnits.includes(unit));
    
    // Update the stored group to remove dead units
    if (aliveUnits.length === 0) {
      this.controlGroups.delete(groupNumber); // Remove empty group
      return; // Empty group = no-op
    }
    
    this.controlGroups.set(groupNumber, aliveUnits);

    // Select the alive units
    this.clearSelection();
    for (const unit of aliveUnits) {
      unit.setSelected(true);
      this.selectedUnits.push(unit);
    }
  }

  private toggleHelpOverlay(): void {
    if (this.helpOverlay) {
      this.closeHelpOverlay();
    } else {
      this.showHelpOverlay();
    }
  }

  private showHelpOverlay(): void {
    this.helpOverlay = this.add.container(0, 0).setDepth(10000);
    
    // Dim overlay background
    const bg = this.add.rectangle(400, 300, 650, 520, 0x000000, 0.92).setScrollFactor(0);
    this.helpOverlay.add(bg);
    
    // Title
    const title = this.add.text(400, 70, strings.help.title, {
      fontSize: '28px',
      color: colors.playerHex,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    this.helpOverlay.add(title);

    // Two-column layout: Key | Action
    let y = 120;
    const leftColX = 180; // Key column
    const rightColX = 380; // Action column
    const rowSpacing = 28;

    const addRow = (key: string, action: string) => {
      const keyText = this.add.text(leftColX, y, key, {
        fontSize: '15px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setScrollFactor(0);
      
      const actionText = this.add.text(rightColX, y, action, {
        fontSize: '15px',
        color: '#cccccc',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setScrollFactor(0);
      
      this.helpOverlay!.add(keyText);
      this.helpOverlay!.add(actionText);
      y += rowSpacing;
    };

    // Help rows in Hebrew
    addRow(strings.help.keyWasd, strings.help.actionWasd);
    addRow(strings.help.keyZoom, strings.help.actionZoom);
    addRow(strings.help.keyMinimap, strings.help.actionMinimap);
    y += 10; // Section spacing
    
    addRow(strings.help.keySelect, strings.help.actionSelect);
    addRow(strings.help.keyMove, strings.help.actionMove);
    addRow(strings.help.keyDeselect, strings.help.actionDeselect);
    y += 10;
    
    addRow('Ctrl+1-0', 'הקצאת קבוצת בקרה');
    addRow('1-0', 'קריאת קבוצת בקרה');
    y += 10;
    
    addRow('Space', 'מרכז על בחירה');
    addRow('F1 / ?', strings.help.openHint);
    
    // Fog legend line at bottom
    y += 20;
    const fogLegend = this.add.text(400, y, strings.fog.helpLine, {
      fontSize: '13px',
      color: '#888888',
      fontFamily: 'Arial',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.helpOverlay.add(fogLegend);

    // Close button
    y += 40;
    const closeBtn = this.add.rectangle(400, y, 140, 38, colors.player)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.helpOverlay.add(closeBtn);
    
    const closeText = this.add.text(400, y, strings.help.close, {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    this.helpOverlay.add(closeText);
    
    // Close hint below button
    const closeHint = this.add.text(400, y + 28, strings.help.closeHint, {
      fontSize: '12px',
      color: '#999999',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.helpOverlay.add(closeHint);

    closeBtn.on('pointerdown', () => {
      this.closeHelpOverlay();
    });
  }

  private closeHelpOverlay(): void {
    if (this.helpOverlay) {
      this.helpOverlay.destroy();
      this.helpOverlay = null;
    }
  }

  private showOnboardingTip(text: string, x: number, y: number): void {
    this.onboardingTip = this.add.container(0, 0);
    
    const tip = this.add.rectangle(x, y, 650, 60, 0x000000, 0.85).setScrollFactor(0);
    const tipText = this.add.text(x, y - 10, text, {
      fontSize: '13px',
      color: '#ffcc00',
      align: 'center',
      wordWrap: { width: 600 },
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    const dismissBtn = this.add.rectangle(x, y + 20, 100, 25, 0x444444)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    const dismissText = this.add.text(x, y + 20, strings.onboard.dismiss, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    this.onboardingTip.add([tip, tipText, dismissBtn, dismissText]);

    dismissBtn.on('pointerdown', () => {
      this.dismissOnboardingTip();
    });
  }

  private dismissOnboardingTip(): void {
    if (this.onboardingTip) {
      this.onboardingTip.destroy();
      this.onboardingTip = null;
      this.onboardingShown = true;
    }
  }
}

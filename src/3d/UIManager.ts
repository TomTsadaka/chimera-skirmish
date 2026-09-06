import { Unit3D } from './Unit3D';
import { EconomyState, HybridCreature, AnimalArchetype } from '../types';
import { strings, colors } from '../i18n';
import { GAME_CONSTANTS } from '../constants';
import { ANIMAL_ARCHETYPES } from '../GameData';

export class UIManager {
  private container: HTMLDivElement;
  private gameOverEl: HTMLDivElement | null = null;
  
  private trainCallbacks: {
    onTrainWorker: () => void;
    onTrainUnit: (hybrid: HybridCreature) => void;
    onTrainArchetype: (archetype: AnimalArchetype) => void;
  } | null = null;
  
  private trainPanelUnits: Array<{
    name: string;
    cost: { dna: number; biomass: number };
    type: 'worker' | 'unit' | 'archetype';
    hybrid?: HybridCreature;
    archetype?: AnimalArchetype;
  }> = [];

  constructor() {
    // Create main UI container
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: Arial, sans-serif;
      direction: rtl;
      z-index: 1000;
    `;
    
    // Create sub-elements
    this.createTitleBar();
    this.createResourcesPanel();
    this.createHPBarsPanel();
    this.createTrainPanel();
    this.createSelectionPanel();
    
    this.container.style.display = 'none';
  }

  private createTitleBar(): void {
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      padding: 10px 30px;
      border-radius: 8px;
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    titleEl.textContent = strings.battle.title;
    this.container.appendChild(titleEl);
  }

  private createResourcesPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 8px 20px;
      border-radius: 6px;
      display: flex;
      gap: 20px;
      font-size: 14px;
      font-weight: bold;
    `;
    
    const biomassEl = document.createElement('div');
    biomassEl.id = 'biomass-display';
    biomassEl.style.color = '#22C55E';
    panel.appendChild(biomassEl);
    
    const dnaEl = document.createElement('div');
    dnaEl.id = 'dna-display';
    dnaEl.style.color = '#9b59b6';
    panel.appendChild(dnaEl);
    
    this.container.appendChild(panel);
    return panel;
  }

  private createHPBarsPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 100px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 100px;
    `;
    
    // Player HP
    const playerSection = document.createElement('div');
    playerSection.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    `;
    
    const playerLabel = document.createElement('div');
    playerLabel.textContent = strings.deploy.you;
    playerLabel.style.cssText = `
      color: ${colors.playerHex};
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    `;
    playerSection.appendChild(playerLabel);
    
    const playerBar = document.createElement('div');
    playerBar.id = 'player-hp-bar';
    playerBar.style.cssText = `
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      overflow: hidden;
    `;
    playerSection.appendChild(playerBar);
    
    // Enemy HP
    const enemySection = document.createElement('div');
    enemySection.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    `;
    
    const enemyLabel = document.createElement('div');
    enemyLabel.textContent = strings.deploy.rival;
    enemyLabel.style.cssText = `
      color: ${colors.rivalHex};
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    `;
    enemySection.appendChild(enemyLabel);
    
    const enemyBar = document.createElement('div');
    enemyBar.id = 'enemy-hp-bar';
    enemyBar.style.cssText = `
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      overflow: hidden;
    `;
    enemySection.appendChild(enemyBar);
    
    panel.appendChild(playerSection);
    panel.appendChild(enemySection);
    
    this.container.appendChild(panel);
    return panel;
  }

  private createTrainPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 150px;
      right: 50px;
      width: 180px;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      padding: 15px;
      pointer-events: auto;
    `;
    
    const title = document.createElement('div');
    title.textContent = strings.panel.train;
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      text-align: center;
      margin-bottom: 15px;
    `;
    panel.appendChild(title);
    
    const unitsContainer = document.createElement('div');
    unitsContainer.id = 'train-units-container';
    panel.appendChild(unitsContainer);
    
    this.container.appendChild(panel);
    return panel;
  }

  private createSelectionPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 50px;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    const textEl = document.createElement('div');
    textEl.id = 'selection-text';
    textEl.style.cssText = `
      font-size: 16px;
      color: #cccccc;
    `;
    textEl.textContent = strings.battle.noneSelected;
    panel.appendChild(textEl);
    
    const hpEl = document.createElement('div');
    hpEl.id = 'selection-hp';
    hpEl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    panel.appendChild(hpEl);
    
    this.container.appendChild(panel);
    return panel;
  }

  public show(): void {
    document.body.appendChild(this.container);
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  public updateResources(resources: EconomyState): void {
    const biomassEl = document.getElementById('biomass-display');
    const dnaEl = document.getElementById('dna-display');
    
    if (biomassEl) {
      biomassEl.textContent = `${strings.economy.biomass}: ${resources.biomass}`;
    }
    if (dnaEl) {
      dnaEl.textContent = `${strings.economy.dna}: ${resources.dna}`;
    }
  }

  public setupTrainPanel(
    armyRoster: HybridCreature[],
    resources: EconomyState,
    callbacks: {
      onTrainWorker: () => void;
      onTrainUnit: (hybrid: HybridCreature) => void;
      onTrainArchetype: (archetype: AnimalArchetype) => void;
    }
  ): void {
    this.trainCallbacks = callbacks;
    
    // Build unit list (worker + 3 cheap units)
    const p0Units: Array<{
      name: string;
      cost: { dna: number; biomass: number };
      type: 'worker' | 'unit' | 'archetype';
      hybrid?: HybridCreature;
      archetype?: AnimalArchetype;
    }> = [
      { 
        name: strings.panel.worker, 
        cost: { dna: GAME_CONSTANTS.WORKER_COST_DNA, biomass: GAME_CONSTANTS.WORKER_COST_BIOMASS }, 
        type: 'worker' 
      },
      ...armyRoster.filter(h => 
        h.parent1.id === 'bat-echo' || h.parent2.id === 'bat-echo' ||
        h.parent1.id === 'horn-deer' || h.parent2.id === 'horn-deer' ||
        h.parent1.id === 'quill-snake' || h.parent2.id === 'quill-snake'
      ).slice(0, 3).map(h => ({ 
        name: h.name, 
        cost: { dna: h.costDNA, biomass: h.costBiomass }, 
        type: 'unit' as const, 
        hybrid: h 
      }))
    ];
    
    // Add archetypes if not enough roster units
    if (p0Units.length < 4) {
      const batEcho = ANIMAL_ARCHETYPES.find(a => a.id === 'bat-echo');
      const hornDeer = ANIMAL_ARCHETYPES.find(a => a.id === 'horn-deer');
      const quillSnake = ANIMAL_ARCHETYPES.find(a => a.id === 'quill-snake');
      
      if (batEcho && p0Units.length === 1) {
        p0Units.push({ 
          name: batEcho.nameHebrew, 
          cost: { dna: batEcho.costDNA, biomass: batEcho.costBiomass }, 
          type: 'archetype', 
          archetype: batEcho 
        });
      }
      if (hornDeer && p0Units.length === 2) {
        p0Units.push({ 
          name: hornDeer.nameHebrew, 
          cost: { dna: hornDeer.costDNA, biomass: hornDeer.costBiomass }, 
          type: 'archetype', 
          archetype: hornDeer 
        });
      }
      if (quillSnake && p0Units.length === 3) {
        p0Units.push({ 
          name: quillSnake.nameHebrew, 
          cost: { dna: quillSnake.costDNA, biomass: quillSnake.costBiomass }, 
          type: 'archetype', 
          archetype: quillSnake 
        });
      }
    }
    
    this.trainPanelUnits = p0Units;
    this.renderTrainPanel(resources);
  }

  private renderTrainPanel(resources: EconomyState): void {
    const container = document.getElementById('train-units-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < this.trainPanelUnits.length; i++) {
      const unitData = this.trainPanelUnits[i];
      const canAfford = resources.dna >= unitData.cost.dna && 
                       resources.biomass >= unitData.cost.biomass;
      
      const unitBtn = document.createElement('div');
      unitBtn.style.cssText = `
        width: 160px;
        height: 50px;
        margin-bottom: 10px;
        background: ${canAfford ? 'rgba(45, 212, 191, 0.8)' : 'rgba(102, 102, 102, 0.8)'};
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: ${canAfford ? 'pointer' : 'not-allowed'};
        transition: all 0.2s;
      `;
      
      if (canAfford) {
        unitBtn.addEventListener('mouseenter', () => {
          unitBtn.style.background = 'rgba(45, 212, 191, 1)';
        });
        unitBtn.addEventListener('mouseleave', () => {
          unitBtn.style.background = 'rgba(45, 212, 191, 0.8)';
        });
        unitBtn.addEventListener('click', () => {
          if (!this.trainCallbacks) return;
          
          if (unitData.type === 'worker') {
            this.trainCallbacks.onTrainWorker();
          } else if (unitData.type === 'unit' && unitData.hybrid) {
            this.trainCallbacks.onTrainUnit(unitData.hybrid);
          } else if (unitData.type === 'archetype' && unitData.archetype) {
            this.trainCallbacks.onTrainArchetype(unitData.archetype);
          }
        });
      }
      
      const nameEl = document.createElement('div');
      nameEl.textContent = unitData.name;
      nameEl.style.cssText = `
        font-size: 13px;
        font-weight: bold;
        color: ${canAfford ? '#ffffff' : '#888888'};
      `;
      unitBtn.appendChild(nameEl);
      
      const costEl = document.createElement('div');
      costEl.textContent = `${unitData.cost.dna}D ${unitData.cost.biomass}B`;
      costEl.style.cssText = `
        font-size: 11px;
        color: ${canAfford ? '#ffffff' : '#666666'};
      `;
      unitBtn.appendChild(costEl);
      
      container.appendChild(unitBtn);
    }
  }

  public refreshTrainPanel(resources: EconomyState): void {
    this.renderTrainPanel(resources);
  }

  public updateSelection(selectedUnits: Unit3D[]): void {
    const textEl = document.getElementById('selection-text');
    const hpEl = document.getElementById('selection-hp');
    
    if (!textEl || !hpEl) return;
    
    if (selectedUnits.length === 0) {
      textEl.textContent = strings.battle.noneSelected;
      textEl.style.color = '#aaaaaa';
      hpEl.innerHTML = '';
    } else if (selectedUnits.length === 1) {
      const unit = selectedUnits[0];
      textEl.textContent = `${strings.battle.selected}: ${unit.creature.name}`;
      textEl.style.color = colors.playerHex;
      
      const hpPercent = unit.currentHp / unit.creature.hp;
      const barColor = hpPercent > 0.5 ? '#00ff00' : (hpPercent > 0.25 ? '#ffff00' : '#ff0000');
      
      hpEl.innerHTML = `
        <div style="font-size: 16px; color: #ffffff;">
          ${strings.stat.hp}: ${unit.currentHp}/${unit.creature.hp}
        </div>
        <div style="width: 150px; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
          <div style="width: ${hpPercent * 100}%; height: 100%; background: ${barColor};"></div>
        </div>
      `;
    } else {
      textEl.textContent = `${strings.battle.selected}: ${selectedUnits.length} יחידות`;
      textEl.style.color = colors.playerHex;
      hpEl.innerHTML = '';
    }
  }

  public updateHPBars(playerUnits: Unit3D[], enemyUnits: Unit3D[]): void {
    const playerBar = document.getElementById('player-hp-bar');
    const enemyBar = document.getElementById('enemy-hp-bar');
    
    if (!playerBar || !enemyBar) return;
    
    const playerMaxHP = playerUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const playerCurrentHP = playerUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const playerPercent = playerMaxHP > 0 ? playerCurrentHP / playerMaxHP : 0;
    
    const enemyMaxHP = enemyUnits.reduce((sum, u) => sum + u.creature.hp, 0);
    const enemyCurrentHP = enemyUnits.reduce((sum, u) => sum + u.currentHp, 0);
    const enemyPercent = enemyMaxHP > 0 ? enemyCurrentHP / enemyMaxHP : 0;
    
    const playerColor = colors.playerHex;
    const enemyColor = colors.rivalHex;
    
    playerBar.innerHTML = `
      <div style="width: ${playerPercent * 100}%; height: 100%; background: ${playerColor}; transition: width 0.3s;"></div>
    `;
    
    enemyBar.innerHTML = `
      <div style="width: ${enemyPercent * 100}%; height: 100%; background: ${enemyColor}; transition: width 0.3s;"></div>
    `;
  }

  public showGameOver(victory: boolean, message: string): void {
    if (this.gameOverEl) return;
    
    this.gameOverEl = document.createElement('div');
    this.gameOverEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      pointer-events: auto;
    `;
    
    const titleEl = document.createElement('div');
    titleEl.textContent = victory ? strings.win.title : strings.lose.title;
    titleEl.style.cssText = `
      font-size: 64px;
      font-weight: bold;
      color: ${victory ? '#22C55E' : '#EF4444'};
      margin-bottom: 20px;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    `;
    this.gameOverEl.appendChild(titleEl);
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 24px;
      color: #ffffff;
      margin-bottom: 40px;
    `;
    this.gameOverEl.appendChild(messageEl);
    
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'רענן את הדף לשחק שוב';
    restartBtn.style.cssText = `
      padding: 15px 30px;
      font-size: 18px;
      font-weight: bold;
      background: ${colors.playerHex};
      color: #000000;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.transform = 'scale(1.1)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.transform = 'scale(1)';
    });
    restartBtn.addEventListener('click', () => {
      window.location.reload();
    });
    this.gameOverEl.appendChild(restartBtn);
    
    document.body.appendChild(this.gameOverEl);
  }
}

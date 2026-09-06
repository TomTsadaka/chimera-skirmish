import { AnimalArchetype, HybridCreature } from '../types';
import { ANIMAL_ARCHETYPES, GameData } from '../GameData';
import { colors } from '../i18n';

export class CageUI {
  private container: HTMLDivElement | null = null;
  private selectedAnimal1: AnimalArchetype | null = null;
  private selectedAnimal2: AnimalArchetype | null = null;
  private onStartBattle: ((hybrid: HybridCreature) => void) | null = null;
  private searchQuery: string = '';
  private currentFilter: string = 'all'; // 'all', 'combat', 'worker'

  public show(onStartBattle: (hybrid: HybridCreature) => void): void {
    if (this.container) return;
    
    this.onStartBattle = onStartBattle;
    this.selectedAnimal1 = null;
    this.selectedAnimal2 = null;
    
    this.container = document.createElement('div');
    this.container.id = 'cage-ui';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
      overflow-y: auto;
      font-family: Arial, sans-serif;
      direction: rtl;
      z-index: 10000;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 30px;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
    `;
    
    const title = document.createElement('div');
    title.textContent = 'כלוב - בחר שני חיות';
    title.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      color: ${colors.playerHex};
      margin-bottom: 10px;
      text-shadow: 0 0 20px ${colors.player}80;
    `;
    header.appendChild(title);
    
    const subtitle = document.createElement('div');
    subtitle.textContent = '100 חיות מקוריות לבחירתך';
    subtitle.style.cssText = `
      font-size: 20px;
      color: #ffffff;
    `;
    header.appendChild(subtitle);
    
    this.container.appendChild(header);
    
    // Controls (search + filter)
    const controls = document.createElement('div');
    controls.style.cssText = `
      padding: 20px;
      display: flex;
      gap: 20px;
      justify-content: center;
      align-items: center;
    `;
    
    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'חפש חיה...';
    searchInput.style.cssText = `
      padding: 12px 20px;
      font-size: 16px;
      border: 2px solid ${colors.playerHex};
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.5);
      color: #ffffff;
      direction: rtl;
      width: 300px;
    `;
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      this.renderAnimalList();
    });
    controls.appendChild(searchInput);
    
    // Filter buttons
    const filterAll = this.createFilterButton('הכל', 'all');
    const filterCombat = this.createFilterButton('קרב', 'combat');
    const filterWorker = this.createFilterButton('עובד', 'worker');
    
    controls.appendChild(filterAll);
    controls.appendChild(filterCombat);
    controls.appendChild(filterWorker);
    
    this.container.appendChild(controls);
    
    // Selection display
    const selectionDisplay = document.createElement('div');
    selectionDisplay.id = 'cage-selection-display';
    selectionDisplay.style.cssText = `
      padding: 20px;
      margin: 0 auto;
      max-width: 900px;
      display: flex;
      gap: 30px;
      justify-content: center;
      align-items: stretch;
    `;
    this.container.appendChild(selectionDisplay);
    
    // Animal list container
    const listContainer = document.createElement('div');
    listContainer.id = 'cage-animal-list';
    listContainer.style.cssText = `
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      max-width: 1400px;
      margin: 0 auto;
    `;
    this.container.appendChild(listContainer);
    
    // Initial render
    this.renderSelectionDisplay();
    this.renderAnimalList();
    
    document.body.appendChild(this.container);
  }
  
  private createFilterButton(label: string, filter: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      padding: 10px 24px;
      font-size: 16px;
      font-weight: bold;
      background: ${this.currentFilter === filter ? colors.playerHex : 'rgba(255, 255, 255, 0.2)'};
      color: ${this.currentFilter === filter ? '#000000' : '#ffffff'};
      border: 2px solid ${colors.playerHex};
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    btn.addEventListener('click', () => {
      this.currentFilter = filter;
      // Update all filter buttons
      const filterButtons = this.container?.querySelectorAll('button');
      filterButtons?.forEach(b => {
        if (b.textContent === label) {
          b.style.background = colors.playerHex;
          b.style.color = '#000000';
        } else if (b.textContent?.includes('הכל') || b.textContent?.includes('קרב') || b.textContent?.includes('עובד')) {
          b.style.background = 'rgba(255, 255, 255, 0.2)';
          b.style.color = '#ffffff';
        }
      });
      this.renderAnimalList();
    });
    
    return btn;
  }
  
  private renderSelectionDisplay(): void {
    const display = document.getElementById('cage-selection-display');
    if (!display) return;
    
    display.innerHTML = '';
    
    // Slot 1
    const slot1 = this.createSelectionSlot(1, this.selectedAnimal1);
    display.appendChild(slot1);
    
    // Plus symbol
    const plus = document.createElement('div');
    plus.textContent = '+';
    plus.style.cssText = `
      font-size: 72px;
      font-weight: bold;
      color: ${colors.playerHex};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    display.appendChild(plus);
    
    // Slot 2
    const slot2 = this.createSelectionSlot(2, this.selectedAnimal2);
    display.appendChild(slot2);
    
    // Arrow
    const arrow = document.createElement('div');
    arrow.textContent = '→';
    arrow.style.cssText = `
      font-size: 72px;
      font-weight: bold;
      color: ${colors.playerHex};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    display.appendChild(arrow);
    
    // Result/Start button
    if (this.selectedAnimal1 && this.selectedAnimal2) {
      const hybrid = GameData.createHybrid(this.selectedAnimal1, this.selectedAnimal2);
      const resultSlot = this.createHybridResultSlot(hybrid);
      display.appendChild(resultSlot);
    } else {
      const emptySlot = document.createElement('div');
      emptySlot.style.cssText = `
        width: 200px;
        height: 280px;
        border: 3px dashed rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 18px;
        text-align: center;
      `;
      emptySlot.textContent = '?';
      display.appendChild(emptySlot);
    }
  }
  
  private createSelectionSlot(slotNumber: number, animal: AnimalArchetype | null): HTMLDivElement {
    const slot = document.createElement('div');
    slot.style.cssText = `
      width: 200px;
      height: 280px;
      border: 3px solid ${animal ? colors.playerHex : 'rgba(255, 255, 255, 0.3)'};
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.5);
      padding: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: ${animal ? 'pointer' : 'default'};
      transition: all 0.2s;
    `;
    
    if (animal) {
      slot.style.boxShadow = `0 0 20px ${colors.player}40`;
      
      const name = document.createElement('div');
      name.textContent = animal.nameHebrew;
      name.style.cssText = `
        font-size: 20px;
        font-weight: bold;
        color: ${colors.playerHex};
        margin-bottom: 15px;
        text-align: center;
      `;
      slot.appendChild(name);
      
      const stats = document.createElement('div');
      stats.style.cssText = `
        font-size: 14px;
        color: #ffffff;
        line-height: 1.8;
      `;
      stats.innerHTML = `
        <div>HP: ${animal.hp}</div>
        <div>מהירות: ${animal.speed}</div>
        <div>תקיפה: ${animal.attack}</div>
        <div>טווח: ${animal.range}</div>
        <div style="margin-top: 10px; color: #9b59b6;">DNA: ${animal.costDNA}</div>
        <div style="color: #22C55E;">ביומסה: ${animal.costBiomass}</div>
      `;
      slot.appendChild(stats);
      
      // Clear button
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'נקה';
      clearBtn.style.cssText = `
        margin-top: 15px;
        padding: 8px 20px;
        background: #EF4444;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      `;
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (slotNumber === 1) {
          this.selectedAnimal1 = null;
        } else {
          this.selectedAnimal2 = null;
        }
        this.renderSelectionDisplay();
      });
      slot.appendChild(clearBtn);
      
    } else {
      const text = document.createElement('div');
      text.textContent = `בחר חיה ${slotNumber}`;
      text.style.cssText = `
        font-size: 18px;
        color: rgba(255, 255, 255, 0.5);
      `;
      slot.appendChild(text);
    }
    
    return slot;
  }
  
  private createHybridResultSlot(hybrid: HybridCreature): HTMLDivElement {
    const slot = document.createElement('div');
    slot.style.cssText = `
      width: 200px;
      height: 280px;
      border: 3px solid ${colors.playerHex};
      border-radius: 12px;
      background: rgba(45, 212, 191, 0.2);
      padding: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px ${colors.player}60;
    `;
    
    const name = document.createElement('div');
    name.textContent = hybrid.name;
    name.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: ${colors.playerHex};
      margin-bottom: 15px;
      text-align: center;
    `;
    slot.appendChild(name);
    
    const stats = document.createElement('div');
    stats.style.cssText = `
      font-size: 14px;
      color: #ffffff;
      line-height: 1.8;
    `;
    stats.innerHTML = `
      <div>HP: ${hybrid.hp}</div>
      <div>מהירות: ${hybrid.speed}</div>
      <div>תקיפה: ${hybrid.attack}</div>
      <div>טווח: ${hybrid.range}</div>
      <div style="margin-top: 10px; color: #9b59b6;">DNA: ${hybrid.costDNA}</div>
      <div style="color: #22C55E;">ביומסה: ${hybrid.costBiomass}</div>
    `;
    slot.appendChild(stats);
    
    // Start Battle button
    const startBtn = document.createElement('button');
    startBtn.textContent = 'התחל קרב';
    startBtn.style.cssText = `
      margin-top: 15px;
      padding: 12px 30px;
      background: ${colors.playerHex};
      color: #000000;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'scale(1.1)';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'scale(1)';
    });
    startBtn.addEventListener('click', () => {
      if (this.onStartBattle) {
        this.onStartBattle(hybrid);
        this.hide();
      }
    });
    slot.appendChild(startBtn);
    
    return slot;
  }
  
  private renderAnimalList(): void {
    const list = document.getElementById('cage-animal-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Filter animals based on search and filter
    let filteredAnimals = ANIMAL_ARCHETYPES;
    
    // Apply role filter
    if (this.currentFilter !== 'all') {
      filteredAnimals = filteredAnimals.filter(a => a.role === this.currentFilter);
    }
    
    // Apply search filter
    if (this.searchQuery) {
      filteredAnimals = filteredAnimals.filter(a => 
        a.nameHebrew.toLowerCase().includes(this.searchQuery) ||
        a.name.toLowerCase().includes(this.searchQuery)
      );
    }
    
    // Sort by tier and name
    filteredAnimals.sort((a, b) => {
      if (a.costDNA !== b.costDNA) return a.costDNA - b.costDNA;
      return a.nameHebrew.localeCompare(b.nameHebrew);
    });
    
    // Show count
    if (filteredAnimals.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = 'לא נמצאו תוצאות';
      noResults.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        font-size: 24px;
        color: rgba(255, 255, 255, 0.5);
      `;
      list.appendChild(noResults);
      return;
    }
    
    // Render each animal card
    for (const animal of filteredAnimals) {
      const card = this.createAnimalCard(animal);
      list.appendChild(card);
    }
  }
  
  private createAnimalCard(animal: AnimalArchetype): HTMLDivElement {
    const isSelected = this.selectedAnimal1 === animal || this.selectedAnimal2 === animal;
    
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${isSelected ? 'rgba(45, 212, 191, 0.3)' : 'rgba(0, 0, 0, 0.6)'};
      border: 2px solid ${isSelected ? colors.playerHex : 'rgba(255, 255, 255, 0.2)'};
      border-radius: 12px;
      padding: 15px;
      cursor: ${isSelected ? 'default' : 'pointer'};
      transition: all 0.2s;
      ${isSelected ? `box-shadow: 0 0 20px ${colors.player}40;` : ''}
    `;
    
    if (!isSelected) {
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = colors.playerHex;
        card.style.background = 'rgba(45, 212, 191, 0.1)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        card.style.background = 'rgba(0, 0, 0, 0.6)';
      });
      card.addEventListener('click', () => {
        if (!this.selectedAnimal1) {
          this.selectedAnimal1 = animal;
        } else if (!this.selectedAnimal2 && this.selectedAnimal1 !== animal) {
          this.selectedAnimal2 = animal;
        }
        this.renderSelectionDisplay();
        this.renderAnimalList();
      });
    }
    
    const name = document.createElement('div');
    name.textContent = animal.nameHebrew;
    name.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: ${isSelected ? colors.playerHex : '#ffffff'};
      margin-bottom: 8px;
    `;
    card.appendChild(name);
    
    const nameEn = document.createElement('div');
    nameEn.textContent = animal.name;
    nameEn.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 10px;
    `;
    card.appendChild(nameEn);
    
    const stats = document.createElement('div');
    stats.style.cssText = `
      font-size: 13px;
      color: #ffffff;
      line-height: 1.6;
    `;
    stats.innerHTML = `
      <div>HP: ${animal.hp} | מהירות: ${animal.speed}</div>
      <div>תקיפה: ${animal.attack} | טווח: ${animal.range}</div>
      <div style="margin-top: 8px;">
        <span style="color: #9b59b6;">DNA: ${animal.costDNA}</span> | 
        <span style="color: #22C55E;">ביומסה: ${animal.costBiomass}</span>
      </div>
    `;
    card.appendChild(stats);
    
    const role = document.createElement('div');
    role.textContent = animal.role === 'combat' ? '⚔️ קרב' : '🔧 עובד';
    role.style.cssText = `
      margin-top: 8px;
      font-size: 12px;
      color: ${animal.role === 'combat' ? '#EF4444' : '#FACC15'};
      font-weight: bold;
    `;
    card.appendChild(role);
    
    if (isSelected) {
      const badge = document.createElement('div');
      badge.textContent = '✓ נבחר';
      badge.style.cssText = `
        margin-top: 8px;
        padding: 4px 10px;
        background: ${colors.playerHex};
        color: #000000;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
      `;
      card.appendChild(badge);
    }
    
    return card;
  }
  
  public hide(): void {
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}

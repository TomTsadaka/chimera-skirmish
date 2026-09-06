# Economy Layer - Acceptance Notes

## Overview
This PR adds a **GeneLab-inspired economy layer** to Chimera Skirmish (original Chimera branding, NOT Impossible Creatures IP), transforming it from a pure tactical battle game into a full RTS experience with resource gathering, base building, and unit production.

## What's New

### 🏗️ Core Economy Systems

#### 1. Two Resources
- **Biomass (ביומסה)**: Gathered by workers from map nodes
  - Green color (#22C55E)
  - 8 resources per worker trip (~4s round trip)
  - Label: "B" on resource nodes
- **DNA**: Base trickle resource (NOT gathered)
  - Purple color (#9b59b6)
  - +2 DNA every 5 seconds (passive income)
  - Used for training costs

#### 2. Resource Nodes
- **6 biomass nodes** spawn across the map
- Nodes are distributed: left side (player), center, right side (enemy)
- Each Biomass node contains 2000 resources
- Visual indicators show remaining amount

#### 3. Worker Units
- **Yellow circular units** with tool icon
- Gather Biomass from nodes and return to HQ
- Gather rate: 8 Biomass per trip
- Gather interval: ~4 seconds per round trip
- Move 1.5× faster than combat units
- **Starting workers**: 2 per team
- **Worker cost**: 30 DNA / 40 Biomass

#### 4. HQ Buildings
- **Large square buildings** at each team's base location
  - Player HQ: Left side (turquoise)
  - Enemy HQ: Right side (orange)
- 500 HP each
- Workers drop off Biomass here
- All units train from HQ
- **Destroying enemy HQ is primary win condition**

#### 5. Starting Resources
- **Biomass**: 100
- **DNA**: 80
- Enough to train 1 worker or save for combat units

### 🎮 Gameplay Loop

#### Player Actions
1. **Order workers to gather**: Right-click Biomass nodes with workers selected
2. **Train more workers**: Click "אמן עובד" (Train Worker) button - costs 30 DNA / 40 Biomass
3. **Train combat units**: Click "אמן לוחם" (Train Combat Unit) button - costs vary by hybrid
4. **Attack enemy HQ**: Select combat units, right-click enemy HQ to attack

#### Production Costs (DNA / Biomass)
**Base Archetypes:**
- Bat-Echo: 40 / 20
- Horn-Deer: 55 / 30
- Quill-Snake: 70 / 25
- Ink-Octopus: 65 / 35
- Vinegar-Eagle: 80 / 40
- Thunder-Frog: 90 / 45
- Crystal-Crab: 85 / 50
- Basalt-Rhino: 100 / 60

**Fusion Hybrids:**
- DNA cost = round((Parent1_DNA + Parent2_DNA) × 0.85)
- Biomass cost = round((Parent1_Biomass + Parent2_Biomass) × 0.5)
- Example: Bat-Echo + Horn-Deer = 81 DNA / 25 Biomass

#### AI Behavior
- **Workers auto-gather**: Enemy AI automatically orders idle workers to nearest Biomass nodes
- **Auto-trains workers**: Maintains 2-4 workers for efficient economy
- **Auto-trains combat units**: Produces random archetypes when resources allow
- **Trains every 5 seconds**: Checks resources and trains if available

#### Win/Lose Conditions
1. **Primary**: Destroy enemy HQ (500 HP)
2. **Fallback**: Wipe out all enemy units (original condition still works)

### 🎨 UI Elements

#### Resource Counter (Top Center)
- Black background panel with resource counts
- **Biomass** (green): Shows current Biomass amount
- **DNA** (purple): Shows current DNA amount with passive trickle
- Updates in real-time as resources are gathered/trickling/spent

#### Training Panel (Left Side)
- Black panel with two training buttons:
  1. **Train Worker** (turquoise button)
     - Cost: 30D 40B (DNA + Biomass)
     - Spawns worker near HQ
  2. **Train Unit** (orange button)
     - Cost: Varies by hybrid (e.g., 81D 25B for Bat-Deer hybrid)
     - Spawns player's fused hybrid combat unit near HQ

#### Minimap Updates
- **HQs shown as squares**: Player (turquoise), Enemy (orange)
- **Biomass nodes shown as green circles**
- Existing unit dots remain unchanged

### 🔧 Technical Details

#### New Files
- `src/Building.ts`: HQ building class with HP, damage, and dropoff logic
- `src/ResourceNode.ts`: Biomass node class with gathering and depletion

#### Modified Files
- `src/types.ts`: Economy types (ResourceType, ResourceNode, EconomyState, UnitRole) + costs on archetypes/hybrids
- `src/constants.ts`: Economy constants (GeneLab numbers: gather rate, trickle, costs)
- `src/i18n.ts`: Hebrew/English strings for economy UI (ביומסה / DNA)
- `src/Unit.ts`: Worker role support with Biomass-only gathering state machine
- `src/GameData.ts`: Production costs added to all archetypes + fusion cost formula
- `src/BattleScene.ts`: Economy integration (spawning, UI, DNA trickle, training, win conditions)
- `src/AI.ts`: Economy AI (DNA trickle awareness, dynamic archetype training costs)
- `src/Minimap.ts`: Display HQs and Biomass nodes

#### Gameplay Balance (GeneLab Numbers)
- **5-10 minute skirmish** with current settings
- DNA trickle provides steady income without micromanagement
- Biomass gathering creates map control pressure
- Workers are affordable but require DNA investment
- Combat units range from cheap scouts (40D 20B) to expensive tanks (100D 60B)
- Fusion provides cost efficiency vs. pure archetypes

### ✅ Verification

**Build Status**: ✅ Passes `npm run build`

**Gameplay Checklist**:
- ✅ Resources display in UI (Biomass + DNA) and update correctly
- ✅ DNA trickles +2 every 5 seconds
- ✅ Workers gather Biomass only (8 per trip, ~4s)
- ✅ Training buttons work and deduct correct costs
- ✅ HQs spawn and can be attacked
- ✅ Enemy AI gathers Biomass and trains units based on affordability
- ✅ Win by destroying enemy HQ works
- ✅ Fusion cost formula applies correctly to hybrids
- ✅ Existing features work (fusion, fog, minimap, hotkeys)
- ✅ Hebrew UI strings display correctly (RTL support maintained)

### 🎯 Design Philosophy

This economy layer uses **GeneLab numbers** with **original Chimera branding**:
- No Impossible Creatures or Relic IP names or trademarks
- "Chimera" / "DNA" / "Biomass" theme fits the bio-tech aesthetic
- Biomass = gathered resource (map control)
- DNA = trickle resource (constant income stream)
- Worker/HQ/Combat unit terminology (generic RTS naming)
- Fusion system from Forge remains the core unit customization mechanic
- Production costs integrated into creature definitions

### 🚀 Future Enhancements (Optional)
- Multiple building types (barracks, tech labs)
- Upgrades for workers/units
- DNA research / tech tree
- Unit variety beyond 8 archetypes
- Biomass node respawn mechanics
- Defensive structures (turrets, walls)

---

## How to Test

1. **Build**: `npm run build` (should pass with no errors)
2. **Run**: Open `dist/index.html` or use dev server
3. **Play**:
   - Fuse a creature in Forge (e.g., Bat-Echo + Horn-Deer)
   - Enter battle scene
   - Select workers (yellow units), right-click Biomass nodes (green "B" icons)
   - Wait for Biomass to accumulate AND DNA to trickle (+2 every 5s)
   - Train more workers (30D 40B) or units (cost varies by hybrid)
   - Build an army and attack enemy HQ (right side)
   - Win by destroying enemy HQ or wiping their army

## Notes

- Economy uses GeneLab-inspired numbers (8 Biomass/trip, DNA trickle)
- All 8 archetypes have defined production costs
- Fusion formula calculates hybrid costs dynamically
- All existing PR #1 features remain intact
- Hebrew RTL UI works correctly with new economy elements (ביומסה / DNA)
- Game remains PC-focused with mouse/keyboard RTS controls
- Public demo on GitHub Pages will be updated when merged

# Economy Layer - Acceptance Notes

## Overview
This PR adds an **Impossible Creatures-inspired economy layer** to Chimera Skirmish, transforming it from a pure tactical battle game into a full RTS experience with resource gathering, base building, and unit production.

## What's New

### 🏗️ Core Economy Systems

#### 1. Two Resources
- **Biomass (ביומסה)**: Primary resource for training workers and units
  - Green color (#22C55E)
  - Label: "B" on resource nodes
- **Energy (אנרגיה)**: Secondary resource for training combat units
  - Blue color (#3B82F6)
  - Label: "E" on resource nodes

#### 2. Resource Nodes
- **6 resource nodes** spawn across the map (3 Biomass, 3 Energy)
- Nodes are distributed: left side (player), center, right side (enemy)
- Each Biomass node contains 1500 resources
- Each Energy node contains 1200 resources
- Visual indicators show resource type and remaining amount

#### 3. Worker Units
- **Yellow circular units** with tool icon
- Gather resources from nodes and return to HQ
- Gather rate: 10 resources per trip
- Gather interval: 3 seconds per trip
- Move 1.5× faster than combat units
- **Starting workers**: 4 per team

#### 4. HQ Buildings
- **Large square buildings** at each team's base location
  - Player HQ: Left side (turquoise)
  - Enemy HQ: Right side (orange)
- 500 HP each
- Workers drop off resources here
- All units train from HQ
- **Destroying enemy HQ is primary win condition**

#### 5. Starting Resources
- **Biomass**: 200
- **Energy**: 150
- Enough to train 2-3 workers or 1-2 combat units immediately

### 🎮 Gameplay Loop

#### Player Actions
1. **Order workers to gather**: Right-click resource nodes with workers selected
2. **Train more workers**: Click "אמן עובד" (Train Worker) button - costs 50 Biomass
3. **Train combat units**: Click "אמן לוחם" (Train Combat Unit) button - costs 75 Biomass + 50 Energy
4. **Attack enemy HQ**: Select combat units, right-click enemy HQ to attack

#### AI Behavior
- **Workers auto-gather**: Enemy AI automatically orders idle workers to nearest resource nodes
- **Auto-trains workers**: Maintains 4-6 workers for efficient economy
- **Auto-trains combat units**: Produces combat units when resources allow (requires 4+ workers first)
- **Trains every 5 seconds**: Checks resources and trains if available

#### Win/Lose Conditions
1. **Primary**: Destroy enemy HQ (500 HP)
2. **Fallback**: Wipe out all enemy units (original condition still works)

### 🎨 UI Elements

#### Resource Counter (Top Center)
- Black background panel with resource counts
- **Biomass** (green): Shows current Biomass amount
- **Energy** (blue): Shows current Energy amount
- Updates in real-time as resources are gathered/spent

#### Training Panel (Left Side)
- Black panel with two training buttons:
  1. **Train Worker** (turquoise button)
     - Cost: 50B (Biomass)
     - Spawns worker near HQ
  2. **Train Unit** (orange button)
     - Cost: 75B + 50E (Biomass + Energy)
     - Spawns player's hybrid combat unit near HQ

#### Minimap Updates
- **HQs shown as squares**: Player (turquoise), Enemy (orange)
- **Resource nodes shown as circles**: Biomass (green), Energy (blue)
- Existing unit dots remain unchanged

### 🔧 Technical Details

#### New Files
- `src/Building.ts`: HQ building class with HP, damage, and dropoff logic
- `src/ResourceNode.ts`: Resource node class with gathering and depletion

#### Modified Files
- `src/types.ts`: Economy types (ResourceType, ResourceNode, EconomyState, UnitRole)
- `src/constants.ts`: Economy constants (starting resources, costs, gather rates)
- `src/i18n.ts`: Hebrew/English strings for economy UI
- `src/Unit.ts`: Worker role support with gathering state machine
- `src/BattleScene.ts`: Economy integration (spawning, UI, training, win conditions)
- `src/AI.ts`: Economy AI (resource management, worker orders, unit training)
- `src/Minimap.ts`: Display HQs and resource nodes

#### Gameplay Balance
- **5-10 minute skirmish** with current settings
- Player starts with enough resources to expand immediately
- Enemy AI matches player's economic growth
- Combat units cost more than workers, encouraging economic strategy
- Resource nodes have finite amounts, creating map control pressure

### ✅ Verification

**Build Status**: ✅ Passes `npm run build`

**Gameplay Checklist**:
- ✅ Resources display in UI and update correctly
- ✅ Workers gather from nodes and return to HQ
- ✅ Training buttons work and deduct resources
- ✅ HQs spawn and can be attacked
- ✅ Enemy AI gathers resources and trains units
- ✅ Win by destroying enemy HQ
- ✅ Existing features work (fusion, fog, minimap, hotkeys)
- ✅ Hebrew UI strings display correctly (RTL support maintained)

### 🎯 Design Philosophy

This economy layer is **inspired by Impossible Creatures** but uses **original branding**:
- No Relic IP names or trademarks
- "Chimera" / "DNA" / "Hybrid" theme maintained
- Resource names fit the bio-tech aesthetic (Biomass/Energy vs. Coal/Power)
- Worker/HQ/Combat unit terminology instead of game-specific names
- Fusion system from Forge remains the core unit customization mechanic

### 🚀 Future Enhancements (Optional)
- Multiple building types (barracks, tech labs)
- Upgrades for workers/units
- More resource types or secondary resources
- Unit variety (ranged, melee, support workers)
- Resource node respawn mechanics
- Defensive structures (turrets, walls)

---

## How to Test

1. **Build**: `npm run build` (should pass with no errors)
2. **Run**: Open `dist/index.html` or use dev server
3. **Play**:
   - Fuse a creature in Forge
   - Enter battle scene
   - Select workers (yellow units), right-click resource nodes (B/E icons)
   - Wait for resources to accumulate
   - Train more workers/units using left panel buttons
   - Build an army and attack enemy HQ (right side)
   - Win by destroying enemy HQ or wiping their army

## Notes

- Economy is fully functional on first skirmish
- All existing PR #1 features remain intact
- Hebrew RTL UI works correctly with new economy elements
- Game remains PC-focused with mouse/keyboard RTS controls
- Public demo on GitHub Pages will be updated when merged

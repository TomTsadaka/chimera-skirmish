# Chimera Skirmish - 3D RTS

A playable browser-based **3D real-time strategy game** where you fuse animal archetypes to create hybrid creatures and battle against AI opponents. Built with **Three.js**, TypeScript, and Vite.

**⚠️ Original IP Disclaimer**: This game is inspired by the *concept* of DNA mixing and hybrid creatures from games like Impossible Creatures, but contains 100% original content. No trademarked names, assets, creatures, or intellectual property from any existing games are used. This is a spiritual successor with completely original naming and theme (Chimera/DNA/Biomass).

---

## What's New in 3D

This version migrates from Phaser 2D to a **true 3D RTS experience**:

- ✅ **3D Perspective Camera** - Full RTS camera with pan, zoom, and edge-panning
- ✅ **Procedural 3D Creatures** - Units are 3D meshes with team colors (player turquoise, enemy orange)
- ✅ **3D Buildings & Terrain** - HQs and resource nodes as proper 3D models with shadows
- ✅ **Mouse Selection** - Click to select, right-click to move/attack, box-select multiple units
- ✅ **Hebrew RTL UI** - HTML/CSS overlay maintains original Hebrew interface
- ✅ **Full Economy System** - Workers gather biomass, DNA trickles, train new units
- ✅ **Win Condition** - Destroy enemy HQ to win

---

## Game Overview

### Core Gameplay Loop
1. **Start Battle**: You begin with 3 starter units and 3 workers near your HQ
2. **Gather Resources**: Workers auto-gather biomass from green crystal nodes
3. **Train Army**: Use DNA + biomass to train more workers and combat units
4. **Destroy Enemy HQ**: Attack the enemy base to win!

### Original Animal Archetypes

| Name | Role | HP | Speed | Attack | Range | Vision | Cost (DNA/Biomass) |
|------|------|----|----|--------|-------|--------|-------------------|
| **Bat-Echo** (עטלף-הד) | scout | 50 | 9 | 10 | 1 | 7 | 40D / 20B |
| **Horn-Deer** (צבי-קרן) | skirmish | 85 | 7 | 20 | 2 | 5 | 55D / 30B |
| **Quill-Snake** (נחש-זיפים) | assassin | 55 | 8 | 28 | 1 | 4 | 70D / 25B |
| **Basalt-Rhino** (קרנף-בזלת) | tank | 180 | 3 | 18 | 1 | 3 | 100D / 60B |
| **Vinegar-Eagle** (עיט-חומץ) | mobile ranged | 70 | 8 | 16 | 4 | 6 | 80D / 40B |
| **Crystal-Crab** (סרטן-גביש) | defense | 160 | 2 | 12 | 1 | 3 | 85D / 50B |
| **Ink-Octopus** (תמנון-דיו) | control | 90 | 4 | 11 | 3 | 4 | 65D / 35B |
| **Thunder-Frog** (צפרדע-רעם) | artillery | 60 | 3 | 32 | 5 | 6 | 90D / 45B |

*Hebrew names displayed in UI for authenticity*

### Hybrid Mechanics

When you fuse two animals (or train single archetypes), units get:
- **HP** = average of parents
- **Speed** = average + bonus if difference ≥ 5
- **Attack** = average × 1.1
- **Range** = max of parents
- **Visual**: Procedurally generated 3D mesh combining parent colors

---

## How to Play

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will open at `http://localhost:5173` (or the port shown in terminal).

---

### Controls

#### Camera
- **WASD or Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Mouse at Screen Edge**: Auto-pan
- **Space**: Center on selected units

#### Selection
- **Left-click unit**: Select single unit
- **Left-click empty**: Deselect all
- **Shift + Left-click**: Add/remove from selection
- **Left-drag**: Box select multiple units
- **Ctrl+A**: Select all your units

#### Commands
- **Right-click ground**: Move selected units
- **Right-click enemy**: Attack target
- **Right-click resource node**: Workers gather (if workers selected)
- **Right-click enemy HQ**: Attack the base!

#### Training (Right Panel)
- **Click unit button** to train (costs DNA + Biomass)
- Available units:
  - **Worker** (עובד): 5D / 5B - Gathers biomass
  - **Bat-Echo / Horn-Deer / Quill-Snake**: Cheap combat units

---

### Gameplay Flow

1. **Start of Battle**:
   - You spawn on the LEFT with turquoise units
   - Enemy spawns on the RIGHT with orange units
   - 3 starter combat units + 3 workers for each side

2. **Economy Phase**:
   - Workers automatically gather from nearby biomass nodes (green crystals)
   - DNA trickles passively every 5 seconds
   - Train more workers to boost economy

3. **Combat Phase**:
   - Train combat units with accumulated resources
   - Select and right-click to attack enemies
   - Units auto-engage nearby enemies
   - Enemy AI will attack your units

4. **Victory**:
   - **ניצחת!** (You Won!) - Enemy HQ destroyed
   - **הפסדת** (You Lost) - Your HQ destroyed
   - Refresh page to play again

---

### UI Layout (Hebrew RTL)

- **Top Center**: Resource counters (Biomass / DNA)
- **Top Left**: Player HP bar (turquoise)
- **Top Right**: Enemy HP bar (orange)
- **Right Panel**: Training menu (עובד, units)
- **Bottom Center**: Selection panel (shows selected unit stats)

---

## Technology Stack

- **Three.js** - 3D rendering engine
- **TypeScript** - Type-safe game logic
- **Vite** - Fast build tool and dev server
- **HTML/CSS** - Hebrew RTL UI overlay

---

## Architecture

### Core Systems

```
src/
├── 3d/
│   ├── Scene3D.ts         - Main Three.js scene manager
│   ├── RTSCamera.ts       - RTS-style camera controller
│   ├── GameManager.ts     - Game loop, economy, win/loss
│   ├── InputManager.ts    - Mouse/keyboard input + raycasting
│   ├── Unit3D.ts          - 3D unit entities (combat/worker)
│   ├── Building3D.ts      - 3D HQ buildings
│   ├── ResourceNode3D.ts  - 3D biomass nodes
│   ├── Terrain.ts         - Ground plane with slight variation
│   └── UIManager.ts       - HTML overlay UI (Hebrew RTL)
├── types.ts               - Shared TypeScript types
├── GameData.ts            - Animal archetypes + hybrid fusion
├── constants.ts           - Game balance constants
├── i18n.ts                - Hebrew strings
└── main.ts                - Entry point
```

### Key Features

- **Procedural 3D Units**: Each creature is built from geometric primitives (spheres, cones, boxes) with parent colors
- **Real-time Shadows**: DirectionalLight with PCF soft shadows
- **Economy System**: Workers gather biomass, DNA trickles, train panel updates affordability
- **Simple AI**: Enemy units patrol and attack nearby player units
- **Billboard HP Bars**: Always face camera for readability
- **Raycasting Selection**: Click and box-select uses Three.js raycasting against ground plane

---

## Performance

- **Target**: 60fps on modest PC for ~50 units
- **Optimizations**:
  - Shadow map size: 2048×2048
  - AI update rate: 400ms intervals
  - Billboard updates per frame
  - Unit culling when HP ≤ 0

---

## Development Notes

- All creature designs, names, and stats are original
- Visual representation uses procedural 3D geometry
- AI uses simple aggro radius and retargeting
- Game designed for quick matches (under 5 minutes)
- No external assets or paid APIs required
- Phaser dependency removed - pure Three.js

---

## MVP Scope

This is a minimal viable **3D vertical slice** focusing on core RTS mechanics:

✅ **Included:**
- 3D perspective camera with RTS controls
- Procedural 3D creatures with hybrid visuals
- 3D buildings (HQ) and resource nodes
- Mouse selection (click, box-select, raycasting)
- Economy system (workers, biomass, DNA, training)
- Simple AI opponent
- Win/lose conditions (destroy HQ)
- Hebrew RTL UI overlay

❌ **Out of Scope (Future):**
- Multiple hybrid compositions in pre-battle forge
- Advanced AI tactics (flanking, formations)
- Fog of war
- Minimap
- Multiplayer
- Campaign mode
- Advanced 3D models (currently procedural)
- Sound effects / music

---

## Deployment

This project is configured for easy deployment on Vercel:

```bash
# Deploy to Vercel
vercel

# Or use the GitHub integration for automatic deployments
```

The `dist` folder contains the production build after running `npm run build`.

---

## License

MIT License - This is a prototype demonstration project with original intellectual property.

---

**Created as a 3D browser RTS prototype inspired by the concept of hybrid creature combat. 100% original IP - not affiliated with or endorsed by Relic Entertainment, THQ, Microsoft, or Impossible Creatures.**

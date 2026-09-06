# Chimera Skirmish

A playable browser-based real-time strategy game where you fuse animal archetypes to create hybrid creatures and battle against AI opponents.

**⚠️ Original IP Disclaimer**: This game is inspired by the *concept* of DNA mixing and hybrid creatures from games like Impossible Creatures, but contains 100% original content. No trademarked names, assets, creatures, or intellectual property from any existing games are used.

## Game Overview

### Core Gameplay Loop
1. **Creature Forge**: Select two animals from an original roster and fuse them to create a hybrid chimera
2. **Army Building**: Create 2-3 hybrid designs and build a squad (up to 12 units total)
3. **Battle**: Command your chimeras in real-time combat against an AI opponent
4. **Victory**: Eliminate all enemy units to win, or lose if your army is destroyed

### Original Animal Archetypes
- **Shadowpaw** - Agile melee fighter
- **Skystalker** - Aerial ranged attacker
- **Ironjaw** - Armored tank
- **Sparkshell** - Electric melee unit
- **Hornguard** - Defensive bruiser
- **Voltfin** - Aquatic ranged unit

### Hybrid Mechanics
When you fuse two animals:
- **Stats are averaged**: HP, speed, attack, and range combine
- **Ranged inheritance**: Hybrid gains ranged attacks if either parent has them
- **Special tags**: Inherits one parent's special trait (agile, aerial, armored, etc.)
- **Visual blending**: Procedurally generated appearance using parent colors

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

The game will open automatically at `http://localhost:3000`

### Controls

#### Creature Forge Phase
- **Left-click** animals to select them for fusion
- Click **FUSE!** when two animals are selected
- Navigate to army building after creating hybrids

#### Army Building Phase
- Click slot buttons to add hybrids to your army
- Maximum 12 units total, up to 4 of each hybrid type
- Click **START BATTLE!** when ready
- Use **Create More** to return to the forge

#### Battle Phase
- **Left-click**: Select a single unit
- **Click-drag**: Box select multiple units
- **Shift + Click**: Add units to selection
- **Right-click ground**: Move selected units
- **Right-click enemy**: Attack target with selected units
- Units automatically engage nearby enemies

## Technology Stack

- **TypeScript** - Type-safe game logic
- **Vite** - Fast build tool and dev server
- **Phaser 3** - HTML5 game framework
- **Canvas** - Procedural creature rendering

## Deployment

This project is configured for easy deployment on Vercel:

```bash
# Deploy to Vercel
vercel

# Or use the GitHub integration for automatic deployments
```

The `dist` folder contains the production build after running `npm run build`.

## MVP Scope

This is a minimal viable prototype focusing on core mechanics:

✅ **Included:**
- Creature DNA mixing with stat blending
- Army composition and deployment
- Real-time unit movement and combat
- Basic AI opponent
- Win/lose conditions
- Procedurally generated unit visuals

❌ **Out of Scope:**
- Base building or resource gathering
- Fog of war or advanced tactics
- Multiplayer or networking
- Campaign mode or progression
- 3D graphics or advanced audio
- User accounts or persistence

## Development Notes

- All creature designs, names, and stats are original
- Visual representation uses procedural shapes and colors
- AI uses simple chase-and-attack behavior
- Game designed for quick matches (under 2 minutes)
- No external assets or paid APIs required

## License

MIT License - This is a prototype demonstration project with original intellectual property.

---

**Created as a browser RTS prototype inspired by the concept of hybrid creature combat.**

# Chimera Skirmish

A playable browser-based real-time strategy game where you fuse animal archetypes to create hybrid creatures and battle against AI opponents.

**⚠️ Original IP Disclaimer**: This game is inspired by the *concept* of DNA mixing and hybrid creatures from games like Impossible Creatures, but contains 100% original content. No trademarked names, assets, creatures, or intellectual property from any existing games are used.

## Game Overview

### Core Gameplay Loop
1. **Creature Forge (המזקקה)**: Select two animals from an original roster and fuse them to create a hybrid chimera
2. **Deploy (לזירה)**: Review your hybrid stats and prepare for battle
3. **Battle (קרב)**: Command your chimeras in real-time combat against an AI opponent
4. **Victory/Defeat**: Eliminate all enemy units to win, or lose if your army is destroyed

### Original Animal Archetypes

| Name | Role | HP | Speed | Attack | Range | Special |
|------|------|----|----|--------|-------|---------|
| **Bat-Echo** (עטלף-הד) | scout | 50 | 9 | 10 | 1 | fog reveal small AoE |
| **Basalt-Rhino** (קרנף-בזלת) | tank | 180 | 3 | 18 | 1 | shield shove |
| **Quill-Snake** (נחש-זיפים) | assassin | 55 | 8 | 28 | 1 | poison DoT |
| **Vinegar-Eagle** (עיט-חומץ) | mobile ranged | 70 | 8 | 16 | 4 | dive (+dmg, CD) |
| **Crystal-Crab** (סרטן-גביש) | defense | 160 | 2 | 12 | 1 | armor + light reflect |
| **Ink-Octopus** (תמנון-דיו) | control | 90 | 4 | 11 | 3 | ink cloud slow |
| **Horn-Deer** (צבי-קרן) | skirmish | 85 | 7 | 20 | 2 | ram shove |
| **Thunder-Frog** (צפרדע-רעם) | artillery | 60 | 3 | 32 | 5 | shock hop AoE |

*Hebrew names displayed in UI for authenticity*

### Hybrid Mechanics

When you fuse two animals, the game uses this formula:
- **HP** = round((HP_A + HP_B) / 2)
- **Speed** = round((Speed_A + Speed_B) / 2) + 1 bonus if speed difference ≥ 5
- **Attack** = round(((Attack_A + Attack_B) / 2) × 1.1)
- **Range** = max(Range_A, Range_B)
- **Specials**: Primary from stronger parent + secondary tag from weaker parent
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

### Game Flow

#### 1. Forge (המזקקה)
- Browse 8 animal archetypes displayed with Hebrew names
- Click two animals to select them
- Click **מזג** (Merge) to create a hybrid
- View the hybrid preview with combined stats
- Click **לזירה** (To Arena) when ready

#### 2. Deploy (לזירה)
- Review your hybrid's full stats on the left (marked **אתה** / You in turquoise)
- See the enemy preview on the right (marked **יריב** / Rival in orange)
- Click **התחל קרב** (Start Battle) to begin
- Or return to forge with **חזרה למזקקה** (Back to Forge)

#### 3. Battle (קרב)
- **Your forces** (turquoise) spawn on the left - 8 units of your hybrid
- **Enemy forces** (orange) spawn on the right - 3-6 random hybrids
- **Large scrollable map** (2400×1800) with camera controls
- **Fog of war**: Unexplored areas are dark; explored but not visible are darkened; currently visible areas are clear
  - Player units reveal areas based on sight radius
  - Scout units (Bat-Echo) have larger vision range
  - Enemy units hidden when outside vision range
- **HP bars** at the top show overall army health
  - Green: >50% HP
  - Yellow: 25-50% HP  
  - Red: <25% HP

**Camera Controls:**
- **WASD or Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Mouse at Screen Edge**: Auto-pan camera
- **Space**: Center camera on selected units

**Selection:**
- **Left-click unit**: Select single unit (clears previous)
- **Left-click empty**: Deselect all
- **Shift + Left-click**: Add/remove unit from selection
- **Left-click drag**: Box select multiple units
- **Ctrl+A**: Select all your units

**Commands:**
- **Right-click ground**: Move selected units to location
- **Right-click enemy**: Attack target with selected units
- Units automatically engage nearby enemies
- Units retarget to nearest enemy when current target dies
- Visual feedback: Green selection ring + HP bar on selected units
- Click marker shows where orders were issued

#### 4. Victory/Defeat
- **ניצחת!** (You Won!) - All enemies defeated
- **הפסדת** (You Lost) - All your units defeated
- Click **קרב נוסף** (Another Battle) to retry with same hybrid
- Click **חזרה למזקקה** (Back to Forge) to create a new hybrid

### UI Language
- **Interface**: Hebrew (RTL layout)
- **Onboarding tips**: Hebrew with dismissible **הבנתי** (Got It) button
- **Color coding**:
  - Player: Turquoise (#2DD4BF)
  - Rival: Orange (#F97316)

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
- Creature DNA mixing with stat blending (design-locked formula)
- 8 original animal archetypes with Hebrew names
- Simplified flow: Forge → Deploy → Battle
- Real-time unit movement and combat
- Basic AI opponent with aggro/leash behavior
- Win/lose conditions
- Procedurally generated unit visuals
- Hebrew RTL UI with onboarding tips

❌ **Out of Scope:**
- Multiple hybrid army compositions
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

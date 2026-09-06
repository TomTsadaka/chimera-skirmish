# Chimera Skirmish Economy Layer — FINAL P0 ACCEPTANCE

## Overview
This document details the **P0 LOCK** implementation of the GeneLab economy system for Chimera Skirmish. This is an Impossible Creatures-inspired RTS economy layer with original Chimera naming and Hebrew RTL UI.

## P0 Specification

### Economy (GeneLab)
- **Biomass**: Workers gather from map nodes (8 per trip, ~4s round trip)
- **DNA**: Base trickle +2 DNA / 5s (NOT gathered)
- **Worker Cost**: 30 DNA / 40 Biomass
- **Starting Resources**: 80 DNA / 100 Biomass + 2 workers
- **Train Costs** (DNA/Biomass):
  - Bat-Echo: 40/20
  - Deer-Horn: 55/30
  - Snake-Whiskers: 70/25
  - Octopus-Ink: 65/35
  - Eagle-Vinegar: 80/40
  - Frog-Thunder: 90/45
  - Crab-Crystal: 85/50
  - Rhino-Basalt: 100/60

**Fusion Formula** (for custom hybrids):
- DNA = round((parent1.costDNA + parent2.costDNA) × 0.85)
- Biomass = round((parent1.costBiomass + parent2.costBiomass) × 0.5)

### Army System (Cage/Zoo)
- Pre-battle roster: Up to 9 slots (8 archetypes + worker)
- Existing forge fusion system maintained
- **P0 train panel**: Worker + 3 cheap units only (Bat-Echo, Horn-Deer, Quill-Snake)

### Combat Loop (ArenaAI)
- Loop: gather → DNA drip → train → fight
- Buildings: **HQ + Biomass nodes ONLY**
- Win condition: **Destroy enemy base**
- Lose condition: **Player base destroyed**
- **AI Wave Pattern (P0)**:
  1. Wave 1: Train 2× Bat-Echo units (40/20 each)
  2. Wave 2: Train 2× Horn-Deer units (55/30 each)
  3. Wave 3: Train 1-2× Quill-Snake units (70/25 each)
  4. Ongoing: Train cheapest affordable unit
- Target skirmish length: **6-10 minutes SP vs AI**

### UI Strings (Hebrew RTL + English)
```
hud.dna=DNA
hud.biomass=ביומסה
hud.baseHp=בסיס
panel.train=אמן
panel.worker=פועל
panel.needRes=אין מספיק משאבים
zoo.title=הכלוב
zoo.slot.empty=ריק
zoo.cta=לזירה
win.destroyBase=הבסיס נהרס — ניצחת!
win.title=ניצחון!
lose.baseDown=הבסיס שלך נהרס
lose.title=הפסד
onboard.battle=אסוף ביומסה בפועלים, אמן יחידות מהבסיס, השמד את בסיס היריב
```

### Player Settings
- **Fixed turquoise color** for P0 (no color picker)

## ShipIt Definition of Done (P0)

All 8 requirements verified:

### 1. ✅ Load cage→arena→battle no crash
- Forge → Army roster → Deploy → Battle flows work without errors
- Starting battle scene displays all UI elements correctly

### 2. ✅ Worker gather biomass HUD up
- Workers auto-gather from nodes when ordered
- Biomass counter updates live in top HUD
- Workers show gather state visually (carrying resources)
- Right-click resource nodes to manually order gathering

### 3. ✅ DNA drip HUD up
- DNA trickles +2 every 5 seconds for both player and AI
- DNA counter updates in real-time in top HUD
- Purple color (DNA) vs green color (Biomass) for clarity

### 4. ✅ Train worker + bat/deer when resources; button disabled if not
- Train panel shows **4 buttons only**: Worker, Bat-Echo, Horn-Deer, Quill-Snake
- Buttons gray out (`0x666666`) and become non-interactive when resources insufficient
- Resource costs displayed on each button (XD YB format)
- Clicking train button deducts costs and spawns unit near HQ

### 5. ✅ AI base + bat→deer→snake waves
- AI maintains 2-4 workers gathering Biomass automatically
- **Wave 1**: Trains 2× Bat-Echo (40/20 each) first
- **Wave 2**: Trains 2× Horn-Deer (55/30 each) after wave 1
- **Wave 3**: Trains 1-2× Quill-Snake (70/25 each) after wave 2
- **Ongoing**: Trains cheapest affordable unit (Bat > Deer > Snake) in loop
- AI checks resources every 5 seconds for training opportunities

### 6. ✅ Win destroy enemy base Hebrew msg
- Primary win: Enemy HQ reaches 0 HP
- Message displays: **"הבסיס נהרס — ניצחת!"** (The base destroyed — You won!)
- Title: **"ניצחון!"** (Victory!)
- Transition to GameOverScene with victory state

### 7. ✅ Lose player base Hebrew msg
- Primary lose: Player HQ reaches 0 HP
- Message displays: **"הבסיס שלך נהרס"** (Your base destroyed)
- Title: **"הפסד"** (Defeat)
- Transition to GameOverScene with defeat state

### 8. ✅ npm run build passes
```bash
$ npm run build
✓ TypeScript compilation: No errors
✓ Vite production build: Successfully bundled
✓ Output: dist/index.html + assets
```

## Technical Implementation Summary

### New Files
- `src/Building.ts` — HQ building class with HP, team colors, drop-off points
- `src/ResourceNode.ts` — Biomass node class with gather/depletion logic

### Modified Files
- `src/types.ts` — Economy interfaces (EconomyState, ResourceNode, ResourceType, UnitRole)
- `src/constants.ts` — GeneLab economy constants (gather rates, trickle intervals, costs)
- `src/i18n.ts` — P0 Hebrew/English UI strings (hud, panel, zoo, win, lose)
- `src/GameData.ts` — Archetype costs, hybrid cost calculation via fusion formula
- `src/Unit.ts` — Worker role, gather FSM (idle→moving→gathering→returning→dropoff), biomass carrying
- `src/BattleScene.ts` — Economy integration, P0 train panel (4 buttons), HUD (DNA/Biomass/baseHP), DNA trickle timer
- `src/AI.ts` — P0 wave logic (bat×2→deer×2→snake×1-2→cheapest loop), worker management (2-4 count)
- `src/Minimap.ts` — Resource node visualization (green dots for Biomass)
- `src/MainMenuScene.ts` — Army roster (Cage/Zoo) UI with 9-slot management
- `src/DeployScene.ts` — Army roster preview (first 3 units + count)
- `src/GameOverScene.ts` — Hebrew win/lose messages with custom message parameter

### Key Systems
1. **Resource Management**: Dual-resource system (Biomass gather + DNA trickle), EconomyState tracking
2. **Worker AI**: Finite state machine for gather→return→dropoff loop with pathfinding
3. **Production System**: Train panel with cost validation, button disable when unaffordable
4. **AI Economy**: Wave-based unit production (bat→deer→snake→cheapest) with resource management
5. **Win/Lose**: Primary condition = HQ destruction, secondary = army wipe (fallback)
6. **Army Roster**: 9-slot army list in Forge, deploy preview, P0 focuses on 3 cheap units

## Gameplay Balance

### Strategic Flow
1. **Early game (0-2 min)**: Workers gather Biomass, DNA trickles, train 1-2 more workers
2. **Mid game (2-5 min)**: Train cheap units (Bat/Deer), scout enemy, control center nodes
3. **Late game (5-10 min)**: Mass army, attack enemy HQ, defend own HQ
4. **Win**: Destroy enemy HQ (500 HP) or wipe their forces

### Economy Notes
- Starting 80 DNA + 100 Biomass allows 1 worker OR 1 cheap combat unit
- Worker ROI: Gathers 8 Biomass every ~4s = ~120 Biomass/min
- DNA trickle: +2 every 5s = 24 DNA/min (passive income, no micro needed)
- 2 workers sufficient for early game, scale to 4 workers for late game
- Training 2-3 workers early accelerates mid-game army production

### Unit Costs vs Value
- **Cheap scouts** (Bat-Echo 40/20): Fast training, good for early aggression
- **Mid units** (Horn-Deer 55/30): Balanced stats, core of army
- **Heavy** (Snake-Whiskers 70/25): Higher DNA cost, worth the investment late game
- **Expensive** (Rhino-Basalt 100/60): Not in P0 UI but trainable via fusion system

## P0 Deferrals (Future Scope)

**NOT in this pass:**
- ❌ Full Lab/research tech tree (only HQ + nodes)
- ❌ Multiplayer (MP) support (SP vs AI only)
- ❌ Replay system
- ❌ Player color picker UI (fixed turquoise)
- ❌ Water/Air unit chambers (ground units only)
- ❌ Advanced building tree (barracks, tech labs, etc.)
- ❌ Research/upgrade systems
- ❌ Campaign mode (skirmish only)
- ❌ Full train panel with all 9 army units (P0 shows 4 units only)

## How to Test

### Quick Test (5 min)
1. **Build**: `npm run build` (should pass ✅)
2. **Run**: Open `dist/index.html` in browser
3. **Forge**: Fuse 1-2 hybrids, add to army roster
4. **Deploy**: Click "לזירה" (To Arena)
5. **Battle**:
   - Select workers, right-click Biomass nodes (green "B" icons)
   - Watch DNA trickle (+2 every 5s in top HUD)
   - Train Worker (30D 40B) if needed
   - Train Bat/Deer/Snake when affordable
   - Attack enemy HQ (orange building on right)
6. **Win**: Destroy enemy HQ → Hebrew victory message

### Full Verification (15 min)
1. ✅ Start battle, observe 2 workers auto-gather
2. ✅ DNA counter increments +2 every 5 seconds
3. ✅ Biomass counter updates as workers return to HQ
4. ✅ Train buttons gray out when resources < cost
5. ✅ Train worker (30D 40B), spawns near player HQ
6. ✅ Train Bat-Echo (40D 20B), spawns as combat unit
7. ✅ AI trains 2× Bat-Echo, then 2× Horn-Deer, then Snake units
8. ✅ Attack enemy HQ until HP → 0
9. ✅ Win message: "הבסיס נהרס — ניצחת!"
10. ✅ Let AI destroy player HQ
11. ✅ Lose message: "הבסיס שלך נהרס"
12. ✅ Replay works correctly (army roster persists)

## Known Limitations

### P0 Train Panel Constraints
- Only shows **4 buttons**: Worker + Bat-Echo + Horn-Deer + Quill-Snake
- Full army roster (up to 9 units) still functional in Forge/Deploy
- Other hybrids not in P0 UI but still trainable if in roster (archetype fallback system)

### AI Behavior
- AI follows fixed wave pattern (bat→deer→snake→cheapest)
- No advanced tactics (flanking, retreating, focus fire)
- Does not rebuild workers if all destroyed (P0 simplification)

### Economy Edge Cases
- No Biomass node respawn (2000 per node, 12000 total, enough for 10 min skirmish)
- No supply cap or unit limit (train as many as resources allow)
- Workers don't auto-redistribute when node depletes (player must manually re-order)

## Future Work (Post-P0)

### Priority 1 (Enhance P0)
- Expand train panel to show all 9 army units (scrollable)
- Add "Not Enough Resources" toast notifications
- Show unit HP bars above units (not just in UI)
- Worker auto-redistribute to nearest node when current depletes

### Priority 2 (New Features)
- Building variety (Barracks, Tech Lab)
- Research tree (worker speed, gather rate, unit upgrades)
- Defensive structures (Turrets)
- Player color picker (currently fixed turquoise)

### Priority 3 (Polish)
- Biomass node respawn after depletion
- Supply cap system (prevent infinite army spam)
- AI difficulty levels (easy/medium/hard)
- Match duration options (fast 3 min / standard 10 min / long 20 min)

---

## Summary

✅ **P0 LOCK implementation complete!**
- GeneLab economy (Biomass gather + DNA trickle)
- Army roster system (9 slots, P0 focuses on 3 cheap units)
- AI waves (bat→deer→snake→cheapest)
- Hebrew UI strings (RTL support)
- HQ destruction win/lose conditions
- All 8 ShipIt DoD requirements met
- `npm run build` passes
- Playable 6-10 min skirmish vs AI

**Ready for playtesting and further iteration!** 🎮

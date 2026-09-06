# Combat & Controls Acceptance Checklist

## P1: Core Controls (Target: 60s test)
- [x] LMB unit = single select (clears previous selection)
- [x] LMB empty space = deselect all
- [x] Shift+LMB unit = add/remove from selection
- [x] Ctrl+A = select all player units
- [x] LMB drag = box-select player units only
- [x] Empty drag box = deselect
- [x] RMB ground = move selected units
- [x] RMB enemy = attack-move/focus target
- [x] Visual feedback: selection ring + HP bar on selected units
- [x] Brief click marker on ground/target for snappy feedback

## P2: Combat & AI (Target: 90s test)
- [x] Units stop and attack when in range
- [x] If target dies, automatically retarget nearest enemy (no stuck on corpse)
- [x] Enemy AI: Fixed spawn points (3–6 enemies)
- [x] Enemy AI: Aggro radius → chase to attack range
- [x] Enemy AI: Leash distance (don't chase forever)
- [x] Enemy AI: Focus rule - prefer attacker, else nearest (stick to target, no flicker)
- [x] Attack cooldown system working
- [x] Dead enemies removed from scene and target lists
- [x] HP bars update correctly
- [x] Units die and are removed when HP reaches 0

## Win/Lose Conditions
- [x] Win: All enemies dead → clear victory banner
- [x] Lose: All player units dead → defeat banner
- [x] Input disabled after game ends
- [x] Restart button resets units/HP/selection/AI (no ghost units)
- [x] Brief delay before game-over transition (0.5s)

## Acceptance Criteria
✅ **P1 (60s)**: Select/move/box/shift/deselect all working
✅ **P2 (90s)**: Focus-fire, retarget after death, AI fights back
✅ **Win/Lose**: Both states work, Restart clears everything

## Implementation Status
**DoD for Prototype**: P1 + P2 pass without blockers ✅

### Controls Summary
- **Left Mouse Button**: Select units (Shift to add/remove)
- **Right Mouse Button**: Move or attack
- **Ctrl+A**: Select all player units
- **Box Select**: Drag left mouse to select multiple units

### AI Behavior
- **Aggro Radius**: 250 units (enemies engage when players approach)
- **Leash Distance**: 400 units (enemies return to spawn if chase too far)
- **Target Priority**: Attackers > Nearest > Stick to target
- **Attack Cooldown**: 1000ms between attacks

### Enemy Spawn
- Fixed spawn points (6 positions on right side)
- 3-6 enemies spawned based on player army size
- Each enemy is a random hybrid from available archetypes

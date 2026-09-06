/**
 * Centralized game constants for ArenaAI tuning
 * All measurements in world units unless specified
 */

export const GAME_CONSTANTS = {
  // Map dimensions
  MAP_WIDTH: 2400,
  MAP_HEIGHT: 1800,

  // Vision & Detection
  DEFAULT_VISION: 9, // world units (overridden by GeneLab archetype vision in tiles)
  TILE_SIZE: 32, // pixels per tile for GeneLab vision conversion
  
  // Enemy AI
  ENEMY_AGGRO_RADIUS: 5.5, // ~0.6× default vision (in world units, will convert from vision)
  ENEMY_LEASH_DISTANCE: 15, // ~2.7× aggro radius
  AI_RETARGET_INTERVAL: 400, // milliseconds (0.4s)
  
  // Camera
  CAMERA_EDGE_PAN_PERCENT: 2.5, // percentage of screen
  CAMERA_EDGE_PAN_MIN: 12, // pixels
  CAMERA_EDGE_PAN_MAX: 28, // pixels
  CAMERA_PAN_SPEED: 20, // world units per second
  CAMERA_ZOOM_MIN: 0.65,
  CAMERA_ZOOM_MAX: 1.35,
  CAMERA_ZOOM_STEP: 0.08,
  CAMERA_MARGIN_PERCENT: 5, // percentage margin for clamp
  
  // Fog of War
  FOG_EXPLORED_ALPHA: 0.45, // 40-50% darkness for explored areas
  FOG_REFRESH_INTERVAL: 125, // milliseconds (100-150ms)
  FOG_UNEXPLORED_COLOR: 0x000000, // black
  FOG_EXPLORED_COLOR: 0x0a1a0a, // dark green tint
  
  // Control Groups
  MAX_CONTROL_GROUPS: 10, // 0-9
  
  // Unit constants
  UNIT_SIZE: 30, // base size for units
  
  // Economy constants
  STARTING_BIOMASS: 200,
  STARTING_ENERGY: 150,
  STARTING_WORKERS: 4,
  
  WORKER_COST_BIOMASS: 50,
  WORKER_COST_ENERGY: 0,
  COMBAT_UNIT_COST_BIOMASS: 75,
  COMBAT_UNIT_COST_ENERGY: 50,
  
  WORKER_GATHER_RATE: 10, // resources per trip
  WORKER_GATHER_INTERVAL: 3000, // milliseconds per trip
  WORKER_SPEED: 1.5, // movement speed multiplier
  
  RESOURCE_NODE_BIOMASS_AMOUNT: 1500,
  RESOURCE_NODE_ENERGY_AMOUNT: 1200,
  
  HQ_HP: 500,
  HQ_SIZE: 60,
} as const;

/**
 * Calculate aggro radius based on unit vision
 * Aggro ≈ 0.6× Vision
 */
export function getAggroRadius(visionInTiles: number): number {
  const visionInWorldUnits = visionInTiles * GAME_CONSTANTS.TILE_SIZE;
  return visionInWorldUnits * 0.6;
}

/**
 * Calculate leash distance based on aggro radius
 * Leash ≈ 2.7× Aggro
 */
export function getLeashDistance(aggroRadius: number): number {
  return aggroRadius * 2.7;
}

/**
 * Convert GeneLab vision (tiles) to world units for fog of war
 */
export function visionTilesToWorldUnits(tiles: number): number {
  return tiles * GAME_CONSTANTS.TILE_SIZE;
}

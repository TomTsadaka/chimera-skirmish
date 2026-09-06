import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants';

export class Terrain {
  private mesh: THREE.Group;
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;

  constructor() {
    this.mesh = new THREE.Group();
    
    // Create bright green textured ground plane
    const geometry = new THREE.PlaneGeometry(this.MAP_WIDTH, this.MAP_HEIGHT, 50, 50);
    
    // Add slight height variation for visual interest
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      const noise = (Math.sin(i * 0.1) + Math.cos(i * 0.15)) * 0.5;
      positions.setZ(i, z + noise);
    }
    geometry.computeVertexNormals();
    
    // Bright green grass-like material with texture variation
    const material = new THREE.MeshStandardMaterial({
      color: 0x6B8E4D,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(this.MAP_WIDTH / 2, 0, this.MAP_HEIGHT / 2);
    ground.receiveShadow = true;
    this.mesh.add(ground);
    
    // Add visible grid overlay for better depth perception
    const gridHelper = new THREE.GridHelper(
      Math.max(this.MAP_WIDTH, this.MAP_HEIGHT),
      40,
      0x000000,
      0x000000
    );
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    gridHelper.position.set(this.MAP_WIDTH / 2, 0.15, this.MAP_HEIGHT / 2);
    this.mesh.add(gridHelper);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }
}

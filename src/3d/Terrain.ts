import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants';

export class Terrain {
  private mesh: THREE.Mesh;
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;

  constructor() {
    // Create ground plane
    const geometry = new THREE.PlaneGeometry(this.MAP_WIDTH, this.MAP_HEIGHT, 32, 32);
    
    // Add slight height variation for visual interest
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      const noise = (Math.sin(i * 0.1) + Math.cos(i * 0.15)) * 0.5;
      positions.setZ(i, z + noise);
    }
    geometry.computeVertexNormals();
    
    // Green grass-like material
    const material = new THREE.MeshStandardMaterial({
      color: 0x5C8A4D,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(this.MAP_WIDTH / 2, 0, this.MAP_HEIGHT / 2);
    this.mesh.receiveShadow = true;
    
    // Add grid helper for better depth perception
    const gridHelper = new THREE.GridHelper(
      Math.max(this.MAP_WIDTH, this.MAP_HEIGHT),
      50,
      0x000000,
      0x000000
    );
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.set(this.MAP_WIDTH / 2, 0.1, this.MAP_HEIGHT / 2);
    this.mesh.add(gridHelper);
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
}

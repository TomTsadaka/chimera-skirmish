import * as THREE from 'three';
import { RTSCamera } from './RTSCamera';
import { InputManager } from './InputManager';
import { GameManager } from './GameManager';
import { Terrain } from './Terrain';
import { HybridCreature } from '../types';

export class Scene3D {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: RTSCamera;
  private inputManager: InputManager;
  private gameManager: GameManager;
  private terrain: Terrain;
  
  private clock: THREE.Clock;
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xB0E0FF); // Bright sky blue
    
    // Ensure canvas is properly sized
    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xD0D0D0, 100, 400); // Light gray fog

    // Initialize camera
    this.camera = new RTSCamera(this.renderer.domElement);

    // Initialize terrain
    this.terrain = new Terrain();
    this.scene.add(this.terrain.getMesh());

    // Setup lighting
    this.setupLighting();

    // Initialize managers
    this.inputManager = new InputManager(
      this.renderer.domElement,
      this.camera.getCamera(),
      this.scene
    );
    
    this.gameManager = new GameManager(this.scene, this.inputManager, this.camera);

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLighting(): void {
    // Bright ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Strong directional light (sun) with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Shadow camera setup for larger area
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;
    
    this.scene.add(directionalLight);

    // Strong hemisphere light for bright outdoor look
    const hemisphereLight = new THREE.HemisphereLight(0xB0E0FF, 0x6B8E4D, 0.5);
    this.scene.add(hemisphereLight);
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.onResize(width, height);
    this.renderer.setSize(width, height);
  }

  public start(selectedHybrid: HybridCreature | null = null): void {
    this.isRunning = true;
    this.gameManager.start(selectedHybrid);
    this.animate();
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    // Update game systems
    this.camera.update(delta);
    this.inputManager.update(delta);
    this.gameManager.update(delta);
    
    // Render
    this.renderer.render(this.scene, this.camera.getCamera());
  };

  public dispose(): void {
    this.isRunning = false;
    this.gameManager.dispose();
    this.inputManager.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

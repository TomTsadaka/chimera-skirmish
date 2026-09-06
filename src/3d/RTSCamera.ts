import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants';

export class RTSCamera {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private domElement: HTMLElement;
  
  private keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    arrowUp: false,
    arrowDown: false,
    arrowLeft: false,
    arrowRight: false
  };
  
  private mouseAtEdge = { x: 0, y: 0 };
  private pointerInWindow = true;
  
  private readonly PAN_SPEED = GAME_CONSTANTS.CAMERA_PAN_SPEED / 1000; // Convert to units/ms
  private readonly MIN_HEIGHT = 30;
  private readonly MAX_HEIGHT = 100;
  private readonly CAMERA_ANGLE = 60; // Degrees from horizontal
  
  private readonly MAP_WIDTH = GAME_CONSTANTS.MAP_WIDTH;
  private readonly MAP_HEIGHT = GAME_CONSTANTS.MAP_HEIGHT;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    
    // Position camera for RTS view
    this.target = new THREE.Vector3(this.MAP_WIDTH / 2, 0, this.MAP_HEIGHT / 2);
    this.updateCameraPosition(50);
    
    this.setupControls();
  }

  private setupControls(): void {
    // Keyboard controls
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Mouse wheel for zoom
    this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    
    // Pointer tracking for edge panning
    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.domElement.addEventListener('pointerleave', () => { this.pointerInWindow = false; });
    this.domElement.addEventListener('pointerenter', () => { this.pointerInWindow = true; });
    
    window.addEventListener('blur', () => { this.pointerInWindow = false; });
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW': this.keys.w = true; event.preventDefault(); break;
      case 'KeyA': this.keys.a = true; event.preventDefault(); break;
      case 'KeyS': this.keys.s = true; event.preventDefault(); break;
      case 'KeyD': this.keys.d = true; event.preventDefault(); break;
      case 'ArrowUp': this.keys.arrowUp = true; break;
      case 'ArrowDown': this.keys.arrowDown = true; break;
      case 'ArrowLeft': this.keys.arrowLeft = true; break;
      case 'ArrowRight': this.keys.arrowRight = true; break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW': this.keys.w = false; break;
      case 'KeyA': this.keys.a = false; break;
      case 'KeyS': this.keys.s = false; break;
      case 'KeyD': this.keys.d = false; break;
      case 'ArrowUp': this.keys.arrowUp = false; break;
      case 'ArrowDown': this.keys.arrowDown = false; break;
      case 'ArrowLeft': this.keys.arrowLeft = false; break;
      case 'ArrowRight': this.keys.arrowRight = false; break;
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const currentHeight = this.camera.position.y;
    const zoomSpeed = 3;
    const deltaHeight = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
    const newHeight = THREE.MathUtils.clamp(
      currentHeight + deltaHeight,
      this.MIN_HEIGHT,
      this.MAX_HEIGHT
    );
    
    this.updateCameraPosition(newHeight);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.pointerInWindow) return;
    
    const rect = this.domElement.getBoundingClientRect();
    const edgeSize = Math.max(12, Math.min(28, rect.width * 0.025));
    
    // Check edges
    this.mouseAtEdge.x = 0;
    this.mouseAtEdge.y = 0;
    
    if (event.clientX - rect.left < edgeSize) {
      this.mouseAtEdge.x = -1;
    } else if (rect.right - event.clientX < edgeSize) {
      this.mouseAtEdge.x = 1;
    }
    
    if (event.clientY - rect.top < edgeSize) {
      this.mouseAtEdge.y = -1;
    } else if (rect.bottom - event.clientY < edgeSize) {
      this.mouseAtEdge.y = 1;
    }
  }

  private updateCameraPosition(height: number): void {
    const angleRad = this.CAMERA_ANGLE * Math.PI / 180;
    const distance = height / Math.sin(angleRad);
    const horizontalDistance = distance * Math.cos(angleRad);
    
    this.camera.position.set(
      this.target.x,
      height,
      this.target.z + horizontalDistance
    );
    
    this.camera.lookAt(this.target);
  }

  public update(delta: number): void {
    const panSpeed = this.PAN_SPEED * delta;
    let moved = false;
    
    // Keyboard panning
    if (this.keys.w || this.keys.arrowUp) {
      this.target.z -= panSpeed;
      moved = true;
    }
    if (this.keys.s || this.keys.arrowDown) {
      this.target.z += panSpeed;
      moved = true;
    }
    if (this.keys.a || this.keys.arrowLeft) {
      this.target.x -= panSpeed;
      moved = true;
    }
    if (this.keys.d || this.keys.arrowRight) {
      this.target.x += panSpeed;
      moved = true;
    }
    
    // Edge panning
    if (this.pointerInWindow) {
      if (this.mouseAtEdge.x !== 0) {
        this.target.x += this.mouseAtEdge.x * panSpeed;
        moved = true;
      }
      if (this.mouseAtEdge.y !== 0) {
        this.target.z += this.mouseAtEdge.y * panSpeed;
        moved = true;
      }
    }
    
    // Clamp to map bounds with margin
    const margin = 20;
    this.target.x = THREE.MathUtils.clamp(this.target.x, margin, this.MAP_WIDTH - margin);
    this.target.z = THREE.MathUtils.clamp(this.target.z, margin, this.MAP_HEIGHT - margin);
    
    if (moved) {
      this.updateCameraPosition(this.camera.position.y);
    }
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public panTo(x: number, z: number, _duration: number = 0): void {
    // For now, instant pan. Can add smooth animation later
    this.target.set(x, 0, z);
    this.updateCameraPosition(this.camera.position.y);
  }
}

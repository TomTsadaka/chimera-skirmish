import * as THREE from 'three';

export interface InputState {
  mouseDown: boolean;
  mouseButton: number;
  mouseStartX: number;
  mouseStartY: number;
  mouseCurrentX: number;
  mouseCurrentY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

export class InputManager {
  private domElement: HTMLElement;
  private camera: THREE.Camera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  public inputState: InputState = {
    mouseDown: false,
    mouseButton: -1,
    mouseStartX: 0,
    mouseStartY: 0,
    mouseCurrentX: 0,
    mouseCurrentY: 0,
    shiftKey: false,
    ctrlKey: false
  };
  
  private listeners: {
    onLeftClick?: (worldPos: THREE.Vector3, shift: boolean) => void;
    onRightClick?: (worldPos: THREE.Vector3) => void;
    onBoxSelect?: (start: THREE.Vector3, end: THREE.Vector3, shift: boolean) => void;
    onHover?: (worldPos: THREE.Vector3 | null) => void;
  } = {};

  constructor(domElement: HTMLElement, camera: THREE.Camera, _scene: THREE.Scene) {
    this.domElement = domElement;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupEvents();
  }

  private setupEvents(): void {
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    
    this.inputState.mouseDown = true;
    this.inputState.mouseButton = event.button;
    this.inputState.mouseStartX = event.clientX;
    this.inputState.mouseStartY = event.clientY;
    this.inputState.shiftKey = event.shiftKey;
    this.inputState.ctrlKey = event.ctrlKey;
    
    this.updateMouse(event);
  }

  private onPointerMove(event: PointerEvent): void {
    this.updateMouse(event);
    
    if (this.inputState.mouseDown) {
      this.inputState.mouseCurrentX = event.clientX;
      this.inputState.mouseCurrentY = event.clientY;
    }
    
    // Hover detection
    const worldPos = this.getWorldPosition(event);
    if (this.listeners.onHover) {
      this.listeners.onHover(worldPos);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.inputState.mouseDown) return;
    
    this.updateMouse(event);
    
    const deltaX = Math.abs(event.clientX - this.inputState.mouseStartX);
    const deltaY = Math.abs(event.clientY - this.inputState.mouseStartY);
    
    if (this.inputState.mouseButton === 0) {
      // Left click
      if (deltaX < 5 && deltaY < 5) {
        // Single click
        const worldPos = this.getWorldPosition(event);
        if (worldPos && this.listeners.onLeftClick) {
          this.listeners.onLeftClick(worldPos, this.inputState.shiftKey);
        }
      } else {
        // Box select
        const startWorld = this.screenToWorld(this.inputState.mouseStartX, this.inputState.mouseStartY);
        const endWorld = this.getWorldPosition(event);
        if (startWorld && endWorld && this.listeners.onBoxSelect) {
          this.listeners.onBoxSelect(startWorld, endWorld, this.inputState.shiftKey);
        }
      }
    } else if (this.inputState.mouseButton === 2) {
      // Right click
      const worldPos = this.getWorldPosition(event);
      if (worldPos && this.listeners.onRightClick) {
        this.listeners.onRightClick(worldPos);
      }
    }
    
    this.inputState.mouseDown = false;
    this.inputState.mouseButton = -1;
  }

  private updateMouse(event: PointerEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getWorldPosition(event: PointerEvent): THREE.Vector3 | null {
    this.updateMouse(event);
    return this.raycastToGround();
  }

  private screenToWorld(screenX: number, screenY: number): THREE.Vector3 | null {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;
    return this.raycastToGround();
  }

  private raycastToGround(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Raycast against ground plane (y=0)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, target);
    
    return target || null;
  }

  public getRaycaster(): THREE.Raycaster {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster;
  }

  public on(event: string, callback: Function): void {
    switch (event) {
      case 'leftclick':
        this.listeners.onLeftClick = callback as any;
        break;
      case 'rightclick':
        this.listeners.onRightClick = callback as any;
        break;
      case 'boxselect':
        this.listeners.onBoxSelect = callback as any;
        break;
      case 'hover':
        this.listeners.onHover = callback as any;
        break;
    }
  }

  public update(_delta: number): void {
    // Can be used for continuous input processing if needed
  }

  public dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.removeEventListener('pointermove', this.onPointerMove.bind(this));
    this.domElement.removeEventListener('pointerup', this.onPointerUp.bind(this));
  }

  public getBoxSelectBounds(): { start: THREE.Vector2; end: THREE.Vector2 } | null {
    if (!this.inputState.mouseDown || this.inputState.mouseButton !== 0) {
      return null;
    }
    
    const deltaX = Math.abs(this.inputState.mouseCurrentX - this.inputState.mouseStartX);
    const deltaY = Math.abs(this.inputState.mouseCurrentY - this.inputState.mouseStartY);
    
    if (deltaX < 5 && deltaY < 5) {
      return null;
    }
    
    return {
      start: new THREE.Vector2(this.inputState.mouseStartX, this.inputState.mouseStartY),
      end: new THREE.Vector2(this.inputState.mouseCurrentX, this.inputState.mouseCurrentY)
    };
  }
}

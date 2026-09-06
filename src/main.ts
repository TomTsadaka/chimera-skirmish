import { Scene3D } from './3d/Scene3D';

// Create container for the game
const container = document.createElement('div');
container.id = 'threejs-container';
container.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;
document.body.appendChild(container);

// Initialize the 3D scene
const scene3d = new Scene3D(container);
scene3d.start();

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause or handle minimization
  } else {
    // Resume
  }
});

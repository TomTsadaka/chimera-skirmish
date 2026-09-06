import { Scene3D } from './3d/Scene3D';

// Show splash screen immediately
function showSplash() {
  const splash = document.createElement('div');
  splash.id = 'splash-screen';
  splash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: Arial, sans-serif;
    direction: rtl;
  `;
  
  const title = document.createElement('div');
  title.textContent = 'כִּימֵרָה';
  title.style.cssText = `
    font-size: 72px;
    font-weight: bold;
    color: #2DD4BF;
    margin-bottom: 40px;
    text-shadow: 0 0 20px rgba(45, 212, 191, 0.5);
  `;
  splash.appendChild(title);
  
  const subtitle = document.createElement('div');
  subtitle.textContent = 'מלחמת קרב תלת-ממדית';
  subtitle.style.cssText = `
    font-size: 24px;
    color: #ffffff;
    margin-bottom: 60px;
  `;
  splash.appendChild(subtitle);
  
  const startBtn = document.createElement('button');
  startBtn.textContent = 'התחל קרב';
  startBtn.style.cssText = `
    padding: 20px 60px;
    font-size: 28px;
    font-weight: bold;
    background: #2DD4BF;
    color: #000000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(45, 212, 191, 0.4);
  `;
  
  startBtn.addEventListener('mouseenter', () => {
    startBtn.style.transform = 'scale(1.1)';
    startBtn.style.boxShadow = '0 6px 30px rgba(45, 212, 191, 0.6)';
  });
  
  startBtn.addEventListener('mouseleave', () => {
    startBtn.style.transform = 'scale(1)';
    startBtn.style.boxShadow = '0 4px 20px rgba(45, 212, 191, 0.4)';
  });
  
  startBtn.addEventListener('click', () => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      splash.remove();
      startGame();
    }, 500);
  });
  
  splash.appendChild(startBtn);
  
  const loading = document.createElement('div');
  loading.textContent = 'טוען...';
  loading.style.cssText = `
    margin-top: 40px;
    font-size: 18px;
    color: #94a3b8;
  `;
  splash.appendChild(loading);
  
  document.body.appendChild(splash);
  
  // Auto-hide loading text after 1 second
  setTimeout(() => {
    loading.style.display = 'none';
  }, 1000);
}

function startGame() {
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
}

// Show splash immediately on load
showSplash();

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause or handle minimization
  } else {
    // Resume
  }
});

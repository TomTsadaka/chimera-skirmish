import { Scene3D } from './3d/Scene3D';
import { CageUI } from './cage/CageUI';
import { HybridCreature } from './types';

// Global state
let currentScene3D: Scene3D | null = null;
let battleContainer: HTMLDivElement | null = null;
const cageUI = new CageUI();

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
  
  // Two buttons: Go to Cage or Quick Battle
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 30px;
  `;
  
  const cageBtn = document.createElement('button');
  cageBtn.textContent = 'כלוב - בחר חיות';
  cageBtn.style.cssText = `
    padding: 20px 40px;
    font-size: 24px;
    font-weight: bold;
    background: #2DD4BF;
    color: #000000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(45, 212, 191, 0.4);
  `;
  cageBtn.addEventListener('mouseenter', () => {
    cageBtn.style.transform = 'scale(1.05)';
    cageBtn.style.boxShadow = '0 6px 30px rgba(45, 212, 191, 0.6)';
  });
  cageBtn.addEventListener('mouseleave', () => {
    cageBtn.style.transform = 'scale(1)';
    cageBtn.style.boxShadow = '0 4px 20px rgba(45, 212, 191, 0.4)';
  });
  cageBtn.addEventListener('click', () => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      splash.remove();
      navigateToCage();
    }, 500);
  });
  buttonContainer.appendChild(cageBtn);
  
  const quickBtn = document.createElement('button');
  quickBtn.textContent = 'קרב מהיר';
  quickBtn.style.cssText = `
    padding: 20px 40px;
    font-size: 24px;
    font-weight: bold;
    background: #64748B;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(100, 116, 139, 0.4);
  `;
  quickBtn.addEventListener('mouseenter', () => {
    quickBtn.style.transform = 'scale(1.05)';
    quickBtn.style.boxShadow = '0 6px 30px rgba(100, 116, 139, 0.6)';
  });
  quickBtn.addEventListener('mouseleave', () => {
    quickBtn.style.transform = 'scale(1)';
    quickBtn.style.boxShadow = '0 4px 20px rgba(100, 116, 139, 0.4)';
  });
  quickBtn.addEventListener('click', () => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      splash.remove();
      startBattle(null);
    }, 500);
  });
  buttonContainer.appendChild(quickBtn);
  
  splash.appendChild(buttonContainer);
  
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

function navigateToCage() {
  // Hide battle if it exists
  if (battleContainer) {
    battleContainer.style.display = 'none';
  }
  
  // Show cage UI
  cageUI.show((hybrid: HybridCreature) => {
    startBattle(hybrid);
  });
}

function startBattle(selectedHybrid: HybridCreature | null) {
  // Hide cage
  cageUI.hide();
  
  // Create or show battle container
  if (!battleContainer) {
    battleContainer = document.createElement('div');
    battleContainer.id = 'threejs-container';
    battleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    document.body.appendChild(battleContainer);
  } else {
    battleContainer.style.display = 'block';
  }
  
  // Dispose of old scene if it exists
  if (currentScene3D) {
    currentScene3D.dispose();
  }
  
  // Initialize new battle scene
  currentScene3D = new Scene3D(battleContainer);
  currentScene3D.start(selectedHybrid);
}

// Listen for navigate-to-cage event from game-over modal
window.addEventListener('navigate-to-cage', () => {
  navigateToCage();
});

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

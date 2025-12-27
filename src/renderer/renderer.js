// Lum-o-ring Renderer
// Ring light overlay with transparent background

const { ipcRenderer } = require('electron');

// Ring settings state
let settings = {
  isOn: true,
  radius: 45,      // Percentage of screen size
  thickness: 20,   // Pixels
  brightness: 100, // 0-100
  blur: 30,        // Pixels for glow effect
  color: '#fff5cc' // Warm white
};

// Control panel visibility
let showControlPanel = false;
let showAbout = false;

// Initialize the app
async function init() {
  console.log('[lum-o-ring] Initializing renderer...');

  // Load saved settings
  try {
    const savedSettings = await ipcRenderer.invoke('loadSettings');
    if (savedSettings) {
      settings = { ...settings, ...savedSettings };
      console.log('[lum-o-ring] Settings loaded:', settings);
    }
  } catch (error) {
    console.log('[lum-o-ring] Using default settings');
  }

  // Apply initial settings
  applySettings();

  // Setup event listeners
  setupEventListeners();

  console.log('[lum-o-ring] Renderer initialized');
}

// Apply settings to the DOM
function applySettings() {
  const ring = document.getElementById('ring');
  const controlPanel = document.getElementById('control-panel');

  if (!ring) return;

  if (settings.isOn) {
    ring.style.display = 'flex';
  } else {
    ring.style.display = 'none';
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Toggle control panel
  document.getElementById('toggle-settings')?.addEventListener('click', () => {
    showControlPanel = !showControlPanel;
    document.getElementById('control-panel').classList.toggle('hidden', !showControlPanel);
    document.getElementById('toggle-settings').classList.toggle('active', showControlPanel);
  });

  // Close control panel
  document.getElementById('close-settings')?.addEventListener('click', () => {
    showControlPanel = false;
    document.getElementById('control-panel').classList.add('hidden');
    document.getElementById('toggle-settings').classList.remove('active');
  });

  // Power toggle
  document.getElementById('power-toggle')?.addEventListener('change', (e) => {
    settings.isOn = e.target.checked;
    applySettings();
    saveSettings();
  });

  // Radius slider
  document.getElementById('radius-slider')?.addEventListener('input', (e) => {
    settings.radius = parseInt(e.target.value);
    updateRing();
    saveSettingsDebounced();
  });

  // Thickness slider
  document.getElementById('thickness-slider')?.addEventListener('input', (e) => {
    settings.thickness = parseInt(e.target.value);
    updateRing();
    saveSettingsDebounced();
  });

  // Brightness slider
  document.getElementById('brightness-slider')?.addEventListener('input', (e) => {
    settings.brightness = parseInt(e.target.value);
    updateRing();
    saveSettingsDebounced();
  });

  // Blur slider
  document.getElementById('blur-slider')?.addEventListener('input', (e) => {
    settings.blur = parseInt(e.target.value);
    updateRing();
    saveSettingsDebounced();
  });

  // Color picker
  document.getElementById('color-picker')?.addEventListener('input', (e) => {
    settings.color = e.target.value;
    updateRing();
    saveSettingsDebounced();
  });

  // Preset colors
  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.color = btn.dataset.color;
      document.getElementById('color-picker').value = settings.color;
      updateRing();
      saveSettingsDebounced();
    });
  });

  // About button
  document.getElementById('about-btn')?.addEventListener('click', () => {
    showAbout = true;
    document.getElementById('about-modal').classList.remove('hidden');
  });

  // Close about modal
  document.getElementById('close-about')?.addEventListener('click', () => {
    showAbout = false;
    document.getElementById('about-modal').classList.add('hidden');
  });

  // Quit button
  document.getElementById('quit-btn')?.addEventListener('click', () => {
    ipcRenderer.send('quitApp');
  });
}

// Update ring visual
function updateRing() {
  const ring = document.getElementById('ring');
  if (!ring) return;

  const opacity = settings.brightness / 100;
  const glowAmount = settings.blur;
  const blurSpread = settings.blur * 0.5;

  ring.style.borderWidth = `${settings.thickness}px`;
  ring.style.borderColor = settings.color;
  ring.style.opacity = opacity;
  ring.style.boxShadow = `0 0 ${glowAmount}px ${blurSpread}px ${settings.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

  // Update slider displays
  document.getElementById('radius-value').textContent = `${settings.radius}%`;
  document.getElementById('thickness-value').textContent = `${settings.thickness}px`;
  document.getElementById('brightness-value').textContent = `${settings.brightness}%`;
  document.getElementById('blur-value').textContent = `${settings.blur}px`;
}

// Debounced save
let saveTimeout = null;
function saveSettingsDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 500);
}

// Save settings
async function saveSettings() {
  try {
    await ipcRenderer.invoke('saveSettings', { settings });
    console.log('[lum-o-ring] Settings saved');
  } catch (error) {
    console.error('[lum-o-ring] Failed to save settings:', error);
  }
}

// Setup window resize handler
function setupResizeHandler() {
  window.addEventListener('resize', () => {
    updateRingSize();
  });
  updateRingSize();
}

// Update ring size based on viewport
function updateRingSize() {
  const ring = document.getElementById('ring');
  if (!ring) return;

  const size = Math.min(window.innerWidth, window.innerHeight) * (settings.radius / 100);
  ring.style.width = `${size}px`;
  ring.style.height = `${size}px`;
}

// Make functions available globally for IPC callbacks
window.lumoring = {
  applySettings,
  updateRing,
  saveSettings
};

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

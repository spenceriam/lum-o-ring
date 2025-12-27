// Lum-o-ring Renderer
// Ring light overlay with transparent background

const { ipcRenderer } = require('electron');

// Ring settings state
let settings = {
  isOn: true,
  size: 45,        // Size percentage of screen (inner + outer radius)
  thickness: 20,   // Pixels (thickness of the ring band)
  brightness: 100, // 0-100
  color: '#fff5cc' // Warm white
};

// Control panel visibility
let showControlPanel = false;

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
    console.log('[lum-o-ring] Using default settings (IPC not ready yet)');
  }

  // Apply settings to UI controls
  syncUIWithSettings();

  // Setup event listeners
  setupEventListeners();

  // Apply settings and update ring
  updateRing();
  updateRingSize();

  console.log('[lum-o-ring] Renderer initialized');
}

// Sync UI controls with settings values
function syncUIWithSettings() {
  const powerToggle = document.getElementById('power-toggle');
  const sizeSlider = document.getElementById('size-slider');
  const sizeValue = document.getElementById('size-value');
  const thicknessSlider = document.getElementById('thickness-slider');
  const thicknessValue = document.getElementById('thickness-value');
  const brightnessSlider = document.getElementById('brightness-slider');
  const brightnessValue = document.getElementById('brightness-value');
  const colorPicker = document.getElementById('color-picker');

  if (powerToggle) powerToggle.checked = settings.isOn;
  if (sizeSlider) sizeSlider.value = settings.size;
  if (sizeValue) sizeValue.textContent = settings.size + '%';
  if (thicknessSlider) thicknessSlider.value = settings.thickness;
  if (thicknessValue) thicknessValue.textContent = settings.thickness + 'px';
  if (brightnessSlider) brightnessSlider.value = settings.brightness;
  if (brightnessValue) brightnessValue.textContent = settings.brightness + '%';
  if (colorPicker) colorPicker.value = settings.color;
}

// Setup all event listeners
function setupEventListeners() {
  console.log('[lum-o-ring] Setting up event listeners...');

  const toggleBtn = document.getElementById('toggle-settings');
  const controlPanel = document.getElementById('control-panel');

  // Toggle control panel
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      console.log('[lum-o-ring] Toggle button clicked');
      e.stopPropagation();
      showControlPanel = !showControlPanel;
      if (controlPanel) {
        controlPanel.classList.toggle('hidden', !showControlPanel);
      }
      toggleBtn.classList.toggle('active', showControlPanel);
      console.log('[lum-o-ring] Panel visible:', showControlPanel);
    });
    console.log('[lum-o-ring] Toggle button listener attached');
  } else {
    console.error('[lum-o-ring] Toggle button not found!');
  }

  // Close control panel button
  const closeBtn = document.getElementById('close-settings');
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      console.log('[lum-o-ring] Close button clicked');
      e.stopPropagation();
      showControlPanel = false;
      controlPanel?.classList.add('hidden');
      toggleBtn?.classList.remove('active');
    });
  }

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    const isControlPanel = e.target.closest('#control-panel');
    const isToggleBtn = e.target.closest('#toggle-settings');

    if (showControlPanel && !isControlPanel && !isToggleBtn) {
      showControlPanel = false;
      controlPanel?.classList.add('hidden');
      toggleBtn?.classList.remove('active');
    }
  });

  // Power toggle
  const powerToggle = document.getElementById('power-toggle');
  if (powerToggle) {
    powerToggle.addEventListener('change', function(e) {
      console.log('[lum-o-ring] Power toggled:', e.target.checked);
      settings.isOn = e.target.checked;
      updateRing();
      saveSettings();
    });
  }

  // Size slider
  const sizeSlider = document.getElementById('size-slider');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', function(e) {
      settings.size = parseInt(e.target.value);
      const sizeValue = document.getElementById('size-value');
      if (sizeValue) sizeValue.textContent = settings.size + '%';
      console.log('[lum-o-ring] Size:', settings.size);
      updateRingSize();
      saveSettingsDebounced();
    });
  }

  // Thickness slider
  const thicknessSlider = document.getElementById('thickness-slider');
  if (thicknessSlider) {
    thicknessSlider.addEventListener('input', function(e) {
      settings.thickness = parseInt(e.target.value);
      const thicknessValue = document.getElementById('thickness-value');
      if (thicknessValue) thicknessValue.textContent = settings.thickness + 'px';
      console.log('[lum-o-ring] Thickness:', settings.thickness);
      updateRing();
      saveSettingsDebounced();
    });
  }

  // Brightness slider
  const brightnessSlider = document.getElementById('brightness-slider');
  if (brightnessSlider) {
    brightnessSlider.addEventListener('input', function(e) {
      settings.brightness = parseInt(e.target.value);
      const brightnessValue = document.getElementById('brightness-value');
      if (brightnessValue) brightnessValue.textContent = settings.brightness + '%';
      console.log('[lum-o-ring] Brightness:', settings.brightness);
      updateRing();
      saveSettingsDebounced();
    });
  }

  // Color picker
  const colorPicker = document.getElementById('color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('input', function(e) {
      settings.color = e.target.value;
      console.log('[lum-o-ring] Color:', settings.color);
      updateRing();
      saveSettingsDebounced();
    });
  }

  // Preset colors
  document.querySelectorAll('.color-preset').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      settings.color = btn.dataset.color;
      if (colorPicker) colorPicker.value = settings.color;
      console.log('[lum-o-ring] Preset color:', settings.color);
      updateRing();
      saveSettingsDebounced();
    });
  });

  // Quit button
  const quitBtn = document.getElementById('quit-btn');
  if (quitBtn) {
    quitBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('[lum-o-ring] Quit clicked');
      ipcRenderer.send('quitApp');
    });
  }

  console.log('[lum-o-ring] Event listeners setup complete');
}

// Update ring visual
function updateRing() {
  const ring = document.getElementById('ring');
  const powerToggle = document.getElementById('power-toggle');

  if (!ring) {
    console.error('[lum-o-ring] Ring element not found!');
    return;
  }

  // Update power toggle state
  if (powerToggle) {
    powerToggle.checked = settings.isOn;
  }

  if (!settings.isOn) {
    ring.style.opacity = '0';
    return;
  }

  const opacity = settings.brightness / 100;

  ring.style.border = settings.thickness + 'px solid ' + settings.color;
  ring.style.opacity = opacity;

  // Glow effect using filter
  const glowAmount = settings.thickness * 2;
  ring.style.filter = 'drop-shadow(0 0 ' + glowAmount + 'px ' + settings.color + ')';
}

// Update ring size based on viewport
function updateRingSize() {
  const ring = document.getElementById('ring');
  if (!ring) return;

  const minDim = Math.min(window.innerWidth, window.innerHeight);
  const size = minDim * (settings.size / 100);
  ring.style.width = size + 'px';
  ring.style.height = size + 'px';
}

// Handle window resize
window.addEventListener('resize', function() {
  updateRingSize();
});

// Debounced save
var saveTimeout = null;
function saveSettingsDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 500);
}

// Save settings
async function saveSettings() {
  try {
    await ipcRenderer.invoke('saveSettings', { settings: settings });
    console.log('[lum-o-ring] Settings saved:', settings);
  } catch (error) {
    console.error('[lum-o-ring] Failed to save settings:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

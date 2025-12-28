// Lum-o-ring Settings Renderer
// Settings window with all controls

(function() {
  'use strict';

  const electronAPI = window.electronAPI;

  // Settings state
  let settings = {
    isOn: true,
    size: 80,
    thickness: 25,
    brightness: 100,
    blur: 40,
    color: '#fff5cc'
  };

  // Initialize the app
  async function init() {
    console.log('[lum-o-ring-settings] Initializing...');

    // Load saved settings
    try {
      const savedSettings = await electronAPI.invoke('loadSettings');
      if (savedSettings) {
        settings = { ...settings, ...savedSettings };
        console.log('[lum-o-ring-settings] Settings loaded:', settings);
      }
    } catch (error) {
      console.log('[lum-o-ring-settings] Using defaults');
    }

    // Apply settings to UI
    syncUIWithSettings();
    setupEventListeners();

    console.log('[lum-o-ring-settings] Ready');
  }

  // Sync UI with settings
  function syncUIWithSettings() {
    const powerToggle = document.getElementById('power-toggle');
    const sizeSlider = document.getElementById('size-slider');
    const sizeValue = document.getElementById('size-value');
    const thicknessSlider = document.getElementById('thickness-slider');
    const thicknessValue = document.getElementById('thickness-value');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessValue = document.getElementById('brightness-value');
    const blurSlider = document.getElementById('blur-slider');
    const blurValue = document.getElementById('blur-value');
    const colorPicker = document.getElementById('color-picker');

    if (powerToggle) powerToggle.checked = settings.isOn;
    if (sizeSlider) sizeSlider.value = settings.size;
    if (sizeValue) sizeValue.textContent = settings.size + '%';
    if (thicknessSlider) thicknessSlider.value = settings.thickness;
    if (thicknessValue) thicknessValue.textContent = settings.thickness + 'px';
    if (brightnessSlider) brightnessSlider.value = settings.brightness;
    if (brightnessValue) brightnessValue.textContent = settings.brightness + '%';
    if (blurSlider) blurSlider.value = settings.blur;
    if (blurValue) blurValue.textContent = settings.blur + 'px';
    if (colorPicker) colorPicker.value = settings.color;
  }

  // Setup event listeners
  function setupEventListeners() {
    console.log('[lum-o-ring-settings] Setting up listeners...');

    // Close button
    const closeBtn = document.getElementById('close-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('[lum-o-ring-settings] Close clicked');
        electronAPI.send('close-settings');
      });
    }

    // Power toggle
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
      powerToggle.addEventListener('change', (e) => {
        settings.isOn = e.target.checked;
        updateRing();
        saveSettings();
      });
    }

    // Size slider
    const sizeSlider = document.getElementById('size-slider');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        settings.size = parseInt(e.target.value);
        const sizeValue = document.getElementById('size-value');
        if (sizeValue) sizeValue.textContent = settings.size + '%';
        updateRing();
        saveSettingsDebounced();
      });
    }

    // Thickness slider
    const thicknessSlider = document.getElementById('thickness-slider');
    if (thicknessSlider) {
      thicknessSlider.addEventListener('input', (e) => {
        settings.thickness = parseInt(e.target.value);
        const thicknessValue = document.getElementById('thickness-value');
        if (thicknessValue) thicknessValue.textContent = settings.thickness + 'px';
        updateRing();
        saveSettingsDebounced();
      });
    }

    // Brightness slider
    const brightnessSlider = document.getElementById('brightness-slider');
    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        settings.brightness = parseInt(e.target.value);
        const brightnessValue = document.getElementById('brightness-value');
        if (brightnessValue) brightnessValue.textContent = settings.brightness + '%';
        updateRing();
        saveSettingsDebounced();
      });
    }

    // Blur slider
    const blurSlider = document.getElementById('blur-slider');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        settings.blur = parseInt(e.target.value);
        const blurValue = document.getElementById('blur-value');
        if (blurValue) blurValue.textContent = settings.blur + 'px';
        updateRing();
        saveSettingsDebounced();
      });
    }

    // Color picker
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        settings.color = e.target.value;
        updateRing();
        saveSettingsDebounced();
      });
    }

    // Preset colors
    document.querySelectorAll('.color-preset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        settings.color = btn.dataset.color;
        if (colorPicker) colorPicker.value = settings.color;
        updateRing();
        saveSettingsDebounced();
      });
    });

    // Quit button
    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        console.log('[lum-o-ring-settings] Quit clicked');
        electronAPI.send('quitApp');
      });
    }

    console.log('[lum-o-ring-settings] Listeners ready');
  }

  // Update ring via IPC
  function updateRing() {
    electronAPI.send('update-ring', settings);
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
      await electronAPI.invoke('saveSettings', { settings });
      console.log('[lum-o-ring-settings] Saved:', settings);
    } catch (error) {
      console.error('[lum-o-ring-settings] Save failed:', error);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

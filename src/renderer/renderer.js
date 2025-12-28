// Lum-o-ring Ring Renderer
// Ring overlay only - receives settings from settings window

(function() {
  'use strict';

  const electronAPI = window.electronAPI;

  // Ring settings state
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
    console.log('[lum-o-ring] Initializing ring renderer...');

    // Load saved settings
    try {
      const savedSettings = await electronAPI.invoke('loadSettings');
      if (savedSettings) {
        settings = { ...settings, ...savedSettings };
        console.log('[lum-o-ring] Settings loaded:', settings);
      }
    } catch (error) {
      console.log('[lum-o-ring] Using default settings');
    }

    // Listen for settings updates from settings window
    electronAPI.on('ring-settings-updated', (newSettings) => {
      settings = { ...settings, ...newSettings };
      console.log('[lum-o-ring] Settings updated:', JSON.stringify(settings));
      console.log('[lum-o-ring] Applying: brightness=' + settings.brightness + ', thickness=' + settings.thickness + ', blur=' + settings.blur + ', color=' + settings.color + ', size=' + settings.size + ', isOn=' + settings.isOn);
      updateRing();
      updateRingSize();
      console.log('[lum-o-ring] Ring updated');
    });

    // Apply settings and update ring
    updateRing();
    updateRingSize();

    console.log('[lum-o-ring] Ring renderer initialized');
  }

  // Update ring visual
  function updateRing() {
    const ring = document.getElementById('ring');

    if (!ring) {
      console.error('[lum-o-ring] Ring element not found!');
      return;
    }

    if (!settings.isOn) {
      ring.style.opacity = '0';
      // Force repaint
      void ring.offsetHeight;
      return;
    }

    const opacity = settings.brightness / 100;

    ring.style.border = settings.thickness + 'px solid ' + settings.color;
    ring.style.opacity = opacity;

    // Glow effect using blur setting
    ring.style.filter = settings.blur > 0 ? 'drop-shadow(0 0 ' + settings.blur + 'px ' + settings.color + ')' : 'none';

    // Force repaint to ensure visual update
    void ring.offsetHeight;
  }

  // Update ring size based on percentage of screen
  function updateRingSize() {
    const ring = document.getElementById('ring');
    if (!ring) return;

    // Use settings.size percentage - set as CSS percentage
    ring.style.width = settings.size + '%';
    ring.style.height = settings.size + '%';
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    updateRingSize();
  });

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

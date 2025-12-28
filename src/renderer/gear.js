// Lum-o-ring Gear Icon Renderer
// Separate window that receives mouse events normally

(function() {
  'use strict';

  const electronAPI = window.electronAPI;

  // Initialize
  function init() {
    console.log('[lum-o-ring-gear] Initializing gear icon window...');

    const gearIcon = document.getElementById('gear-icon');
    if (gearIcon) {
      // Right-click shows context menu with Settings and Quit options
      gearIcon.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[lum-o-ring-gear] Right-click - showing context menu');
        electronAPI.showContextMenu();
      });

      console.log('[lum-o-ring-gear] Gear icon listeners attached');
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

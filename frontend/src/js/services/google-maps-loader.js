// google-maps-loader.js - Robust async Google Maps loader with retry and error handling

const LOADER_CONFIG = {
  scriptId: 'maps-loader',
  maxRetries: 3,
  retryDelay: 2000,
  loadTimeout: 30000,
  requiredLibraries: ['maps', 'marker']
};

let loadPromise = null;
let loadAttempts = 0;

/**
 * Load Google Maps API with robust error handling and retry logic
 * @returns {Promise<typeof google.maps>} Google Maps API
 */
export async function loadGoogleMaps() {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = attemptLoad();
  return loadPromise;
}

async function attemptLoad() {
  try {
    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      console.log('[GoogleMapsLoader] Maps already loaded');
      return window.google.maps;
    }

    // Check for existing script tag
    const existingScript = document.getElementById(LOADER_CONFIG.scriptId);
    if (!existingScript) {
      throw new Error('Maps loader script not found in DOM. Ensure index.html includes the maps-loader script.');
    }

    // Wait for script to load with timeout
    await waitForMapsLoad();
    
    // Verify all required libraries are loaded
    await verifyLibraries();
    
    console.log('[GoogleMapsLoader] Maps loaded successfully');
    return window.google.maps;
    
  } catch (error) {
    loadAttempts++;
    
    if (loadAttempts < LOADER_CONFIG.maxRetries) {
      console.warn(`[GoogleMapsLoader] Load failed, retrying (${loadAttempts}/${LOADER_CONFIG.maxRetries})...`, error);
      await delay(LOADER_CONFIG.retryDelay);
      loadPromise = null; // Reset promise for retry
      return attemptLoad();
    }
    
    console.error('[GoogleMapsLoader] Failed to load Google Maps after retries', error);
    loadPromise = null;
    throw error;
  }
}

function isGoogleMapsLoaded() {
  return !!(
    window.google &&
    window.google.maps &&
    window.google.maps.Map &&
    window.google.maps.importLibrary
  );
}

async function waitForMapsLoad() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      if (isGoogleMapsLoaded()) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > LOADER_CONFIG.loadTimeout) {
        clearInterval(checkInterval);
        reject(new Error(`Maps load timeout after ${LOADER_CONFIG.loadTimeout}ms`));
      }
    }, 100);
  });
}

async function verifyLibraries() {
  try {
    // Import required libraries
    for (const lib of LOADER_CONFIG.requiredLibraries) {
      await google.maps.importLibrary(lib);
    }
  } catch (error) {
    throw new Error(`Failed to import required libraries: ${error.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Maps API status
 * @returns {object} Status information
 */
export function getMapsStatus() {
  return {
    loaded: isGoogleMapsLoaded(),
    scriptPresent: !!document.getElementById(LOADER_CONFIG.scriptId),
    loadAttempts,
    libraries: isGoogleMapsLoaded() ? Object.keys(google.maps) : []
  };
}

/**
 * Reset loader state (mainly for testing)
 */
export function resetLoader() {
  loadPromise = null;
  loadAttempts = 0;
}
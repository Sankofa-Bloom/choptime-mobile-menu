/**
 * PWA Debug utilities to help troubleshoot PWA installation issues
 */

export const checkPWAInstallability = () => {
  const results = {
    isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    hasManifest: !!document.querySelector('link[rel="manifest"]'),
    hasServiceWorker: 'serviceWorker' in navigator,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    userAgent: navigator.userAgent,
    manifestLink: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    installedState: {
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      webView: (navigator as { standalone?: boolean }).standalone === true,
      localStorage: localStorage.getItem('pwa-prompt-dismissed')
    }
  };

  console.log('PWA Installability Check:', results);
  return results;
};

export const testManifestFetch = async () => {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    if (!manifestLink) {
      console.error('No manifest link found');
      return null;
    }

    const response = await fetch(manifestLink);
    if (!response.ok) {
      console.error('Failed to fetch manifest:', response.status, response.statusText);
      return null;
    }

    const manifest = await response.json();
    console.log('Manifest content:', manifest);
    return manifest;
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return null;
  }
};

export const debugPWAInstallPrompt = () => {
  let hasPromptFired = false;
  
  const beforeInstallPromptHandler = (e: Event) => {
    hasPromptFired = true;
    console.log('✅ beforeinstallprompt event fired!', e);
  };

  const appInstalledHandler = () => {
    console.log('✅ App was installed!');
  };

  window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
  window.addEventListener('appinstalled', appInstalledHandler);

  // Check after 5 seconds if the prompt has fired
  setTimeout(() => {
    if (!hasPromptFired) {
      console.log('❌ beforeinstallprompt event has not fired yet. Checking requirements...');
      checkPWAInstallability();
      testManifestFetch();
    }
  }, 5000);

  return () => {
    window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.removeEventListener('appinstalled', appInstalledHandler);
  };
};

// Add to window for easy debugging in console
if (typeof window !== 'undefined') {
  (window as Window & { pwaDebug?: typeof debugPWAInstallPrompt }).pwaDebug = {
    checkPWAInstallability,
    testManifestFetch,
    debugPWAInstallPrompt
  };
}

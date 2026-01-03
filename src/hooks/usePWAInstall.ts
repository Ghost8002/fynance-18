import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (Android + iOS)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Debug: helps us understand why install isn't available on some Android devices
    console.log('[PWA] init', {
      ua: navigator.userAgent,
      isStandalone,
      hasSW: 'serviceWorker' in navigator,
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If SW is ready but beforeinstallprompt doesn't fire (Chrome heuristics), we still allow showing guidance UI.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => console.log('[PWA] service worker ready'))
        .catch((err) => console.log('[PWA] service worker not ready', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      return false;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
    
    return outcome === 'accepted';
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  return {
    isInstallable,
    isInstalled,
    isIOS: isIOS(),
    promptInstall
  };
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DonezyLogo from '@/components/DonezyLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already running as PWA (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Don't show if user previously dismissed (remember for this session)
    const sessionDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (sessionDismissed) return;

    // Listen for the browser's install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so page loads first
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS Safari (no beforeinstallprompt), show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isIOS && isMobile && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Android: trigger native install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
    // iOS: the prompt already shows instructions
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-72"
        >
          <div className="glass-intense rounded-2xl border border-white/10 p-5 shadow-2xl shadow-black/40">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-3 mb-4">
              <DonezyLogo className="h-10 w-auto" />
              <div>
                <h3 className="font-heading font-bold text-text-primary text-sm">
                  Telepítsd a Donezy-t!
                </h3>
                <p className="text-xs text-text-muted">
                  Gyorsabb, kényelmesebb élmény
                </p>
              </div>
            </div>

            {/* Benefits */}
            <ul className="text-xs text-text-secondary space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                Saját ikon a kezdőképernyőn
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                Teljes képernyős alkalmazás
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                Gyorsabb betöltés
              </li>
            </ul>

            {isIOS && !deferredPrompt ? (
              /* iOS: manual instructions */
              <div className="bg-surface-1/50 rounded-lg p-3 text-xs text-text-secondary">
                <p className="font-medium text-text-primary mb-1">iOS telepítés:</p>
                <p>
                  Nyomd meg a <strong className="text-primary">Megosztás</strong> gombot
                  {' '}(□↑) alul, majd válaszd a{' '}
                  <strong className="text-primary">"Hozzáadás a Kezdőképernyőhöz"</strong> opciót.
                </p>
              </div>
            ) : (
              /* Android/Chrome: install button */
              <Button
                onClick={handleInstall}
                className="w-full bg-primary hover:bg-primary/90 text-surface-0 text-sm"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Telepítés
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-50 bg-card border border-border rounded-2xl shadow-2xl p-4"
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <img src="/logo-192.png" alt="Logo Pemuda Persis" className="w-14 h-14 rounded-xl" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm">Pemuda Persis Cibatu</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Install aplikasi untuk akses lebih cepat</p>
            </div>
          </div>
          <Button onClick={handleInstall} className="w-full mt-3 gap-2" size="sm">
            <Download size={16} />
            Install Aplikasi
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

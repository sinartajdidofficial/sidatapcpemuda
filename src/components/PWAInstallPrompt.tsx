import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const location = useLocation();
  const isViewMode = location.pathname.startsWith('/view');
  const storageKey = isViewMode ? 'pwa-dismissed-view' : 'pwa-dismissed-admin';

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [storageKey]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(storageKey, 'true');
  };

  const appName = isViewMode ? 'Pemuda Persis Cibatu' : 'Pemuda Persis Cibatu - Admin';
  const appDesc = isViewMode ? 'Install untuk akses data lebih cepat' : 'Install panel admin untuk akses cepat';

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
              <h3 className="font-bold text-foreground text-sm">{appName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{appDesc}</p>
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

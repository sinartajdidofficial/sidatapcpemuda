import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mail, Wallet, ClipboardList, Database, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/surat', icon: Mail, label: 'Surat' },
  { to: '/keuangan', icon: Wallet, label: 'Keuangan' },
  { to: '/proker', icon: ClipboardList, label: 'Proker' },
  { to: '/data-pc', icon: Database, label: 'Data PC' },
];

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  backTo?: string;
}

export default function AppLayout({ children, title = 'Dashboard', backTo }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const readOnly = useReadOnly();
  const prefix = readOnly ? '/view' : '';

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <header className="app-header">
        <div className="flex items-center gap-2">
          {backTo && (
            <button onClick={() => navigate(backTo)} className="p-1 -ml-1 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            <p className="text-xs opacity-80">PC Pemuda Persis Cibatu</p>
          </div>
        </div>
      </header>

      <main className="page-content">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="bottom-nav max-w-lg mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const to = `${prefix}${item.to}`;
            const basePath = `${prefix}${item.to}`;
            const isActive = location.pathname === to || (item.to !== '/' && location.pathname.startsWith(basePath));
            return (
              <NavLink
                key={item.to}
                to={to}
                className="flex flex-col items-center gap-0.5 px-2 py-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-2 w-8 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={20}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
                <span
                  className={`text-[9px] font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, Wallet, ClipboardList, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/surat', icon: Mail, label: 'Surat' },
  { to: '/keuangan', icon: Wallet, label: 'Keuangan' },
  { to: '/proker', icon: ClipboardList, label: 'Proker' },
  { to: '/data-pc', icon: Database, label: 'Data PC' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'Dashboard' }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <header className="app-header">
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <p className="text-xs opacity-80">PC Pemuda Persis Cibatu</p>
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
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
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

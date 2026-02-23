import { Link } from 'react-router-dom';
import { Users, UserCheck, Building2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { motion } from 'framer-motion';

const menuItems = [
  { to: '/data-pc/pengurus', icon: UserCheck, label: 'Data Pengurus', desc: 'Kelola data pengurus organisasi' },
  { to: '/data-pc/anggota', icon: Users, label: 'Data Anggota', desc: 'Kelola data anggota organisasi' },
  { to: '/data-pc/pj', icon: Building2, label: 'Data PJ', desc: 'Kelola data Pimpinan Jamaah' },
];

export default function DataPCPage() {
  return (
    <AppLayout title="Data PC">
      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25 }}
          >
            <Link to={item.to} className="stat-card flex items-center gap-4 active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <item.icon size={24} />
              </div>
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}

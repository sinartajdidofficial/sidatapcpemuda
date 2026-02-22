import { Mail, MailOpen, Wallet, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Surat, Keuangan, ProgramKerja, BidangGarapan } from '@/types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const statVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export default function Dashboard() {
  const [suratList] = useLocalStorage<Surat[]>('surat', []);
  const [keuanganList] = useLocalStorage<Keuangan[]>('keuangan', []);
  const [prokerList] = useLocalStorage<ProgramKerja[]>('proker', []);

  const suratMasuk = suratList.filter((s) => s.jenis === 'masuk').length;
  const suratKeluar = suratList.filter((s) => s.jenis === 'keluar').length;

  const totalMasuk = keuanganList
    .filter((k) => k.jenis === 'masuk')
    .reduce((s, k) => s + k.nominal, 0);
  const totalKeluar = keuanganList
    .filter((k) => k.jenis === 'keluar')
    .reduce((s, k) => s + k.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  const prokerTerlaksana = prokerList.filter((p) => p.realisasi === 'Terlaksana').length;

  const bidangList: BidangGarapan[] = [
    'Pendidikan', 'Dakwah', 'Kaderisasi', "Jam'iyyah",
    'Infokom', 'Ekonomi Sosial', 'Seni & Olahraga', 'HLO',
  ];

  const prokerByBidang = bidangList
    .map((bidang) => ({
      bidang,
      items: prokerList.filter((p) => p.bidang === bidang),
    }))
    .filter((g) => g.items.length > 0);

  const stats = [
    {
      label: 'Surat Masuk',
      value: suratMasuk,
      icon: MailOpen,
      color: 'bg-info text-info-foreground',
    },
    {
      label: 'Surat Keluar',
      value: suratKeluar,
      icon: Mail,
      color: 'bg-warning text-warning-foreground',
    },
    {
      label: 'Saldo Keuangan',
      value: `Rp ${saldo.toLocaleString('id-ID')}`,
      icon: Wallet,
      color: 'bg-success text-success-foreground',
    },
    {
      label: 'Proker Terlaksana',
      value: `${prokerTerlaksana}/${prokerList.length}`,
      icon: CheckCircle,
      color: 'bg-primary text-primary-foreground',
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-card flex flex-col gap-3"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={statVariant}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
          Ringkasan Keuangan
        </h2>
        <div className="stat-card space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Pemasukan</span>
            <span className="font-semibold text-success">Rp {totalMasuk.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Pengeluaran</span>
            <span className="font-semibold text-destructive">Rp {totalKeluar.toLocaleString('id-ID')}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm font-bold">
            <span>Sisa Saldo</span>
            <span className="text-primary">Rp {saldo.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
          Realisasi Program Kerja
        </h2>
        <div className="stat-card">
          {prokerByBidang.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada program kerja</p>
          ) : (
            <>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Total Terlaksana</span>
                <span className="font-semibold">{prokerTerlaksana}/{prokerList.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{ width: `${prokerList.length > 0 ? (prokerTerlaksana / prokerList.length) * 100 : 0}%` }}
                />
              </div>
              <Accordion type="multiple" className="w-full">
                {prokerByBidang.map((group) => (
                  <AccordionItem key={group.bidang} value={group.bidang}>
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{group.bidang}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.items.filter(p => p.realisasi === 'Terlaksana').length}/{group.items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-auto -mx-1">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs px-2">No</TableHead>
                              <TableHead className="text-xs px-2">Program</TableHead>
                              <TableHead className="text-xs px-2">Waktu</TableHead>
                              <TableHead className="text-xs px-2">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.items.map((p, idx) => (
                              <TableRow key={p.id}>
                                <TableCell className="text-xs px-2 py-1.5">{idx + 1}</TableCell>
                                <TableCell className="text-xs px-2 py-1.5 font-medium">{p.nama}</TableCell>
                                <TableCell className="text-xs px-2 py-1.5">{p.waktuPelaksanaan}</TableCell>
                                <TableCell className="text-xs px-2 py-1.5">
                                  <Badge variant={p.realisasi === 'Terlaksana' ? 'default' : 'outline'} className="text-[10px]">
                                    {p.realisasi}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

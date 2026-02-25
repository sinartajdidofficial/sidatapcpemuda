import { useState } from 'react';
import { Plus, Trash2, Edit, UserCheck, Loader2, ArrowLeft, Phone, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BidangGarapan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

const bidangUtamaOptions = ['Penasehat', 'Ketua Umum', 'Wakil Ketua', 'Sekretaris', 'Bendahara'] as const;
type BidangUtama = typeof bidangUtamaOptions[number] | '';

const bidangOptions: BidangGarapan[] = [
  'Pendidikan', 'Dakwah', 'Kaderisasi', "Jam'iyyah", 'Infokom', 'Ekonomi Sosial', 'Seni & Olahraga', 'HLO',
];

const bidangColors: Record<string, string> = {
  'Pimpinan': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
  'Penasehat': 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
  'Ketua Umum': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
  'Wakil Ketua': 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300',
  'Sekretaris': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
  'Bendahara': 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300',
  'Pendidikan': 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
  'Dakwah': 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
  'Kaderisasi': 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
  "Jam'iyyah": 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
  'Infokom': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
  'Ekonomi Sosial': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
  'Seni & Olahraga': 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300',
  'HLO': 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
};

interface Form {
  nama: string; bidang: string; bidang_utama: BidangUtama; tempat_lahir: string; tanggal_lahir: string;
  alamat: string; pendidikan_terakhir: string; no_whatsapp: string;
}
const emptyForm: Form = { nama: '', bidang: 'Pendidikan', bidang_utama: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', pendidikan_terakhir: '', no_whatsapp: '' };

const pimpinanRoles = ['Ketua Umum', 'Wakil Ketua', 'Sekretaris', 'Bendahara'];
const chartSections = ['Penasehat', 'Pimpinan', ...bidangOptions] as const;

export default function PengurusPage() {
  const readOnly = useReadOnly();
  const prefix = readOnly ? '/view' : '';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['pengurus'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pengurus').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nama: form.nama, bidang: form.bidang_utama ? form.bidang_utama : form.bidang,
        bidang_utama: form.bidang_utama, tempat_lahir: form.tempat_lahir, tanggal_lahir: form.tanggal_lahir,
        alamat: form.alamat, pendidikan_terakhir: form.pendidikan_terakhir, no_whatsapp: form.no_whatsapp,
      };
      if (editId) {
        const { error } = await supabase.from('pengurus').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pengurus').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pengurus'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('pengurus').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pengurus'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: typeof list[0]) {
    setEditId(item.id);
    const bu = (item as any).bidang_utama || '';
    setForm({ nama: item.nama, bidang: bu ? bu : item.bidang, bidang_utama: bu, tempat_lahir: item.tempat_lahir, tanggal_lahir: item.tanggal_lahir, alamat: item.alamat, pendidikan_terakhir: item.pendidikan_terakhir, no_whatsapp: item.no_whatsapp });
    setOpen(true);
  }
  function handleSave() { if (!form.nama) return; saveMutation.mutate(); }

  function getChartSection(item: typeof list[0]): string {
    const bu = (item as any).bidang_utama;
    if (!bu) return item.bidang;
    if (pimpinanRoles.includes(bu)) return 'Pimpinan';
    return bu;
  }

  const grouped = chartSections
    .map((section) => ({ section, members: list.filter((p) => getChartSection(p) === section) }))
    .filter((g) => g.members.length > 0);

  grouped.forEach((g) => {
    if (g.section === 'Pimpinan') {
      g.members.sort((a, b) => {
        const aIdx = pimpinanRoles.indexOf((a as any).bidang_utama || '');
        const bIdx = pimpinanRoles.indexOf((b as any).bidang_utama || '');
        return aIdx - bIdx;
      });
    }
  });

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama', 'Bidang Utama', 'Bidang Garapan', 'Tempat Lahir', 'Tgl Lahir', 'Alamat', 'Pendidikan', 'No. WA'];
    const rows = list.map((item, i) => [
      String(i + 1), item.nama, (item as any).bidang_utama || '-', item.bidang,
      item.tempat_lahir, item.tanggal_lahir, item.alamat, item.pendidikan_terakhir, item.no_whatsapp,
    ]);
    if (type === 'pdf') exportToPdf('Data Pengurus', headers, rows);
    else exportToExcel('Data Pengurus', headers, rows);
  }

  return (
    <AppLayout title="Data Pengurus">
      <div className="flex items-center justify-between mb-4">
        <Link to={`${prefix}/data-pc`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Kembali
        </Link>
        {list.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><FileDown size={14} className="mr-1" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>Export PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>Export Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />Belum ada data pengurus
        </div>
      ) : (
        <div className="space-y-6">
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Total Pengurus</p>
            <p className="text-2xl font-bold">{list.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{grouped.length} Bidang</p>
          </div>

          {grouped.map((group, gi) => (
            <motion.div key={group.section} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-3 w-3 rounded-full ${bidangColors[group.section]?.split(' ')[0] || 'bg-primary'}`} />
                <h3 className="text-sm font-bold">{group.section}</h3>
                <Badge variant="secondary" className="text-[10px]">{group.members.length}</Badge>
              </div>
              <div className="relative ml-1.5 border-l-2 border-border pl-5 space-y-3 pb-2">
                {group.members.map((item, idx) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.08 + idx * 0.05 }}
                    className={`relative rounded-xl border p-3 ${bidangColors[group.section] || 'border-border'}`}>
                    <div className="absolute -left-5 top-5 w-5 border-t-2 border-border" />
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{item.nama}</p>
                          {group.section === 'Pimpinan' && (item as any).bidang_utama && (
                            <Badge variant="outline" className="text-[10px] shrink-0">{(item as any).bidang_utama}</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.tempat_lahir}{item.tanggal_lahir ? `, ${item.tanggal_lahir}` : ''}</p>
                        {item.pendidikan_terakhir && <p className="text-[11px] text-muted-foreground">📚 {item.pendidikan_terakhir}</p>}
                        {item.no_whatsapp && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone size={10} /> {item.no_whatsapp}</p>}
                      </div>
                      {!readOnly && (
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Edit size={13} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 size={13} /></Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
              <DialogHeader><DialogTitle>{editId ? 'Edit Pengurus' : 'Tambah Pengurus'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Nama Pengurus</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
                <div>
                  <Label>Bidang Utama</Label>
                  <Select value={form.bidang_utama || '_none'} onValueChange={(v) => setForm({ ...form, bidang_utama: v === '_none' ? '' : v as BidangUtama })}>
                    <SelectTrigger><SelectValue placeholder="Tidak ada (pilih Bidang Garapan)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Tidak ada</SelectItem>
                      {bidangUtamaOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!form.bidang_utama && (
                  <div>
                    <Label>Bidang Garapan</Label>
                    <Select value={form.bidang} onValueChange={(v) => setForm({ ...form, bidang: v as BidangGarapan })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{bidangOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Tempat Lahir</Label><Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} /></div>
                <div><Label>Tanggal Lahir</Label><Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} /></div>
                <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
                <div>
                  <Label>Pendidikan Terakhir</Label>
                  <Select value={form.pendidikan_terakhir || '_none'} onValueChange={(v) => setForm({ ...form, pendidikan_terakhir: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Pendidikan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Pilih —</SelectItem>
                      {['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'S1', 'S2', 'S3'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>No. WhatsApp</Label><Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
                  {editId ? 'Simpan Perubahan' : 'Tambah Pengurus'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppLayout>
  );
}

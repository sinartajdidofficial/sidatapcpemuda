import { useState } from 'react';
import { Plus, FileDown, Trash2, Edit, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface KeuanganForm {
  jenis: 'masuk' | 'keluar';
  namaKegiatan: string;
  waktu: string;
  nominal: number;
  keterangan: string;
}

const emptyForm: KeuanganForm = { jenis: 'masuk', namaKegiatan: '', waktu: '', nominal: 0, keterangan: '' };

export default function KeuanganPage() {
  const readOnly = useReadOnly();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<KeuanganForm>(emptyForm);
  const [filter, setFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['keuangan'],
    queryFn: async () => {
      const { data, error } = await supabase.from('keuangan').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((r) => ({
        id: r.id, jenis: r.jenis as 'masuk' | 'keluar', namaKegiatan: r.nama_kegiatan,
        waktu: r.waktu, nominal: Number(r.nominal), keterangan: r.keterangan,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const row = { jenis: form.jenis, nama_kegiatan: form.namaKegiatan, waktu: form.waktu, nominal: form.nominal, keterangan: form.keterangan };
      if (editId) {
        const { error } = await supabase.from('keuangan').update(row).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('keuangan').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['keuangan'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('keuangan').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['keuangan'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = filter === 'semua' ? list : list.filter((k) => k.jenis === filter);

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: typeof list[0]) {
    setEditId(item.id);
    setForm({ jenis: item.jenis, namaKegiatan: item.namaKegiatan, waktu: item.waktu, nominal: item.nominal, keterangan: item.keterangan });
    setOpen(true);
  }
  function handleSave() { if (!form.namaKegiatan || !form.nominal) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Jenis', 'Nama Kegiatan', 'Waktu', 'Nominal', 'Keterangan'];
    const rows = filtered.map((k, i) => [
      String(i + 1), k.jenis === 'masuk' ? 'Masuk' : 'Keluar', k.namaKegiatan, k.waktu, `Rp ${k.nominal.toLocaleString('id-ID')}`, k.keterangan,
    ]);
    const title = 'Data Keuangan - PC Pemuda Persis Cibatu';
    type === 'pdf' ? exportToPdf(title, headers, rows) : exportToExcel(title, headers, rows);
  }

  return (
    <AppLayout title="Master Keuangan">
      <div className="flex items-center justify-between mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="h-9">
            <TabsTrigger value="semua" className="text-xs px-3">Semua</TabsTrigger>
            <TabsTrigger value="masuk" className="text-xs px-3">Masuk</TabsTrigger>
            <TabsTrigger value="keluar" className="text-xs px-3">Keluar</TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><FileDown size={16} className="mr-1" /> Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>Export PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>Export Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Wallet size={48} className="mx-auto mb-3 opacity-30" />
          Belum ada data keuangan
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.jenis === 'masuk' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                    {item.jenis === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.namaKegiatan}</p>
                    <p className={`text-sm font-bold ${item.jenis === 'masuk' ? 'text-success' : 'text-destructive'}`}>
                      {item.jenis === 'masuk' ? '+' : '-'} Rp {item.nominal.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{item.waktu}</p>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 size={14} /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
              <DialogHeader><DialogTitle>{editId ? 'Edit Keuangan' : 'Tambah Keuangan'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Jenis</Label>
                  <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v as 'masuk' | 'keluar' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masuk">Pemasukan</SelectItem>
                      <SelectItem value="keluar">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Nama Kegiatan</Label><Input value={form.namaKegiatan} onChange={(e) => setForm({ ...form, namaKegiatan: e.target.value })} /></div>
                <div><Label>Waktu</Label><Input type="date" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} /></div>
                <div><Label>Nominal (Rp)</Label><Input type="number" value={form.nominal || ''} onChange={(e) => setForm({ ...form, nominal: Number(e.target.value) })} /></div>
                <div><Label>Keterangan</Label><Textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {editId ? 'Simpan Perubahan' : 'Tambah Data'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppLayout>
  );
}

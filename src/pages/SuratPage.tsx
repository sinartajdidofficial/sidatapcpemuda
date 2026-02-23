import { useState } from 'react';
import { Plus, FileDown, Trash2, Edit, Mail, MailOpen, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SuratForm {
  jenis: 'masuk' | 'keluar';
  nama: string;
  nomor: string;
  waktu: string;
  pengirim: string;
  penerima: string;
  keterangan: string;
}

const emptyForm: SuratForm = { jenis: 'masuk', nama: '', nomor: '', waktu: '', pengirim: '', penerima: '', keterangan: '' };

export default function SuratPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratForm>(emptyForm);
  const [filter, setFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  const { data: suratList = [], isLoading } = useQuery({
    queryKey: ['surat'],
    queryFn: async () => {
      const { data, error } = await supabase.from('surat').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((r) => ({
        id: r.id, jenis: r.jenis as 'masuk' | 'keluar', nama: r.nama, nomor: r.nomor,
        waktu: r.waktu, pengirim: r.pengirim, penerima: r.penerima, keterangan: r.keterangan,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const row = { jenis: form.jenis, nama: form.nama, nomor: form.nomor, waktu: form.waktu, pengirim: form.pengirim, penerima: form.penerima, keterangan: form.keterangan };
      if (editId) {
        const { error } = await supabase.from('surat').update(row).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('surat').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['surat'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('surat').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['surat'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = filter === 'semua' ? suratList : suratList.filter((s) => s.jenis === filter);

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(surat: typeof suratList[0]) {
    setEditId(surat.id);
    setForm({ jenis: surat.jenis, nama: surat.nama, nomor: surat.nomor, waktu: surat.waktu, pengirim: surat.pengirim, penerima: surat.penerima, keterangan: surat.keterangan });
    setOpen(true);
  }
  function handleSave() { if (!form.nama || !form.nomor) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Jenis', 'Nama Surat', 'Nomor', 'Waktu', 'Pengirim', 'Penerima', 'Keterangan'];
    const rows = filtered.map((s, i) => [
      String(i + 1), s.jenis === 'masuk' ? 'Masuk' : 'Keluar', s.nama, s.nomor, s.waktu, s.pengirim, s.penerima, s.keterangan,
    ]);
    const title = 'Data Surat - PC Pemuda Persis Cibatu';
    type === 'pdf' ? exportToPdf(title, headers, rows) : exportToExcel(title, headers, rows);
  }

  return (
    <AppLayout title="Master Surat">
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
          <Mail size={48} className="mx-auto mb-3 opacity-30" />
          Belum ada data surat
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((surat) => (
            <div key={surat.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${surat.jenis === 'masuk' ? 'bg-info text-info-foreground' : 'bg-warning text-warning-foreground'}`}>
                    {surat.jenis === 'masuk' ? <MailOpen size={18} /> : <Mail size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{surat.nama}</p>
                    <p className="text-xs text-muted-foreground">{surat.nomor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{surat.waktu}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(surat)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(surat.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Edit Surat' : 'Tambah Surat'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Jenis Surat</Label>
              <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v as 'masuk' | 'keluar' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masuk">Surat Masuk</SelectItem>
                  <SelectItem value="keluar">Surat Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nama Surat</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            <div><Label>Nomor Surat</Label><Input value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} /></div>
            <div><Label>Waktu Surat</Label><Input type="date" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} /></div>
            <div><Label>Pengirim</Label><Input value={form.pengirim} onChange={(e) => setForm({ ...form, pengirim: e.target.value })} /></div>
            <div><Label>Penerima</Label><Input value={form.penerima} onChange={(e) => setForm({ ...form, penerima: e.target.value })} /></div>
            <div><Label>Keterangan</Label><Textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {editId ? 'Simpan Perubahan' : 'Tambah Surat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

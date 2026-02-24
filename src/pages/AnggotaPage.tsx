import { useState } from 'react';
import { Plus, Trash2, Edit, Users, Loader2, ArrowLeft, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';

interface Form {
  nama: string; tempat_lahir: string; tanggal_lahir: string;
  alamat: string; pendidikan_terakhir: string; no_whatsapp: string; tahun_masuk: string;
}
const emptyForm: Form = { nama: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', pendidikan_terakhir: '', no_whatsapp: '', tahun_masuk: '' };

export default function AnggotaPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['anggota'],
    queryFn: async () => {
      const { data, error } = await supabase.from('anggota').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from('anggota').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('anggota').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anggota'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('anggota').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anggota'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: typeof list[0]) {
    setEditId(item.id);
    setForm({
      nama: item.nama, tempat_lahir: item.tempat_lahir, tanggal_lahir: item.tanggal_lahir,
      alamat: item.alamat, pendidikan_terakhir: item.pendidikan_terakhir, no_whatsapp: item.no_whatsapp,
      tahun_masuk: (item as any).tahun_masuk || '',
    });
    setOpen(true);
  }
  function handleSave() { if (!form.nama) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama', 'Tahun Masuk', 'Tempat Lahir', 'Tgl Lahir', 'Alamat', 'Pendidikan', 'No. WA'];
    const rows = list.map((item, i) => [
      String(i + 1), item.nama, (item as any).tahun_masuk || '-',
      item.tempat_lahir, item.tanggal_lahir, item.alamat, item.pendidikan_terakhir, item.no_whatsapp,
    ]);
    if (type === 'pdf') exportToPdf('Data Anggota', headers, rows);
    else exportToExcel('Data Anggota', headers, rows);
  }

  return (
    <AppLayout title="Data Anggota">
      <div className="flex items-center justify-between mb-4">
        <Link to="/data-pc" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
          <Users size={48} className="mx-auto mb-3 opacity-30" />Belum ada data anggota
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.nama}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.tempat_lahir}{item.tanggal_lahir ? `, ${item.tanggal_lahir}` : ''}</p>
                  {(item as any).tahun_masuk && <p className="text-xs text-muted-foreground">Tahun Masuk: {(item as any).tahun_masuk}</p>}
                  {item.no_whatsapp && <p className="text-xs text-muted-foreground">WA: {item.no_whatsapp}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nama Anggota</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            <div><Label>Tahun Masuk</Label><Input placeholder="cth: 2024" value={form.tahun_masuk} onChange={(e) => setForm({ ...form, tahun_masuk: e.target.value })} /></div>
            <div><Label>Tempat Lahir</Label><Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} /></div>
            <div><Label>Tanggal Lahir</Label><Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} /></div>
            <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
            <div><Label>Pendidikan Terakhir</Label><Input value={form.pendidikan_terakhir} onChange={(e) => setForm({ ...form, pendidikan_terakhir: e.target.value })} /></div>
            <div><Label>No. WhatsApp</Label><Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
              {editId ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

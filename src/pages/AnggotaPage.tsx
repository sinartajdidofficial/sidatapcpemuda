import { useState } from 'react';
import { Plus, Trash2, Edit, Users, Loader2, ArrowLeft, FileDown, Phone, MapPin, GraduationCap, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface AnggotaItem {
  id: string; nama: string; tempat_lahir: string; tanggal_lahir: string;
  alamat: string; pendidikan_terakhir: string; no_whatsapp: string; tahun_masuk: string;
}

interface Form {
  nama: string; tempat_lahir: string; tanggal_lahir: string;
  alamat: string; pendidikan_terakhir: string; no_whatsapp: string; tahun_masuk: string;
}
const emptyForm: Form = { nama: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', pendidikan_terakhir: '', no_whatsapp: '', tahun_masuk: '' };

export default function AnggotaPage() {
  const readOnly = useReadOnly();
  const prefix = readOnly ? '/view' : '';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [viewItem, setViewItem] = useState<AnggotaItem | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['anggota'],
    queryFn: async () => {
      const { data, error } = await supabase.from('anggota').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as AnggotaItem[];
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
  function openEdit(item: AnggotaItem) {
    setEditId(item.id);
    setForm({ nama: item.nama, tempat_lahir: item.tempat_lahir, tanggal_lahir: item.tanggal_lahir, alamat: item.alamat, pendidikan_terakhir: item.pendidikan_terakhir, no_whatsapp: item.no_whatsapp, tahun_masuk: item.tahun_masuk || '' });
    setOpen(true);
  }
  function handleSave() { if (!form.nama) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama', 'Tahun Masuk', 'Tempat Lahir', 'Tgl Lahir', 'Alamat', 'Pendidikan', 'No. WA'];
    const rows = list.map((item, i) => [
      String(i + 1), item.nama, item.tahun_masuk || '-',
      item.tempat_lahir, item.tanggal_lahir, item.alamat, item.pendidikan_terakhir, item.no_whatsapp,
    ]);
    if (type === 'pdf') exportToPdf('Data Anggota', headers, rows);
    else exportToExcel('Data Anggota', headers, rows);
  }

  return (
    <AppLayout title="Data Anggota">
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
          <Users size={48} className="mx-auto mb-3 opacity-30" />Belum ada data anggota
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div
              key={item.id}
              className="stat-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              onClick={() => setViewItem(item)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                  {item.nama.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.nama}</p>
                  {item.tahun_masuk && (
                    <Badge variant="outline" className="text-[10px] mt-1 border-primary/30 text-primary">Masuk {item.tahun_masuk}</Badge>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={11} className="text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{item.tempat_lahir || '-'}</p>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Edit size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}><Trash2 size={13} /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {viewItem?.nama.charAt(0).toUpperCase()}
              </div>
              Detail Anggota
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 mt-1">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <DetailRow label="Nama" value={viewItem.nama} />
                <DetailRow label="Tahun Masuk" value={viewItem.tahun_masuk} />
                <DetailRow label="Tempat Lahir" value={viewItem.tempat_lahir} />
                <DetailRow label="Tanggal Lahir" value={viewItem.tanggal_lahir} />
                <DetailRow label="Alamat" value={viewItem.alamat} />
                <DetailRow label="Pendidikan Terakhir" value={viewItem.pendidikan_terakhir} />
                <DetailRow label="No. WhatsApp" value={viewItem.no_whatsapp} />
              </div>
              {!readOnly && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                    <Edit size={14} className="mr-1.5" /> Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { deleteMutation.mutate(viewItem.id); setViewItem(null); }}>
                    <Trash2 size={14} className="mr-1.5" /> Hapus
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!readOnly && (
        <>
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
                  {editId ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm text-foreground">{value || '-'}</span>
    </div>
  );
}

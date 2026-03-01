import { useState } from 'react';
import { Plus, FileDown, Trash2, Edit, Mail, MailOpen, Loader2, Calendar, User, Hash } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface SuratItem {
  id: string;
  jenis: 'masuk' | 'keluar';
  nama: string;
  nomor: string;
  waktu: string;
  pengirim: string;
  penerima: string;
  keterangan: string;
}

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
  const readOnly = useReadOnly();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratForm>(emptyForm);
  const [filter, setFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [viewSurat, setViewSurat] = useState<SuratItem | null>(null);

  const { data: suratList = [], isLoading } = useQuery({
    queryKey: ['surat'],
    queryFn: async () => {
      const { data, error } = await supabase.from('surat').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((r): SuratItem => ({
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
  function openEdit(surat: SuratItem) {
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

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
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
          {filtered.map((surat, index) => (
            <div
              key={surat.id}
              className="stat-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              onClick={() => setViewSurat(surat)}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${surat.jenis === 'masuk' ? 'bg-info/15 text-info' : 'bg-warning/15 text-warning'}`}>
                    {surat.jenis === 'masuk' ? <MailOpen size={18} /> : <Mail size={18} />}
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${surat.jenis === 'masuk' ? 'border-info/40 text-info' : 'border-warning/40 text-warning'}`}>
                    {surat.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight">{surat.nama}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Hash size={11} className="text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{surat.nomor}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={11} className="text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">{formatDate(surat.waktu)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <User size={11} className="text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">
                      {surat.jenis === 'masuk' ? `Dari: ${surat.pengirim}` : `Kepada: ${surat.penerima}`}
                    </p>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(surat); }}>
                      <Edit size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(surat.id); }}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View Dialog */}
      <Dialog open={!!viewSurat} onOpenChange={(o) => { if (!o) setViewSurat(null); }}>
        <DialogContent className="max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewSurat?.jenis === 'masuk' ? 'bg-info/15 text-info' : 'bg-warning/15 text-warning'}`}>
                {viewSurat?.jenis === 'masuk' ? <MailOpen size={16} /> : <Mail size={16} />}
              </div>
              Detail Surat
            </DialogTitle>
          </DialogHeader>
          {viewSurat && (
            <div className="space-y-3 mt-1">
              <Badge className={`${viewSurat.jenis === 'masuk' ? 'bg-info/15 text-info border-info/30' : 'bg-warning/15 text-warning border-warning/30'}`} variant="outline">
                Surat {viewSurat.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
              </Badge>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <DetailRow label="Nama Surat" value={viewSurat.nama} />
                <DetailRow label="Nomor Surat" value={viewSurat.nomor} />
                <DetailRow label="Tanggal" value={formatDate(viewSurat.waktu)} />
                <DetailRow label="Pengirim" value={viewSurat.pengirim} />
                <DetailRow label="Penerima" value={viewSurat.penerima} />
                {viewSurat.keterangan && <DetailRow label="Keterangan" value={viewSurat.keterangan} />}
              </div>

              {!readOnly && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setViewSurat(null); openEdit(viewSurat); }}>
                    <Edit size={14} className="mr-1.5" /> Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { deleteMutation.mutate(viewSurat.id); setViewSurat(null); }}>
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

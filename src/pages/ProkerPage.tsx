import { useState } from 'react';
import { Plus, FileDown, Trash2, Edit, ClipboardList, CheckCircle, Clock, Loader2, Calendar, MapPin, Target } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import type { BidangGarapan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

const bidangOptions: BidangGarapan[] = [
  'Pendidikan', 'Dakwah', 'Kaderisasi', "Jam'iyyah", 'Infokom', 'Ekonomi Sosial', 'Seni & Olahraga', 'HLO',
];

interface ProkerItem {
  id: string;
  nama: string;
  bidang: BidangGarapan;
  waktuPelaksanaan: string;
  tujuan: string;
  tempat: string;
  realisasi: 'Terlaksana' | 'Belum Terlaksana';
  kendala: string;
  solusi: string;
}

interface ProkerForm {
  nama: string;
  bidang: BidangGarapan;
  waktuPelaksanaan: string;
  tujuan: string;
  tempat: string;
  realisasi: 'Terlaksana' | 'Belum Terlaksana';
  kendala: string;
  solusi: string;
}

const emptyForm: ProkerForm = {
  nama: '', bidang: 'Pendidikan', waktuPelaksanaan: '', tujuan: '', tempat: '', realisasi: 'Belum Terlaksana', kendala: '', solusi: '',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ProkerPage() {
  const readOnly = useReadOnly();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProkerForm>(emptyForm);
  const [viewItem, setViewItem] = useState<ProkerItem | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['program_kerja'],
    queryFn: async () => {
      const { data, error } = await supabase.from('program_kerja').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((r): ProkerItem => ({
        id: r.id, nama: r.nama, bidang: r.bidang as BidangGarapan,
        waktuPelaksanaan: r.waktu_pelaksanaan, tujuan: r.tujuan, tempat: r.tempat,
        realisasi: r.realisasi as 'Terlaksana' | 'Belum Terlaksana', kendala: r.kendala, solusi: r.solusi,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const row = { nama: form.nama, bidang: form.bidang, waktu_pelaksanaan: form.waktuPelaksanaan, tujuan: form.tujuan, tempat: form.tempat, realisasi: form.realisasi, kendala: form.kendala, solusi: form.solusi };
      if (editId) {
        const { error } = await supabase.from('program_kerja').update(row).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('program_kerja').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['program_kerja'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('program_kerja').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['program_kerja'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: ProkerItem) {
    setEditId(item.id);
    const { id, ...rest } = item;
    setForm(rest);
    setOpen(true);
  }
  function handleSave() { if (!form.nama) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama Program', 'Bidang', 'Waktu', 'Tempat', 'Tujuan', 'Realisasi', 'Kendala', 'Solusi'];
    const rows = list.map((p, i) => [
      String(i + 1), p.nama, p.bidang, p.waktuPelaksanaan, p.tempat, p.tujuan, p.realisasi, p.kendala, p.solusi,
    ]);
    const title = 'Program Kerja - PC Pemuda Persis Cibatu';
    type === 'pdf' ? exportToPdf(title, headers, rows) : exportToExcel(title, headers, rows);
  }

  const terlaksana = list.filter(p => p.realisasi === 'Terlaksana').length;
  const belum = list.filter(p => p.realisasi === 'Belum Terlaksana').length;

  return (
    <AppLayout title="Program Kerja">
      {/* Summary */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="stat-card text-center p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{list.length}</p>
          </div>
          <div className="stat-card text-center p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Terlaksana</p>
            <p className="text-lg font-bold text-primary mt-0.5">{terlaksana}</p>
          </div>
          <div className="stat-card text-center p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Belum</p>
            <p className="text-lg font-bold text-destructive mt-0.5">{belum}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{list.length} program</p>
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
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          Belum ada program kerja
        </div>
      ) : (
        <div className="space-y-5">
          {bidangOptions
            .map((bidang) => ({ bidang, items: list.filter((p) => p.bidang === bidang) }))
            .filter((g) => g.items.length > 0)
            .map((group) => {
              const done = group.items.filter(p => p.realisasi === 'Terlaksana').length;
              return (
                <div key={group.bidang} className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-primary/10 px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-sm text-primary">{group.bidang}</span>
                    <Badge variant="secondary" className="text-[10px]">{done}/{group.items.length} terlaksana</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs px-3 w-10">No</TableHead>
                          <TableHead className="text-xs px-3">Program</TableHead>
                          <TableHead className="text-xs px-3">Waktu</TableHead>
                          <TableHead className="text-xs px-3 text-center">Status</TableHead>
                          {!readOnly && <TableHead className="text-xs px-3 w-16 text-center">Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, idx) => (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer hover:bg-primary/5 transition-colors"
                            onClick={() => setViewItem(item)}
                          >
                            <TableCell className="text-xs px-3 py-2 text-muted-foreground font-medium">{idx + 1}</TableCell>
                            <TableCell className="text-xs px-3 py-2 font-medium text-foreground">{item.nama}</TableCell>
                            <TableCell className="text-xs px-3 py-2 text-muted-foreground">{formatDate(item.waktuPelaksanaan)}</TableCell>
                            <TableCell className="text-xs px-3 py-2 text-center">
                              <Badge variant={item.realisasi === 'Terlaksana' ? 'default' : 'outline'} className="text-[10px]">
                                {item.realisasi === 'Terlaksana' ? '✓' : '—'}
                              </Badge>
                            </TableCell>
                            {!readOnly && (
                              <TableCell className="text-xs px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Edit size={12} /></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}><Trash2 size={12} /></Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Detail View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewItem?.realisasi === 'Terlaksana' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {viewItem?.realisasi === 'Terlaksana' ? <CheckCircle size={16} /> : <Clock size={16} />}
              </div>
              Detail Program
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 mt-1">
              <div className="flex gap-2">
                <Badge variant="secondary">{viewItem.bidang}</Badge>
                <Badge variant={viewItem.realisasi === 'Terlaksana' ? 'default' : 'outline'}>{viewItem.realisasi}</Badge>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <DetailRow label="Nama Program" value={viewItem.nama} />
                <DetailRow label="Bidang" value={viewItem.bidang} />
                <DetailRow label="Waktu Pelaksanaan" value={formatDate(viewItem.waktuPelaksanaan)} />
                <DetailRow label="Tempat" value={viewItem.tempat} />
                <DetailRow label="Tujuan" value={viewItem.tujuan} />
                <DetailRow label="Realisasi" value={viewItem.realisasi} />
                {viewItem.kendala && <DetailRow label="Kendala" value={viewItem.kendala} />}
                {viewItem.solusi && <DetailRow label="Solusi" value={viewItem.solusi} />}
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
              <DialogHeader><DialogTitle>{editId ? 'Edit Program' : 'Tambah Program'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Nama Program</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
                <div>
                  <Label>Bidang Garapan</Label>
                  <Select value={form.bidang} onValueChange={(v) => setForm({ ...form, bidang: v as BidangGarapan })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{bidangOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Waktu Pelaksanaan</Label><Input type="date" value={form.waktuPelaksanaan} onChange={(e) => setForm({ ...form, waktuPelaksanaan: e.target.value })} /></div>
                <div><Label>Tempat Pelaksanaan</Label><Input value={form.tempat} onChange={(e) => setForm({ ...form, tempat: e.target.value })} /></div>
                <div><Label>Tujuan Pelaksanaan</Label><Textarea value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} /></div>
                <div>
                  <Label>Realisasi</Label>
                  <Select value={form.realisasi} onValueChange={(v) => setForm({ ...form, realisasi: v as 'Terlaksana' | 'Belum Terlaksana' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Belum Terlaksana">Belum Terlaksana</SelectItem>
                      <SelectItem value="Terlaksana">Terlaksana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Kendala</Label><Textarea value={form.kendala} onChange={(e) => setForm({ ...form, kendala: e.target.value })} /></div>
                <div><Label>Solusi</Label><Textarea value={form.solusi} onChange={(e) => setForm({ ...form, solusi: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {editId ? 'Simpan Perubahan' : 'Tambah Program'}
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

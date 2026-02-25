import { useState } from 'react';
import { Plus, Trash2, Edit, BookOpen, Loader2, ArrowLeft, FileDown, CalendarDays, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface Form {
  nama_rapat: string;
  tanggal_rapat: string;
  tempat_rapat: string;
  hasil_rapat: string;
  notulis: string;
}
const emptyForm: Form = { nama_rapat: '', tanggal_rapat: '', tempat_rapat: '', hasil_rapat: '', notulis: '' };

export default function NotulensiPage() {
  const readOnly = useReadOnly();
  const prefix = readOnly ? '/view' : '';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['notulensi_rapat'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notulensi_rapat' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: pengurusList = [] } = useQuery({
    queryKey: ['pengurus'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pengurus').select('nama').order('nama');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from('notulensi_rapat' as any).update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notulensi_rapat' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notulensi_rapat'] }); setOpen(false); toast.success('Notulensi berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notulensi_rapat' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notulensi_rapat'] }); toast.success('Notulensi berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: any) {
    setEditId(item.id);
    setForm({ nama_rapat: item.nama_rapat, tanggal_rapat: item.tanggal_rapat, tempat_rapat: item.tempat_rapat, hasil_rapat: item.hasil_rapat, notulis: item.notulis });
    setOpen(true);
  }
  function handleSave() { if (!form.nama_rapat || !form.tanggal_rapat) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama Rapat', 'Tanggal', 'Tempat', 'Notulis', 'Hasil Rapat'];
    const rows = list.map((item: any, i: number) => [
      String(i + 1), item.nama_rapat, item.tanggal_rapat, item.tempat_rapat, item.notulis, item.hasil_rapat,
    ]);
    if (type === 'pdf') exportToPdf('Notulensi Rapat', headers, rows);
    else exportToExcel('Notulensi Rapat', headers, rows);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  }

  return (
    <AppLayout title="Notulensi Rapat">
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
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />Belum ada notulensi rapat
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item: any, i: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="bg-primary/5 px-4 py-3 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{item.nama_rapat}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays size={11} /> {formatDate(item.tanggal_rapat)}
                      </span>
                      {item.tempat_rapat && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={11} /> {item.tempat_rapat}
                        </span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Edit size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 size={13} /></Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 space-y-2">
                {item.notulis && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <User size={11} /> <span className="font-medium">Notulis:</span> {item.notulis}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">Hasil Rapat:</p>
                  <div
                    className="text-xs leading-relaxed whitespace-pre-wrap bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setViewItem(item)}
                  >
                    {item.hasil_rapat || <span className="text-muted-foreground italic">Belum ada hasil rapat</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!readOnly && (
        <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>
      )}

      {/* Form Dialog - only for non-readonly */}
      {!readOnly && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader><DialogTitle>{editId ? 'Edit Notulensi' : 'Tambah Notulensi'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Nama Rapat</Label><Input value={form.nama_rapat} onChange={(e) => setForm({ ...form, nama_rapat: e.target.value })} /></div>
              <div><Label>Tanggal Rapat</Label><Input type="date" value={form.tanggal_rapat} onChange={(e) => setForm({ ...form, tanggal_rapat: e.target.value })} /></div>
              <div><Label>Tempat Rapat</Label><Input value={form.tempat_rapat} onChange={(e) => setForm({ ...form, tempat_rapat: e.target.value })} /></div>
              <div>
                <Label>Notulis Rapat</Label>
                <Select value={form.notulis || '_none'} onValueChange={(v) => setForm({ ...form, notulis: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Notulis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Pilih Notulis —</SelectItem>
                    {pengurusList.map((p) => <SelectItem key={p.nama} value={p.nama}>{p.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hasil Rapat</Label>
                <Textarea
                  className="min-h-[160px]"
                  placeholder="Tuliskan hasil rapat secara lengkap..."
                  value={form.hasil_rapat}
                  onChange={(e) => setForm({ ...form, hasil_rapat: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
                {editId ? 'Simpan Perubahan' : 'Tambah Notulensi'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{viewItem.nama_rapat}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(viewItem.tanggal_rapat)}</span>
                  {viewItem.tempat_rapat && <span className="flex items-center gap-1"><MapPin size={12} /> {viewItem.tempat_rapat}</span>}
                  {viewItem.notulis && <span className="flex items-center gap-1"><User size={12} /> {viewItem.notulis}</span>}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Hasil Rapat</p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewItem.hasil_rapat || 'Belum ada hasil rapat'}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

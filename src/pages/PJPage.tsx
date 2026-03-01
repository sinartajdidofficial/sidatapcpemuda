import { useState } from 'react';
import { Plus, Trash2, Edit, Building2, Loader2, ArrowLeft, FileDown, Phone, MapPin } from 'lucide-react';
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
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface PJItem {
  id: string; nama_pj: string; ketua: string; sekretaris: string; bendahara: string;
  nomor_sk: string; alamat: string; no_whatsapp: string;
}

interface Form {
  nama_pj: string; ketua: string; sekretaris: string; bendahara: string;
  nomor_sk: string; alamat: string; no_whatsapp: string;
}
const emptyForm: Form = { nama_pj: '', ketua: '', sekretaris: '', bendahara: '', nomor_sk: '', alamat: '', no_whatsapp: '' };

export default function PJPage() {
  const readOnly = useReadOnly();
  const prefix = readOnly ? '/view' : '';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [viewItem, setViewItem] = useState<PJItem | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['pj'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pj').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PJItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from('pj').update(form).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pj').insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pj'] }); setOpen(false); toast.success('Data berhasil disimpan'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('pj').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pj'] }); toast.success('Data berhasil dihapus'); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: PJItem) {
    setEditId(item.id);
    setForm({ nama_pj: item.nama_pj, ketua: item.ketua, sekretaris: item.sekretaris, bendahara: item.bendahara, nomor_sk: item.nomor_sk, alamat: item.alamat, no_whatsapp: item.no_whatsapp });
    setOpen(true);
  }
  function handleSave() { if (!form.nama_pj) return; saveMutation.mutate(); }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama PJ', 'Ketua', 'Sekretaris', 'Bendahara', 'No. SK', 'Alamat', 'No. WA'];
    const rows = list.map((item, i) => [
      String(i + 1), item.nama_pj, item.ketua, item.sekretaris, item.bendahara, item.nomor_sk, item.alamat, item.no_whatsapp,
    ]);
    if (type === 'pdf') exportToPdf('Data Pimpinan Jamaah', headers, rows);
    else exportToExcel('Data Pimpinan Jamaah', headers, rows);
  }

  return (
    <AppLayout title="Data PJ">
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
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />Belum ada data PJ
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
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.nama_pj}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ketua: {item.ketua || '-'}</p>
                  {item.alamat && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={11} className="text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{item.alamat}</p>
                    </div>
                  )}
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
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Building2 size={16} />
              </div>
              Detail Pimpinan Jamaah
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 mt-1">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <DetailRow label="Nama PJ" value={viewItem.nama_pj} />
                <DetailRow label="Ketua" value={viewItem.ketua} />
                <DetailRow label="Sekretaris" value={viewItem.sekretaris} />
                <DetailRow label="Bendahara" value={viewItem.bendahara} />
                <DetailRow label="Nomor SK" value={viewItem.nomor_sk} />
                <DetailRow label="Alamat" value={viewItem.alamat} />
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
              <DialogHeader><DialogTitle>{editId ? 'Edit PJ' : 'Tambah PJ'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Nama Pimpinan Jamaah</Label><Input value={form.nama_pj} onChange={(e) => setForm({ ...form, nama_pj: e.target.value })} /></div>
                <div><Label>Ketua</Label><Input value={form.ketua} onChange={(e) => setForm({ ...form, ketua: e.target.value })} /></div>
                <div><Label>Sekretaris</Label><Input value={form.sekretaris} onChange={(e) => setForm({ ...form, sekretaris: e.target.value })} /></div>
                <div><Label>Bendahara</Label><Input value={form.bendahara} onChange={(e) => setForm({ ...form, bendahara: e.target.value })} /></div>
                <div><Label>Nomor SK</Label><Input value={form.nomor_sk} onChange={(e) => setForm({ ...form, nomor_sk: e.target.value })} /></div>
                <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
                <div><Label>No. WhatsApp</Label><Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
                  {editId ? 'Simpan Perubahan' : 'Tambah PJ'}
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

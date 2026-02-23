import { useState } from 'react';
import { Plus, Trash2, Edit, Building2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Form {
  nama_pj: string; ketua: string; sekretaris: string; bendahara: string;
  nomor_sk: string; alamat: string; no_whatsapp: string;
}
const emptyForm: Form = { nama_pj: '', ketua: '', sekretaris: '', bendahara: '', nomor_sk: '', alamat: '', no_whatsapp: '' };

export default function PJPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['pj'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pj').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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
  function openEdit(item: typeof list[0]) {
    setEditId(item.id);
    setForm({ nama_pj: item.nama_pj, ketua: item.ketua, sekretaris: item.sekretaris, bendahara: item.bendahara, nomor_sk: item.nomor_sk, alamat: item.alamat, no_whatsapp: item.no_whatsapp });
    setOpen(true);
  }
  function handleSave() { if (!form.nama_pj) return; saveMutation.mutate(); }

  return (
    <AppLayout title="Data PJ">
      <Link to="/data-pc" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft size={16} /> Kembali
      </Link>

      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />Belum ada data PJ
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.nama_pj}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ketua: {item.ketua}</p>
                  <p className="text-xs text-muted-foreground">Sekretaris: {item.sekretaris}</p>
                  <p className="text-xs text-muted-foreground">Bendahara: {item.bendahara}</p>
                  {item.nomor_sk && <p className="text-xs text-muted-foreground">SK: {item.nomor_sk}</p>}
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
    </AppLayout>
  );
}

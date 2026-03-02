import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Form {
  nama: string; tempat_lahir: string; tanggal_lahir: string;
  alamat: string; pendidikan_terakhir: string; no_whatsapp: string; tahun_masuk: string;
}
const emptyForm: Form = { nama: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', pendidikan_terakhir: '', no_whatsapp: '', tahun_masuk: '' };

export default function MarufPage() {
  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!form.nama.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!form.alamat.trim()) { toast.error('Alamat wajib diisi'); return; }
    if (!form.no_whatsapp.trim()) { toast.error('No. WhatsApp wajib diisi'); return; }

    setLoading(true);
    const { error } = await supabase.from('anggota').insert({
      ...form,
      status: 'pending',
    });
    setLoading(false);

    if (error) {
      toast.error('Gagal mengirim data: ' + error.message);
      return;
    }

    setForm(emptyForm);
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="app-header">
        <h1 className="text-lg font-bold tracking-tight">Pendaftaran Ma'ruf</h1>
        <p className="text-xs opacity-80">PC Pemuda Persis Cibatu</p>
      </header>

      <main className="page-content pb-8">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Silakan isi data di bawah ini untuk mendaftar sebagai anggota. Data akan diverifikasi oleh admin terlebih dahulu.
          </p>

          <div>
            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" />
          </div>

          <div>
            <Label>Tahun Masuk</Label>
            <Input placeholder="cth: 2024" value={form.tahun_masuk} onChange={(e) => setForm({ ...form, tahun_masuk: e.target.value })} />
          </div>

          <div>
            <Label>Tempat Lahir</Label>
            <Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} placeholder="Masukkan tempat lahir" />
          </div>

          <div>
            <Label>Tanggal Lahir</Label>
            <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
          </div>

          <div>
            <Label>Alamat <span className="text-destructive">*</span></Label>
            <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Masukkan alamat" />
          </div>

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

          <div>
            <Label>No. WhatsApp <span className="text-destructive">*</span></Label>
            <Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} placeholder="cth: 08123456789" />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2" size={16} />}
            Kirim Pendaftaran
          </Button>
        </div>
      </main>

      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="max-w-[90vw] rounded-2xl text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={48} className="text-primary" />
            <DialogHeader>
              <DialogTitle>Data Berhasil Dikirim!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Terima kasih telah mendaftar. Data Anda akan diverifikasi oleh admin sebelum ditampilkan.
            </p>
            <Button onClick={() => setSuccess(false)} className="mt-2">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

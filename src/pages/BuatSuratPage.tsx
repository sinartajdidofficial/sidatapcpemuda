import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText, Loader2, Eye, Upload, QrCode } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import QRCode from 'qrcode';

interface SuratDraft {
  id: string;
  logo_url: string;
  kop_surat: string;
  alamat: string;
  email: string;
  no_surat: string;
  lampiran: string;
  perihal: string;
  tanggal_surat: string;
  isi_hari_tanggal: string;
  isi_waktu: string;
  isi_tempat: string;
  ketua: string;
  sekretaris: string;
  qr_data: string;
  created_at: string;
}

interface SuratDraftForm {
  logo_url: string;
  kop_surat: string;
  alamat: string;
  email: string;
  no_surat: string;
  lampiran: string;
  perihal: string;
  tanggal_surat: string;
  isi_hari_tanggal: string;
  isi_waktu: string;
  isi_tempat: string;
  ketua: string;
  sekretaris: string;
}

const emptyForm: SuratDraftForm = {
  logo_url: '', kop_surat: '', alamat: '', email: '', no_surat: '',
  lampiran: '', perihal: '', tanggal_surat: '', isi_hari_tanggal: '',
  isi_waktu: '', isi_tempat: '', ketua: '', sekretaris: '',
};

export default function BuatSuratPage() {
  const readOnly = useReadOnly();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratDraftForm>(emptyForm);
  const [viewDraft, setViewDraft] = useState<SuratDraft | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['surat-draft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surat_draft')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SuratDraft[];
    },
  });

  // Generate QR code when viewing a draft
  useEffect(() => {
    if (viewDraft?.qr_data) {
      QRCode.toDataURL(viewDraft.qr_data, { width: 120, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [viewDraft]);

  async function uploadLogo(): Promise<string> {
    if (!logoFile) return form.logo_url;
    setUploadingLogo(true);
    try {
      const ext = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('surat-logos').upload(fileName, logoFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('surat-logos').getPublicUrl(fileName);
      return urlData.publicUrl;
    } finally {
      setUploadingLogo(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logoUrl = await uploadLogo();
      const qrContent = `Surat: ${form.no_surat} | Perihal: ${form.perihal} | Tanggal: ${form.tanggal_surat} | Ketua: ${form.ketua} | Sekretaris: ${form.sekretaris}`;
      const row = {
        logo_url: logoUrl,
        kop_surat: form.kop_surat,
        alamat: form.alamat,
        email: form.email,
        no_surat: form.no_surat,
        lampiran: form.lampiran,
        perihal: form.perihal,
        tanggal_surat: form.tanggal_surat,
        isi_hari_tanggal: form.isi_hari_tanggal,
        isi_waktu: form.isi_waktu,
        isi_tempat: form.isi_tempat,
        ketua: form.ketua,
        sekretaris: form.sekretaris,
        qr_data: qrContent,
      };
      if (editId) {
        const { error } = await supabase.from('surat_draft').update(row).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('surat_draft').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-draft'] });
      setOpen(false);
      setLogoFile(null);
      setLogoPreview('');
      toast.success('Surat berhasil disimpan');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('surat_draft').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-draft'] });
      toast.success('Surat berhasil dihapus');
    },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview('');
    setOpen(true);
  }

  function openEdit(draft: SuratDraft) {
    setEditId(draft.id);
    setForm({
      logo_url: draft.logo_url, kop_surat: draft.kop_surat, alamat: draft.alamat,
      email: draft.email, no_surat: draft.no_surat, lampiran: draft.lampiran,
      perihal: draft.perihal, tanggal_surat: draft.tanggal_surat,
      isi_hari_tanggal: draft.isi_hari_tanggal, isi_waktu: draft.isi_waktu,
      isi_tempat: draft.isi_tempat, ketua: draft.ketua, sekretaris: draft.sekretaris,
    });
    setLogoFile(null);
    setLogoPreview(draft.logo_url);
    setOpen(true);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleSave() {
    if (!form.no_surat || !form.perihal) {
      toast.error('No. Surat dan Perihal wajib diisi');
      return;
    }
    saveMutation.mutate();
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  return (
    <AppLayout title="Buat Surat" backTo="/surat">
      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          Belum ada draft surat
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="stat-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              onClick={() => setViewDraft(draft)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight truncate">{draft.perihal || 'Tanpa Perihal'}</p>
                  <p className="text-xs text-muted-foreground mt-1">No: {draft.no_surat || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(draft.tanggal_surat)}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">
                  Draft
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View */}
      <Dialog open={!!viewDraft} onOpenChange={(o) => { if (!o) setViewDraft(null); }}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={18} className="text-primary" /> Detail Surat
            </DialogTitle>
          </DialogHeader>
          {viewDraft && (
            <div className="space-y-3 mt-1">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                {viewDraft.logo_url && (
                  <div className="flex justify-center">
                    <img src={viewDraft.logo_url} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
                <DetailRow label="Kop Surat" value={viewDraft.kop_surat} />
                <DetailRow label="Alamat" value={viewDraft.alamat} />
                <DetailRow label="Email" value={viewDraft.email} />
                <DetailRow label="No. Surat" value={viewDraft.no_surat} />
                <DetailRow label="Lampiran" value={viewDraft.lampiran} />
                <DetailRow label="Perihal" value={viewDraft.perihal} />
                <DetailRow label="Tanggal Surat" value={formatDate(viewDraft.tanggal_surat)} />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Isi Surat</p>
                <DetailRow label="Hari/Tanggal" value={viewDraft.isi_hari_tanggal} />
                <DetailRow label="Waktu" value={viewDraft.isi_waktu} />
                <DetailRow label="Tempat" value={viewDraft.isi_tempat} />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tertanda</p>
                <DetailRow label="Ketua" value={viewDraft.ketua} />
                <DetailRow label="Sekretaris" value={viewDraft.sekretaris} />
              </div>

              {qrDataUrl && (
                <div className="bg-muted/50 rounded-xl p-4 flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <QrCode size={12} /> QR Code
                  </p>
                  <img src={qrDataUrl} alt="QR Code" className="w-28 h-28" />
                </div>
              )}

              {!readOnly && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setViewDraft(null); openEdit(viewDraft); }}>
                    <Edit size={14} className="mr-1.5" /> Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { deleteMutation.mutate(viewDraft.id); setViewDraft(null); }}>
                    <Trash2 size={14} className="mr-1.5" /> Hapus
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form */}
      {!readOnly && (
        <>
          <button onClick={openCreate} className="fab-button active:scale-95 transition-transform"><Plus size={24} /></button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Surat' : 'Buat Surat Baru'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Logo Upload */}
                <div>
                  <Label>Upload Logo</Label>
                  <div className="mt-1.5 flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain rounded-lg border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <Upload size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs" />
                    </div>
                  </div>
                </div>

                <div><Label>Kop Surat</Label><Input value={form.kop_surat} onChange={(e) => setForm({ ...form, kop_surat: e.target.value })} placeholder="Nama organisasi / kop surat" /></div>
                <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat organisasi" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email organisasi" /></div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detail Surat</p>
                  <div className="space-y-4">
                    <div><Label>No. Surat *</Label><Input value={form.no_surat} onChange={(e) => setForm({ ...form, no_surat: e.target.value })} placeholder="Nomor surat" /></div>
                    <div><Label>Lampiran</Label><Input value={form.lampiran} onChange={(e) => setForm({ ...form, lampiran: e.target.value })} placeholder="Lampiran" /></div>
                    <div><Label>Perihal Surat *</Label><Input value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} placeholder="Perihal surat" /></div>
                    <div><Label>Tanggal Surat</Label><Input type="date" value={form.tanggal_surat} onChange={(e) => setForm({ ...form, tanggal_surat: e.target.value })} /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Isi Surat</p>
                  <div className="space-y-4">
                    <div><Label>Hari/Tanggal</Label><Input value={form.isi_hari_tanggal} onChange={(e) => setForm({ ...form, isi_hari_tanggal: e.target.value })} placeholder="Contoh: Senin, 13 Maret 2026" /></div>
                    <div><Label>Waktu</Label><Input value={form.isi_waktu} onChange={(e) => setForm({ ...form, isi_waktu: e.target.value })} placeholder="Contoh: 09:00 - Selesai" /></div>
                    <div><Label>Tempat</Label><Input value={form.isi_tempat} onChange={(e) => setForm({ ...form, isi_tempat: e.target.value })} placeholder="Contoh: Aula Kantor" /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tertanda</p>
                  <div className="space-y-4">
                    <div><Label>Ketua</Label><Input value={form.ketua} onChange={(e) => setForm({ ...form, ketua: e.target.value })} placeholder="Nama ketua" /></div>
                    <div><Label>Sekretaris</Label><Input value={form.sekretaris} onChange={(e) => setForm({ ...form, sekretaris: e.target.value })} placeholder="Nama sekretaris" /></div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                  <QrCode size={16} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">QR Code akan dibuat otomatis berdasarkan data surat</p>
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending || uploadingLogo}>
                  {(saveMutation.isPending || uploadingLogo) ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {editId ? 'Simpan Perubahan' : 'Buat Surat'}
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

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText, Loader2, Eye, Upload, QrCode, Image } from 'lucide-react';
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
  isi_surat: string;
  kepada: string;
  isi_hari_tanggal: string;
  isi_waktu: string;
  isi_tempat: string;
  ketua: string;
  sekretaris: string;
  ttd_ketua_url: string;
  ttd_sekretaris_url: string;
  niat_ketua: string;
  niat_sekretaris: string;
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
  isi_surat: string;
  kepada: string;
  isi_hari_tanggal: string;
  isi_waktu: string;
  isi_tempat: string;
  ketua: string;
  sekretaris: string;
  ttd_ketua_url: string;
  ttd_sekretaris_url: string;
  niat_ketua: string;
  niat_sekretaris: string;
}

const emptyForm: SuratDraftForm = {
  logo_url: '', kop_surat: '', alamat: '', email: '', no_surat: '',
  lampiran: '', perihal: '', tanggal_surat: '', isi_surat: '', kepada: '',
  isi_hari_tanggal: '', isi_waktu: '', isi_tempat: '',
  ketua: '', sekretaris: '', ttd_ketua_url: '', ttd_sekretaris_url: '',
  niat_ketua: '', niat_sekretaris: '',
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
  const [ttdKetuaFile, setTtdKetuaFile] = useState<File | null>(null);
  const [ttdKetuaPreview, setTtdKetuaPreview] = useState<string>('');
  const [ttdSekretarisFile, setTtdSekretarisFile] = useState<File | null>(null);
  const [ttdSekretarisPreview, setTtdSekretarisPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
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

  useEffect(() => {
    if (viewDraft?.qr_data) {
      QRCode.toDataURL(viewDraft.qr_data, { width: 120, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [viewDraft]);

  async function uploadFile(file: File | null, existingUrl: string, prefix: string): Promise<string> {
    if (!file) return existingUrl;
    const ext = file.name.split('.').pop();
    const fileName = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('surat-logos').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('surat-logos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const [logoUrl, ttdKetuaUrl, ttdSekretarisUrl] = await Promise.all([
          uploadFile(logoFile, form.logo_url, 'logo'),
          uploadFile(ttdKetuaFile, form.ttd_ketua_url, 'ttd-ketua'),
          uploadFile(ttdSekretarisFile, form.ttd_sekretaris_url, 'ttd-sekretaris'),
        ]);
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
          isi_surat: form.isi_surat,
          kepada: form.kepada,
          isi_hari_tanggal: form.isi_hari_tanggal,
          isi_waktu: form.isi_waktu,
          isi_tempat: form.isi_tempat,
          ketua: form.ketua,
          sekretaris: form.sekretaris,
          ttd_ketua_url: ttdKetuaUrl,
          ttd_sekretaris_url: ttdSekretarisUrl,
          niat_ketua: form.niat_ketua,
          niat_sekretaris: form.niat_sekretaris,
          qr_data: qrContent,
        };
        if (editId) {
          const { error } = await supabase.from('surat_draft').update(row).eq('id', editId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('surat_draft').insert(row);
          if (error) throw error;
        }
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-draft'] });
      setOpen(false);
      resetFiles();
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

  function resetFiles() {
    setLogoFile(null); setLogoPreview('');
    setTtdKetuaFile(null); setTtdKetuaPreview('');
    setTtdSekretarisFile(null); setTtdSekretarisPreview('');
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    resetFiles();
    setOpen(true);
  }

  function openEdit(draft: SuratDraft) {
    setEditId(draft.id);
    setForm({
      logo_url: draft.logo_url, kop_surat: draft.kop_surat, alamat: draft.alamat,
      email: draft.email, no_surat: draft.no_surat, lampiran: draft.lampiran,
      perihal: draft.perihal, tanggal_surat: draft.tanggal_surat,
      isi_surat: draft.isi_surat, kepada: draft.kepada,
      isi_hari_tanggal: draft.isi_hari_tanggal, isi_waktu: draft.isi_waktu,
      isi_tempat: draft.isi_tempat, ketua: draft.ketua, sekretaris: draft.sekretaris,
      ttd_ketua_url: draft.ttd_ketua_url, ttd_sekretaris_url: draft.ttd_sekretaris_url,
      niat_ketua: draft.niat_ketua, niat_sekretaris: draft.niat_sekretaris,
    });
    setLogoFile(null); setLogoPreview(draft.logo_url);
    setTtdKetuaFile(null); setTtdKetuaPreview(draft.ttd_ketua_url);
    setTtdSekretarisFile(null); setTtdSekretarisPreview(draft.ttd_sekretaris_url);
    setOpen(true);
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
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
    <AppLayout title="Buat Surat" backTo={`${readOnly ? '/view' : ''}/surat`}>
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kepada</p>
                <span className="text-sm text-foreground whitespace-pre-wrap">{viewDraft.kepada || '-'}</span>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Isi Surat</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{viewDraft.isi_surat || '-'}</p>
                <div className="border-t border-border pt-3 space-y-2">
                  <DetailRow label="Hari/Tanggal" value={viewDraft.isi_hari_tanggal} />
                  <DetailRow label="Waktu" value={viewDraft.isi_waktu} />
                  <DetailRow label="Tempat" value={viewDraft.isi_tempat} />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tertanda</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Ketua</p>
                    {viewDraft.ttd_ketua_url && (
                      <img src={viewDraft.ttd_ketua_url} alt="TTD Ketua" className="h-16 mx-auto object-contain" />
                    )}
                    <p className="text-sm font-semibold text-foreground">{viewDraft.ketua || '-'}</p>
                    {viewDraft.niat_ketua && <p className="text-[10px] text-muted-foreground">NIAT : {viewDraft.niat_ketua}</p>}
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Sekretaris</p>
                    {viewDraft.ttd_sekretaris_url && (
                      <img src={viewDraft.ttd_sekretaris_url} alt="TTD Sekretaris" className="h-16 mx-auto object-contain" />
                    )}
                    <p className="text-sm font-semibold text-foreground">{viewDraft.sekretaris || '-'}</p>
                    {viewDraft.niat_sekretaris && <p className="text-[10px] text-muted-foreground">NIAT : {viewDraft.niat_sekretaris}</p>}
                  </div>
                </div>
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
                      <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} className="text-xs" />
                    </div>
                  </div>
                </div>

                <div><Label>Kop Surat</Label><Input value={form.kop_surat} onChange={(e) => setForm({ ...form, kop_surat: e.target.value })} placeholder="Nama organisasi / kop surat" /></div>
                <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat organisasi" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email organisasi" /></div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detail Surat</p>
                  <div className="space-y-4">
                    <div><Label>No. Surat *</Label><Input value={form.no_surat} onChange={(e) => setForm({ ...form, no_surat: e.target.value })} placeholder="Contoh: 003/B.1-C.6/Pemuda/2025" /></div>
                    <div><Label>Lampiran</Label><Input value={form.lampiran} onChange={(e) => setForm({ ...form, lampiran: e.target.value })} placeholder="Lampiran" /></div>
                    <div><Label>Perihal Surat *</Label><Input value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} placeholder="Perihal surat" /></div>
                    <div><Label>Tanggal Surat</Label><Input type="date" value={form.tanggal_surat} onChange={(e) => setForm({ ...form, tanggal_surat: e.target.value })} /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kepada</p>
                  <Textarea
                    value={form.kepada}
                    onChange={(e) => setForm({ ...form, kepada: e.target.value })}
                    placeholder="Contoh: Ketua Pemuda Persis Cibatu&#10;Di&#10;Tempat"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Isi Surat</p>
                  <div className="space-y-4">
                    <div>
                      <Label>Isi / Badan Surat</Label>
                      <Textarea
                        value={form.isi_surat}
                        onChange={(e) => setForm({ ...form, isi_surat: e.target.value })}
                        placeholder="Tuliskan isi surat secara lengkap di sini...&#10;&#10;Contoh: Semoga rahmat dan maghfiroh Alloh Subhanahu Wata'ala senantiasa tercurah kepada kita. Aamiin.&#10;&#10;Selanjutnya, PC Persis Cibatu akan melaksanakan kegiatan..."
                        className="min-h-[200px] leading-relaxed"
                      />
                    </div>
                    <div><Label>Hari/Tanggal</Label><Input value={form.isi_hari_tanggal} onChange={(e) => setForm({ ...form, isi_hari_tanggal: e.target.value })} placeholder="Contoh: Ahad, 28 September 2025" /></div>
                    <div><Label>Waktu</Label><Input value={form.isi_waktu} onChange={(e) => setForm({ ...form, isi_waktu: e.target.value })} placeholder="Contoh: 13.00 s.d. Selesai" /></div>
                    <div><Label>Tempat</Label><Input value={form.isi_tempat} onChange={(e) => setForm({ ...form, isi_tempat: e.target.value })} placeholder="Contoh: Mesjid Besar Kec. Cibatu" /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tertanda</p>
                  <div className="space-y-4">
                    {/* Ketua */}
                    <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                      <p className="text-xs font-semibold text-foreground">Ketua</p>
                      <div><Label>Nama Ketua</Label><Input value={form.ketua} onChange={(e) => setForm({ ...form, ketua: e.target.value })} placeholder="Nama ketua" /></div>
                      <div><Label>NIAT Ketua</Label><Input value={form.niat_ketua} onChange={(e) => setForm({ ...form, niat_ketua: e.target.value })} placeholder="Contoh: 13.407" /></div>
                      <div>
                        <Label>Upload Tanda Tangan Ketua</Label>
                        <div className="mt-1.5 flex items-center gap-3">
                          {ttdKetuaPreview ? (
                            <img src={ttdKetuaPreview} alt="TTD Ketua" className="h-12 w-20 object-contain rounded-lg border border-border bg-background" />
                          ) : (
                            <div className="h-12 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <Image size={16} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setTtdKetuaFile, setTtdKetuaPreview)} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sekretaris */}
                    <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                      <p className="text-xs font-semibold text-foreground">Sekretaris</p>
                      <div><Label>Nama Sekretaris</Label><Input value={form.sekretaris} onChange={(e) => setForm({ ...form, sekretaris: e.target.value })} placeholder="Nama sekretaris" /></div>
                      <div><Label>NIAT Sekretaris</Label><Input value={form.niat_sekretaris} onChange={(e) => setForm({ ...form, niat_sekretaris: e.target.value })} placeholder="Contoh: 01.08.47226.025" /></div>
                      <div>
                        <Label>Upload Tanda Tangan Sekretaris</Label>
                        <div className="mt-1.5 flex items-center gap-3">
                          {ttdSekretarisPreview ? (
                            <img src={ttdSekretarisPreview} alt="TTD Sekretaris" className="h-12 w-20 object-contain rounded-lg border border-border bg-background" />
                          ) : (
                            <div className="h-12 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <Image size={16} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setTtdSekretarisFile, setTtdSekretarisPreview)} className="text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                  <QrCode size={16} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">QR Code akan dibuat otomatis berdasarkan data surat</p>
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending || uploading}>
                  {(saveMutation.isPending || uploading) ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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

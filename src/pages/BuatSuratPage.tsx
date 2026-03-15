import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, FileText, Loader2, Eye, Upload, QrCode, Image, Download } from 'lucide-react';
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
import jsPDF from 'jspdf';

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
  const [exporting, setExporting] = useState(false);

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
          logo_url: logoUrl, kop_surat: form.kop_surat, alamat: form.alamat,
          email: form.email, no_surat: form.no_surat, lampiran: form.lampiran,
          perihal: form.perihal, tanggal_surat: form.tanggal_surat,
          isi_surat: form.isi_surat, kepada: form.kepada,
          isi_hari_tanggal: form.isi_hari_tanggal, isi_waktu: form.isi_waktu,
          isi_tempat: form.isi_tempat, ketua: form.ketua, sekretaris: form.sekretaris,
          ttd_ketua_url: ttdKetuaUrl, ttd_sekretaris_url: ttdSekretarisUrl,
          niat_ketua: form.niat_ketua, niat_sekretaris: form.niat_sekretaris,
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

  // ---- PDF EXPORT ----
  async function loadImageAsDataUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  function getVerificationUrl(draftId: string) {
    const base = window.location.origin;
    return `${base}/verifikasi-surat/${draftId}`;
  }

  async function exportToPdf(draft: SuratDraft) {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth(); // 210
      const mL = 20;
      const mR = 20;
      const cW = pageW - mL - mR; // 170
      let y = 18;

      // ===== KOP SURAT =====
      let logoEndX = mL;
      if (draft.logo_url) {
        try {
          const logoData = await loadImageAsDataUrl(draft.logo_url);
          if (logoData) {
            doc.addImage(logoData, 'PNG', mL, y - 3, 20, 20);
            logoEndX = mL + 23;
          }
        } catch { /* skip */ }
      }

      const kopCenterX = logoEndX + (pageW - mR - logoEndX) / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const kopText = (draft.kop_surat || '').toUpperCase();
      const kopMaxW = pageW - mR - logoEndX - 2;
      const kopSplit = doc.splitTextToSize(kopText, kopMaxW);
      let kopY = y;
      for (const line of kopSplit) {
        doc.text(line, kopCenterX, kopY, { align: 'center' });
        kopY += 5;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Sekretariat : ${draft.alamat || ''}`, kopCenterX, kopY + 1, { align: 'center' });

      y = Math.max(kopY + 5, y + 20);

      // Double line separator
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(mL, y, pageW - mR, y);
      doc.setLineWidth(0.3);
      doc.line(mL, y + 1.5, pageW - mR, y + 1.5);
      y += 8;

      // ===== NOMOR / LAMPIRAN / PERIHAL =====
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lblW = 25;
      const colX = mL + lblW;
      const vX = colX + 4;

      doc.text('Nomor', mL, y);
      doc.text(':', colX, y);
      doc.text(draft.no_surat || '-', vX, y);
      y += 6;
      doc.text('Lampiran', mL, y);
      doc.text(':', colX, y);
      doc.text(draft.lampiran || '-', vX, y);
      y += 6;
      doc.text('Perihal', mL, y);
      doc.text(':', colX, y);
      doc.setFont('helvetica', 'bold');
      const perihalLines = doc.splitTextToSize(draft.perihal || '-', cW - lblW - 6);
      for (const line of perihalLines) {
        doc.text(line, vX, y);
        y += 5;
      }
      doc.setFont('helvetica', 'normal');
      y += 4;

      // ===== KEPADA =====
      doc.setFontSize(11);
      doc.text('Kepada Yth:', mL, y);
      y += 6;
      const kepadaLines = (draft.kepada || '').split('\n');
      for (const line of kepadaLines) {
        doc.text(line, mL, y);
        y += 5;
      }
      y += 6;

      // ===== ISI SURAT =====
      doc.setFontSize(11);
      const bodyText = draft.isi_surat || '';
      const bodyParagraphs = bodyText.split('\n');
      for (const para of bodyParagraphs) {
        if (para.trim() === '') { y += 3; continue; }
        const wrapped = doc.splitTextToSize(para, cW);
        for (const line of wrapped) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, mL, y, { align: 'justify', maxWidth: cW });
          y += 5.5;
        }
      }
      y += 4;

      // ===== TABEL KEGIATAN =====
      if (draft.isi_hari_tanggal || draft.isi_waktu || draft.isi_tempat) {
        if (y > 240) { doc.addPage(); y = 20; }

        const tableRows = [
          ['Hari & tanggal', draft.isi_hari_tanggal || '-'],
          ['Waktu', draft.isi_waktu || '-'],
          ['Tempat', draft.isi_tempat || '-'],
        ];
        const c1W = 45;
        const c2W = cW - c1W;
        const rH = 8;

        doc.setFontSize(10);
        for (const [label, value] of tableRows) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.3);
          doc.rect(mL, y, c1W, rH);
          doc.rect(mL + c1W, y, c2W, rH);
          doc.setFont('helvetica', 'bold');
          doc.text(label, mL + 3, y + 5.5);
          doc.setFont('helvetica', 'normal');
          doc.text(value, mL + c1W + 3, y + 5.5);
          y += rH;
        }
        y += 6;
      }

      // ===== PENUTUP =====
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const penutup = 'Demikian surat ini kami sampaikan, atas perhatiannya disampaikan banyak terima kasih.';
      const penutupLines = doc.splitTextToSize(penutup, cW);
      for (const line of penutupLines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, mL, y);
        y += 5.5;
      }
      y += 8;

      // ===== TANGGAL & KOP BAWAH (right half) =====
      if (y > 220) { doc.addPage(); y = 20; }

      const rightX = pageW / 2 + 8;
      const rightW = pageW - mR - rightX;
      const rightCenterX = rightX + rightW / 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cibatu, ${formatDate(draft.tanggal_surat)}`, rightCenterX, y, { align: 'center' });
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const kopBawah = (draft.kop_surat || '').toUpperCase();
      const kopBLines = doc.splitTextToSize(kopBawah, rightW);
      for (const line of kopBLines) {
        doc.text(line, rightCenterX, y, { align: 'center' });
        y += 4.5;
      }
      doc.setFont('helvetica', 'normal');
      y += 3;

      // ===== TTD: Ketua (left col) & Sekretaris (right col) =====
      const ttdStartY = y;
      const ttdColW = rightW / 2;
      const ketuaCX = rightX + ttdColW / 2;
      const sekCX = rightX + ttdColW + ttdColW / 2;

      doc.setFontSize(10);
      doc.text('Ketua,', ketuaCX, ttdStartY, { align: 'center' });
      doc.text('Sekretaris,', sekCX, ttdStartY, { align: 'center' });

      // Signature images
      const sigY = ttdStartY + 4;
      const sigW = 32;
      const sigH = 16;
      if (draft.ttd_ketua_url) {
        try {
          const d = await loadImageAsDataUrl(draft.ttd_ketua_url);
          if (d) doc.addImage(d, 'PNG', ketuaCX - sigW / 2, sigY, sigW, sigH);
        } catch { /* skip */ }
      }
      if (draft.ttd_sekretaris_url) {
        try {
          const d = await loadImageAsDataUrl(draft.ttd_sekretaris_url);
          if (d) doc.addImage(d, 'PNG', sekCX - sigW / 2, sigY, sigW, sigH);
        } catch { /* skip */ }
      }

      const nameY = sigY + sigH + 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(draft.ketua || '-', ketuaCX, nameY, { align: 'center' });
      doc.text(draft.sekretaris || '-', sekCX, nameY, { align: 'center' });

      // Underline names
      const ketuaNameW = doc.getTextWidth(draft.ketua || '-');
      doc.setLineWidth(0.3);
      doc.line(ketuaCX - ketuaNameW / 2, nameY + 1, ketuaCX + ketuaNameW / 2, nameY + 1);
      const sekNameW = doc.getTextWidth(draft.sekretaris || '-');
      doc.line(sekCX - sekNameW / 2, nameY + 1, sekCX + sekNameW / 2, nameY + 1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      if (draft.niat_ketua) doc.text(`NIAT : ${draft.niat_ketua}`, ketuaCX, nameY + 5, { align: 'center' });
      if (draft.niat_sekretaris) doc.text(`NIAT : ${draft.niat_sekretaris}`, sekCX, nameY + 5, { align: 'center' });

      // ===== QR CODE (bottom-left) =====
      const verifyUrl = getVerificationUrl(draft.id);
      const qrImg = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
      const qrSize = 25;
      doc.addImage(qrImg, 'PNG', mL, ttdStartY - 4, qrSize, qrSize);
      doc.setFontSize(6);
      doc.text('Scan untuk verifikasi', mL + qrSize / 2, ttdStartY - 4 + qrSize + 3, { align: 'center' });

      doc.save(`Surat_${draft.perihal || 'Draft'}.pdf`);
      toast.success('PDF berhasil diunduh');
    } catch (e: any) {
      toast.error('Gagal export PDF: ' + e.message);
    } finally {
      setExporting(false);
    }
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

      {/* Preview Surat Resmi */}
      <Dialog open={!!viewDraft} onOpenChange={(o) => { if (!o) setViewDraft(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye size={18} className="text-primary" /> Preview Surat
            </DialogTitle>
          </DialogHeader>
          {viewDraft && (
            <div className="px-4 pb-4">
              {/* Official Letter Preview */}
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-0 text-[11px] sm:text-[13px] leading-relaxed" style={{ fontFamily: 'serif', color: '#1a1a1a' }}>
                  
                  {/* KOP SURAT */}
                  <div className="flex items-start gap-3 pb-3">
                    {viewDraft.logo_url && (
                      <img src={viewDraft.logo_url} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0" />
                    )}
                    <div className="flex-1 text-center">
                      <p className="font-bold text-[13px] sm:text-[15px] uppercase tracking-wide leading-tight">
                        {viewDraft.kop_surat || 'KOP SURAT'}
                      </p>
                      <p className="text-[9px] sm:text-[10px] mt-1 opacity-70">
                        Sekretariat : {viewDraft.alamat || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-b-[3px] border-double border-[hsl(var(--primary))]" />

                  {/* Nomor, Lampiran, Perihal */}
                  <div className="pt-4 space-y-1">
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0">Nomor</span>
                      <span>:</span>
                      <span>{viewDraft.no_surat || '-'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0">Lampiran</span>
                      <span>:</span>
                      <span>{viewDraft.lampiran || '-'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0">Perihal</span>
                      <span>:</span>
                      <span className="font-bold">{viewDraft.perihal || '-'}</span>
                    </div>
                  </div>

                  {/* Kepada */}
                  <div className="pt-4">
                    <p>Kepada Yth:</p>
                    <div className="whitespace-pre-wrap pl-0 mt-1">
                      {viewDraft.kepada || '-'}
                    </div>
                  </div>

                  {/* Isi Surat */}
                  <div className="pt-4 whitespace-pre-wrap text-justify leading-[1.8]">
                    {viewDraft.isi_surat || '-'}
                  </div>

                  {/* Tabel Kegiatan */}
                  {(viewDraft.isi_hari_tanggal || viewDraft.isi_waktu || viewDraft.isi_tempat) && (
                    <div className="pt-3">
                      <table className="w-full border-collapse text-[10px] sm:text-[12px]">
                        <tbody>
                          {[
                            ['Hari & tanggal', viewDraft.isi_hari_tanggal],
                            ['Waktu', viewDraft.isi_waktu],
                            ['Tempat', viewDraft.isi_tempat],
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <td className="border border-gray-400 px-2 py-1.5 font-bold w-[35%] bg-gray-50">{label}</td>
                              <td className="border border-gray-400 px-2 py-1.5">{value || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Penutup */}
                  <div className="pt-4">
                    <p>Demikian surat ini kami sampaikan, atas perhatiannya disampaikan banyak terima kasih.</p>
                  </div>

                  {/* Tanggal & TTD */}
                  <div className="pt-6 flex flex-col sm:flex-row gap-4">
                    {/* QR Code - left */}
                    <div className="shrink-0 flex items-end">
                      {qrDataUrl && (
                        <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24" />
                      )}
                    </div>

                    {/* TTD Block - right */}
                    <div className="flex-1 text-center sm:text-right">
                      <p>{formatDate(viewDraft.tanggal_surat)}</p>
                      <p className="font-bold text-[10px] sm:text-[11px] uppercase mt-1 leading-tight">
                        {viewDraft.kop_surat || '-'}
                      </p>
                      
                      <div className="flex justify-center sm:justify-end gap-6 sm:gap-10 mt-4">
                        {/* Ketua */}
                        <div className="text-center">
                          <p className="text-[10px] sm:text-[11px]">Ketua,</p>
                          <div className="h-14 sm:h-16 flex items-center justify-center">
                            {viewDraft.ttd_ketua_url && (
                              <img src={viewDraft.ttd_ketua_url} alt="TTD Ketua" className="h-12 sm:h-14 object-contain" />
                            )}
                          </div>
                          <p className="font-bold text-[10px] sm:text-[12px] underline">{viewDraft.ketua || '-'}</p>
                          {viewDraft.niat_ketua && (
                            <p className="text-[8px] sm:text-[9px] mt-0.5">NIAT : {viewDraft.niat_ketua}</p>
                          )}
                        </div>

                        {/* Sekretaris */}
                        <div className="text-center">
                          <p className="text-[10px] sm:text-[11px]">Sekretaris,</p>
                          <div className="h-14 sm:h-16 flex items-center justify-center">
                            {viewDraft.ttd_sekretaris_url && (
                              <img src={viewDraft.ttd_sekretaris_url} alt="TTD Sekretaris" className="h-12 sm:h-14 object-contain" />
                            )}
                          </div>
                          <p className="font-bold text-[10px] sm:text-[12px] underline">{viewDraft.sekretaris || '-'}</p>
                          {viewDraft.niat_sekretaris && (
                            <p className="text-[8px] sm:text-[9px] mt-0.5">NIAT : {viewDraft.niat_sekretaris}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => exportToPdf(viewDraft)}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Download size={14} className="mr-1.5" />}
                  Export PDF
                </Button>
                {!readOnly && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => { setViewDraft(null); openEdit(viewDraft); }}>
                      <Edit size={14} className="mr-1.5" /> Edit
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => { deleteMutation.mutate(viewDraft.id); setViewDraft(null); }}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
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
                    placeholder={"Contoh: Ketua Pemuda Persis Cibatu\nDi\nTempat"}
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
                        placeholder={"Tuliskan isi surat secara lengkap di sini...\n\nContoh: Semoga rahmat dan maghfiroh Alloh Subhanahu Wata'ala senantiasa tercurah kepada kita. Aamiin.\n\nSelanjutnya, PC Persis Cibatu akan melaksanakan kegiatan..."}
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

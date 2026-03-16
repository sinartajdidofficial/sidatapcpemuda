import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifikasiSuratPage() {
  // Support both /verifikasi-surat/:id and /verifikasi-surat/:slug/:tanggal/:id
  const { id, suratId } = useParams<{ id?: string; slug?: string; tanggal?: string; suratId?: string }>();
  const actualId = suratId || id;

  const { data: draft, isLoading } = useQuery({
    queryKey: ['verify-surat', actualId],
    queryFn: async () => {
      if (!actualId) throw new Error('ID tidak ditemukan');
      const { data, error } = await supabase
        .from('surat_draft')
        .select('*')
        .eq('id', actualId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!actualId,
  });

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="mx-auto animate-spin text-primary mb-4" size={40} />
            <p className="text-muted-foreground text-sm">Memverifikasi surat...</p>
          </div>
        ) : draft ? (
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Header - Valid */}
            <div className="bg-primary/10 p-6 text-center">
              <ShieldCheck size={48} className="mx-auto text-primary mb-3" />
              <h1 className="text-xl font-bold text-primary">Surat Terverifikasi</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Surat ini resmi dikeluarkan oleh sistem PC Pemuda Persis Cibatu
              </p>
            </div>

            {/* Detail */}
            <div className="p-5 space-y-3">
              <InfoRow label="No. Surat" value={draft.no_surat} />
              <InfoRow label="Perihal" value={draft.perihal} />
              <InfoRow label="Tanggal" value={formatDate(draft.tanggal_surat)} />
              <InfoRow label="Lampiran" value={draft.lampiran || '-'} />

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ditandatangani Oleh</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Ketua</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{draft.ketua || '-'}</p>
                    {draft.niat_ketua && <p className="text-[9px] text-muted-foreground mt-0.5">NIAT: {draft.niat_ketua}</p>}
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Sekretaris</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{draft.sekretaris || '-'}</p>
                    {draft.niat_sekretaris && <p className="text-[9px] text-muted-foreground mt-0.5">NIAT: {draft.niat_sekretaris}</p>}
                  </div>
                </div>
              </div>

              {(draft.isi_hari_tanggal || draft.isi_waktu || draft.isi_tempat) && (
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detail Kegiatan</p>
                  <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm">
                    {draft.isi_hari_tanggal && <p><span className="text-muted-foreground">Hari/Tanggal:</span> {draft.isi_hari_tanggal}</p>}
                    {draft.isi_waktu && <p><span className="text-muted-foreground">Waktu:</span> {draft.isi_waktu}</p>}
                    {draft.isi_tempat && <p><span className="text-muted-foreground">Tempat:</span> {draft.isi_tempat}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft size={14} className="mr-1.5" /> Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-destructive/30 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-destructive/10 p-6 text-center">
              <ShieldX size={48} className="mx-auto text-destructive mb-3" />
              <h1 className="text-xl font-bold text-destructive">Surat Tidak Ditemukan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Surat dengan ID ini tidak terdaftar dalam sistem PC Pemuda Persis Cibatu.
                Surat mungkin tidak valid atau telah dihapus.
              </p>
            </div>
            <div className="p-5">
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft size={14} className="mr-1.5" /> Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Sistem Informasi Data — PC Pemuda Persis Cibatu
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || '-'}</span>
    </div>
  );
}

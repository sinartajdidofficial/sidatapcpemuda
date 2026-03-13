
CREATE TABLE public.surat_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text NOT NULL DEFAULT '',
  kop_surat text NOT NULL DEFAULT '',
  alamat text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  no_surat text NOT NULL DEFAULT '',
  lampiran text NOT NULL DEFAULT '',
  perihal text NOT NULL DEFAULT '',
  tanggal_surat text NOT NULL DEFAULT '',
  isi_hari_tanggal text NOT NULL DEFAULT '',
  isi_waktu text NOT NULL DEFAULT '',
  isi_tempat text NOT NULL DEFAULT '',
  ketua text NOT NULL DEFAULT '',
  sekretaris text NOT NULL DEFAULT '',
  qr_data text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.surat_draft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view surat_draft" ON public.surat_draft FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert surat_draft" ON public.surat_draft FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update surat_draft" ON public.surat_draft FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete surat_draft" ON public.surat_draft FOR DELETE TO public USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('surat-logos', 'surat-logos', true);

CREATE POLICY "Anyone can upload surat logos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'surat-logos');
CREATE POLICY "Anyone can view surat logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'surat-logos');
CREATE POLICY "Anyone can delete surat logos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'surat-logos');

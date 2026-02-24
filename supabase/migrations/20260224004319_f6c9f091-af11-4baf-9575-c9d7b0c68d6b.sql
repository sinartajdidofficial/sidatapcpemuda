
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS bidang_utama text NOT NULL DEFAULT '';
ALTER TABLE public.anggota ADD COLUMN IF NOT EXISTS tahun_masuk text NOT NULL DEFAULT '';

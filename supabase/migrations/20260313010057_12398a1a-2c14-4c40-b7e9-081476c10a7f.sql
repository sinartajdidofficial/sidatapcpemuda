
ALTER TABLE public.surat_draft 
ADD COLUMN isi_surat text NOT NULL DEFAULT '',
ADD COLUMN kepada text NOT NULL DEFAULT '',
ADD COLUMN ttd_ketua_url text NOT NULL DEFAULT '',
ADD COLUMN ttd_sekretaris_url text NOT NULL DEFAULT '',
ADD COLUMN niat_ketua text NOT NULL DEFAULT '',
ADD COLUMN niat_sekretaris text NOT NULL DEFAULT '';

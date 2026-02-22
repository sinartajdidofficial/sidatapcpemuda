export interface Surat {
  id: string;
  jenis: 'masuk' | 'keluar';
  nama: string;
  nomor: string;
  waktu: string;
  pengirim: string;
  penerima: string;
  keterangan: string;
  filePdf?: string;
}

export interface Keuangan {
  id: string;
  jenis: 'masuk' | 'keluar';
  namaKegiatan: string;
  waktu: string;
  nominal: number;
  keterangan: string;
}

export type BidangGarapan =
  | 'Pendidikan'
  | 'Dakwah'
  | 'Kaderisasi'
  | "Jam'iyyah"
  | 'Infokom'
  | 'Ekonomi Sosial'
  | 'Seni & Olahraga'
  | 'HLO';

export interface ProgramKerja {
  id: string;
  nama: string;
  bidang: BidangGarapan;
  waktuPelaksanaan: string;
  tujuan: string;
  tempat: string;
  realisasi: 'Terlaksana' | 'Belum Terlaksana';
  kendala: string;
  solusi: string;
}

import { useState } from 'react';
import { Plus, FileDown, Trash2, Edit, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '@/components/AppLayout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { exportToPdf, exportToExcel } from '@/utils/exportUtils';
import type { ProgramKerja, BidangGarapan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const bidangOptions: BidangGarapan[] = [
  'Pendidikan', 'Dakwah', 'Kaderisasi', "Jam'iyyah", 'Infokom', 'Ekonomi Sosial', 'Seni & Olahraga', 'HLO',
];

const emptyProker: Omit<ProgramKerja, 'id'> = {
  nama: '',
  bidang: 'Pendidikan',
  waktuPelaksanaan: '',
  tujuan: '',
  tempat: '',
  realisasi: 'Belum Terlaksana',
  kendala: '',
  solusi: '',
};

export default function ProkerPage() {
  const [list, setList] = useLocalStorage<ProgramKerja[]>('proker', []);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ProgramKerja, 'id'>>(emptyProker);

  function openCreate() {
    setEditId(null);
    setForm(emptyProker);
    setOpen(true);
  }

  function openEdit(item: ProgramKerja) {
    setEditId(item.id);
    const { id, ...rest } = item;
    setForm(rest);
    setOpen(true);
  }

  function handleSave() {
    if (!form.nama) return;
    if (editId) {
      setList(list.map((p) => (p.id === editId ? { ...p, ...form } : p)));
    } else {
      setList([...list, { id: uuidv4(), ...form }]);
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    setList(list.filter((p) => p.id !== id));
  }

  function handleExport(type: 'pdf' | 'excel') {
    const headers = ['No', 'Nama Program', 'Bidang', 'Waktu', 'Tempat', 'Tujuan', 'Realisasi', 'Kendala', 'Solusi'];
    const rows = list.map((p, i) => [
      String(i + 1), p.nama, p.bidang, p.waktuPelaksanaan, p.tempat, p.tujuan, p.realisasi, p.kendala, p.solusi,
    ]);
    const title = 'Program Kerja - PC Pemuda Persis Cibatu';
    type === 'pdf' ? exportToPdf(title, headers, rows) : exportToExcel(title, headers, rows);
  }

  return (
    <AppLayout title="Program Kerja">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{list.length} program</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown size={16} className="mr-1" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>Export PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>Export Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          Belum ada program kerja
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.realisasi === 'Terlaksana' ? (
                      <CheckCircle size={16} className="text-success shrink-0" />
                    ) : (
                      <Clock size={16} className="text-warning shrink-0" />
                    )}
                    <p className="font-semibold text-sm truncate">{item.nama}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="secondary" className="text-[10px]">{item.bidang}</Badge>
                    <Badge variant={item.realisasi === 'Terlaksana' ? 'default' : 'outline'} className="text-[10px]">
                      {item.realisasi}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.tempat} • {item.waktuPelaksanaan}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Edit size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openCreate} className="fab-button active:scale-95 transition-transform">
        <Plus size={24} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Program' : 'Tambah Program'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nama Program</Label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div>
              <Label>Bidang Garapan</Label>
              <Select value={form.bidang} onValueChange={(v) => setForm({ ...form, bidang: v as BidangGarapan })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bidangOptions.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Waktu Pelaksanaan</Label>
              <Input type="date" value={form.waktuPelaksanaan} onChange={(e) => setForm({ ...form, waktuPelaksanaan: e.target.value })} />
            </div>
            <div>
              <Label>Tempat Pelaksanaan</Label>
              <Input value={form.tempat} onChange={(e) => setForm({ ...form, tempat: e.target.value })} />
            </div>
            <div>
              <Label>Tujuan Pelaksanaan</Label>
              <Textarea value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} />
            </div>
            <div>
              <Label>Realisasi</Label>
              <Select value={form.realisasi} onValueChange={(v) => setForm({ ...form, realisasi: v as 'Terlaksana' | 'Belum Terlaksana' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Terlaksana">Belum Terlaksana</SelectItem>
                  <SelectItem value="Terlaksana">Terlaksana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kendala</Label>
              <Textarea value={form.kendala} onChange={(e) => setForm({ ...form, kendala: e.target.value })} />
            </div>
            <div>
              <Label>Solusi</Label>
              <Textarea value={form.solusi} onChange={(e) => setForm({ ...form, solusi: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSave}>
              {editId ? 'Simpan Perubahan' : 'Tambah Program'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

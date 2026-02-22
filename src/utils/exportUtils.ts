import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToPdf(title: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text('PC Pemuda Persis Cibatu', 14, 28);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 120, 90] },
  });

  doc.save(`${title}.pdf`);
}

export function exportToExcel(title: string, headers: string[], rows: string[][]) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${title}.xlsx`);
}

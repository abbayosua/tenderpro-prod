'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: 'OWNER' | 'CONTRACTOR';
  projects?: Array<{ id: string; title: string }>;
}

export function ExportModal({
  open,
  onOpenChange,
  userId,
  userRole,
  projects = [],
}: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'excel'>('excel');
  const [reportType, setReportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch export data from API
      const params = new URLSearchParams({
        userId,
        type: reportType,
        ...(reportType !== 'all' && reportType !== 'financial' && { projectId: reportType }),
      });

      const response = await fetch(`/api/export-report?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate report');
      }

      // Generate file based on format
      if (format === 'excel') {
        generateExcel(data.data, data.title, data.subtitle);
      } else {
        generatePDF(data.data, data.title, data.subtitle);
      }

      toast.success(`Laporan berhasil diekspor sebagai ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExcel = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Prepare data with title and subtitle
    const wsData: (string | number)[][] = [
      [title],
      [subtitle],
      [''],
      ['Kriteria', 'Nilai'],
    ];
    
    // Add data rows
    data.forEach(row => {
      if (row.title && !row.title.startsWith('---')) {
        wsData.push([row.title, String(row.value)]);
      }
    });
    
    // Add footer
    wsData.push(['']);
    wsData.push([`Diekspor pada: ${new Date().toLocaleString('id-ID')}`]);
    wsData.push(['TenderPro - Platform Tender Konstruksi Terpercaya']);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, // Kriteria column
      { wch: 50 }, // Nilai column
    ];
    
    // Style the header row (row 4, which is index 3 in 0-based)
    const headerCell1 = ws['A4'];
    const headerCell2 = ws['B4'];
    if (headerCell1) headerCell1.s = { font: { bold: true }, fill: { fgColor: { rgb: '4F46E5' } } };
    if (headerCell2) headerCell2.s = { font: { bold: true }, fill: { fgColor: { rgb: '4F46E5' } } };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    
    // Generate and download file
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const generatePDF = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, 14, 20);
    
    // Add subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 14, 30);
    
    // Add horizontal line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(14, 35, 196, 35);
    
    // Prepare table data
    const tableData = data
      .filter(row => row.title && !row.title.startsWith('---'))
      .map(row => [row.title, String(row.value)]);
    
    // Add table
    autoTable(doc, {
      startY: 45,
      head: [['Kriteria', 'Nilai']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229], // primary color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 100 },
      },
    });
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Diekspor pada: ${new Date().toLocaleString('id-ID')}`,
      14,
      pageHeight - 20
    );
    doc.text(
      'TenderPro - Platform Tender Konstruksi Terpercaya',
      14,
      pageHeight - 14
    );
    
    // Save PDF
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Laporan
          </DialogTitle>
          <DialogDescription>Pilih format dan data yang ingin diekspor</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Format Export</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={format === 'excel' ? 'default' : 'outline'}
                className={format === 'excel' ? 'bg-primary hover:bg-primary/90' : ''}
                onClick={() => setFormat('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </Button>
              <Button
                type="button"
                variant={format === 'pdf' ? 'default' : 'outline'}
                className={format === 'pdf' ? 'bg-primary hover:bg-primary/90' : ''}
                onClick={() => setFormat('pdf')}
              >
                <FileText className="h-4 w-4 mr-2" /> PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jenis Laporan</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ringkasan Semua</SelectItem>
                {userRole === 'OWNER' && projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
                {userRole === 'OWNER' && (
                  <SelectItem value="financial">Laporan Keuangan</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
    // Create CSV content (Excel compatible)
    const rows = [
      [title],
      [subtitle],
      [''],
      ['Judul', 'Nilai'],
      ...data.map(row => [row.title, String(row.value)]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    // Create a simple text-based report (can be opened as PDF in browsers)
    const content = [
      title,
      subtitle,
      '='.repeat(50),
      '',
      ...data.map(row => {
        if (row.title.startsWith('---')) {
          return ['', row.title, '-'.repeat(40)];
        }
        if (!row.title) return '';
        return `${row.title}: ${row.value}`;
      }),
      '',
      '='.repeat(50),
      `Diekspor pada: ${new Date().toLocaleString('id-ID')}`,
      'TenderPro - Platform Tender Konstruksi Terpercaya',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, Loader2, Table2, Check, HardDrive, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

type ExportFormat = 'pdf' | 'excel' | 'csv';
type ExportStage = 'idle' | 'exporting' | 'success' | 'error';

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  hoverBgColor: string;
  sizeEstimate: string;
  formatDetail: string;
}

export function ExportModal({
  open,
  onOpenChange,
  userId,
  userRole,
  projects = [],
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [reportType, setReportType] = useState('all');
  const [exportStage, setExportStage] = useState<ExportStage>('idle');
  const [exportProgress, setExportProgress] = useState(0);

  const formatOptions: FormatOption[] = [
    {
      id: 'excel',
      name: 'Excel',
      description: 'Spreadsheet dengan format .xlsx yang mudah diedit',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      accentColor: 'text-emerald-600',
      borderColor: 'border-emerald-400',
      bgColor: 'bg-emerald-50',
      hoverBgColor: 'hover:bg-emerald-50/50',
      sizeEstimate: '~45 KB',
      formatDetail: '.xlsx • Multi-sheet',
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Dokumen siap cetak dengan format profesional',
      icon: <FileText className="h-6 w-6" />,
      accentColor: 'text-rose-600',
      borderColor: 'border-rose-400',
      bgColor: 'bg-rose-50',
      hoverBgColor: 'hover:bg-rose-50/50',
      sizeEstimate: '~120 KB',
      formatDetail: '.pdf • Print-ready',
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Format data mentah yang kompatibel universal',
      icon: <Table2 className="h-6 w-6" />,
      accentColor: 'text-teal-600',
      borderColor: 'border-teal-400',
      bgColor: 'bg-teal-50',
      hoverBgColor: 'hover:bg-teal-50/50',
      sizeEstimate: '~25 KB',
      formatDetail: '.csv • UTF-8',
    },
  ];

  const selectedOption = formatOptions.find(f => f.id === format)!;

  const handleExport = async () => {
    setExportStage('exporting');
    setExportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
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

      clearInterval(progressInterval);
      setExportProgress(95);

      if (format === 'excel') {
        generateExcel(data.data, data.title, data.subtitle);
      } else if (format === 'pdf') {
        generatePDF(data.data, data.title, data.subtitle);
      } else {
        generateCSV(data.data, data.title, data.subtitle);
      }

      setExportProgress(100);

      // Show success state briefly
      setExportStage('success');
      toast.success(`Laporan berhasil diekspor sebagai ${format.toUpperCase()}`);

      setTimeout(() => {
        onOpenChange(false);
        setExportStage('idle');
        setExportProgress(0);
      }, 1800);
    } catch {
      setExportStage('error');
      toast.error('Gagal mengekspor laporan');
      setTimeout(() => {
        setExportStage('idle');
        setExportProgress(0);
      }, 2000);
    }
  };

  const generateExcel = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [
      [title],
      [subtitle],
      [''],
      ['Kriteria', 'Nilai'],
    ];
    data.forEach(row => {
      if (row.title && !row.title.startsWith('---')) {
        wsData.push([row.title, String(row.value)]);
      }
    });
    wsData.push(['']);
    wsData.push([`Diekspor pada: ${new Date().toLocaleString('id-ID')}`]);
    wsData.push(['TenderPro - Platform Tender Konstruksi Terpercaya']);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 40 }, { wch: 50 }];
    const headerCell1 = ws['A4'];
    const headerCell2 = ws['B4'];
    if (headerCell1) headerCell1.s = { font: { bold: true }, fill: { fgColor: { rgb: '0D9488' } } };
    if (headerCell2) headerCell2.s = { font: { bold: true }, fill: { fgColor: { rgb: '0D9488' } } };
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const generatePDF = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 30);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 35, 196, 35);
    const tableData = data
      .filter(row => row.title && !row.title.startsWith('---'))
      .map(row => [row.title, String(row.value)]);
    autoTable(doc, {
      startY: 45,
      head: [['Kriteria', 'Nilai']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 100 } },
    });
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Diekspor pada: ${new Date().toLocaleString('id-ID')}`, 14, pageHeight - 20);
    doc.text('TenderPro - Platform Tender Konstruksi Terpercaya', 14, pageHeight - 14);
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateCSV = (data: Array<{ title: string; value: string | number }>, title: string, subtitle: string) => {
    const rows = data
      .filter(row => row.title && !row.title.startsWith('---'))
      .map(row => `"${row.title}","${row.value}"`);
    const csvContent = [`${title},${subtitle}`, '', 'Kriteria,Nilai', ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-teal-600 to-emerald-700 px-6 py-6 flex-shrink-0 relative overflow-hidden">
          {/* Decorative dots */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Export Laporan</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5">
                Pilih format dan data yang ingin diekspor
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {exportStage === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-200 mb-4"
              >
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-slate-800"
              >
                Berhasil Diekspor!
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-500 mt-1"
              >
                File {selectedOption.name} sudah terunduh ke perangkat Anda
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Format Selection - Visual Cards */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Format Export
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFormat(option.id)}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all duration-200 cursor-pointer ${
                    format === option.id
                      ? `${option.borderColor} ${option.bgColor} shadow-lg ring-2 ring-offset-1`
                      : `border-slate-200 bg-white ${option.hoverBgColor} hover:border-slate-300 hover:shadow-md`
                  }`}
                  style={format === option.id ? { ringColor: 'var(--color-primary)' } : undefined}
                >
                  {format === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center shadow-md"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.div>
                  )}
                  <div className={`mx-auto mb-2 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    format === option.id ? `${option.bgColor} shadow-sm` : 'bg-slate-100'
                  } ${option.accentColor}`}>
                    {option.icon}
                  </div>
                  <p className={`text-sm font-bold ${format === option.id ? option.accentColor : 'text-slate-700'}`}>
                    {option.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{option.description}</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-slate-400">
                    <HardDrive className="h-2.5 w-2.5" />
                    <span className="font-medium">{option.sizeEstimate}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-slate-700">Jenis Laporan</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200">
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

          {/* Progress bar during export */}
          <AnimatePresence>
            {(exportStage === 'exporting' || exportStage === 'success') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    {exportStage === 'exporting' ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Sedang mengekspor...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        Selesai!
                      </>
                    )}
                  </span>
                  <span className="font-bold text-primary">{exportProgress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-teal-500 to-emerald-500 relative overflow-hidden"
                    animate={{ width: `${exportProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {/* Shimmer effect */}
                    {exportStage === 'exporting' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                </div>
                {/* File info after export */}
                {exportStage === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <div className={`w-9 h-9 rounded-lg ${selectedOption.bgColor} flex items-center justify-center ${selectedOption.accentColor}`}>
                      {selectedOption.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">Laporan_{selectedOption.name}</p>
                      <p className="text-xs text-slate-400">{selectedOption.formatDetail} • {selectedOption.sizeEstimate}</p>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50"
              disabled={exportStage === 'exporting'}
            >
              Batal
            </Button>
            <Button
              className="h-11 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleExport}
              disabled={exportStage === 'exporting'}
            >
              {exportStage === 'exporting' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengekspor...
                </span>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedOption.name}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Loader2, ExternalLink, FileText, Calendar, HardDrive, FileSearch, Share2, Trash2, CheckCircle, Clock, ZoomIn, ZoomOut, RotateCcw, History, User, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { toast } from 'sonner';
import { getRelativeTime } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  viewCount: number;
  downloadCount: number;
  isApproved: boolean;
  createdAt: string;
  project?: {
    id: string;
    title: string;
  };
  uploader?: {
    id: string;
    name: string;
    role: string;
  };
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  onDocumentUpdate?: (doc: Document) => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  KONTRAK: 'Kontrak',
  GAMBAR: 'Gambar Teknis',
  INVOICE: 'Invoice',
  SPK: 'SPK',
  RAB: 'RAB',
  LAINNYA: 'Lainnya',
};

const DOC_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  KONTRAK: { bg: 'bg-red-100', text: 'text-red-700', icon: 'bg-red-500' },
  GAMBAR: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  INVOICE: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'bg-amber-500' },
  SPK: { bg: 'bg-teal-100', text: 'text-teal-700', icon: 'bg-teal-500' },
  RAB: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'bg-orange-500' },
  LAINNYA: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'bg-slate-400' },
};

// File extension-based badge colors
function getFileExtensionBadge(url: string): { ext: string; bg: string; text: string; Icon: typeof FileText } {
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return { ext: 'PDF', bg: 'bg-red-100', text: 'text-red-700', Icon: FileText };
  if (lower.includes('.doc') || lower.includes('.docx')) return { ext: 'DOCX', bg: 'bg-teal-100', text: 'text-teal-700', Icon: FileText };
  if (lower.includes('.xls') || lower.includes('.xlsx')) return { ext: 'XLSX', bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: FileSpreadsheet };
  if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.gif') || lower.includes('.webp'))
    return { ext: 'IMG', bg: 'bg-amber-100', text: 'text-amber-700', Icon: FileImage };
  if (lower.includes('.csv')) return { ext: 'CSV', bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: FileSpreadsheet };
  return { ext: 'FILE', bg: 'bg-slate-100', text: 'text-slate-700', Icon: File };
}

// Mock version history data
function getVersionHistory(doc: Document) {
  return [
    { id: '1', version: 'v2.0', action: 'Dokumen diperbarui', date: doc.createdAt, user: doc.uploader?.name || 'Pengguna', isCurrent: false },
    { id: '2', version: 'v1.0', action: 'Dokumen diunggah', date: doc.createdAt, user: doc.uploader?.name || 'Pengguna', isCurrent: true },
  ];
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  documentId,
  onDocumentUpdate,
}: DocumentPreviewModalProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (open && documentId) {
      fetchDocument();
    } else {
      setDocument(null);
      setZoomLevel(100);
      setShowVersionHistory(false);
    }
  }, [open, documentId]);

  const fetchDocument = async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/project-documents/track?id=${documentId}`);
      const data = await response.json();

      if (response.ok && data.document) {
        setDocument(data.document);
      } else {
        toast.error('Gagal memuat dokumen');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Terjadi kesalahan saat memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    setIsDownloading(true);
    try {
      const response = await fetch('/api/project-documents/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          action: 'download'
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedDoc = {
          ...document,
          downloadCount: data.downloadCount
        };
        setDocument(updatedDoc);
        onDocumentUpdate?.(updatedDoc);
        window.open(document.fileUrl, '_blank');
        toast.success('Download dimulai...');
      } else {
        toast.error('Gagal melacak download');
        window.open(document.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error tracking download:', error);
      window.open(document.fileUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const docTypeStyle = document ? (DOC_TYPE_COLORS[document.type] || DOC_TYPE_COLORS.LAINNYA) : DOC_TYPE_COLORS.LAINNYA;
  const fileExt = document ? getFileExtensionBadge(document.fileUrl) : null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl">
            {/* Gradient header with FileText icon */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-primary via-teal-600 to-teal-800 px-6 py-6 flex-shrink-0 overflow-hidden"
            >
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -right-10 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute top-4 right-20 w-8 h-8 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
                  <FileSearch className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg font-bold text-white">Detail Dokumen</DialogTitle>
                  <DialogDescription className="text-white/70 mt-0.5">
                    Lihat detail dan unduh dokumen
                  </DialogDescription>
                </div>
                {/* File extension badge in header */}
                {fileExt && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  >
                    <Badge className={`${fileExt.bg} ${fileExt.text} border-0 text-xs font-bold px-3 py-1 shadow-sm`}>
                      <fileExt.Icon className="h-3.5 w-3.5 mr-1.5" />
                      {fileExt.ext}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : document ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 overflow-y-auto"
              >
                <div className="px-6 pb-6 pt-5 space-y-5">
                  {/* Document Title & Badges */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-xl ${docTypeStyle.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <FileText className={`h-6 w-6 ${docTypeStyle.text}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-lg truncate">{document.name}</h3>
                          {document.project && (
                            <p className="text-sm text-slate-500 mt-0.5">Proyek: {document.project.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <Badge className={`${docTypeStyle.bg} ${docTypeStyle.text} border-0 text-xs font-semibold px-2.5 py-0.5`}>
                              {DOC_TYPE_LABELS[document.type] || document.type}
                            </Badge>
                            {fileExt && (
                              <Badge className={`${fileExt.bg} ${fileExt.text} border-0 text-xs font-semibold px-2.5 py-0.5`}>
                                {fileExt.ext}
                              </Badge>
                            )}
                            {document.isApproved && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-semibold px-2.5 py-0.5">
                                <CheckCircle className="h-3 w-3 mr-1" /> Disetujui
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                          <Eye className="h-3.5 w-3.5" />
                          {document.viewCount}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                          <Download className="h-3.5 w-3.5" />
                          {document.downloadCount}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* File Info Card with Metadata */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-primary/5 to-white p-3.5 text-center hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Diunggah</p>
                      <p className="font-semibold text-xs text-slate-800 mt-0.5">
                        {getRelativeTime(document.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-teal-50/50 to-white p-3.5 text-center hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-teal-100 flex items-center justify-center">
                        <HardDrive className="h-4 w-4 text-teal-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Ukuran File</p>
                      <p className="font-semibold text-xs text-slate-800 mt-0.5">{formatFileSize(document.fileSize)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50/50 to-white p-3.5 text-center hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tipe</p>
                      <p className="font-semibold text-xs text-slate-800 mt-0.5">{document.type}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-amber-50/50 to-white p-3.5 text-center hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-amber-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Pengunggah</p>
                      <p className="font-semibold text-xs text-slate-800 mt-0.5 truncate">
                        {document.uploader?.name || 'Sistem'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Document Preview Area */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm"
                  >
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Preview Dokumen</p>
                      {/* Zoom Controls */}
                      {isImageFile(document.fileUrl) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center gap-1"
                        >
                          <button
                            onClick={handleZoomOut}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                            title="Perkecil"
                          >
                            <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
                          </button>
                          <span className="text-xs font-medium text-slate-600 w-10 text-center tabular-nums">{zoomLevel}%</span>
                          <button
                            onClick={handleZoomIn}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                            title="Perbesar"
                          >
                            <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
                          </button>
                          <button
                            onClick={handleZoomReset}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm ml-0.5"
                            title="Reset"
                          >
                            <RotateCcw className="h-3 w-3 text-slate-600" />
                          </button>
                        </motion.div>
                      )}
                    </div>
                    <div className="bg-slate-50/50 min-h-[280px] max-h-[380px] overflow-auto flex items-center justify-center p-6">
                      {isImageFile(document.fileUrl) ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="relative"
                          style={{ width: `${zoomLevel}%`, maxWidth: '100%' }}
                        >
                          <img
                            src={document.fileUrl}
                            alt={document.name}
                            className="max-w-full max-h-[360px] object-contain rounded-lg shadow-md transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                              <FileText className="h-10 w-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium mb-1">Preview tidak tersedia</p>
                            <p className="text-sm text-slate-400">Klik tombol di bawah untuk mengunduh dokumen</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-center py-8"
                        >
                          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                            {fileExt ? (
                              <fileExt.Icon className="h-10 w-10 text-slate-300" />
                            ) : (
                              <File className="h-10 w-10 text-slate-300" />
                            )}
                          </div>
                          <p className="text-slate-500 font-medium mb-1">Preview tidak tersedia</p>
                          <p className="text-sm text-slate-400">Klik tombol di bawah untuk mengunduh dokumen</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Version History */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <History className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-slate-700">Riwayat Versi</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getVersionHistory(document).length} versi</Badge>
                      </div>
                      <motion.div
                        animate={{ rotate: showVersionHistory ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Clock className="h-4 w-4 text-slate-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {showVersionHistory && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-0">
                            <div className="relative ml-4 border-l-2 border-slate-200 pl-6 space-y-4">
                              {getVersionHistory(document).map((version, idx) => (
                                <motion.div
                                  key={version.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="relative"
                                >
                                  {/* Timeline dot */}
                                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                                    version.isCurrent
                                      ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200'
                                      : 'bg-white border-slate-300'
                                  }`} />
                                  <div className={`p-3 rounded-xl border ${
                                    version.isCurrent
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : 'bg-white border-slate-100'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${version.isCurrent ? 'text-emerald-700' : 'text-slate-500'}`}>
                                          {version.version}
                                        </span>
                                        {version.isCurrent && (
                                          <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0">
                                            Saat Ini
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400">{getRelativeTime(version.date)}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{version.action}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">oleh {version.user}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100"
                  >
                    <Button
                      variant="outline"
                      onClick={() => window.open(document.fileUrl, '_blank')}
                      className="h-10 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka di Tab Baru
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 border-slate-200 text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200 shadow-sm"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Bagikan
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                    <div className="flex-1" />
                    <Button
                      className="h-10 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengunduh...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Dokumen
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-500">Dokumen tidak ditemukan</p>
              </div>
            )}
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

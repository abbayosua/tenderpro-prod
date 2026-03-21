'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, X, Loader2, ExternalLink, FileText, Calendar, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

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

const DOC_TYPE_COLORS: Record<string, string> = {
  KONTRAK: 'bg-blue-100 text-blue-700',
  GAMBAR: 'bg-green-100 text-green-700',
  INVOICE: 'bg-yellow-100 text-yellow-700',
  SPK: 'bg-purple-100 text-purple-700',
  RAB: 'bg-orange-100 text-orange-700',
  LAINNYA: 'bg-slate-100 text-slate-700',
};

export function DocumentPreviewModal({
  open,
  onOpenChange,
  documentId,
  onDocumentUpdate,
}: DocumentPreviewModalProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (open && documentId) {
      fetchDocument();
    } else {
      setDocument(null);
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
      // Track the download
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
        // Update local state with new counts
        const updatedDoc = {
          ...document,
          downloadCount: data.downloadCount
        };
        setDocument(updatedDoc);
        onDocumentUpdate?.(updatedDoc);

        // Open the file URL in new tab for download
        window.open(document.fileUrl, '_blank');
        toast.success('Download dimulai...');
      } else {
        toast.error('Gagal melacak download');
        // Still try to open the file
        window.open(document.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error tracking download:', error);
      // Still try to open the file
      window.open(document.fileUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail Dokumen
          </DialogTitle>
          <DialogDescription>
            Lihat detail dan unduh dokumen
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : document ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Document Info */}
            <div className="flex flex-wrap items-start justify-between gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{document.name}</h3>
                  <Badge className={DOC_TYPE_COLORS[document.type] || 'bg-slate-100 text-slate-700'}>
                    {DOC_TYPE_LABELS[document.type] || document.type}
                  </Badge>
                </div>
                {document.project && (
                  <p className="text-sm text-slate-600">Proyek: {document.project.title}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{document.viewCount} dilihat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{document.downloadCount} diunduh</span>
                </div>
              </div>
            </div>

            {/* Document Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Diunggah</p>
                  <p className="font-medium text-sm">{formatDate(document.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <HardDrive className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Ukuran</p>
                  <p className="font-medium text-sm">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`font-medium text-sm ${document.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                    {document.isApproved ? 'Disetujui' : 'Menunggu'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b">
                <p className="font-medium text-sm">Preview</p>
              </div>
              <div className="bg-slate-50 min-h-[300px] max-h-[400px] overflow-auto flex items-center justify-center p-4">
                {isImageFile(document.fileUrl) ? (
                  <img
                    src={document.fileUrl}
                    alt={document.name}
                    className="max-w-full max-h-[380px] object-contain rounded shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {!isImageFile(document.fileUrl) && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Preview tidak tersedia</p>
                    <p className="text-sm text-slate-400">Klik tombol di bawah untuk mengunduh dokumen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => window.open(document.fileUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka di Tab Baru
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
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
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">Dokumen tidak ditemukan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

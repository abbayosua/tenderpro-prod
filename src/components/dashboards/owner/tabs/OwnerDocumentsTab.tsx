'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { FolderOpen, Camera, Download, FileText, CheckCircle, Clock, Eye, Upload } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/modals/DocumentPreviewModal';
import type { OwnerDocumentsTabProps, OwnerDocument } from './types';

const DOC_TYPE_COLORS: Record<string, string> = {
  KONTRAK: 'bg-blue-100 text-blue-700',
  GAMBAR: 'bg-green-100 text-green-700',
  INVOICE: 'bg-yellow-100 text-yellow-700',
  SPK: 'bg-purple-100 text-purple-700',
  RAB: 'bg-orange-100 text-orange-700',
};

export function OwnerDocumentsTab({
  ownerStats,
  allProjectDocuments,
  filterDocType,
  setFilterDocType,
  filterDocProject,
  setFilterDocProject,
  webcamModalOpen,
  setWebcamModalOpen,
  onDocumentUpload,
}: OwnerDocumentsTabProps) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<OwnerDocument[]>(allProjectDocuments ?? []);
  const projects = ownerStats?.projects ?? [];

  const filteredDocuments = documents.filter(doc => {
    if (filterDocType !== 'all' && doc.type !== filterDocType) return false;
    if (filterDocProject !== 'all' && doc.projectId !== filterDocProject) return false;
    return true;
  });

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleViewDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setPreviewModalOpen(true);
  };

  const handleDocumentUpdate = (updatedDoc: OwnerDocument) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id
        ? { ...doc, viewCount: updatedDoc.viewCount, downloadCount: updatedDoc.downloadCount }
        : doc
    ));
  };

  // Sync documents with props when they change
  const syncDocuments = () => {
    setDocuments(allProjectDocuments);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Dokumen Proyek
              </CardTitle>
              <CardDescription>Kelola semua dokumen proyek Anda</CardDescription>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setWebcamModalOpen(true)}>
              <Camera className="h-4 w-4 mr-2" /> Foto & Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterDocType} onValueChange={setFilterDocType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="KONTRAK">Kontrak</SelectItem>
                <SelectItem value="GAMBAR">Gambar Teknis</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="SPK">SPK</SelectItem>
                <SelectItem value="RAB">RAB</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDocProject} onValueChange={setFilterDocProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Proyek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Proyek</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium mb-1">Belum ada dokumen</p>
              <p className="text-sm text-slate-400 mb-4">Dokumen proyek akan muncul di sini setelah diunggah</p>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setWebcamModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Unggah Dokumen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${DOC_TYPE_COLORS[doc.type] || 'bg-slate-100 text-slate-600'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{doc.project} • {formatFileSize(doc.fileSize)}</span>
                        {(doc.viewCount !== undefined || doc.downloadCount !== undefined) && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {doc.viewCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" /> {doc.downloadCount || 0}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.isApproved ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" /> Disetujui
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-yellow-600">
                        <Clock className="h-4 w-4" /> Menunggu
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Lihat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Quick download
                        fetch('/api/project-documents/track', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ documentId: doc.id, action: 'download' })
                        }).then(() => {
                          window.open(doc.fileUrl, '_blank');
                          handleDocumentUpdate({
                            ...doc,
                            downloadCount: (doc.downloadCount || 0) + 1
                          });
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        documentId={selectedDocumentId}
        onDocumentUpdate={handleDocumentUpdate}
      />
    </>
  );
}

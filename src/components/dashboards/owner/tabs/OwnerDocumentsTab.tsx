'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { FolderOpen, Camera, Download, FileText, CheckCircle, Clock, Eye, Upload, MoreHorizontal, Trash2, Share2 } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/modals/DocumentPreviewModal';
import type { OwnerDocumentsTabProps, OwnerDocument } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/helpers';

// Gradient badge styles per document type
const DOC_TYPE_STYLES: Record<string, { badge: string; icon: string; label: string }> = {
  KONTRAK: {
    badge: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
    icon: 'from-purple-100 to-violet-100 text-purple-600',
    label: 'Kontrak',
  },
  GAMBAR: {
    badge: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
    icon: 'from-teal-100 to-cyan-100 text-teal-600',
    label: 'Gambar',
  },
  INVOICE: {
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
    icon: 'from-amber-100 to-yellow-100 text-amber-600',
    label: 'Invoice',
  },
  SPK: {
    badge: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    icon: 'from-emerald-100 to-green-100 text-emerald-600',
    label: 'SPK',
  },
  RAB: {
    badge: 'bg-gradient-to-r from-orange-500 to-red-400 text-white',
    icon: 'from-orange-100 to-red-100 text-orange-600',
    label: 'RAB',
  },
};

// File size color coding
function getFileSizeColor(kb: number): string {
  if (kb < 500) return 'text-emerald-600'; // Small: green
  if (kb < 5000) return 'text-amber-600'; // Medium: amber
  return 'text-red-500'; // Large: red
}

function getFileSizeBg(kb: number): string {
  if (kb < 500) return 'bg-emerald-50';
  if (kb < 5000) return 'bg-amber-50';
  return 'bg-red-50';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
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

  const handleDocumentUpdate = (updatedDoc: any) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === updatedDoc.id
        ? { ...doc, viewCount: updatedDoc.viewCount, downloadCount: updatedDoc.downloadCount }
        : doc
    ));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                Dokumen Proyek
              </CardTitle>
              <CardDescription className="mt-1">Kelola semua dokumen proyek Anda</CardDescription>
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 h-10"
              onClick={() => setWebcamModalOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" /> Foto & Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filter stats row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {documents.length > 0 && (
                <span className="text-xs text-slate-400">
                  {filteredDocuments.length} dari {documents.length} dokumen
                </span>
              )}
              {/* Mini stat chips */}
              {documents.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  {Object.entries(DOC_TYPE_STYLES).map(([type, style]) => {
                    const count = documents.filter(d => d.type === type).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={type}
                        className={`${style.badge} text-[10px] font-medium px-2 py-0.5 rounded-full`}
                      >
                        {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <Select value={filterDocType} onValueChange={setFilterDocType}>
              <SelectTrigger className="w-full sm:w-48 h-10">
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
              <SelectTrigger className="w-full sm:w-48 h-10">
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FolderOpen className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-700 font-semibold text-lg mb-1">Belum ada dokumen</p>
              <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">Dokumen proyek akan muncul di sini setelah diunggah</p>
              <Button className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 h-10" onClick={() => setWebcamModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Unggah Dokumen
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredDocuments.map((doc) => {
                const style = DOC_TYPE_STYLES[doc.type] || {
                  badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
                  icon: 'from-slate-100 to-slate-50 text-slate-500',
                  label: doc.type,
                };

                return (
                  <motion.div
                    key={doc.id}
                    variants={rowVariants}
                    layout
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.15 }}
                    className="group relative flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 bg-white transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    {/* Subtle left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
                      doc.type === 'KONTRAK' ? 'from-purple-500 to-violet-500' :
                      doc.type === 'GAMBAR' ? 'from-teal-500 to-cyan-500' :
                      doc.type === 'INVOICE' ? 'from-amber-500 to-yellow-500' :
                      doc.type === 'SPK' ? 'from-emerald-500 to-green-500' :
                      doc.type === 'RAB' ? 'from-orange-500 to-red-400' :
                      'from-slate-300 to-slate-400'
                    } rounded-l-xl`} />

                    <div className="flex items-center gap-4 pl-3 min-w-0 flex-1">
                      {/* Icon container with gradient */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.icon} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
                          {/* Type badge */}
                          <span className={`${style.badge} text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0`}>
                            {style.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="text-slate-400">{doc.project}</span>
                          <span className="text-slate-200">•</span>
                          {/* File size with color coding */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${getFileSizeBg(doc.fileSize)} ${getFileSizeColor(doc.fileSize)} text-xs font-medium`}>
                            {formatFileSize(doc.fileSize)}
                          </span>
                          {/* Upload date with relative time */}
                          <span className="text-slate-400 text-xs">
                            {doc.createdAt && getRelativeTime(doc.createdAt)}
                          </span>
                          {(doc.viewCount !== undefined || doc.downloadCount !== undefined) && (
                            <>
                              <span className="text-slate-200">•</span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Eye className="h-3 w-3" /> {doc.viewCount || 0}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Download className="h-3 w-3" /> {doc.downloadCount || 0}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: status + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status indicator */}
                      {doc.isApproved ? (
                        <motion.span
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Disetujui
                        </motion.span>
                      ) : (
                        <motion.span
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100"
                        >
                          <Clock className="h-3.5 w-3.5 animate-pulse" /> Menunggu
                        </motion.span>
                      )}

                      {/* Slide-in action buttons on hover */}
                      <div className="flex items-center gap-1.5 overflow-hidden max-w-0 group-hover:max-w-[200px] transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mobile: always show a more button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 sm:hidden rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
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

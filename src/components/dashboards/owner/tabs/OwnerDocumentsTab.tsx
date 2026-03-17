'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { FolderOpen, Camera, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import type { OwnerDocumentsTabProps } from './types';

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
}: OwnerDocumentsTabProps) {
  const filteredDocuments = allProjectDocuments.filter(doc => {
    if (filterDocType !== 'all' && doc.type !== filterDocType) return false;
    if (filterDocProject !== 'all' && doc.projectId !== filterDocProject) return false;
    return true;
  });

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
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
              {ownerStats.projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">Belum ada dokumen</p>
            <p className="text-sm text-slate-400">Dokumen proyek akan muncul di sini setelah diunggah</p>
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
                    <p className="text-sm text-slate-500">{doc.project} • {formatFileSize(doc.fileSize)}</p>
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
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

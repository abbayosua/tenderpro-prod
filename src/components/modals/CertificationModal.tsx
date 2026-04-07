'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, FileCheck, Shield, Plus, Check, Loader2, Calendar, Building2, FileText, X, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Certification {
  id?: string;
  userId?: string;
  type: string;
  number: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string | null;
  fileUrl: string;
  verified?: boolean;
  createdAt?: string;
}

interface CertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const certificationTypes = [
  { value: 'SIUJK', label: 'SIUJK', description: 'Surat Izin Usaha Jasa Konstruksi', color: 'bg-blue-500' },
  { value: 'SBU', label: 'SBU', description: 'Sertifikat Badan Usaha', color: 'bg-emerald-500' },
  { value: 'SKA', label: 'SKA', description: 'Sertifikat Keahlian Asing', color: 'bg-violet-500' },
  { value: 'SKT', label: 'SKT', description: 'Sertifikat Keahlian Teknik', color: 'bg-amber-500' },
  { value: 'ISO 9001', label: 'ISO 9001', description: 'Manajemen Mutu', color: 'bg-cyan-500' },
  { value: 'ISO 14001', label: 'ISO 14001', description: 'Manajemen Lingkungan', color: 'bg-teal-500' },
  { value: 'SMK3', label: 'SMK3', description: 'Sistem Manajemen K3', color: 'bg-red-500' },
  { value: 'Lainnya', label: 'Lainnya', description: 'Sertifikasi lainnya', color: 'bg-slate-500' },
];

function getCertTypeColor(type: string): string {
  return certificationTypes.find(c => c.value === type)?.color || 'bg-slate-500';
}

function getCertTypeDescription(type: string): string {
  return certificationTypes.find(c => c.value === type)?.description || type;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function CertificationModal({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: CertificationModalProps) {
  const [activeTab, setActiveTab] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const [formData, setFormData] = useState({
    type: '',
    number: '',
    issuedBy: '',
    issuedAt: '',
    expiresAt: '',
    fileUrl: '',
  });

  const resetForm = useCallback(() => {
    setFormData({
      type: '',
      number: '',
      issuedBy: '',
      issuedAt: '',
      expiresAt: '',
      fileUrl: '',
    });
  }, []);

  const fetchCertifications = useCallback(async () => {
    if (!userId) return;
    setIsLoadingCerts(true);
    try {
      const response = await fetch(`/api/certifications?userId=${userId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.certifications)) {
        setCertifications(data.certifications);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setIsLoadingCerts(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      fetchCertifications();
    }
  }, [open, fetchCertifications]);

  useEffect(() => {
    if (open) {
      resetForm();
      setActiveTab('add');
    }
  }, [open, resetForm]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.type) {
      toast.error('Jenis sertifikasi wajib dipilih');
      return;
    }
    if (!formData.number.trim()) {
      toast.error('Nomor sertifikasi wajib diisi');
      return;
    }
    if (!formData.issuedBy.trim()) {
      toast.error('Penerbit sertifikasi wajib diisi');
      return;
    }
    if (!formData.issuedAt) {
      toast.error('Tanggal terbit wajib diisi');
      return;
    }
    if (!formData.fileUrl.trim()) {
      toast.error('URL file sertifikasi wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: formData.type,
          number: formData.number.trim(),
          issuedBy: formData.issuedBy.trim(),
          issuedAt: formData.issuedAt,
          expiresAt: formData.expiresAt || null,
          fileUrl: formData.fileUrl.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Sertifikasi berhasil ditambahkan!');
        resetForm();
        fetchCertifications();
        onSuccess();
        setActiveTab('list');
      } else {
        throw new Error(data.error || 'Gagal menambahkan sertifikasi');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menambahkan sertifikasi';
      console.error('Submit error:', error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-5 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg"
            >
              <Award className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-white">
                Sertifikasi
              </DialogTitle>
              <DialogDescription className="text-white/60 mt-0.5">
                Kelola sertifikasi dan lisensi usaha Anda
              </DialogDescription>
            </div>
            {/* Cert count badge in header */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Total</p>
                <p className="text-sm font-bold text-white">{certifications.length}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Terverifikasi</p>
                <p className="text-sm font-bold text-emerald-400">
                  {certifications.filter(c => c.verified).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-0">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-11 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="add"
                className="flex-1 h-9 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Sertifikasi
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex-1 h-9 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 transition-all duration-200"
              >
                <FileCheck className="h-4 w-4 mr-1.5" />
                Sertifikasi Saya
                {certifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] font-bold">
                    {certifications.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Add Certification Form */}
            <TabsContent value="add" className="mt-5 space-y-5">
              {/* Section: Informasi Sertifikasi */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full" />
                  Informasi Sertifikasi
                </h3>

                {/* Jenis Sertifikasi */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Award className="h-3.5 w-3.5 text-slate-400" /> Jenis Sertifikasi *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleFieldChange('type', value)}
                  >
                    <SelectTrigger className="w-full h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200">
                      <SelectValue placeholder="Pilih jenis sertifikasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificationTypes.map((certType) => (
                        <SelectItem key={certType.value} value={certType.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${certType.color}`} />
                            <span>{certType.label}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              &middot; {certType.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.type && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-slate-500 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3 text-primary" /> {getCertTypeDescription(formData.type)}
                    </motion.p>
                  )}
                </div>

                {/* Nomor Sertifikasi */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Shield className="h-3.5 w-3.5 text-slate-400" /> Nomor Sertifikasi *
                  </Label>
                  <Input
                    placeholder="Contoh: SIUJK-2024-00123"
                    value={formData.number}
                    onChange={(e) => handleFieldChange('number', e.target.value)}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                </div>

                {/* Diterbitkan Oleh */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" /> Diterbitkan Oleh *
                  </Label>
                  <Input
                    placeholder="Contoh: Kementerian PUPR"
                    value={formData.issuedBy}
                    onChange={(e) => handleFieldChange('issuedBy', e.target.value)}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                </div>
              </motion.div>

              {/* Section: Tanggal */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-teal-500 rounded-full" />
                  Periode Berlaku
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Tanggal Terbit *
                    </Label>
                    <Input
                      type="date"
                      value={formData.issuedAt}
                      onChange={(e) => handleFieldChange('issuedAt', e.target.value)}
                      className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Tanggal Kadaluarsa
                    </Label>
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => handleFieldChange('expiresAt', e.target.value)}
                      className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                    />
                    <p className="text-[10px] text-slate-400">Kosongkan jika tidak berakhir</p>
                  </div>
                </div>
              </motion.div>

              {/* Section: File */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  Dokumen Sertifikasi
                </h3>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> URL File Sertifikasi *
                  </Label>
                  <Input
                    placeholder="https://contoh.com/file-sertifikasi.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => handleFieldChange('fileUrl', e.target.value)}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                  <p className="text-[10px] text-slate-400">
                    Masukkan URL file scan atau dokumen sertifikasi Anda
                  </p>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex justify-between pt-5 border-t border-slate-100"
              >
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Batal
                </Button>
                <Button
                  className="h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Tambah Sertifikasi
                </Button>
              </motion.div>
            </TabsContent>

            {/* Tab 2: My Certifications List */}
            <TabsContent value="list" className="mt-5">
              {isLoadingCerts ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-3"
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-slate-500">Memuat sertifikasi...</p>
                </motion.div>
              ) : certifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                    <Award className="h-8 w-8 text-amber-300" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Belum ada sertifikasi</p>
                    <p className="text-xs text-slate-400 max-w-[260px]">
                      Tambahkan sertifikasi untuk meningkatkan kepercayaan klien terhadap usaha Anda
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('add')}
                    className="h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all duration-200 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Tambah Pertama
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 font-medium">
                      {certifications.length} sertifikasi terdaftar
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('add')}
                      className="h-8 text-xs border-slate-200 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Baru
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <AnimatePresence>
                      {certifications.map((cert, idx) => {
                        const expired = isExpired(cert.expiresAt);
                        const daysLeft = daysUntilExpiry(cert.expiresAt);
                        return (
                          <motion.div
                            key={cert.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -2 }}
                            className={`p-4 rounded-xl border bg-white transition-all duration-300 ${
                              expired
                                ? 'border-red-200 bg-red-50/30'
                                : 'border-slate-200 hover:border-primary/30 hover:shadow-sm'
                            }`}
                          >
                            {/* Top row: badge + number + status */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge
                                  className={`${getCertTypeColor(cert.type)} text-white text-[10px] font-bold px-2 py-0.5 border-0 shrink-0`}
                                >
                                  {cert.type}
                                </Badge>
                                <span className="text-sm font-semibold text-slate-800 truncate">
                                  {cert.number}
                                </span>
                              </div>
                              {cert.verified ? (
                                <Badge variant="outline" className="shrink-0 text-[10px] font-medium text-emerald-600 border-emerald-200 bg-emerald-50">
                                  <Check className="h-3 w-3 mr-0.5" />
                                  Terverifikasi
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="shrink-0 text-[10px] font-medium text-amber-600 border-amber-200 bg-amber-50">
                                  <Clock className="h-3 w-3 mr-0.5" />
                                  Menunggu
                                </Badge>
                              )}
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              {/* Issuer */}
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{cert.issuedBy}</span>
                              </div>

                              {/* Dates */}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>Terbit: {formatDate(cert.issuedAt)}</span>
                                </div>
                                {cert.expiresAt && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className={expired ? 'text-red-500 font-medium' : 'text-slate-500'}>
                                      Kadaluarsa: {formatDate(cert.expiresAt)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Expiry warning */}
                              {expired && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center gap-1.5 text-[10px] text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Sertifikasi telah kadaluarsa
                                </motion.div>
                              )}

                              {!expired && daysLeft !== null && daysLeft <= 90 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md"
                                >
                                  <Clock className="h-3 w-3" />
                                  Segera kadaluarsa dalam {daysLeft} hari
                                </motion.div>
                              )}
                            </div>

                            {/* File link */}
                            {cert.fileUrl && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <a
                                  href={cert.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors duration-200"
                                >
                                  <FileText className="h-3 w-3" />
                                  Lihat Dokumen
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

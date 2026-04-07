'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Camera, X, Check, Loader2, Image as ImageIcon, Plus, Trash2, FolderOpen, Upload, MapPin, Calendar, DollarSign, FileText, Building2, User, Briefcase, ZoomIn, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Portfolio {
  id?: string;
  title: string;
  description: string;
  category: string;
  clientName?: string;
  location?: string;
  year: number;
  budget?: number;
  images: string[];
}

interface PortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: Portfolio | null;
  userId: string;
  onSuccess: () => void;
}

const categoryIcons: Record<string, string> = {
  'Pembangunan Baru': '🏗️',
  'Renovasi': '🔧',
  'Interior': '🎨',
  'Komersial': '🏢',
  'Infrastruktur': '🛣️',
  'Lainnya': '📦',
};

const categories = Object.keys(categoryIcons);

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBudgetInput(value: string): string {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('id-ID');
}

export function PortfolioModal({
  open,
  onOpenChange,
  portfolio,
  userId,
  onSuccess,
}: PortfolioModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [budgetDisplay, setBudgetDisplay] = useState('');

  const [formData, setFormData] = useState<Portfolio>({
    title: '',
    description: '',
    category: 'Pembangunan Baru',
    clientName: '',
    location: '',
    year: new Date().getFullYear(),
    budget: undefined,
    images: [],
  });

  useEffect(() => {
    if (open) {
      if (portfolio) {
        setFormData({ ...portfolio, images: portfolio.images || [] });
        setBudgetDisplay(portfolio.budget ? formatBudgetInput(String(portfolio.budget)) : '');
      } else {
        setFormData({
          title: '', description: '', category: 'Pembangunan Baru',
          clientName: '', location: '', year: new Date().getFullYear(),
          budget: undefined, images: [],
        });
        setBudgetDisplay('');
      }
    }
  }, [open, portfolio]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Tidak dapat mengakses kamera');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const addImage = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage.split(',')[1] }),
      });
      const data = await response.json();
      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, data.url] }));
        setCapturedImage(null);
        setShowCamera(false);
        toast.success('Gambar ditambahkan!');
      } else {
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul portofolio wajib diisi');
      return;
    }
    setIsUploading(true);
    try {
      const url = portfolio?.id ? `/api/portfolios?portfolioId=${portfolio.id}` : '/api/portfolios';
      const method = portfolio?.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, portfolioId: portfolio?.id, ...formData, budget: formData.budget || null }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(portfolio?.id ? 'Portofolio diperbarui!' : 'Portofolio ditambahkan!');
        onSuccess();
        handleClose();
      } else {
        throw new Error(data.error || 'Gagal menyimpan portofolio');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan portofolio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setShowCamera(false);
    setShowCategoryPicker(false);
    onOpenChange(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const maxImages = 6;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-5 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg"
            >
              <Briefcase className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-white">
                {portfolio?.id ? 'Edit Portofolio' : 'Tambah Portofolio Baru'}
              </DialogTitle>
              <DialogDescription className="text-white/60 mt-0.5">
                Tampilkan hasil kerja Anda untuk menarik klien
              </DialogDescription>
            </div>
            {/* Stats in header */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Foto</p>
                <p className="text-sm font-bold text-white">{formData.images.length}/{maxImages}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Kategori</p>
                <p className="text-sm font-medium text-white/80">{categoryIcons[formData.category]}</p>
              </div>
            </div>
          </div>
          {/* Progress bar at bottom of header */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${formData.title ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                {formData.title ? <Check className="h-3 w-3" /> : '1'}
              </div>
              <span className="text-[10px] text-white/40 hidden sm:inline">Info</span>
            </div>
            <div className={`flex-1 h-0.5 ${formData.title ? 'bg-gradient-to-r from-emerald-500 to-primary/30' : 'bg-white/10'}`} />
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${formData.images.length > 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                {formData.images.length > 0 ? <Check className="h-3 w-3" /> : '2'}
              </div>
              <span className="text-[10px] text-white/40 hidden sm:inline">Foto</span>
            </div>
            <div className={`flex-1 h-0.5 ${formData.images.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-primary/30' : 'bg-white/10'}`} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px] font-bold">
                3
              </div>
              <span className="text-[10px] text-white/40 hidden sm:inline">Kirim</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Section: Informasi Proyek */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              Informasi Proyek
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Judul Proyek *
                </Label>
                <Input
                  placeholder="Contoh: Rumah Mewah 2 Lantai"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Deskripsi
                </Label>
                <Textarea
                  placeholder="Jelaskan detail proyek..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Kategori & Detail */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-teal-500 rounded-full" />
              Kategori & Detail
            </h3>

            {/* Category Selector with Emoji */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-400" /> Kategori Proyek
              </Label>
              <div className="relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="w-full h-11 border border-slate-200 rounded-md px-3 flex items-center justify-between hover:border-primary/40 transition-all duration-200 bg-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{categoryIcons[formData.category]}</span>
                    <span className="text-sm font-medium">{formData.category}</span>
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showCategoryPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </motion.button>
                <AnimatePresence>
                  {showCategoryPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: cat }));
                            setShowCategoryPicker(false);
                          }}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors duration-150 ${
                            formData.category === cat ? 'bg-primary/10' : ''
                          }`}
                        >
                          <span className="text-lg">{categoryIcons[cat]}</span>
                          <span className={`text-sm ${formData.category === cat ? 'font-semibold text-primary' : 'text-slate-700'}`}>{cat}</span>
                          {formData.category === cat && <Check className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Tahun
                </Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> Lokasi
                </Label>
                <Input
                  placeholder="Opsional"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Nama Klien
                </Label>
                <Input
                  placeholder="Opsional"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Anggaran (Rp)
                </Label>
                <Input
                  placeholder="Opsional"
                  value={budgetDisplay}
                  onChange={(e) => {
                    const formatted = formatBudgetInput(e.target.value);
                    setBudgetDisplay(formatted);
                    const num = formatted.replace(/\./g, '').replace(/,/g, '');
                    setFormData(prev => ({ ...prev, budget: num ? parseInt(num) : undefined }));
                  }}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 text-lg font-semibold"
                />
              </div>
            </div>
            {/* Real-time Rupiah formatting */}
            {formData.budget && formData.budget > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> ≈ {formatRupiah(formData.budget)}
              </motion.p>
            )}
          </div>

          {/* Section: Foto Proyek */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              Foto Proyek
              <span className="text-xs font-normal text-slate-400 normal-case">{formData.images.length}/{maxImages} foto</span>
            </h3>

            {/* Image Grid Preview */}
            <AnimatePresence>
              {formData.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-3 sm:grid-cols-4 gap-3"
                >
                  {formData.images.map((img, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.2)' }}
                      className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200 hover:ring-primary/40 transition-all duration-300"
                    >
                      <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Zoom icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <ZoomIn className="h-4 w-4 text-slate-700" />
                        </div>
                      </div>
                      {/* Bottom label */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-[10px] font-medium">Foto {idx + 1}{idx === 0 ? ' &middot; Utama' : ''}</span>
                          {idx === 0 && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                            onClick={() => setDeleteTarget(idx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Foto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeImage(idx)} className="bg-red-500 hover:bg-red-600 text-white">
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        Foto {idx + 1}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Area */}
            <AnimatePresence mode="wait">
              {!showCamera && !capturedImage && formData.images.length < maxImages && (
                <motion.button
                  key="upload-btn"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.005, borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px var(--color-primary/10)' }}
                  whileTap={{ scale: 0.995 }}
                  className="w-full h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden"
                  onClick={() => setShowCamera(true)}
                >
                  {/* Animated border pattern */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary/8) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  </div>
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-teal-500/10 group-hover:from-primary/20 group-hover:to-teal-500/20 flex items-center justify-center transition-colors duration-300 shadow-sm">
                    <Upload className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div className="relative text-center">
                    <span className="text-sm text-slate-500 group-hover:text-primary font-semibold transition-colors duration-300 block">
                      Unggah Foto Proyek
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-primary/60 block mt-0.5">
                      Klik untuk membuka kamera
                    </span>
                  </div>
                </motion.button>
              )}

              {/* Camera Preview */}
              {showCamera && (
                <motion.div
                  key="camera-preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video ring-2 ring-slate-200">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        {isStreaming && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="w-14 h-14 rounded-full bg-white text-slate-900 shadow-lg shadow-black/30 flex items-center justify-center ring-4 ring-white/30" onClick={captureImage}>
                              <Camera className="h-6 w-6" />
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {capturedImage ? (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-11 border-slate-200 hover:bg-slate-50 transition-all duration-200" onClick={() => { setCapturedImage(null); startCamera(); }}>
                        <ImageIcon className="h-4 w-4 mr-2" /> Ambil Ulang
                      </Button>
                      <Button className="flex-1 h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200" onClick={addImage} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        Tambahkan
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowCamera(false)} className="h-11 border-slate-200 hover:bg-slate-50 transition-all duration-200">Batal</Button>
                      <Button className="flex-1 h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200" onClick={captureImage} disabled={!isStreaming}>
                        <Camera className="h-4 w-4 mr-2" /> Ambil Foto
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-5 border-t border-slate-100">
            <Button variant="ghost" onClick={handleClose} className="text-slate-500 hover:text-slate-700">
              Batal
            </Button>
            <Button
              className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleSubmit}
              disabled={isUploading || !formData.title.trim()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {portfolio?.id ? 'Simpan Perubahan' : 'Tambah Portofolio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

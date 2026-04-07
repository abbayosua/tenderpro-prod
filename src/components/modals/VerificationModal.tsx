'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, FileCheck, FileText, Camera, SwitchCamera, Check, Loader2, Image as ImageIcon, 
  AlertCircle, X, ShieldCheck, Upload, CreditCard, Building2, FileBadge, Receipt,
  BadgeCheck, CircleDot, Sparkles, CheckCircle2, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { UserDocument } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: string;
  setDocType: (value: string) => void;
  docName: string;
  setDocName: (value: string) => void;
  documents: UserDocument[];
  onUpload: (fileUrl: string) => Promise<boolean>;
  onRequestVerification: () => void;
}

// Enhanced document type cards with specific icons per type
const docTypeCards = [
  {
    type: 'KTP',
    label: 'KTP',
    description: 'Kartu Tanda Penduduk Wajib',
    icon: CreditCard,
    gradient: 'from-emerald-400 to-green-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    activeBorder: 'border-emerald-400',
    activeShadow: 'shadow-emerald-200/60',
    hoverBorder: 'hover:border-emerald-300',
  },
  {
    type: 'NPWP',
    label: 'NPWP',
    description: 'Nomor Pokok Wajib Pajak',
    icon: Receipt,
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    activeBorder: 'border-amber-400',
    activeShadow: 'shadow-amber-200/60',
    hoverBorder: 'hover:border-amber-300',
  },
  {
    type: 'SIUJK',
    label: 'SIUJK',
    description: 'Surat Izin Usaha Jasa Konstruksi',
    icon: BadgeCheck,
    gradient: 'from-teal-400 to-cyan-500',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    activeBorder: 'border-teal-400',
    activeShadow: 'shadow-teal-200/60',
    hoverBorder: 'hover:border-teal-300',
  },
  {
    type: 'SBU',
    label: 'SBU',
    description: 'Sertifikat Badan Usaha',
    icon: FileBadge,
    gradient: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    activeBorder: 'border-violet-400',
    activeShadow: 'shadow-violet-200/60',
    hoverBorder: 'hover:border-violet-300',
  },
];

// Enhanced step definitions
const verificationSteps = [
  { 
    label: 'Unggah Dokumen', 
    description: 'Pilih jenis dan unggah dokumen',
    icon: Upload,
  },
  { 
    label: 'Review', 
    description: 'Tim kami meninjau dokumen Anda',
    icon: Eye,
  },
  { 
    label: 'Terverifikasi', 
    description: 'Akun Anda telah terverifikasi',
    icon: ShieldCheck,
  },
];

// Requirements checklist items
const requirementsList = [
  { id: 'clear', label: 'Dokumen terbaca dengan jelas', description: 'Pastikan teks tidak blur' },
  { id: 'complete', label: 'Seluruh bagian dokumen tampak', description: 'Tidak terpotong pinggirnya' },
  { id: 'valid', label: 'Dokumen masih berlaku', description: 'Tidak kadaluwarsa' },
  { id: 'original', label: 'Foto asli (bukan scan/copy)', description: 'Kualitas terbaik' },
];

export function VerificationModal({
  open,
  onOpenChange,
  docType,
  setDocType,
  docName,
  setDocName,
  documents,
  onUpload,
  onRequestVerification,
}: VerificationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [checkedRequirements, setCheckedRequirements] = useState<Set<string>>(new Set());

  // Determine current step based on documents
  const currentStep = documents.length === 0 ? 0 : documents.some(d => d.verified) ? 2 : 1;

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Camera error:', error);
      setHasCameraPermission(false);
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  }, [facingMode]);

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

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Handle file input change (for desktop upload)
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const toggleRequirement = (id: string) => {
    setCheckedRequirements(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allRequirementsChecked = checkedRequirements.size === requirementsList.length;

  const handleUpload = async () => {
    if (!capturedImage || !docName.trim()) {
      toast.error('Mohon lengkapi semua data dan ambil foto dokumen');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage.split(',')[1] }),
      });
      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.success && data.url) {
        const success = await onUpload(data.url);
        if (success) {
          toast.success('Dokumen berhasil diunggah!');
          setTimeout(() => handleClose(), 500);
        }
      } else {
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      clearInterval(progressInterval);
      toast.error('Gagal mengunggah dokumen. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setShowCamera(false);
    setIsDragOver(false);
    setDocName('');
    setCheckedRequirements(new Set());
    onOpenChange(false);
  };

  useEffect(() => {
    if (showCamera && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!showCamera) stopCamera();
    };
  }, [showCamera, capturedImage, startCamera, stopCamera]);

  useEffect(() => {
    if (showCamera && isStreaming) {
      stopCamera();
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [facingMode, showCamera, isStreaming, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
        {/* Enhanced Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 px-6 py-6 flex-shrink-0 relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', 
            backgroundSize: '20px 20px' 
          }} />
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-4">
              {/* Shield Icon with gradient ring */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <ShieldCheck className="h-7 w-7 text-white" />
                </motion.div>
                {/* Sparkle accents */}
                <motion.div
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-1 -right-1 w-3 h-3"
                >
                  <Sparkles className="h-3 w-3 text-amber-300" />
                </motion.div>
              </div>
              
              <div>
                <DialogTitle className="text-xl font-bold text-white">Verifikasi Akun</DialogTitle>
                <DialogDescription className="text-white/50 mt-0.5 text-sm">
                  Unggah dokumen untuk verifikasi akun Anda
                </DialogDescription>
              </div>
            </div>

            {/* Security note */}
            <div className="mt-4 flex items-center gap-2 text-white/30 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Data Anda dilindungi dan tersimpan dengan aman</span>
            </div>
          </div>
        </div>

        {/* Enhanced Step Indicator */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-0">
            {verificationSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              const isLast = idx === verificationSteps.length - 1;

              return (
                <div key={step.label} className="flex items-center flex-1 last:flex-none">
                  {/* Step circle */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDone
                          ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-md shadow-emerald-300/30'
                          : isActive
                          ? 'bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md shadow-teal-300/30 ring-4 ring-teal-100'
                          : 'bg-slate-100'
                      }`}
                    >
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                        >
                          <Check className="h-5 w-5 text-white" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <StepIcon className="h-5 w-5 text-white" />
                        </motion.div>
                      ) : (
                        <StepIcon className="h-5 w-5 text-slate-400" />
                      )}

                      {/* Pulse for active step */}
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-xl bg-teal-400"
                        />
                      )}
                    </motion.div>
                    <span className={`text-[10px] font-semibold mt-2 max-w-[70px] text-center leading-tight ${
                      isDone ? 'text-emerald-600' : isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-2 mt-[-18px] rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: isDone ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 space-y-5">
          {/* Document Type Selector Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full" />
              Jenis Dokumen
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {docTypeCards.map((doc) => {
                const Icon = doc.icon;
                const isSelected = docType === doc.type;
                const isUploaded = documents.some(d => d.type === doc.type);
                
                return (
                  <motion.button
                    key={doc.type}
                    type="button"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative p-3.5 rounded-xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? `${doc.activeBorder} bg-white shadow-lg ${doc.activeShadow}`
                        : `border-slate-200 hover:border-slate-300 ${doc.hoverBorder} hover:bg-white`
                    }`}
                    onClick={() => setDocType(doc.type)}
                  >
                    {/* Selection checkmark */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${doc.gradient} flex items-center justify-center shadow-md`}
                      >
                        <Check className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    )}

                    {/* Upload status indicator */}
                    {isUploaded && !isSelected && (
                      <div className="absolute -top-1.5 -right-1.5">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                        >
                          <Check className="h-2.5 w-2.5 text-white" />
                        </motion.div>
                      </div>
                    )}

                    <div className={`w-10 h-10 rounded-xl ${doc.iconBg} flex items-center justify-center mb-2.5 transition-transform duration-200 ${
                      isSelected ? 'scale-110' : ''
                    }`}>
                      <Icon className={`h-5 w-5 ${doc.iconColor}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{doc.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{doc.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Document Name Input */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-full" />
              Nama Dokumen
            </h3>
            <Input
              placeholder="contoh: KTP - Ahmad Sulaiman"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 bg-slate-50/50"
            />
          </div>

          {/* Upload Zone */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full" />
              Foto Dokumen
            </h3>
            <AnimatePresence mode="wait">
              {!showCamera && !capturedImage ? (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Upload drop zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
                      isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
                        : 'border-slate-200 hover:border-primary/50 hover:bg-primary/[0.02]'
                    }`}
                    onClick={() => setShowCamera(true)}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setCapturedImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {/* Background gradient on drag */}
                    <AnimatePresence>
                      {isDragOver && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-teal-500/5"
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative">
                      {/* Upload icon with animated ring */}
                      <div className="relative mx-auto mb-4">
                        <motion.div
                          animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isDragOver ? 'bg-primary/20' : 'bg-slate-100 group-hover:bg-primary/10'
                          }`}
                        >
                          <Upload className={`h-7 w-7 transition-all duration-300 ${
                            isDragOver ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                          }`} />
                        </motion.div>
                        {/* Animated orbit dots */}
                        {!isDragOver && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0"
                          >
                            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 -translate-x-1/2" />
                          </motion.div>
                        )}
                      </div>

                      <p className="text-slate-700 font-semibold text-base">
                        {isDragOver ? 'Lepaskan file di sini' : 'Klik untuk ambil foto dokumen'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1.5">
                        Gunakan kamera atau seret file ke sini
                      </p>

                      {/* Action buttons row */}
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1.5">
                          <Camera className="h-3 w-3" />
                          <span>Kamera</span>
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="camera-area"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-black rounded-2xl overflow-hidden aspect-video ring-2 ring-slate-200 shadow-xl"
                >
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured document" className="w-full h-full object-contain" />
                  ) : hasCameraPermission === false ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-b from-slate-900 to-slate-950">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                      </div>
                      <p className="text-center px-4 font-medium">Tidak dapat mengakses kamera.</p>
                      <p className="text-sm text-slate-400 mt-2">Pastikan izin kamera diberikan di browser Anda.</p>
                      <Button variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-800" onClick={() => startCamera()}>
                        Coba Lagi
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Camera viewfinder overlay */}
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-white/20 rounded-lg" />
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  )}

                  {/* Camera controls */}
                  {!capturedImage && isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.3 }} 
                      className="absolute bottom-5 left-0 right-0 flex justify-center items-center gap-5"
                    >
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25"
                        onClick={switchCamera}
                      >
                        <SwitchCamera className="h-5 w-5" />
                      </Button>
                      <motion.button 
                        whileHover={{ scale: 1.08 }} 
                        whileTap={{ scale: 0.92 }}
                        className="w-18 h-18 rounded-full bg-white text-slate-900 hover:bg-white/90 shadow-xl shadow-black/30 flex items-center justify-center transition-all duration-200 ring-4 ring-white/30"
                        onClick={captureImage}
                      >
                        <Camera className="h-7 w-7" />
                      </motion.button>
                      <div className="w-12 h-12" /> {/* Spacer for alignment */}
                    </motion.div>
                  )}

                  {/* Retake/Cancel controls */}
                  {capturedImage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="absolute bottom-5 left-0 right-0 flex justify-center gap-3"
                    >
                      <Button 
                        variant="outline" 
                        className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25 rounded-full px-5"
                        onClick={retakePhoto}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" /> Ambil Ulang
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25 rounded-full px-5"
                        onClick={() => { setCapturedImage(null); setShowCamera(false); }}
                      >
                        <X className="h-4 w-4 mr-2" /> Batal
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Progress Bar */}
            <AnimatePresence>
              {isUploading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }} 
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <span className="text-slate-600 font-medium">Mengunggah dokumen...</span>
                    </div>
                    <span className="text-primary font-bold">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-teal-500 to-emerald-500"
                      style={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Mohon jangan menutup halaman ini</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Requirements Checklist with Checkmark Animations */}
          {capturedImage && !isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                Checklist Kualitas
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                {requirementsList.map((req) => {
                  const isChecked = checkedRequirements.has(req.id);
                  return (
                    <motion.label
                      key={req.id}
                      htmlFor={req.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        isChecked ? 'bg-emerald-50/50' : 'hover:bg-white'
                      }`}
                    >
                      <Checkbox
                        id={req.id}
                        checked={isChecked}
                        onCheckedChange={() => toggleRequirement(req.id)}
                        className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium transition-colors duration-200 ${
                            isChecked ? 'text-emerald-700' : 'text-slate-700'
                          }`}>
                            {req.label}
                          </span>
                          {isChecked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </motion.div>
                          )}
                        </div>
                        <span className={`text-xs transition-colors duration-200 ${
                          isChecked ? 'text-emerald-600/70' : 'text-slate-400'
                        }`}>
                          {req.description}
                        </span>
                      </div>
                    </motion.label>
                  );
                })}
                {/* All checked indicator */}
                {allRequirementsChecked && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 pt-2 border-t border-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">Semua persyaratan terpenuhi ✓</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Uploaded File Preview with enhanced status */}
          {capturedImage && !showCamera && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 border-emerald-200 shadow-sm">
                <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{docName || 'Dokumen'}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CircleDot className="h-2.5 w-2.5" />
                  Siap diunggah
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-200/50"
              >
                <Check className="h-5 w-5 text-white" />
              </motion.div>
            </motion.div>
          )}

          {/* Document Status Timeline */}
          {documents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }} 
              className="space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-teal-500 rounded-full" />
                Status Verifikasi
              </h3>
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="space-y-0">
                  {[
                    { 
                      label: 'Unggah Dokumen', 
                      status: 'done' as const, 
                      icon: Upload,
                      desc: `${documents.length} dokumen terunggah`,
                    },
                    { 
                      label: 'Review Admin', 
                      status: documents.some(d => d.verified) ? 'done' as const : 'current' as const, 
                      icon: Eye,
                      desc: documents.some(d => d.verified) ? 'Selesai direview' : 'Sedang diproses oleh admin',
                    },
                    { 
                      label: 'Terverifikasi', 
                      status: documents.some(d => d.verified) ? 'done' as const : 'pending' as const, 
                      icon: ShieldCheck,
                      desc: documents.some(d => d.verified) ? 'Semua dokumen terverifikasi ✓' : 'Menunggu review selesai',
                    },
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    const isDone = step.status === 'done';
                    const isCurrent = step.status === 'current';
                    return (
                      <div key={step.label} className="flex items-start gap-3">
                        {idx > 0 && (
                          <div className="ml-[17px] w-0.5 h-8">
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: 0.2 }}
                              className={`w-full h-full rounded-full origin-top ${
                                isDone ? 'bg-gradient-to-b from-emerald-300 to-emerald-400' : 'bg-slate-200'
                              }`} />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-[34px] h-[34px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isDone 
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-md shadow-emerald-200/50' 
                              : isCurrent 
                              ? 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-200/50' 
                              : 'bg-slate-200'
                          }`}>
                            {isDone ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                <Check className="h-4 w-4 text-white" />
                              </motion.div>
                            ) : isCurrent ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="h-4 w-4 text-white" />
                              </motion.div>
                            ) : (
                              <StepIcon className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="pt-1">
                            <p className={`text-sm font-semibold ${
                              isDone ? 'text-emerald-700' : isCurrent ? 'text-teal-700' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </p>
                            <p className={`text-xs mt-0.5 ${
                              isDone ? 'text-emerald-500' : isCurrent ? 'text-teal-500' : 'text-slate-400'
                            }`}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Uploaded Documents List with Status Indicators */}
          {documents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 }} 
              className="space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full" />
                Dokumen Terunggah ({documents.length})
              </h3>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <motion.div 
                    key={doc.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between border border-slate-200 rounded-xl p-3.5 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Document type icon */}
                      {(() => {
                        const cardDef = docTypeCards.find(c => c.type === doc.type);
                        const DocIcon = cardDef?.icon || FileText;
                        const iconBg = cardDef?.iconBg || 'bg-slate-100';
                        const iconColor = cardDef?.iconColor || 'text-slate-500';
                        return (
                          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                            <DocIcon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                        );
                      })()}
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{doc.name}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{doc.type}</p>
                      </div>
                    </div>
                    {doc.verified ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Badge className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <FileCheck className="h-3 w-3 mr-1.5" />
                          </motion.div>
                          Terverifikasi
                        </Badge>
                      </motion.div>
                    ) : (
                      <Badge className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Clock className="h-3 w-3 mr-1.5" />
                        </motion.div>
                        Menunggu Review
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer with Enhanced Submit Button */}
          <div className="flex justify-between pt-5 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              Batal
            </Button>
            <div className="flex gap-3">
              {documents.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={onRequestVerification} 
                  className="h-11 border-slate-200 hover:bg-slate-50 transition-all duration-200"
                >
                  Ajukan Verifikasi
                </Button>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className={`h-11 px-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:shadow-none ${
                    allRequirementsChecked && capturedImage
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-emerald-300/30'
                      : 'bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 shadow-primary/20'
                  }`}
                  onClick={handleUpload}
                  disabled={!capturedImage || isUploading || !docName.trim()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Unggah Dokumen
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, SwitchCamera, X, Check, Loader2, Image as ImageIcon, AlertCircle, RotateCcw, Upload, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface WebcamUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: { name: string; type: string; fileUrl: string; fileSize: number }) => Promise<boolean>;
  projects: Array<{ id: string; title: string }>;
}

const documentTypes = [
  { value: 'KONTRAK', label: 'Kontrak' },
  { value: 'GAMBAR', label: 'Gambar Teknis' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'SPK', label: 'SPK' },
  { value: 'RAB', label: 'RAB' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

type UploadState = 'idle' | 'uploading' | 'success' | 'error';
type TabMode = 'camera' | 'upload';

export function WebcamUploadModal({
  open,
  onOpenChange,
  onUpload,
  projects,
}: WebcamUploadModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('KONTRAK');
  const [selectedProject, setSelectedProject] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabMode>('camera');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
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

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Capture image from video
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
    setGallery(prev => [imageData, ...prev].slice(0, 4));
    stopCamera();
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Remove gallery item
  const removeGalleryItem = useCallback((idx: number) => {
    setGallery(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Handle file selection (upload tab)
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedImage(result);
      setGallery(prev => [result, ...prev].slice(0, 4));
      if (!documentName.trim()) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  }, [documentName]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Handle upload with progress
  const handleUpload = async () => {
    if (!capturedImage || !documentName.trim() || !selectedProject) {
      toast.error('Mohon lengkapi semua data');
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const base64Data = capturedImage.split(',')[1];
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (data.success && data.url) {
        setUploadProgress(100);
        const success = await onUpload({
          name: documentName,
          type: documentType,
          fileUrl: data.url,
          fileSize: data.size || 0,
        });

        if (success) {
          setUploadState('success');
          setTimeout(() => handleClose(), 2000);
        } else {
          setUploadState('error');
        }
      } else {
        setUploadState('error');
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      clearInterval(progressInterval);
      setUploadState('error');
      toast.error('Gagal mengunggah dokumen. Silakan coba lagi.');
    }
  };

  // Retry upload
  const handleRetry = useCallback(() => {
    setUploadState('idle');
    setUploadProgress(0);
  }, []);

  // Handle close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setDocumentName('');
    setDocumentType('KONTRAK');
    setSelectedProject('');
    setGallery([]);
    setUploadState('idle');
    setUploadProgress(0);
    setActiveTab('camera');
    setIsDragOver(false);
    onOpenChange(false);
  };

  // Start camera when modal opens on camera tab
  useEffect(() => {
    if (open && activeTab === 'camera' && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open, activeTab, capturedImage, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && activeTab === 'camera' && isStreaming) {
      startCamera();
    }
  }, [facingMode, open, isStreaming, activeTab, startCamera]);

  // Stop camera when switching to upload tab
  useEffect(() => {
    if (activeTab === 'upload') {
      stopCamera();
    }
  }, [activeTab, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header with Frosted Glass Camera Icon */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 flex-shrink-0 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Camera className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Upload Dokumen</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5">
                Ambil foto atau unggah file dokumen Anda
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Toggle Buttons: Kamera vs Unggah File */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'camera'
                  ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="h-4 w-4" />
              Kamera
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              Unggah File
            </motion.button>
          </div>

          {/* Upload State: Success */}
          <AnimatePresence mode="wait">
            {uploadState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Berhasil Diunggah!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dokumen Anda telah berhasil disimpan</p>
                </motion.div>
              </motion.div>
            )}

            {uploadState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-10 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 ring-4 ring-rose-100 dark:ring-rose-900/30"
                >
                  <AlertCircle className="h-10 w-10 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Gagal Mengunggah</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Terjadi kesalahan saat mengunggah dokumen</p>
                </div>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </motion.div>
            )}

            {uploadState !== 'success' && uploadState !== 'error' && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Camera Tab Content */}
                {activeTab === 'camera' && (
                  <div className="space-y-5">
                    {/* Camera Preview */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        Preview Kamera
                      </h3>
                      <div className={`relative rounded-2xl overflow-hidden aspect-video shadow-xl transition-all duration-300 ${
                        capturedImage ? 'ring-2 ring-emerald-400/50 shadow-emerald-500/10' : 'ring-2 ring-primary/20 shadow-primary/5'
                      }`}>
                        {capturedImage ? (
                          <motion.img
                            key="captured"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={capturedImage}
                            alt="Captured document"
                            className="w-full h-full object-contain bg-slate-950"
                          />
                        ) : hasCameraPermission === false ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 150 }}
                              className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4"
                            >
                              <CameraOff className="h-8 w-8 text-rose-400" />
                            </motion.div>
                            <p className="text-white text-center px-4 font-medium">Tidak dapat mengakses kamera</p>
                            <p className="text-sm text-slate-400 mt-2 px-4 text-center">Pastikan izin kamera diberikan di browser Anda.</p>
                          </div>
                        ) : (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover bg-slate-950"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            {/* Camera viewfinder corners */}
                            <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none">
                              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-md" />
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-md" />
                              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-md" />
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-md" />
                            </div>
                          </>
                        )}

                        {/* Camera Controls Overlay */}
                        {!capturedImage && isStreaming && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute bottom-4 left-0 right-0 flex justify-center gap-5 items-center"
                          >
                            {/* Close button */}
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm h-11 w-11 rounded-full"
                              onClick={handleClose}
                            >
                              <X className="h-5 w-5" />
                            </Button>

                            {/* Large Circular Shutter Button with Gradient */}
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary via-teal-500 to-emerald-500 text-white shadow-xl shadow-black/30 flex items-center justify-center transition-all duration-200 ring-4 ring-white/20 hover:ring-white/40"
                              onClick={captureImage}
                            >
                              <Camera className="h-8 w-8" />
                            </motion.button>

                            {/* Flip Camera with Rotation */}
                            <motion.button
                              whileTap={{ rotate: 180 }}
                              transition={{ duration: 0.4 }}
                            >
                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm h-11 w-11 rounded-full"
                                onClick={switchCamera}
                              >
                                <SwitchCamera className="h-5 w-5" />
                              </Button>
                            </motion.button>
                          </motion.div>
                        )}

                        {/* Retake Button */}
                        {capturedImage && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-4 left-0 right-0 flex justify-center"
                          >
                            <Button
                              variant="outline"
                              className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm rounded-full px-6"
                              onClick={retakePhoto}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Ambil Ulang
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Tab Content */}
                {activeTab === 'upload' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        Unggah File
                      </h3>

                      {/* Dropzone */}
                      <motion.div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[200px] ${
                          isDragOver
                            ? 'border-primary bg-gradient-to-br from-primary/10 to-teal-500/10 scale-[1.01]'
                            : capturedImage
                            ? 'border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                        {capturedImage ? (
                          <div className="relative w-full">
                            <img
                              src={capturedImage}
                              alt="Uploaded preview"
                              className="w-full h-auto max-h-[240px] object-contain rounded-xl mx-auto"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCapturedImage(null);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <motion.div
                              animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center mb-4"
                            >
                              <Upload className="h-7 w-7 text-primary" />
                            </motion.div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {isDragOver ? 'Lepaskan file di sini' : 'Seret & lepas file di sini'}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              atau klik untuk memilih file
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                              PNG, JPG, JPEG (maks. 10MB)
                            </p>
                          </>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Thumbnail Grid (2x2) */}
                {gallery.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 bg-teal-500 rounded-full" />
                      Galeri Terbaru
                      <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({gallery.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {gallery.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 group"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800"
                          />
                          {/* Remove button */}
                          <button
                            onClick={() => removeGalleryItem(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-500 hover:scale-110"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary/90 backdrop-blur-sm text-white text-[10px] font-semibold">
                              Terpilih
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {uploadState === 'uploading' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">Mengunggah...</span>
                      <span className="font-semibold text-primary">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-primary via-teal-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                        style={{
                          boxShadow: '0 0 10px rgba(var(--color-primary), 0.3)',
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Document Details Form */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                      Detail Dokumen
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Proyek *
                        </Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200">
                            <SelectValue placeholder="Pilih proyek" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Tipe Dokumen *
                        </Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200">
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map(dt => (
                              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Nama Dokumen *
                      </Label>
                      <Input
                        placeholder="Contoh: Kontrak Kerja Proyek A"
                        value={documentName}
                        onChange={e => setDocumentName(e.target.value)}
                        className="h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" onClick={handleClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Batal
                  </Button>
                  <Button
                    className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    onClick={handleUpload}
                    disabled={!capturedImage || uploadState === 'uploading' || !documentName.trim() || !selectedProject}
                  >
                    {uploadState === 'uploading' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Upload Dokumen
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

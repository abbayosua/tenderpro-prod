'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, SwitchCamera, X, Check, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WebcamUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: { name: string; type: string; fileUrl: string; fileSize: number }) => Promise<boolean>;
  projects: Array<{ id: string; title: string }>;
}

export function WebcamUploadModal({
  open,
  onOpenChange,
  onUpload,
  projects,
}: WebcamUploadModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('KONTRAK');
  const [selectedProject, setSelectedProject] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const documentTypes = [
    { value: 'KONTRAK', label: 'Kontrak' },
    { value: 'GAMBAR', label: 'Gambar Teknis' },
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'SPK', label: 'SPK' },
    { value: 'RAB', label: 'RAB' },
    { value: 'LAINNYA', label: 'Lainnya' },
  ];

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

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
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

  // Handle upload
  const handleUpload = async () => {
    if (!capturedImage || !documentName.trim() || !selectedProject) {
      toast.error('Mohon lengkapi semua data');
      return;
    }

    setIsUploading(true);
    try {
      // Upload via server-side proxy to avoid exposing API key
      const base64Data = capturedImage.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Call onUpload with the image URL
        const success = await onUpload({
          name: documentName,
          type: documentType,
          fileUrl: data.url,
          fileSize: data.size || 0,
        });

        if (success) {
          toast.success('Dokumen berhasil diunggah!');
          handleClose();
        }
      } else {
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah dokumen. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setDocumentName('');
    setDocumentType('KONTRAK');
    setSelectedProject('');
    onOpenChange(false);
  };

  // Start camera when modal opens
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open, capturedImage, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Upload Dokumen via Kamera
          </DialogTitle>
          <DialogDescription>
            Ambil foto dokumen menggunakan kamera perangkat Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View / Captured Image */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured document"
                className="w-full h-full object-contain"
              />
            ) : hasCameraPermission === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                <AlertCircle className="h-12 w-12 mb-4 text-yellow-500" />
                <p className="text-center px-4">Tidak dapat mengakses kamera.</p>
                <p className="text-sm text-slate-400 mt-2">Pastikan izin kamera diberikan di browser Anda.</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}

            {/* Camera Controls Overlay */}
            {!capturedImage && isStreaming && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 rounded-full w-16 h-16"
                  onClick={captureImage}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            )}

            {/* Retake Button */}
            {capturedImage && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={retakePhoto}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Ambil Ulang
                </Button>
              </div>
            )}
          </div>

          {/* Document Details Form */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Proyek *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih proyek" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Dokumen *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="name">Nama Dokumen *</Label>
              <Input
                id="name"
                placeholder="Contoh: Kontrak Kerja Proyek A"
                value={documentName}
                onChange={e => setDocumentName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleUpload}
            disabled={!capturedImage || isUploading || !documentName.trim() || !selectedProject}
          >
            {isUploading ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, FileCheck, FileText, Camera, SwitchCamera, Check, Loader2, Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { UserDocument } from '@/types';

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

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const documentTypes = ['KTP', 'NPWP', 'SIUP', 'NIB', 'Akta Perusahaan'];

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
    if (!capturedImage || !docName.trim()) {
      toast.error('Mohon lengkapi semua data dan ambil foto dokumen');
      return;
    }

    setIsUploading(true);
    try {
      // Upload via our backend proxy (avoids CORS)
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage.split(',')[1], // Remove data:image/jpeg;base64, prefix
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Call onUpload with the image URL
        const success = await onUpload(data.url);

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
    setShowCamera(false);
    setDocName('');
    onOpenChange(false);
  };

  // Start camera when showCamera is true
  useEffect(() => {
    if (showCamera && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!showCamera) {
        stopCamera();
      }
    };
  }, [showCamera, capturedImage, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (showCamera && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifikasi Akun</DialogTitle>
          <DialogDescription>Unggah dokumen untuk verifikasi akun Anda dengan foto melalui kamera</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis Dokumen</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {documentTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={docType === type ? 'default' : 'outline'}
                  className={docType === type ? 'bg-primary hover:bg-primary/90' : ''}
                  onClick={() => setDocType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="docName">Nama Dokumen</Label>
            <Input
              id="docName"
              placeholder="contoh: KTP - Ahmad Sulaiman"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
          </div>

          {/* Camera Section */}
          <div className="space-y-2">
            <Label>Foto Dokumen</Label>
            {!showCamera && !capturedImage ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Klik untuk ambil foto dokumen</p>
                <p className="text-sm text-slate-400 mt-1">Gunakan kamera untuk memfoto dokumen Anda</p>
              </div>
            ) : (
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
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => startCamera()}
                    >
                      Coba Lagi
                    </Button>
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
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      onClick={retakePhoto}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Ambil Ulang
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      onClick={() => {
                        setCapturedImage(null);
                        setShowCamera(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {documents.length > 0 && (
            <div>
              <Label>Dokumen Terunggah</Label>
              <div className="mt-2 space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <div>
                        <span className="text-sm font-medium">{doc.name}</span>
                        <span className="text-xs text-slate-400 ml-2">({doc.type})</span>
                      </div>
                    </div>
                    {doc.verified ? (
                      <Badge className="bg-primary"><FileCheck className="h-3 w-3 mr-1" /> Terverifikasi</Badge>
                    ) : (
                      <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <Button 
              className="bg-primary hover:bg-primary/90" 
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
          </DialogFooter>

          {documents.length > 0 && (
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={onRequestVerification}>
                Ajukan Permintaan Verifikasi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

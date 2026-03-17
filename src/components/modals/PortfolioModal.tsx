'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, Check, Loader2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

const categories = [
  'Pembangunan Baru',
  'Renovasi',
  'Interior',
  'Komersial',
  'Infrastruktur',
  'Lainnya',
];

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

  // Reset form when modal opens/closes or portfolio changes
  useEffect(() => {
    if (open) {
      if (portfolio) {
        setFormData({
          ...portfolio,
          images: portfolio.images || [],
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'Pembangunan Baru',
          clientName: '',
          location: '',
          year: new Date().getFullYear(),
          budget: undefined,
          images: [],
        });
      }
    }
  }, [open, portfolio]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
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
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Tidak dapat mengakses kamera');
    }
  }, []);

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
    stopCamera();
  }, [stopCamera]);

  // Add captured image to form
  const addImage = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    try {
      // Upload via backend proxy
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage.split(',')[1],
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
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

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul portofolio wajib diisi');
      return;
    }

    setIsUploading(true);
    try {
      const url = portfolio?.id
        ? `/api/portfolios?portfolioId=${portfolio.id}`
        : '/api/portfolios';

      const method = portfolio?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portfolioId: portfolio?.id,
          ...formData,
          budget: formData.budget || null,
        }),
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

  // Handle close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setShowCamera(false);
    onOpenChange(false);
  };

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
          <DialogTitle>
            {portfolio?.id ? 'Edit Portofolio' : 'Tambah Portofolio Baru'}
          </DialogTitle>
          <DialogDescription>
            Tampilkan hasil kerja Anda untuk menarik klien potensial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Proyek *</Label>
            <Input
              id="title"
              placeholder="Contoh: Rumah Mewah 2 Lantai"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail proyek..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Category and Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Tahun</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              />
            </div>
          </div>

          {/* Client Name and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nama Klien</Label>
              <Input
                id="clientName"
                placeholder="Opsional"
                value={formData.clientName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                placeholder="Opsional"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Nilai Proyek (Rp)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="Opsional"
              value={formData.budget || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || undefined }))}
            />
          </div>

          {/* Images Section */}
          <div className="space-y-2">
            <Label>Foto Proyek</Label>

            {/* Image Gallery */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Portfolio ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Camera Section */}
            {!showCamera && !capturedImage && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-5 w-5 mr-2" /> Ambil Foto
              </Button>
            )}

            {showCamera && (
              <div className="space-y-2">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-contain"
                    />
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
                </div>

                {capturedImage ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                      }}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" /> Ambil Ulang
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={addImage}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Tambahkan
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCamera(false)}>
                      Batal
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={captureImage}
                      disabled={!isStreaming}
                    >
                      <Camera className="h-4 w-4 mr-2" /> Ambil Foto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

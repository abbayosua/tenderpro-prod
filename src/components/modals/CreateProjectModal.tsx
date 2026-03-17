'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewProject } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { Plus } from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: NewProject;
  setProject: (project: NewProject) => void;
  onSubmit: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  project,
  setProject,
  onSubmit,
}: CreateProjectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Buat Proyek Baru</DialogTitle>
          <DialogDescription>Isi detail proyek yang ingin Anda kerjakan</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectTitle">Judul Proyek *</Label>
            <Input
              id="projectTitle"
              placeholder="contoh: Pembangunan Rumah 2 Lantai"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">Deskripsi Proyek</Label>
            <Textarea
              id="projectDescription"
              placeholder="Jelaskan detail proyek Anda..."
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori Proyek</Label>
              <Select value={project.category} onValueChange={(v) => setProject({ ...project, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pembangunan Baru">Pembangunan Baru</SelectItem>
                  <SelectItem value="Renovasi">Renovasi</SelectItem>
                  <SelectItem value="Komersial">Komersial</SelectItem>
                  <SelectItem value="Interior">Interior</SelectItem>
                  <SelectItem value="Fasilitas">Fasilitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectLocation">Lokasi</Label>
              <Input
                id="projectLocation"
                placeholder="contoh: Jakarta Selatan"
                value={project.location}
                onChange={(e) => setProject({ ...project, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectBudget">Anggaran (Rp) *</Label>
              <Input
                id="projectBudget"
                type="number"
                placeholder="contoh: 500000000"
                value={project.budget}
                onChange={(e) => setProject({ ...project, budget: e.target.value })}
              />
              {project.budget && (
                <p className="text-xs text-slate-500">Perkiraan: {formatRupiah(parseFloat(project.budget))}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDuration">Durasi (hari)</Label>
              <Input
                id="projectDuration"
                type="number"
                placeholder="contoh: 90"
                value={project.duration}
                onChange={(e) => setProject({ ...project, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectRequirements">Persyaratan</Label>
            <Textarea
              id="projectRequirements"
              placeholder="Masukkan persyaratan, pisahkan dengan baris baru..."
              value={project.requirements}
              onChange={(e) => setProject({ ...project, requirements: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-slate-500">contoh: memiliki IMB, pengalaman minimal 5 tahun, dll</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={onSubmit}>
              <Plus className="h-4 w-4 mr-2" /> Buat Proyek
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

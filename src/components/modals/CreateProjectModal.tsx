'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewProject } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { Plus, Building2, FileText, MapPin, DollarSign, Clock, ClipboardList, Check, Copy, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const categoryIcons: Record<string, string> = {
  'Pembangunan Baru': '🏗️',
  'Renovasi': '🔧',
  'Komersial': '🏢',
  'Interior': '🎨',
  'Fasilitas': '🏛️',
};

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: NewProject;
  setProject: (project: NewProject) => void;
  onSubmit: () => void;
  ownerId?: string;
}

interface PastProject {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  duration?: number;
  status: string;
  description?: string;
  requirements?: string;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  project,
  setProject,
  onSubmit,
  ownerId,
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloneSection, setShowCloneSection] = useState(false);
  const [pastProjects, setPastProjects] = useState<PastProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [selectedCloneId, setSelectedCloneId] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  // Load past projects for cloning
  useEffect(() => {
    if (!open || !ownerId || !showCloneSection) return;

    const loadPastProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`/api/projects?ownerId=${ownerId}&limit=20`);
        const data = await res.json();
        if (data.projects) {
          setPastProjects(data.projects.filter((p: PastProject) => p.status !== 'DRAFT'));
        }
      } catch {
        console.error('Gagal memuat proyek sebelumnya');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadPastProjects();
  }, [open, ownerId, showCloneSection]);

  const handleCloneProject = async () => {
    if (!selectedCloneId || !ownerId) return;

    setCloning(true);
    try {
      const res = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedCloneId, ownerId }),
      });
      const data = await res.json();
      if (data.success) {
        // Also pre-fill the form with cloned data
        const selectedProject = pastProjects.find(p => p.id === selectedCloneId);
        if (selectedProject) {
          setProject({
            title: `${selectedProject.title} (Salinan)`,
            description: selectedProject.description || '',
            category: selectedProject.category,
            location: selectedProject.location,
            budget: String(selectedProject.budget),
            duration: String(selectedProject.duration || ''),
            requirements: selectedProject.requirements || '',
          });
        }
        setShowCloneSection(false);
        setSelectedCloneId('');
        window.location.reload();
      }
    } catch {
      // silently fail
    } finally {
      setCloning(false);
    }
  };

  const handleResetForm = () => {
    setProject({
      title: '',
      description: '',
      category: 'Pembangunan Baru',
      location: '',
      budget: '',
      duration: '',
      requirements: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 text-center flex-shrink-0">
          <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-lg font-bold text-white">Buat Proyek Baru</DialogTitle>
          <DialogDescription className="text-white/70 mt-0.5">
            Isi detail proyek yang ingin Anda kerjakan
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="space-y-5">
            {/* Clone from previous project */}
            {ownerId && (
              <div className="border border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-slate-700">Clone dari Proyek Sebelumnya</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setShowCloneSection(!showCloneSection)}
                  >
                    {showCloneSection ? 'Tutup' : 'Pilih Proyek'}
                  </Button>
                </div>

                {showCloneSection && (
                  <div className="mt-3 space-y-3">
                    {loadingProjects ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="text-sm text-slate-500 ml-2">Memuat proyek...</span>
                      </div>
                    ) : pastProjects.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2">Belum ada proyek sebelumnya</p>
                    ) : (
                      <>
                        <Select value={selectedCloneId} onValueChange={setSelectedCloneId}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Pilih proyek yang ingin diduplikasi" />
                          </SelectTrigger>
                          <SelectContent>
                            {pastProjects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.title}</span>
                                  <span className="text-xs text-slate-400">
                                    {p.category} · {formatRupiah(p.budget)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCloneId && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white"
                              onClick={handleCloneProject}
                              disabled={cloning}
                            >
                              {cloning ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Menduplikasi...
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" /> Duplikasi Proyek
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const p = pastProjects.find(pr => pr.id === selectedCloneId);
                                if (p) {
                                  setProject({
                                    title: `${p.title} (Salinan)`,
                                    description: p.description || '',
                                    category: p.category,
                                    location: p.location,
                                    budget: String(p.budget),
                                    duration: String(p.duration || ''),
                                    requirements: p.requirements || '',
                                  });
                                }
                              }}
                            >
                              Isi Formulir
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section: Informasi Dasar */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Informasi Dasar
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="projectTitle" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> Judul Proyek *
                  </Label>
                  <Input
                    id="projectTitle"
                    placeholder="contoh: Pembangunan Rumah 2 Lantai"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectDescription" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> Deskripsi Proyek
                  </Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Jelaskan detail proyek Anda..."
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                    rows={4}
                    className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section: Kategori & Lokasi */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-teal-500 rounded-full" />
                Kategori & Lokasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" /> Kategori Proyek
                  </Label>
                  <Select value={project.category} onValueChange={(v) => setProject({ ...project, category: v })}>
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-primary/20 focus:border-primary/40">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryIcons).map(([value, emoji]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <span>{emoji}</span> {value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectLocation" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Lokasi
                  </Label>
                  <Input
                    id="projectLocation"
                    placeholder="contoh: Jakarta Selatan"
                    value={project.location}
                    onChange={(e) => setProject({ ...project, location: e.target.value })}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Section: Anggaran & Durasi */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                Anggaran & Durasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="projectBudget" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Anggaran (Rp) *
                  </Label>
                  <Input
                    id="projectBudget"
                    type="number"
                    placeholder="contoh: 500000000"
                    value={project.budget}
                    onChange={(e) => setProject({ ...project, budget: e.target.value })}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 text-lg font-semibold"
                  />
                  {project.budget && (
                    <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> ≈ {formatRupiah(parseFloat(project.budget))}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectDuration" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Durasi (hari)
                  </Label>
                  <Input
                    id="projectDuration"
                    type="number"
                    placeholder="contoh: 90"
                    value={project.duration}
                    onChange={(e) => setProject({ ...project, duration: e.target.value })}
                    className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Section: Persyaratan */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                Persyaratan
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="projectRequirements" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-400" /> Persyaratan Khusus
                </Label>
                <Textarea
                  id="projectRequirements"
                  placeholder="Masukkan persyaratan, pisahkan dengan baris baru..."
                  value={project.requirements}
                  onChange={(e) => setProject({ ...project, requirements: e.target.value })}
                  rows={3}
                  className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none"
                />
                <p className="text-xs text-slate-400">contoh: memiliki IMB, pengalaman minimal 5 tahun, dll</p>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-between pt-5 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={handleResetForm}
                className="text-slate-500 hover:text-slate-700"
              >
                Reset Formulir
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50"
                >
                  Batal
                </Button>
                <Button
                  className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" /> Buat Proyek
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

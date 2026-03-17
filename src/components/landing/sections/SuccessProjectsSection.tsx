'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui/card';
import { MapPin, CheckCircle } from 'lucide-react';
import { successProjects } from '@/data';
import { formatRupiah } from '@/lib/helpers';

export function SuccessProjectsSection() {
  return (
    <section className="relative z-10 py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Proyek Sukses</h2>
          <p className="text-slate-600">Beberapa proyek yang telah berhasil diselesaikan melalui TenderPro</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {successProjects.map((project, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-48 overflow-hidden">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <Badge className="absolute top-3 left-3 bg-primary">{project.category}</Badge>
                <Badge variant="secondary" className="absolute top-3 right-3"><CheckCircle className="h-3 w-3 mr-1" /> Selesai</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nilai Proyek</span>
                    <span className="font-bold text-primary">{formatRupiah(project.budget)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Durasi</span>
                    <span className="font-medium">{project.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kontraktor</span>
                    <span className="font-medium text-right">{project.contractor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

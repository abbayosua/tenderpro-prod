'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { projectCategories } from '@/data';

export function ProjectCategoriesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Kategori Proyek</h2>
          <p className="text-slate-600">Berbagai jenis proyek yang dapat Anda kelola di TenderPro</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {projectCategories.map((category, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
              <div className="relative h-24 overflow-hidden">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <Building2 className="absolute bottom-2 left-3 h-5 w-5 text-white" />
              </div>
              <CardContent className="p-3 text-center">
                <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-slate-500">{category.count}+ proyek</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

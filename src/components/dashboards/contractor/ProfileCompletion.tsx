'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Upload, Award, FileText, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionSection {
  name: string;
  completed: boolean;
  weight: number;
  hint?: string;
}

interface CompletionData {
  percentage: number;
  sections: CompletionSection[];
  suggestions: string[];
  completedSections: number;
  totalSections: number;
}

interface ProfileCompletionProps {
  userId: string;
  onAction?: (action: string) => void;
}

export function ProfileCompletion({ userId, onAction }: ProfileCompletionProps) {
  const [data, setData] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contractor/completion?userId=${userId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const getSectionIcon = (name: string, completed: boolean) => {
    if (completed) return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    return <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />;
  };

  const getSectionActionIcon = (name: string) => {
    switch (name) {
      case 'Sertifikasi': return <Award className="h-3.5 w-3.5" />;
      case 'Portfolio': return <FileText className="h-3.5 w-3.5" />;
      case 'Foto Profil': return <User className="h-3.5 w-3.5" />;
      case 'Verifikasi': return <Shield className="h-3.5 w-3.5" />;
      default: return <Upload className="h-3.5 w-3.5" />;
    }
  };

  const handleSectionAction = (section: CompletionSection) => {
    if (onAction) {
      onAction(section.name);
    } else {
      toast.info(`Fitur "${section.name}" akan segera tersedia`);
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-primary';
    if (percentage >= 30) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Kelengkapan Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-3 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Kelengkapan Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Gagal memuat data kelengkapan profil</p>
        </CardContent>
      </Card>
    );
  }

  // If profile is 100% complete, show a compact view
  if (data.percentage === 100) {
    return (
      <Card className="shadow-sm border border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Profil Lengkap!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-600">100%</span>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Semua bagian profil sudah lengkap!</p>
              <p className="text-xs text-green-600 mt-1">Profil Anda sudah siap untuk menarik lebih banyak klien</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Kelengkapan Profil
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Percentage Circle + Info */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={data.percentage >= 80 ? '#22c55e' : data.percentage >= 50 ? '#0891b2' : '#d97706'}
                strokeWidth="3"
                strokeDasharray={`${data.percentage}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getPercentageColor(data.percentage)}`}>
              {data.percentage}%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {data.completedSections} dari {data.totalSections} bagian lengkap
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Lengkapi profil Anda untuk meningkatkan peluang mendapatkan proyek
            </p>
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-2">
          {data.sections.map((section) => (
            <div
              key={section.name}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                section.completed ? 'bg-green-50/50' : 'hover:bg-slate-50'
              }`}
            >
              {getSectionIcon(section.name, section.completed)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    section.completed ? 'text-green-700 line-through' : 'text-slate-700'
                  }`}>
                    {section.name}
                  </span>
                  <span className="text-xs text-slate-400">({section.weight}%)</span>
                </div>
                {!section.completed && section.hint && (
                  <p className="text-xs text-slate-400 mt-0.5">{section.hint}</p>
                )}
              </div>
              {!section.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => handleSectionAction(section)}
                >
                  {getSectionActionIcon(section.name)}
                  <span className="ml-1">Lengkapi</span>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Saran Peningkatan
            </h4>
            <ul className="space-y-1.5">
              {data.suggestions.slice(0, 3).map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

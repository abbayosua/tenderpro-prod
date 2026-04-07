'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserPlus, ShieldCheck, ClipboardList, Send, Handshake,
  FileText, FolderOpen, Award, CheckCircle2, X, Sparkles,
  Building2, ChevronDown, ChevronRight, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  userRole: 'OWNER' | 'CONTRACTOR';
  completedSteps: string[];
  onStepAction?: (stepId: string) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

interface CategoryGroup {
  id: string;
  label: string;
  gradient: string;
  icon: React.ElementType;
}

const categories: CategoryGroup[] = [
  { id: 'akun', label: 'Akun & Profil', gradient: 'from-primary to-teal-600', icon: UserPlus },
  { id: 'verifikasi', label: 'Verifikasi', gradient: 'from-amber-500 to-orange-500', icon: ShieldCheck },
  { id: 'aktivitas', label: 'Aktivitas Proyek', gradient: 'from-emerald-500 to-green-600', icon: ClipboardList },
];

const ownerSteps: OnboardingStep[] = [
  { id: 'create-account', title: 'Buat akun', description: 'Daftarkan akun Anda di TenderPro', icon: UserPlus, category: 'akun' },
  { id: 'verify-identity', title: 'Verifikasi identitas', description: 'Unggah dokumen verifikasi Anda', icon: ShieldCheck, category: 'verifikasi' },
  { id: 'create-project', title: 'Buat proyek pertama', description: 'Mulai buat proyek tender pertama', icon: ClipboardList, category: 'aktivitas' },
  { id: 'receive-bids', title: 'Terima penawaran', description: 'Tunggu kontraktor mengajukan penawaran', icon: Send, category: 'aktivitas' },
  { id: 'choose-contractor', title: 'Pilih kontraktor', description: 'Pilih kontraktor terbaik untuk proyek Anda', icon: Handshake, category: 'aktivitas' },
];

const contractorSteps: OnboardingStep[] = [
  { id: 'create-account', title: 'Buat akun', description: 'Daftarkan akun Anda di TenderPro', icon: UserPlus, category: 'akun' },
  { id: 'verify-identity', title: 'Verifikasi identitas', description: 'Unggah dokumen verifikasi Anda', icon: ShieldCheck, category: 'verifikasi' },
  { id: 'complete-profile', title: 'Lengkapi profil', description: 'Isi profil perusahaan secara lengkap', icon: Building2, category: 'akun' },
  { id: 'upload-certification', title: 'Unggah sertifikasi', description: 'Unggah sertifikasi profesional Anda', icon: Award, category: 'verifikasi' },
  { id: 'first-bid', title: 'Ajukan penawaran pertama', description: 'Mulai ajukan penawaran pada proyek', icon: FileText, category: 'aktivitas' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// SVG animated checkmark component
function AnimatedCheckmark({ completed }: { completed: boolean }) {
  return (
    <div className={cn(
      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
      completed
        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-200'
        : 'bg-slate-100'
    )}>
      {completed ? (
        <motion.svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </motion.svg>
      ) : (
        <div className="w-2 h-2 rounded-full bg-slate-300" />
      )}
    </div>
  );
}

// Progress ring SVG component
function ProgressRing({ percentage, size = 52, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    if (percentage >= 80) return { stroke: 'url(#gradient-green)', shadow: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))' };
    if (percentage >= 50) return { stroke: 'url(#gradient-primary)', shadow: 'drop-shadow(0 0 4px rgba(13, 148, 136, 0.3))' };
    return { stroke: 'url(#gradient-amber)', shadow: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.3))' };
  };

  const colorConfig = getStrokeColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: colorConfig.shadow }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-xs font-bold text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {percentage}%
        </motion.span>
      </div>
    </div>
  );
}

export function OnboardingChecklist({
  userRole,
  completedSteps,
  onStepAction,
}: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    () => categories.map(c => c.id)
  );

  const steps = userRole === 'OWNER' ? ownerSteps : contractorSteps;
  const completedCount = steps.filter((s) => completedSteps.includes(s.id)).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Read dismissed state from localStorage without triggering setState in effect
  const dismissedKey = `onboarding-dismissed-${userRole}`;
  const isDismissed = useSyncExternalStore(
    (cb) => {
      window.addEventListener('storage', cb);
      return () => window.removeEventListener('storage', cb);
    },
    () => localStorage.getItem(dismissedKey) === 'true',
    () => false
  );

  const shouldShow = isVisible && !isDismissed;

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`onboarding-dismissed-${userRole}`, 'true');
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    );
  };

  const isAllComplete = completedCount === steps.length;

  const getNextIncomplete = () => {
    return steps.find(s => !completedSteps.includes(s.id));
  };

  const nextStep = getNextIncomplete();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-teal-500/[0.02] overflow-hidden shadow-sm">
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-primary via-teal-500 to-emerald-500" />

          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-sm shadow-primary/20">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {isAllComplete ? 'Semua Langkah Selesai!' : 'Mulai Perjalanan Anda'}
                  </h3>
                  <p className="text-xs text-slate-400">{completedCount} dari {steps.length} langkah selesai</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Progress ring */}
                <ProgressRing percentage={progressPercent} size={44} strokeWidth={3.5} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Steps organized by categories */}
          <CardContent className="pt-0 pb-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {categories.map((category) => {
                const categorySteps = steps.filter(s => s.category === category.id);
                if (categorySteps.length === 0) return null;

                const categoryCompleted = categorySteps.filter(s => completedSteps.includes(s.id)).length;
                const isExpanded = expandedCategories.includes(category.id);
                const CategoryIcon = category.icon;

                return (
                  <motion.div
                    key={category.id}
                    variants={itemVariants}
                    className="rounded-xl border border-slate-100 overflow-hidden"
                  >
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                        <CategoryIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-semibold text-slate-700">{category.label}</p>
                        <p className="text-[10px] text-slate-400">{categoryCompleted}/{categorySteps.length} selesai</p>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${categorySteps.length > 0 ? (categoryCompleted / categorySteps.length) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className={`h-full rounded-full bg-gradient-to-r ${category.gradient}`}
                        />
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </motion.div>
                    </button>

                    {/* Steps */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1.5">
                            {categorySteps.map((step) => {
                              const isCompleted = completedSteps.includes(step.id);
                              const Icon = step.icon;

                              return (
                                <motion.div
                                  key={step.id}
                                  className={cn(
                                    'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200',
                                    isCompleted
                                      ? 'bg-emerald-50/50'
                                      : 'bg-white hover:bg-slate-50 border border-transparent hover:border-primary/20'
                                  )}
                                >
                                  {/* Checkmark */}
                                  <AnimatedCheckmark completed={isCompleted} />

                                  {/* Text */}
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      'text-sm font-medium truncate transition-colors',
                                      isCompleted ? 'text-emerald-700' : 'text-slate-700'
                                    )}>
                                      {step.title}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{step.description}</p>
                                  </div>

                                  {/* Action */}
                                  {!isCompleted && onStepAction && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-primary hover:bg-primary/10 shrink-0 h-8 font-medium px-3"
                                      onClick={() => onStepAction(step.id)}
                                    >
                                      Lengkapi
                                      <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[10px] text-emerald-500 font-medium shrink-0">Selesai</span>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA for next incomplete step */}
            {!isAllComplete && nextStep && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-4 border-t border-slate-100"
              >
                <Button
                  className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white rounded-xl h-10 shadow-md shadow-primary/15 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
                  onClick={() => nextStep && onStepAction?.(nextStep.id)}
                >
                  {(() => {
                    const NextIcon = nextStep.icon;
                    return <NextIcon className="h-4 w-4 mr-2" />;
                  })()}
                  Lengkapi: {nextStep.title}
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </motion.div>
            )}

            {/* All complete celebration */}
            {isAllComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-slate-100 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Profil lengkap!</span>
                </div>
                <p className="text-xs text-slate-400">Anda siap mendapatkan proyek di TenderPro</p>
              </motion.div>
            )}

            {/* Dismiss button */}
            {!isAllComplete && (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-slate-600 h-7"
                  onClick={handleDismiss}
                >
                  Sembunyikan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

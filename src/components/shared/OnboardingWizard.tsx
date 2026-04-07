'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Wrench,
  Building2,
  User,
  Camera,
  Bell,
  PartyPopper,
  X,
  Shield,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'tenderpro_onboarding_complete';

const TOTAL_STEPS = 5;

const CATEGORIES = [
  'Pembangunan Baru',
  'Renovasi',
  'Interior',
  'Konstruksi',
  'MEP',
  'Lainnya',
];

const STEP_META = [
  { label: 'Selamat Datang', gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Profil', gradient: 'from-amber-500 to-orange-500' },
  { label: 'Foto', gradient: 'from-violet-500 to-purple-600' },
  { label: 'Preferensi', gradient: 'from-sky-500 to-teal-500' },
  { label: 'Selesai', gradient: 'from-green-500 to-emerald-600' },
];

interface OnboardingData {
  role: 'OWNER' | 'CONTRACTOR' | '';
  companyName: string;
  specialization: string;
  city: string;
  description: string;
  profilePhotoUrl: string;
  notifications: {
    email: boolean;
    project_updates: boolean;
    new_bids: boolean;
    marketing: boolean;
  };
  interests: string[];
}

const initialData: OnboardingData = {
  role: '',
  companyName: '',
  specialization: '',
  city: '',
  description: '',
  profilePhotoUrl: '',
  notifications: {
    email: true,
    project_updates: true,
    new_bids: true,
    marketing: false,
  },
  interests: [],
};

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Confetti Particles ─────────────────────────────────────
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const startX = Math.random() * 100;
  const drift = (Math.random() - 0.5) * 200;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm pointer-events-none"
      style={{
        backgroundColor: color,
        left: `${startX}%`,
        top: '-10px',
      }}
      initial={{ y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        y: [0, 300, 500],
        x: [0, drift, drift * 1.5],
        rotate: [0, 360, 720],
        scale: [1, 1.2, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(STORAGE_KEY);
    return !completed;
  });

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    goNext();
  }, [goNext]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    onComplete?.(data);
  }, [data, onComplete]);

  const toggleInterest = (category: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(category)
        ? prev.interests.filter((c) => c !== category)
        : [...prev.interests, category],
    }));
  };

  const toggleNotification = (key: keyof OnboardingData['notifications']) => {
    setData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const simulatePhotoUpload = () => {
    setData((prev) => ({
      ...prev,
      profilePhotoUrl: '/api/placeholder/avatar/150/150',
    }));
  };

  if (!visible) return null;

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <Card className="shadow-2xl border-slate-200 overflow-hidden">
          {/* Step progress indicator */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500">
                Langkah {currentStep + 1} dari {TOTAL_STEPS}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-600"
                onClick={finish}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Visual step indicators with connecting lines */}
            <div className="flex items-center gap-0 mb-4">
              {STEP_META.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                const isLast = idx === STEP_META.length - 1;

                return (
                  <div key={idx} className="flex items-center flex-1 last:flex-none">
                    {/* Step circle */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-200'
                          : isCurrent
                          ? `bg-gradient-to-br ${step.gradient} text-white shadow-md`
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </motion.div>
                    {/* Connecting line */}
                    {!isLast && (
                      <div className="flex-1 mx-1 h-[2px] rounded-full overflow-hidden bg-slate-100">
                        <motion.div
                          initial={false}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step label */}
            <div className="text-center">
              <span className="text-xs text-slate-400 font-medium">{STEP_META[currentStep].label}</span>
            </div>
          </div>

          <CardContent className="pt-2 pb-6">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ─── Step 1: Welcome + Role ─────────────────── */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Illustration area */}
                  <div className="relative -mx-6 -mt-2 mb-6 overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-8 text-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative">
                      <motion.div
                        className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                      >
                        <PartyPopper className="h-10 w-10 text-white" />
                      </motion.div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Selamat Datang di TenderPro!
                      </h2>
                      <p className="text-white/70 text-sm">
                        Pilih peran Anda untuk pengalaman yang lebih personal.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        data.role === 'OWNER'
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setData((p) => ({ ...p, role: 'OWNER' }))}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          data.role === 'OWNER'
                            ? 'bg-gradient-to-br from-primary to-teal-600 shadow-md'
                            : 'bg-slate-100'
                        }`}>
                          <Building2 className={`h-7 w-7 ${
                            data.role === 'OWNER' ? 'text-white' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-base">Pemilik Proyek</p>
                          <p className="text-xs text-slate-500">Posting proyek dan cari kontraktor terbaik</p>
                        </div>
                        {data.role === 'OWNER' && (
                          <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                        )}
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        data.role === 'CONTRACTOR'
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setData((p) => ({ ...p, role: 'CONTRACTOR' }))}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          data.role === 'CONTRACTOR'
                            ? 'bg-gradient-to-br from-primary to-teal-600 shadow-md'
                            : 'bg-slate-100'
                        }`}>
                          <Wrench className={`h-7 w-7 ${
                            data.role === 'CONTRACTOR' ? 'text-white' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-base">Kontraktor</p>
                          <p className="text-xs text-slate-500">Tawarkan jasa dan temukan proyek</p>
                        </div>
                        {data.role === 'CONTRACTOR' && (
                          <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 2: Company Profile ────────────────── */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Illustration area */}
                  <div className="relative -mx-6 -mt-2 mb-6 overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                      >
                        <Briefcase className="h-8 w-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold text-white">Profil Perusahaan</h2>
                      <p className="text-white/70 text-sm">Ceritakan tentang perusahaan Anda</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName" className="text-xs font-semibold text-slate-600">Nama Perusahaan</Label>
                      <Input
                        id="companyName"
                        placeholder="PT. Konstruksi Sejahtera"
                        value={data.companyName}
                        onChange={(e) => setData((p) => ({ ...p, companyName: e.target.value }))}
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialization" className="text-xs font-semibold text-slate-600">Spesialisasi</Label>
                      <Input
                        id="specialization"
                        placeholder="Renovasi, Pembangunan Baru..."
                        value={data.specialization}
                        onChange={(e) => setData((p) => ({ ...p, specialization: e.target.value }))}
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-xs font-semibold text-slate-600">Kota</Label>
                      <Input
                        id="city"
                        placeholder="Jakarta, Bandung..."
                        value={data.city}
                        onChange={(e) => setData((p) => ({ ...p, city: e.target.value }))}
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs font-semibold text-slate-600">Deskripsi Singkat</Label>
                      <Textarea
                        id="description"
                        placeholder="Deskripsikan perusahaan Anda..."
                        value={data.description}
                        onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))}
                        className="mt-1.5 resize-none h-11"
                        rows={3}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: Profile Photo ──────────────────── */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Illustration area */}
                  <div className="relative -mx-6 -mt-2 mb-6 overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 p-8 text-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold text-white">Foto Profil</h2>
                      <p className="text-white/70 text-sm">Tambahkan foto agar lebih dikenal</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <motion.div
                      className="w-32 h-32 rounded-full bg-slate-100 border-4 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {data.profilePhotoUrl ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center">
                          <User className="h-16 w-16 text-primary" />
                        </div>
                      ) : (
                        <Camera className="h-10 w-10 text-slate-300" />
                      )}
                      {!data.profilePhotoUrl && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md">
                          <Camera className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </motion.div>

                    <Button
                      variant="outline"
                      className="rounded-xl h-10 border-slate-200"
                      onClick={simulatePhotoUpload}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {data.profilePhotoUrl ? 'Ganti Foto' : 'Unggah Foto'}
                    </Button>

                    {data.profilePhotoUrl && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-emerald-600 flex items-center gap-1 font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Foto berhasil diunggah!
                      </motion.p>
                    )}

                    <p className="text-xs text-slate-400 text-center">
                      Mendukung format JPG, PNG, dan GIF. Ukuran maksimum 5MB.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 4: Preferences ────────────────────── */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Illustration area */}
                  <div className="relative -mx-6 -mt-2 mb-6 overflow-hidden bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 p-8 text-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                      >
                        <Settings2 className="h-8 w-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold text-white">Preferensi</h2>
                      <p className="text-white/70 text-sm">Atur notifikasi dan minat Anda</p>
                    </div>
                  </div>

                  {/* Notification preferences */}
                  <div className="mb-5">
                    <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                        <Bell className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      Notifikasi
                    </h3>
                    <div className="space-y-2">
                      {([
                        { key: 'email' as const, label: 'Notifikasi Email', desc: 'Terima pemberitahuan melalui email' },
                        { key: 'project_updates' as const, label: 'Update Proyek', desc: 'Perubahan status proyek yang diikuti' },
                        { key: 'new_bids' as const, label: 'Penawaran Baru', desc: 'Penawaran baru untuk proyek Anda' },
                        { key: 'marketing' as const, label: 'Info & Promosi', desc: 'Tips dan penawaran dari TenderPro' },
                      ]).map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                          <Switch
                            checked={data.notifications[item.key]}
                            onCheckedChange={() => toggleNotification(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interest categories */}
                  <div>
                    <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                      </div>
                      Kategori Minat
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <Badge
                          key={cat}
                          variant={data.interests.includes(cat) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all duration-200 text-sm px-3 py-1.5 rounded-lg ${
                            data.interests.includes(cat)
                              ? 'bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-sm'
                              : 'hover:bg-slate-100 hover:border-slate-300'
                          }`}
                          onClick={() => toggleInterest(cat)}
                        >
                          {data.interests.includes(cat) && <CheckCircle className="h-3 w-3 mr-1" />}
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    {data.interests.length === 0 && (
                      <p className="text-xs text-slate-400 mt-2">
                        Pilih kategori yang Anda minati untuk rekomendasi yang lebih baik.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── Step 5: Complete! ──────────────────────── */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="relative overflow-hidden">
                    {/* Confetti */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <ConfettiParticle key={i} delay={i * 0.04} />
                      ))}
                    </div>

                    {/* Illustration area */}
                    <div className="relative -mx-6 -mt-2 mb-6 overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                      <div className="relative">
                        <motion.div
                          className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-xl"
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                        >
                          <Shield className="h-12 w-12 text-white" />
                        </motion.div>
                        <motion.h2
                          className="text-3xl font-bold text-white mb-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          Semua Siap!
                        </motion.h2>
                        <motion.p
                          className="text-white/70 text-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          Selamat memulai perjalanan dengan TenderPro!
                        </motion.p>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-2 text-left max-w-xs mx-auto mb-8">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-sm text-slate-600">
                          Peran: <span className="font-medium">{data.role === 'OWNER' ? 'Pemilik Proyek' : data.role === 'CONTRACTOR' ? 'Kontraktor' : 'Belum dipilih'}</span>
                        </p>
                      </motion.div>
                      {data.companyName && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 }}
                          className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            Perusahaan: <span className="font-medium">{data.companyName}</span>
                          </p>
                        </motion.div>
                      )}
                      {data.interests.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 }}
                          className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            Minat: <span className="font-medium">{data.interests.join(', ')}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                      className="text-center"
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary via-teal-500 to-emerald-500 hover:from-primary/90 hover:via-teal-500/90 hover:to-emerald-500/90 text-white rounded-xl px-10 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                        onClick={finish}
                      >
                        Mulai Sekarang
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Navigation buttons */}
          {currentStep < TOTAL_STEPS - 1 && (
            <div className="px-6 pb-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={goBack} className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentStep >= 1 && currentStep <= 3 && (
                  <Button variant="ghost" size="sm" onClick={skip} className="text-slate-400 hover:text-slate-600">
                    Lewati
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white rounded-xl shadow-md shadow-primary/15 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                  onClick={goNext}
                  disabled={currentStep === 0 && !data.role}
                >
                  Lanjut
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

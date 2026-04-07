'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, UserPlus, ChevronRight, ChevronLeft, Check, Building, Shield, Store, Handshake, Sparkles } from 'lucide-react';
import { UserRole } from '@/lib/auth-store';
import { RegisterForm, defaultRegisterForm } from '@/types';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenLogin: () => void;
}

// Indonesian provinces
const PROVINSI_INDONESIA = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi',
  'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Bali',
  'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo',
  'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat',
  'Papua', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
  'Papua Barat Daya',
];

// Company type visual cards
const COMPANY_TYPES = [
  {
    value: 'PT',
    label: 'PT',
    description: 'Perseroan Terbatas',
    icon: Building,
    gradient: 'from-primary to-teal-600',
    bgLight: 'bg-primary/5',
    borderLight: 'border-primary/20',
  },
  {
    value: 'CV',
    label: 'CV',
    description: 'Commanditaire Vennootschap',
    icon: Store,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
  },
  {
    value: 'Firma',
    label: 'Firma',
    description: 'Perusahaan Firma',
    icon: Handshake,
    gradient: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
  },
  {
    value: 'Koperasi',
    label: 'Koperasi',
    description: 'Koperasi Usaha',
    icon: Shield,
    gradient: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
  },
  {
    value: 'Perorangan',
    label: 'Perorangan',
    description: 'Usaha Individu',
    icon: User,
    gradient: 'from-slate-500 to-slate-600',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
  },
];

// Owner company types (simplified)
const OWNER_COMPANY_TYPES = COMPANY_TYPES.filter(c => ['PT', 'CV', 'Perorangan'].includes(c.value));

// Step transition animation variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
  }),
};

// Shake animation for form errors
const shakeVariants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

// Password strength calculation
function getPasswordStrength(password: string): { score: number; label: string; color: string; gradient: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: 'bg-red-500', gradient: 'from-red-500 to-red-400' };
  if (score === 2) return { score: 40, label: 'Lemah', color: 'bg-orange-500', gradient: 'from-orange-500 to-amber-400' };
  if (score === 3) return { score: 60, label: 'Cukup', color: 'bg-amber-500', gradient: 'from-amber-500 to-yellow-400' };
  if (score === 4) return { score: 80, label: 'Kuat', color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-400' };
  return { score: 100, label: 'Sangat Kuat', color: 'bg-primary', gradient: 'from-primary to-teal-500' };
}

export function RegisterModal({ open, onOpenChange, onSubmit, onOpenLogin }: RegisterModalProps) {
  const [registerRole, setRegisterRole] = useState<UserRole>('OWNER');
  const [registerStep, setRegisterStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(defaultRegisterForm);
  const [direction, setDirection] = useState(1); // Track animation direction

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    await onSubmit(e);
    setRegisterLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setRegisterStep(1);
    setDirection(1);
    setRegisterForm(defaultRegisterForm);
  };

  const goNext = () => {
    setDirection(1);
    setRegisterStep(2);
  };

  const goBack = () => {
    setDirection(-1);
    setRegisterStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 text-center flex-shrink-0 relative overflow-hidden">
          {/* Decorative background circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

          <div className="relative">
            <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">Daftar Akun Baru</DialogTitle>
            <DialogDescription className="text-white/70 mt-0.5">
              Bergabung dengan TenderPro sekarang
            </DialogDescription>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className={`flex items-center gap-2 ${registerStep >= 1 ? 'text-primary' : 'text-slate-400'}`}
              animate={{ scale: registerStep === 1 ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                registerStep >= 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
              }`}>
                {registerStep > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Informasi Dasar</span>
            </motion.div>
            <div className="flex-1 relative h-0.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-teal-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: registerStep >= 2 ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
            <motion.div
              className={`flex items-center gap-2 ${registerStep >= 2 ? 'text-primary' : 'text-slate-400'}`}
              animate={{ scale: registerStep === 2 ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                registerStep >= 2 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Informasi Perusahaan</span>
            </motion.div>
          </div>
        </div>

        <div className="px-6 pb-6 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={registerStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Step 1: Basic Info */}
                {registerStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Daftar Sebagai</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant={registerRole === 'OWNER' ? 'default' : 'outline'}
                            className={`h-12 transition-all duration-200 justify-start ${
                              registerRole === 'OWNER'
                                ? 'bg-gradient-to-r from-primary to-teal-600 shadow-md shadow-primary/20 hover:shadow-lg text-white border-0'
                                : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                            }`}
                            onClick={() => setRegisterRole('OWNER')}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-2 ${
                              registerRole === 'OWNER' ? 'bg-white/20' : 'bg-primary/10'
                            }`}>
                              <User className={`h-4 w-4 ${registerRole === 'OWNER' ? 'text-white' : 'text-primary'}`} />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold">Pemilik Proyek</div>
                              <div className={`text-[10px] ${registerRole === 'OWNER' ? 'text-white/70' : 'text-slate-400'}`}>Cari kontraktor terbaik</div>
                            </div>
                            {registerRole === 'OWNER' && <Check className="h-4 w-4 ml-auto text-white/80" />}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant={registerRole === 'CONTRACTOR' ? 'default' : 'outline'}
                            className={`h-12 transition-all duration-200 justify-start ${
                              registerRole === 'CONTRACTOR'
                                ? 'bg-gradient-to-r from-primary to-teal-600 shadow-md shadow-primary/20 hover:shadow-lg text-white border-0'
                                : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                            }`}
                            onClick={() => setRegisterRole('CONTRACTOR')}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-2 ${
                              registerRole === 'CONTRACTOR' ? 'bg-white/20' : 'bg-primary/10'
                            }`}>
                              <Building2 className={`h-4 w-4 ${registerRole === 'CONTRACTOR' ? 'text-white' : 'text-primary'}`} />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold">Kontraktor</div>
                              <div className={`text-[10px] ${registerRole === 'CONTRACTOR' ? 'text-white/70' : 'text-slate-400'}`}>Temukan proyek tender</div>
                            </div>
                            {registerRole === 'CONTRACTOR' && <Check className="h-4 w-4 ml-auto text-white/80" />}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="register-name" className="text-sm font-semibold text-slate-700">Nama Lengkap *</Label>
                        <motion.div whileFocus={{ scale: 1.01 }}>
                          <Input
                            id="register-name"
                            placeholder="Masukkan nama lengkap"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                            required
                            className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                          />
                        </motion.div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="register-email" className="text-sm font-semibold text-slate-700">Email *</Label>
                        <motion.div whileFocus={{ scale: 1.01 }}>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="email@contoh.com"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            required
                            className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                          />
                        </motion.div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="register-phone" className="text-sm font-semibold text-slate-700">Nomor HP</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="register-password" className="text-sm font-semibold text-slate-700">Password *</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          className={`h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 ${
                            registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password
                              ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400'
                              : registerForm.confirmPassword && registerForm.confirmPassword === registerForm.password
                              ? 'border-emerald-300 focus-visible:ring-emerald-200'
                              : ''
                          }`}
                        />

                        {/* Password strength meter */}
                        {registerForm.password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1.5"
                          >
                            {/* Strength bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full bg-gradient-to-r ${passwordStrength.gradient} rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${passwordStrength.score}%` }}
                                  transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                              </div>
                              <span className={`text-[10px] font-semibold ${
                                passwordStrength.score <= 40 ? 'text-red-500' :
                                passwordStrength.score <= 60 ? 'text-amber-500' :
                                'text-emerald-600'
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>

                            {/* Requirement checklist */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {[
                                { met: registerForm.password.length >= 6, label: 'Min 6 karakter' },
                                { met: registerForm.password.length >= 8, label: 'Min 8 karakter' },
                                { met: /[A-Z]/.test(registerForm.password), label: 'Huruf kapital' },
                                { met: /[0-9]/.test(registerForm.password), label: 'Angka' },
                                { met: /[^A-Za-z0-9]/.test(registerForm.password), label: 'Simbol' },
                              ].map((req) => (
                                <span key={req.label} className={`text-[10px] flex items-center gap-0.5 transition-colors duration-200 ${
                                  req.met ? 'text-emerald-600' : 'text-slate-300'
                                }`}>
                                  {req.met ? <Check className="h-2.5 w-2.5" /> : <span className="h-1.5 w-1.5 rounded-full border border-current inline-block" />}
                                  {req.label}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="register-confirm-password" className="text-sm font-semibold text-slate-700">Konfirmasi Password *</Label>
                      <motion.div variants={shakeVariants} animate={registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password && registerForm.confirmPassword.length >= registerForm.password.length ? 'shake' : undefined}>
                        <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder="Ulangi password"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          required
                          className={`h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 ${
                            registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password
                              ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400'
                              : registerForm.confirmPassword && registerForm.confirmPassword === registerForm.password
                              ? 'border-emerald-300 focus-visible:ring-emerald-200'
                              : ''
                          }`}
                        />
                      </motion.div>
                      {registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500" />
                          Password tidak cocok
                        </motion.p>
                      )}
                      {registerForm.confirmPassword && registerForm.confirmPassword === registerForm.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-emerald-600 mt-1 flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Password cocok
                        </motion.p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Company Info */}
                {registerStep === 2 && (
                  <div className="space-y-4">
                    {registerRole === 'CONTRACTOR' ? (
                      <>
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-xl border border-primary/10 mb-2 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-primary font-medium">
                            <strong>Kontraktor:</strong> Lengkapi informasi perusahaan untuk meningkatkan kepercayaan klien.
                          </p>
                        </div>

                        {/* Section: Data Perusahaan */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            Data Perusahaan
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor="company-name">Nama Perusahaan *</Label>
                              <Input
                                id="company-name"
                                placeholder="PT Contoh Perusahaan"
                                value={registerForm.companyName}
                                onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                                required
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>

                            {/* Company type as visual cards */}
                            <div className="space-y-1.5 md:col-span-2">
                              <Label>Jenis Perusahaan</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {COMPANY_TYPES.map((type) => {
                                  const isSelected = registerForm.companyType === type.value;
                                  return (
                                    <motion.div
                                      key={type.value}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setRegisterForm({ ...registerForm, companyType: type.value })}
                                        className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                                          isSelected
                                            ? `border-primary ${type.bgLight} shadow-sm`
                                            : 'border-slate-100 hover:border-slate-200 bg-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                                            isSelected
                                              ? `bg-gradient-to-br ${type.gradient} text-white`
                                              : 'bg-slate-100 text-slate-400'
                                          }`}>
                                            <type.icon className="h-3.5 w-3.5" />
                                          </div>
                                          <span className={`text-sm font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {type.label}
                                          </span>
                                          {isSelected && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="ml-auto"
                                            >
                                              <Check className="h-4 w-4 text-primary" />
                                            </motion.div>
                                          )}
                                        </div>
                                        <p className={`text-[10px] leading-tight ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                                          {type.description}
                                        </p>
                                      </button>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="specialization">Spesialisasi</Label>
                              <Input
                                id="specialization"
                                placeholder="Contoh: Pembangunan, Renovasi"
                                value={registerForm.specialization}
                                onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section: Legalitas */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-teal-500 rounded-full" />
                            Legalitas & Pengalaman
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="npwp">NPWP</Label>
                              <Input
                                id="npwp"
                                placeholder="Nomor Pokok Wajib Pajak"
                                value={registerForm.npwp}
                                onChange={(e) => setRegisterForm({ ...registerForm, npwp: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="nib">NIB</Label>
                              <Input
                                id="nib"
                                placeholder="Nomor Induk Berusaha"
                                value={registerForm.nib}
                                onChange={(e) => setRegisterForm({ ...registerForm, nib: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="experience-years">Pengalaman (tahun)</Label>
                              <Input
                                id="experience-years"
                                type="number"
                                placeholder="0"
                                value={registerForm.experienceYears}
                                onChange={(e) => setRegisterForm({ ...registerForm, experienceYears: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="employee-count">Jumlah Karyawan</Label>
                              <Input
                                id="employee-count"
                                type="number"
                                placeholder="0"
                                value={registerForm.employeeCount}
                                onChange={(e) => setRegisterForm({ ...registerForm, employeeCount: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section: Alamat */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            Alamat
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor="address">Alamat</Label>
                              <Input
                                id="address"
                                placeholder="Alamat lengkap"
                                value={registerForm.address}
                                onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="city">Kota</Label>
                              <Input
                                id="city"
                                placeholder="Nama kota"
                                value={registerForm.city}
                                onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            {/* Province dropdown with Indonesian province list */}
                            <div className="space-y-1.5">
                              <Label htmlFor="province">Provinsi</Label>
                              <Select value={registerForm.province} onValueChange={(value) => setRegisterForm({ ...registerForm, province: value })}>
                                <SelectTrigger id="province" className="h-11 border-slate-200 focus:ring-primary/20 focus:border-primary/40">
                                  <SelectValue placeholder="Pilih provinsi" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {PROVINSI_INDONESIA.map((prov) => (
                                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="postal-code">Kode Pos</Label>
                              <Input
                                id="postal-code"
                                placeholder="12345"
                                value={registerForm.postalCode}
                                onChange={(e) => setRegisterForm({ ...registerForm, postalCode: e.target.value })}
                                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor="description">Deskripsi Perusahaan</Label>
                              <Textarea
                                id="description"
                                placeholder="Jelaskan tentang perusahaan Anda..."
                                value={registerForm.description}
                                onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                                rows={3}
                                className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 mb-2 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="h-4 w-4 text-slate-500" />
                          </div>
                          <p className="text-sm text-slate-600">
                            <strong>Opsional:</strong> Lengkapi informasi perusahaan untuk kredibilitas lebih tinggi.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="owner-company-name">Nama Perusahaan</Label>
                            <Input
                              id="owner-company-name"
                              placeholder="PT Contoh Perusahaan (opsional)"
                              value={registerForm.ownerCompanyName}
                              onChange={(e) => setRegisterForm({ ...registerForm, ownerCompanyName: e.target.value })}
                              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                            />
                          </div>

                          {/* Company type as visual cards for owner */}
                          <div className="space-y-1.5 md:col-span-2">
                            <Label>Jenis Perusahaan</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {OWNER_COMPANY_TYPES.map((type) => {
                                const isSelected = registerForm.ownerCompanyType === type.value;
                                return (
                                  <motion.div
                                    key={type.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setRegisterForm({ ...registerForm, ownerCompanyType: type.value })}
                                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                                        isSelected
                                          ? `border-primary ${type.bgLight} shadow-sm`
                                          : 'border-slate-100 hover:border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                                          isSelected
                                            ? `bg-gradient-to-br ${type.gradient} text-white`
                                            : 'bg-slate-100 text-slate-400'
                                        }`}>
                                          <type.icon className="h-3 w-3" />
                                        </div>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                                          {type.label}
                                        </span>
                                        {isSelected && (
                                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                                            <Check className="h-3.5 w-3.5 text-primary" />
                                          </motion.div>
                                        )}
                                      </div>
                                      <p className={`text-[9px] leading-tight ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {type.description}
                                      </p>
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="owner-npwp">NPWP</Label>
                            <Input
                              id="owner-npwp"
                              placeholder="Nomor Pokok Wajib Pajak"
                              value={registerForm.ownerNpwp}
                              onChange={(e) => setRegisterForm({ ...registerForm, ownerNpwp: e.target.value })}
                              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="owner-address">Alamat</Label>
                            <Input
                              id="owner-address"
                              placeholder="Alamat lengkap"
                              value={registerForm.ownerAddress}
                              onChange={(e) => setRegisterForm({ ...registerForm, ownerAddress: e.target.value })}
                              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="owner-city">Kota</Label>
                            <Input
                              id="owner-city"
                              placeholder="Nama kota"
                              value={registerForm.ownerCity}
                              onChange={(e) => setRegisterForm({ ...registerForm, ownerCity: e.target.value })}
                              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                            />
                          </div>
                          {/* Province dropdown with Indonesian province list for owner */}
                          <div className="space-y-1.5">
                            <Label htmlFor="owner-province">Provinsi</Label>
                            <Select value={registerForm.ownerProvince} onValueChange={(value) => setRegisterForm({ ...registerForm, ownerProvince: value })}>
                              <SelectTrigger id="owner-province" className="h-11 border-slate-200 focus:ring-primary/20 focus:border-primary/40">
                                <SelectValue placeholder="Pilih provinsi" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {PROVINSI_INDONESIA.map((prov) => (
                                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="owner-postal-code">Kode Pos</Label>
                            <Input
                              id="owner-postal-code"
                              placeholder="12345"
                              value={registerForm.ownerPostalCode}
                              onChange={(e) => setRegisterForm({ ...registerForm, ownerPostalCode: e.target.value })}
                              className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-3 pt-5 border-t border-slate-100">
                  {registerStep === 1 ? (
                    <>
                      <Button type="button" variant="outline" className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50" onClick={handleClose}>
                        Batal
                      </Button>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button type="button" className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg gap-2" onClick={goNext}>
                          Lanjutkan <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="outline" className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50 gap-2" onClick={goBack}>
                        <ChevronLeft className="h-4 w-4" /> Kembali
                      </Button>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button type="submit" className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg" disabled={registerLoading}>
                          {registerLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Memproses...
                            </span>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Daftar Sekarang
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Link to Login */}
                <p className="text-center text-sm text-slate-500 pt-1">
                  Sudah punya akun?{' '}
                  <button type="button" className="text-primary font-semibold hover:underline underline-offset-2 transition-all duration-200" onClick={onOpenLogin}>
                    Masuk di sini
                  </button>
                </p>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

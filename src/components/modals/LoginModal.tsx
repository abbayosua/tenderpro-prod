'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building2, LogIn, Sparkles, Check } from 'lucide-react';
import { UserRole } from '@/lib/auth-store';

const DEMO_ACCOUNTS = {
  OWNER: {
    email: 'budi.santoso@propertydev.co.id',
    password: 'demo123',
    label: 'Budi Santoso',
    sublabel: 'Pemilik Proyek',
  },
  CONTRACTOR: {
    email: 'ahmad.wijaya@karyamandiri.co.id',
    password: 'demo123',
    label: 'Ahmad Wijaya',
    sublabel: 'PT Karya Mandiri Konstruksi',
  },
} as const;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loginRole: UserRole;
  setLoginRole: (role: UserRole) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOpenRegister: () => void;
}

export function LoginModal({
  open,
  onOpenChange,
  loginRole,
  setLoginRole,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  onSubmit,
  onOpenRegister,
}: LoginModalProps) {
  const [demoFilled, setDemoFilled] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleDemoFill = () => {
    const demo = DEMO_ACCOUNTS[loginRole];
    setEmail(demo.email);
    setPassword(demo.password);
    setDemoFilled(true);
    // Auto-submit after state updates
    setTimeout(() => {
      formRef.current?.requestSubmit();
      setDemoFilled(false);
    }, 300);
  };

  const isDemoFilled = email === DEMO_ACCOUNTS[loginRole].email && password === DEMO_ACCOUNTS[loginRole].password;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-8 text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <LogIn className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">Masuk ke TenderPro</DialogTitle>
          <DialogDescription className="text-white/70 mt-1">
            Pilih peran Anda dan masukkan kredensial
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 pt-5">
          <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Masuk Sebagai</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={loginRole === 'OWNER' ? 'default' : 'outline'}
                  className={`h-12 transition-all duration-200 ${
                    loginRole === 'OWNER'
                      ? 'bg-primary shadow-md shadow-primary/20 hover:bg-primary/90'
                      : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                  onClick={() => setLoginRole('OWNER')}
                >
                  <User className="h-4 w-4 mr-2" /> Pemilik Proyek
                </Button>
                <Button
                  type="button"
                  variant={loginRole === 'CONTRACTOR' ? 'default' : 'outline'}
                  className={`h-12 transition-all duration-200 ${
                    loginRole === 'CONTRACTOR'
                      ? 'bg-primary shadow-md shadow-primary/20 hover:bg-primary/90'
                      : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                  onClick={() => setLoginRole('CONTRACTOR')}
                >
                  <Building2 className="h-4 w-4 mr-2" /> Kontraktor
                </Button>
              </div>
            </div>

            {/* Demo Account Button */}
            <div className="relative">
              <button
                type="button"
                onClick={handleDemoFill}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed text-sm font-medium transition-all duration-300 ${
                  isDemoFilled
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : demoFilled
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {isDemoFilled ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Akun demo sudah diisi — langsung masuk!</span>
                  </>
                ) : demoFilled ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Akun demo berhasil diisi!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Coba Akun Demo — <span className="font-semibold">{DEMO_ACCOUNTS[loginRole].label}</span> ({DEMO_ACCOUNTS[loginRole].sublabel})</span>
                  </>
                )}
              </button>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setDemoFilled(false); }}
                required
                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setDemoFilled(false); }}
                required
                className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>

            {/* Register link */}
            <p className="text-center text-sm text-slate-600 pt-1">
              Belum punya akun?{' '}
              <button
                type="button"
                className="text-primary font-semibold hover:underline underline-offset-2 transition-all duration-200"
                onClick={onOpenRegister}
              >
                Daftar di sini
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

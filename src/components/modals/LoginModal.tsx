'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building2, LogIn } from 'lucide-react';
import { UserRole } from '@/lib/auth-store';

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
          <form onSubmit={onSubmit} className="space-y-5">
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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

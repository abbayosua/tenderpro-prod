'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building2 } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Masuk ke TenderPro</DialogTitle>
          <DialogDescription>Pilih peran Anda dan masukkan kredensial untuk melanjutkan</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Masuk Sebagai</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={loginRole === 'OWNER' ? 'default' : 'outline'}
                className={loginRole === 'OWNER' ? 'bg-primary hover:bg-primary/90' : ''}
                onClick={() => setLoginRole('OWNER')}
              >
                <User className="h-4 w-4 mr-2" /> Pemilik Proyek
              </Button>
              <Button
                type="button"
                variant={loginRole === 'CONTRACTOR' ? 'default' : 'outline'}
                className={loginRole === 'CONTRACTOR' ? 'bg-primary hover:bg-primary/90' : ''}
                onClick={() => setLoginRole('CONTRACTOR')}
              >
                <Building2 className="h-4 w-4 mr-2" /> Kontraktor
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* Demo Credential Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">Klik untuk mengisi kredensial demo:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setEmail('info@ptbangunpermai.co.id');
                  setPassword('password123');
                  setLoginRole('CONTRACTOR');
                }}
              >
                <Building2 className="h-3 w-3 mr-1" /> Demo Kontraktor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setEmail('andriansyah@gmail.com');
                  setPassword('password123');
                  setLoginRole('OWNER');
                }}
              >
                <User className="h-3 w-3 mr-1" /> Demo Owner
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Masuk'}
          </Button>
          <p className="text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <button type="button" className="text-primary hover:underline font-medium" onClick={onOpenRegister}>
              Daftar di sini
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

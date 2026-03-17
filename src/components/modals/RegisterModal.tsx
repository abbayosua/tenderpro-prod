'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, UserPlus, ChevronRight } from 'lucide-react';
import { UserRole } from '@/lib/auth-store';
import { RegisterForm, defaultRegisterForm } from '@/types';
import { useState } from 'react';

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenLogin: () => void;
}

export function RegisterModal({ open, onOpenChange, onSubmit, onOpenLogin }: RegisterModalProps) {
  const [registerRole, setRegisterRole] = useState<UserRole>('OWNER');
  const [registerStep, setRegisterStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(defaultRegisterForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    // Call parent onSubmit
    await onSubmit(e);
    setRegisterLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setRegisterStep(1);
    setRegisterForm(defaultRegisterForm);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Daftar Akun Baru
          </DialogTitle>
          <DialogDescription>
            Langkah {registerStep} dari 2 - {registerStep === 1 ? 'Informasi Dasar' : 'Informasi Perusahaan'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Basic Info */}
          {registerStep === 1 && (
            <>
              <div className="space-y-2">
                <Label>Daftar Sebagai</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={registerRole === 'OWNER' ? 'default' : 'outline'}
                    className={registerRole === 'OWNER' ? 'bg-primary hover:bg-primary/90' : ''}
                    onClick={() => setRegisterRole('OWNER')}
                  >
                    <User className="h-4 w-4 mr-2" /> Pemilik Proyek
                  </Button>
                  <Button
                    type="button"
                    variant={registerRole === 'CONTRACTOR' ? 'default' : 'outline'}
                    className={registerRole === 'CONTRACTOR' ? 'bg-primary hover:bg-primary/90' : ''}
                    onClick={() => setRegisterRole('CONTRACTOR')}
                  >
                    <Building2 className="h-4 w-4 mr-2" /> Kontraktor
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nama Lengkap *</Label>
                  <Input
                    id="register-name"
                    placeholder="Masukkan nama lengkap"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email *</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Nomor HP</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password *</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Konfirmasi Password *</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Ulangi password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          {/* Step 2: Company Info */}
          {registerStep === 2 && (
            <>
              {registerRole === 'CONTRACTOR' ? (
                /* Contractor Company Fields */
                <>
                  <div className="p-4 bg-primary/10 rounded-lg mb-4">
                    <p className="text-sm text-primary">
                      <strong>Kontraktor:</strong> Lengkapi informasi perusahaan untuk meningkatkan kepercayaan klien.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="company-name">Nama Perusahaan *</Label>
                      <Input
                        id="company-name"
                        placeholder="PT Contoh Perusahaan"
                        value={registerForm.companyName}
                        onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-type">Jenis Perusahaan</Label>
                      <Select value={registerForm.companyType} onValueChange={(value) => setRegisterForm({ ...registerForm, companyType: value })}>
                        <SelectTrigger id="company-type">
                          <SelectValue placeholder="Pilih jenis perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                          <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                          <SelectItem value="Firma">Firma</SelectItem>
                          <SelectItem value="Koperasi">Koperasi</SelectItem>
                          <SelectItem value="Perorangan">Perorangan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Spesialisasi</Label>
                      <Input
                        id="specialization"
                        placeholder="Contoh: Pembangunan, Renovasi, Interior"
                        value={registerForm.specialization}
                        onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        placeholder="Nomor Pokok Wajib Pajak"
                        value={registerForm.npwp}
                        onChange={(e) => setRegisterForm({ ...registerForm, npwp: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nib">NIB</Label>
                      <Input
                        id="nib"
                        placeholder="Nomor Induk Berusaha"
                        value={registerForm.nib}
                        onChange={(e) => setRegisterForm({ ...registerForm, nib: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience-years">Pengalaman (tahun)</Label>
                      <Input
                        id="experience-years"
                        type="number"
                        placeholder="0"
                        value={registerForm.experienceYears}
                        onChange={(e) => setRegisterForm({ ...registerForm, experienceYears: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-count">Jumlah Karyawan</Label>
                      <Input
                        id="employee-count"
                        type="number"
                        placeholder="0"
                        value={registerForm.employeeCount}
                        onChange={(e) => setRegisterForm({ ...registerForm, employeeCount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat</Label>
                      <Input
                        id="address"
                        placeholder="Alamat lengkap"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota</Label>
                      <Input
                        id="city"
                        placeholder="Nama kota"
                        value={registerForm.city}
                        onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi</Label>
                      <Input
                        id="province"
                        placeholder="Nama provinsi"
                        value={registerForm.province}
                        onChange={(e) => setRegisterForm({ ...registerForm, province: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">Kode Pos</Label>
                      <Input
                        id="postal-code"
                        placeholder="12345"
                        value={registerForm.postalCode}
                        onChange={(e) => setRegisterForm({ ...registerForm, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Deskripsi Perusahaan</Label>
                      <Textarea
                        id="description"
                        placeholder="Jelaskan tentang perusahaan Anda..."
                        value={registerForm.description}
                        onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Owner Company Fields (Optional) */
                <>
                  <div className="p-4 bg-slate-50 rounded-lg mb-4">
                    <p className="text-sm text-slate-600">
                      <strong>Opsional:</strong> Lengkapi informasi perusahaan untuk kredibilitas lebih tinggi.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner-company-name">Nama Perusahaan</Label>
                      <Input
                        id="owner-company-name"
                        placeholder="PT Contoh Perusahaan (opsional)"
                        value={registerForm.ownerCompanyName}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerCompanyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-company-type">Jenis Perusahaan</Label>
                      <Select value={registerForm.ownerCompanyType} onValueChange={(value) => setRegisterForm({ ...registerForm, ownerCompanyType: value })}>
                        <SelectTrigger id="owner-company-type">
                          <SelectValue placeholder="Pilih jenis perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                          <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                          <SelectItem value="Perorangan">Perorangan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-npwp">NPWP</Label>
                      <Input
                        id="owner-npwp"
                        placeholder="Nomor Pokok Wajib Pajak"
                        value={registerForm.ownerNpwp}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerNpwp: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-address">Alamat</Label>
                      <Input
                        id="owner-address"
                        placeholder="Alamat lengkap"
                        value={registerForm.ownerAddress}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerAddress: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-city">Kota</Label>
                      <Input
                        id="owner-city"
                        placeholder="Nama kota"
                        value={registerForm.ownerCity}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerCity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-province">Provinsi</Label>
                      <Input
                        id="owner-province"
                        placeholder="Nama provinsi"
                        value={registerForm.ownerProvince}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerProvince: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-postal-code">Kode Pos</Label>
                      <Input
                        id="owner-postal-code"
                        placeholder="12345"
                        value={registerForm.ownerPostalCode}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerPostalCode: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-4">
            {registerStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button type="button" className="bg-primary hover:bg-primary/90" onClick={() => setRegisterStep(2)}>
                  Lanjutkan <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setRegisterStep(1)}>
                  Kembali
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={registerLoading}>
                  {registerLoading ? 'Memproses...' : 'Daftar'}
                </Button>
              </>
            )}
          </div>

          {/* Link to Login */}
          <p className="text-center text-sm text-slate-600 pt-2">
            Sudah punya akun?{' '}
            <button type="button" className="text-primary hover:underline font-medium" onClick={onOpenLogin}>
              Masuk di sini
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

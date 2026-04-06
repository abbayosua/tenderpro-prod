'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, UserPlus, ChevronRight, ChevronLeft, Check } from 'lucide-react';
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 text-center flex-shrink-0">
          <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-lg font-bold text-white">Daftar Akun Baru</DialogTitle>
          <DialogDescription className="text-white/70 mt-0.5">
            Bergabung dengan TenderPro sekarang
          </DialogDescription>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 ${registerStep >= 1 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                registerStep >= 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
              }`}>
                {registerStep > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Informasi Dasar</span>
            </div>
            <div className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${registerStep >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 ${registerStep >= 2 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                registerStep >= 2 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Informasi Perusahaan</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic Info */}
            {registerStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Daftar Sebagai</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={registerRole === 'OWNER' ? 'default' : 'outline'}
                      className={`h-11 transition-all duration-200 ${
                        registerRole === 'OWNER'
                          ? 'bg-primary shadow-md shadow-primary/20 hover:bg-primary/90'
                          : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                      onClick={() => setRegisterRole('OWNER')}
                    >
                      <User className="h-4 w-4 mr-2" /> Pemilik Proyek
                    </Button>
                    <Button
                      type="button"
                      variant={registerRole === 'CONTRACTOR' ? 'default' : 'outline'}
                      className={`h-11 transition-all duration-200 ${
                        registerRole === 'CONTRACTOR'
                          ? 'bg-primary shadow-md shadow-primary/20 hover:bg-primary/90'
                          : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                      onClick={() => setRegisterRole('CONTRACTOR')}
                    >
                      <Building2 className="h-4 w-4 mr-2" /> Kontraktor
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-name" className="text-sm font-semibold text-slate-700">Nama Lengkap *</Label>
                    <Input
                      id="register-name"
                      placeholder="Masukkan nama lengkap"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-slate-700">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                    />
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
                      className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                    />
                    {registerForm.password && registerForm.password.length < 6 && (
                      <p className="text-xs text-amber-600 mt-1">Password minimal 6 karakter</p>
                    )}
                    {registerForm.password && registerForm.password.length >= 6 && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Password kuat
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-confirm-password" className="text-sm font-semibold text-slate-700">Konfirmasi Password *</Label>
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
                  {registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password && (
                    <p className="text-xs text-red-600 mt-1">Password tidak cocok</p>
                  )}
                  {registerForm.confirmPassword && registerForm.confirmPassword === registerForm.password && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Password cocok
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Company Info */}
            {registerStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {registerRole === 'CONTRACTOR' ? (
                  <>
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-xl border border-primary/10 mb-2">
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
                        <div className="space-y-1.5">
                          <Label htmlFor="company-type">Jenis Perusahaan</Label>
                          <Select value={registerForm.companyType} onValueChange={(value) => setRegisterForm({ ...registerForm, companyType: value })}>
                            <SelectTrigger id="company-type" className="h-11 border-slate-200 focus:ring-primary/20 focus:border-primary/40">
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
                        <div className="space-y-1.5">
                          <Label htmlFor="province">Provinsi</Label>
                          <Input
                            id="province"
                            placeholder="Nama provinsi"
                            value={registerForm.province}
                            onChange={(e) => setRegisterForm({ ...registerForm, province: e.target.value })}
                            className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                          />
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
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 mb-2">
                      <p className="text-sm text-slate-600">
                        <strong>Opsional:</strong> Lengkapi informasi perusahaan untuk kredibilitas lebih tinggi.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="owner-company-name">Nama Perusahaan</Label>
                        <Input
                          id="owner-company-name"
                          placeholder="PT Contoh Perusahaan (opsional)"
                          value={registerForm.ownerCompanyName}
                          onChange={(e) => setRegisterForm({ ...registerForm, ownerCompanyName: e.target.value })}
                          className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="owner-company-type">Jenis Perusahaan</Label>
                        <Select value={registerForm.ownerCompanyType} onValueChange={(value) => setRegisterForm({ ...registerForm, ownerCompanyType: value })}>
                          <SelectTrigger id="owner-company-type" className="h-11 border-slate-200 focus:ring-primary/20 focus:border-primary/40">
                            <SelectValue placeholder="Pilih jenis perusahaan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                            <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                            <SelectItem value="Perorangan">Perorangan</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <div className="space-y-1.5">
                        <Label htmlFor="owner-province">Provinsi</Label>
                        <Input
                          id="owner-province"
                          placeholder="Nama provinsi"
                          value={registerForm.ownerProvince}
                          onChange={(e) => setRegisterForm({ ...registerForm, ownerProvince: e.target.value })}
                          className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                        />
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
                  <Button type="button" className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200" onClick={() => setRegisterStep(2)}>
                    Lanjutkan <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50" onClick={() => setRegisterStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
                  </Button>
                  <Button type="submit" className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg" disabled={registerLoading}>
                    {registerLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memproses...
                      </span>
                    ) : (
                      'Daftar Sekarang'
                    )}
                  </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

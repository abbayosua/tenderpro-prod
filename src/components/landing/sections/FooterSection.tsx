'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube, Send, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const footerLinks = {
  cepat: [
    { label: 'Kontraktor', href: '#contractors' },
    { label: 'Proyek', href: '#projects' },
    { label: 'Cara Kerja', href: '#how-it-works' },
    { label: 'Kontraktor Lokal', href: '#local-contractors' },
  ],
  kategori: [
    { label: 'Pembangunan Rumah', href: '#categories' },
    { label: 'Renovasi', href: '#categories' },
    { label: 'Komersial', href: '#categories' },
    { label: 'Interior', href: '#categories' },
  ],
  kontak: [
    { icon: Mail, text: 'info@tenderpro.id' },
    { icon: Phone, text: '021-12345678' },
    { icon: MapPin, text: 'Jakarta, Indonesia' },
  ],
  sosial: [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ],
};

export function FooterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Masukkan alamat email Anda');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Format email tidak valid');
      return;
    }

    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubscribing(false);
    setIsSubscribed(true);
    toast.success('Berhasil berlangganan! Cek email Anda.');
    setTimeout(() => {
      setEmail('');
      setIsSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="relative z-10 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Decorative top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Newsletter Section - Gradient Background Strip */}
      <div className="relative overflow-hidden">
        {/* Gradient background strip */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-teal-500/10 to-emerald-500/10" />
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            {/* Left side: heading + social proof */}
            <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Berlangganan Newsletter</h3>
                  <p className="text-sm text-slate-400">Dapatkan update proyek terbaru</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  {['bg-primary', 'bg-teal-500', 'bg-emerald-500'].map((bg, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full ${bg} border-2 border-slate-900 flex items-center justify-center`}>
                      <span className="text-[8px] font-bold text-white">
                        {['A', 'B', 'C'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <span>Bergabung dengan <strong className="text-primary font-semibold">10,000+</strong> profesional</span>
              </div>
            </div>

            {/* Right side: email input + button */}
            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Terima kasih telah berlangganan!</span>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto"
                >
                  <div className="relative w-full sm:w-80">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="Alamat email Anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubscribing}
                    className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 rounded-xl px-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Berlangganan
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="TenderPro" className="h-10 w-auto" />
              <span className="text-3xl font-bold tracking-tight">TenderPro</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
              Platform penghubung kontraktor dan pemilik proyek konstruksi terpercaya di Indonesia. Membangun Indonesia lebih baik.
            </p>
            {/* Social media icons */}
            <div className="flex items-center gap-3">
              {footerLinks.sosial.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 transition-all duration-200 hover:bg-primary/20 hover:border-primary/30 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Tautan Cepat</h4>
            <ul className="space-y-3">
              {footerLinks.cepat.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 text-sm transition-colors duration-200 hover:text-white hover:translate-x-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Kategori Proyek</h4>
            <ul className="space-y-3">
              {footerLinks.kategori.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 text-sm transition-colors duration-200 hover:text-white hover:translate-x-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Kontak</h4>
            <ul className="space-y-4">
              {footerLinks.kontak.map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-primary/70" />
                  </div>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} TenderPro. Semua hak dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors duration-200">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

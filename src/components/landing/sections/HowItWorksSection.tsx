'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ownerSteps = [
  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai pemilik proyek dan lengkapi profil' },
  { step: 2, title: 'Pasang Proyek', desc: 'Unggah detail proyek beserta persyaratan' },
  { step: 3, title: 'Pilih Penawaran', desc: 'Review dan pilih penawaran terbaik dari kontraktor' },
  { step: 4, title: 'Mulai Proyek', desc: 'Konfirmasi dan mulai pengerjaan proyek' },
];

const contractorSteps = [
  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai kontraktor dan lengkapi profil perusahaan' },
  { step: 2, title: 'Verifikasi', desc: 'Unggah dokumen legalitas untuk proses verifikasi' },
  { step: 3, title: 'Cari Proyek', desc: 'Temukan proyek yang sesuai dengan keahlian Anda' },
  { step: 4, title: 'Ajukan Penawaran', desc: 'Kirim proposal dan penawaran harga' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Cara Kerja</h2>
        </div>
        <Tabs defaultValue="owner" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="owner">Sebagai Pemilik Proyek</TabsTrigger>
            <TabsTrigger value="contractor">Sebagai Kontraktor</TabsTrigger>
          </TabsList>
          <TabsContent value="owner" className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              {ownerSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="contractor" className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              {contractorSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

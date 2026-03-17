'use client';

import { ChevronRight } from 'lucide-react';
import { faqItems } from '@/data';

export function FAQSection() {
  return (
    <section className="relative z-10 py-16 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Pertanyaan Umum</h2>
          <p className="text-slate-600">Jawaban untuk pertanyaan yang sering diajukan</p>
        </div>
        <div className="space-y-4">
          {faqItems.map((faq, index) => (
            <details key={index} className="group border rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                <span className="font-medium text-slate-800">{faq.q}</span>
                <ChevronRight className="h-5 w-5 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '@/data';
import { MessageCircleQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

export function FAQSection() {
  return (
    <section id="faq" className="relative z-10 py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="max-w-3xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block mb-3 text-xs font-semibold tracking-wider text-primary uppercase">FAQ</span>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 md:text-4xl">Pertanyaan Umum</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Jawaban untuk pertanyaan yang sering diajukan tentang TenderPro</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="bg-white rounded-lg px-6 mb-3 border border-slate-200 shadow-sm data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-medium text-slate-800 hover:no-underline py-4">
                  <span className="flex items-center gap-3">
                    <MessageCircleQuestion className="h-4 w-4 text-primary flex-shrink-0" />
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

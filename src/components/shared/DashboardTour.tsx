'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Sparkles, BarChart3, Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'bottom' | 'top';
}

interface DashboardTourProps {
  userRole: 'OWNER' | 'CONTRACTOR';
  onComplete?: () => void;
}

const TOUR_STORAGE_KEY = 'tenderpro_tour_complete';

function getSteps(userRole: 'OWNER' | 'CONTRACTOR'): TourStep[] {
  const baseSteps: TourStep[] = [
    {
      targetId: 'tour-welcome',
      title: 'Selamat Datang di TenderPro! 👋',
      description:
        userRole === 'OWNER'
          ? 'Platform terbaik untuk mengelola proyek konstruksi Anda. Temukan kontraktor terpercaya dan pantau progress secara real-time.'
          : 'Platform marketplace konstruksi terbaik di Indonesia. Temukan proyek yang sesuai dan tingkatkan peluang menang tender.',
      position: 'bottom',
    },
    {
      targetId: 'tour-stats',
      title: 'Statistik Dashboard 📊',
      description:
        userRole === 'OWNER'
          ? 'Pantau jumlah proyek aktif, tender terbuka, dan penawaran yang masuk secara real-time di sini.'
          : 'Lihat total penawaran, tingkat keberhasilan (win rate), dan statistik performa Anda di sini.',
      position: 'bottom',
    },
    {
      targetId: 'tour-main-content',
      title: 'Area Utama 🚀',
      description:
        userRole === 'OWNER'
          ? 'Kelola proyek, tinjau penawaran, pantau timeline, dan akses analitik mendalam dari panel ini.'
          : 'Cari proyek baru, kelola penawaran, pantau pendapatan, dan kelola portofolio Anda dari sini.',
      position: 'top',
    },
    {
      targetId: 'tour-notifications',
      title: 'Notifikasi 🔔',
      description:
        'Terima pemberitahuan real-time untuk penawaran baru, update proyek, dan milestone yang selesai. Jangan lewatkan info penting!',
      position: 'bottom',
    },
  ];

  return baseSteps;
}

export function DashboardTour({ userRole, onComplete }: DashboardTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = getSteps(userRole);

  const isTourComplete = useCallback(() => {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  const markTourComplete = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Check if tour should show
  useEffect(() => {
    if (!isTourComplete()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isTourComplete]);

  // Calculate target position
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      const target = document.getElementById(step.targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll into view if needed
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // If target not found, use a fallback position near center
        setTargetRect(new DOMRect(window.innerWidth / 2 - 150, 120, 300, 100));
      }
    };

    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    markTourComplete();
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    markTourComplete();
    setIsOpen(false);
  };

  if (!isOpen || !targetRect) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position
  const isBottom = step.position === 'bottom';
  const tooltipTop = isBottom
    ? targetRect.bottom + 12
    : Math.max(8, targetRect.top - 200);
  const tooltipLeft = Math.max(
    8,
    Math.min(targetRect.left + targetRect.width / 2 - 200, window.innerWidth - 416)
  );

  // Arrow position (centered relative to target)
  const arrowLeft = Math.max(
    24,
    Math.min(
      targetRect.left + targetRect.width / 2 - tooltipLeft,
      380
    )
  );

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at ' + (targetRect.left + targetRect.width / 2) + 'px ' + (targetRect.top + targetRect.height / 2) + 'px, transparent 80px, rgba(0,0,0,0.4) 120px)',
        }}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: isBottom ? 10 : -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isBottom ? 10 : -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed z-[101] pointer-events-auto"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="w-[400px] max-w-[calc(100vw-16px)] rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white shadow-2xl shadow-black/30 overflow-hidden">
          {/* Arrow */}
          <div
            className="absolute w-3 h-3 bg-slate-800 rotate-45 -translate-x-1/2"
            style={{
              top: isBottom ? -6 : 'auto',
              bottom: isBottom ? 'auto' : -6,
              left: arrowLeft,
            }}
          />

          {/* Content */}
          <div className="p-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-400">
                  Langkah {currentStep + 1} dari {steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-gradient-to-r from-primary to-teal-400'
                      : idx < currentStep
                        ? 'w-3 bg-slate-600'
                        : 'w-3 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Title & Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-base font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/50">
              <div>
                {!isFirstStep ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="text-slate-400 hover:text-white hover:bg-white/10 gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    Lewati
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-white gap-1 shadow-md shadow-primary/20"
              >
                {isLastStep ? (
                  <>Selesai ✓</>
                ) : (
                  <>
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

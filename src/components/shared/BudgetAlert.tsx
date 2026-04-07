'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, AlertTriangle, X, Settings, ChevronDown, TrendingUp, TrendingDown, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatRupiah } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';

// Types
export type AlertLevel = 'warning' | 'critical' | 'exceeded';

export interface BudgetAlertData {
  id: string;
  type: 'overall' | 'category' | 'project';
  name: string; // Name of category or project
  budget: number;
  spent: number;
  percentage: number;
  level: AlertLevel;
}

export interface BudgetAlertThresholds {
  warning: number;  // Default: 75
  critical: number; // Default: 90
  exceeded: number; // Default: 100
}

interface BudgetAlertProps {
  alerts: BudgetAlertData[];
  onDismiss?: (alertId: string) => void;
  showSettings?: boolean;
  thresholds?: BudgetAlertThresholds;
  onThresholdsChange?: (thresholds: BudgetAlertThresholds) => void;
}

const STORAGE_KEY_DISMISSED = 'tenderpro_dismissed_alerts';
const STORAGE_KEY_THRESHOLDS = 'tenderpro_alert_thresholds';

const DEFAULT_THRESHOLDS: BudgetAlertThresholds = {
  warning: 75,
  critical: 90,
  exceeded: 100,
};

// Helper to get alert level info with gradient backgrounds
function getAlertLevelInfo(level: AlertLevel) {
  switch (level) {
    case 'warning':
      return {
        icon: AlertTriangle,
        title: 'Pengeluaran Mendekati Anggaran',
        description: 'Pengeluaran telah mencapai',
        gradientBg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        borderColor: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-800',
        textColor: 'text-amber-700',
        progressGradient: 'from-amber-400 to-yellow-400',
        progressColor: 'bg-amber-500',
        pulseColor: 'bg-amber-400',
        suggestion: 'Pertimbangkan untuk meninjau kembali alokasi anggaran atau menegosiasikan ulang kontrak.',
      };
    case 'critical':
      return {
        icon: AlertTriangle,
        title: 'Pengeluaran Hampir Mencapai Batas Anggaran',
        description: 'Pengeluaran telah mencapai',
        gradientBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-800',
        textColor: 'text-orange-700',
        progressGradient: 'from-orange-400 to-amber-400',
        progressColor: 'bg-orange-500',
        pulseColor: 'bg-orange-400',
        suggestion: 'Segera evaluasi pengeluaran dan ajukan revisi anggaran jika diperlukan.',
      };
    case 'exceeded':
      return {
        icon: AlertCircle,
        title: 'Anggaran Terlampaui!',
        description: 'Pengeluaran telah melampaui anggaran',
        gradientBg: 'bg-gradient-to-r from-red-50 to-rose-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        progressGradient: 'from-red-500 to-rose-500',
        progressColor: 'bg-red-500',
        pulseColor: 'bg-red-500',
        suggestion: 'Anggaran telah terlampaui. Segera koordinasikan dengan tim untuk penanganan lebih lanjut.',
      };
  }
}

// Single Alert Card Component
interface AlertCardProps {
  alert: BudgetAlertData;
  onDismiss: (id: string) => void;
  index: number;
}

function AlertCard({ alert, onDismiss, index }: AlertCardProps) {
  const levelInfo = getAlertLevelInfo(alert.level);
  const Icon = levelInfo.icon;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className={`${levelInfo.gradientBg} ${levelInfo.borderColor} border shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Animated pulsing icon */}
            <div className={`relative mt-0.5`}>
              <div className={`absolute inset-0 rounded-full ${levelInfo.pulseColor} animate-ping opacity-20`} />
              <div className={`relative w-10 h-10 rounded-xl ${levelInfo.iconBg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${levelInfo.iconColor}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className={`font-semibold ${levelInfo.titleColor}`}>
                    {levelInfo.title}
                  </h4>
                  <p className={`text-sm ${levelInfo.textColor} mt-1`}>
                    {alert.type === 'overall' ? (
                      <>Total pengeluaran telah mencapai <span className="font-bold">{alert.percentage.toFixed(1)}%</span> dari anggaran</>
                    ) : (
                      <>
                        {alert.name}: <span className="font-bold">{alert.percentage.toFixed(1)}%</span> dari anggaran
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${levelInfo.textColor} hover:bg-white/50 rounded-lg`}
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Budget utilization progress bar with gradient fill */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={levelInfo.textColor}>Anggaran: {formatRupiah(alert.budget)}</span>
                  <span className={`font-semibold ${levelInfo.titleColor} flex items-center gap-1`}>
                    <TrendingUp className="h-3 w-3" />
                    {formatRupiah(alert.spent)}
                  </span>
                </div>
                <div className="relative h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${levelInfo.progressGradient} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  />
                  {/* Percentage indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                    style={{ left: `${Math.min(alert.percentage, 100)}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className={`w-1 h-1 rounded-full ${levelInfo.progressColor} ring-2 ring-white`} />
                  </div>
                </div>
                {alert.level === 'exceeded' && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingDown className={`h-3 w-3 ${levelInfo.textColor}`} />
                    <p className={`font-medium ${levelInfo.textColor}`}>
                      Kelebihan: {formatRupiah(alert.spent - alert.budget)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actionable suggestions - expandable */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Zap className="h-3 w-3" />
                Saran tindakan
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 bg-white/70 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-600 leading-relaxed">{levelInfo.suggestion}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${levelInfo.borderColor} ${levelInfo.textColor}`}>
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Settings Panel Component
interface AlertSettingsProps {
  thresholds: BudgetAlertThresholds;
  onThresholdsChange: (thresholds: BudgetAlertThresholds) => void;
  onClose: () => void;
}

function AlertSettings({ thresholds, onThresholdsChange, onClose }: AlertSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500" />
              Pengaturan Batas Peringatan
            </h4>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 mb-1.5 block font-medium">Peringatan (%)</label>
              <Select
                value={thresholds.warning.toString()}
                onValueChange={(value) => onThresholdsChange({ ...thresholds, warning: parseInt(value) })}
              >
                <SelectTrigger className="h-9 bg-amber-50 border-amber-200 hover:border-amber-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[50, 60, 70, 75, 80].map((val) => (
                    <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1.5 block font-medium">Kritis (%)</label>
              <Select
                value={thresholds.critical.toString()}
                onValueChange={(value) => onThresholdsChange({ ...thresholds, critical: parseInt(value) })}
              >
                <SelectTrigger className="h-9 bg-orange-50 border-orange-200 hover:border-orange-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[85, 90, 95].map((val) => (
                    <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1.5 block font-medium">Terlampaui (%)</label>
              <Select
                value={thresholds.exceeded.toString()}
                onValueChange={(value) => onThresholdsChange({ ...thresholds, exceeded: parseInt(value) })}
              >
                <SelectTrigger className="h-9 bg-red-50 border-red-200 hover:border-red-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[100].map((val) => (
                    <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main BudgetAlert Component
export function BudgetAlert({
  alerts,
  onDismiss,
  showSettings = true,
  thresholds: externalThresholds,
  onThresholdsChange: externalOnThresholdsChange,
}: BudgetAlertProps) {
  // Initialize state lazily from localStorage
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DISMISSED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [internalThresholds, setInternalThresholds] = useState<BudgetAlertThresholds>(() => {
    if (typeof window === 'undefined' || externalThresholds) return DEFAULT_THRESHOLDS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
      return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });

  // Use external thresholds if provided, otherwise use internal
  const thresholds = externalThresholds || internalThresholds;

  // Handle threshold changes
  const handleThresholdsChange = (newThresholds: BudgetAlertThresholds) => {
    if (externalOnThresholdsChange) {
      externalOnThresholdsChange(newThresholds);
    } else {
      setInternalThresholds(newThresholds);
      try {
        localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(newThresholds));
      } catch (e) {
        console.error('Failed to save thresholds to localStorage:', e);
      }
    }
  };

  // Handle dismiss
  const handleDismiss = (alertId: string) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(newDismissed));
    } catch (e) {
      console.error('Failed to save dismissed alerts to localStorage:', e);
    }
    onDismiss?.(alertId);
  };

  // Filter out dismissed alerts and sort by severity
  const visibleAlerts = useMemo(() => {
    return alerts
      .filter(alert => !dismissedAlerts.includes(alert.id))
      .sort((a, b) => {
        // Sort by level severity: exceeded > critical > warning
        const levelOrder: Record<AlertLevel, number> = { exceeded: 0, critical: 1, warning: 2 };
        return levelOrder[a.level] - levelOrder[b.level];
      });
  }, [alerts, dismissedAlerts]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  // Group alerts by level for summary
  const alertCounts = {
    exceeded: visibleAlerts.filter(a => a.level === 'exceeded').length,
    critical: visibleAlerts.filter(a => a.level === 'critical').length,
    warning: visibleAlerts.filter(a => a.level === 'warning').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header with settings button and collapse toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            <div className="relative w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 text-sm">
              Peringatan Anggaran
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {visibleAlerts.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">{visibleAlerts.length} peringatan aktif</p>
          </div>
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </button>
        {showSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 px-2.5"
          >
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Pengaturan</span>
          </Button>
        )}
      </div>

      {/* Settings Panel with smooth animation */}
      <AnimatePresence>
        {showSettingsPanel && (
          <AlertSettings
            thresholds={thresholds}
            onThresholdsChange={handleThresholdsChange}
            onClose={() => setShowSettingsPanel(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Alert Summary Badges */}
              {(alertCounts.exceeded > 0 || alertCounts.critical > 0 || alertCounts.warning > 0) && (
                <div className="flex flex-wrap gap-2">
                  {alertCounts.exceeded > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 shadow-sm border border-red-200">
                        <AlertCircle className="h-3 w-3" />
                        {alertCounts.exceeded} Terlampaui
                      </span>
                    </motion.div>
                  )}
                  {alertCounts.critical > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 shadow-sm border border-orange-200">
                        <AlertTriangle className="h-3 w-3" />
                        {alertCounts.critical} Kritis
                      </span>
                    </motion.div>
                  )}
                  {alertCounts.warning > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 shadow-sm border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        {alertCounts.warning} Peringatan
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Individual Alert Cards */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <AnimatePresence>
                  {visibleAlerts.map((alert, index) => (
                    <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Utility function to calculate alerts from spending data
export function calculateBudgetAlerts(
  data: Array<{ name: string; budget: number; spent: number }>,
  thresholds: BudgetAlertThresholds = DEFAULT_THRESHOLDS,
  type: 'category' | 'project' = 'category'
): BudgetAlertData[] {
  const alerts: BudgetAlertData[] = [];

  // Calculate overall totals first
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);

  // Check overall budget
  if (totalBudget > 0) {
    const overallPercentage = (totalSpent / totalBudget) * 100;
    const overallLevel = getAlertLevel(overallPercentage, thresholds);

    if (overallLevel) {
      alerts.push({
        id: `overall-${type}`,
        type: 'overall',
        name: 'Total Keseluruhan',
        budget: totalBudget,
        spent: totalSpent,
        percentage: overallPercentage,
        level: overallLevel,
      });
    }
  }

  // Check individual items
  data.forEach((item, index) => {
    if (item.budget > 0) {
      const percentage = (item.spent / item.budget) * 100;
      const level = getAlertLevel(percentage, thresholds);

      if (level) {
        alerts.push({
          id: `${type}-${index}-${item.name}`,
          type,
          name: item.name,
          budget: item.budget,
          spent: item.spent,
          percentage,
          level,
        });
      }
    }
  });

  return alerts;
}

// Helper to determine alert level
function getAlertLevel(percentage: number, thresholds: BudgetAlertThresholds): AlertLevel | null {
  if (percentage >= thresholds.exceeded) {
    return 'exceeded';
  }
  if (percentage >= thresholds.critical) {
    return 'critical';
  }
  if (percentage >= thresholds.warning) {
    return 'warning';
  }
  return null;
}

export default BudgetAlert;

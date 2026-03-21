'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, AlertTriangle, X, Settings } from 'lucide-react';
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

// Helper to get alert level info
function getAlertLevelInfo(level: AlertLevel) {
  switch (level) {
    case 'warning':
      return {
        icon: AlertTriangle,
        title: 'Pengeluaran Mendekati Anggaran',
        description: 'Pengeluaran telah mencapai',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-800',
        textColor: 'text-amber-700',
        progressColor: 'bg-amber-500',
      };
    case 'critical':
      return {
        icon: AlertTriangle,
        title: 'Pengeluaran Hampir Mencapai Batas Anggaran',
        description: 'Pengeluaran telah mencapai',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-800',
        textColor: 'text-orange-700',
        progressColor: 'bg-orange-500',
      };
    case 'exceeded':
      return {
        icon: AlertCircle,
        title: 'Anggaran Terlampaui!',
        description: 'Pengeluaran telah melampaui anggaran',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        progressColor: 'bg-red-500',
      };
  }
}

// Single Alert Card Component
interface AlertCardProps {
  alert: BudgetAlertData;
  onDismiss: (id: string) => void;
}

function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const levelInfo = getAlertLevelInfo(alert.level);
  const Icon = levelInfo.icon;

  return (
    <Card className={`${levelInfo.bgColor} ${levelInfo.borderColor} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${levelInfo.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-medium ${levelInfo.titleColor}`}>
                  {levelInfo.title}
                </h4>
                <p className={`text-sm ${levelInfo.textColor} mt-1`}>
                  {alert.type === 'overall' ? (
                    <>Total pengeluaran telah mencapai <span className="font-semibold">{alert.percentage.toFixed(1)}%</span> dari anggaran</>
                  ) : (
                    <>
                      {alert.name}: <span className="font-semibold">{alert.percentage.toFixed(1)}%</span> dari anggaran
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${levelInfo.textColor} hover:${levelInfo.bgColor}`}
                onClick={() => onDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className={levelInfo.textColor}>Anggaran: {formatRupiah(alert.budget)}</span>
                <span className={`font-medium ${levelInfo.titleColor}`}>
                  Terpakai: {formatRupiah(alert.spent)}
                </span>
              </div>
              <Progress 
                value={Math.min(alert.percentage, 100)} 
                className="h-2"
              />
              {alert.level === 'exceeded' && (
                <p className={`text-xs font-medium ${levelInfo.textColor}`}>
                  Kelebihan: {formatRupiah(alert.spent - alert.budget)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-800">Pengaturan Batas Peringatan</h4>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Peringatan (%)</label>
            <Select
              value={thresholds.warning.toString()}
              onValueChange={(value) => onThresholdsChange({ ...thresholds, warning: parseInt(value) })}
            >
              <SelectTrigger className="h-8 bg-amber-50 border-amber-200">
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
            <label className="text-xs text-slate-600 mb-1 block">Kritis (%)</label>
            <Select
              value={thresholds.critical.toString()}
              onValueChange={(value) => onThresholdsChange({ ...thresholds, critical: parseInt(value) })}
            >
              <SelectTrigger className="h-8 bg-orange-50 border-orange-200">
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
            <label className="text-xs text-slate-600 mb-1 block">Terlampaui (%)</label>
            <Select
              value={thresholds.exceeded.toString()}
              onValueChange={(value) => onThresholdsChange({ ...thresholds, exceeded: parseInt(value) })}
            >
              <SelectTrigger className="h-8 bg-red-50 border-red-200">
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
    <div className="space-y-3">
      {/* Header with settings button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-slate-900">
            Peringatan Anggaran ({visibleAlerts.length})
          </h3>
        </div>
        {showSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="text-slate-600"
          >
            <Settings className="h-4 w-4 mr-1" />
            Pengaturan
          </Button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <AlertSettings
          thresholds={thresholds}
          onThresholdsChange={handleThresholdsChange}
          onClose={() => setShowSettingsPanel(false)}
        />
      )}

      {/* Alert Summary Badges */}
      {(alertCounts.exceeded > 0 || alertCounts.critical > 0 || alertCounts.warning > 0) && (
        <div className="flex flex-wrap gap-2">
          {alertCounts.exceeded > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3" />
              {alertCounts.exceeded} Terlampaui
            </span>
          )}
          {alertCounts.critical > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <AlertTriangle className="h-3 w-3" />
              {alertCounts.critical} Kritis
            </span>
          )}
          {alertCounts.warning > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <AlertTriangle className="h-3 w-3" />
              {alertCounts.warning} Peringatan
            </span>
          )}
        </div>
      )}

      {/* Individual Alert Cards */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {visibleAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
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

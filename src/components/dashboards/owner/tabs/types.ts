import { OwnerStats, Bid, Milestone, Favorite } from '@/types';
import type { PaymentSummary, SpendingCategoryData } from '@/hooks/useDashboard';
import type { BudgetAlertData, BudgetAlertThresholds } from '@/components/shared/BudgetAlert';

export interface OwnerProject {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  status: string;
  bidCount: number;
  viewCount: number;
  bids: Bid[];
}

export interface OwnerDocument {
  id: string;
  name: string;
  type: string;
  projectId: string;
  project: string;
  fileSize: number;
  fileUrl: string;
  isApproved: boolean;
  createdAt: Date;
  viewCount?: number;
  downloadCount?: number;
}

// Milestone breakdown types
export interface MilestoneBreakdownItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  paymentCount: number;
  percentage: number;
}

export interface ProjectMilestoneBreakdown {
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  projectStatus: string;
  milestones: MilestoneBreakdownItem[];
  totalMilestoneBudget: number;
  totalMilestonePaid: number;
  totalMilestonePending: number;
}

// Shared props for tabs that need ownerStats and actions
export interface OwnerTabsSharedProps {
  ownerStats: OwnerStats | null;
  onShowCreateProject: () => void;
  onShowCCTV: (project: { id: string; title: string; status: string }) => void;
  onShowProgress: (project: { id: string; title: string; category: string; budget: number }) => void;
  onAcceptBid: (bidId: string) => void;
  onRejectBid: (bidId: string) => void;
  loadMilestones: (projectId: string) => void;
}

export interface OwnerProjectsTabProps extends OwnerTabsSharedProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  milestones: Milestone[];
}

export interface OwnerBidsTabProps extends OwnerTabsSharedProps {
  selectedBidsForCompare: string[];
  toggleBidSelection: (bidId: string) => void;
  onShowCompare: () => void;
  onAddFavorite: (contractorId: string, notes?: string) => void;
  filterBidProject: string;
  setFilterBidProject: (projectId: string) => void;
  sortBidsBy: 'newest' | 'lowest' | 'rating';
  setSortBidsBy: (sort: 'newest' | 'lowest' | 'rating') => void;
}

export interface OwnerFavoritesTabProps {
  favorites: Favorite[];
  onRemoveFavorite: (favoriteId: string) => void;
}

export type OwnerTimelineTabProps = OwnerTabsSharedProps & {
  milestones?: Milestone[];
};

export interface OwnerDocumentsTabProps {
  ownerStats: OwnerStats | null;
  allProjectDocuments: OwnerDocument[];
  filterDocType: string;
  setFilterDocType: (type: string) => void;
  filterDocProject: string;
  setFilterDocProject: (projectId: string) => void;
  webcamModalOpen: boolean;
  setWebcamModalOpen: (open: boolean) => void;
  onDocumentUpload: (data: { name: string; type: string; fileUrl: string; fileSize: number }) => Promise<boolean>;
}

export interface OwnerPaymentsTabProps {
  ownerStats: OwnerStats | null;
  paymentSummary: PaymentSummary | null;
  spendingCategoryData?: SpendingCategoryData[];
  budgetAlerts?: BudgetAlertData[];
  alertThresholds?: BudgetAlertThresholds;
  onAlertThresholdsChange?: (thresholds: BudgetAlertThresholds) => void;
  milestoneBreakdown?: ProjectMilestoneBreakdown[];
}

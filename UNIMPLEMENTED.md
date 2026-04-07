# TenderPro Unimplemented/Mockup Features

> Analysis Date: January 2025
> Purpose: Document all mockup, placeholder, and non-functional features in the dashboards

---

## Legend

| Status | Meaning |
|--------|---------|
| 🔴 Mock | Uses hardcoded fake data, not connected to database |
| 🟡 Placeholder | UI exists but shows toast/info message instead of working |
| 🟠 Non-functional | UI exists but doesn't do anything |
| 🟢 Partial | Works partially, needs completion |

---

## 🔶 OWNER DASHBOARD

### 1. Charts Section

**Location**: Lines 34-49, 192-239 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Proyek per Kategori (Pie Chart)** | 🔴 Mock | Shows project distribution by category | Hardcoded values: `Pembangunan Baru 35%`, `Renovasi 25%`, `Komersial 20%`, `Interior 15%`, `Lainnya 5%` |
| **Progress Bulanan (Bar Chart)** | 🔴 Mock | Shows monthly project creation vs completion | Hardcoded monthly data: `Jan: 2 proyek, 1 selesai`, `Feb: 3 proyek, 2 selesai`, etc. |

**What Needs to Be Done**:
- Create API endpoint to aggregate projects by category
- Create API endpoint to get monthly project statistics
- Calculate completion rates from actual data
- Update charts dynamically based on date range selection

---

### 2. Stats Cards

**Location**: Lines 157-163 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Total Proyek Trend** | 🔴 Mock | Shows `+12%` trend | Hardcoded percentage |
| **Proyek Aktif Trend** | 🔴 Mock | Shows `+5%` trend | Hardcoded percentage |
| **Tender Terbuka Trend** | 🔴 Mock | Shows `-2%` trend | Hardcoded percentage |
| **Penawaran Pending Trend** | 🔴 Mock | Shows `+8%` trend | Hardcoded percentage |

**What Needs to Be Done**:
- Calculate trends from historical data (compare with previous month/period)
- Add date range selector for trend calculation
- Store historical snapshots or calculate on-the-fly from timestamps

---

### 3. Project Progress Section

**Location**: Lines 325-358, 623-635 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Progress Percentage** | 🔴 Mock | Shows project completion percentage | Always displays `65%` regardless of actual progress |
| **Estimated Duration** | 🔴 Mock | Shows estimated completion days | Always shows `Est. 90 hari` |
| **View Count** | 🔴 Mock | Shows project view statistics | Shows static text `views` with no actual number |

**What Needs to Be Done**:
- Calculate progress from completed milestones: `completedMilestones / totalMilestones * 100`
- Use project duration field or calculate from milestones
- Implement view tracking in project detail API
- Store view count in database and increment on view

---

### 4. Documents Tab

**Location**: Lines 645-735 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Document List** | 🔴 Mock | Shows project documents | Uses `mockDocumentsData` from `helpers.ts` with fake entries |
| **Filter by Type** | 🟠 Non-functional | Filter documents by type (Kontrak, Gambar, Invoice, etc.) | Dropdown exists but doesn't filter |
| **Filter by Project** | 🟠 Non-functional | Filter documents by project | Dropdown exists but doesn't filter |
| **Upload Document** | 🟡 Placeholder | Upload new project document | Shows toast: `"Fitur upload dokumen dalam pengembangan"` |
| **View Document** | 🟡 Placeholder | Open document for viewing | Shows toast: `"Membuka dokumen..."` |
| **Download Document** | 🟡 Placeholder | Download document file | Shows toast: `"Mengunduh dokumen..."` |

**What Needs to Be Done**:
- Create `project_documents` table (already in Prisma schema)
- Implement file upload to storage (Supabase Storage recommended)
- Implement document filtering API
- Create document viewer component
- Add actual download functionality

---

### 5. Payments Tab

**Location**: Lines 737-834 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Total Anggaran** | 🔴 Mock | Sum of all project budgets | Hardcoded `Rp 1.250.000.000` |
| **Sudah Dibayar** | 🔴 Mock | Total amount paid | Hardcoded `Rp 750.000.000` |
| **Sisa Pembayaran** | 🔴 Mock | Remaining balance | Hardcoded `Rp 500.000.000` |
| **Payment History** | 🔴 Mock | List of payment transactions | Uses `paymentHistoryData` from `helpers.ts` |
| **Process Payment** | 🟡 Placeholder | Make a payment | Shows toast message only |

**What Needs to Be Done**:
- Create payments table and API (partially exists)
- Integrate with payment gateway (Midtrans, Xendit recommended)
- Calculate totals from database
- Implement payment verification workflow
- Add payment history with real transaction data

---

### 6. Timeline Tab

**Location**: Lines 581-643 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Progress Bar** | 🔴 Mock | Shows project progress | Same hardcoded `65%` as Projects tab |
| **Estimated Days** | 🔴 Mock | Project duration | Same hardcoded `Est. 90 hari` |

**What Needs to Be Done**:
- Calculate progress from milestones
- Show actual timeline with milestone dates
- Add Gantt chart or timeline visualization

---

### 7. Header Actions

**Location**: Lines 140-142 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Chat/Message Button** | 🟠 Non-functional | Open messaging interface | Button exists but does nothing |

**What Needs to Be Done**:
- Implement real-time messaging system (WebSocket/Socket.io)
- Create conversation list and chat UI
- Store messages in database
- Add notifications for new messages

---

### 8. Bids Tab

**Location**: Lines 421-529 in `OwnerDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Filter by Project** | 🟢 Partial | Filter bids by selected project | Dropdown exists, filtering incomplete |
| **Sort by Newest** | 🟠 Non-functional | Sort bids by creation date | Dropdown option doesn't sort |
| **Sort by Lowest Price** | 🟠 Non-functional | Sort bids by price ascending | Dropdown option doesn't sort |
| **Sort by Highest Rating** | 🟠 Non-functional | Sort bids by contractor rating | Dropdown option doesn't sort |

**What Needs to Be Done**:
- Implement client-side or server-side sorting
- Add state management for sort selection
- Apply sort to bid list rendering

---

## 🔷 CONTRACTOR DASHBOARD

### 1. Portfolio Tab

**Location**: Lines 229-274 in `ContractorDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Portfolio Items** | 🔴 Mock | List of past projects | 3 hardcoded items with `loremflickr.com` images |
| **Add Portfolio** | 🟡 Placeholder | Add new portfolio item | Shows toast: `"Fitur upload portofolio dalam pengembangan"` |
| **View Portfolio** | 🟡 Placeholder | View portfolio details | Shows toast: `"Detail portofolio"` |
| **Edit Portfolio** | 🟡 Placeholder | Edit existing portfolio | Shows toast: `"Edit portofolio"` |

**What Needs to Be Done**:
- Use `Portfolio` table from Prisma schema
- Create portfolio CRUD API endpoints
- Implement image upload for portfolio photos
- Create portfolio detail modal

---

### 2. Bids Tab Actions

**Location**: Lines 151-227 in `ContractorDashboard.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Chat Owner** | 🟡 Placeholder | Message project owner | Shows toast: `"Fitur chat dalam pengembangan"` |
| **Cancel Bid** | 🟡 Placeholder | Withdraw a submitted bid | Shows toast: `"Penawaran dibatalkan"` but doesn't update database |
| **View Project Detail** | 🟡 Placeholder | See full project details | Shows toast: `"Detail proyek dibuka!"` |

**What Needs to Be Done**:
- Implement chat system (same as owner dashboard)
- Add bid withdrawal API endpoint
- Create project detail view for contractors

---

## 🔶 MODALS

### CCTV Modal

**Location**: `src/components/modals/CCTVModal.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Video Feed** | 🔴 Mock | Live CCTV stream | Shows GIF from `https://giffiles.alphacoders.com/158/158676.gif` |
| **Camera Selection** | 🟡 Mock | Switch between cameras | 4 buttons but all show same GIF |
| **Camera Location** | 🔴 Mock | Shows camera location | Hardcoded: `"Area Konstruksi {cameraNumber}"` |
| **Camera Status** | 🔴 Mock | Shows online status | Hardcoded: `"Online"` |
| **Video Quality** | 🔴 Mock | Shows stream quality | Hardcoded: `"HD 1080p"` |
| **Recording Start Time** | 🔴 Mock | Shows when recording started | Hardcoded: `"06:00 WIB"` |
| **Screenshot** | 🟡 Placeholder | Capture current frame | Shows toast: `"Screenshot disimpan!"` |
| **Record** | 🟡 Placeholder | Start recording | Shows toast: `"Rekaman dimulai!"` |
| **Zoom** | 🟡 Placeholder | Zoom camera view | Shows toast: `"Fitur zoom dalam pengembangan"` |

**What Needs to Be Done**:
- Integrate with actual CCTV provider API (CCTV.id, local DVR systems)
- Or remove this feature if not applicable to use case
- Implement real video streaming with HLS/WebRTC
- Add camera switching functionality

---

### Export Modal

**Location**: `src/components/modals/ExportModal.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **Report Type Selection** | 🟠 Non-functional | Select what to export | Dropdown options don't affect output |
| **PDF Export** | 🟡 Placeholder | Generate PDF report | Shows toast: `"Laporan berhasil diekspor sebagai PDF"` |
| **Excel Export** | 🟡 Placeholder | Generate Excel report | Shows toast: `"Laporan berhasil diekspor sebagai EXCEL"` |

**What Needs to Be Done**:
- Implement PDF generation (use jsPDF, react-pdf, or server-side)
- Implement Excel generation (use xlsx library)
- Create report templates
- Add data filtering options

---

### Compare Bids Modal

**Location**: `src/components/modals/CompareBidsModal.tsx`

| Feature | Status | Description | Current Implementation |
|---------|--------|-------------|------------------------|
| **"Harga Terbaik" Badge** | 🟡 Static | Highlight lowest price | Always shows on first bid in list, not calculated |
| **"Rating Tertinggi" Badge** | 🟡 Static | Highlight best rating | Always shows on second bid, not calculated |

**What Needs to Be Done**:
- Calculate actual lowest price among compared bids
- Calculate actual highest rating among compared bids
- Add more recommendation badges (fastest duration, best match)

---

## 📊 Summary

### By Dashboard

| Dashboard | 🔴 Mock | 🟡 Placeholder | 🟠 Non-functional | 🟢 Partial | Total |
|-----------|---------|----------------|-------------------|------------|-------|
| Owner Dashboard | 12 | 5 | 3 | 2 | 22 |
| Contractor Dashboard | 1 | 4 | 0 | 0 | 5 |
| Modals | 6 | 5 | 1 | 2 | 14 |
| **Total** | **19** | **14** | **4** | **4** | **41** |

### By Priority

| Priority | Features | Effort |
|----------|----------|--------|
| **Critical** | Charts, Progress, Payments, Documents | High |
| **High** | Portfolio, Chat System, Export | Medium |
| **Medium** | Filtering, Sorting, View Tracking | Low |
| **Low** | CCTV (or remove), Trends, Badges | Variable |

---

## 🎯 Implementation Roadmap

### Phase 1: Core Data (Critical)
1. ✅ Charts calculated from database
2. ✅ Progress calculated from milestones
3. ✅ Payment tracking system
4. ✅ Document management system

### Phase 2: User Features (High)
1. Portfolio management for contractors
2. Real-time chat/messaging
3. Export functionality (PDF/Excel)
4. Project detail views

### Phase 3: UX Polish (Medium)
1. All filter dropdowns functional
2. All sort options functional
3. View count tracking
4. Bid withdrawal

### Phase 4: Optional (Low)
1. CCTV integration or removal
2. Trend calculations
3. Smart recommendation badges
4. Advanced features

---

## 📝 Notes

- Some features may require additional database tables or fields
- Payment integration requires third-party service (Midtrans, Xendit)
- Chat requires WebSocket implementation
- File uploads require storage solution (Supabase Storage recommended)
- CCTV may not be applicable for all use cases - consider removing

---

*Generated from codebase analysis - TenderPro Project*

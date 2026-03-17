# Refactoring Tasks - 17 March 2025

## Status Legend
- [ ] Pending
- [x] Completed

---

## Todo List

- [x] ~~Mock data in helpers.ts → Move to src/data/~~ (Done)
- [x] ~~LandingPage.tsx → Extract sections~~ (Done)
- [x] ~~OwnerDashboard.tsx (~961 lines) → Extract tabs into separate components~~ (Done - now 400 lines)
- [ ] useDashboard.ts (~613 lines) → Split into domain hooks
- [ ] page.tsx (30 useState) → Reduce state management complexity
- [ ] RegisterModal.tsx → Extract step components

---

## Notes

### Completed
1. **Mock data** - Moved to `src/data/` (landing.ts, documents.ts, payments.ts)
2. **LandingPage** - Extracted 10 section components:
   - HeroSection, TrustSection, HowItWorksSection
   - TestimonialsSection, SuccessProjectsSection
   - ProjectCategoriesSection, PartnersSection
   - FAQSection, CTASection, FooterSection
3. **OwnerDashboard** - Extracted 6 tab components:
   - OwnerProjectsTab, OwnerBidsTab, OwnerFavoritesTab
   - OwnerTimelineTab, OwnerDocumentsTab, OwnerPaymentsTab
   - Main file reduced from ~961 lines to 400 lines

### Next: useDashboard.ts
Split into domain-specific hooks:
- useOwnerDashboard.ts
- useContractorDashboard.ts
- useNotifications.ts
- useFavorites.ts

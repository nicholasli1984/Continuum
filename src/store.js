import { create } from "zustand";

// Core shared state — used by multiple pages
// Page-specific state stays local in each page component
export const useAppStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user }),
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),

  // ── Theme ──
  darkMode: false,
  isMobile: typeof window !== "undefined" && window.innerWidth < 768,
  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  setIsMobile: (v) => set({ isMobile: v }),

  // ── Navigation ──
  activeView: "dashboard",
  setActiveView: (v) => set({ activeView: v }),
  dashSubTab: "overview",
  setDashSubTab: (v) => set({ dashSubTab: v }),

  // ── Core data ──
  trips: [],
  sharedTrips: [],
  expenses: [],
  linkedAccounts: {},
  savedItineraries: [],
  setTrips: (v) => set({ trips: typeof v === "function" ? v(get().trips) : v }),
  setSharedTrips: (v) => set({ sharedTrips: typeof v === "function" ? v(get().sharedTrips) : v }),
  setExpenses: (v) => set({ expenses: typeof v === "function" ? v(get().expenses) : v }),
  setLinkedAccounts: (v) => set({ linkedAccounts: typeof v === "function" ? v(get().linkedAccounts) : v }),
  setSavedItineraries: (v) => set({ savedItineraries: typeof v === "function" ? v(get().savedItineraries) : v }),

  // ── Trip detail ──
  tripDetailId: null,
  tripDetailSegIdx: 0,
  setTripDetailId: (v) => set({ tripDetailId: v }),
  setTripDetailSegIdx: (v) => set({ tripDetailSegIdx: v }),

  // ── Modals ──
  confirmModal: null,
  setConfirmModal: (v) => set({ confirmModal: v }),
  showConfirm: (message, onConfirm) => set({ confirmModal: { message, onConfirm } }),

  // ── Card benefits (synced) ──
  cardBenefitValues: {},
  cardCustomBenefits: {},
  expandedCardId: null,
  setCardBenefitValues: (v) => set({ cardBenefitValues: typeof v === "function" ? v(get().cardBenefitValues) : v }),
  setCardCustomBenefits: (v) => set({ cardCustomBenefits: typeof v === "function" ? v(get().cardCustomBenefits) : v }),
  setExpandedCardId: (v) => set({ expandedCardId: v }),

  // ── Flight status ──
  flightStatusCache: {},
  setFlightStatusCache: (v) => set({ flightStatusCache: typeof v === "function" ? v(get().flightStatusCache) : v }),

  // ── Visa ──
  visaCache: {},
  visaLoading: {},
  setVisaCache: (v) => set({ visaCache: typeof v === "function" ? v(get().visaCache) : v }),
  setVisaLoading: (v) => set({ visaLoading: typeof v === "function" ? v(get().visaLoading) : v }),

  // ── Packing ──
  packingLists: {},
  packExpanded: null,
  customPackItems: {},
  setPackingLists: (v) => set({ packingLists: v }),
  setPackExpanded: (v) => set({ packExpanded: v }),
  setCustomPackItems: (v) => set({ customPackItems: typeof v === "function" ? v(get().customPackItems) : v }),
}));

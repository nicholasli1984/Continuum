// Sample data shown when "Show sample data" is toggled on in Settings.
// Lets a brand-new user explore a populated app before entering anything real.
// Every record carries _demo: true so it can be filtered out of saves and
// rendered with a subtle "Sample" tag.

const DEMO = (id) => `demo_${id}`;

export const DEMO_TRIPS = [
  {
    id: DEMO("trip_tokyo"),
    _demo: true,
    tripName: "June 2026 Tokyo Business Trip",
    trip_name: "June 2026 Tokyo Business Trip",
    location: "Tokyo, Taipei",
    date: "2026-06-01",
    status: "confirmed",
    type: "flight",
    program: "aa",
    route: "BDA → LHR → HND → TSA",
    estimatedPoints: 28000,
    confirmationCode: "DEMO12345",
    confirmation_code: "DEMO12345",
    _endDate: "2026-06-10",
    segments: [
      { _isMeta: true, _endDate: "2026-06-10" },
      { type: "flight", flightNumber: "BA2233", airline: "British Airways", departureAirport: "BDA", arrivalAirport: "LHR", date: "2026-06-01", departureTime: "9:15pm", arrivalTime: "8:45am", arrivalDate: "2026-06-02", fareClass: "business", confirmationCode: "DEMO12345", route: "BDA → LHR" },
      { type: "flight", flightNumber: "JL44", airline: "Japan Airlines", departureAirport: "LHR", arrivalAirport: "HND", date: "2026-06-02", departureTime: "12:30pm", arrivalTime: "9:55am", arrivalDate: "2026-06-03", fareClass: "business", confirmationCode: "DEMO12345", route: "LHR → HND" },
      { type: "hotel", property: "Park Hyatt Tokyo", location: "3-7-1-2 Nishi Shinjuku, Tokyo", date: "2026-06-03", checkoutDate: "2026-06-08", nights: 5, roomType: "Park King", confirmationCode: "PHT-DEMO" },
      { type: "flight", flightNumber: "JL97", airline: "Japan Airlines", departureAirport: "HND", arrivalAirport: "TSA", date: "2026-06-08", departureTime: "8:30am", arrivalTime: "11:30am", fareClass: "business", confirmationCode: "DEMO12345", route: "HND → TSA" },
      { type: "hotel", property: "Mandarin Oriental Taipei", location: "158 Dunhua N Rd, Taipei", date: "2026-06-08", checkoutDate: "2026-06-10", nights: 2, roomType: "Deluxe", confirmationCode: "MOT-DEMO" },
      { type: "flight", flightNumber: "BA64", airline: "British Airways", departureAirport: "TSA", arrivalAirport: "LHR", date: "2026-06-10", departureTime: "11:50pm", arrivalTime: "5:40am", arrivalDate: "2026-06-11", fareClass: "business", confirmationCode: "DEMO12345", route: "TSA → LHR" },
    ],
  },
  {
    id: DEMO("trip_bermuda"),
    _demo: true,
    tripName: "September 2026 Family Bermuda",
    trip_name: "September 2026 Family Bermuda",
    location: "Hamilton, Bermuda",
    date: "2026-09-12",
    status: "confirmed",
    type: "hotel",
    program: "marriott",
    route: "Hamilton",
    estimatedPoints: 18000,
    confirmationCode: "DEMOBDA77",
    confirmation_code: "DEMOBDA77",
    _endDate: "2026-09-18",
    segments: [
      { _isMeta: true, _endDate: "2026-09-18" },
      { type: "flight", flightNumber: "AA1429", airline: "American Airlines", departureAirport: "JFK", arrivalAirport: "BDA", date: "2026-09-12", departureTime: "10:00am", arrivalTime: "1:50pm", fareClass: "first", confirmationCode: "DEMOBDA77", route: "JFK → BDA" },
      { type: "hotel", property: "Hamilton Princess & Beach Club", location: "76 Pitts Bay Rd, Hamilton, Bermuda", date: "2026-09-12", checkoutDate: "2026-09-18", nights: 6, roomType: "Harbour View Suite", confirmationCode: "HPB-DEMO" },
      { type: "flight", flightNumber: "AA1428", airline: "American Airlines", departureAirport: "BDA", arrivalAirport: "JFK", date: "2026-09-18", departureTime: "2:45pm", arrivalTime: "4:30pm", fareClass: "first", confirmationCode: "DEMOBDA77", route: "BDA → JFK" },
    ],
  },
];

export const DEMO_EXPENSES = [
  { id: DEMO("exp_1"), _demo: true, tripId: DEMO("trip_tokyo"), category: "flight", description: "Business class fare BDA→HND", amount: 4850, currency: "USD", fxRate: 1, date: "2026-04-12", paymentMethod: "Amex Platinum", receipt: true, individuals: "Self", notes: "Booked direct, 5x MR pts" },
  { id: DEMO("exp_2"), _demo: true, tripId: DEMO("trip_tokyo"), category: "lodging", description: "Park Hyatt Tokyo · 5 nights", amount: 2700, currency: "USD", fxRate: 1, date: "2026-06-03", paymentMethod: "Hyatt Card", receipt: true, individuals: "Self", notes: "Globalist suite upgrade" },
  { id: DEMO("exp_3"), _demo: true, tripId: DEMO("trip_tokyo"), category: "biz_meals", description: "Kozue dinner — client", amount: 18400, currency: "JPY", fxRate: 0.0067, date: "2026-06-04", paymentMethod: "Amex Gold", receipt: true, individuals: "Self + 2 clients", notes: "" },
  { id: DEMO("exp_4"), _demo: true, tripId: DEMO("trip_bermuda"), category: "lodging", description: "Hamilton Princess · 6 nights", amount: 3640, currency: "USD", fxRate: 1, date: "2026-09-12", paymentMethod: "Marriott Bonvoy Boundless", receipt: true, individuals: "Family", notes: "" },
];

export const DEMO_SPLIT_GROUP = {
  id: DEMO("split_tokyo"),
  _demo: true,
  name: "Tokyo Trip 2026",
  currency: "USD",
  created_at: "2026-04-15T00:00:00Z",
  created_by: "demo",
  _isOwner: true,
  members: [
    { id: DEMO("mem_self"), email: "you@example.com", display_name: "You", user_id: "demo" },
    { id: DEMO("mem_alex"), email: "alex@example.com", display_name: "Alex" },
    { id: DEMO("mem_sam"), email: "sam@example.com", display_name: "Sam" },
  ],
  expenses: [
    { id: DEMO("se_1"), description: "Kozue dinner", amount: 320, currency: "USD", fx_rate: 1, paid_by_email: "you@example.com", split_type: "equal", date: "2026-06-04", category: "food", split_expense_shares: [
      { email: "you@example.com", amount: 106.67, settled: true },
      { email: "alex@example.com", amount: 106.67, settled: false },
      { email: "sam@example.com", amount: 106.66, settled: false },
    ]},
    { id: DEMO("se_2"), description: "Blacklane HND→Marunouchi", amount: 180, currency: "USD", fx_rate: 1, paid_by_email: "alex@example.com", split_type: "equal", date: "2026-06-03", category: "transport", split_expense_shares: [
      { email: "you@example.com", amount: 60, settled: false },
      { email: "alex@example.com", amount: 60, settled: true },
      { email: "sam@example.com", amount: 60, settled: false },
    ]},
  ],
  settlements: [],
};

export const DEMO_CONTACTS = [
  { id: DEMO("c_1"), _demo: true, email: "alex@example.com", display_name: "Alex" },
  { id: DEMO("c_2"), _demo: true, email: "sam@example.com", display_name: "Sam" },
  { id: DEMO("c_3"), _demo: true, email: "jordan@example.com", display_name: "Jordan" },
];

// Local-storage key for the toggle
export const DEMO_MODE_STORAGE_KEY = "continuum:demoMode";

export function readDemoMode() {
  try { return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1"; } catch { return false; }
}
export function writeDemoMode(on) {
  try {
    if (on) window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
    else window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  } catch {}
}

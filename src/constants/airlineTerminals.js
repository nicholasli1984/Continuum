// Airline → terminal(s) at major airports.
// Keyed by airport IATA → airline program ID → array of terminal labels.
//
// Airline IDs MUST match LOYALTY_PROGRAMS.airlines IDs in programs.js
// (e.g. "dl" for Delta, NOT "delta"). Mismatched IDs mean the page falls
// back to "show everything" because the lookup returns [].
//
// Terminal labels are normalized to match what's stored in lounges.js:
//   - Numeric: "1", "2", "3", "4", "5", "6", "7", "8"
//   - Lettered: "A", "B", "C", "D", "E", "F", "T"
//   - Special multi-terminal labels stay as-is
//
// Sources: official airline websites + airport authority info (cross-checked
// against AA.com, Delta.com, BA.com, JFKairport.com, LAWA.org, FlyORD.com,
// FlyLAX.com, ATL.com, DFWairport.com, FlyBoston.com, Heathrow.com, etc.)
// as of 2026-04. This is best-effort — terminal assignments shift, codeshare
// flights may board at the marketing carrier's terminal, and large hubs
// often split a single airline across multiple concourses.
//
// Conservative principle: when uncertain, omit the entry rather than guess.
// An empty result triggers "show everything" which is safer than a wrong filter.

export const AIRLINE_TERMINAL_AT_AIRPORT = {
  // ── New York JFK ──
  // T1 currently being demolished/redeveloped 2024-2026; some airlines temporarily relocated.
  // T7 closes 2026; tenants moving to T1 (new) or T8.
  JFK: {
    dl: ["4"],                  // Delta — T4 only at JFK
    aa: ["8"],                  // American + AA Eagle
    ba_avios: ["8"],            // Moved from T7 to T8 in 2022
    ua: ["7"],                  // United (limited JFK presence; mostly Newark)
    cathay_mp: ["8"],           // oneworld with AA
    jal: ["8"],                 // oneworld
    qantas_ff: ["8"],           // oneworld
    qatar: ["8"],               // oneworld
    iberia: ["8"],              // Moved from T7 to T8
    finnair: ["8"],             // oneworld
    singapore_kf: ["4"],        // T4
    emirates_skywards: ["4"],   // T4
    etihad_guest: ["4"],        // T4
    flying_blue: ["1", "4"],    // Air France T1, KLM T4 (joint program)
    virgin_fc: ["4"],           // SkyTeam-adjacent, partners with Delta at T4
    lufthansa: ["1"],           // Star Alliance
    swiss: ["1"],
    austrian: ["1"],
    ana: ["7"],                 // Star Alliance via T7
    turkish_miles: ["1"],
    eva_air: ["1"],
    saudia: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["4"],
    korean_air: ["1"],
    asiana: ["1"],
    aeroplan: ["7"],            // Air Canada T7
  },

  // ── Los Angeles LAX ──
  // BA moved to T5 from TBIT in 2024 (oneworld consolidation w/AA at T4-T5 + connector to TBIT)
  LAX: {
    dl: ["2", "3"],             // Delta consolidated at T2/T3 (T3 main, T2 added 2023)
    aa: ["4", "5"],             // AA at T4 mainline + connector to TBIT
    ua: ["7", "8"],             // United at T7-T8
    atmos: ["6"],               // Alaska Airlines T6 (consolidated 2024)
    sw: ["1"],                  // Southwest T1
    ba_avios: ["B"],            // BA at TBIT (B). Some sources cite T5 - was a brief consolidation
    cathay_mp: ["B"],
    jal: ["B"],
    qantas_ff: ["B"],
    qatar: ["B"],
    finnair: ["B"],
    iberia: ["B"],
    singapore_kf: ["B"],
    emirates_skywards: ["B"],
    etihad_guest: ["B"],
    ana: ["B"],
    lufthansa: ["B"],
    swiss: ["B"],
    flying_blue: ["B"],
    virgin_fc: ["B"],
    eva_air: ["B"],
    korean_air: ["B"],
    asiana: ["B"],
    air_china: ["B"],
    china_eastern: ["B"],
    air_nz: ["B"],
    turkish_miles: ["B"],
    aeroplan: ["B"],
  },

  // ── Chicago O'Hare ORD ──
  // T2 closed for rebuild starting 2026; United domestic split between T1 + temp gates.
  ORD: {
    ua: ["1", "2"],             // United mainline T1, regional T2
    aa: ["3"],                  // American + AA Eagle T3
    dl: ["5"],                  // Delta moved to T5 international ~2024
    atmos: ["3"],               // Alaska oneworld T3
    ba_avios: ["5"],
    cathay_mp: ["5"],
    jal: ["5"],
    qatar: ["5"],
    finnair: ["5"],
    iberia: ["5"],
    flying_blue: ["5"],
    lufthansa: ["1"],           // Star Alliance T1 (codeshare with United)
    swiss: ["1"],
    austrian: ["1"],
    ana: ["1"],
    turkish_miles: ["5"],
    emirates_skywards: ["5"],
    eva_air: ["5"],
    asiana: ["5"],
    aeroplan: ["1"],            // Star Alliance
  },

  // ── Atlanta ATL ──
  // Delta hub, dominates almost every concourse; international concourse F & I.
  ATL: {
    dl: ["S", "T", "A", "B", "C", "D", "E", "F"],  // Delta is everywhere
    aa: ["T"],
    ua: ["T"],
    atmos: ["T"],
    flying_blue: ["F"],         // SkyTeam international
    ba_avios: ["F"],
    qatar: ["F"],
    lufthansa: ["F"],
    turkish_miles: ["F"],
    virgin_fc: ["F"],
    aeroplan: ["F"],
    korean_air: ["F"],
  },

  // ── Dallas/Fort Worth DFW ──
  DFW: {
    aa: ["A", "B", "C", "D"],   // AA hub — A/B/C domestic, D international
    dl: ["E"],
    ua: ["E"],
    atmos: ["E"],
    sw: ["E"],
    ba_avios: ["D"],
    qantas_ff: ["D"],
    qatar: ["D"],
    cathay_mp: ["D"],
    jal: ["D"],
    finnair: ["D"],
    iberia: ["D"],
    lufthansa: ["D"],
    flying_blue: ["D"],
    emirates_skywards: ["D"],
    turkish_miles: ["D"],
    korean_air: ["D"],
    aeroplan: ["E"],
  },

  // ── San Francisco SFO ──
  SFO: {
    ua: ["3", "G"],             // United T3 domestic, Intl G concourse (intl wing)
    aa: ["1"],                  // AA at T1 ("Harvey Milk" terminal)
    dl: ["1"],
    atmos: ["1", "2"],          // Alaska T1 + T2
    sw: ["1"],
    ba_avios: ["A"],            // International A (intl)
    cathay_mp: ["A"],
    jal: ["A"],
    qantas_ff: ["A"],
    qatar: ["A"],
    finnair: ["A"],
    singapore_kf: ["A"],
    emirates_skywards: ["A"],
    etihad_guest: ["A"],
    ana: ["A"],
    lufthansa: ["A"],
    flying_blue: ["A"],
    eva_air: ["A"],
    air_china: ["A"],
    asiana: ["A"],
    korean_air: ["A"],
    air_nz: ["A"],
    turkish_miles: ["A"],
    aeroplan: ["A"],
  },

  // ── Boston BOS ──
  BOS: {
    aa: ["B"],
    dl: ["A", "E"],             // Delta domestic A, intl E
    ua: ["B"],
    atmos: ["B"],
    sw: ["A"],                  // Southwest at A
    ba_avios: ["E"],
    cathay_mp: ["E"],
    qatar: ["E"],
    finnair: ["E"],
    iberia: ["E"],
    lufthansa: ["E"],
    flying_blue: ["E"],
    emirates_skywards: ["E"],
    turkish_miles: ["E"],
    aeroplan: ["B"],
  },

  // ── Newark EWR ──
  EWR: {
    ua: ["A", "C"],             // United hub
    aa: ["A"],
    dl: ["A"],
    atmos: ["A"],
    ba_avios: ["B"],
    qatar: ["B"],
    flying_blue: ["B"],
    lufthansa: ["B"],
    swiss: ["B"],
    singapore_kf: ["B"],
    emirates_skywards: ["B"],
    turkish_miles: ["B"],
    aeroplan: ["B"],
    air_india: ["B"],
  },

  // ── Miami MIA ──
  MIA: {
    aa: ["D"],                  // AA hub — Concourse D
    dl: ["H"],
    ua: ["E"],
    atmos: ["D"],
    ba_avios: ["E"],
    iberia: ["E"],
    lufthansa: ["E"],
    flying_blue: ["E"],
    qatar: ["E"],
    turkish_miles: ["E"],
    finnair: ["E"],
  },

  // ── London Heathrow LHR ──
  LHR: {
    ba_avios: ["3", "5"],       // BA mainly T5; some international T3
    iberia: ["5"],              // After T5 consolidation
    aa: ["3"],                  // oneworld international T3
    cathay_mp: ["3"],
    jal: ["3"],
    qantas_ff: ["3"],
    finnair: ["3"],
    qatar: ["4"],               // Most Qatar flights T4
    dl: ["3"],                  // Delta T3 (Virgin Atlantic partner)
    virgin_fc: ["3"],
    flying_blue: ["4"],         // SkyTeam T4
    ua: ["2"],                  // Star Alliance T2
    lufthansa: ["2"],
    swiss: ["2"],
    austrian: ["2"],
    ana: ["2"],
    singapore_kf: ["2"],        // Note: Singapore moved to T2 from T3
    eva_air: ["2"],
    turkish_miles: ["2"],
    air_china: ["2"],
    aeroplan: ["2"],
    emirates_skywards: ["3"],   // Emirates T3
    etihad_guest: ["4"],        // Etihad T4
    korean_air: ["4"],
  },

  // ── Hong Kong HKG (single passenger terminal) ──
  HKG: {
    cathay_mp: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    dl: ["1"],
    ua: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    flying_blue: ["1"],
    emirates_skywards: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    korean_air: ["1"],
    asiana: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    turkish_miles: ["1"],
    hk_airlines: ["1"],
    hk_express: ["2"],          // HKE moved to T2 LCC operations
  },

  // ── Tokyo Haneda HND ──
  HND: {
    jal: ["1", "3"],            // Domestic T1, intl T3
    ana: ["2", "3"],            // Domestic T2, intl T3
    aa: ["3"],
    ua: ["3"],
    dl: ["3"],
    ba_avios: ["3"],
    cathay_mp: ["3"],
    qantas_ff: ["3"],
    qatar: ["3"],
    finnair: ["3"],
    singapore_kf: ["3"],
    lufthansa: ["3"],
    swiss: ["3"],
    flying_blue: ["3"],
    emirates_skywards: ["3"],
    eva_air: ["3"],
    air_china: ["3"],
    china_eastern: ["3"],
    asiana: ["3"],
    korean_air: ["3"],
    thai: ["3"],
    turkish_miles: ["3"],
  },

  // ── Tokyo Narita NRT ──
  NRT: {
    jal: ["2"],                 // oneworld
    ana: ["1"],                 // Star Alliance
    aa: ["2"],
    ua: ["1"],
    dl: ["1"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    qantas_ff: ["2"],
    qatar: ["2"],
    finnair: ["2"],
    iberia: ["2"],
    singapore_kf: ["1"],
    eva_air: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    air_china: ["1"],
    lufthansa: ["1"],
    flying_blue: ["1"],
    swiss: ["1"],
    turkish_miles: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    vietnam_air: ["1"],
    philippines_air: ["1"],
    malaysia: ["1"],
    garuda: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    emirates_skywards: ["1"],
  },

  // ── Singapore SIN ──
  SIN: {
    singapore_kf: ["2", "3"],   // Singapore Airlines mainline T2/T3
    scoot: ["1"],
    ana: ["1"],                 // Star Alliance
    aa: ["1"],                  // AA US flights via partners — typically T1
    cathay_mp: ["4"],           // oneworld T4
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    ba_avios: ["1"],
    ua: ["3"],
    dl: ["1"],
    lufthansa: ["3"],
    swiss: ["3"],
    flying_blue: ["1"],
    emirates_skywards: ["1"],
    eva_air: ["3"],
    air_china: ["1"],
    china_eastern: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["2"],
    garuda: ["2"],
    philippines_air: ["1"],
    vietnam_air: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    turkish_miles: ["1"],
    airasia: ["4"],
  },

  // ── Dubai DXB (Emirates dominant, T3) ──
  DXB: {
    emirates_skywards: ["3"],   // Emirates exclusive T3
    flydubai: ["3"],            // Codeshare partner T3 since 2023
    qatar: ["1"],
    ba_avios: ["1"],
    aa: ["1"],
    cathay_mp: ["1"],
    ua: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    flying_blue: ["1"],
    dl: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    jal: ["1"],
    air_india: ["1"],
    saudia: ["1"],
    turkish_miles: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    philippines_air: ["1"],
    vietnam_air: ["1"],
  },

  // ── Doha DOH (Hamad International — single terminal w/ concourses) ──
  DOH: {
    qatar: ["1"],               // Qatar Airways home hub
    ba_avios: ["1"],
    aa: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    emirates_skywards: ["1"],
    singapore_kf: ["1"],
    lufthansa: ["1"],
    flying_blue: ["1"],
    turkish_miles: ["1"],
    air_india: ["1"],
  },

  // ── Frankfurt FRA ──
  FRA: {
    lufthansa: ["1"],           // LH home — T1 (extensive)
    swiss: ["1"],
    austrian: ["1"],
    ua: ["1"],                  // Star Alliance
    ana: ["1"],
    singapore_kf: ["1"],
    air_china: ["1"],
    asiana: ["1"],
    korean_air: ["1"],          // SkyTeam now T2
    aeroplan: ["1"],
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["2"],
    qantas_ff: ["2"],
    qatar: ["2"],
    finnair: ["2"],
    iberia: ["2"],
    dl: ["2"],
    flying_blue: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    turkish_miles: ["1"],       // Star Alliance T1
  },

  // ── Sydney SYD ──
  SYD: {
    qantas_ff: ["1", "3"],      // Intl T1, domestic T3
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    singapore_kf: ["1"],
    emirates_skywards: ["1"],
    ua: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    air_nz: ["1"],
    air_india: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    philippines_air: ["1"],
    vietnam_air: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    air_china: ["1"],
    eva_air: ["1"],
    korean_air: ["1"],
    asiana: ["1"],
    turkish_miles: ["1"],
    jetstar: ["1", "2"],
  },

  // ── Bermuda BDA (single terminal) ──
  BDA: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    ba_avios: ["1"],
    aeroplan: ["1"],
  },

  // ── New York LaGuardia LGA (rebuild completed 2022) ──
  // Domestic-only (mostly). T-A is the historic Marine Air Terminal.
  LGA: {
    aa: ["B"],                  // American + Eagle in new Terminal B (2022)
    dl: ["C"],                  // Delta consolidated to new Terminal C (2022)
    ua: ["B"],                  // United uses Terminal B
    sw: ["B"],                  // Southwest in Terminal B
    aeroplan: ["B"],            // Air Canada Terminal B
    spirit: ["A"],              // Spirit at Marine Air Terminal A
    frontier: ["B"],
  },

  // ── Washington Reagan DCA ──
  DCA: {
    aa: ["1", "2"],             // AA at the renovated Terminal 1 (formerly B/C)
    dl: ["2"],
    ua: ["2"],
    atmos: ["2"],
    sw: ["1"],
    aeroplan: ["1"],
  },

  // ── Washington Dulles IAD ──
  IAD: {
    ua: ["C", "D"],             // United hub — Concourse C/D
    aa: ["B"],
    dl: ["B"],
    atmos: ["B"],
    ba_avios: ["B"],
    flying_blue: ["B"],
    lufthansa: ["B"],
    swiss: ["B"],
    qatar: ["B"],
    emirates_skywards: ["B"],
    etihad_guest: ["B"],
    saudia: ["B"],
    turkish_miles: ["B"],
    korean_air: ["B"],
    ana: ["B"],
    air_india: ["B"],
    aeroplan: ["B"],
  },

  // ── Philadelphia PHL ──
  PHL: {
    aa: ["A", "B", "C", "D", "F"],  // AA hub spans almost every concourse
    dl: ["E"],
    ua: ["D"],
    atmos: ["D"],
    sw: ["E"],
    ba_avios: ["A"],            // International A West
    qatar: ["A"],
    flying_blue: ["A"],
    lufthansa: ["A"],
    aeroplan: ["A"],
  },

  // ── Charlotte CLT ──
  CLT: {
    aa: ["A", "B", "C", "D", "E"],  // AA hub — most concourses
    dl: ["E"],
    ua: ["E"],
    atmos: ["E"],
    sw: ["E"],
    aeroplan: ["E"],
  },

  // ── Houston Bush IAH ──
  IAH: {
    ua: ["A", "B", "C", "D", "E"],  // United hub spans nearly all
    aa: ["A"],
    dl: ["A"],
    atmos: ["A"],
    sw: ["E"],                  // SW at IAH
    ba_avios: ["D"],            // International D
    lufthansa: ["D"],
    flying_blue: ["D"],
    qatar: ["D"],
    emirates_skywards: ["D"],
    turkish_miles: ["D"],
    aeroplan: ["E"],
  },

  // ── Denver DEN ──
  DEN: {
    ua: ["A", "B"],             // United hub — Concourse B mostly
    aa: ["A"],
    dl: ["A"],
    atmos: ["A"],
    sw: ["C"],                  // SW Concourse C
    ba_avios: ["A"],
    lufthansa: ["A"],
    aeroplan: ["A"],
  },

  // ── Phoenix PHX ──
  PHX: {
    aa: ["4"],                  // American hub — T4
    dl: ["3"],
    ua: ["3"],
    atmos: ["3"],
    sw: ["4"],
    ba_avios: ["4"],
    aeroplan: ["3"],
  },

  // ── Seattle SEA ──
  SEA: {
    atmos: ["A", "B", "C", "D", "N"],  // Alaska hub — almost every concourse
    aa: ["B"],
    dl: ["A", "B"],             // Delta has SEA hub presence
    ua: ["A"],
    sw: ["B"],
    ba_avios: ["S"],            // International S satellite
    flying_blue: ["S"],
    lufthansa: ["S"],
    swiss: ["S"],
    emirates_skywards: ["S"],
    qatar: ["S"],
    singapore_kf: ["S"],
    eva_air: ["S"],
    asiana: ["S"],
    korean_air: ["S"],
    aeroplan: ["S"],
    ana: ["S"],
    jal: ["S"],
    air_india: ["S"],
    air_china: ["S"],
    hk_airlines: ["S"],
  },

  // ── Minneapolis MSP ──
  MSP: {
    dl: ["1"],                  // Delta hub — T1 (Lindbergh)
    aa: ["1"],
    ua: ["1"],
    atmos: ["1"],
    sw: ["2"],                  // SW + low-cost at T2 Humphrey
    aeroplan: ["1"],
    ba_avios: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    korean_air: ["1"],
    turkish_miles: ["1"],
    eva_air: ["1"],
  },

  // ── Detroit DTW ──
  DTW: {
    dl: ["EM"],                 // Delta hub — McNamara (Edward H. McNamara)
    aa: ["NT"],                 // North Terminal
    ua: ["NT"],
    atmos: ["NT"],
    sw: ["NT"],
    flying_blue: ["EM"],
    aeroplan: ["EM"],
    lufthansa: ["EM"],
    korean_air: ["EM"],
  },

  // ── Salt Lake City SLC ──
  SLC: {
    dl: ["A", "B"],             // Delta hub — both concourses
    aa: ["A"],
    ua: ["A"],
    atmos: ["A"],
    sw: ["B"],
    aeroplan: ["A"],
  },

  // ── Orlando MCO ──
  MCO: {
    aa: ["A"],
    dl: ["A"],
    ua: ["A"],
    atmos: ["A"],
    sw: ["B"],                  // SW at Airside B
    ba_avios: ["C"],            // New Terminal C 2022
    emirates_skywards: ["C"],
    flying_blue: ["C"],
    lufthansa: ["C"],
    aeroplan: ["A"],
  },

  // ── Las Vegas LAS ──
  LAS: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    atmos: ["1"],
    sw: ["1"],                  // SW dominant at T1
    ba_avios: ["3"],            // International T3
    flying_blue: ["3"],
    lufthansa: ["3"],
    qatar: ["3"],
    emirates_skywards: ["3"],
    aeroplan: ["3"],
  },

  // ── Mexico City MEX (T1 + T2) ──
  MEX: {
    aa: ["1"],
    dl: ["2"],
    ua: ["1"],
    atmos: ["1"],
    aeroplan: ["2"],
    flying_blue: ["2"],
    ba_avios: ["1"],
    iberia: ["1"],
    lufthansa: ["1"],
    air_china: ["1"],
    turkish_miles: ["1"],
    qatar: ["1"],
    emirates_skywards: ["1"],
  },

  // ── Toronto Pearson YYZ ──
  YYZ: {
    aeroplan: ["1"],            // Air Canada hub T1
    ua: ["1"],                  // Star Alliance T1
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    ana: ["1"],
    singapore_kf: ["1"],
    turkish_miles: ["1"],
    aa: ["1"],                  // AA T1 (some)
    ba_avios: ["3"],            // BA T3
    cathay_mp: ["1"],
    jal: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    dl: ["3"],
    flying_blue: ["3"],
    emirates_skywards: ["3"],
    etihad_guest: ["1"],
    korean_air: ["1"],
    air_china: ["3"],
    china_eastern: ["3"],
    air_india: ["3"],
    air_nz: ["1"],
  },

  // ── Vancouver YVR ──
  YVR: {
    aeroplan: ["M", "D"],       // Air Canada — Main M (domestic) + D (international)
    ua: ["M"],
    lufthansa: ["D"],
    ana: ["D"],
    singapore_kf: ["D"],
    aa: ["M"],
    ba_avios: ["D"],
    cathay_mp: ["D"],
    jal: ["D"],
    qantas_ff: ["D"],
    qatar: ["D"],
    dl: ["M"],
    flying_blue: ["D"],
    air_china: ["D"],
    china_eastern: ["D"],
    china_southern: ["D"],
    korean_air: ["D"],
    asiana: ["D"],
    eva_air: ["D"],
    air_nz: ["D"],
    air_india: ["D"],
    philippines_air: ["D"],
  },

  // ── Amsterdam Schiphol AMS (single terminal w/ piers) ──
  AMS: {
    flying_blue: ["1"],         // KLM home (Air France/KLM)
    dl: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    ua: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    eva_air: ["1"],
    korean_air: ["1"],
    china_eastern: ["1"],
    air_china: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Paris Charles de Gaulle CDG ──
  CDG: {
    flying_blue: ["2E", "2F", "2G"],  // Air France hub — T2 across multiple halls
    dl: ["2E"],
    aa: ["1"],                  // AA T1 (oneworld)
    ba_avios: ["2A"],
    iberia: ["2A"],
    cathay_mp: ["1"],
    jal: ["2E"],
    qatar: ["1"],
    finnair: ["2A"],
    ua: ["1"],                  // Star Alliance
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["2E"],
    korean_air: ["2E"],
    asiana: ["1"],
    emirates_skywards: ["2C"],
    etihad_guest: ["2A"],
    aeroplan: ["2A"],
    turkish_miles: ["1"],
  },

  // ── Munich MUC ──
  MUC: {
    lufthansa: ["2"],           // LH home — T2 entirely
    swiss: ["2"],
    austrian: ["2"],
    ana: ["2"],
    singapore_kf: ["2"],
    asiana: ["2"],
    aa: ["1"],                  // oneworld T1
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    dl: ["1"],                  // SkyTeam T1
    flying_blue: ["1"],
    korean_air: ["1"],
    aeroplan: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
  },

  // ── Zurich ZRH (single terminal w/ piers A/B/D/E) ──
  ZRH: {
    swiss: ["A", "E"],          // SWISS home
    lufthansa: ["A"],
    austrian: ["A"],
    ua: ["A"],
    ana: ["A"],
    singapore_kf: ["A"],
    aa: ["A"],
    ba_avios: ["A"],
    cathay_mp: ["A"],
    qatar: ["A"],
    iberia: ["A"],
    dl: ["A"],
    flying_blue: ["A"],
    emirates_skywards: ["A"],
    etihad_guest: ["A"],
    turkish_miles: ["A"],
    aeroplan: ["A"],
  },

  // ── Madrid MAD ──
  MAD: {
    iberia: ["4", "4S"],        // Iberia hub — T4 + satellite 4S
    ba_avios: ["4S"],
    aa: ["4S"],
    cathay_mp: ["4S"],
    jal: ["4S"],
    qantas_ff: ["4S"],
    qatar: ["4S"],
    finnair: ["4S"],
    flying_blue: ["1"],
    dl: ["1"],
    ua: ["1"],
    lufthansa: ["2"],
    swiss: ["2"],
    austrian: ["2"],
    ana: ["1"],
    singapore_kf: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Rome Fiumicino FCO ──
  FCO: {
    flying_blue: ["1"],         // SkyTeam (incl. Italian carriers)
    aa: ["3"],
    ba_avios: ["3"],
    dl: ["3"],
    cathay_mp: ["3"],
    jal: ["3"],
    qatar: ["3"],
    iberia: ["3"],
    finnair: ["3"],
    ua: ["3"],
    lufthansa: ["3"],
    swiss: ["3"],
    austrian: ["3"],
    singapore_kf: ["3"],
    ana: ["3"],
    emirates_skywards: ["3"],
    etihad_guest: ["3"],
    turkish_miles: ["3"],
    eva_air: ["3"],
    aeroplan: ["3"],
  },

  // ── Istanbul IST (Turkish Airlines hub, single terminal) ──
  IST: {
    turkish_miles: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    qatar: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    eva_air: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    saudia: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    air_india: ["1"],
  },

  // ── Seoul Incheon ICN ──
  ICN: {
    korean_air: ["2"],          // Korean Air home — T2 (SkyTeam)
    flying_blue: ["2"],
    dl: ["2"],
    asiana: ["1"],              // Asiana T1 (Star Alliance)
    ua: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    ana: ["1"],
    singapore_kf: ["1"],
    eva_air: ["1"],
    aa: ["1"],                  // oneworld T1
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    air_china: ["1"],
    china_eastern: ["2"],
    china_southern: ["2"],
    thai: ["1"],
    malaysia: ["1"],
    vietnam_air: ["2"],
    philippines_air: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Bangkok Suvarnabhumi BKK ──
  BKK: {
    thai: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    ua: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    malaysia: ["1"],
    vietnam_air: ["1"],
    philippines_air: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    saudia: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Kuala Lumpur KUL (T1 mainline + KLIA2 LCC) ──
  KUL: {
    malaysia: ["1"],            // MAS home — T1
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    ua: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    vietnam_air: ["1"],
    philippines_air: ["1"],
    air_india: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    saudia: ["1"],
    turkish_miles: ["1"],
    airasia: ["KLIA2"],         // AirAsia at KLIA2 LCC terminal
    scoot: ["KLIA2"],
  },

  // ── Taipei Taoyuan TPE ──
  TPE: {
    eva_air: ["2"],             // EVA home — T2
    china_eastern: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["2"],
    qantas_ff: ["1"],
    qatar: ["1"],
    finnair: ["2"],
    ua: ["2"],
    dl: ["1"],
    flying_blue: ["2"],
    lufthansa: ["1"],
    singapore_kf: ["2"],
    ana: ["2"],
    air_china: ["1"],
    china_southern: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    vietnam_air: ["1"],
    philippines_air: ["2"],
    emirates_skywards: ["2"],
    turkish_miles: ["2"],
  },

  // ── Mumbai BOM ──
  BOM: {
    air_india: ["2"],           // AI international + select domestic at T2
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["2"],
    qatar: ["2"],
    finnair: ["2"],
    ua: ["2"],
    dl: ["2"],
    lufthansa: ["2"],
    swiss: ["2"],
    flying_blue: ["2"],
    singapore_kf: ["2"],
    ana: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    saudia: ["2"],
    turkish_miles: ["2"],
    eva_air: ["2"],
  },

  // ── Delhi DEL ──
  DEL: {
    air_india: ["3"],           // AI mainline + intl T3
    aa: ["3"],
    ba_avios: ["3"],
    cathay_mp: ["3"],
    jal: ["3"],
    qatar: ["3"],
    finnair: ["3"],
    ua: ["3"],
    dl: ["3"],
    lufthansa: ["3"],
    swiss: ["3"],
    flying_blue: ["3"],
    singapore_kf: ["3"],
    ana: ["3"],
    emirates_skywards: ["3"],
    etihad_guest: ["3"],
    saudia: ["3"],
    turkish_miles: ["3"],
    eva_air: ["3"],
    air_china: ["3"],
    thai: ["3"],
    malaysia: ["3"],
  },

  // ── Tampa TPA ──
  TPA: {
    aa: ["A", "E"],
    dl: ["E"],
    ua: ["F"],
    sw: ["C"],
    atmos: ["F"],
    ba_avios: ["F"],
    aeroplan: ["F"],
  },

  // ── Fort Lauderdale FLL ──
  FLL: {
    aa: ["3"],
    dl: ["2"],
    ua: ["1"],
    sw: ["1"],
    atmos: ["1"],
    aeroplan: ["1"],
    ba_avios: ["3"],
    emirates_skywards: ["1"],
  },

  // ── San Diego SAN ──
  SAN: {
    aa: ["1", "2"],
    dl: ["2"],
    ua: ["2"],
    atmos: ["2"],
    sw: ["1"],
    ba_avios: ["2"],
    flying_blue: ["2"],
    lufthansa: ["2"],
    aeroplan: ["2"],
  },

  // ── Honolulu HNL ──
  HNL: {
    atmos: ["1"],               // Alaska + Hawaiian (now AS) at T1
    aa: ["2"],
    dl: ["2"],
    ua: ["2"],
    sw: ["1"],
    ba_avios: ["1"],
    jal: ["1"],
    ana: ["1"],
    qantas_ff: ["1"],
    korean_air: ["1"],
    asiana: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    philippines_air: ["1"],
    air_nz: ["1"],
    aeroplan: ["1"],
  },

  // ── Portland PDX ──
  PDX: {
    atmos: ["C", "D"],          // Alaska hub
    aa: ["C"],
    dl: ["A"],
    ua: ["E"],
    sw: ["B"],
    aeroplan: ["D"],
    ba_avios: ["D"],
    lufthansa: ["D"],
  },

  // ── Austin AUS ──
  AUS: {
    aa: ["E"],
    dl: ["E"],
    ua: ["E"],
    sw: ["S"],
    atmos: ["E"],
    ba_avios: ["E"],
    aeroplan: ["E"],
  },

  // ── Raleigh-Durham RDU ──
  RDU: {
    aa: ["2"],
    dl: ["2"],
    ua: ["2"],
    sw: ["2"],
    atmos: ["2"],
    aeroplan: ["2"],
  },

  // ── Indianapolis IND ──
  IND: {
    aa: ["A"],
    dl: ["B"],
    ua: ["A"],
    sw: ["A"],
    aeroplan: ["A"],
  },

  // ── Oakland OAK ──
  OAK: {
    sw: ["2"],                  // SW dominant
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    atmos: ["1"],
    aeroplan: ["1"],
    ba_avios: ["1"],
  },

  // ── San Jose SJC ──
  SJC: {
    aa: ["A", "B"],
    dl: ["A"],
    ua: ["B"],
    atmos: ["A"],
    sw: ["B"],
    ba_avios: ["A"],
    flying_blue: ["A"],
    lufthansa: ["A"],
    aeroplan: ["A"],
  },

  // ── Jacksonville JAX ──
  JAX: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    sw: ["1"],
    atmos: ["1"],
    aeroplan: ["1"],
  },

  // ── Sao Paulo Guarulhos GRU ──
  GRU: {
    aa: ["3"],
    ua: ["2"],
    dl: ["3"],
    ba_avios: ["3"],
    iberia: ["3"],
    flying_blue: ["3"],
    lufthansa: ["3"],
    swiss: ["3"],
    qatar: ["3"],
    emirates_skywards: ["3"],
    turkish_miles: ["3"],
    aeroplan: ["3"],
    singapore_kf: ["3"],
    ana: ["3"],
    korean_air: ["3"],
    air_china: ["3"],
    air_india: ["3"],
  },

  // ── Cancún CUN ──
  CUN: {
    aa: ["3"],
    dl: ["2"],
    ua: ["3"],
    atmos: ["3"],
    sw: ["3"],
    ba_avios: ["4"],            // T4 international
    aeroplan: ["3"],
    flying_blue: ["4"],
    lufthansa: ["4"],
  },

  // ── San Juan SJU ──
  SJU: {
    aa: ["C"],                  // AA dominant — old terminal redeveloped
    dl: ["B"],
    ua: ["B"],
    atmos: ["B"],
    sw: ["A"],
    aeroplan: ["B"],
    ba_avios: ["B"],
    iberia: ["B"],
  },

  // ── Lima LIM ──
  LIM: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    aeroplan: ["1"],
    ba_avios: ["1"],
    iberia: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    qatar: ["1"],
    turkish_miles: ["1"],
  },

  // ── Bogotá BOG ──
  BOG: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    aeroplan: ["1"],
    ba_avios: ["1"],
    iberia: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    turkish_miles: ["1"],
  },

  // ── Santiago SCL ──
  SCL: {
    aa: ["2"],
    dl: ["2"],
    ua: ["2"],
    aeroplan: ["2"],
    ba_avios: ["2"],
    iberia: ["2"],
    flying_blue: ["2"],
    lufthansa: ["2"],
    qatar: ["2"],
    qantas_ff: ["2"],
  },

  // ── Buenos Aires Ezeiza EZE ──
  EZE: {
    aa: ["A"],
    dl: ["A"],
    ua: ["A"],
    aeroplan: ["A"],
    ba_avios: ["A"],
    iberia: ["A"],
    flying_blue: ["A"],
    lufthansa: ["A"],
    qatar: ["A"],
    turkish_miles: ["A"],
  },

  // ── Panama City PTY ──
  PTY: {
    aa: ["1"],
    dl: ["1"],
    ua: ["1"],
    atmos: ["1"],
    aeroplan: ["1"],
    ba_avios: ["1"],
    iberia: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    turkish_miles: ["1"],
    emirates_skywards: ["1"],
  },

  // ── Mexico City MEX (already covered, keeping as is)
  // ── Barcelona BCN (T1 main, T2 LCC) ──
  BCN: {
    iberia: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    finnair: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    flying_blue: ["1"],
    dl: ["1"],
    ua: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
    air_china: ["1"],
    korean_air: ["1"],
    saudia: ["1"],
  },

  // ── Lisbon LIS ──
  LIS: {
    flying_blue: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    iberia: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    ua: ["1"],
    dl: ["1"],
    qatar: ["1"],
    emirates_skywards: ["1"],
    turkish_miles: ["1"],
    air_china: ["1"],
    aeroplan: ["1"],
  },

  // ── Dublin DUB ──
  DUB: {
    aa: ["2"],                  // Aer Lingus + most intl T2
    ba_avios: ["1"],            // BA + EU at T1
    flying_blue: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    ua: ["2"],
    dl: ["2"],
    atmos: ["2"],
    iberia: ["2"],
    qatar: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    turkish_miles: ["1"],
    aeroplan: ["2"],
  },

  // ── Copenhagen CPH ──
  CPH: {
    sas: ["3"],                 // SAS home — T3
    flying_blue: ["3"],
    aa: ["3"],
    ba_avios: ["3"],
    lufthansa: ["3"],
    swiss: ["3"],
    austrian: ["3"],
    ua: ["3"],
    dl: ["3"],
    iberia: ["3"],
    finnair: ["3"],
    qatar: ["3"],
    singapore_kf: ["3"],
    emirates_skywards: ["3"],
    turkish_miles: ["3"],
    air_china: ["3"],
    aeroplan: ["3"],
  },

  // ── Stockholm Arlanda ARN ──
  ARN: {
    sas: ["4", "5"],            // SAS — T4 domestic, T5 intl
    flying_blue: ["5"],
    aa: ["5"],
    ba_avios: ["5"],
    lufthansa: ["5"],
    swiss: ["5"],
    austrian: ["5"],
    ua: ["5"],
    dl: ["5"],
    iberia: ["5"],
    finnair: ["5"],
    qatar: ["5"],
    singapore_kf: ["5"],
    emirates_skywards: ["5"],
    etihad_guest: ["5"],
    turkish_miles: ["5"],
    aeroplan: ["5"],
  },

  // ── Helsinki HEL ──
  HEL: {
    finnair: ["2"],             // Finnair home — T2 (most flights)
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["2"],
    qatar: ["2"],
    iberia: ["2"],
    lufthansa: ["2"],
    flying_blue: ["2"],
    sas: ["2"],
    emirates_skywards: ["2"],
    turkish_miles: ["2"],
    aeroplan: ["2"],
  },

  // ── Vienna VIE ──
  VIE: {
    austrian: ["3"],            // Austrian home (Star Alliance)
    lufthansa: ["3"],
    swiss: ["3"],
    ua: ["3"],
    ana: ["3"],
    singapore_kf: ["3"],
    aa: ["1"],                  // oneworld T1
    ba_avios: ["1"],
    cathay_mp: ["1"],
    jal: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    iberia: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Athens ATH ──
  ATH: {
    aa: ["B"],                  // Schengen B for some, Non-Schengen A for others
    ba_avios: ["A"],
    qatar: ["A"],
    emirates_skywards: ["A"],
    flying_blue: ["A"],
    lufthansa: ["A"],
    aeroplan: ["A"],
    turkish_miles: ["A"],
    singapore_kf: ["A"],
  },

  // ── Johannesburg JNB ──
  JNB: {
    ba_avios: ["A"],
    aa: ["A"],
    cathay_mp: ["A"],
    qatar: ["A"],
    lufthansa: ["A"],
    swiss: ["A"],
    flying_blue: ["A"],
    dl: ["A"],
    ua: ["A"],
    singapore_kf: ["A"],
    emirates_skywards: ["A"],
    etihad_guest: ["A"],
    turkish_miles: ["A"],
    air_china: ["A"],
    air_india: ["A"],
    saudia: ["A"],
    aeroplan: ["A"],
  },

  // ── Cairo CAI ──
  CAI: {
    saudia: ["3"],              // SkyTeam T3
    flying_blue: ["3"],
    dl: ["3"],
    aa: ["2"],
    ba_avios: ["2"],
    qatar: ["2"],
    lufthansa: ["2"],
    swiss: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    turkish_miles: ["2"],
    aeroplan: ["2"],
  },

  // ── Addis Ababa ADD ──
  ADD: {
    ua: ["2"],                  // Star Alliance via Ethiopian
    lufthansa: ["2"],
    flying_blue: ["2"],
    qatar: ["2"],
    emirates_skywards: ["2"],
    turkish_miles: ["2"],
    aeroplan: ["2"],
  },

  // ── Nairobi NBO ──
  NBO: {
    ba_avios: ["1A"],
    qatar: ["1A"],
    emirates_skywards: ["1A"],
    etihad_guest: ["1A"],
    flying_blue: ["1A"],
    lufthansa: ["1A"],
    swiss: ["1A"],
    turkish_miles: ["1A"],
    saudia: ["1A"],
    aeroplan: ["1A"],
  },

  // ── Osaka Kansai KIX ──
  KIX: {
    jal: ["1"],
    ana: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    ua: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    singapore_kf: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    vietnam_air: ["1"],
    philippines_air: ["1"],
    air_india: ["1"],
    air_nz: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    qantas_ff: ["1"],
  },

  // ── Manila MNL ──
  MNL: {
    philippines_air: ["1", "2"],  // PAL across T1 (intl) + T2 (dom + some intl)
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["3"],           // CX at T3
    qatar: ["3"],
    ua: ["1"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    singapore_kf: ["3"],
    ana: ["1"],
    jal: ["1"],
    korean_air: ["1"],
    asiana: ["1"],
    eva_air: ["3"],
    china_eastern: ["1"],
    china_southern: ["1"],
    air_china: ["1"],
    thai: ["1"],
    malaysia: ["3"],
    vietnam_air: ["1"],
    emirates_skywards: ["3"],
    etihad_guest: ["1"],
    saudia: ["1"],
    turkish_miles: ["1"],
    airasia: ["4"],             // AirAsia at T4
  },

  // ── Melbourne MEL ──
  MEL: {
    qantas_ff: ["1"],           // Qantas T1 + intl
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["2"],
    qatar: ["2"],
    finnair: ["2"],
    singapore_kf: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    ua: ["2"],
    dl: ["2"],
    flying_blue: ["2"],
    lufthansa: ["2"],
    air_nz: ["2"],
    air_india: ["2"],
    eva_air: ["2"],
    china_eastern: ["2"],
    china_southern: ["2"],
    air_china: ["2"],
    asiana: ["2"],
    korean_air: ["2"],
    thai: ["2"],
    malaysia: ["2"],
    philippines_air: ["2"],
    vietnam_air: ["2"],
    turkish_miles: ["2"],
    aeroplan: ["2"],
    jetstar: ["4"],             // Jetstar at T4
  },

  // ── Auckland AKL ──
  AKL: {
    air_nz: ["1", "2"],         // Air NZ — T1 dom, T2 intl
    qantas_ff: ["2"],
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["2"],
    qatar: ["2"],
    singapore_kf: ["2"],
    emirates_skywards: ["2"],
    ua: ["2"],
    flying_blue: ["2"],
    china_southern: ["2"],
    air_china: ["2"],
    korean_air: ["2"],
    aeroplan: ["2"],
    jetstar: ["2"],
  },

  // ── Beijing PEK (Capital) ──
  PEK: {
    air_china: ["3"],           // Air China home — T3
    ana: ["3"],                 // Star Alliance T3
    lufthansa: ["3"],
    swiss: ["3"],
    austrian: ["3"],
    ua: ["3"],
    singapore_kf: ["3"],
    aa: ["3"],                  // oneworld T3
    ba_avios: ["3"],
    cathay_mp: ["3"],
    jal: ["3"],
    qatar: ["3"],
    finnair: ["3"],
    iberia: ["3"],
    dl: ["2"],                  // SkyTeam T2
    flying_blue: ["2"],
    korean_air: ["2"],
    china_eastern: ["2"],
    china_southern: ["2"],
    asiana: ["3"],
    eva_air: ["3"],
    thai: ["3"],
    air_india: ["3"],
    emirates_skywards: ["3"],
    etihad_guest: ["3"],
    turkish_miles: ["3"],
    aeroplan: ["3"],
  },

  // ── Shanghai Pudong PVG ──
  PVG: {
    china_eastern: ["1"],       // CE home
    china_southern: ["2"],
    air_china: ["2"],
    aa: ["1"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    jal: ["1"],
    qantas_ff: ["1"],
    qatar: ["2"],
    finnair: ["2"],
    iberia: ["2"],
    ua: ["2"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["2"],
    swiss: ["2"],
    singapore_kf: ["2"],
    ana: ["2"],
    eva_air: ["2"],
    asiana: ["2"],
    korean_air: ["1"],
    thai: ["2"],
    malaysia: ["2"],
    vietnam_air: ["2"],
    air_india: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    saudia: ["2"],
    turkish_miles: ["2"],
    aeroplan: ["2"],
  },

  // ── Guangzhou CAN ──
  CAN: {
    china_southern: ["2"],      // CZ home — T2
    aa: ["1"],
    ba_avios: ["2"],
    qatar: ["1"],
    finnair: ["2"],
    iberia: ["2"],
    ua: ["2"],
    dl: ["1"],
    flying_blue: ["1"],
    lufthansa: ["2"],
    singapore_kf: ["2"],
    ana: ["2"],
    eva_air: ["2"],
    air_china: ["2"],
    china_eastern: ["1"],
    korean_air: ["2"],
    asiana: ["2"],
    thai: ["1"],
    malaysia: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["1"],
    saudia: ["1"],
    turkish_miles: ["2"],
  },

  // ── Hanoi HAN ──
  HAN: {
    vietnam_air: ["2"],         // VN intl — T2
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    qatar: ["2"],
    flying_blue: ["2"],
    lufthansa: ["2"],
    singapore_kf: ["2"],
    ana: ["2"],
    eva_air: ["2"],
    air_china: ["2"],
    korean_air: ["2"],
    asiana: ["2"],
    thai: ["2"],
    emirates_skywards: ["2"],
    turkish_miles: ["2"],
    jal: ["2"],
  },

  // ── Ho Chi Minh SGN ──
  SGN: {
    vietnam_air: ["2"],         // VN intl — T2
    aa: ["2"],
    ba_avios: ["2"],
    cathay_mp: ["2"],
    qatar: ["2"],
    flying_blue: ["2"],
    lufthansa: ["2"],
    singapore_kf: ["2"],
    ana: ["2"],
    eva_air: ["2"],
    air_china: ["2"],
    korean_air: ["2"],
    asiana: ["2"],
    thai: ["2"],
    malaysia: ["2"],
    emirates_skywards: ["2"],
    etihad_guest: ["2"],
    turkish_miles: ["2"],
    jal: ["2"],
  },

  // ── Maldives Malé MLE ──
  MLE: {
    aa: ["1"],                  // Single intl terminal
    ba_avios: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    singapore_kf: ["1"],
    flying_blue: ["1"],
    lufthansa: ["1"],
    turkish_miles: ["1"],
    saudia: ["1"],
  },

  // ── Colombo CMB ──
  CMB: {
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    singapore_kf: ["1"],
    flying_blue: ["1"],
    air_india: ["1"],
    saudia: ["1"],
    turkish_miles: ["1"],
  },

  // ── Abu Dhabi AUH ──
  AUH: {
    etihad_guest: ["A"],        // Etihad home (new Terminal A 2023)
    aa: ["A"],
    ba_avios: ["A"],
    cathay_mp: ["A"],
    jal: ["A"],
    qatar: ["A"],
    flying_blue: ["A"],
    lufthansa: ["A"],
    swiss: ["A"],
    ua: ["A"],
    dl: ["A"],
    singapore_kf: ["A"],
    ana: ["A"],
    emirates_skywards: ["A"],
    turkish_miles: ["A"],
    air_india: ["A"],
    saudia: ["A"],
  },

  // ── Nashville BNA ──
  BNA: {
    aa: ["A", "B"],
    dl: ["A", "B", "C"],
    ua: ["B"],
    sw: ["C", "D"],             // Southwest dominant
    atmos: ["B"],
    ba_avios: ["B"],
    aeroplan: ["B"],
  },

  // ── St. Louis STL ──
  STL: {
    aa: ["1"],                  // T1 mainline
    dl: ["1"],
    ua: ["1"],
    atmos: ["1"],
    sw: ["2"],                  // SW at T2 (East Terminal)
    aeroplan: ["1"],
  },

  // ── Pittsburgh PIT ──
  PIT: {
    aa: ["B"],
    dl: ["B"],
    ua: ["B"],
    atmos: ["B"],
    sw: ["B"],
    ba_avios: ["B"],
    aeroplan: ["B"],
  },

  // ── Milwaukee MKE ──
  MKE: {
    aa: ["C", "D"],
    dl: ["C", "D"],
    ua: ["C", "D"],
    atmos: ["C", "D"],
    sw: ["C"],
    aeroplan: ["C"],
  },

  // ── Cleveland CLE ──
  CLE: {
    aa: ["B"],
    dl: ["A"],
    ua: ["C"],
    atmos: ["B"],
    sw: ["B"],
    aeroplan: ["A"],
  },

  // ── Columbus CMH ──
  CMH: {
    aa: ["A", "B"],
    dl: ["B"],
    ua: ["C"],
    atmos: ["B"],
    sw: ["A"],
    aeroplan: ["B"],
  },

  // ── Indianapolis already covered (IND)
  // ── New Orleans MSY ──
  MSY: {
    aa: ["A"],
    dl: ["B"],
    ua: ["A"],
    atmos: ["B"],
    sw: ["B"],
    ba_avios: ["B"],
    flying_blue: ["B"],
    aeroplan: ["B"],
  },

  // ── Sacramento SMF ──
  SMF: {
    aa: ["A"],
    dl: ["B"],
    ua: ["B"],
    atmos: ["B"],
    sw: ["B"],
    aeroplan: ["B"],
  },

  // ── Fort Myers RSW ──
  RSW: {
    aa: ["B", "C"],
    dl: ["D"],
    ua: ["D"],
    atmos: ["D"],
    sw: ["D"],
    aeroplan: ["D"],
  },

  // ── Brussels BRU ──
  BRU: {
    flying_blue: ["A"],         // Brussels Airlines + AF/KL — Pier A (Schengen)
    aa: ["B"],                  // Non-Schengen B
    ba_avios: ["A"],
    iberia: ["A"],
    cathay_mp: ["B"],
    qatar: ["B"],
    finnair: ["A"],
    lufthansa: ["A"],
    swiss: ["A"],
    austrian: ["A"],
    ua: ["B"],
    dl: ["B"],
    singapore_kf: ["B"],
    ana: ["A"],
    emirates_skywards: ["B"],
    etihad_guest: ["B"],
    turkish_miles: ["A"],
    air_china: ["B"],
    aeroplan: ["B"],
  },

  // ── Budapest BUD ──
  BUD: {
    flying_blue: ["2B"],
    aa: ["2B"],
    ba_avios: ["2B"],
    lufthansa: ["2A"],
    swiss: ["2A"],
    austrian: ["2A"],
    ua: ["2A"],
    qatar: ["2B"],
    emirates_skywards: ["2B"],
    turkish_miles: ["2A"],
    aeroplan: ["2A"],
  },

  // ── Edinburgh EDI ──
  EDI: {
    ba_avios: ["1"],
    flying_blue: ["1"],
    aa: ["1"],                  // AA seasonal
    qatar: ["1"],
    emirates_skywards: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
    iberia: ["1"],
  },

  // ── Geneva GVA ──
  GVA: {
    swiss: ["1"],               // SWISS home base
    lufthansa: ["1"],
    austrian: ["1"],
    ua: ["1"],
    ba_avios: ["1"],
    iberia: ["1"],
    flying_blue: ["1"],
    aa: ["1"],
    dl: ["1"],
    qatar: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    saudia: ["1"],
    aeroplan: ["1"],
  },

  // ── Manchester MAN ──
  MAN: {
    ba_avios: ["3"],            // BA + intra-Europe at T3
    iberia: ["3"],
    flying_blue: ["1"],
    aa: ["3"],
    cathay_mp: ["1"],
    qatar: ["1"],
    finnair: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    ua: ["1"],
    dl: ["1"],
    singapore_kf: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
    air_india: ["1"],
  },

  // ── Oslo OSL ──
  OSL: {
    sas: ["1"],
    flying_blue: ["1"],
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    iberia: ["1"],
    lufthansa: ["1"],
    swiss: ["1"],
    austrian: ["1"],
    ua: ["1"],
    dl: ["1"],
    finnair: ["1"],
    singapore_kf: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    aeroplan: ["1"],
  },

  // ── Prague PRG ──
  PRG: {
    flying_blue: ["1"],         // SkyTeam + non-Schengen at T1
    aa: ["1"],
    ba_avios: ["1"],
    qatar: ["1"],
    iberia: ["1"],
    cathay_mp: ["1"],
    finnair: ["1"],
    dl: ["1"],
    ua: ["1"],
    emirates_skywards: ["1"],
    etihad_guest: ["1"],
    turkish_miles: ["1"],
    saudia: ["1"],
    air_china: ["1"],
    korean_air: ["1"],
    lufthansa: ["2"],           // Schengen at T2
    swiss: ["2"],
    austrian: ["2"],
    aeroplan: ["1"],
  },

  // ── Warsaw WAW ──
  WAW: {
    flying_blue: ["A"],         // SkyTeam (LOT) at A
    aa: ["A"],
    ba_avios: ["A"],
    qatar: ["A"],
    finnair: ["A"],
    iberia: ["A"],
    cathay_mp: ["A"],
    lufthansa: ["A"],
    swiss: ["A"],
    austrian: ["A"],
    ua: ["A"],
    dl: ["A"],
    singapore_kf: ["A"],
    ana: ["A"],
    emirates_skywards: ["A"],
    etihad_guest: ["A"],
    turkish_miles: ["A"],
    aeroplan: ["A"],
    korean_air: ["A"],
  },

  // ── Jakarta CGK ──
  CGK: {
    garuda: ["3"],              // Garuda + intl at T3
    aa: ["3"],
    ba_avios: ["3"],
    cathay_mp: ["3"],
    qatar: ["3"],
    flying_blue: ["3"],
    lufthansa: ["3"],
    singapore_kf: ["3"],
    ana: ["3"],
    eva_air: ["3"],
    air_china: ["3"],
    china_eastern: ["3"],
    korean_air: ["3"],
    asiana: ["3"],
    thai: ["3"],
    malaysia: ["3"],
    vietnam_air: ["3"],
    philippines_air: ["3"],
    air_india: ["3"],
    emirates_skywards: ["3"],
    etihad_guest: ["3"],
    saudia: ["3"],
    turkish_miles: ["3"],
    airasia: ["2"],
  },

  // ── Bali Denpasar DPS ──
  DPS: {
    garuda: ["I"],              // Intl terminal
    aa: ["I"],
    ba_avios: ["I"],
    cathay_mp: ["I"],
    qatar: ["I"],
    flying_blue: ["I"],
    lufthansa: ["I"],
    singapore_kf: ["I"],
    ana: ["I"],
    eva_air: ["I"],
    air_china: ["I"],
    china_eastern: ["I"],
    china_southern: ["I"],
    korean_air: ["I"],
    asiana: ["I"],
    thai: ["I"],
    malaysia: ["I"],
    philippines_air: ["I"],
    emirates_skywards: ["I"],
    etihad_guest: ["I"],
    turkish_miles: ["I"],
    qantas_ff: ["I"],
    air_nz: ["I"],
    jetstar: ["I"],
    airasia: ["I"],
  },

  // ── Phnom Penh PNH ──
  PNH: {
    aa: ["1"],
    ba_avios: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    flying_blue: ["1"],
    singapore_kf: ["1"],
    eva_air: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    vietnam_air: ["1"],
    emirates_skywards: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
  },

  // ── Yangon RGN ──
  RGN: {
    aa: ["1"],
    cathay_mp: ["1"],
    qatar: ["1"],
    flying_blue: ["1"],
    singapore_kf: ["1"],
    ana: ["1"],
    eva_air: ["1"],
    asiana: ["1"],
    korean_air: ["1"],
    thai: ["1"],
    malaysia: ["1"],
    vietnam_air: ["1"],
    air_india: ["1"],
    emirates_skywards: ["1"],
    air_china: ["1"],
    china_southern: ["1"],
  },

  // ── Kota Kinabalu BKI ──
  BKI: {
    malaysia: ["1"],
    aa: ["1"],
    cathay_mp: ["1"],
    singapore_kf: ["1"],
    eva_air: ["1"],
    air_china: ["1"],
    china_eastern: ["1"],
    china_southern: ["1"],
    korean_air: ["1"],
    asiana: ["1"],
    thai: ["1"],
    philippines_air: ["1"],
    air_india: ["1"],
    qatar: ["1"],
    flying_blue: ["1"],
    emirates_skywards: ["1"],
    airasia: ["2"],
    scoot: ["2"],
  },
};

// Normalize a terminal label to compare against lounge.terminal.
// "Terminal 4" / "T4" / "4" all → "4". "TBIT" / "B" stay.
export function normalizeTerminal(t) {
  if (!t) return "";
  return t.toString().toUpperCase().replace(/^TERMINAL\s+/i, "").replace(/^T(?=\d)/i, "").trim();
}

// Lookup: which terminal(s) does this airline operate from at this airport?
// Returns [] when unknown so callers can decide to show everything.
export function getAirlineTerminals(airportCode, airlineId) {
  if (!airportCode || !airlineId) return [];
  const map = AIRLINE_TERMINAL_AT_AIRPORT[airportCode.toUpperCase()];
  if (!map) return [];
  return (map[airlineId] || []).map(normalizeTerminal);
}

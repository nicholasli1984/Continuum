// Booking classes, airlines, credit cards, landmarks

export const AIRPORT_COORDS = {
  // North America
  ATL:[-84.428,33.637],BOS:[-71.005,42.365],CLT:[-80.943,35.214],DEN:[-104.674,39.856],DFW:[-97.038,32.897],
  DTW:[-83.353,42.212],EWR:[-74.169,40.689],FLL:[-80.153,26.073],HNL:[-157.922,21.319],IAD:[-77.456,38.945],
  IAH:[-95.341,29.984],JFK:[-73.779,40.640],LAX:[-118.408,33.943],LGA:[-73.872,40.777],MCO:[-81.309,28.429],
  MDW:[-87.752,41.786],MIA:[-80.290,25.796],MSP:[-93.222,44.883],ORD:[-87.904,41.980],PDX:[-122.598,45.589],
  PHL:[-75.241,39.872],PHX:[-112.012,33.435],SAN:[-117.190,32.734],SEA:[-122.309,47.450],SFO:[-122.375,37.619],
  SJC:[-121.929,37.363],SLC:[-111.978,40.789],TPA:[-82.533,27.976],YUL:[-73.741,45.470],YVR:[-123.184,49.195],
  YYZ:[-79.631,43.677],YYC:[-114.020,51.131],YOW:[-75.669,45.323],YHZ:[-63.510,44.880],
  BDA:[-64.679,32.364],NAS:[-77.466,25.039],MBJ:[-77.913,18.504],KIN:[-76.788,17.936],
  POS:[-61.337,10.595],BGI:[-59.493,13.075],SJU:[-66.002,18.439],STT:[-64.973,18.337],
  PTY:[-79.384,9.072],SXM:[-63.109,18.041],ANU:[-61.793,17.137],GCM:[-81.358,19.293],
  MEX:[-99.072,19.436],CUN:[-86.877,21.037],GRU:[-46.473,-23.432],
  GIG:[-43.244,-22.810],BOG:[-74.149,4.702],LIM:[-77.115,-12.022],SCL:[-70.787,-33.393],EZE:[-58.535,-34.822],
  // Europe
  AMS:[4.764,52.310],ARN:[17.919,59.652],ATH:[23.944,37.937],BCN:[2.078,41.297],BRU:[4.484,50.901],
  CDG:[2.550,49.013],CPH:[12.656,55.618],DUB:[-6.270,53.421],DUS:[6.757,51.290],EDI:[-3.373,55.950],
  FCO:[12.252,41.800],FRA:[8.571,50.026],GVA:[6.109,46.238],HAM:[9.988,53.630],HEL:[24.963,60.317],
  IST:[28.820,40.976],LHR:[-0.461,51.477],LIS:[-9.136,38.774],MAD:[-3.567,40.472],MAN:[-2.275,53.354],
  MUC:[11.786,48.354],OSL:[11.100,60.197],PRG:[14.260,50.100],SVO:[37.415,55.973],VIE:[16.570,48.110],
  ZRH:[8.549,47.458],WAW:[14.162,52.166],BUD:[19.256,47.437],LYS:[5.081,45.726],NCE:[7.215,43.658],
  // Asia Pacific
  BKK:[100.747,13.681],CAN:[113.299,23.392],CGK:[106.656,-6.126],CJU:[126.493,33.511],CTU:[103.947,30.578],
  DEL:[77.103,28.556],DPS:[115.167,-8.748],GMP:[126.791,37.559],HAN:[105.807,21.221],HKG:[113.915,22.309],
  ICN:[126.451,37.463],KIX:[135.244,34.427],KUL:[101.710,2.743],MNL:[121.020,14.509],NRT:[140.386,35.765],
  PEK:[116.585,40.080],PVG:[121.805,31.143],RGN:[96.133,16.907],SGN:[106.652,10.819],SIN:[103.994,1.350],
  SZX:[113.811,22.639],TPE:[121.233,25.077],XIY:[108.752,34.447],XMN:[118.128,24.544],HND:[139.781,35.549],
  KHH:[120.350,22.577],OKA:[127.646,26.196],CKG:[106.642,29.720],WUH:[114.208,30.784],
  // Middle East & Africa
  AUH:[54.651,24.433],CAI:[31.400,30.122],CMN:[-7.590,33.368],DOH:[51.608,25.261],DXB:[55.364,25.253],
  JED:[39.157,21.680],JNB:[28.246,-26.133],KWI:[47.969,29.227],LOS:[3.321,6.577],NBO:[36.925,-1.319],
  RUH:[46.699,24.958],ADD:[38.799,8.978],CPT:[18.602,-33.965],
  // Oceania
  AKL:[174.792,-37.008],BNE:[153.117,-27.384],CBR:[149.195,-35.307],MEL:[144.843,-37.673],
  PER:[115.967,-31.940],SYD:[151.177,-33.946],CHC:[172.532,-43.490],
};

// ── Airport → City name mapping ──
export const AIRPORT_CITY = {
  ATL:"Atlanta",BOS:"Boston",CLT:"Charlotte",DEN:"Denver",DFW:"Dallas",DTW:"Detroit",EWR:"New York",FLL:"Fort Lauderdale",
  HNL:"Honolulu",IAD:"Washington DC",IAH:"Houston",JFK:"New York",LAX:"Los Angeles",LGA:"New York",MCO:"Orlando",
  MIA:"Miami",MSP:"Minneapolis",ORD:"Chicago",PDX:"Portland",PHL:"Philadelphia",PHX:"Phoenix",SAN:"San Diego",
  SEA:"Seattle",SFO:"San Francisco",SJC:"San Jose",SLC:"Salt Lake City",TPA:"Tampa",YUL:"Montreal",YVR:"Vancouver",
  YYZ:"Toronto",YYC:"Calgary",BDA:"Bermuda",NAS:"Nassau",MBJ:"Montego Bay",SJU:"San Juan",
  MEX:"Mexico City",CUN:"Cancun",GRU:"São Paulo",GIG:"Rio de Janeiro",BOG:"Bogota",LIM:"Lima",SCL:"Santiago",EZE:"Buenos Aires",
  AMS:"Amsterdam",ARN:"Stockholm",ATH:"Athens",BCN:"Barcelona",BRU:"Brussels",CDG:"Paris",CPH:"Copenhagen",DUB:"Dublin",
  EDI:"Edinburgh",FCO:"Rome",FRA:"Frankfurt",GVA:"Geneva",HEL:"Helsinki",IST:"Istanbul",LHR:"London",LIS:"Lisbon",
  MAD:"Madrid",MAN:"Manchester",MUC:"Munich",OSL:"Oslo",PRG:"Prague",VIE:"Vienna",ZRH:"Zurich",WAW:"Warsaw",BUD:"Budapest",NCE:"Nice",
  BKK:"Bangkok",CGK:"Jakarta",DEL:"Delhi",DPS:"Bali",HKG:"Hong Kong",ICN:"Seoul",KIX:"Osaka",KUL:"Kuala Lumpur",
  MNL:"Manila",NRT:"Tokyo",PEK:"Beijing",PVG:"Shanghai",SGN:"Ho Chi Minh City",SIN:"Singapore",TPE:"Taipei",HND:"Tokyo",
  OKA:"Okinawa",AUH:"Abu Dhabi",CAI:"Cairo",DOH:"Doha",DXB:"Dubai",JNB:"Johannesburg",NBO:"Nairobi",CPT:"Cape Town",
  AKL:"Auckland",BNE:"Brisbane",MEL:"Melbourne",SYD:"Sydney",PER:"Perth",
  PTY:"Panama City",CAN:"Guangzhou",BOM:"Mumbai",
  LAS:"Las Vegas",DCA:"Washington DC",MSY:"New Orleans",BNA:"Nashville",AUS:"Austin",STL:"St Louis",
  PIT:"Pittsburgh",MKE:"Milwaukee",CLE:"Cleveland",IND:"Indianapolis",CMH:"Columbus",OAK:"Oakland",SMF:"Sacramento",
  JAX:"Jacksonville",RSW:"Fort Myers",RDU:"Raleigh-Durham",ADD:"Addis Ababa",CMB:"Colombo",MLE:"Malé",
  HAN:"Hanoi",RGN:"Yangon",BKI:"Kota Kinabalu",PNH:"Phnom Penh",BER:"Berlin",
};

// ── City gradient themes — warm/cool palettes per destination ──
export const CITY_THEMES = {
  "Tokyo":     { g1: "#1a0a2e", g2: "#16213e", g3: "#e94560", accent: "#e94560" },
  "Osaka":     { g1: "#1a0a2e", g2: "#2d1b4e", g3: "#f97316", accent: "#f97316" },
  "Kyoto":     { g1: "#1a0a2e", g2: "#1e3a2f", g3: "#a3c4a3", accent: "#8fbc8f" },
  "Paris":     { g1: "#1a1a2e", g2: "#2d2b55", g3: "#c4a35a", accent: "#c4a35a" },
  "London":    { g1: "#0f1923", g2: "#1a2a3a", g3: "#4a7c8c", accent: "#5d9eaf" },
  "New York":  { g1: "#0a0a14", g2: "#1a1a2e", g3: "#ff6b35", accent: "#ff6b35" },
  "Hong Kong": { g1: "#0a0a1a", g2: "#1a0f2e", g3: "#e040fb", accent: "#e040fb" },
  "Singapore": { g1: "#0a1628", g2: "#1a2e4a", g3: "#00bfa5", accent: "#00bfa5" },
  "Dubai":     { g1: "#1a1008", g2: "#2e1a0a", g3: "#d4a84b", accent: "#d4a84b" },
  "Bangkok":   { g1: "#1a0f08", g2: "#2e1e14", g3: "#f59e0b", accent: "#f59e0b" },
  "Sydney":    { g1: "#0a1628", g2: "#142e4a", g3: "#3b82f6", accent: "#3b82f6" },
  "Rome":      { g1: "#1a1008", g2: "#2e1a0e", g3: "#c2956a", accent: "#c2956a" },
  "Barcelona": { g1: "#1a0a14", g2: "#2e1428", g3: "#e85d75", accent: "#e85d75" },
  "Amsterdam": { g1: "#0a1418", g2: "#142832", g3: "#ff8c42", accent: "#ff8c42" },
  "Seoul":     { g1: "#0f0a1e", g2: "#1a1436", g3: "#7c3aed", accent: "#7c3aed" },
  "Istanbul":  { g1: "#1a0f14", g2: "#2e1a28", g3: "#dc626b", accent: "#dc626b" },
  "Lisbon":    { g1: "#1a1410", g2: "#2e2418", g3: "#f0c040", accent: "#f0c040" },
  "Miami":     { g1: "#0a141e", g2: "#0e2838", g3: "#06d6a0", accent: "#06d6a0" },
  "San Francisco":{ g1: "#1a0a14", g2: "#2e1428", g3: "#ff6b6b", accent: "#ff6b6b" },
  "Los Angeles":{ g1: "#1a1008", g2: "#2e1e14", g3: "#fbbf24", accent: "#fbbf24" },
  "Toronto":   { g1: "#0a0f1a", g2: "#141e2e", g3: "#ef4444", accent: "#ef4444" },
  "Vancouver": { g1: "#0a1418", g2: "#14282e", g3: "#10b981", accent: "#10b981" },
  "Bermuda":   { g1: "#0a1a1e", g2: "#0e2e38", g3: "#22d3ee", accent: "#22d3ee" },
  "Taipei":    { g1: "#0f0a1e", g2: "#1a1436", g3: "#818cf8", accent: "#818cf8" },
  "Shanghai":  { g1: "#0a0a14", g2: "#14142e", g3: "#f43f5e", accent: "#f43f5e" },
  "Bali":      { g1: "#0a1a14", g2: "#142e24", g3: "#34d399", accent: "#34d399" },
  "Prague":    { g1: "#0f0a14", g2: "#1e142e", g3: "#a78bfa", accent: "#a78bfa" },
  "Budapest":  { g1: "#0f0a14", g2: "#1e142e", g3: "#c084fc", accent: "#c084fc" },
  "Vienna":    { g1: "#14100a", g2: "#281e14", g3: "#d4a84b", accent: "#d4a84b" },
  "Athens":    { g1: "#0a1420", g2: "#142838", g3: "#38bdf8", accent: "#38bdf8" },
  "Honolulu":  { g1: "#0a1a1e", g2: "#0e2e3a", g3: "#2dd4bf", accent: "#2dd4bf" },
  "Doha":      { g1: "#1a1408", g2: "#2e240e", g3: "#eab308", accent: "#eab308" },
  _fallback:   { g1: "#0a0a14", g2: "#141428", g3: "#D4742D", accent: "#D4742D" },
};

export const CABIN_LABELS = {
  basic_economy: "Basic Economy",
  economy: "Economy",
  premium_economy: "Premium Economy",
  business_first: "Business / First",
};

// Per-airline booking class → cabin mapping (codes vary by carrier)
export const AIRLINE_BOOKING_CLASS_MAP = {
  aa:  { F:"business_first",A:"business_first",P:"business_first", J:"business_first",D:"business_first",R:"business_first",I:"business_first",C:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy", G:"basic_economy" },
  dl:  { J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",M:"economy",H:"economy",Q:"economy",K:"economy",L:"economy",U:"economy",T:"economy",X:"economy",V:"economy",S:"economy", E:"basic_economy",N:"basic_economy" },
  ua:  { J:"business_first",C:"business_first",D:"business_first",Z:"business_first",P:"business_first", A:"premium_economy", Y:"economy",B:"economy",M:"economy",E:"economy",U:"economy",H:"economy",Q:"economy",V:"economy",W:"economy",S:"economy",T:"economy",K:"economy",L:"economy",G:"economy",X:"economy", N:"basic_economy" },
  sw:  { A:"business_first",B:"business_first", Y:"economy",K:"economy",L:"economy",M:"economy",N:"economy",Q:"economy",S:"economy",T:"economy",V:"economy",W:"economy",X:"economy" },
  b6:  { J:"business_first",C:"business_first",D:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy",N:"economy", G:"basic_economy",O:"basic_economy" },
  atmos: { F:"business_first",A:"business_first",C:"business_first",J:"business_first",D:"business_first", P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",L:"economy",M:"economy",O:"economy",S:"economy",Q:"economy",G:"economy",T:"economy",X:"economy",E:"economy",N:"economy",V:"economy",U:"economy",W:"economy" },
  ba_avios: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",R:"business_first",U:"business_first", W:"premium_economy",T:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy",G:"economy" },
  aeroplan: { J:"business_first",C:"business_first",D:"business_first",Z:"business_first",P:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy", E:"basic_economy",G:"basic_economy",N:"basic_economy" },
  singapore_kf: { F:"business_first",A:"business_first",P:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy",E:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", N:"basic_economy",G:"basic_economy" },
  cathay_mp: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",R:"business_first",P:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy",O:"economy" },
  emirates_skywards: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",G:"economy",O:"economy" },
  flying_blue: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  turkish_miles: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  qantas_ff: { F:"business_first",A:"business_first",P:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",O:"economy",G:"economy" },
  etihad_guest: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",E:"economy",G:"economy" },
  virgin_fc: { F:"business_first",A:"business_first", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",U:"business_first", W:"premium_economy",P:"premium_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",N:"economy",Q:"economy",T:"economy",X:"economy",G:"economy" },
  frontier: { J:"business_first",C:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", G:"basic_economy",O:"basic_economy" },
  spirit:   { J:"business_first", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy", G:"basic_economy",O:"basic_economy" },
};
// Generic fallback map for airlines not listed above
export const BOOKING_CLASS_MAP_GENERIC = { G:"basic_economy",O:"basic_economy",E:"basic_economy", Y:"economy",B:"economy",H:"economy",K:"economy",M:"economy",L:"economy",V:"economy",S:"economy",Q:"economy",T:"economy",X:"economy",U:"economy",N:"economy", W:"premium_economy", J:"business_first",C:"business_first",D:"business_first",I:"business_first",Z:"business_first",R:"business_first",F:"business_first",A:"business_first",P:"business_first" };

export const getBookingClassCabin = (programId, code) => {
  if (!code) return null;
  const map = AIRLINE_BOOKING_CLASS_MAP[programId] || BOOKING_CLASS_MAP_GENERIC;
  return map[code.toUpperCase()] || null;
};

// Per-program per-booking-class status earning rates (per $ spent)
export const BOOKING_CLASS_RATES = {
  aa:  { F:11,A:11,P:11, J:11,D:11,R:11,I:11,C:11, W:7, Y:5,B:5,H:5,K:5,M:5,L:5,V:5,S:5,N:5,Q:5,O:5, G:0 },
  dl:  { J:1.5,C:1.5,D:1.5,I:1.5,Z:1.5, P:1.25,W:1.25, Y:1,B:1,M:1,H:1,Q:1,K:1,L:1,U:1,T:1,X:1,V:1,S:1, E:0,N:0 },
  ua:  { J:2,C:2,D:2,Z:2,P:2,F:2,A:2, W:1.5, Y:1,B:1,M:1,E:1,U:1,H:1,Q:1,V:1,S:1,T:1,K:1,L:1,G:1,X:1, N:0 },
  sw:  { A:12,B:12, Y:6,K:6,L:6,M:6,N:6,Q:6,S:6,T:6,V:6,W:6,X:6 },
  b6:  { J:7,C:7,D:7, Y:3,B:3,H:3,K:3,M:3,L:3,V:3,S:3,Q:3,T:3,N:3, G:0,O:0 },
  atmos: { F:3,A:3,C:3,J:3,D:3, P:2, Y:1,B:1,H:1,K:1,L:1,M:1,O:1,S:1,Q:1,G:1,T:1,X:1,E:1,N:1,V:1,U:1,W:1 },
  ba_avios: { F:4,A:4, J:3,C:3,D:3,I:3,R:3,U:3, W:2,T:2,P:2, Y:1.25,B:1.25,H:1.25,K:1.25,M:1.25, L:1,V:1,S:1,N:1, Q:0.5, O:0,G:0 },
  aeroplan: { J:2,C:2,D:2,Z:2,P:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,Q:1,T:1, E:0,G:0,N:0 },
  singapore_kf: { F:2,A:2,P:2, J:2,C:2,D:2,Z:2,U:2, W:1.5,E:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,Q:1, N:0,G:0 },
  cathay_mp: { F:2,A:2, J:2,C:2,D:2,I:2,R:2,P:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:1,Q:1,T:1,X:1,E:0.5,G:0,O:0 },
  emirates_skywards: { F:2,A:2, J:2,C:2,D:2,I:2,Z:2, W:1.5,P:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:1,Q:1,T:1,X:1, G:0,O:0 },
  flying_blue: { F:2,A:2, J:2,C:2,D:2,I:2,Z:2, W:1.5,P:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:0.5,Q:0.5, T:0,X:0,E:0,G:0 },
  qantas_ff: { F:2,A:2,P:2, J:2,C:2,D:2,I:2,Z:2,U:2, W:1.5, Y:1,B:1,H:1,K:1,M:1,L:1,V:1,S:1,N:0,Q:0,O:0,G:0 },
};

export const PARTNER_CLASS_RATES = {
  aa: { // AA partner earning by specific booking class (verified from official sources)
    // BA/Iberia: REVENUE-BASED since Oct 2023 — 5 LP/$1 for premium cabins, 0 for economy
    // (handled by _type "fare" override below, not class rates)
    // Cathay Pacific → AA: DISTANCE-BASED (from wheretocredit.com / FlyerTalk)
    cathay_mp:{ F:150,A:150, J:125,C:125,D:125,I:125,P:125, W:110,R:110,E:110, Y:100,B:150,H:100,K:100, G:0,L:0,M:0,N:0,O:0,Q:0,S:0,V:0 },
    // Qantas → AA: DISTANCE-BASED
    qantas_ff:{ F:150,A:150, J:125,C:125,D:125,I:125, W:110,T:100,R:100, Y:100,B:100, K:50,L:50,M:50,V:50, G:25,N:25,O:25,Q:25,S:25, H:0 },
    // Other oneworld partners: generic distance-based
    atmos:    { F:150,A:150, J:125,C:125,D:125, P:110, Y:100,B:100,H:100,K:100,M:100, L:50,V:50,S:50,N:50,Q:50, G:0 },
  },
  ba_avios: { // BA Tier Points from partner flights by booking class (TP per 100mi approx)
    aa: { F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,R:2.0,I:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4,S:0.4,N:0.4, G:0 },
    cathay_mp:{ F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,I:2.0,R:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4, G:0 },
    qantas_ff:{ F:3.5,A:3.5, J:2.8,C:2.5,D:2.5,I:2.0, W:1.4, Y:0.7,B:0.7,H:0.7,K:0.6,M:0.6, L:0.4,V:0.4, G:0 },
  },
  cathay_mp: { // Cathay Status Points from partner flights (SP per 100mi approx)
    aa: { F:1.8,A:1.8, J:1.5,C:1.2,D:1.2,R:0.8,I:0.8, W:0.6, Y:0.3,B:0.3,H:0.25,K:0.25,M:0.2, L:0.1,V:0.1, G:0 },
    ba_avios:{ F:1.8,A:1.8, J:1.5,C:1.2,D:1.2,R:0.8,I:0.8, W:0.6, Y:0.3,B:0.3,H:0.25,K:0.25,M:0.2, G:0 },
  },
};

export const PARTNER_EARN_RATES = {
  aa: { // AAdvantage Loyalty Points
    // Own-metal: FARE-BASED. 5 LP/$1 base (Gold 7, Plat 8, Plat Pro 9, EP 11 — modeled via elite bonus).
    // BA/Iberia: REVENUE-BASED since Oct 2023 (5 LP/$1 for premium cabins F/A/J/C/D/R/I/W/E/T; 0 for economy).
    // Cathay/Qantas/other oneworld: DISTANCE-BASED by booking class.
    _type: "fare_own",
    _own:         { business_first: 5, premium_economy: 5, economy: 5, basic_economy: 0 },
    // BA → AA: REVENUE-BASED (same rate as own-metal, 5 LP/$1 for premium cabins, 0 for economy)
    ba_avios:     { _fare: true, business_first: 5, premium_economy: 5, economy: 0, basic_economy: 0 },
    // Cathay → AA: DISTANCE-BASED (from official AA/wheretocredit: F/A 150%, J/C/D/I/P 125%, W/R/E 110%)
    cathay_mp:    { business_first: 138, premium_economy: 110, economy: 100, basic_economy: 0 },
    // Qantas → AA: DISTANCE-BASED (F/A 150%, J/C/D/I 125%, W 110%, Y/B 100%, K-V 50%, G-S 25%)
    qantas_ff:    { business_first: 138, premium_economy: 105, economy: 75, basic_economy: 0 },
    atmos:        { business_first: 138, premium_economy: 110, economy: 100, basic_economy: 0 },
    flying_blue:  { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  dl: { // Delta MQDs — since 2024, ONLY MQDs qualify (MQMs eliminated)
    // Own-metal: $1 = 1 MQD (no cabin multiplier). Basic Economy excluded.
    // Partner: distance × fare class % (reduced rates since 2024)
    // NO elite tier bonus on MQDs.
    _type: "revenue",
    _own:         { business_first: 1, premium_economy: 1, economy: 1, basic_economy: 0 },
    flying_blue:  { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
    aeroplan:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  ua: { // United PQPs
    // Own-metal: $1 = 1 PQP (no cabin multiplier). Basic Economy excluded.
    // Partner: PQP derived from miles earned ÷ 5 (preferred) or ÷ 6 (others), with caps.
    // Simplified here as % of distance (approximation of miles÷5).
    // NO elite tier bonus on PQPs.
    _type: "revenue",
    _own:         { business_first: 1, premium_economy: 1, economy: 1, basic_economy: 0 },
    aeroplan:     { business_first: 40, premium_economy: 25, economy: 20, basic_economy: 0 }, // ~miles÷5
    singapore_kf: { business_first: 40, premium_economy: 25, economy: 20, basic_economy: 0 },
    turkish_miles:{ business_first: 33, premium_economy: 20, economy: 17, basic_economy: 0 }, // ~miles÷6
    _default:     { business_first: 33, premium_economy: 20, economy: 17, basic_economy: 0 },
  },
  ba_avios: { // BA Tier Points
    // From April 2025 (own-metal BA/AA/Iberia): 1 TP per GBP 1 of eligible spend + bonus TPs per leg.
    // Bonus per leg: Long-haul Club World (J) = 400 TP, World Traveller Plus (W) = 275 TP,
    //   World Traveller (Y) = 150 TP, First = 550 TP. Short-haul: Club Europe = 175, Euro Trav = 75.
    // Total TP ≈ (fare in GBP × 1) + (legs × cabin bonus). We model as fare-based for own-metal.
    // For GBP→USD approx: ~0.8 TP per $1 spent. Plus bonus per segment (modeled by adding ~100 TP/seg via rate).
    // Partner flights: fixed TP per segment by distance band + cabin (NOT revenue).
    // NO elite tier bonus on Tier Points.
    _type: "fare_own",
    _own:         { business_first: 0.8, premium_economy: 0.8, economy: 0.8, basic_economy: 0.3 }, // ~TP per $ (GBP conversion)
    // Partners: distance-band based, modeled as TP per 100mi (approximate fixed-TP-per-segment)
    aa:           { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    cathay_mp:    { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    qantas_ff:    { business_first: 2.5, premium_economy: 1.4, economy: 0.7, basic_economy: 0 },
    _default:     { business_first: 2.2, premium_economy: 1.2, economy: 0.6, basic_economy: 0 },
  },
  cathay_mp: { // Cathay Status Points — SEGMENT-BASED (fixed SP per distance band + cabin)
    // Simplified as % of distance for calculator (approximate)
    // NO elite tier bonus.
    _type: "segment",
    _own:         { business_first: 1.5, premium_economy: 0.8, economy: 0.3, basic_economy: 0.1 }, // SP per 100mi (approx)
    aa:           { business_first: 1.2, premium_economy: 0.6, economy: 0.25, basic_economy: 0 },
    ba_avios:     { business_first: 1.2, premium_economy: 0.6, economy: 0.25, basic_economy: 0 },
    _default:     { business_first: 1.0, premium_economy: 0.5, economy: 0.2, basic_economy: 0 },
  },
  qantas_ff: { // Qantas Status Credits — SEGMENT-BASED (fixed SC per route zone + fare)
    // Simplified as approx SC per 100mi for calculator
    // NO elite tier bonus on SCs.
    _type: "segment",
    _own:         { business_first: 2.0, premium_economy: 1.2, economy: 0.6, basic_economy: 0 },
    aa:           { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    cathay_mp:    { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    ba_avios:     { business_first: 1.5, premium_economy: 1.0, economy: 0.5, basic_economy: 0 },
    _default:     { business_first: 1.2, premium_economy: 0.8, economy: 0.4, basic_economy: 0 },
  },
  aeroplan: { // Air Canada SQM (Status Qualifying Miles) — DISTANCE-BASED
    // Also requires SQD ($1=1 on AC metal), but calculator shows SQM only.
    // NO elite tier bonus.
    _own:         { business_first: 150, premium_economy: 115, economy: 100, basic_economy: 0 },
    ua:           { business_first: 150, premium_economy: 100, economy: 100, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  singapore_kf: { // Singapore KrisFlyer Elite Miles — DISTANCE-BASED by booking class
    // F/A: 200%, J/C/Z: 150%, D/U: 125%, Economy varies 50-100%
    // NO elite tier bonus.
    _own:         { business_first: 175, premium_economy: 125, economy: 75, basic_economy: 0 },
    ua:           { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 0 },
  },
  emirates_skywards: { // Emirates Tier Miles — DISTANCE-BASED (route-specific, approx values)
    // Rates vary by specific route; these are median approximations.
    // Elite bonus on redeemable Skywards Miles only (Silver +30%, Gold +75%, Plat +100%), NOT on Tier Miles.
    _own:         { business_first: 200, premium_economy: 125, economy: 60, basic_economy: 25 },
    qantas_ff:    { business_first: 150, premium_economy: 100, economy: 50, basic_economy: 0 },
    _default:     { business_first: 125, premium_economy: 75, economy: 50, basic_economy: 0 },
  },
  flying_blue: { // Flying Blue XP — SEGMENT-BASED (fixed XP per distance band + cabin)
    // Biz ~3x Economy, First ~3x Business. Approx XP per 1000mi for calculator.
    // NO elite tier bonus on XP.
    _type: "segment",
    _own:         { business_first: 5.0, premium_economy: 2.5, economy: 1.7, basic_economy: 0.7 }, // XP per 1000mi
    dl:           { business_first: 4.5, premium_economy: 2.0, economy: 1.5, basic_economy: 0 },
    _default:     { business_first: 4.0, premium_economy: 2.0, economy: 1.2, basic_economy: 0 },
  },
  turkish_miles: { // Turkish Status Miles — DISTANCE-BASED
    // ~100-225% by fare class. Elite/Elite Plus get +25% on Business only.
    _own:         { business_first: 200, premium_economy: 150, economy: 100, basic_economy: 25 },
    ua:           { business_first: 175, premium_economy: 125, economy: 100, basic_economy: 0 },
    _default:     { business_first: 150, premium_economy: 100, economy: 75, basic_economy: 0 },
  },
  atmos: { // Alaska Mileage Plan EQMs — DISTANCE-BASED
    // Own-metal: 100% of distance (min 500 EQM). Partner: varies by cabin + booking channel.
    // Rates below assume booked on AlaskaAir.com (higher rates).
    // Elite bonus: MVP +25%, Gold +50%, Gold 75K +50%.
    _own:         { business_first: 100, premium_economy: 100, economy: 100, basic_economy: 50 },
    aa:           { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    cathay_mp:    { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    ba_avios:     { business_first: 250, premium_economy: 150, economy: 100, basic_economy: 25 },
    _default:     { business_first: 125, premium_economy: 100, economy: 50, basic_economy: 25 },
  },
};

// ── Elite status bonus multipliers (applied on top of base earning) ──
// Maps program ID → tier name → bonus % (e.g., 120 = 120% bonus, so total = base × 2.2)
// For partner flights crediting to these programs, redeemable miles include the bonus,
// and all redeemable miles count as Loyalty Points / elite credits.
// Elite status bonus on STATUS CREDITS (not redeemable miles).
// Most programs do NOT give elite bonuses on status-qualifying credits.
// AA: LP earning on own-metal is tier-based (5/7/8/9/11 per $); on partners, the elite bonus
//     applies to redeemable miles which count as LP. This is the partner-flight bonus.
// Alaska: MVP +25%, Gold +50%, Gold 75K +50% on EQMs.
// All others: 0% bonus on status credits (bonuses apply to redeemable miles only).
export const ELITE_BONUS_PCT = {
  aa: { "Gold": 40, "Platinum": 60, "Platinum Pro": 80, "Executive Platinum": 120 },
  atmos: { "MVP": 25, "MVP Gold": 50, "MVP Gold 75K": 50 },
  // Programs with NO elite bonus on status credits:
  dl: { "Silver Medallion": 0, "Gold Medallion": 0, "Platinum Medallion": 0, "Diamond Medallion": 0 },
  ua: { "Premier Silver": 0, "Premier Gold": 0, "Premier Platinum": 0, "Premier 1K": 0 },
  ba_avios: { "Bronze": 0, "Silver": 0, "Gold": 0 },
  cathay_mp: { "Green": 0, "Silver": 0, "Gold": 0, "Diamond": 0 },
  aeroplan: { "25K": 0, "35K": 0, "50K": 0, "75K": 0, "Super Elite 100K": 0 },
  qantas_ff: { "Silver": 0, "Gold": 0, "Platinum": 0 },
  singapore_kf: { "Elite Silver": 0, "Elite Gold": 0 },
  emirates_skywards: { "Silver": 0, "Gold": 0, "Platinum": 0 },
  flying_blue: { "Silver": 0, "Gold": 0, "Platinum": 0, "Ultimate": 0 },
  turkish_miles: { "Classic Plus": 0, "Elite": 0, "Elite Plus": 0 },
};

export const AIRLINE_CS = {
  aa: { name: "American Airlines", phone: "1-800-433-7300", manage: "https://www.aa.com/reservation/view/find-your-trip" },
  dl: { name: "Delta Air Lines", phone: "1-800-221-1212", manage: "https://www.delta.com/mytrips/" },
  ua: { name: "United Airlines", phone: "1-800-864-8331", manage: "https://www.united.com/en/us/managereservation" },
  sw: { name: "Southwest Airlines", phone: "1-800-435-9792", manage: "https://www.southwest.com/air/manage-reservation/" },
  b6: { name: "JetBlue", phone: "1-800-538-2583", manage: "https://www.jetblue.com/manage-trips" },
  atmos: { name: "Alaska Airlines", phone: "1-800-252-7522", manage: "https://www.alaskaair.com/booking/manage-trip" },
  frontier: { name: "Frontier Airlines", phone: "1-801-401-9000", manage: "https://www.flyfrontier.com/manage-trip/" },
  spirit: { name: "Spirit Airlines", phone: "1-855-728-3555", manage: "https://www.spirit.com/my-trips" },
  flying_blue: { name: "Air France / KLM", phone: "1-800-237-2747", manage: "https://www.airfrance.us/FR/en/local/process/standardbookingretrieve/RetrieveBookingAction.do" },
  ba_avios: { name: "British Airways", phone: "1-800-247-9297", manage: "https://www.britishairways.com/travel/managebooking/public/en_us" },
  aeroplan: { name: "Air Canada", phone: "1-888-247-2262", manage: "https://www.aircanada.com/ca/en/aco/home/book/manage-bookings.html" },
  emirates_skywards: { name: "Emirates", phone: "1-800-777-3999", manage: "https://www.emirates.com/us/english/manage-booking/" },
  turkish_miles: { name: "Turkish Airlines", phone: "1-800-874-8875", manage: "https://www.turkishairlines.com/en-int/any-content/manage-booking/" },
  qantas_ff: { name: "Qantas", phone: "1-800-227-4500", manage: "https://www.qantas.com/au/en/manage-booking.html" },
  singapore_kf: { name: "Singapore Airlines", phone: "1-800-742-3333", manage: "https://www.singaporeair.com/en_UK/ppsclub-krisflyer/manage-booking/" },
  cathay_mp: { name: "Cathay Pacific", phone: "1-800-233-2742", manage: "https://www.cathaypacific.com/cx/en_US/manage-trip/manage-booking.html" },
  jl: { name: "Japan Airlines", phone: "1-800-525-3663", manage: "https://www.jal.co.jp/en/inter/reservation/" },
  ana_mc: { name: "ANA (All Nippon Airways)", phone: "1-800-235-9262", manage: "https://www.ana.co.jp/en/us/book-plan/reservation/" },
  korean_skypass: { name: "Korean Air", phone: "1-800-438-5000", manage: "https://www.koreanair.com/us/en/booking/my-trips" },
  as: { name: "Alaska Airlines", phone: "1-800-252-7522", manage: "https://www.alaskaair.com/booking/manage-trip" },
  etihad_guest: { name: "Etihad Airways", phone: "1-877-690-0767", manage: "https://www.etihad.com/en-us/manage/manage-booking" },
  virgin_fc: { name: "Virgin Atlantic", phone: "1-800-862-8621", manage: "https://www.virginatlantic.com/us/en/manageyourbooking.html" },
  ib: { name: "Iberia", phone: "1-800-772-4642", manage: "https://www.iberia.com/us/manage-booking/" },
  ay: { name: "Finnair", phone: "1-877-757-7143", manage: "https://www.finnair.com/en/manage-booking" },
  lh: { name: "Lufthansa", phone: "1-800-645-3880", manage: "https://www.lufthansa.com/us/en/my-bookings" },
  lx: { name: "SWISS", phone: "1-877-359-7947", manage: "https://www.swiss.com/us/en/manage-booking" },
  os: { name: "Austrian Airlines", phone: "1-800-843-0002", manage: "https://www.austrian.com/us/en/manage-booking" },
  tk: { name: "Turkish Airlines", phone: "1-800-874-8875", manage: "https://www.turkishairlines.com/en-int/any-content/manage-booking/" },
  sk: { name: "SAS Scandinavian", phone: "1-800-221-2350", manage: "https://www.flysas.com/en/my-bookings/" },
  qr: { name: "Qatar Airways", phone: "1-877-777-2827", manage: "https://www.qatarairways.com/en/manage-booking.html" },
  ek: { name: "Emirates", phone: "1-800-777-3999", manage: "https://www.emirates.com/us/english/manage-booking/" },
  cx: { name: "Cathay Pacific", phone: "1-800-233-2742", manage: "https://www.cathaypacific.com/cx/en_US/manage-trip/manage-booking.html" },
  sq: { name: "Singapore Airlines", phone: "1-800-742-3333", manage: "https://www.singaporeair.com/en_UK/ppsclub-krisflyer/manage-booking/" },
  nh: { name: "ANA", phone: "1-800-235-9262", manage: "https://www.ana.co.jp/en/us/book-plan/reservation/" },
  mh: { name: "Malaysia Airlines", phone: "1-800-552-9264", manage: "https://www.malaysiaairlines.com/us/en/manage-booking.html" },
  br: { name: "EVA Air", phone: "1-800-695-1188", manage: "https://www.evaair.com/en-global/manage-your-trip/" },
  ci: { name: "China Airlines", phone: "1-800-227-5118", manage: "https://www.china-airlines.com/us/en/booking/manage-booking" },
  tg: { name: "Thai Airways", phone: "1-800-426-5204", manage: "https://www.thaiairways.com/en_US/manage_my_booking.page" },
};
export const HOTEL_CS = {
  marriott: { name: "Marriott Bonvoy", phone: "1-888-236-2427", manage: "https://www.marriott.com/loyalty/findReservation.mi" },
  hilton: { name: "Hilton Honors", phone: "1-800-445-8667", manage: "https://www.hilton.com/en/hilton-honors/guest/my-account/" },
  hyatt: { name: "World of Hyatt", phone: "1-800-233-1234", manage: "https://www.hyatt.com/en-US/member/reservations" },
  ihg: { name: "IHG One Rewards", phone: "1-800-465-4329", manage: "https://www.ihg.com/rewardsclub/us/en/account/manage-reservations" },
  ritz: { name: "The Ritz-Carlton", phone: "1-800-542-8680", manage: "https://www.ritzcarlton.com/en/my-reservation" },
  mandarin: { name: "Mandarin Oriental", phone: "1-866-526-6567", manage: "https://www.mandarinoriental.com/en/reservations" },
  four_seasons: { name: "Four Seasons", phone: "1-800-819-5053", manage: "https://www.fourseasons.com/landing-pages/my-reservations/" },
  peninsula: { name: "The Peninsula", phone: "1-866-382-8388", manage: "https://www.peninsula.com/en/reservations" },
  aman: { name: "Aman Resorts", phone: "+1-754-216-7830", manage: "https://www.aman.com/my-aman" },
  shangri_la: { name: "Shangri-La", phone: "1-866-565-5050", manage: "https://www.shangri-la.com/reservation/" },
  accor: { name: "Accor (Sofitel/Novotel)", phone: "1-800-221-4542", manage: "https://all.accor.com/loyalty-program/index.en.shtml" },
  radisson: { name: "Radisson Hotels", phone: "1-800-333-3333", manage: "https://www.radissonhotels.com/en-us/my-reservations" },
  wyndham: { name: "Wyndham Rewards", phone: "1-800-466-1589", manage: "https://www.wyndhamhotels.com/wyndham-rewards/my-account" },
};
export const OTA_CS = {
  expedia: { name: "Expedia", phone: "1-866-310-5768", manage: "https://www.expedia.com/trips" },
  booking: { name: "Booking.com", phone: "1-888-850-3958", manage: "https://secure.booking.com/mysettings.html" },
  kayak: { name: "Kayak", phone: "1-855-529-2501", manage: "https://www.kayak.com/trips" },
  google_flights: { name: "Google Flights", phone: null, manage: null },
  hopper: { name: "Hopper", phone: "1-833-933-4674", manage: null },
  priceline: { name: "Priceline", phone: "1-877-477-5807", manage: "https://www.priceline.com/account/trips" },
  orbitz: { name: "Orbitz", phone: "1-844-674-4891", manage: "https://www.orbitz.com/trips" },
  travelocity: { name: "Travelocity", phone: "1-888-709-5983", manage: "https://www.travelocity.com/trips" },
  cheapoair: { name: "CheapOair", phone: "1-800-566-2345", manage: "https://www.cheapoair.com/myaccount/mytrips" },
  tripcom: { name: "Trip.com", phone: "1-833-896-0077", manage: "https://www.trip.com/account/manage" },
};
// Common aircraft types for display
export const AIRCRAFT_TYPES = {
  "738": "Boeing 737-800", "73H": "Boeing 737-800", "739": "Boeing 737-900",
  "7M8": "Boeing 737 MAX 8", "7M9": "Boeing 737 MAX 9",
  "319": "Airbus A319", "320": "Airbus A320", "321": "Airbus A321", "32Q": "Airbus A321neo",
  "332": "Airbus A330-200", "333": "Airbus A330-300", "339": "Airbus A330-900neo",
  "359": "Airbus A350-900", "35K": "Airbus A350-1000",
  "772": "Boeing 777-200", "77W": "Boeing 777-300ER", "789": "Boeing 787-9", "788": "Boeing 787-8",
  "E75": "Embraer E175", "E90": "Embraer E190", "CR9": "Bombardier CRJ-900", "CRJ": "Bombardier CRJ",
};

export const CC_SPENDING_CATS = [
  { id: "dining",    label: "Dining",         icon: "🍽️" },
  { id: "flights",   label: "Flights",        icon: "—" },
  { id: "hotels",    label: "Hotels",         icon: "—" },
  { id: "groceries", label: "Groceries",      icon: "🛒" },
  { id: "gas",       label: "Gas / Transit",  icon: "⛽" },
  { id: "streaming", label: "Streaming",      icon: "📺" },
  { id: "rent",      label: "Rent",           icon: "🏠" },
  { id: "other",     label: "Everything Else", icon: "💳" },
];
// Transfer partner mapping: card currency → airline/hotel programs (1:1 unless noted)
export const CC_TRANSFER_PARTNERS = {
  amex_plat:        { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  amex_gold:        { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  amex_green:       { currency: "Membership Rewards", partners: ["dl","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","cathay_mp","virgin_fc","marriott","hilton"] },
  chase_sapphire:   { currency: "Ultimate Rewards", partners: ["ua","sw","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","virgin_fc","marriott","hyatt","ihg"] },
  chase_sapphire_pref: { currency: "Ultimate Rewards", partners: ["ua","sw","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","virgin_fc","marriott","hyatt","ihg"] },
  cap1_venturex:    { currency: "Capital One Miles", partners: ["aa","dl","ua","b6","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  cap1_venture:     { currency: "Capital One Miles", partners: ["aa","dl","ua","b6","ba_avios","flying_blue","aeroplan","singapore_kf","emirates_skywards","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  citi_premier:     { currency: "ThankYou Points", partners: ["aa","b6","flying_blue","singapore_kf","turkish_miles","qantas_ff","cathay_mp","virgin_fc"] },
  bilt:             { currency: "Bilt Points", partners: ["aa","ua","ba_avios","flying_blue","aeroplan","turkish_miles","cathay_mp","virgin_fc","marriott","hyatt","ihg"] },
  // Co-brand cards earn directly into the program, no transfer
  delta_reserve:    { currency: "SkyMiles", directProgram: "dl" },
  delta_gold:       { currency: "SkyMiles", directProgram: "dl" },
  united_club:      { currency: "MileagePlus Miles", directProgram: "ua" },
  united_explorer:  { currency: "MileagePlus Miles", directProgram: "ua" },
  aa_exec:          { currency: "AAdvantage Miles", directProgram: "aa" },
  marriott_boundless: { currency: "Bonvoy Points", directProgram: "marriott" },
  hilton_aspire:    { currency: "Hilton Points", directProgram: "hilton" },
  hilton_surpass:   { currency: "Hilton Points", directProgram: "hilton" },
  hyatt_card:       { currency: "Hyatt Points", directProgram: "hyatt" },
  ihg_premier:      { currency: "IHG Points", directProgram: "ihg" },
  sw_priority:      { currency: "Rapid Rewards Points", directProgram: "sw" },
  atmos_summit:     { currency: "Atmos Points", directProgram: "atmos" },
};
// Expanded bonus categories — values are either a number (same direct & portal)
// or { d: directRate, p: portalRate } when portal booking earns a higher multiplier.
// Rates per each issuer's official benefits page as of early 2025.
export const CC_BONUS_EXPANDED = {
  // Amex Platinum: 5x on flights booked directly with airlines OR via amextravel.com (no portal uplift for flights).
  // Hotels: 1x direct, 5x prepaid via Amex Travel portal.
  amex_plat:        { dining: 1, flights: 5, hotels: { d: 1, p: 5 }, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Amex Gold: 3x on flights booked directly with airlines OR via amextravel.com (same either way).
  amex_gold:        { dining: 4, flights: 3, hotels: 1, groceries: 4, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Amex Green: 3x on travel & transit (flights, hotels, Uber, etc.) regardless of booking method.
  amex_green:       { dining: 3, flights: 3, hotels: 3, groceries: 1, gas: 3, streaming: 1, rent: 0, other: 1 },
  // Chase Sapphire Reserve: 3x direct travel & dining. Via Chase Travel portal: 8x flights, 10x hotels & cars.
  chase_sapphire:   { dining: 3, flights: { d: 3, p: 8 }, hotels: { d: 3, p: 10 }, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Chase Sapphire Preferred: 2x direct travel. Via Chase Travel: 5x flights & hotels.
  chase_sapphire_pref: { dining: 3, flights: { d: 2, p: 5 }, hotels: { d: 2, p: 5 }, groceries: 1, gas: 1, streaming: 3, rent: 0, other: 1 },
  // Capital One Venture X: 2x base. Via Capital One Travel portal: 5x flights, 10x hotels & car rentals.
  cap1_venturex:    { dining: 2, flights: { d: 2, p: 5 }, hotels: { d: 2, p: 10 }, groceries: 2, gas: 2, streaming: 2, rent: 2, other: 2 },
  // Capital One Venture (regular): 2x base everywhere. Via Capital One Travel: 5x hotels & cars only — flights stay 2x.
  cap1_venture:     { dining: 2, flights: 2, hotels: { d: 2, p: 5 }, groceries: 2, gas: 2, streaming: 2, rent: 2, other: 2 },
  // Citi Premier: flat 3x on flights, hotels, dining, groceries, gas. No issuer travel portal bonus.
  citi_premier:     { dining: 3, flights: 3, hotels: 3, groceries: 3, gas: 3, streaming: 1, rent: 0, other: 1 },
  // Bilt: 3x dining, 2x travel (flights & hotels), 1x rent & other. On Rent Day first of month: 6x/4x/2x.
  bilt:             { dining: 3, flights: 2, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 1, other: 1 },
  // Delta Reserve Amex: 3x Delta purchases, 2x dining & U.S. supermarkets, 1x other. No hotel portal bonus.
  delta_reserve:    { dining: 2, flights: 3, hotels: 1, groceries: 2, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Delta Gold Amex: 2x Delta & restaurants & U.S. supermarkets, 1x other.
  delta_gold:       { dining: 2, flights: 2, hotels: 1, groceries: 2, gas: 1, streaming: 1, rent: 0, other: 1 },
  // United Club Infinite: 4x United, 2x all other travel & dining, 1x other.
  united_club:      { dining: 2, flights: 4, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // United Explorer: 2x United, hotels & dining, 1x other.
  united_explorer:  { dining: 2, flights: 2, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Citi AAdvantage Executive: 10x AA (includes base miles), 4x hotel & car, 1x other.
  aa_exec:          { dining: 1, flights: 4, hotels: 4, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Marriott Boundless: 6x Marriott hotels, 3x dining & gas, 2x everything else.
  marriott_boundless: { dining: 3, flights: 2, hotels: 6, groceries: 1, gas: 3, streaming: 1, rent: 0, other: 2 },
  // Hilton Aspire: 14x Hilton, 7x flights, dining & car rentals, 3x everything else.
  hilton_aspire:    { dining: 7, flights: 7, hotels: 14, groceries: 3, gas: 3, streaming: 3, rent: 0, other: 3 },
  // Hilton Surpass: 12x Hilton, 6x U.S. restaurants, groceries & gas, 3x everything else.
  hilton_surpass:   { dining: 6, flights: 3, hotels: 12, groceries: 6, gas: 6, streaming: 3, rent: 0, other: 3 },
  // World of Hyatt Card: 4x Hyatt, 2x dining, airline tickets & local transit, 1x other.
  hyatt_card:       { dining: 2, flights: 2, hotels: 4, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // IHG Premier: 10x at IHG hotels (direct co-brand rate, no separate portal uplift), 2x dining & travel, 1x other.
  ihg_premier:      { dining: 2, flights: 2, hotels: 10, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Southwest Priority: 3x Southwest flights, 2x hotel & car rental partners & dining, 1x other.
  sw_priority:      { dining: 2, flights: 3, hotels: 2, groceries: 1, gas: 1, streaming: 1, rent: 0, other: 1 },
  // Alaska/Atmos Summit Visa Infinite: 3x Alaska & Hawaiian flights, 2x dining & gas, 1x other.
  atmos_summit:     { dining: 2, flights: 3, hotels: 1, groceries: 1, gas: 2, streaming: 1, rent: 0, other: 1 },
};

export const LANDMARK_FALLBACK_PHOTOS = {
  "Statue of Liberty": "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=400&q=80&auto=format&fit=crop",
  "Central Park": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80&auto=format&fit=crop",
  "Times Square": "https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=400&q=80&auto=format&fit=crop",
  "Brooklyn Bridge": "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&q=80&auto=format&fit=crop",
  "Empire State Building": "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=400&q=80&auto=format&fit=crop",
  "Shibuya Crossing": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80&auto=format&fit=crop",
  "Senso-ji Temple": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80&auto=format&fit=crop",
  "Tokyo Tower": "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&q=80&auto=format&fit=crop",
  "Osaka Castle": "https://images.unsplash.com/photo-1589452271712-64b8a66c3929?w=400&q=80&auto=format&fit=crop",
  "Dotonbori": "https://images.unsplash.com/photo-1514222788835-3a1a1d76b903?w=400&q=80&auto=format&fit=crop",
  "Victoria Peak": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&q=80&auto=format&fit=crop",
  "Star Ferry": "https://images.unsplash.com/photo-1594973782943-3314fe063f68?w=400&q=80&auto=format&fit=crop",
  "Taipei 101": "https://images.unsplash.com/photo-1508248467877-aec1e22e0e68?w=400&q=80&auto=format&fit=crop",
  "Eiffel Tower": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80&auto=format&fit=crop",
  "Colosseum": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80&auto=format&fit=crop",
  "Big Ben": "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=80&auto=format&fit=crop",
  "Sagrada Familia": "https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?w=400&q=80&auto=format&fit=crop",
  "Golden Gate Bridge": "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=400&q=80&auto=format&fit=crop",
  "Burj Khalifa": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80&auto=format&fit=crop",
  "Opera House": "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=80&auto=format&fit=crop",
  "Hagia Sophia": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80&auto=format&fit=crop",
  "Marina Bay Sands": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80&auto=format&fit=crop",
  "Horseshoe Bay": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80&auto=format&fit=crop",
  "Waikiki Beach": "https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=400&q=80&auto=format&fit=crop",
  "South Beach": "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=400&q=80&auto=format&fit=crop",
  "Meiji Shrine": "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&q=80&auto=format&fit=crop",
  "Tsukiji Market": "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&q=80&auto=format&fit=crop",
  "Universal Studios": "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&q=80&auto=format&fit=crop",
  "Shinsekai": "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400&q=80&auto=format&fit=crop",
  "Namba": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80&auto=format&fit=crop",
  "Temple Street": "https://images.unsplash.com/photo-1517144447511-aebb25bbc5fa?w=400&q=80&auto=format&fit=crop",
  "Tian Tan Buddha": "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&q=80&auto=format&fit=crop",
  "Mong Kok": "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400&q=80&auto=format&fit=crop",
  "Jiufen Old Street": "https://images.unsplash.com/photo-1558545838-83d3e4ae0f84?w=400&q=80&auto=format&fit=crop",
  "Tower Bridge": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80&auto=format&fit=crop",
  "Buckingham Palace": "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&q=80&auto=format&fit=crop",
  "British Museum": "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&q=80&auto=format&fit=crop",
  "Hyde Park": "https://images.unsplash.com/photo-1592486058517-36236ba247c8?w=400&q=80&auto=format&fit=crop",
  "Louvre Museum": "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=400&q=80&auto=format&fit=crop",
  "Arc de Triomphe": "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&auto=format&fit=crop",
  "Notre-Dame": "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=400&q=80&auto=format&fit=crop",
  "Montmartre": "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400&q=80&auto=format&fit=crop",
  "Vatican City": "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80&auto=format&fit=crop",
  "Trevi Fountain": "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400&q=80&auto=format&fit=crop",
  "Pantheon": "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400&q=80&auto=format&fit=crop",
  "Spanish Steps": "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&q=80&auto=format&fit=crop",
  "Park Guell": "https://images.unsplash.com/photo-1583259080593-88c2d58d1a0c?w=400&q=80&auto=format&fit=crop",
  "La Rambla": "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=400&q=80&auto=format&fit=crop",
  "Casa Batllo": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80&auto=format&fit=crop",
  "Gothic Quarter": "https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=400&q=80&auto=format&fit=crop",
  "Anne Frank House": "https://images.unsplash.com/photo-1584003564911-a5dfc8f4f3f7?w=400&q=80&auto=format&fit=crop",
  "Rijksmuseum": "https://images.unsplash.com/photo-1584285415853-058f55ccb67b?w=400&q=80&auto=format&fit=crop",
  "Canal Cruise": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=400&q=80&auto=format&fit=crop",
  "Vondelpark": "https://images.unsplash.com/photo-1600704528862-d8e3f4c0b470?w=400&q=80&auto=format&fit=crop",
  "Dam Square": "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=400&q=80&auto=format&fit=crop",
  "Blue Mosque": "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&q=80&auto=format&fit=crop",
  "Grand Bazaar": "https://images.unsplash.com/photo-1585959672547-c47f33df9e12?w=400&q=80&auto=format&fit=crop",
  "Topkapi Palace": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80&auto=format&fit=crop",
  "Bosphorus Cruise": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80&auto=format&fit=crop",
  "Grand Palace": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80&auto=format&fit=crop",
  "Wat Pho": "https://images.unsplash.com/photo-1552550018-7e9c5306d7cf?w=400&q=80&auto=format&fit=crop",
  "Chatuchak Market": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80&auto=format&fit=crop",
  "Khao San Road": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80&auto=format&fit=crop",
  "Harbour Bridge": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80&auto=format&fit=crop",
  "Bondi Beach": "https://images.unsplash.com/photo-1548625361-1adcab316530?w=400&q=80&auto=format&fit=crop",
  "Gardens by the Bay": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80&auto=format&fit=crop",
  "Sentosa Island": "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400&q=80&auto=format&fit=crop",
  "Chinatown": "https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=400&q=80&auto=format&fit=crop",
  "Orchard Road": "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&q=80&auto=format&fit=crop",
  "Palm Jumeirah": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80&auto=format&fit=crop",
  "Dubai Mall": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8ce?w=400&q=80&auto=format&fit=crop",
  "Dubai Marina": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&q=80&auto=format&fit=crop",
  "Gyeongbokgung Palace": "https://images.unsplash.com/photo-1538485399081-7c8ed7e5d3ef?w=400&q=80&auto=format&fit=crop",
  "Myeongdong": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80&auto=format&fit=crop",
  "N Seoul Tower": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80&auto=format&fit=crop",
  "Hongdae": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80&auto=format&fit=crop",
};

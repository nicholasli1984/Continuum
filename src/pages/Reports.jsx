import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const AIRPORT_COUNTRY = {
  ATL:"US",BOS:"US",CLT:"US",DEN:"US",DFW:"US",DTW:"US",EWR:"US",FLL:"US",HNL:"US",IAD:"US",IAH:"US",
  JFK:"US",LAX:"US",LGA:"US",MCO:"US",MIA:"US",MSP:"US",ORD:"US",PDX:"US",PHL:"US",PHX:"US",SAN:"US",
  SEA:"US",SFO:"US",SJC:"US",SLC:"US",TPA:"US",LAS:"US",DCA:"US",MSY:"US",BNA:"US",AUS:"US",STL:"US",
  PIT:"US",MKE:"US",CLE:"US",IND:"US",CMH:"US",OAK:"US",SMF:"US",JAX:"US",RSW:"US",RDU:"US",MDW:"US",
  YUL:"CA",YVR:"CA",YYZ:"CA",YYC:"CA",YOW:"CA",YHZ:"CA",
  BDA:"BM",NAS:"BS",MBJ:"JM",KIN:"JM",SJU:"PR",STT:"VI",SXM:"SX",ANU:"AG",GCM:"KY",BGI:"BB",POS:"TT",
  MEX:"MX",CUN:"MX",GRU:"BR",GIG:"BR",BOG:"CO",LIM:"PE",SCL:"CL",EZE:"AR",PTY:"PA",
  AMS:"NL",ARN:"SE",ATH:"GR",BCN:"ES",BER:"DE",BRU:"BE",CDG:"FR",CPH:"DK",DUB:"IE",EDI:"GB",FCO:"IT",
  FRA:"DE",GVA:"CH",HEL:"FI",IST:"TR",LHR:"GB",LIS:"PT",MAD:"ES",MAN:"GB",MUC:"DE",NCE:"FR",OSL:"NO",
  PRG:"CZ",VIE:"AT",WAW:"PL",BUD:"HU",ZRH:"CH",
  BKK:"TH",CGK:"ID",DEL:"IN",DPS:"ID",HKG:"HK",ICN:"KR",KIX:"JP",KUL:"MY",MNL:"PH",NRT:"JP",HND:"JP",
  OKA:"JP",PEK:"CN",PVG:"CN",CAN:"CN",SGN:"VN",SIN:"SG",TPE:"TW",BOM:"IN",CMB:"LK",MLE:"MV",
  HAN:"VN",RGN:"MM",BKI:"MY",PNH:"KH",
  AUH:"AE",CAI:"EG",DOH:"QA",DXB:"AE",ADD:"ET",
  JNB:"ZA",NBO:"KE",CPT:"ZA",
  AKL:"NZ",BNE:"AU",MEL:"AU",SYD:"AU",PER:"AU",
};
const COUNTRY_NAMES = {
  US:"United States",CA:"Canada",BM:"Bermuda",BS:"Bahamas",JM:"Jamaica",PR:"Puerto Rico",
  MX:"Mexico",BR:"Brazil",CO:"Colombia",PE:"Peru",CL:"Chile",AR:"Argentina",PA:"Panama",
  NL:"Netherlands",SE:"Sweden",GR:"Greece",ES:"Spain",DE:"Germany",BE:"Belgium",FR:"France",DK:"Denmark",
  IE:"Ireland",GB:"United Kingdom",IT:"Italy",CH:"Switzerland",FI:"Finland",TR:"Turkey",PT:"Portugal",
  NO:"Norway",CZ:"Czech Republic",AT:"Austria",PL:"Poland",HU:"Hungary",
  TH:"Thailand",ID:"Indonesia",IN:"India",HK:"Hong Kong",KR:"South Korea",JP:"Japan",MY:"Malaysia",
  PH:"Philippines",CN:"China",VN:"Vietnam",SG:"Singapore",TW:"Taiwan",LK:"Sri Lanka",MV:"Maldives",
  AE:"UAE",EG:"Egypt",QA:"Qatar",ET:"Ethiopia",ZA:"South Africa",KE:"Kenya",
  NZ:"New Zealand",AU:"Australia",
};
const CITY_PHOTOS = {
  "New York":"https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=70&fit=crop",
  "Tokyo":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=70&fit=crop",
  "London":"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=70&fit=crop",
  "Paris":"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70&fit=crop",
  "Hong Kong":"https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=600&q=70&fit=crop",
  "Singapore":"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=70&fit=crop",
  "Sydney":"https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=70&fit=crop",
  "Dubai":"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=70&fit=crop",
  "Seoul":"https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=70&fit=crop",
  "Bangkok":"https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=70&fit=crop",
  "Bermuda":"https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=70&fit=crop",
  "Hamilton":"https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=70&fit=crop",
  "Toronto":"https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=600&q=70&fit=crop",
  "Osaka":"https://images.unsplash.com/photo-1590253230532-a67f6bc61b1e?w=600&q=70&fit=crop",
  "Taipei":"https://images.unsplash.com/photo-1552529899-8c1ebff7ea46?w=600&q=70&fit=crop",
  "Rome":"https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=70&fit=crop",
  "Amsterdam":"https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=70&fit=crop",
  "Miami":"https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&q=70&fit=crop",
  "San Francisco":"https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=70&fit=crop",
  "Los Angeles":"https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&q=70&fit=crop",
  "Chicago":"https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=600&q=70&fit=crop",
  "Honolulu":"https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=600&q=70&fit=crop",
  "Las Vegas":"https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&q=70&fit=crop",
  "Cancun":"https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&q=70&fit=crop",
  "Bali":"https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=70&fit=crop",
  "Istanbul":"https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=70&fit=crop",
  "Barcelona":"https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=70&fit=crop",
  "Prague":"https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=70&fit=crop",
  "Budapest":"https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=600&q=70&fit=crop",
  "Lisbon":"https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=600&q=70&fit=crop",
  "Athens":"https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=70&fit=crop",
  "Denver":"https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&q=70&fit=crop",
  "Seattle":"https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=600&q=70&fit=crop",
  "Boston":"https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=600&q=70&fit=crop",
  "Washington DC":"https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&q=70&fit=crop",
  "Orlando":"https://images.unsplash.com/photo-1575089776834-8be34f6ab124?w=600&q=70&fit=crop",
  "Nashville":"https://images.unsplash.com/photo-1545419913-775e3e5a2896?w=600&q=70&fit=crop",
  "Doha":"https://images.unsplash.com/photo-1548000935-7bd8d3e75c79?w=600&q=70&fit=crop",
  "Vancouver":"https://images.unsplash.com/photo-1559511260-66a68e4b0b97?w=600&q=70&fit=crop",
  "Takayama":"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=70&fit=crop",
  "Hakone":"https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=600&q=70&fit=crop",
  "Nagoya":"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=70&fit=crop",
  "Jersey City":"https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=70&fit=crop",
  "New York City":"https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=70&fit=crop",
  "Hamilton":"https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=70&fit=crop",
  "Fort Lauderdale":"https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&q=70&fit=crop",
  "Montreal":"https://images.unsplash.com/photo-1519178614-68673b201f36?w=600&q=70&fit=crop",
  "Quebec City":"https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=70&fit=crop",
};

// Find best photo for a city name (fuzzy match)
const findCityPhoto = (name) => {
  if (!name) return null;
  if (CITY_PHOTOS[name]) return CITY_PHOTOS[name];
  // Try partial match
  const lower = name.toLowerCase();
  for (const [city, url] of Object.entries(CITY_PHOTOS)) {
    if (lower.includes(city.toLowerCase()) || city.toLowerCase().includes(lower)) return url;
  }
  return null;
};

// Known city coordinates for non-airport cities
const CITY_COORDS = {
  "Las Vegas": [-115.17, 36.17], "Nashville": [-86.78, 36.16], "Austin": [-97.74, 30.27],
  "New Orleans": [-90.07, 29.95], "St Louis": [-90.20, 38.63], "Columbus": [-82.99, 39.96],
  "Takayama": [137.25, 36.14], "Hakone": [139.02, 35.23], "Nagoya": [136.91, 35.18],
  "Jersey City": [-74.08, 40.72], "Taipei": [121.57, 25.03], "Bermuda": [-64.78, 32.30],
  "Hamilton": [-64.79, 32.29], "Fontainbleau Las Vegas": [-115.17, 36.17],
  "New York City": [-74.01, 40.71], "Osaka": [135.50, 34.69],
  "Vancouver": [-123.12, 49.28], "Montreal": [-73.57, 45.50],
  "Fort Lauderdale": [-80.14, 26.12], "Quebec City": [-71.21, 46.81],
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const LAND_URL = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json";

// D3 wireframe dotted globe with city labels
function DottedGlobe({ markers, isMobile }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [labelData, setLabelData] = useState([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    const cw = container.offsetWidth;
    const ch = Math.min(cw * 0.75, 520);
    const radius = Math.min(cw, ch) / 2.5;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.scale(dpr, dpr);

    const projection = d3.geoOrthographic()
      .scale(radius)
      .translate([cw / 2, ch / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(ctx);

    // Generate dots on land
    const pointInPolygon = (pt, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    const pointInFeature = (pt, feat) => {
      const g = feat.geometry;
      if (g.type === "Polygon") { return pointInPolygon(pt, g.coordinates[0]) && !g.coordinates.slice(1).some(h => pointInPolygon(pt, h)); }
      if (g.type === "MultiPolygon") { return g.coordinates.some(poly => pointInPolygon(pt, poly[0]) && !poly.slice(1).some(h => pointInPolygon(pt, h))); }
      return false;
    };

    let allDots = [];
    let landFeatures = null;
    const rotation = [0, -15];
    let autoRotate = true;
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);
      const sc = projection.scale() / radius;

      // Ocean
      ctx.beginPath();
      ctx.arc(cw / 2, ch / 2, projection.scale(), 0, 2 * Math.PI);
      ctx.fillStyle = "#0a0a0f";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5 * sc;
      ctx.stroke();

      if (landFeatures) {
        // Graticule
        ctx.beginPath();
        path(d3.geoGraticule()());
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 0.5 * sc;
        ctx.stroke();

        // Land outlines
        ctx.beginPath();
        landFeatures.features.forEach(f => path(f));
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 0.8 * sc;
        ctx.stroke();

        // Land dots
        allDots.forEach(d => {
          const p = projection([d[0], d[1]]);
          if (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 1 * sc, 0, 2 * Math.PI); ctx.fillStyle = "rgba(180,170,156,0.5)"; ctx.fill(); }
        });

        // City markers + labels
        const labels = [];
        markers.forEach(m => {
          const coords = [m.location[1], m.location[0]]; // [lon, lat]
          const p = projection(coords);
          const dist = d3.geoDistance(coords, projection.invert([cw / 2, ch / 2]));
          if (!p || dist > Math.PI / 2) return; // behind globe

          // Pulse ring
          ctx.beginPath();
          ctx.arc(p[0], p[1], 6 * sc, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(212,116,45,0.3)";
          ctx.lineWidth = 1 * sc;
          ctx.stroke();

          // Dot
          ctx.beginPath();
          ctx.arc(p[0], p[1], 2.5 * sc, 0, 2 * Math.PI);
          ctx.fillStyle = "#D4742D";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 0.6 * sc;
          ctx.stroke();

          // Connector line
          ctx.beginPath();
          ctx.moveTo(p[0], p[1] - 3 * sc);
          ctx.lineTo(p[0], p[1] - 14 * sc);
          ctx.strokeStyle = "rgba(212,116,45,0.4)";
          ctx.lineWidth = 0.6 * sc;
          ctx.stroke();

          // Label background
          const text = m.caption + (m.count > 1 ? " " + m.count + "x" : "");
          ctx.font = (7 * sc) + "px 'Inter Tight', sans-serif";
          const tw = ctx.measureText(text).width;
          const lx = p[0] - tw / 2 - 6 * sc;
          const ly = p[1] - 28 * sc;
          ctx.fillStyle = "rgba(21,19,15,0.8)";
          ctx.fillRect(lx, ly, tw + 12 * sc, 14 * sc);
          ctx.strokeStyle = "rgba(184,174,156,0.25)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(lx, ly, tw + 12 * sc, 14 * sc);

          // Label text
          ctx.fillStyle = "#F4F1EC";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(m.caption, p[0] - (m.count > 1 ? 8 * sc : 0), ly + 7 * sc);
          if (m.count > 1) {
            ctx.fillStyle = "#B8AE9C";
            ctx.font = (6 * sc) + "px 'JetBrains Mono', monospace";
            ctx.fillText(m.count + "x", p[0] + tw / 2 - 4 * sc, ly + 7 * sc);
          }
          ctx.textAlign = "start";
        });
      }
    };

    // Load land data
    fetch(LAND_URL).then(r => r.json()).then(data => {
      landFeatures = data;
      const step = 1.3;
      data.features.forEach(feat => {
        const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feat);
        for (let lng = minLng; lng <= maxLng; lng += step) {
          for (let lat = minLat; lat <= maxLat; lat += step) {
            if (pointInFeature([lng, lat], feat)) allDots.push([lng, lat]);
          }
        }
      });
      render();
    }).catch(() => {});

    // Animation
    const animate = () => {
      if (autoRotate) {
        rotation[0] += 0.3;
        projection.rotate(rotation);
        render();
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    // Drag interaction
    let dragStart = null, dragRot = null;
    const onDown = (e) => {
      autoRotate = false;
      const pt = e.touches ? e.touches[0] : e;
      dragStart = [pt.clientX, pt.clientY];
      dragRot = [...rotation];
    };
    const onMove = (e) => {
      if (!dragStart) return;
      const pt = e.touches ? e.touches[0] : e;
      rotation[0] = dragRot[0] + (pt.clientX - dragStart[0]) * 0.4;
      rotation[1] = Math.max(-60, Math.min(60, dragRot[1] - (pt.clientY - dragStart[1]) * 0.4));
      projection.rotate(rotation);
      render();
    };
    const onUp = () => { dragStart = null; setTimeout(() => { autoRotate = true; }, 50); };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    // Scroll zoom
    const onWheel = (e) => {
      e.preventDefault();
      const s = e.deltaY > 0 ? 0.92 : 1.08;
      projection.scale(Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * s)));
      render();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [markers, isMobile]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block", cursor: "grab", borderRadius: 4 }} />
      <div style={{ position: "absolute", bottom: 10, left: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(184,174,156,0.5)", letterSpacing: "0.08em", background: "rgba(10,10,15,0.6)", padding: "3px 8px", borderRadius: 3 }}>
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

export function renderReports(s) {
  return <ReportsPage {...s} />;
}

function ReportsPage(s) {
  const { css, isMobile, darkMode, user, trips, expenses, linkedAccounts, allPrograms,
    EXPENSE_CATEGORIES, AIRPORT_COORDS, AIRPORT_CITY,
    getTripExpenses, getTripTotal, getTripName, formatTripDates,
    haversineDistance, parseRoute, greatCircleMiles,
    getProjectedStatus, ProgramLogo,
    ComposableMap, Geographies, Geography, Marker, Line, landmarkPhotos } = s;
  const D = darkMode;

  // Voyager palette
  const dv = { bone: D?"#1a1a1a":"#F4F1EC", paper: D?"#222":"#EBE6DD", cream: D?"rgba(255,255,255,0.06)":"#E2DCCE", stone: D?"#666":"#B8AE9C", taupe: D?"#999":"#6B6458", graphite: D?"#111":"#2C2A26", ink: D?"#f0ece6":"#15130F", accentSoft: D?"#E4A88F":"#E4A88F", moss: "#6B7A5A", gold: "#B8924A", sky: "#8BA3B8", serif: "'Fraunces','Instrument Serif',Georgia,serif", sans: "'Inter Tight','Instrument Sans',sans-serif", mono: "'JetBrains Mono','Geist Mono',monospace" };

  // Extract data from trips — cities come from trip.location and segment locations only (not flight route codes)
  const visitedCities = {}; const flightPaths = []; const airlineMap = {}; const hotelMap = {}; const monthlyData = MONTHS.map(() => ({ biz: 0, lei: 0 }));
  const recentTrips = [];

  // All known cities we can place on a map
  const ALL_KNOWN_CITIES = {};
  for (const [ac, cn] of Object.entries(AIRPORT_CITY)) {
    if (AIRPORT_COORDS[ac] && !ALL_KNOWN_CITIES[cn.toLowerCase()]) {
      ALL_KNOWN_CITIES[cn.toLowerCase()] = { name: cn, coords: AIRPORT_COORDS[ac], code: ac, cc: AIRPORT_COUNTRY[ac] || "" };
    }
  }
  for (const [cn, coords] of Object.entries(CITY_COORDS)) {
    if (!ALL_KNOWN_CITIES[cn.toLowerCase()]) {
      ALL_KNOWN_CITIES[cn.toLowerCase()] = { name: cn, coords, code: "", cc: "" };
    }
  }
  // Add extra known cities with coords
  for (const [cn, coords] of Object.entries(CITY_COORDS)) {
    if (!ALL_KNOWN_CITIES[cn.toLowerCase()]) ALL_KNOWN_CITIES[cn.toLowerCase()] = { name: cn, coords, code: "", cc: "" };
  }

  const addCity = (rawInput, date) => {
    if (!rawInput) return;
    const input = rawInput.trim();

    // Strategy: scan the input string for any known city name (longest match first)
    const knownNames = Object.keys(ALL_KNOWN_CITIES).sort((a, b) => b.length - a.length);
    const inputLower = input.toLowerCase();
    let matched = false;

    for (const key of knownNames) {
      if (key.length < 3) continue;
      if (inputLower.includes(key)) {
        const city = ALL_KNOWN_CITIES[key];
        if (!visitedCities[city.name]) {
          visitedCities[city.name] = { count: 0, code: city.code, coords: city.coords, cc: city.cc, lastDate: "" };
        }
        visitedCities[city.name].count++;
        if (date && date > (visitedCities[city.name].lastDate || "")) visitedCities[city.name].lastDate = date;
        matched = true;
        break; // take the longest/first match
      }
    }

    // Fallback: if no known city found, try first comma segment as city name
    if (!matched) {
      const clean = input.split(",")[0].trim();
      if (clean && clean.length > 2 && clean.length < 40 && !/^\d/.test(clean)) {
        if (!visitedCities[clean]) {
          // Try to find coords
          let coords = null, code = "", cc = "";
          for (const [ac, cn] of Object.entries(AIRPORT_CITY)) {
            if (cn.toLowerCase() === clean.toLowerCase() && AIRPORT_COORDS[ac]) { coords = AIRPORT_COORDS[ac]; code = ac; cc = AIRPORT_COUNTRY[ac] || ""; break; }
          }
          visitedCities[clean] = { count: 0, code, coords, cc, lastDate: "" };
        }
        visitedCities[clean].count++;
        if (date && date > (visitedCities[clean].lastDate || "")) visitedCities[clean].lastDate = date;
      }
    }
  };

  trips.forEach(t => {
    const segs = (t.segments || []).filter(s => !s._isMeta);
    const isBiz = /business/i.test(t.tripName || "");
    const tripDate = t.date || segs.map(s => s.date).filter(Boolean).sort()[0] || "";
    const monthIdx = tripDate ? new Date(tripDate + "T12:00:00").getMonth() : -1;

    // Add cities from trip.location — handle multi-city (comma separated)
    if (t.location) {
      // Split by comma but try each part as a potential city
      t.location.split(",").forEach(part => addCity(part.trim(), tripDate));
      // Also scan the full string for known cities
      addCity(t.location, tripDate);
    }
    // Also scan trip name for city names
    const tName = t.tripName || t.trip_name || "";
    if (tName) addCity(tName, tripDate);

    segs.forEach(seg => {
      // Flights — track airlines, distances, AND destination cities
      if (seg.type === "flight" && seg.route) {
        const codes = parseRoute(seg.route);
        const airline = seg.airline || seg.flightNumber?.replace(/[0-9]/g, "").trim() || "";
        if (airline) airlineMap[airline] = (airlineMap[airline] || 0) + 1;
        if (codes.length >= 2) {
          const from = AIRPORT_COORDS[codes[0]], to = AIRPORT_COORDS[codes[codes.length-1]];
          if (from && to) flightPaths.push({ from, to, dist: haversineDistance(from, to) });
          // Add destination city (last airport in route)
          const destCode = codes[codes.length - 1];
          const destCity = AIRPORT_CITY[destCode];
          if (destCity) addCity(destCity, seg.date);
          // Add origin city too
          const origCity = AIRPORT_CITY[codes[0]];
          if (origCity) addCity(origCity, seg.date);
        }
      }
      // Hotels — track property and city from location
      if ((seg.type === "hotel" || seg.type === "accommodation") && seg.property) {
        hotelMap[seg.property] = (hotelMap[seg.property] || 0) + (seg.nights || 1);
        if (seg.location) addCity(seg.location, seg.date);
      }
      // Activities, restaurants, lounges — city from location
      if (seg.location && ["activity","restaurant","lounge","transfer","rental"].includes(seg.type)) {
        addCity(seg.location, seg.date);
      }
    });

    if (monthIdx >= 0) { if (isBiz) monthlyData[monthIdx].biz++; else monthlyData[monthIdx].lei++; }
    const tripName = t.tripName || t.trip_name || t.location || "Trip";
    const nightsEst = segs.filter(s => s.type === "hotel").reduce((s, h) => s + (h.nights || 1), 0);
    if (segs.length > 0 || t.location) {
      recentTrips.push({ name: tripName, date: formatTripDates(t), loc: t.location || "", nights: nightsEst, segs: segs.length, isBiz });
    }
  });

  const cityList = Object.entries(visitedCities).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.count - a.count);
  const totalMiles = Math.round(flightPaths.reduce((s, p) => s + p.dist, 0));
  const totalNights = Object.values(hotelMap).reduce((s, n) => s + n, 0);
  const uniqueCountries = new Set(cityList.map(c => c.cc).filter(Boolean)).size;
  const globeMarkers = cityList.filter(c => c.coords).slice(0, 20).map((c, i) => ({ id: `c-${i}`, location: [c.coords[1], c.coords[0]], caption: c.name, count: c.count }));

  // Featured city state
  const [featIdx, setFeatIdx] = useState(0);
  const feat = cityList[featIdx] || cityList[0];
  // Photo priority: Google Places (landmarkPhotos) > static CITY_PHOTOS
  const getCityPhoto = (name) => {
    if (!name) return null;
    // Check landmarkPhotos from Google Places (keyed as "CityName, " or landmark name)
    if (landmarkPhotos) {
      if (landmarkPhotos[`${name}, `]) return landmarkPhotos[`${name}, `];
      // Try any key containing this city name
      for (const [key, url] of Object.entries(landmarkPhotos)) {
        if (key.toLowerCase().includes(name.toLowerCase())) return url;
      }
    }
    return findCityPhoto(name);
  };
  const featPhoto = feat ? getCityPhoto(feat.name) : null;
  const featCountry = feat ? (COUNTRY_NAMES[feat.cc] || feat.cc) : "";

  // Sorted lists
  const airlineList = Object.entries(airlineMap).map(([name, segs]) => ({ name, segs })).sort((a, b) => b.segs - a.segs).slice(0, 6);
  const hotelList = Object.entries(hotelMap).map(([name, nights]) => ({ name, nights })).sort((a, b) => b.nights - a.nights).slice(0, 6);
  const maxAirSeg = airlineList[0]?.segs || 1;
  const maxHotelNts = hotelList[0]?.nights || 1;
  const maxMonthly = Math.max(...monthlyData.map(m => m.biz + m.lei), 1);
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.9fr", gap: isMobile ? 24 : 64, paddingBottom: 40, borderBottom: `1px solid ${dv.cream}`, marginBottom: 40, alignItems: "end" }}>
        <div>
          <div style={{ fontFamily: dv.mono, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: css.accent, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 1, background: css.accent }} /> Travel Reports · FY {currentYear}
          </div>
          <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : "clamp(52px, 8.5vw, 100px)", fontWeight: 300, lineHeight: 0.94, letterSpacing: "-0.035em", margin: 0 }}>
            The world, <em style={{ fontStyle: "italic", fontWeight: 400, color: css.accent }}>by the mile.</em>
          </h1>
        </div>
        <div style={{ paddingBottom: 8 }}>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: dv.taupe, maxWidth: 420, margin: "0 0 24px" }}>
            A year rendered in arrivals and departures. {cityList.length} cities, {uniqueCountries} countries — each one a small rearrangement of the map in your pocket.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, paddingTop: 20, borderTop: `1px solid ${dv.cream}` }}>
            {[
              { lbl: "Cities", val: String(cityList.length) },
              { lbl: "Countries", val: String(uniqueCountries) },
              { lbl: "Home", val: "BDA" },
            ].map((c, i) => (
              <div key={i} style={{ padding: i > 0 ? "0 0 0 16px" : "0 16px 0 0", borderRight: i < 2 ? `1px solid ${dv.cream}` : "none" }}>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>{c.lbl}</div>
                <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em" }}>{c.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* World Map + City Panel */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: 0, background: dv.graphite, border: `1px solid ${dv.graphite}`, marginBottom: 40, overflow: "hidden" }}>
        {/* Rotating wireframe globe */}
        <div style={{ position: "relative", background: dv.graphite, padding: "20px 20px 0" }}>
          {/* Corner overlays */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Visited<br/><span style={{ fontFamily: dv.serif, fontSize: 20, fontStyle: "italic", fontWeight: 300, color: "#F4F1EC", textTransform: "none", letterSpacing: "-0.01em" }}>{cityList.length}</span>
            </div>
            <div style={{ textAlign: "right", fontFamily: dv.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Distance <span style={{ color: dv.accentSoft }}>·</span> YTD<br/><span style={{ fontFamily: dv.serif, fontSize: 20, fontStyle: "italic", fontWeight: 300, color: "#F4F1EC", textTransform: "none" }}>{totalMiles.toLocaleString()} mi</span>
            </div>
          </div>
          <DottedGlobe markers={globeMarkers} isMobile={isMobile} />
        </div>

        {/* City Panel */}
        {feat && (
          <div style={{ background: dv.graphite, color: "#F4F1EC", padding: isMobile ? 24 : 36, display: "flex", flexDirection: "column", borderLeft: isMobile ? "none" : "1px solid rgba(184,174,156,0.15)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40%", right: "-30%", width: "80%", height: "80%", background: `radial-gradient(circle, ${css.accent}20, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 16, borderBottom: "1px solid rgba(184,174,156,0.2)", marginBottom: 20, position: "relative", zIndex: 2 }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.accentSoft, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: css.accent, boxShadow: `0 0 12px ${css.accent}` }} /> Featured City
              </div>
              <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.1em" }}>{String(featIdx + 1).padStart(2, "0")} / {String(cityList.length).padStart(2, "0")}</span>
            </div>
            {/* Photo */}
            {featPhoto && (
              <div style={{ width: "100%", aspectRatio: "4/3", background: "#111", overflow: "hidden", marginBottom: 20, border: "1px solid rgba(184,174,156,0.2)", position: "relative", zIndex: 2 }}>
                <img src={featPhoto} alt={feat.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(1.05)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(21,19,15,0.5) 100%)", pointerEvents: "none" }} />
              </div>
            )}
            <div style={{ fontFamily: dv.serif, fontSize: 36, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em", color: "#F4F1EC", marginBottom: 4, position: "relative", zIndex: 2 }}>{feat.name} <em style={{ fontStyle: "italic", color: dv.accentSoft, fontSize: 22, marginLeft: 4 }}>, {feat.cc}</em></div>
            <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 15, color: dv.stone, marginBottom: 20, position: "relative", zIndex: 2 }}>{featCountry}</div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid rgba(184,174,156,0.2)", paddingTop: 16, position: "relative", zIndex: 2 }}>
              {[{ lbl: "Visits", val: `${feat.count}`, unit: "trips" }, { lbl: "Last In", val: feat.lastDate ? new Date(feat.lastDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",year:"2-digit"}) : "--" }].map((st, i) => (
                <div key={i} style={{ padding: i === 0 ? "4px 16px 4px 0" : "4px 0 4px 16px", borderRight: i === 0 ? "1px solid rgba(184,174,156,0.2)" : "none" }}>
                  <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.stone, marginBottom: 6 }}>{st.lbl}</div>
                  <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400, color: "#F4F1EC", fontVariantNumeric: "tabular-nums" }}>{st.val} {st.unit && <em style={{ fontStyle: "italic", color: dv.stone, fontSize: 13 }}>{st.unit}</em>}</div>
                </div>
              ))}
            </div>
            {/* Nav */}
            <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(184,174,156,0.2)", position: "relative", zIndex: 2 }}>
              <button onClick={() => setFeatIdx((featIdx - 1 + cityList.length) % cityList.length)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(184,174,156,0.3)", color: dv.stone, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: 12, cursor: "pointer" }}>Prev City</button>
              <button onClick={() => setFeatIdx((featIdx + 1) % cityList.length)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(184,174,156,0.3)", color: dv.stone, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: 12, cursor: "pointer" }}>Next City</button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics strip */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
        {[
          { lbl: "Miles Flown", val: totalMiles.toLocaleString(), unit: "mi", sub: totalMiles > 24901 ? `${(totalMiles / 24901).toFixed(1)}x the equator.` : "Keep flying." },
          { lbl: "Nights Abroad", val: String(totalNights), unit: "nts", sub: totalNights > 30 ? "A month away from home." : "More adventures ahead." },
          { lbl: "Cities Visited", val: String(cityList.length), unit: "pl", sub: `${uniqueCountries} countries.` },
          { lbl: "Flights", val: String(flightPaths.length), unit: "seg", sub: "Segments flown." },
        ].map((m, i) => (
          <div key={i} style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28, position: "relative", overflow: "hidden" }}>
            <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 14 }}>{m.lbl}</div>
            <div style={{ fontFamily: dv.serif, fontSize: 40, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{m.val}<span style={{ fontSize: 18, color: dv.taupe, fontStyle: "italic", marginLeft: 4 }}>{m.unit}</span></div>
            <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Section head */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${dv.cream}` }}>
        <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 24 : 28, fontWeight: 400, letterSpacing: "-0.02em" }}>Recent Passages <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: isMobile ? 16 : 20 }}>— a record of motion.</em></div>
        <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.1em" }}>S 02 · Chronicle</span>
      </div>

      {/* Timeline + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 20, marginBottom: 40 }}>
        {/* Timeline */}
        <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: `1px solid ${dv.cream}`, marginBottom: 16 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400 }}>Timeline <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>· last {Math.min(recentTrips.length, 8)} trips</em></div>
            <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.1em" }}>LIVE</span>
          </div>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 1, background: dv.cream }} />
            {recentTrips.slice(0, 8).map((t, i) => (
              <div key={i} style={{ position: "relative", padding: "12px 0", borderBottom: i < Math.min(recentTrips.length, 8) - 1 ? `1px solid ${dv.cream}` : "none" }}>
                <div style={{ position: "absolute", left: -24, top: 18, width: 7, height: 7, borderRadius: "50%", background: dv.bone, border: `1.5px solid ${dv.stone}` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ fontFamily: dv.serif, fontSize: 18, fontWeight: 400 }}>{t.name}</div>
                  <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.08em" }}>{t.date}</div>
                </div>
                <div style={{ display: "flex", gap: 16, fontFamily: dv.mono, fontSize: 11, color: dv.taupe }}>
                  <span>{t.segs} seg</span>
                  {t.nights > 0 && <span>{t.nights} nts</span>}
                  <span style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 8px", border: `1px solid ${t.isBiz ? css.accent : dv.moss}`, color: t.isBiz ? css.accent : dv.moss }}>{t.isBiz ? "Business" : "Leisure"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: `1px solid ${dv.cream}`, marginBottom: 16 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400 }}>Trips by Month</div>
            <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.1em" }}>NTS / MO</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 3 : 5, height: 200, paddingBottom: 24, borderBottom: `1px solid ${dv.cream}`, position: "relative" }}>
            {monthlyData.map((m, i) => {
              const total = m.biz + m.lei;
              const totalPct = total > 0 ? (total / maxMonthly) * 100 : 2;
              const bizPct = total > 0 ? (m.biz / total) * totalPct : 0;
              const leiPct = total > 0 ? (m.lei / total) * totalPct : 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative" }}>
                  {total > 0 && <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, marginBottom: 4 }}>{total}</div>}
                  <div style={{ width: "100%", height: `${leiPct}%`, background: dv.moss, minHeight: total > 0 ? 2 : 0 }} />
                  <div style={{ width: "100%", height: `${bizPct}%`, background: css.accent, minHeight: total > 0 ? 2 : 0 }} />
                  <div style={{ position: "absolute", bottom: -20, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: dv.taupe }}>{MONTHS[i].slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 20, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, background: css.accent }} /> Business</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, background: dv.moss }} /> Leisure</span>
          </div>
        </div>
      </div>

      {/* Airlines + Hotels */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 40 }}>
        {/* Airlines */}
        <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: `1px solid ${dv.cream}`, marginBottom: 16 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400 }}>Airlines <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>· by segments</em></div>
            <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.1em" }}>S 03.A</span>
          </div>
          {airlineList.length > 0 ? airlineList.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: i < airlineList.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
              <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: dv.serif, fontSize: 16, fontWeight: 400 }}>{a.name}</span>
              <div style={{ width: 100, height: 3, background: dv.cream, position: "relative" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(a.segs / maxAirSeg) * 100}%`, background: dv.ink, transition: "width 1s ease" }} /></div>
              <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.taupe, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 50 }}>{a.segs} <em style={{ fontStyle: "italic", fontSize: 10 }}>seg</em></span>
            </div>
          )) : <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe, padding: "24px 0", textAlign: "center" }}>Add flights to see airlines.</div>}
        </div>
        {/* Hotels */}
        <div style={{ background: dv.paper, border: `1px solid ${dv.cream}`, padding: isMobile ? 20 : 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, borderBottom: `1px solid ${dv.cream}`, marginBottom: 16 }}>
            <div style={{ fontFamily: dv.serif, fontSize: 20, fontWeight: 400 }}>Hotels <em style={{ fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>· by nights</em></div>
            <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.1em" }}>S 03.B</span>
          </div>
          {hotelList.length > 0 ? hotelList.map((h, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: i < hotelList.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
              <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: dv.serif, fontSize: 16, fontWeight: 400 }}>{h.name}</span>
              <div style={{ width: 100, height: 3, background: dv.cream, position: "relative" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(h.nights / maxHotelNts) * 100}%`, background: dv.ink, transition: "width 1s ease" }} /></div>
              <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.taupe, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 50 }}>{h.nights} <em style={{ fontStyle: "italic", fontSize: 10 }}>nts</em></span>
            </div>
          )) : <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe, padding: "24px 0", textAlign: "center" }}>Add hotels to see stays.</div>}
        </div>
      </div>
    </div>
  );
};

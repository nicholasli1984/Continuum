// Program directory and loyalty program data

export const PROGRAM_DIRECTORY = {
  airlines: [
    { id: "aa", name: "American Airlines AAdvantage", logo: "—", color: "#0078D2", accent: "#C8102E", unit: "Loyalty Points", loginUrl: "https://www.aa.com/loyalty/login", tiers: [
      { name: "Gold", threshold: 40000, perks: "Priority boarding, free checked bag, 40% bonus miles" },
      { name: "Platinum", threshold: 75000, perks: "Upgrades, 60% bonus, Admiral's Club day passes" },
      { name: "Platinum Pro", threshold: 125000, perks: "Premium upgrades, 80% bonus, complimentary MCE" },
      { name: "Executive Platinum", threshold: 200000, perks: "Systemwide upgrades, 120% bonus, ConciergeKey eligible" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "dl", name: "Delta SkyMiles", logo: "🔺", color: "#003366", accent: "#C8102E", unit: "MQDs ($)", loginUrl: "https://www.delta.com/myprofile/personal-details", tiers: [
      { name: "Silver Medallion", threshold: 5000, perks: "Unlimited upgrades, 40% bonus miles, Sky Priority" },
      { name: "Gold Medallion", threshold: 10000, perks: "SkyTeam Elite Plus, 60% bonus, Sky Priority" },
      { name: "Platinum Medallion", threshold: 15000, perks: "Choice Benefits, 80% bonus, waived fees" },
      { name: "Diamond Medallion", threshold: 28000, perks: "Global upgrades, 120% bonus, Delta ONE access" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "ua", name: "United MileagePlus", logo: "🌐", color: "#002244", accent: "#0066CC", unit: "PQPs", loginUrl: "https://www.united.com/en/us/mileageplus", tiers: [
      { name: "Premier Silver", threshold: 5000, perks: "Economy Plus, priority boarding, 1 bag free" },
      { name: "Premier Gold", threshold: 10000, perks: "Star Alliance Gold, United Club passes" },
      { name: "Premier Platinum", threshold: 15000, perks: "Regional upgrades, 2 GPUs" },
      { name: "Premier 1K", threshold: 22000, perks: "Global upgrades, PlusPoints, Premier Access" },
    ], earnRate: { domestic: 5, international: 11, premium: 22 } },
    { id: "sw", name: "Southwest Rapid Rewards", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Points", loginUrl: "https://www.southwest.com/rapid-rewards/myaccount", tiers: [
      { name: "A-List", threshold: 35000, perks: "Priority boarding, same-day standby, 25% bonus" },
      { name: "A-List Preferred", threshold: 70000, perks: "Free WiFi, 100% bonus points, all A-List perks" },
      { name: "Companion Pass", threshold: 135000, perks: "Designated companion flies free on every flight" },
    ], earnRate: { domestic: 6, international: 6, premium: 12 } },
    { id: "b6", name: "JetBlue TrueBlue", logo: "💙", color: "#003876", accent: "#0033A0", unit: "Tiles", loginUrl: "https://trueblue.jetblue.com/", tiers: [
      { name: "Mosaic 1", threshold: 50, perks: "Free checked bags, Even More Space, early boarding ($5,000 JetBlue spend)" },
      { name: "Mosaic 2", threshold: 100, perks: "All Mosaic 1 + free same-day changes, Mint upgrades ($10,000 spend)" },
      { name: "Mosaic 3", threshold: 150, perks: "Guaranteed Even More Space, complimentary Mint upgrades ($15,000 spend)" },
      { name: "Mosaic 4", threshold: 250, perks: "Highest upgrade priority, 4 guest passes per year ($25,000 spend)" },
    ], earnRate: { domestic: 5, international: 6, premium: 10 } },
    { id: "atmos", name: "Alaska Airlines Mileage Plan", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "EQMs", loginUrl: "https://www.alaskaair.com/account/overview", tiers: [
      { name: "MVP", threshold: 20000, perks: "Priority boarding, upgrade eligibility, 50% bonus miles" },
      { name: "MVP Gold", threshold: 40000, perks: "Lounge passes, upgrades, 100% bonus miles" },
      { name: "MVP Gold 75K", threshold: 75000, perks: "4 complimentary upgrades, lounge membership, 125% bonus miles" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "frontier", name: "Frontier Miles", logo: "🦅", color: "#006845", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.flyfrontier.com/myfrontier/my-account/", tiers: [
      { name: "Elite 20K", threshold: 20000, perks: "Free carry-on, seat selection, shortcut boarding" },
      { name: "Elite 50K", threshold: 50000, perks: "Free checked bag, priority boarding, buddy pass" },
      { name: "Elite 100K", threshold: 100000, perks: "Unlimited buddy passes, fee waivers, all perks" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "spirit", name: "Spirit Airlines", logo: "💛", color: "#FFD700", accent: "#000000", unit: "Points", loginUrl: "https://www.spirit.com/account", tiers: [
      { name: "Silver", threshold: 2000, perks: "Shortcut boarding, free seat selection" },
      { name: "Gold", threshold: 5000, perks: "Free checked bag, zone 2 boarding" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "flying_blue", name: "Air France/KLM Flying Blue", logo: "🔵", color: "#002157", accent: "#00A1E0", unit: "XP", loginUrl: "https://www.flyingblue.com/en/account/login", tiers: [
      { name: "Silver", threshold: 100, perks: "SkyTeam Elite, priority boarding, extra baggage" },
      { name: "Gold", threshold: 180, perks: "SkyTeam Elite Plus, lounge access, priority everything" },
      { name: "Platinum", threshold: 300, perks: "Guaranteed seats, companion lounge, 100% bonus" },
      { name: "Ultimate", threshold: 450, perks: "La Première access, dedicated hotline, all Platinum perks" },
    ], earnRate: { domestic: 4, international: 8, premium: 16 } },
    { id: "ba_avios", name: "British Airways Executive Club", logo: "🇬🇧", color: "#075AAA", accent: "#EB2226", unit: "Tier Points", loginUrl: "https://www.britishairways.com/travel/loginr/public/en_us", tiers: [
      { name: "Bronze", threshold: 300, perks: "Priority standby, bonus Avios" },
      { name: "Silver", threshold: 600, perks: "Lounge access, extra baggage, priority boarding" },
      { name: "Gold", threshold: 1500, perks: "First class lounge, guaranteed seat, concierge" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "aeroplan", name: "Air Canada Aeroplan", logo: "🍁", color: "#F01428", accent: "#000000", unit: "SQM", loginUrl: "https://www.aircanada.com/aeroplan/member/profile", tiers: [
      { name: "25K", threshold: 25000, perks: "Priority check-in, eUpgrades, Star Alliance Silver" },
      { name: "35K", threshold: 35000, perks: "Maple Leaf Lounge, priority everything" },
      { name: "50K", threshold: 50000, perks: "Star Alliance Gold, intl lounges, priority rebooking" },
      { name: "75K", threshold: 75000, perks: "Super eUpgrades, preferred seats, concierge" },
      { name: "100K", threshold: 100000, perks: "Priority rewards, global lounge, all benefits" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "emirates_skywards", name: "Emirates Skywards", logo: "🕌", color: "#D71A21", accent: "#9B8860", unit: "Tier Miles", loginUrl: "https://www.emirates.com/account/english/login/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority check-in, extra baggage, bonus miles" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, guaranteed seats, upgrades" },
      { name: "Platinum", threshold: 150000, perks: "First class lounge, chauffeur, companion tickets" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "turkish_miles", name: "Turkish Airlines Miles&Smiles", logo: "🌙", color: "#C8102E", accent: "#003876", unit: "Miles", loginUrl: "https://www.turkishairlines.com/en-us/miles-and-smiles/account/", tiers: [
      { name: "Classic Plus", threshold: 25000, perks: "Priority check-in, extra baggage" },
      { name: "Elite", threshold: 40000, perks: "Star Alliance Gold, lounge, upgrades" },
      { name: "Elite Plus", threshold: 80000, perks: "Priority everything, guaranteed economy, CIP lounge" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "qantas_ff", name: "Qantas Frequent Flyer", logo: "🦘", color: "#E0001B", accent: "#1A1F36", unit: "Status Credits", loginUrl: "https://www.qantas.com/fflyer/do/login/myaccount", tiers: [
      { name: "Silver", threshold: 300, perks: "Priority boarding, bonus points, oneworld Ruby" },
      { name: "Gold", threshold: 700, perks: "Qantas Club, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 1400, perks: "First lounges, complimentary upgrades, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "singapore_kf", name: "Singapore KrisFlyer", logo: "🦁", color: "#FDB813", accent: "#003876", unit: "Elite Miles", loginUrl: "https://www.singaporeair.com/en_UK/ppsclub-krisflyer/my-profile/", tiers: [
      { name: "Elite Silver", threshold: 25000, perks: "Priority check-in, Star Alliance Silver" },
      { name: "Elite Gold", threshold: 50000, perks: "Lounge access, Star Alliance Gold, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "etihad_guest", name: "Etihad Guest", logo: "🏛️", color: "#BD8B13", accent: "#1A1F36", unit: "Tier Miles", loginUrl: "https://www.etihadguest.com/en/login.html", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority check-in, bonus miles" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, extra baggage" },
      { name: "Platinum", threshold: 125000, perks: "First class lounges, companion ticket, chauffeur" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "virgin_fc", name: "Virgin Atlantic Flying Club", logo: "❤️‍🔥", color: "#E50000", accent: "#660000", unit: "Tier Points", loginUrl: "https://www.virginatlantic.com/mytrips/en/gb/login", tiers: [
      { name: "Silver", threshold: 400, perks: "Priority boarding, extra bag, seat selection" },
      { name: "Gold", threshold: 800, perks: "Clubhouse access, premium check-in, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "cathay_mp", name: "Cathay Pacific Asia Miles", logo: "🌏", color: "#006564", accent: "#A6815B", unit: "Status Points", loginUrl: "https://www.cathaypacific.com/cx/en_US/sign-in.html", tiers: [
      { name: "Silver", threshold: 300, perks: "Priority check-in, lounge access, extra baggage" },
      { name: "Gold", threshold: 600, perks: "First lounges, upgrades, oneworld Sapphire" },
      { name: "Diamond", threshold: 1200, perks: "Premium lounges, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    // ── Asia-Pacific ──
    { id: "jal", name: "Japan Airlines JAL Mileage Bank", logo: "🗾", color: "#C8102E", accent: "#1A1F36", unit: "FLY ON Points", loginUrl: "https://www.jal.co.jp/en/mileage/", tiers: [
      { name: "Crystal", threshold: 30000, perks: "Priority boarding, bonus miles, oneworld Ruby" },
      { name: "Sapphire", threshold: 50000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "JGC Premier", threshold: 80000, perks: "First class lounges, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "ana", name: "ANA Mileage Club", logo: "🏯", color: "#003A6D", accent: "#9DC3E6", unit: "Premium Points", loginUrl: "https://www.ana.co.jp/en/us/amc/", tiers: [
      { name: "Bronze", threshold: 30000, perks: "Priority boarding, bonus miles, Star Alliance Silver" },
      { name: "Platinum", threshold: 50000, perks: "Lounges, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "ANA Suite, guaranteed seats, all Platinum perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "eva_air", name: "EVA Air Infinity MileageLands", logo: "🟢", color: "#007D40", accent: "#C8A951", unit: "Mileage Credits", loginUrl: "https://www.evaair.com/en-global/member/", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "Premium lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "korean_air", name: "Korean Air SKYPASS", logo: "🇰🇷", color: "#003087", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.koreanair.com/content/koreanair/en/skypass/login.html", tiers: [
      { name: "Morning Calm", threshold: 30000, perks: "Priority boarding, extra bag, bonus miles" },
      { name: "Morning Calm Premium", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Million Miler", threshold: 1000000, perks: "Lifetime status, top tier lounge, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "asiana", name: "Asiana Airlines Asiana Club", logo: "🌸", color: "#1A3668", accent: "#C8102E", unit: "Miles", loginUrl: "https://flyasiana.com/C/US/EN/member/memberLogin", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage, bonus miles" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, SkyTeam Elite" },
      { name: "Diamond", threshold: 80000, perks: "First lounge, guaranteed availability, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "hk_airlines", name: "Hong Kong Airlines Fortune Wings Club", logo: "🐉", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.hkairlines.com/en_HK/fortune-wings-club/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, priority check-in" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "hk_express", name: "HK Express MegaHub", logo: "🟠", color: "#FF6600", accent: "#1A1F36", unit: "Points", loginUrl: "https://www.hkexpress.com/en-hk/member/", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "air_china", name: "Air China PhoenixMiles", logo: "🐦", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.airchina.us/US/GB/member/login/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, guaranteed seats, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "china_eastern", name: "China Eastern Eastern Miles", logo: "🔴", color: "#CC0000", accent: "#003876", unit: "Miles", loginUrl: "https://us.ceair.com/newCEAir/member/login.html", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, bonus miles, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "china_southern", name: "China Southern Sky Pearl", logo: "🌺", color: "#003876", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.csair.com/en/", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First class lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "thai", name: "Thai Airways Royal Orchid Plus", logo: "🌷", color: "#4B0082", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.thaiairways.com/en_TH/rop/rop.page", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, guaranteed availability, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "malaysia", name: "Malaysia Airlines Enrich", logo: "🌙", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.malaysiaairlines.com/my/en/enrich.html", tiers: [
      { name: "Blue", threshold: 0, perks: "Base tier, earn miles on flights" },
      { name: "Silver", threshold: 35000, perks: "Priority boarding, bonus miles, oneworld Ruby" },
      { name: "Gold", threshold: 75000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 150000, perks: "First lounge, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "garuda", name: "Garuda Indonesia GarudaMiles", logo: "🦅", color: "#003876", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.garudaindonesia.com/id/id/informasi/mygaruda", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Sky Team Elite" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "philippines_air", name: "Philippine Airlines Mabuhay Miles", logo: "🌅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.philippineairlines.com/en/ph/home/mabuhay-miles", tiers: [
      { name: "Elite", threshold: 25000, perks: "Priority boarding, extra bag, lounge access" },
      { name: "Elite Plus", threshold: 75000, perks: "Guaranteed upgrades, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "vietnam_air", name: "Vietnam Airlines Lotusmiles", logo: "🌸", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.vietnamairlines.com/us/en/member/lotusmiles", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 40000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 80000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "air_india", name: "Air India Flying Returns", logo: "🇮🇳", color: "#FF6600", accent: "#003876", unit: "Miles", loginUrl: "https://www.airindia.com/flying-returns.htm", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Maharajah", threshold: 100000, perks: "First class lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "airasia", name: "AirAsia BIG Loyalty", logo: "🔴", color: "#CC0000", accent: "#FFD700", unit: "BIG Points", loginUrl: "https://www.biglife.com/", tiers: [
      { name: "BIG Xtra", threshold: 10000, perks: "Priority boarding, seat discount, extra bag" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "scoot", name: "Scoot Scoot Mates", logo: "—", color: "#FFD700", accent: "#003876", unit: "Points", loginUrl: "https://www.flyscoot.com/en/plan/discover-scoot/scoot-mates", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "air_nz", name: "Air New Zealand Airpoints", logo: "🥝", color: "#003876", accent: "#C8102E", unit: "Airpoints Dollars", loginUrl: "https://www.airnewzealand.com/airpoints", tiers: [
      { name: "Silver", threshold: 250, perks: "Priority boarding, lounge access, Star Alliance Silver" },
      { name: "Gold", threshold: 500, perks: "Koru lounge, upgrades, Star Alliance Gold" },
      { name: "Elite", threshold: 1000, perks: "Highest priority, guaranteed seat, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "jetstar", name: "Jetstar Frequent Flyer", logo: "⭐", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.jetstar.com/au/en/deals/jetstar-frequent-flyer", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    // ── Middle East ──
    { id: "qatar", name: "Qatar Airways Privilege Club", logo: "🐪", color: "#5C0632", accent: "#8D734A", unit: "Qmiles", loginUrl: "https://www.qatarairways.com/en-us/privilege-club.html", tiers: [
      { name: "Burgundy", threshold: 0, perks: "Base tier, earn Qmiles on flights" },
      { name: "Silver", threshold: 200, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 500, perks: "Al Mourjan lounge, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 1200, perks: "First class lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "oman_air", name: "Oman Air Sindbad", logo: "🌊", color: "#C8102E", accent: "#003876", unit: "Miles", loginUrl: "https://www.omanair.com/en/sindbad", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "gulf_air", name: "Gulf Air Falconflyer", logo: "🦅", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.gulfair.com/falconflyer", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "saudia", name: "Saudia Al-Fursan", logo: "🕌", color: "#006400", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.saudia.com/fly/loyality-program", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra baggage, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "flynas", name: "Flynas naSmiles", logo: "🌙", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.flynas.com/en/nasmiles", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "flydubai", name: "flydubai OPEN", logo: "🏙️", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.flydubai.com/en/loyalty/open/", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    // ── Europe ──
    { id: "lufthansa", name: "Lufthansa Miles & More", logo: "🦅", color: "#003876", accent: "#FFCC00", unit: "Award Miles", loginUrl: "https://www.miles-and-more.com/row/en/login.html", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, lounge with guest, extra bag" },
      { name: "Senator", threshold: 100000, perks: "Lounge anytime, upgrades, Star Alliance Gold" },
      { name: "HON Circle", threshold: 600000, perks: "HON Circle lounge, First class lounge, guaranteed First" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "swiss", name: "Swiss SWISS Miles & More", logo: "🇨🇭", color: "#CC0000", accent: "#003876", unit: "Award Miles", loginUrl: "https://www.swiss.com/ch/en/fly/miles-and-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, lounge access" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "austrian", name: "Austrian Airlines Miles & More", logo: "🇦🇹", color: "#CC0000", accent: "#003876", unit: "Award Miles", loginUrl: "https://www.austrian.com/us/en/miles-and-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "iberia", name: "Iberia Plus", logo: "🇪🇸", color: "#CC0000", accent: "#FFD700", unit: "Avios", loginUrl: "https://www.iberia.com/us/iberia-plus/", tiers: [
      { name: "Uno", threshold: 20000, perks: "Priority boarding, extra baggage, oneworld Ruby" },
      { name: "Dos", threshold: 50000, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Cuatro", threshold: 100000, perks: "First lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "finnair", name: "Finnair Plus", logo: "🇫🇮", color: "#003876", accent: "#C8102E", unit: "Tier Points", loginUrl: "https://www.finnair.com/int/gb/finnair-plus", tiers: [
      { name: "Silver", threshold: 200, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 600, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 2000, perks: "First lounge, highest priority, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "sas", name: "SAS EuroBonus", logo: "🇸🇪", color: "#003876", accent: "#C8102E", unit: "Points", loginUrl: "https://www.flysas.com/en/us/sas-eurobonus/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 45000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 90000, perks: "SAS Gold Lounge, guaranteed seat, highest priority" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "tap", name: "TAP Air Portugal Miles&Go", logo: "🇵🇹", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.tapairportugal.com/en/miles-go", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "azores", name: "Azores Airlines SATA Miles", logo: "🌋", color: "#003876", accent: "#009900", unit: "Miles", loginUrl: "https://www.azoresairlines.pt/en", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, seat upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "aer_lingus", name: "Aer Lingus AerClub", logo: "🍀", color: "#003876", accent: "#009900", unit: "Avios", loginUrl: "https://www.aerlingus.com/travel-information/aerclub/aerclub-home/", tiers: [
      { name: "Bronze", threshold: 0, perks: "Earn Avios on flights" },
      { name: "Silver", threshold: 450, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 900, perks: "Lounge access, upgrades, oneworld Sapphire" },
    ], earnRate: { domestic: 5, international: 10, premium: 20 } },
    { id: "lot", name: "LOT Polish Airlines Miles & More", logo: "🇵🇱", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.lot.com/us/en/miles-more", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "aegean", name: "Aegean Airlines Miles+Bonus", logo: "🇬🇷", color: "#003876", accent: "#C8102E", unit: "Miles", loginUrl: "https://www.aegeanair.com/en/milesandbonus/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "pegasus", name: "Pegasus Airlines BolBol", logo: "🐎", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.flypgs.com/en/bolbol", tiers: [
      { name: "Standard", threshold: 0, perks: "Earn points on flights and partners" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "ita_airways", name: "ITA Airways Volare", logo: "🇮🇹", color: "#009246", accent: "#003876", unit: "Points", loginUrl: "https://www.ita-airways.com/en_us/fly-ita/volare.html", tiers: [
      { name: "Executive", threshold: 20000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Premium Executive", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "norwegian", name: "Norwegian Reward", logo: "🇳🇴", color: "#CC0000", accent: "#003876", unit: "CashPoints", loginUrl: "https://www.norwegian.com/en/frequent-flyer/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "easyjet", name: "easyJet Flight Club", logo: "🟠", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.easyjet.com/en/cheap-flights/flight-club", tiers: [
      { name: "Standard", threshold: 0, perks: "Speedy boarding, seat selection discounts" },
    ], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "vueling", name: "Vueling Club", logo: "💛", color: "#FFD700", accent: "#003876", unit: "Points", loginUrl: "https://www.vueling.com/en/vueling-services/vueling-club", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades, oneworld Sapphire" },
    ], earnRate: { domestic: 5, international: 8, premium: 15 } },
    { id: "brussels", name: "Brussels Airlines Miles & More", logo: "🇧🇪", color: "#003876", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.brusselsairlines.com/en-gb/special-pages/miles-more.aspx", tiers: [
      { name: "Frequent Traveller", threshold: 35000, perks: "Star Alliance Silver, priority boarding" },
      { name: "Senator", threshold: 100000, perks: "Lounge, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    // ── Africa ──
    { id: "ethiopian", name: "Ethiopian Airlines ShebaMiles", logo: "🦁", color: "#009A44", accent: "#FFCD00", unit: "Miles", loginUrl: "https://www.ethiopianairlines.com/en/shebamiles", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 60000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "kenya_airways", name: "Kenya Airways Asante Rewards", logo: "🦒", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.kenya-airways.com/en/flying-with-us/asante/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "south_african", name: "South African Airways Voyager", logo: "🇿🇦", color: "#003876", accent: "#009A44", unit: "Miles", loginUrl: "https://www.flysaa.com/us/en/book-and-manage/saa-voyager", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "egyptair", name: "EgyptAir EGYPTAIR Plus", logo: "🦅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.egyptair.com/en/air/eap/", tiers: [
      { name: "Silver", threshold: 20000, perks: "Priority boarding, extra baggage, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    // ── South America ──
    { id: "latam", name: "LATAM Airlines LATAM Pass", logo: "🌎", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.latamairlines.com/us/en/account/login", tiers: [
      { name: "Silver", threshold: 50, perks: "Priority boarding, extra bag, oneworld Ruby" },
      { name: "Gold", threshold: 130, perks: "Lounge access, upgrades, oneworld Sapphire" },
      { name: "Platinum", threshold: 250, perks: "First lounge, guaranteed seats, oneworld Emerald" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "gol", name: "GOL Airlines Smiles", logo: "🇧🇷", color: "#FF6600", accent: "#003876", unit: "Miles", loginUrl: "https://www.voegol.com.br/en/smiles", tiers: [
      { name: "Silver", threshold: 10000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 25000, perks: "Lounge access, upgrades" },
      { name: "Diamond", threshold: 60000, perks: "Highest priority, guaranteed seats" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "azul", name: "Azul Brazilian Airlines TudoAzul", logo: "💙", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://www.voeazul.com.br/en/todo-azul", tiers: [
      { name: "Safira", threshold: 10000, perks: "Priority boarding, extra bag" },
      { name: "Diamante", threshold: 30000, perks: "Lounge access, upgrades, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "avianca", name: "Avianca LifeMiles", logo: "🌺", color: "#CC0000", accent: "#FFD700", unit: "Miles", loginUrl: "https://www.lifemiles.com/eng/mem/memberlogin.aspx", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Diamond", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "copa", name: "Copa Airlines ConnectMiles", logo: "🌉", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.copaair.com/en/web/gs/connectmiles", tiers: [
      { name: "Silver", threshold: 30000, perks: "Priority boarding, extra bag, Star Alliance Silver" },
      { name: "Gold", threshold: 60000, perks: "Lounge access, upgrades, Star Alliance Gold" },
      { name: "Platinum", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    { id: "aeromexico", name: "Aeromexico Club Premier", logo: "🦅", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.aeromexico.com/en-us/club-premier", tiers: [
      { name: "Silver", threshold: 25000, perks: "Priority boarding, extra bag, SkyTeam Silver" },
      { name: "Gold", threshold: 50000, perks: "Lounge access, upgrades, SkyTeam Elite Plus" },
      { name: "Titanium", threshold: 100000, perks: "First lounge, highest priority, all perks" },
    ], earnRate: { domestic: 5, international: 10, premium: 18 } },
    // ── North America (additional) ──
    { id: "westjet", name: "WestJet Rewards", logo: "🇨🇦", color: "#003876", accent: "#009A44", unit: "WestJet dollars", loginUrl: "https://www.westjet.com/en-ca/rewards", tiers: [
      { name: "Silver", threshold: 1000, perks: "Priority boarding, extra bag" },
      { name: "Gold", threshold: 2000, perks: "Lounge access, upgrades, priority check-in" },
      { name: "Platinum", threshold: 4000, perks: "Highest priority, guaranteed upgrades, all perks" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "air_transat", name: "Air Transat Club Transat", logo: "🍁", color: "#CC0000", accent: "#003876", unit: "Points", loginUrl: "https://www.airtransat.com/en-CA/Club-Transat/Overview", tiers: [
      { name: "Distinction", threshold: 40000, perks: "Priority boarding, bonus points" },
      { name: "Prestige", threshold: 100000, perks: "Priority everything, upgrades" },
    ], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "caribbean", name: "Caribbean Airlines Caribbean Miles", logo: "🌴", color: "#003876", accent: "#CC0000", unit: "Miles", loginUrl: "https://www.caribbean-airlines.com/en/frequent-flyer", tiers: [
      { name: "Silver", threshold: 15000, perks: "Priority boarding, extra baggage" },
      { name: "Gold", threshold: 35000, perks: "Lounge access, upgrades" },
    ], earnRate: { domestic: 5, international: 10, premium: 15 } },
    { id: "bermudair", name: "BermudAir Frequent Flyer", logo: "🏝️", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://www.bermudair.com/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
    { id: "breeze", name: "Breeze Airways Breezy Rewards", logo: "🌬️", color: "#00B2E3", accent: "#003876", unit: "BreezePoints", loginUrl: "https://www.flybreeze.com/rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "sun_country", name: "Sun Country Airlines Sun Country Rewards", logo: "☀️", color: "#003876", accent: "#FFD700", unit: "Points", loginUrl: "https://www.suncountry.com/rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "allegiant", name: "Allegiant Air Allways Rewards", logo: "🔶", color: "#FF6600", accent: "#003876", unit: "Points", loginUrl: "https://www.allegiantair.com/allways-rewards", tiers: [], earnRate: { domestic: 4, international: 4, premium: 8 } },
    { id: "contour", name: "Contour Airlines Rewards", logo: "—", color: "#003876", accent: "#FF6600", unit: "Points", loginUrl: "https://contourairlines.com/", tiers: [], earnRate: { domestic: 5, international: 5, premium: 10 } },
  ],
  hotels: [
    { id: "marriott", name: "Marriott Bonvoy", logo: "—", color: "#7C2529", accent: "#B5985A", unit: "Nights", loginUrl: "https://www.marriott.com/loyalty/myAccount/default.mi", tiers: [
      { name: "Silver Elite", threshold: 10, perks: "10% bonus points, priority late checkout" },
      { name: "Gold Elite", threshold: 25, perks: "25% bonus, room upgrade, 2pm checkout" },
      { name: "Platinum Elite", threshold: 50, perks: "50% bonus, suite upgrade, lounge access" },
      { name: "Titanium Elite", threshold: 75, perks: "75% bonus, United Silver, 48hr guarantee" },
      { name: "Ambassador Elite", threshold: 100, perks: "Your24, ambassador service, all Titanium perks" },
    ], earnRate: { standard: 10, premium: 15, luxury: 25 } },
    { id: "hilton", name: "Hilton Honors", logo: "🌟", color: "#003B5C", accent: "#0099CC", unit: "Nights", loginUrl: "https://www.hilton.com/en/hilton-honors/guest/my-account/", tiers: [
      { name: "Silver", threshold: 10, perks: "20% bonus, 5th night free on rewards" },
      { name: "Gold", threshold: 40, perks: "80% bonus, room upgrade, free breakfast" },
      { name: "Diamond", threshold: 60, perks: "100% bonus, space-available upgrade, exec lounge" },
      { name: "Diamond Reserve", threshold: 80, perks: "All Diamond perks + enhanced suite upgrades, premium WiFi" },
    ], earnRate: { standard: 10, premium: 15, luxury: 20 } },
    { id: "ihg", name: "IHG One Rewards", logo: "🔑", color: "#2E1A47", accent: "#6B3FA0", unit: "Nights", loginUrl: "https://www.ihg.com/rewardsclub/us/en/account/home", tiers: [
      { name: "Silver Elite", threshold: 10, perks: "20% bonus, late checkout" },
      { name: "Gold Elite", threshold: 20, perks: "40% bonus, room upgrade" },
      { name: "Platinum Elite", threshold: 40, perks: "60% bonus, guaranteed availability" },
      { name: "Diamond Elite", threshold: 70, perks: "100% bonus, suite upgrade, amenity" },
    ], earnRate: { standard: 10, premium: 15, luxury: 20 } },
    { id: "hyatt", name: "World of Hyatt", logo: "🏛️", color: "#1C4B82", accent: "#D4A553", unit: "Nights", loginUrl: "https://www.hyatt.com/en-US/member/overview", tiers: [
      { name: "Discoverist", threshold: 10, perks: "Bottled water, priority late checkout" },
      { name: "Explorist", threshold: 30, perks: "Room upgrade, 2pm checkout, club lounge" },
      { name: "Globalist", threshold: 60, perks: "Suite upgrades, free breakfast, parking, waived resort fees" },
    ], earnRate: { standard: 5, premium: 10, luxury: 15 } },
    { id: "choice", name: "Choice Privileges", logo: "🏠", color: "#003F87", accent: "#FFB81C", unit: "Nights", loginUrl: "https://www.choicehotels.com/choice-privileges/account", tiers: [
      { name: "Gold", threshold: 10, perks: "Room upgrade, early check-in, late checkout" },
      { name: "Platinum", threshold: 20, perks: "Best room guarantee, bonus points" },
      { name: "Diamond", threshold: 40, perks: "Suite upgrade, guaranteed availability, amenity" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "wyndham", name: "Wyndham Rewards", logo: "🌀", color: "#0066B3", accent: "#FF6600", unit: "Nights", loginUrl: "https://www.wyndhamhotels.com/wyndham-rewards/member/dashboard", tiers: [
      { name: "Blue", threshold: 0, perks: "Member rates, free WiFi" },
      { name: "Gold", threshold: 5, perks: "1,000 bonus points per stay, late checkout" },
      { name: "Platinum", threshold: 15, perks: "Best room guarantee, welcome amenity" },
      { name: "Diamond", threshold: 40, perks: "Suite upgrade, early check-in/late checkout, bonus" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "accor", name: "ALL – Accor Live Limitless", logo: "🇫🇷", color: "#1B3160", accent: "#C4A769", unit: "Nights", loginUrl: "https://all.accor.com/loyalty-program/index.en.shtml", tiers: [
      { name: "Silver", threshold: 10, perks: "Late checkout, welcome drink" },
      { name: "Gold", threshold: 30, perks: "Room upgrade, early check-in, late checkout" },
      { name: "Platinum", threshold: 60, perks: "Suite upgrade, breakfast, lounge access" },
      { name: "Diamond", threshold: 100, perks: "Guaranteed room, premium suite, all perks" },
    ], earnRate: { standard: 10, premium: 15, luxury: 25 } },
    { id: "bestwestern", name: "Best Western Rewards", logo: "👑", color: "#003876", accent: "#FFD700", unit: "Nights", loginUrl: "https://www.bestwestern.com/en_US/rewards/member-profile.html", tiers: [
      { name: "Blue", threshold: 0, perks: "Member rates, points never expire" },
      { name: "Gold", threshold: 5, perks: "10% bonus, late checkout" },
      { name: "Platinum", threshold: 7, perks: "15% bonus, room upgrade" },
      { name: "Diamond", threshold: 15, perks: "30% bonus, suite when available, amenity" },
      { name: "Diamond Select", threshold: 25, perks: "50% bonus, best room guarantee" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "radisson", name: "Radisson Rewards", logo: "🔶", color: "#0C2340", accent: "#D4A553", unit: "Nights", loginUrl: "https://www.radissonhotels.com/en-us/rewards/my-account", tiers: [
      { name: "Club", threshold: 0, perks: "Member rates, free WiFi" },
      { name: "Premium", threshold: 5, perks: "Priority check-in, room upgrade" },
      { name: "VIP", threshold: 30, perks: "Suite upgrade, welcome amenity, guaranteed room" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "sonesta", name: "Sonesta Travel Pass", logo: "🌅", color: "#A3238E", accent: "#F7B538", unit: "Nights", loginUrl: "https://www.sonesta.com/sonesta-travel-pass/dashboard", tiers: [
      { name: "Adventurer", threshold: 0, perks: "Member rates, bonus points" },
      { name: "Explorer", threshold: 10, perks: "Room upgrade, late checkout, welcome amenity" },
      { name: "Trailblazer", threshold: 20, perks: "Suite upgrade, free breakfast, priority" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "omni", name: "Omni Select Guest", logo: "🎩", color: "#1A1F36", accent: "#C4A769", unit: "Nights", loginUrl: "https://www.omnihotels.com/loyalty", tiers: [
      { name: "Select Guest", threshold: 0, perks: "Complimentary WiFi, welcome amenity" },
      { name: "Platinum", threshold: 15, perks: "Room upgrade, late checkout, bonus points" },
      { name: "Black", threshold: 40, perks: "Suite upgrade, guaranteed room, premium amenity" },
    ], earnRate: { standard: 10, premium: 12, luxury: 15 } },
    { id: "airbnb", name: "Airbnb", logo: "🏠", color: "#FF5A5F", accent: "#00A699", unit: "Stays", loginUrl: "https://www.airbnb.com/login", tiers: [], earnRate: { standard: 0, premium: 0, luxury: 0 } },
    { id: "vrbo", name: "VRBO", logo: "🏡", color: "#1B4CC4", accent: "#FF6600", unit: "Stays", loginUrl: "https://www.vrbo.com/account/login", tiers: [], earnRate: { standard: 0, premium: 0, luxury: 0 } },
  ],
  rentals: [
    { id: "hertz", name: "Hertz Gold Plus Rewards", logo: "—", color: "#FFD700", accent: "#000000", unit: "Rentals", loginUrl: "https://www.hertz.com/rentacar/member/enrollment", tiers: [
      { name: "Gold", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Five Star", threshold: 10, perks: "Guaranteed upgrades, priority service" },
      { name: "President's Circle", threshold: 15, perks: "Premium vehicles, dedicated line" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "national", name: "National Emerald Club", logo: "🟢", color: "#006845", accent: "#2ECC71", unit: "Rentals", loginUrl: "https://www.nationalcar.com/en/loyalty.html", tiers: [
      { name: "Emerald Club", threshold: 0, perks: "Choose any midsize+, bypass counter" },
      { name: "Emerald Club Executive", threshold: 12, perks: "Free upgrades, guaranteed one-class" },
      { name: "Emerald Club Executive Elite", threshold: 25, perks: "Premium aisle access, priority" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "avis", name: "Avis Preferred", logo: "🅰️", color: "#D0021B", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.avis.com/en/loyalty-profile", tiers: [
      { name: "Preferred", threshold: 0, perks: "Skip the counter, choose your car" },
      { name: "Preferred Plus", threshold: 10, perks: "Free upgrade, priority service" },
      { name: "President's Club", threshold: 20, perks: "Premium vehicles, dedicated line, best rates" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "enterprise", name: "Enterprise Plus", logo: "🚙", color: "#006845", accent: "#FFD700", unit: "Rentals", loginUrl: "https://www.enterprise.com/en/enterprise-plus.html", tiers: [
      { name: "Plus", threshold: 0, perks: "Earn points on rentals, free days" },
      { name: "Silver", threshold: 6, perks: "Free upgrade, priority service" },
      { name: "Gold", threshold: 12, perks: "Free class upgrade, premium service" },
      { name: "Platinum", threshold: 24, perks: "Top tier service, guaranteed upgrades, dedicated line" },
    ], earnRate: { standard: 1, premium: 1.5 } },
    { id: "budget", name: "Budget Fastbreak", logo: "🅱️", color: "#F57C21", accent: "#1A1F36", unit: "Rentals", loginUrl: "https://www.budget.com/en/fast-break", tiers: [
      { name: "Fastbreak", threshold: 0, perks: "Skip the counter, faster pickup" },
    ], earnRate: { standard: 1, premium: 1 } },
    { id: "sixt", name: "Sixt Loyalty", logo: "🔶", color: "#FF6600", accent: "#000000", unit: "Status Points", loginUrl: "https://www.sixt.com/mysixt/", tiers: [
      { name: "Gold", threshold: 500, perks: "Free upgrade, priority pick-up" },
      { name: "Platinum", threshold: 2000, perks: "Guaranteed upgrade, VIP service" },
      { name: "Diamond", threshold: 7000, perks: "Premium fleet, personal manager" },
    ], earnRate: { standard: 1, premium: 2 } },
    { id: "turo", name: "Turo", logo: "🔑", color: "#1D3557", accent: "#E63946", unit: "Trips", loginUrl: "https://turo.com/us/en/signin", tiers: [], earnRate: { standard: 1, premium: 1 } },
  ],
  creditCards: [
    { id: "amex_plat", name: "Amex Platinum", logo: "💳", color: "#B4B4B4", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "5x flights, 5x FHR hotels, Centurion Lounge, Marriott/Hilton Gold (Sept 2025 refresh)", annualFee: 895, bonusCategories: { flights: 5, hotels: 5, dining: 1, other: 1 },
      benefits: [
        { id: "hotel_credit", label: "FHR/THC Hotel Credit ($300 × 2 semi-annual)", maxValue: 600 },
        { id: "uber_credit", label: "Uber One Membership ($10/mo)", maxValue: 120 },
        { id: "digital_credit", label: "Digital Entertainment Credit ($25/mo)", maxValue: 300 },
        { id: "resy_credit", label: "Resy Dining Credit", maxValue: 400 },
        { id: "lululemon_credit", label: "Lululemon Credit", maxValue: 300 },
        { id: "oura_credit", label: "Oura Ring Credit", maxValue: 200 },
        { id: "clear_credit", label: "CLEAR Plus Membership", maxValue: 209 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "centurion_lounge", label: "Centurion Lounge Access", maxValue: 500 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 300 },
        { id: "delta_sky_club", label: "Delta Sky Club (on same-day Delta)", maxValue: 200 },
        { id: "marriott_gold", label: "Marriott Bonvoy Gold Elite", maxValue: 150 },
        { id: "hilton_gold", label: "Hilton Honors Gold", maxValue: 150 },
        { id: "hertz_pc", label: "Hertz President's Circle Status", maxValue: 100 },
        { id: "avis_pref", label: "Avis Preferred Plus Status", maxValue: 100 },
        { id: "national_exec", label: "National Emerald Club Executive", maxValue: 100 },
      ],
    },
    { id: "amex_gold", name: "Amex Gold", logo: "✨", color: "#C5993C", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "4x dining & groceries, 3x flights, Uber/dining/Resy credits", annualFee: 325, bonusCategories: { flights: 3, dining: 4, other: 1 },
      benefits: [
        { id: "dining_credit", label: "Dining Credit (Grubhub/Cheesecake/Goldbelly/Wine.com/Five Guys)", maxValue: 120 },
        { id: "uber_credit", label: "Uber Cash ($10/mo)", maxValue: 120 },
        { id: "resy_credit", label: "Resy Credit ($50 × 2)", maxValue: 100 },
        { id: "dunkin_credit", label: "Dunkin' Credit ($7/mo)", maxValue: 84 },
        { id: "hotel_credit", label: "The Hotel Collection $100 Experience Credit", maxValue: 100 },
      ],
    },
    { id: "amex_green", name: "Amex Green", logo: "🌿", color: "#006845", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "3x travel & transit, LoungeBuddy credit, Global Entry credit", annualFee: 150, bonusCategories: { flights: 3, dining: 3, other: 1 },
      benefits: [
        { id: "clear_credit", label: "CLEAR Plus Membership", maxValue: 199 },
        { id: "loungebuddy", label: "LoungeBuddy Credit", maxValue: 100 },
      ],
    },
    { id: "chase_sapphire", name: "Chase Sapphire Reserve", logo: "💎", color: "#1A1F36", accent: "#004977", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "8x Chase Travel, 4x hotels/flights direct, 3x dining, The Edit, Exclusive Tables", annualFee: 795, bonusCategories: { flights: 4, hotels: 4, dining: 3, other: 1 },
      benefits: [
        { id: "travel_credit", label: "$300 Annual Travel Credit", maxValue: 300 },
        { id: "edit_hotel_credit", label: "The Edit Hotel Credit ($250 × 2 semi-annual)", maxValue: 500 },
        { id: "exclusive_tables", label: "Sapphire Exclusive Tables Dining ($150 × 2)", maxValue: 300 },
        { id: "stubhub_credit", label: "StubHub / Viagogo Credit ($150 × 2)", maxValue: 300 },
        { id: "apple_services", label: "Apple TV+ and Apple Music", maxValue: 250 },
        { id: "peloton_credit", label: "Peloton Membership Credit", maxValue: 120 },
        { id: "lyft_credit", label: "Lyft Credit ($10/mo) + 5x Lyft points", maxValue: 120 },
        { id: "doordash_restaurant", label: "DoorDash Restaurant Credit ($5/mo)", maxValue: 60 },
        { id: "doordash_nonrestaurant", label: "DoorDash Non-Restaurant Credit ($10/mo)", maxValue: 120 },
        { id: "doordash_grocery", label: "DoorDash Grocery Credit ($20/mo)", maxValue: 240 },
        { id: "dashpass", label: "DashPass Membership", maxValue: 120 },
        { id: "priority_pass", label: "Priority Pass Select (estimated)", maxValue: 469 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck / NEXUS", maxValue: 120 },
        { id: "ihg_platinum", label: "IHG One Rewards Platinum Elite", maxValue: 100 },
        { id: "points_boost", label: "Points Boost (up to 2x value redemptions)", maxValue: 0 },
        { id: "rental_insurance", label: "Primary Rental Car Insurance (est.)", maxValue: 100 },
        { id: "trip_protection", label: "Trip Cancellation/Interruption Insurance", maxValue: 0 },
      ],
    },
    { id: "chase_sapphire_pref", name: "Chase Sapphire Preferred", logo: "💠", color: "#004977", accent: "#1A1F36", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "5x travel via Chase, 3x dining/streaming, $50 hotel credit", annualFee: 95, bonusCategories: { flights: 2, hotels: 5, dining: 3, other: 1 },
      benefits: [
        { id: "hotel_credit", label: "Chase Hotel Credit", maxValue: 50 },
        { id: "doordash_credit", label: "DoorDash Credit", maxValue: 60 },
        { id: "anniversary_points", label: "10% Anniversary Points", maxValue: 50 },
      ],
    },
    { id: "cap1_venturex", name: "Capital One Venture X", logo: "🚀", color: "#D03027", accent: "#1A1F36", unit: "Miles", loginUrl: "https://myaccounts.capitalone.com/", perks: "2x everything, 10x hotels/cars via Capital One, $300 travel credit", annualFee: 395, bonusCategories: { flights: 2, hotels: 10, dining: 2, other: 2 },
      benefits: [
        { id: "travel_credit", label: "Capital One Travel Credit (portal only)", maxValue: 300 },
        { id: "anniversary_miles", label: "10,000 Anniversary Bonus Miles", maxValue: 100 },
        { id: "capone_lounges", label: "Capital One Lounge Access (incl. authorized users)", maxValue: 300 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 300 },
        { id: "plaza_premium", label: "Plaza Premium Network Access", maxValue: 100 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "hertz_pc", label: "Hertz President's Circle Status", maxValue: 100 },
        { id: "rental_insurance", label: "Primary Rental Car Insurance", maxValue: 100 },
        { id: "cell_protection", label: "Cell Phone Protection", maxValue: 50 },
      ],
    },
    { id: "cap1_venture", name: "Capital One Venture", logo: "🗺️", color: "#D03027", accent: "#FFFFFF", unit: "Miles", loginUrl: "https://myaccounts.capitalone.com/", perks: "2x on every purchase, transfer to 15+ partners", annualFee: 95, bonusCategories: { flights: 2, hotels: 2, dining: 2, other: 2 },
      benefits: [
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 100 },
      ],
    },
    { id: "citi_premier", name: "Citi Premier", logo: "🏦", color: "#003B70", accent: "#0066CC", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "3x travel/gas/restaurants/supermarkets, transfer to AA", annualFee: 95, bonusCategories: { flights: 3, hotels: 3, dining: 3, other: 1 },
      benefits: [
        { id: "hotel_credit", label: "Annual Hotel Credit", maxValue: 100 },
      ],
    },
    { id: "bilt", name: "Bilt Mastercard", logo: "🏠", color: "#000000", accent: "#E0E0E0", unit: "Bilt Points", loginUrl: "https://app.biltrewards.com/", perks: "Points on rent, 3x dining, 2x travel, Hyatt/AA transfers", annualFee: 0, bonusCategories: { flights: 2, hotels: 2, dining: 3, other: 1 }, benefits: [] },
    { id: "delta_reserve", name: "Delta Reserve Amex", logo: "🔺", color: "#003366", accent: "#B4B4B4", unit: "SkyMiles", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "3x Delta, Sky Club access, companion cert, Medallion boost", annualFee: 650, bonusCategories: { flights: 3, dining: 1, other: 1 },
      benefits: [
        { id: "sky_club", label: "Delta Sky Club Access (15 visits/yr)", maxValue: 695 },
        { id: "companion_cert", label: "Companion Certificate (Domestic First/CP/MC)", maxValue: 400 },
        { id: "resy_credit", label: "Resy Dining Credit ($20/mo)", maxValue: 240 },
        { id: "rideshare_credit", label: "Rideshare Credit ($10/mo)", maxValue: 120 },
        { id: "mqd_boost", label: "MQD Headstart / Boost (est.)", maxValue: 250 },
        { id: "first_bag", label: "Free Checked Bag (first)", maxValue: 140 },
        { id: "priority_boarding", label: "Main Cabin 1 Priority Boarding", maxValue: 0 },
        { id: "stays_credit", label: "Hotel Stays Booking Credit (via Amex Travel)", maxValue: 200 },
      ],
    },
    { id: "delta_gold", name: "Delta Gold Amex", logo: "🔺", color: "#C5993C", accent: "#003366", unit: "SkyMiles", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "2x Delta/restaurants, free checked bag, priority boarding", annualFee: 150, bonusCategories: { flights: 2, dining: 2, other: 1 },
      benefits: [
        { id: "free_bag", label: "Free Checked Bag", maxValue: 140 },
        { id: "resy_credit", label: "Resy Dining Credit", maxValue: 100 },
        { id: "rideshare_credit", label: "Rideshare Credit", maxValue: 120 },
      ],
    },
    { id: "united_club", name: "United Club Infinite Card", logo: "🌐", color: "#002244", accent: "#B4B4B4", unit: "MileagePlus Miles", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "5x United (11x on flights total), 2x other travel, United Club membership, 1,500 PQP head start, $875+ in partner credits", annualFee: 695, bonusCategories: { flights: 5, hotels: 2, dining: 1, other: 1 },
      benefits: [
        { id: "united_club", label: "United Club Membership", maxValue: 750 },
        { id: "free_bags", label: "Free Checked Bags (2 pax)", maxValue: 280 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "ihg_platinum", label: "IHG Platinum Elite Status", maxValue: 100 },
        { id: "pqp_head_start", label: "1,500 PQP Head Start", maxValue: 200 },
        { id: "renowned_hotels_credit", label: "Renowned Hotels Credit", maxValue: 150 },
        { id: "instacart_credit", label: "Instacart Credit", maxValue: 180 },
        { id: "rideshare_credit", label: "Rideshare Credit", maxValue: 60 },
      ],
    },
    { id: "united_explorer", name: "United Explorer Card", logo: "🌐", color: "#0066CC", accent: "#002244", unit: "MileagePlus Miles", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "2x United/dining/hotels, free first checked bag, priority boarding, $500+ in JSX/Hotels/Rideshare/Instacart credits", annualFee: 150, bonusCategories: { flights: 2, dining: 2, other: 1 },
      benefits: [
        { id: "free_bag", label: "Free Checked Bag", maxValue: 140 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "united_club_passes", label: "2 United Club Passes", maxValue: 118 },
        { id: "jsx_credit", label: "JSX Credit", maxValue: 150 },
        { id: "united_hotels_credit", label: "United Hotels Credit", maxValue: 100 },
        { id: "rideshare_credit", label: "Rideshare Credit", maxValue: 60 },
        { id: "instacart_credit", label: "Instacart Credit", maxValue: 180 },
      ],
    },
    { id: "aa_exec", name: "Citi AAdvantage Executive", logo: "—", color: "#0078D2", accent: "#003B70", unit: "AAdvantage Miles", loginUrl: "https://www.citi.com/login", perks: "Admirals Club, 4x AA/hotels, companion cert, Global Entry", annualFee: 595, bonusCategories: { flights: 4, hotels: 4, dining: 1, other: 1 },
      benefits: [
        { id: "admirals_club", label: "Admirals Club Membership", maxValue: 850 },
        { id: "free_bags", label: "Free Checked Bags", maxValue: 140 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "avis_hertz", label: "Avis / Hertz Status", maxValue: 100 },
      ],
    },
    { id: "marriott_boundless", name: "Marriott Bonvoy Boundless", logo: "—", color: "#7C2529", accent: "#B5985A", unit: "Bonvoy Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "6x Marriott, free night award annually, auto Silver Elite", annualFee: 95, bonusCategories: { flights: 2, hotels: 6, dining: 2, other: 1 },
      benefits: [
        { id: "free_night", label: "Anniversary Free Night (35k)", maxValue: 300 },
        { id: "silver_status", label: "Silver Elite Status", maxValue: 50 },
      ],
    },
    { id: "ritz_carlton", name: "Ritz-Carlton Credit Card", logo: "—", color: "#1C1C1C", accent: "#C6A96C", unit: "Bonvoy Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "6x Marriott, auto Gold Elite (Platinum at $75k spend), $300 travel credit, Priority Pass, free night", annualFee: 450, bonusCategories: { flights: 3, hotels: 6, dining: 3, other: 1 },
      benefits: [
        { id: "travel_credit", label: "Annual Travel Credit", maxValue: 300 },
        { id: "free_night", label: "Anniversary Free Night (85k)", maxValue: 500 },
        { id: "gold_status", label: "Gold Elite Status (Platinum at $75k spend)", maxValue: 100 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 200 },
      ],
    },
    { id: "hilton_aspire", name: "Hilton Honors Aspire", logo: "🌟", color: "#003B5C", accent: "#FFD700", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "14x Hilton, auto Diamond, resort/flights/CLEAR credits, free night", annualFee: 550, bonusCategories: { flights: 7, hotels: 14, dining: 7, other: 3 },
      benefits: [
        { id: "resort_credit", label: "Hilton Resort Credit ($200 × 2 semi-annual)", maxValue: 400 },
        { id: "flights_credit", label: "Airline/Flights Credit ($50 × 4 quarterly)", maxValue: 200 },
        { id: "clear_credit", label: "CLEAR Plus Membership", maxValue: 209 },
        { id: "free_night", label: "Anniversary Free Night Reward", maxValue: 800 },
        { id: "diamond_status", label: "Hilton Honors Diamond Status", maxValue: 500 },
        { id: "weekend_night", label: "2nd Free Night After $30k Spend", maxValue: 400 },
      ],
    },
    { id: "hilton_surpass", name: "Hilton Honors Surpass", logo: "🌟", color: "#0099CC", accent: "#003B5C", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "12x Hilton, auto Gold, free night after $15k spend", annualFee: 150, bonusCategories: { flights: 6, hotels: 12, dining: 6, other: 3 },
      benefits: [
        { id: "free_night", label: "Free Night After $15k Spend", maxValue: 300 },
        { id: "gold_status", label: "Gold Elite Status", maxValue: 100 },
      ],
    },
    { id: "hyatt_card", name: "World of Hyatt Credit Card", logo: "🏛️", color: "#1C4B82", accent: "#D4A553", unit: "World of Hyatt Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "4x Hyatt, auto Discoverist, free night annually, bonus nights", annualFee: 95, bonusCategories: { flights: 2, hotels: 4, dining: 2, other: 1 },
      benefits: [
        { id: "free_night", label: "Anniversary Free Night (Cat 1-4)", maxValue: 250 },
        { id: "discoverist_status", label: "Discoverist Status", maxValue: 50 },
      ],
    },
    { id: "ihg_premier", name: "IHG One Rewards Premier", logo: "🔑", color: "#2E1A47", accent: "#B4B4B4", unit: "IHG Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "10x IHG, 4th night free, auto Platinum, Global Entry", annualFee: 99, bonusCategories: { flights: 2, hotels: 10, dining: 2, other: 1 },
      benefits: [
        { id: "free_night", label: "Anniversary Free Night (40k)", maxValue: 250 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 100 },
        { id: "platinum_status", label: "IHG Platinum Status", maxValue: 100 },
      ],
    },
    { id: "sw_priority", name: "Southwest Priority Card", logo: "❤️", color: "#304CB2", accent: "#FFBF27", unit: "Rapid Rewards Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Southwest, $75 travel credit, 7,500 anniversary points, 4 upgraded boardings", annualFee: 229, bonusCategories: { flights: 3, dining: 2, other: 1 },
      benefits: [
        { id: "travel_credit", label: "Annual SW Travel Credit", maxValue: 75 },
        { id: "anniversary_points", label: "7,500 Anniversary Points", maxValue: 110 },
        { id: "upgraded_boardings", label: "4 Upgraded Boardings/yr", maxValue: 160 },
      ],
    },
    { id: "atmos_summit", name: "Atmos Rewards Summit Visa Infinite", logo: "🏔️", color: "#01426A", accent: "#64CCC9", unit: "Atmos Points", loginUrl: "https://www.alaskaair.com/account/overview", perks: "3x Alaska/Hawaiian, Global Companion Award, status boost", annualFee: 250, bonusCategories: { flights: 3, dining: 2, other: 1 },
      benefits: [
        { id: "companion_award", label: "Global Companion Award", maxValue: 250 },
        { id: "free_bags", label: "Free Checked Bags", maxValue: 140 },
        { id: "status_boost", label: "Elite Qualifying Mile Boost", maxValue: 100 },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // Expanded US card lineup (Apr 2026 — see programs.js notes for confidence)
    // ══════════════════════════════════════════════════════════

    // ── Chase: business + no-fee + cobranded ──
    { id: "chase_ink_preferred", name: "Chase Ink Business Preferred", logo: "💼", color: "#1A1F36", accent: "#004977", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x travel/shipping/internet/advertising up to $150k/yr, transfers to UR partners", annualFee: 95, bonusCategories: { flights: 3, hotels: 3, dining: 1, other: 1 },
      benefits: [
        { id: "cell_protection", label: "Cell Phone Protection ($1,000/claim)", maxValue: 100 },
        { id: "trip_protection", label: "Trip Cancellation/Interruption Insurance", maxValue: 0 },
      ],
    },
    { id: "chase_ink_cash", name: "Chase Ink Business Cash", logo: "💼", color: "#004977", accent: "#1A1F36", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "5x office supply/internet/cable/phone up to $25k/yr, 2x dining/gas to $25k/yr", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 2, other: 1 }, benefits: [] },
    { id: "chase_ink_unlimited", name: "Chase Ink Business Unlimited", logo: "💼", color: "#1A1F36", accent: "#004977", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "1.5x on every business purchase, no annual fee, transfers to UR partners when paired", annualFee: 0, bonusCategories: { flights: 1.5, hotels: 1.5, dining: 1.5, other: 1.5 }, benefits: [] },
    { id: "chase_freedom_unlimited", name: "Chase Freedom Unlimited", logo: "💳", color: "#004977", accent: "#1A1F36", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "1.5% on everything, 3% dining/drugstores, 5% Chase Travel; pairs with Sapphire for transfers", annualFee: 0, bonusCategories: { flights: 1.5, hotels: 5, dining: 3, other: 1.5 }, benefits: [] },
    { id: "chase_freedom_flex", name: "Chase Freedom Flex", logo: "💳", color: "#1A1F36", accent: "#004977", unit: "Ultimate Rewards", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "5% rotating quarterly categories ($1,500/qtr), 5% Chase Travel, 3% dining/drugstores", annualFee: 0, bonusCategories: { flights: 1, hotels: 5, dining: 3, other: 1 }, benefits: [] },
    { id: "united_quest", name: "United Quest Card", logo: "🌐", color: "#004977", accent: "#0066CC", unit: "MileagePlus Miles", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x United, 2x travel/dining/streaming, $200 United credit, 10k-mile award flight discount, 2 free bags, $100 rideshare", annualFee: 350, bonusCategories: { flights: 3, dining: 2, other: 1 },
      benefits: [
        { id: "united_credit", label: "$200 United Travel Credit", maxValue: 200 },
        { id: "award_flight_discount", label: "10,000-Mile Award Flight Discount", maxValue: 150 },
        { id: "free_bags", label: "Free Checked Bags (2 pax)", maxValue: 280 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "rideshare_credit", label: "$100 Annual Rideshare Credit", maxValue: 100 },
      ],
    },
    { id: "ba_visa", name: "British Airways Visa Signature", logo: "🇬🇧", color: "#075AAA", accent: "#EB2226", unit: "Avios", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x BA, Iberia, Aer Lingus, 2x hotel/car/restaurant, Travel Together Ticket at $30k spend", annualFee: 95, bonusCategories: { flights: 3, hotels: 2, dining: 2, other: 1 },
      benefits: [
        { id: "travel_together", label: "Travel Together Ticket (companion fare with $30k spend)", maxValue: 1500 },
      ],
    },
    { id: "aer_lingus_visa", name: "Aer Lingus Visa Signature", logo: "☘️", color: "#0E4F1F", accent: "#FFFFFF", unit: "Avios", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Aer Lingus/BA/Iberia, Aer Lingus Companion Ticket at $30k spend, transfers via BA", annualFee: 95, bonusCategories: { flights: 3, hotels: 2, dining: 2, other: 1 },
      benefits: [
        { id: "companion_ticket", label: "Aer Lingus Companion Ticket ($30k spend)", maxValue: 1200 },
      ],
    },
    { id: "iberia_visa", name: "Iberia Visa Signature", logo: "🇪🇸", color: "#CC0000", accent: "#FFD700", unit: "Avios", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Iberia/BA/Aer Lingus, Iberia Companion Pass at $30k spend, transfers within Avios family", annualFee: 95, bonusCategories: { flights: 3, hotels: 2, dining: 2, other: 1 },
      benefits: [
        { id: "companion_pass", label: "Iberia Companion Pass ($30k spend)", maxValue: 1200 },
      ],
    },
    { id: "chase_aeroplan", name: "Chase Aeroplan Card", logo: "🍁", color: "#D6212B", accent: "#1A1F36", unit: "Aeroplan Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Air Canada/dining/grocery, 1st free checked bag on AC, up to 25k SQC bonus tiered, 35K status at $75k spend", annualFee: 95, bonusCategories: { flights: 3, hotels: 1, dining: 3, other: 1 },
      benefits: [
        { id: "free_checked_bag", label: "Free 1st Checked Bag on Air Canada", maxValue: 140 },
        { id: "aeroplan_sqc_tiered", label: "Up to 25,000 Status Qualifying Credits (5k base + tiers at $25k/$50k spend)", maxValue: 400 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
      ],
    },
    { id: "marriott_bold", name: "Marriott Bonvoy Bold", logo: "—", color: "#7C2529", accent: "#B5985A", unit: "Bonvoy Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "3x Marriott, 2x travel, no annual fee, auto Silver Elite", annualFee: 0, bonusCategories: { flights: 2, hotels: 3, dining: 1, other: 1 },
      benefits: [
        { id: "silver_status", label: "Silver Elite Status", maxValue: 50 },
      ],
    },
    { id: "hyatt_business", name: "World of Hyatt Business Card", logo: "💼", color: "#1C4B82", accent: "#D4A553", unit: "World of Hyatt Points", loginUrl: "https://www.chase.com/personal/credit-cards/login-account-access", perks: "4x Hyatt + 9x bonus on top tier, 2x dining/transit/etc, $50 Hyatt credit semi-annually", annualFee: 199, bonusCategories: { flights: 2, hotels: 4, dining: 2, other: 1 },
      benefits: [
        { id: "hyatt_credit", label: "Hyatt Stay Credit ($50 × 2)", maxValue: 100 },
        { id: "discoverist_status", label: "Discoverist Status", maxValue: 50 },
      ],
    },

    // ── Amex: hotel + business + no-fee ──
    { id: "amex_marriott_brilliant", name: "Marriott Bonvoy Brilliant Amex", logo: "🌟", color: "#B5985A", accent: "#7C2529", unit: "Bonvoy Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "6x Marriott, 3x dining/flights, $25 monthly dining credit, 85k free night, auto Platinum Elite", annualFee: 650, bonusCategories: { flights: 3, hotels: 6, dining: 3, other: 2 },
      benefits: [
        { id: "free_night", label: "Anniversary Free Night (85k)", maxValue: 600 },
        { id: "dining_credit", label: "Dining Credit ($25/mo)", maxValue: 300 },
        { id: "platinum_status", label: "Platinum Elite Status", maxValue: 200 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 100 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 200 },
      ],
    },
    { id: "amex_marriott_bevy", name: "Marriott Bonvoy Bevy Amex", logo: "—", color: "#7C2529", accent: "#C6A96C", unit: "Bonvoy Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "6x Marriott, 4x dining/groceries, 2x travel, 50k free night annually", annualFee: 250, bonusCategories: { flights: 2, hotels: 6, dining: 4, other: 2 },
      benefits: [
        { id: "free_night", label: "Anniversary Free Night (50k after $15k spend)", maxValue: 350 },
        { id: "gold_status", label: "Gold Elite Status", maxValue: 100 },
      ],
    },
    { id: "amex_biz_plat", name: "Amex Business Platinum", logo: "💼", color: "#1A1A1A", accent: "#006FCF", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "5x flights/prepaid hotels via Amex Travel, 1.5x large purchases, $360 Indeed + $250 Adobe + $200 airline + Dell credits", annualFee: 695, bonusCategories: { flights: 5, hotels: 5, dining: 1, other: 1 },
      benefits: [
        { id: "airline_credit", label: "Airline Incidental Credit", maxValue: 200 },
        { id: "dell_credit", label: "Dell Credit ($150 base + up to $1k after $5k spend)", maxValue: 400 },
        { id: "indeed_credit", label: "Indeed Credit ($90/qtr)", maxValue: 360 },
        { id: "adobe_credit", label: "Adobe Credit ($250 after $600 spend)", maxValue: 250 },
        { id: "wireless_credit", label: "Wireless Credit ($120 once + $10/mo)", maxValue: 240 },
        { id: "hilton_gold", label: "Hilton Gold Status", maxValue: 150 },
        { id: "marriott_gold", label: "Marriott Gold Status", maxValue: 150 },
        { id: "centurion_lounge", label: "Centurion Lounge Access", maxValue: 500 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 300 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 100 },
      ],
    },
    { id: "amex_biz_gold", name: "Amex Business Gold", logo: "💼", color: "#C5993C", accent: "#1A1A1A", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "4x on top 2 of 6 categories ($150k cap), $20/mo Walmart+ + $20/mo flexible business credit", annualFee: 375, bonusCategories: { flights: 4, dining: 4, other: 1 },
      benefits: [
        { id: "flex_credit", label: "Flexible Business Credit ($20/mo)", maxValue: 240 },
        { id: "walmart_credit", label: "Walmart+ Credit ($12.95/mo)", maxValue: 155 },
      ],
    },
    { id: "hilton_no_fee", name: "Hilton Honors Amex (No Annual Fee)", logo: "🏨", color: "#003B5C", accent: "#FFFFFF", unit: "Hilton Honors Points", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "7x Hilton, 5x dining/groceries/gas, 3x other, auto Silver Elite, no annual fee", annualFee: 0, bonusCategories: { flights: 3, hotels: 7, dining: 5, other: 3 },
      benefits: [
        { id: "silver_status", label: "Silver Elite Status", maxValue: 50 },
      ],
    },
    { id: "amex_blue_cash_pref", name: "Amex Blue Cash Preferred", logo: "💵", color: "#0066CC", accent: "#FFFFFF", unit: "Cash Back", loginUrl: "https://www.americanexpress.com/en-us/account/login", perks: "6% groceries (up to $6k/yr) + select streaming, 3% transit/gas, 1% other", annualFee: 95, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "disney_credit", label: "Disney Bundle Credit ($10/mo with eligible subscription)", maxValue: 120 },
      ],
    },

    // ── Citi: new lineup ──
    { id: "citi_strata_elite", name: "Citi Strata Elite", logo: "🏦", color: "#003B70", accent: "#C8A951", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "12x hotels/cars/attractions via Citi Travel, 6x restaurants Citi Nights (Fri/Sat 6PM-6AM), 3x flights/restaurants other times, 1.5x other", annualFee: 595, bonusCategories: { flights: 3, hotels: 12, dining: 3, other: 1.5 },
      benefits: [
        { id: "hotel_credit", label: "$300 Annual Hotel Benefit (cititravel.com, 2+ nights)", maxValue: 300 },
        { id: "splurge_credit", label: "$200 Splurge Credit", maxValue: 200 },
        { id: "blacklane", label: "Blacklane Chauffeur Credit", maxValue: 200 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "admirals_passes", label: "4 Admirals Club Passes", maxValue: 320 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 469 },
      ],
    },
    { id: "citi_strata_premier", name: "Citi Strata Premier", logo: "🏦", color: "#003B70", accent: "#0066CC", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "10x hotels/cars/attractions via Citi Travel, 3x flights/gas/dining/groceries/EV charging", annualFee: 95, bonusCategories: { flights: 3, hotels: 10, dining: 3, other: 1 },
      benefits: [
        { id: "hotel_credit", label: "Annual Hotel Credit ($500 stay)", maxValue: 100 },
      ],
    },
    { id: "citi_double_cash", name: "Citi Double Cash", logo: "💵", color: "#003B70", accent: "#C8A951", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "1% when you buy + 1% when you pay = effectively 2% on everything, no annual fee", annualFee: 0, bonusCategories: { flights: 2, hotels: 2, dining: 2, other: 2 }, benefits: [] },
    { id: "citi_custom_cash", name: "Citi Custom Cash", logo: "💵", color: "#0066CC", accent: "#003B70", unit: "ThankYou Points", loginUrl: "https://www.citi.com/login", perks: "5% on top spending category each cycle (up to $500), no annual fee", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 }, benefits: [] },
    { id: "aa_platinum_select", name: "Citi AAdvantage Platinum Select", logo: "—", color: "#0078D2", accent: "#003B70", unit: "AAdvantage Miles", loginUrl: "https://www.citi.com/login", perks: "2x AA/dining/gas, free first checked bag (up to 4 pax), preferred boarding, $125 AA flight discount at $20k spend", annualFee: 99, bonusCategories: { flights: 2, dining: 2, other: 1 },
      benefits: [
        { id: "free_bag", label: "Free Checked Bag (up to 4 pax)", maxValue: 280 },
        { id: "aa_flight_discount", label: "$125 AA Flight Discount (at $20k spend)", maxValue: 125 },
      ],
    },

    // ── Capital One ──
    { id: "cap1_savor", name: "Capital One Savor", logo: "🍴", color: "#D03027", accent: "#1A1F36", unit: "Cash Back", loginUrl: "https://myaccounts.capitalone.com/", perks: "3% dining/entertainment/groceries/streaming, no annual fee", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 3, other: 1 }, benefits: [] },
    { id: "cap1_venture_business", name: "Capital One Venture Business", logo: "💼", color: "#D03027", accent: "#FFFFFF", unit: "Miles", loginUrl: "https://myaccounts.capitalone.com/", perks: "2x miles on every business purchase, 5x hotels/cars via Capital One Travel", annualFee: 95, bonusCategories: { flights: 2, hotels: 5, dining: 2, other: 2 },
      benefits: [
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
      ],
    },

    // ── Barclays: cobranded ──
    { id: "jetblue_plus", name: "JetBlue Plus Card", logo: "🟦", color: "#0033A0", accent: "#FFFFFF", unit: "TrueBlue Points", loginUrl: "https://cards.barclaycardus.com/", perks: "6x JetBlue, 2x dining/groceries, free first bag, 5k anniversary points, Mosaic with $50k spend", annualFee: 99, bonusCategories: { flights: 6, dining: 2, other: 1 },
      benefits: [
        { id: "free_bag", label: "Free Checked Bag", maxValue: 100 },
        { id: "anniversary_points", label: "5,000 Anniversary Points", maxValue: 70 },
        { id: "anniversary_savings", label: "10% Points Back on Award Bookings", maxValue: 50 },
      ],
    },

    // ── Bilt: premium tier (Bilt Card 2.0, Feb 2026) ──
    { id: "bilt_palladium", name: "Bilt Palladium Card", logo: "🏠", color: "#000000", accent: "#C5993C", unit: "Bilt Points", loginUrl: "https://app.biltrewards.com/", perks: "1x rent/mortgage (up to 1.25x via app), 3x dining or grocery (choice, $25k cap), 2x other, 4% Bilt Cash everyday, $400 hotel credit, Priority Pass", annualFee: 495, bonusCategories: { flights: 2, hotels: 2, dining: 3, other: 2 },
      benefits: [
        { id: "hotel_credit", label: "$400 Annual Hotel Credit (semi-annual, 2-night min)", maxValue: 400 },
        { id: "bilt_cash", label: "$200 Bilt Cash", maxValue: 200 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
        { id: "priority_pass", label: "Priority Pass Select", maxValue: 469 },
      ],
    },

    // ── US Bank ──
    // Note: closed to new applications as of Dec 15, 2025.
    { id: "us_bank_altitude_reserve", name: "US Bank Altitude Reserve (legacy)", logo: "🏔️", color: "#0033A0", accent: "#C8A951", unit: "Altitude Points", loginUrl: "https://www.usbank.com/login.html", perks: "3x mobile wallet (capped $5k/cycle) + travel, $325 US Bank Travel Center credit, Priority Pass (8 visits)", annualFee: 400, bonusCategories: { flights: 3, hotels: 3, dining: 1, other: 1 },
      benefits: [
        { id: "travel_credit", label: "$325 US Bank Travel Center Credit", maxValue: 325 },
        { id: "priority_pass", label: "Priority Pass Select (8 visits/yr free)", maxValue: 260 },
        { id: "global_entry", label: "Global Entry / TSA PreCheck", maxValue: 120 },
      ],
    },

    // ══════════════════════════════════════════════
    // ── CANADA ──
    // ══════════════════════════════════════════════
    { id: "td_aeroplan_visa_inf", country: "ca", name: "TD Aeroplan Visa Infinite", logo: "🍁", color: "#2D8A3E", accent: "#D6212B", unit: "Aeroplan Points", loginUrl: "https://easyweb.td.com/", perks: "1.5x Air Canada/grocery/dining, free first checked bag, $100 NEXUS rebate (every 48mo), no FX on AC purchases", annualFee: 139, bonusCategories: { flights: 1.5, hotels: 1, dining: 1.5, other: 1 },
      benefits: [
        { id: "free_checked_bag", label: "Free 1st Checked Bag on Air Canada", maxValue: 140 },
        { id: "nexus_rebate", label: "NEXUS Application Rebate (every 48mo)", maxValue: 100 },
        { id: "buddy_pass", label: "Buddy Pass after $7,500 spend", maxValue: 200 },
      ],
    },
    { id: "td_aeroplan_visa_priv", country: "ca", name: "TD Aeroplan Visa Infinite Privilege", logo: "🍁", color: "#1A1F36", accent: "#D6212B", unit: "Aeroplan Points", loginUrl: "https://easyweb.td.com/", perks: "2x Air Canada, 1.5x grocery/dining, unlimited Maple Leaf Lounge access + 6 DragonPass passes, 50K status fast-track", annualFee: 599, bonusCategories: { flights: 2, hotels: 1, dining: 1.5, other: 1.25 },
      benefits: [
        { id: "ac_status_25k", label: "Aeroplan 25K Status (auto)", maxValue: 400 },
        { id: "maple_leaf_unlimited", label: "Unlimited Maple Leaf Lounge Access", maxValue: 600 },
        { id: "dragonpass", label: "6 DragonPass Lounge Passes", maxValue: 240 },
        { id: "free_checked_bag", label: "Free 1st Checked Bag on Air Canada", maxValue: 140 },
        { id: "worldwide_companion", label: "Annual Worldwide Companion Pass", maxValue: 800 },
      ],
    },
    { id: "cibc_aeroplan_visa_inf", country: "ca", name: "CIBC Aeroplan Visa Infinite", logo: "🍁", color: "#C8102E", accent: "#1A1F36", unit: "Aeroplan Points", loginUrl: "https://www.cibc.com/en/personal-banking/online-banking/sign-in.html", perks: "1.5x Air Canada/grocery/dining/gas, free first checked bag on AC, NEXUS rebate", annualFee: 139, bonusCategories: { flights: 1.5, hotels: 1, dining: 1.5, other: 1 },
      benefits: [
        { id: "free_checked_bag", label: "Free 1st Checked Bag on Air Canada", maxValue: 140 },
        { id: "nexus_rebate", label: "NEXUS Application Rebate", maxValue: 50 },
      ],
    },
    { id: "cibc_aeroplan_visa_priv", country: "ca", name: "CIBC Aeroplan Visa Infinite Privilege", logo: "🍁", color: "#7C2529", accent: "#D6212B", unit: "Aeroplan Points", loginUrl: "https://www.cibc.com/en/personal-banking/online-banking/sign-in.html", perks: "2x Air Canada, unlimited Maple Leaf Lounge + AC Café access (with same-day AC ticket) + 6 DragonPass passes, 25K status auto", annualFee: 599, bonusCategories: { flights: 2, hotels: 1, dining: 1.5, other: 1.25 },
      benefits: [
        { id: "ac_status_25k", label: "Aeroplan 25K Status (auto)", maxValue: 400 },
        { id: "maple_leaf_unlimited", label: "Unlimited Maple Leaf Lounge & AC Café Access (same-day AC ticket)", maxValue: 600 },
        { id: "dragonpass", label: "6 DragonPass Lounge Passes", maxValue: 240 },
        { id: "free_checked_bag", label: "Free 1st Checked Bag on Air Canada", maxValue: 140 },
        { id: "worldwide_companion", label: "Annual Worldwide Companion Pass (from $99)", maxValue: 800 },
      ],
    },
    { id: "amex_aeroplan_reserve_ca", country: "ca", name: "American Express Aeroplan Reserve", logo: "🍁", color: "#1A1F36", accent: "#D6212B", unit: "Aeroplan Points", loginUrl: "https://www.americanexpress.com/ca/", perks: "3x Air Canada, 2x dining/travel, unlimited Maple Leaf Lounge access, 50K status fast-track, $200 AC credit", annualFee: 599, bonusCategories: { flights: 3, hotels: 2, dining: 2, other: 1.25 },
      benefits: [
        { id: "ac_status_50k", label: "Aeroplan 50K Status fast-track ($25k spend)", maxValue: 800 },
        { id: "maple_leaf_unlimited", label: "Unlimited Maple Leaf Lounge Access", maxValue: 600 },
        { id: "ac_travel_credit", label: "$200 Air Canada Travel Credit", maxValue: 200 },
        { id: "worldwide_companion", label: "Annual Worldwide Companion Pass", maxValue: 800 },
      ],
    },
    { id: "amex_cobalt", country: "ca", name: "American Express Cobalt Card", logo: "💠", color: "#005EB8", accent: "#1A1F36", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/ca/", perks: "5x grocery/dining/food delivery, 3x streaming, 2x travel/transit, monthly 2,500 bonus pts at $500 spend", annualFee: 192, bonusCategories: { flights: 2, hotels: 2, dining: 5, other: 1 },
      benefits: [
        { id: "monthly_bonus", label: "30,000 MR/yr at $500/mo spend", maxValue: 600 },
        { id: "amex_offers", label: "Amex Offers", maxValue: 200 },
      ],
    },
    { id: "amex_platinum_ca", country: "ca", name: "American Express Platinum (Canada)", logo: "🟦", color: "#1A1F36", accent: "#D4AF37", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/ca/", perks: "3x dining, 2x travel, $200 AC + $200 hotel + $200 dining + $240 Instacart credits, Plaza Premium/Priority Pass (tiered), NEXUS", annualFee: 799, bonusCategories: { flights: 2, hotels: 2, dining: 3, other: 1.25 },
      benefits: [
        { id: "ac_credit", label: "$200 Air Canada Travel Credit", maxValue: 200 },
        { id: "hotel_credit", label: "$200 Hotel Credit (Hotels & Resorts)", maxValue: 200 },
        { id: "dining_credit", label: "$200 Annual Dining Credit", maxValue: 200 },
        { id: "instacart_credit", label: "$240 Instacart Credit ($10 × 2/mo)", maxValue: 240 },
        { id: "lounge_access", label: "Plaza Premium + Priority Pass (unlimited at $20k spend, otherwise 6+6 visits)", maxValue: 600 },
        { id: "nexus_rebate", label: "NEXUS Application Rebate", maxValue: 50 },
      ],
    },
    { id: "amex_gold_rewards_ca", country: "ca", name: "American Express Gold Rewards (Canada)", logo: "🟨", color: "#B5985A", accent: "#1A1F36", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/ca/", perks: "2x grocery/gas/drug/travel, 1x everywhere, transfer to AC Aeroplan/Avios/Marriott", annualFee: 250, bonusCategories: { flights: 2, hotels: 2, dining: 2, other: 1 },
      benefits: [
        { id: "anniversary_bonus", label: "15,000 MR Anniversary Bonus ($15k spend)", maxValue: 300 },
        { id: "amex_offers", label: "Amex Offers", maxValue: 200 },
      ],
    },
    { id: "rbc_avion_visa_inf", country: "ca", name: "RBC Avion Visa Infinite", logo: "🇨🇦", color: "#0051A5", accent: "#FFD200", unit: "Avion Points", loginUrl: "https://www.rbcroyalbank.com/", perks: "1.25x travel, 1x everywhere, transfer to Avios/American/Cathay/WestJet, Petro-Canada 3¢/L savings", annualFee: 120, bonusCategories: { flights: 1.25, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "transfer_partners", label: "Transfer to BA/AA/Cathay/WestJet", maxValue: 200 },
        { id: "petro_canada", label: "Petro-Canada 3¢/L Savings + DashPass", maxValue: 120 },
      ],
    },
    { id: "rbc_avion_priv", country: "ca", name: "RBC Avion Visa Infinite Privilege", logo: "🇨🇦", color: "#1A1F36", accent: "#FFD200", unit: "Avion Points", loginUrl: "https://www.rbcroyalbank.com/", perks: "1.25x base + portal multipliers via Avion Rewards, 6 DragonPass passes ($375 value), transfers to Avios/AA/Cathay/WestJet", annualFee: 399, bonusCategories: { flights: 1.25, hotels: 1.25, dining: 1.25, other: 1.25 },
      benefits: [
        { id: "lounge_passes", label: "DragonPass Lounge Passes (6)", maxValue: 375 },
        { id: "transfer_partners", label: "Transfer to BA/AA/Cathay/WestJet", maxValue: 300 },
        { id: "fast_track", label: "Airport Security Fast-Track + Dedicated Parking", maxValue: 150 },
      ],
    },
    { id: "bmo_eclipse_visa_inf", country: "ca", name: "BMO eclipse Visa Infinite", logo: "🇨🇦", color: "#0079C1", accent: "#1A1F36", unit: "BMO Rewards", loginUrl: "https://www1.bmo.com/onlinebanking/cgi-bin/netbnx/NBmain", perks: "5x dining/grocery/gas/transit, 1x other, 10% bonus when adding authorized user, $50 lifestyle credit", annualFee: 120, bonusCategories: { flights: 1, hotels: 1, dining: 5, other: 1 },
      benefits: [
        { id: "lifestyle_credit", label: "$50 Annual Lifestyle Credit", maxValue: 50 },
        { id: "auth_user_bonus", label: "10% bonus on all spend (auth user)", maxValue: 200 },
      ],
    },
    { id: "scotia_gold_amex", country: "ca", name: "Scotiabank Gold American Express", logo: "🇨🇦", color: "#EE3124", accent: "#1A1F36", unit: "Scene+ Points", loginUrl: "https://www.scotiabank.com/ca/en/personal/scotia-online-banking.html", perks: "6x at Sobeys-family grocers, 5x other grocery/dining/delivery, 3x gas/transit/streaming, no FX fees, transfers to AC Aeroplan", annualFee: 120, bonusCategories: { flights: 1, hotels: 1, dining: 5, other: 1 },
      benefits: [
        { id: "no_fx_fees", label: "No Foreign Transaction Fees", maxValue: 250 },
        { id: "aeroplan_transfer", label: "Transfer to Aeroplan", maxValue: 150 },
      ],
    },
    { id: "scotia_passport_visa_inf", country: "ca", name: "Scotiabank Passport Visa Infinite +Card", logo: "🇨🇦", color: "#003366", accent: "#EE3124", unit: "Scene+ Points", loginUrl: "https://www.scotiabank.com/ca/en/personal/scotia-online-banking.html", perks: "3x grocery/dining/entertainment/transit, 2x gas/streaming, no FX fees, 6 lounge passes via Visa Airport Companion, 10K bonus at $40k spend", annualFee: 150, bonusCategories: { flights: 1, hotels: 1, dining: 3, other: 1 },
      benefits: [
        { id: "lounge_passes", label: "6 Lounge Passes (Visa Airport Companion)", maxValue: 240 },
        { id: "no_fx_fees", label: "No Foreign Transaction Fees", maxValue: 250 },
        { id: "spend_bonus", label: "10,000 Scene+ Bonus at $40k Annual Spend", maxValue: 100 },
      ],
    },
    { id: "westjet_rbc_world_elite", country: "ca", name: "WestJet RBC World Elite Mastercard", logo: "🇨🇦", color: "#0F8244", accent: "#1A1F36", unit: "WestJet Dollars", loginUrl: "https://www.rbcroyalbank.com/", perks: "2% WestJet, 1.5% non-WestJet, annual companion voucher ($119 Econo / $219 Premium), free first checked bag", annualFee: 139, bonusCategories: { flights: 2, hotels: 1.5, dining: 1.5, other: 1.5 },
      benefits: [
        { id: "companion_voucher", label: "Annual Companion Voucher", maxValue: 350 },
        { id: "free_checked_bag", label: "Free 1st Checked Bag on WestJet", maxValue: 120 },
      ],
    },

    // ══════════════════════════════════════════════
    // ── EUROPE / UK ──
    // ══════════════════════════════════════════════
    { id: "amex_plat_uk", country: "uk", name: "American Express Platinum (UK)", logo: "🟦", color: "#1A1F36", accent: "#D4AF37", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/uk/", perks: "5x flights via Amex Travel, 1x other, £200 dining (£100 UK + £100 abroad per 6mo), FHR access, Centurion + Priority Pass", annualFee: 650, bonusCategories: { flights: 5, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "dining_credit", label: "£200 Dining Credit (£100 UK + £100 abroad per 6mo)", maxValue: 260 },
        { id: "fhr_access", label: "Fine Hotels & Resorts Access (upgrade, breakfast, $100 property credit)", maxValue: 200 },
        { id: "centurion", label: "Centurion + Priority Pass Lounge Access", maxValue: 700 },
      ],
    },
    { id: "amex_gold_uk", country: "uk", name: "American Express Gold (UK)", logo: "🟨", color: "#B5985A", accent: "#1A1F36", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/uk/", perks: "3x flights via Amex Travel, 2x foreign spend, £120 Deliveroo credit, 4 Priority Pass passes/yr, THC access", annualFee: 195, bonusCategories: { flights: 3, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "deliveroo_credit", label: "£120 Deliveroo Credit (£10/mo)", maxValue: 156 },
        { id: "lounge_passes", label: "4 Priority Pass Visits / yr", maxValue: 130 },
      ],
    },
    { id: "amex_bapp", country: "uk", name: "British Airways Premium Plus Amex (UK)", logo: "🇬🇧", color: "#075AAA", accent: "#EB2226", unit: "Avios", loginUrl: "https://www.americanexpress.com/uk/", perks: "3x BA, 1.5x other, BA Premium Companion Voucher (Reward + Cash) at £15k spend, valid 2 years", annualFee: 300, bonusCategories: { flights: 3, hotels: 1.5, dining: 1.5, other: 1.5 },
      benefits: [
        { id: "premium_companion_voucher", label: "BA Premium Companion Voucher (£15k spend, valid 2 years)", maxValue: 2500 },
      ],
    },
    { id: "amex_ba_blue", country: "uk", name: "British Airways Amex (UK)", logo: "🇬🇧", color: "#075AAA", accent: "#FFFFFF", unit: "Avios", loginUrl: "https://www.americanexpress.com/uk/", perks: "1x Avios on every £1, BA Companion Voucher at £15k spend (Reward seats only), no annual fee", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "ba_companion_voucher", label: "BA Companion Voucher (£15k spend, Reward seats, valid 12mo)", maxValue: 800 },
      ],
    },
    { id: "barclaycard_avios_plus", country: "uk", name: "Barclaycard Avios Plus", logo: "🇬🇧", color: "#00AEEF", accent: "#EB2226", unit: "Avios", loginUrl: "https://www.barclaycard.co.uk/", perks: "1.5x Avios on every £1 (£20/mo fee), BA Cabin Upgrade Voucher OR 7,000 Avios at £10k spend, no FX fees", annualFee: 240, bonusCategories: { flights: 1.5, hotels: 1.5, dining: 1.5, other: 1.5 },
      benefits: [
        { id: "ba_upgrade_voucher", label: "BA Cabin Upgrade Voucher (or 7,000 Avios) at £10k spend", maxValue: 800 },
        { id: "no_fx_fees", label: "No Foreign Transaction Fees", maxValue: 250 },
      ],
    },
    { id: "barclaycard_avios", country: "uk", name: "Barclaycard Avios", logo: "🇬🇧", color: "#00AEEF", accent: "#1A1F36", unit: "Avios", loginUrl: "https://www.barclaycard.co.uk/", perks: "1x Avios per £1, BA Cabin Upgrade Voucher OR 7,000 Avios at £20k spend, no annual fee", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "ba_upgrade_voucher", label: "BA Cabin Upgrade Voucher (or 7,000 Avios) at £20k spend", maxValue: 600 },
      ],
    },
    { id: "amex_plat_de", country: "eu", name: "American Express Platinum (Germany)", logo: "🟦", color: "#1A1F36", accent: "#D4AF37", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/de/", perks: "1x MR base, €200 travel credit, €150 restaurant credit, €100 Lodenfrey retail, Centurion + Priority Pass, SIXT Platinum", annualFee: 720, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "travel_credit", label: "€200 Travel Credit", maxValue: 220 },
        { id: "dining_credit", label: "€150 Restaurant Credit", maxValue: 160 },
        { id: "retail_credit", label: "€100 Lodenfrey Retail Credit", maxValue: 110 },
        { id: "centurion", label: "Centurion + Priority Pass Lounge Access", maxValue: 700 },
      ],
    },
    { id: "amex_gold_de", country: "eu", name: "American Express Gold (Germany)", logo: "🟨", color: "#B5985A", accent: "#1A1F36", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/de/", perks: "1x MR base, transfer to Miles & More/Flying Blue/BA, mobility/travel/shopping credits, SIXT Gold", annualFee: 240, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "transfer_partners", label: "Transfer to Miles & More/Flying Blue/BA", maxValue: 200 },
      ],
    },
    { id: "lufthansa_gold_de", country: "eu", name: "Lufthansa Miles & More Gold Credit Card (DE)", logo: "✈️", color: "#05164D", accent: "#FFAD00", unit: "Miles & More", loginUrl: "https://www.miles-and-more-cards.com/de/de/private/karten.html", perks: "0.5 miles per €1 spend, miles never expire while card is active, annual Lufthansa Business Lounge voucher", annualFee: 138, bonusCategories: { flights: 0.5, hotels: 0.5, dining: 0.5, other: 0.5 },
      benefits: [
        { id: "no_expiry", label: "Miles Never Expire", maxValue: 300 },
        { id: "lufthansa_lounge_voucher", label: "Lufthansa Business Lounge Voucher (1/yr)", maxValue: 60 },
      ],
    },
    { id: "amex_flying_blue_fr", country: "eu", name: "Air France KLM American Express Silver (France)", logo: "🔵", color: "#002157", accent: "#00A1E0", unit: "Flying Blue Miles", loginUrl: "https://www.americanexpress.com/fr/", perks: "0.5 Flying Blue miles per €1 (post-Jan 2026 Silver tier), reduced to €65/yr if annual spend < €10k", annualFee: 252, bonusCategories: { flights: 0.5, hotels: 0.5, dining: 0.5, other: 0.5 },
      benefits: [
        { id: "xp_bonus", label: "5 XP per €5,000 spend (cap 80 XP)", maxValue: 100 },
      ],
    },
    { id: "hsbc_premier_world_elite_uk", country: "uk", name: "HSBC Premier World Elite Mastercard (UK)", logo: "🇬🇧", color: "#DB0011", accent: "#1A1F36", unit: "HSBC Premier Points", loginUrl: "https://www.hsbc.co.uk/", perks: "3x points per £1 sterling, 4x per £1 foreign, transfer to Avios/Etihad/Singapore, LoungeKey unlimited", annualFee: 290, bonusCategories: { flights: 3, hotels: 3, dining: 3, other: 3 },
      benefits: [
        { id: "loungekey", label: "LoungeKey Unlimited Lounge Access", maxValue: 500 },
        { id: "transfer_partners", label: "Transfer to Avios/Etihad/Singapore", maxValue: 200 },
      ],
    },
    { id: "amex_mr_credit_uk", country: "uk", name: "American Express Rewards Credit Card (UK)", logo: "💳", color: "#005EB8", accent: "#1A1F36", unit: "Membership Rewards", loginUrl: "https://www.americanexpress.com/uk/", perks: "1x MR per £1, no annual fee, transfer to BA/Virgin/Hilton/Marriott", annualFee: 0, bonusCategories: { flights: 1, hotels: 1, dining: 1, other: 1 },
      benefits: [
        { id: "transfer_partners", label: "Transfer to BA/Virgin/Hilton/Marriott", maxValue: 200 },
      ],
    },
    { id: "virgin_atlantic_reward_plus_uk", country: "uk", name: "Virgin Atlantic Reward+ Credit Card (UK)", logo: "🇬🇧", color: "#E10A0A", accent: "#1A1F36", unit: "Virgin Points", loginUrl: "https://www.virginmoney.com/", perks: "1.5 Virgin Points per £1 flat, Companion Voucher or Upgrade Voucher at £10k spend", annualFee: 160, bonusCategories: { flights: 1.5, hotels: 1.5, dining: 1.5, other: 1.5 },
      benefits: [
        { id: "companion_voucher", label: "Virgin Companion or Upgrade Voucher (£10k spend)", maxValue: 1500 },
      ],
    },
  ],
};

// Loyalty programs — references PROGRAM_DIRECTORY
export const LOYALTY_PROGRAMS = {
  airlines: [...PROGRAM_DIRECTORY.airlines].sort((a, b) => a.name.localeCompare(b.name)),
  hotels: [...PROGRAM_DIRECTORY.hotels].sort((a, b) => a.name.localeCompare(b.name)),
  rentals: [...PROGRAM_DIRECTORY.rentals].sort((a, b) => a.name.localeCompare(b.name)),
  creditCards: [...PROGRAM_DIRECTORY.creditCards].sort((a, b) => a.name.localeCompare(b.name)),
};

export const PROGRAM_LOGO_DOMAINS = {
  // Airlines
  aa: "aa.com", dl: "delta.com", ua: "united.com", sw: "southwest.com",
  b6: "jetblue.com", atmos: "alaskaair.com", frontier: "flyfrontier.com",
  spirit: "spirit.com", flying_blue: "airfranceklm.com", ba_avios: "britishairways.com",
  aeroplan: "aircanada.com", emirates_skywards: "emirates.com",
  turkish_miles: "turkishairlines.com", qantas_ff: "qantas.com",
  singapore_kf: "singaporeair.com", etihad_guest: "etihad.com",
  virgin_fc: "virginatlantic.com", cathay_mp: "cathaypacific.com",
  // Hotels
  marriott: "marriott.com", hilton: "hilton.com", ihg: "ihg.com",
  hyatt: "hyatt.com", choice: "choicehotels.com", wyndham: "wyndhamhotels.com",
  accor: "accor.com", bestwestern: "bestwestern.com", radisson: "radissonhotels.com",
  sonesta: "sonesta.com", omni: "omnihotels.com",
  // Rentals
  hertz: "hertz.com", national: "nationalcar.com", avis: "avis.com",
  enterprise: "enterprise.com", budget: "budget.com", sixt: "sixt.com",
  // Credit cards
  amex_plat: "americanexpress.com", amex_gold: "americanexpress.com",
  amex_green: "americanexpress.com", chase_sapphire: "chase.com",
  chase_sapphire_pref: "chase.com", cap1_venturex: "capitalone.com",
  cap1_venture: "capitalone.com", citi_premier: "citi.com",
  bilt: "biltrewards.com", delta_reserve: "delta.com", delta_gold: "delta.com",
  united_club: "united.com", united_explorer: "united.com", aa_exec: "aa.com",
  marriott_boundless: "marriott.com", hilton_aspire: "hilton.com",
  hilton_surpass: "hilton.com", hyatt_card: "hyatt.com", ihg_premier: "ihg.com",
  sw_priority: "southwest.com", atmos_summit: "alaskaair.com",
};

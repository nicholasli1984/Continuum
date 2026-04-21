const IATA_TO_CITY = {
  ATL:"Atlanta",BDA:"Bermuda",BNA:"Nashville",BOS:"Boston",CLT:"Charlotte",DCA:"Washington",DEN:"Denver",
  DFW:"Dallas",DTW:"Detroit",EWR:"Newark",FLL:"Fort Lauderdale",HNL:"Honolulu",IAD:"Washington",IAH:"Houston",
  JFK:"New York",LAX:"Los Angeles",LGA:"New York",MIA:"Miami",MSP:"Minneapolis",ORD:"Chicago",PDX:"Portland",
  PHL:"Philadelphia",PHX:"Phoenix",SAN:"San Diego",SEA:"Seattle",SFO:"San Francisco",SJC:"San Jose",
  SLC:"Salt Lake City",TPA:"Tampa",LAS:"Las Vegas",AUS:"Austin",MCO:"Orlando",
  AMS:"Amsterdam",ARN:"Stockholm",ATH:"Athens",BCN:"Barcelona",CDG:"Paris",CPH:"Copenhagen",DUB:"Dublin",
  EDI:"Edinburgh",FCO:"Rome",FRA:"Frankfurt",GVA:"Geneva",HEL:"Helsinki",IST:"Istanbul",LHR:"London",
  LIS:"Lisbon",MAD:"Madrid",MAN:"Manchester",MUC:"Munich",OSL:"Oslo",PRG:"Prague",VIE:"Vienna",ZRH:"Zurich",
  BKK:"Bangkok",DEL:"Delhi",DPS:"Bali",HKG:"Hong Kong",HND:"Tokyo",ICN:"Seoul",KIX:"Osaka",KUL:"Kuala Lumpur",
  MNL:"Manila",NRT:"Tokyo",PEK:"Beijing",PVG:"Shanghai",SGN:"Ho Chi Minh City",SIN:"Singapore",TPE:"Taipei",
  AUH:"Abu Dhabi",CAI:"Cairo",DOH:"Doha",DXB:"Dubai",JNB:"Johannesburg",
  AKL:"Auckland",MEL:"Melbourne",SYD:"Sydney",YYZ:"Toronto",YVR:"Vancouver",
  MEX:"Mexico City",CUN:"Cancun",GRU:"Sao Paulo",EZE:"Buenos Aires",BOG:"Bogota",SCL:"Santiago",LIM:"Lima",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { city, date } = req.query;
  if (!city || !date) return res.status(400).json({ error: "city and date required" });

  try {
    // Convert IATA code to city name
    const cityName = (city.length === 3 && city === city.toUpperCase()) ? (IATA_TO_CITY[city] || city) : city;
    // Geocode
    const queries = [cityName];
    let geo = null;
    for (const q of queries) {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`);
      geo = await r.json();
      if (geo.results?.length > 0) break;
    }
    if (!geo?.results?.length) return res.status(404).json({ error: "Location not found" });

    const { latitude, longitude, name } = geo.results[0];
    const daysOut = Math.ceil((new Date(date + "T12:00:00") - new Date()) / 86400000);

    let wxData, isHistorical = false;
    if (daysOut <= 14 && daysOut >= -1) {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${date}&end_date=${date}`);
      wxData = await r.json();
    }
    if (!wxData?.daily?.time?.length) {
      isHistorical = true;
      const lastYear = new Date(date + "T12:00:00");
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const histDate = lastYear.toISOString().slice(0, 10);
      const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${histDate}&end_date=${histDate}`);
      wxData = await r.json();
    }
    if (!wxData?.daily?.time?.length) return res.status(404).json({ error: "No weather data" });

    return res.status(200).json({
      high: wxData.daily.temperature_2m_max[0],
      low: wxData.daily.temperature_2m_min[0],
      code: wxData.daily.weather_code?.[0] ?? wxData.daily.weathercode?.[0] ?? 0,
      cityName: name,
      isHistorical,
    });
  } catch (e) {
    return res.status(500).json({ error: "Weather fetch failed" });
  }
}

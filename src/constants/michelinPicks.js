// Curated dining database keyed by city. Each entry is either a Michelin-
// starred restaurant (1–3 stars) or has appeared on the World's 50 Best (top
// 100) in recent years — those are our two acceptance criteria, per product
// direction. Bib Gourmand and broader "Michelin Guide selected" entries are
// intentionally out of scope.
//
// `stars`: 1, 2, or 3 if Michelin-starred; 0 if the restaurant is on World's
//          50 Best but not currently starred.
// `bestList`: true if the restaurant has appeared on the World's 50 Best top
//          100 in the last few cycles.
//
// Stars and 50 Best rankings shift annually — the UI surfaces a disclaimer
// nudging the user to verify before booking.

export const MICHELIN_PICKS = {
  Tokyo: [
    { name: "Quintessence",                       stars: 3, bestList: false, cuisine: "Modern French",          area: "Shinagawa" },
    { name: "Ryugin",                             stars: 3, bestList: true,  cuisine: "Modern Japanese",        area: "Hibiya" },
    { name: "Sushi Saito",                        stars: 3, bestList: false, cuisine: "Sushi",                  area: "Roppongi" },
    { name: "L'Effervescence",                    stars: 3, bestList: false, cuisine: "Modern French",          area: "Nishi-Azabu" },
    { name: "Joël Robuchon",                      stars: 3, bestList: false, cuisine: "French",                 area: "Ebisu" },
    { name: "Sézanne",                            stars: 3, bestList: true,  cuisine: "Modern French",          area: "Four Seasons Marunouchi" },
    { name: "Florilège",                          stars: 3, bestList: true,  cuisine: "Modern French",          area: "Azabudai Hills" },
    { name: "Den",                                stars: 2, bestList: true,  cuisine: "Modern Japanese",        area: "Jingumae" },
  ],
  Kyoto: [
    { name: "Hyotei",                             stars: 3, bestList: false, cuisine: "Kaiseki",                area: "Higashiyama" },
    { name: "Kikunoi Honten",                     stars: 3, bestList: false, cuisine: "Kaiseki",                area: "Higashiyama" },
    { name: "Mizai",                              stars: 3, bestList: false, cuisine: "Kaiseki",                area: "Maruyama Park" },
    { name: "Tempura Endo Yasaka",                stars: 2, bestList: false, cuisine: "Tempura",                area: "Gion" },
    { name: "Gion Sasaki",                        stars: 2, bestList: false, cuisine: "Kaiseki",                area: "Gion" },
  ],
  Osaka: [
    { name: "Hajime",                             stars: 3, bestList: false, cuisine: "Modern French",          area: "Edobori" },
    { name: "Fujiya 1935",                        stars: 3, bestList: false, cuisine: "Modern Spanish",         area: "Yarihigashi" },
    { name: "Koryu",                              stars: 3, bestList: false, cuisine: "Modern Japanese",        area: "Shinmachi" },
    { name: "Kashiwaya",                          stars: 3, bestList: false, cuisine: "Kaiseki",                area: "Senriyamanishi" },
  ],
  "Hong Kong": [
    { name: "Lung King Heen",                     stars: 3, bestList: true,  cuisine: "Cantonese",              area: "Four Seasons, Central" },
    { name: "8½ Otto e Mezzo Bombana",            stars: 3, bestList: true,  cuisine: "Italian",                area: "Alexandra House, Central" },
    { name: "Caprice",                            stars: 3, bestList: true,  cuisine: "French",                 area: "Four Seasons, Central" },
    { name: "T'ang Court",                        stars: 3, bestList: false, cuisine: "Cantonese",              area: "The Langham, Tsim Sha Tsui" },
    { name: "Sushi Shikon",                       stars: 3, bestList: false, cuisine: "Sushi",                  area: "Landmark Mandarin, Central" },
    { name: "Wing",                               stars: 1, bestList: true,  cuisine: "Modern Chinese",         area: "Wyndham St, Central" },
    { name: "Mosu Hong Kong",                     stars: 2, bestList: true,  cuisine: "Modern Korean",          area: "M+ Museum, Kowloon" },
  ],
  Macau: [
    { name: "Robuchon au Dôme",                   stars: 3, bestList: false, cuisine: "French",                 area: "Grand Lisboa" },
    { name: "Jade Dragon",                        stars: 3, bestList: false, cuisine: "Cantonese",              area: "City of Dreams" },
    { name: "The Eight",                          stars: 3, bestList: false, cuisine: "Cantonese/Dim sum",      area: "Grand Lisboa" },
    { name: "Sichuan Moon",                       stars: 2, bestList: false, cuisine: "Sichuan",                area: "Wynn Palace" },
    { name: "Wing Lei Palace",                    stars: 2, bestList: false, cuisine: "Cantonese",              area: "Wynn Palace" },
  ],
  Shanghai: [
    { name: "Ultraviolet by Paul Pairet",         stars: 3, bestList: true,  cuisine: "Avant-garde",            area: "secret location, Bund" },
    { name: "T'ang Court",                        stars: 3, bestList: false, cuisine: "Cantonese",              area: "The Langham, Xintiandi" },
    { name: "Le Comptoir de Pierre Gagnaire",     stars: 2, bestList: false, cuisine: "French",                 area: "Capella Jian Ye Li" },
    { name: "Da Vittorio Shanghai",               stars: 2, bestList: false, cuisine: "Italian",                area: "Pudong" },
    { name: "Yong Yi Ting",                       stars: 1, bestList: false, cuisine: "Jiangnan",               area: "Mandarin Oriental Pudong" },
  ],
  Beijing: [
    { name: "Jing Yaa Tang",                      stars: 1, bestList: false, cuisine: "Cantonese/Peking",       area: "The Opposite House, Sanlitun" },
    { name: "Family Li Imperial Cuisine",         stars: 2, bestList: false, cuisine: "Imperial",               area: "Xicheng" },
    { name: "TRB Hutong",                         stars: 1, bestList: false, cuisine: "Modern European",        area: "Dongcheng" },
    { name: "Mio",                                stars: 1, bestList: false, cuisine: "Italian",                area: "Four Seasons" },
  ],
  Singapore: [
    { name: "Odette",                             stars: 3, bestList: true,  cuisine: "Modern French",          area: "National Gallery" },
    { name: "Les Amis",                           stars: 3, bestList: true,  cuisine: "French",                 area: "Shaw Centre" },
    { name: "Zén",                                stars: 3, bestList: true,  cuisine: "Scandinavian/Asian",     area: "Bukit Pasoh" },
    { name: "Cloudstreet",                        stars: 2, bestList: true,  cuisine: "Modern European",        area: "Tanjong Pagar" },
    { name: "Saint Pierre",                       stars: 2, bestList: false, cuisine: "Modern French",          area: "Marina Bay" },
    { name: "Burnt Ends",                         stars: 1, bestList: true,  cuisine: "Modern barbecue",        area: "Dempsey Hill" },
    { name: "Born",                               stars: 1, bestList: true,  cuisine: "Modern European",        area: "Telok Ayer" },
  ],
  Bangkok: [
    { name: "Sorn",                               stars: 3, bestList: true,  cuisine: "Southern Thai",          area: "Sukhumvit" },
    { name: "Sühring",                            stars: 2, bestList: true,  cuisine: "Modern German",          area: "Yen Akat" },
    { name: "Le Du",                              stars: 2, bestList: true,  cuisine: "Modern Thai",            area: "Silom" },
    { name: "Gaa",                                stars: 1, bestList: true,  cuisine: "Progressive Indian",     area: "Sukhumvit" },
    { name: "Chef's Table at Lebua",              stars: 2, bestList: false, cuisine: "French",                 area: "Lebua at State Tower" },
    { name: "Nusara",                             stars: 1, bestList: true,  cuisine: "Modern Thai",            area: "Tha Tien" },
    { name: "Potong",                             stars: 1, bestList: true,  cuisine: "Modern Thai-Chinese",    area: "Chinatown" },
  ],
  Taipei: [
    { name: "Le Palais",                          stars: 3, bestList: false, cuisine: "Cantonese",              area: "Palais de Chine, Datong" },
    { name: "RAW",                                stars: 2, bestList: true,  cuisine: "Modern Taiwanese",       area: "Zhongshan" },
    { name: "Tairroir",                           stars: 2, bestList: true,  cuisine: "Modern Taiwanese",       area: "Zhongshan" },
    { name: "Logy",                               stars: 2, bestList: true,  cuisine: "Modern Asian",           area: "Da'an" },
    { name: "Mume",                               stars: 1, bestList: true,  cuisine: "Modern Taiwanese",       area: "Da'an" },
    { name: "JL Studio",                          stars: 2, bestList: true,  cuisine: "Modern Singaporean",     area: "Taichung (nearby)" },
  ],
  Seoul: [
    { name: "Mingles",                            stars: 3, bestList: true,  cuisine: "Modern Korean",          area: "Cheongdam-dong" },
    { name: "Mosu",                               stars: 3, bestList: true,  cuisine: "Modern Korean",          area: "Hannam-dong" },
    { name: "L'Amitié",                           stars: 2, bestList: false, cuisine: "Modern French",          area: "Cheongdam-dong" },
    { name: "Joo Ok",                             stars: 2, bestList: false, cuisine: "Korean Hansik",          area: "Seocho" },
    { name: "Onjium",                             stars: 1, bestList: false, cuisine: "Royal Korean",           area: "Jongno" },
  ],
  "New York": [
    { name: "Per Se",                             stars: 3, bestList: false, cuisine: "Modern American/French", area: "Columbus Circle" },
    { name: "Le Bernardin",                       stars: 3, bestList: true,  cuisine: "French seafood",         area: "Midtown West" },
    { name: "Eleven Madison Park",                stars: 3, bestList: true,  cuisine: "Plant-based fine dining",area: "Flatiron" },
    { name: "Masa",                               stars: 3, bestList: false, cuisine: "Sushi",                  area: "Columbus Circle" },
    { name: "Chef's Table at Brooklyn Fare",      stars: 3, bestList: false, cuisine: "Modern American",        area: "Hell's Kitchen" },
    { name: "Atomix",                             stars: 2, bestList: true,  cuisine: "Modern Korean",          area: "NoMad" },
    { name: "Cosme",                              stars: 0, bestList: true,  cuisine: "Modern Mexican",         area: "Flatiron" },
    { name: "Estela",                             stars: 1, bestList: true,  cuisine: "Modern American",        area: "Nolita" },
  ],
  London: [
    { name: "Restaurant Gordon Ramsay",           stars: 3, bestList: false, cuisine: "French",                 area: "Chelsea" },
    { name: "Sketch (Lecture Room & Library)",    stars: 3, bestList: false, cuisine: "Modern French",          area: "Mayfair" },
    { name: "Alain Ducasse at The Dorchester",    stars: 3, bestList: false, cuisine: "French",                 area: "Mayfair" },
    { name: "Core by Clare Smyth",                stars: 3, bestList: true,  cuisine: "Modern British",         area: "Notting Hill" },
    { name: "Hélène Darroze at The Connaught",    stars: 3, bestList: false, cuisine: "French",                 area: "Mayfair" },
    { name: "The Ledbury",                        stars: 3, bestList: false, cuisine: "Modern British",         area: "Notting Hill" },
    { name: "Lyle's",                             stars: 1, bestList: true,  cuisine: "Modern British",         area: "Shoreditch" },
    { name: "Ikoyi",                              stars: 2, bestList: true,  cuisine: "West-African inspired",  area: "St. James's" },
  ],
  Paris: [
    { name: "Guy Savoy",                          stars: 3, bestList: false, cuisine: "French",                 area: "Monnaie de Paris, 6e" },
    { name: "Alain Ducasse au Plaza Athénée",     stars: 3, bestList: false, cuisine: "Modern French",          area: "8e" },
    { name: "L'Ambroisie",                        stars: 3, bestList: false, cuisine: "French",                 area: "Place des Vosges" },
    { name: "Arpège",                             stars: 3, bestList: true,  cuisine: "Vegetable-forward",      area: "7e" },
    { name: "Plénitude — Cheval Blanc",           stars: 3, bestList: true,  cuisine: "Modern French",          area: "1er (Pont Neuf)" },
    { name: "Epicure — Le Bristol",               stars: 3, bestList: false, cuisine: "Classical French",       area: "Faubourg Saint-Honoré" },
    { name: "Table by Bruno Verjus",              stars: 2, bestList: true,  cuisine: "Modern French",          area: "12e" },
    { name: "Septime",                            stars: 1, bestList: true,  cuisine: "Modern French",          area: "11e" },
  ],
  Lyon: [
    { name: "Paul Bocuse",                        stars: 2, bestList: false, cuisine: "Classical French",       area: "Collonges-au-Mont-d'Or" },
    { name: "La Mère Brazier",                    stars: 2, bestList: false, cuisine: "Lyonnaise",              area: "Croix-Rousse" },
    { name: "Têtedoie",                           stars: 1, bestList: false, cuisine: "Modern French",          area: "Fourvière" },
    { name: "Le Neuvième Art",                    stars: 2, bestList: false, cuisine: "Modern French",          area: "6e" },
  ],
  Valence: [
    { name: "Pic",                                stars: 3, bestList: true,  cuisine: "Modern French",          area: "Centre" },
  ],
  Barcelona: [
    { name: "Disfrutar",                          stars: 3, bestList: true,  cuisine: "Modernist Spanish",      area: "Eixample" },
    { name: "ABaC",                               stars: 3, bestList: false, cuisine: "Catalan/Modernist",      area: "Sant Gervasi" },
    { name: "Lasarte",                            stars: 3, bestList: true,  cuisine: "Modern Basque",          area: "Eixample" },
    { name: "Cocina Hermanos Torres",             stars: 3, bestList: false, cuisine: "Modern Spanish",         area: "Les Corts" },
    { name: "Enoteca Paco Pérez",                 stars: 2, bestList: false, cuisine: "Modern Mediterranean",   area: "Hotel Arts" },
  ],
  Madrid: [
    { name: "DiverXO",                            stars: 3, bestList: true,  cuisine: "Avant-garde",            area: "Chamartín" },
    { name: "Coque",                              stars: 2, bestList: false, cuisine: "Modern Spanish",         area: "Recoletos" },
    { name: "Deessa",                             stars: 2, bestList: false, cuisine: "Mediterranean",          area: "Mandarin Oriental Ritz" },
    { name: "Ramón Freixa Madrid",                stars: 2, bestList: false, cuisine: "Modern Spanish",         area: "Salamanca" },
  ],
  "San Sebastián": [
    { name: "Arzak",                              stars: 3, bestList: true,  cuisine: "Modern Basque",          area: "Alto de Miracruz" },
    { name: "Mugaritz",                           stars: 2, bestList: true,  cuisine: "Avant-garde Basque",     area: "Errenteria (nearby)" },
    { name: "Akelarre",                           stars: 3, bestList: false, cuisine: "Modern Basque",          area: "Igueldo" },
    { name: "Martin Berasategui",                 stars: 3, bestList: false, cuisine: "Modern Basque",          area: "Lasarte-Oria" },
    { name: "Asador Etxebarri",                   stars: 1, bestList: true,  cuisine: "Wood-fire Basque",       area: "Atxondo (nearby)" },
  ],
  Lisbon: [
    { name: "Belcanto",                           stars: 2, bestList: true,  cuisine: "Modern Portuguese",      area: "Chiado" },
    { name: "Alma",                               stars: 2, bestList: false, cuisine: "Modern Portuguese",      area: "Chiado" },
    { name: "Eleven",                             stars: 1, bestList: false, cuisine: "Modern European",        area: "Parque Eduardo VII" },
    { name: "Loco",                               stars: 1, bestList: false, cuisine: "Modern Portuguese",      area: "Estrela" },
  ],
  Rome: [
    { name: "La Pergola",                         stars: 3, bestList: false, cuisine: "Modern Italian",         area: "Rome Cavalieri" },
    { name: "Il Pagliaccio",                      stars: 2, bestList: false, cuisine: "Modern Italian",         area: "Centro Storico" },
    { name: "Imàgo",                              stars: 1, bestList: false, cuisine: "Italian",                area: "Hassler, Trinità dei Monti" },
    { name: "Aroma",                              stars: 1, bestList: false, cuisine: "Italian",                area: "Palazzo Manfredi" },
  ],
  Milan: [
    { name: "Enrico Bartolini al Mudec",          stars: 3, bestList: false, cuisine: "Contemporary Italian",   area: "Tortona" },
    { name: "Seta",                               stars: 2, bestList: false, cuisine: "Italian/French",         area: "Mandarin Oriental, Brera" },
    { name: "Il Luogo di Aimo e Nadia",           stars: 2, bestList: false, cuisine: "Italian",                area: "Bande Nere" },
    { name: "Cracco",                             stars: 1, bestList: false, cuisine: "Italian",                area: "Galleria Vittorio Emanuele" },
    { name: "Da Vittorio Milano",                 stars: 1, bestList: false, cuisine: "Italian",                area: "Brera" },
  ],
  Florence: [
    { name: "Enoteca Pinchiorri",                 stars: 3, bestList: false, cuisine: "Italian",                area: "Santa Croce" },
    { name: "Borgo San Jacopo",                   stars: 1, bestList: false, cuisine: "Italian",                area: "Lungarno" },
    { name: "Il Palagio",                         stars: 1, bestList: false, cuisine: "Italian",                area: "Four Seasons" },
  ],
  Venice: [
    { name: "Quadri",                             stars: 1, bestList: false, cuisine: "Italian",                area: "Piazza San Marco" },
    { name: "Met",                                stars: 1, bestList: false, cuisine: "Italian",                area: "Hotel Metropole" },
  ],
  "Modena/Lido 84": [
    { name: "Osteria Francescana",                stars: 3, bestList: true,  cuisine: "Modern Italian",         area: "Modena" },
    { name: "Lido 84",                            stars: 1, bestList: true,  cuisine: "Modern Italian",         area: "Lake Garda" },
    { name: "Le Calandre",                        stars: 3, bestList: true,  cuisine: "Modern Italian",         area: "Padua" },
    { name: "Reale",                              stars: 3, bestList: true,  cuisine: "Modern Italian",         area: "Castel di Sangro" },
    { name: "Da Vittorio",                        stars: 3, bestList: false, cuisine: "Italian",                area: "Brusaporto, Bergamo" },
  ],
  Vienna: [
    { name: "Steirereck",                         stars: 2, bestList: true,  cuisine: "Modern Austrian",        area: "Stadtpark" },
    { name: "Konstantin Filippou",                stars: 2, bestList: false, cuisine: "Modern European",        area: "Innere Stadt" },
    { name: "Mraz und Sohn",                      stars: 2, bestList: false, cuisine: "Modern Austrian",        area: "Brigittenau" },
  ],
  Berlin: [
    { name: "Rutz",                               stars: 3, bestList: false, cuisine: "Modern German",          area: "Mitte" },
    { name: "Tim Raue",                           stars: 2, bestList: true,  cuisine: "Asian-inspired",         area: "Kreuzberg" },
    { name: "Facil",                              stars: 2, bestList: false, cuisine: "Modern European",        area: "The Mandala, Tiergarten" },
    { name: "Lorenz Adlon Esszimmer",             stars: 2, bestList: false, cuisine: "Modern French",          area: "Hotel Adlon" },
    { name: "Horváth",                            stars: 2, bestList: false, cuisine: "Modern Austrian",        area: "Kreuzberg" },
  ],
  Munich: [
    { name: "Atelier",                            stars: 3, bestList: false, cuisine: "Modern European",        area: "Bayerischer Hof" },
    { name: "Tantris",                            stars: 2, bestList: false, cuisine: "Modern European",        area: "Schwabing" },
    { name: "EssZimmer",                          stars: 2, bestList: false, cuisine: "Modern German",          area: "BMW Welt" },
  ],
  Copenhagen: [
    { name: "Geranium",                           stars: 3, bestList: true,  cuisine: "New Nordic",             area: "Østerbro" },
    { name: "Alchemist",                          stars: 2, bestList: true,  cuisine: "Avant-garde",            area: "Refshaleøen" },
    { name: "Jordnær",                            stars: 2, bestList: false, cuisine: "Modern Nordic",          area: "Gentofte" },
    { name: "Kong Hans Kælder",                   stars: 2, bestList: false, cuisine: "Modern French",          area: "Indre By" },
  ],
  Stockholm: [
    { name: "Frantzén",                           stars: 3, bestList: true,  cuisine: "Modern Nordic",          area: "Norrmalm" },
    { name: "Aloë",                               stars: 2, bestList: false, cuisine: "Modern Nordic",          area: "Sköndal" },
    { name: "Operakällaren",                      stars: 1, bestList: false, cuisine: "Modern Swedish",         area: "Norrmalm" },
  ],
  Amsterdam: [
    { name: "Spectrum",                           stars: 2, bestList: false, cuisine: "Modern European",        area: "Waldorf Astoria" },
    { name: "Bord'Eau",                           stars: 2, bestList: false, cuisine: "Modern French",          area: "De L'Europe" },
    { name: "Vermeer",                            stars: 1, bestList: false, cuisine: "Modern Dutch",           area: "Prinsen Eiland" },
    { name: "Yamazato",                           stars: 1, bestList: false, cuisine: "Kaiseki",                area: "Okura, De Pijp" },
    { name: "Rijks",                              stars: 1, bestList: false, cuisine: "Modern Dutch",           area: "Rijksmuseum" },
  ],
  Antwerp: [
    { name: "The Jane",                           stars: 1, bestList: true,  cuisine: "Modern European",        area: "Berchem" },
  ],
  Brussels: [
    { name: "Hof van Cleve",                      stars: 3, bestList: false, cuisine: "Modern Belgian",         area: "Kruishoutem (nearby)" },
    { name: "Bon-Bon",                            stars: 2, bestList: false, cuisine: "Modern Belgian",         area: "Brussels" },
    { name: "Comme chez Soi",                     stars: 1, bestList: false, cuisine: "Classical Belgian",      area: "Place Rouppe" },
  ],
  Zurich: [
    { name: "The Restaurant — Dolder Grand",      stars: 2, bestList: false, cuisine: "Modern French",          area: "Adlisberg" },
    { name: "Pavillon",                           stars: 2, bestList: false, cuisine: "Modern European",        area: "Baur au Lac" },
  ],
  "Schloss Schauenstein": [
    { name: "Schloss Schauenstein",               stars: 3, bestList: true,  cuisine: "Modern European",        area: "Fürstenau, Graubünden" },
  ],
  Slovenia: [
    { name: "Hiša Franko",                        stars: 2, bestList: true,  cuisine: "Modern Slovenian",       area: "Kobarid" },
  ],
  "San Francisco": [
    { name: "Quince",                             stars: 3, bestList: false, cuisine: "Modern Californian",     area: "Jackson Square" },
    { name: "Atelier Crenn",                      stars: 3, bestList: true,  cuisine: "Poetic French",          area: "Cow Hollow" },
    { name: "Benu",                               stars: 3, bestList: true,  cuisine: "Modern Asian",           area: "SoMa" },
    { name: "Saison",                             stars: 2, bestList: false, cuisine: "Modern Californian",     area: "SoMa" },
    { name: "Birdsong",                           stars: 2, bestList: false, cuisine: "New American",           area: "SoMa" },
    { name: "Single Thread",                      stars: 3, bestList: true,  cuisine: "Modern American",       area: "Healdsburg" },
  ],
  Chicago: [
    { name: "Alinea",                             stars: 3, bestList: true,  cuisine: "Avant-garde",            area: "Lincoln Park" },
    { name: "Smyth",                              stars: 3, bestList: true,  cuisine: "Modern American",        area: "West Loop" },
    { name: "Ever",                               stars: 2, bestList: false, cuisine: "Modern American",        area: "West Town" },
    { name: "Moody Tongue",                       stars: 2, bestList: false, cuisine: "Modern American",        area: "South Loop" },
    { name: "Oriole",                             stars: 2, bestList: false, cuisine: "Modern American",        area: "West Loop" },
  ],
  "Los Angeles": [
    { name: "Vespertine",                         stars: 2, bestList: false, cuisine: "Avant-garde",            area: "Culver City" },
    { name: "Providence",                         stars: 2, bestList: false, cuisine: "Seafood",                area: "Hollywood" },
    { name: "N/Naka",                             stars: 2, bestList: true,  cuisine: "Modern Japanese kaiseki",area: "Palms" },
    { name: "Hayato",                             stars: 2, bestList: false, cuisine: "Japanese kaiseki",       area: "Arts District" },
    { name: "Sushi Ginza Onodera",                stars: 1, bestList: false, cuisine: "Sushi",                  area: "West Hollywood" },
  ],
  "Las Vegas": [
    { name: "Joël Robuchon",                      stars: 3, bestList: false, cuisine: "French",                 area: "MGM Grand" },
    { name: "Restaurant Guy Savoy",               stars: 2, bestList: false, cuisine: "French",                 area: "Caesars Palace" },
    { name: "L'Atelier de Joël Robuchon",         stars: 1, bestList: false, cuisine: "French",                 area: "MGM Grand" },
    { name: "Twist by Pierre Gagnaire",           stars: 1, bestList: false, cuisine: "French",                 area: "Waldorf Astoria" },
    { name: "Picasso",                            stars: 1, bestList: false, cuisine: "Modern French",          area: "Bellagio" },
  ],
  Miami: [
    { name: "L'Atelier de Joël Robuchon",         stars: 2, bestList: false, cuisine: "French",                 area: "Design District" },
    { name: "Stubborn Seed",                      stars: 1, bestList: false, cuisine: "New American",           area: "South Beach" },
    { name: "Cote Miami",                         stars: 1, bestList: false, cuisine: "Korean steakhouse",      area: "Design District" },
    { name: "Hiden",                              stars: 1, bestList: false, cuisine: "Sushi",                  area: "Wynwood" },
    { name: "Tambourine Room",                    stars: 1, bestList: false, cuisine: "Modern French",          area: "Carillon Miami" },
  ],
  "Washington DC": [
    { name: "The Inn at Little Washington",       stars: 3, bestList: false, cuisine: "Modern American",        area: "Washington, VA (nearby)" },
    { name: "Minibar by José Andrés",             stars: 2, bestList: false, cuisine: "Avant-garde",            area: "Penn Quarter" },
    { name: "Pineapple and Pearls",               stars: 2, bestList: false, cuisine: "Modern American",        area: "Capitol Hill" },
    { name: "Jônt",                               stars: 2, bestList: false, cuisine: "Modern American",        area: "Logan Circle" },
    { name: "Rooster & Owl",                      stars: 1, bestList: false, cuisine: "American",               area: "U Street" },
  ],
  Boston: [
    { name: "Menton",                             stars: 0, bestList: false, cuisine: "Modern French/Italian",  area: "Fort Point" },
    { name: "O Ya",                               stars: 0, bestList: false, cuisine: "Modern Japanese",        area: "Leather District" },
  ],
  Toronto: [
    { name: "Sushi Masaki Saito",                 stars: 2, bestList: false, cuisine: "Sushi",                  area: "Yorkville" },
    { name: "Alo",                                stars: 1, bestList: false, cuisine: "Modern French",          area: "Spadina/Queen" },
    { name: "Edulis",                             stars: 1, bestList: false, cuisine: "Modern European",        area: "King West" },
    { name: "Aburi Hana",                         stars: 1, bestList: false, cuisine: "Modern Japanese",        area: "Yorkville" },
    { name: "Don Alfonso 1890",                   stars: 1, bestList: false, cuisine: "Italian",                area: "Westin Harbour Castle" },
  ],
  Montreal: [
    { name: "Toqué!",                             stars: 0, bestList: false, cuisine: "Modern Québécois",       area: "Quartier International" },
    { name: "Joe Beef",                           stars: 0, bestList: false, cuisine: "Modern Québécois",       area: "Little Burgundy" },
    { name: "Mon Lapin",                          stars: 0, bestList: true,  cuisine: "Modern French",          area: "Little Italy" },
  ],
  Vancouver: [
    { name: "St. Lawrence",                       stars: 1, bestList: false, cuisine: "Modern Québécois",       area: "Railtown" },
    { name: "AnnaLena",                           stars: 1, bestList: false, cuisine: "Modern Canadian",        area: "Kitsilano" },
    { name: "Burdock & Co",                       stars: 1, bestList: false, cuisine: "Modern Canadian",        area: "Mount Pleasant" },
    { name: "Iden & Quanjude Beijing Duck House", stars: 1, bestList: false, cuisine: "Beijing",                area: "Robson" },
    { name: "Published on Main",                  stars: 1, bestList: false, cuisine: "Modern Canadian",        area: "Mount Pleasant" },
  ],
  Dubai: [
    { name: "Trésind Studio",                     stars: 3, bestList: true,  cuisine: "Modern Indian",          area: "St Regis Gardens" },
    { name: "Ossiano",                            stars: 2, bestList: false, cuisine: "Seafood/Modern European",area: "Atlantis The Palm" },
    { name: "Row on 45",                          stars: 2, bestList: false, cuisine: "Modern European",        area: "Grosvenor House, JBR" },
    { name: "STAY by Yannick Alléno",             stars: 1, bestList: false, cuisine: "Modern French",          area: "One&Only The Palm" },
    { name: "Tasca by José Avillez",              stars: 1, bestList: false, cuisine: "Portuguese",             area: "Mandarin Oriental Jumeira" },
  ],
  "Mexico City": [
    { name: "Pujol",                              stars: 1, bestList: true,  cuisine: "Modern Mexican",         area: "Polanco" },
    { name: "Quintonil",                          stars: 1, bestList: true,  cuisine: "Modern Mexican",         area: "Polanco" },
    { name: "Sud777",                             stars: 1, bestList: false, cuisine: "Modern Mexican",         area: "Pedregal" },
    { name: "Rosetta",                            stars: 1, bestList: true,  cuisine: "Italian-Mexican",        area: "Roma Norte" },
    { name: "Máximo Bistrot",                     stars: 0, bestList: true,  cuisine: "European-Mexican",       area: "Roma Norte" },
    { name: "Em",                                 stars: 1, bestList: false, cuisine: "Modern",                 area: "Polanco" },
  ],
  Lima: [
    { name: "Central",                            stars: 0, bestList: true,  cuisine: "Modern Peruvian",        area: "Barranco" },
    { name: "Maido",                              stars: 0, bestList: true,  cuisine: "Nikkei",                 area: "Miraflores" },
    { name: "Kjolle",                             stars: 0, bestList: true,  cuisine: "Modern Peruvian",        area: "Barranco" },
    { name: "Astrid y Gastón",                    stars: 0, bestList: true,  cuisine: "Modern Peruvian",        area: "San Isidro" },
    { name: "Mayta",                              stars: 0, bestList: true,  cuisine: "Modern Peruvian",        area: "Miraflores" },
  ],
  Santiago: [
    { name: "Boragó",                             stars: 0, bestList: true,  cuisine: "Endemic Chilean",        area: "Vitacura" },
  ],
  "Buenos Aires": [
    { name: "Don Julio",                          stars: 0, bestList: true,  cuisine: "Argentine parrilla",     area: "Palermo" },
    { name: "Aramburu",                           stars: 2, bestList: true,  cuisine: "Modern Argentine",       area: "Recoleta" },
    { name: "Trescha",                            stars: 1, bestList: false, cuisine: "Modern Argentine",       area: "Villa Crespo" },
    { name: "El Preferido de Palermo",            stars: 0, bestList: true,  cuisine: "Argentine bodegón",      area: "Palermo" },
  ],
  "São Paulo": [
    { name: "D.O.M.",                             stars: 1, bestList: false, cuisine: "Modern Brazilian",       area: "Jardins" },
    { name: "A Casa do Porco",                    stars: 0, bestList: true,  cuisine: "Pork-focused Brazilian", area: "Centro Histórico" },
    { name: "Maní",                               stars: 1, bestList: true,  cuisine: "Modern Brazilian",       area: "Jardim Paulistano" },
    { name: "Tuju",                               stars: 1, bestList: false, cuisine: "Modern Brazilian",       area: "Vila Madalena" },
    { name: "Tan Tan Noodle Bar",                 stars: 0, bestList: true,  cuisine: "Modern Asian",           area: "Pinheiros" },
  ],
  "Rio de Janeiro": [
    { name: "Oro",                                stars: 2, bestList: false, cuisine: "Modern Brazilian",       area: "Leblon" },
    { name: "Lasai",                              stars: 2, bestList: false, cuisine: "Modern Brazilian",       area: "Botafogo" },
    { name: "Oteque",                             stars: 2, bestList: false, cuisine: "Modern Brazilian",       area: "Botafogo" },
  ],
  Mumbai: [
    { name: "Masque",                             stars: 0, bestList: true,  cuisine: "Modern Indian",          area: "Mahalaxmi" },
    { name: "The Bombay Canteen",                 stars: 0, bestList: false, cuisine: "Modern Indian",          area: "Lower Parel" },
    { name: "Trèsind",                            stars: 0, bestList: false, cuisine: "Modern Indian",          area: "Bandra Kurla Complex" },
  ],
  "New Delhi": [
    { name: "Indian Accent",                      stars: 0, bestList: true,  cuisine: "Modern Indian",          area: "Lodhi Hotel" },
    { name: "Bukhara",                            stars: 0, bestList: true,  cuisine: "Northwest frontier",     area: "ITC Maurya" },
  ],
  Sydney: [
    { name: "Quay",                               stars: 0, bestList: true,  cuisine: "Modern Australian",      area: "Circular Quay" },
    { name: "Tetsuya's",                          stars: 0, bestList: true,  cuisine: "Japanese-French",        area: "CBD" },
    { name: "Sepia",                              stars: 0, bestList: true,  cuisine: "Modern Australian",      area: "CBD" },
    { name: "Bennelong",                          stars: 0, bestList: true,  cuisine: "Modern Australian",      area: "Sydney Opera House" },
  ],
  Melbourne: [
    { name: "Attica",                             stars: 0, bestList: true,  cuisine: "Modern Australian",      area: "Ripponlea" },
    { name: "Vue de monde",                       stars: 0, bestList: true,  cuisine: "Modern Australian",      area: "Rialto Tower" },
  ],
  "Cape Town": [
    { name: "FYN",                                stars: 0, bestList: true,  cuisine: "Modern South African",   area: "City Centre" },
    { name: "La Colombe",                         stars: 0, bestList: true,  cuisine: "Modern South African",   area: "Constantia" },
    { name: "Wolfgat",                            stars: 0, bestList: true,  cuisine: "Strandveldkos",          area: "Paternoster (nearby)" },
  ],
  Marrakech: [
    { name: "La Grande Table Marocaine",          stars: 0, bestList: false, cuisine: "Modern Moroccan",        area: "Royal Mansour" },
    { name: "Le Jardin",                          stars: 0, bestList: false, cuisine: "Moroccan",               area: "Medina" },
  ],
};

// Normalize a free-text location to one of our keys via substring match.
export function picksForCity(cityRaw) {
  if (!cityRaw) return null;
  const haystack = String(cityRaw).toLowerCase();
  for (const key of Object.keys(MICHELIN_PICKS)) {
    if (haystack.includes(key.toLowerCase())) return { city: key, picks: MICHELIN_PICKS[key] };
  }
  const parts = String(cityRaw).split(/[,/·]/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const p = part.toLowerCase();
    for (const key of Object.keys(MICHELIN_PICKS)) {
      if (p.includes(key.toLowerCase()) || key.toLowerCase().includes(p)) return { city: key, picks: MICHELIN_PICKS[key] };
    }
  }
  return null;
}

// Deep-link helpers. Live availability requires a Resy/OpenTable partnership;
// these open each platform's search for that restaurant + city so the user can
// check open times in one tap.
const enc = (s) => encodeURIComponent(String(s || "").trim());

export const resyUrl = (name, city) =>
  `https://resy.com/search?q=${enc(`${name} ${city || ""}`)}`;

export const openTableUrl = (name, city) =>
  `https://www.opentable.com/s?term=${enc(name)}${city ? `&q=${enc(city)}` : ""}`;

export const googleUrl = (name, city) =>
  `https://www.google.com/search?q=${enc(`${name} ${city || ""} reservations`)}`;

// Kept for back-compat with the original component.
export const bookingSearchUrl = googleUrl;

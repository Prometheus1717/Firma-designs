// Comprehensive world cities database for astrocartography
// Tier 1: Major world cities — always checked for line proximity
// Tier 2: Important cities — shown on zoom-in
// Tier 3: Smaller cities & notable locations — shown at deeper zoom

// Format: [latitude, longitude, name, tier]
// tier 1 = major, 2 = medium, 3 = detail

const CITIES = [
  // ═══════════════════════════════════════════
  // EUROPE
  // ═══════════════════════════════════════════

  // UK & Ireland
  [51.51, -0.13, 'London', 1], [53.48, -2.24, 'Manchester', 1], [55.95, -3.19, 'Edinburgh', 1],
  [53.35, -6.26, 'Dublin', 1], [51.45, -2.59, 'Bristol', 2], [52.49, -1.89, 'Birmingham', 2],
  [53.41, -2.98, 'Liverpool', 2], [54.97, -1.61, 'Newcastle', 2], [53.80, -1.55, 'Leeds', 2],
  [51.38, -2.36, 'Bath', 3], [51.75, -1.26, 'Oxford', 3], [52.21, 0.12, 'Cambridge', 3],
  [50.72, -1.88, 'Bournemouth', 3], [50.38, -4.14, 'Plymouth', 3], [56.46, -2.97, 'Dundee', 3],
  [57.15, -2.09, 'Aberdeen', 3], [56.40, -5.47, 'Oban', 3], [55.86, -4.25, 'Glasgow', 2],
  [54.60, -5.93, 'Belfast', 2], [51.88, -8.47, 'Cork', 2], [52.67, -8.63, 'Limerick', 3],
  [53.27, -9.06, 'Galway', 3], [50.83, -0.14, 'Brighton', 3], [51.48, -3.18, 'Cardiff', 2],

  // France
  [48.86, 2.35, 'Paris', 1], [43.30, 5.37, 'Marseille', 1], [45.76, 4.84, 'Lyon', 1],
  [43.61, 1.44, 'Toulouse', 2], [43.71, 7.26, 'Nice', 2], [44.84, -0.58, 'Bordeaux', 2],
  [47.22, -1.55, 'Nantes', 2], [48.58, 7.75, 'Strasbourg', 2], [43.61, 3.87, 'Montpellier', 2],
  [48.11, -1.68, 'Rennes', 3], [47.47, -0.56, 'Angers', 3], [48.39, -4.49, 'Brest', 3],
  [46.58, 0.34, 'Poitiers', 3], [45.44, 4.39, 'St-Étienne', 3], [49.44, 1.10, 'Rouen', 3],
  [43.53, 5.45, 'Aix-en-Provence', 3], [41.93, 8.74, 'Ajaccio', 3], [42.70, 9.45, 'Bastia', 3],
  [49.26, 4.03, 'Reims', 3], [50.63, 3.06, 'Lille', 2],

  // Germany
  [52.52, 13.40, 'Berlin', 1], [48.14, 11.58, 'München', 1], [50.11, 8.68, 'Frankfurt', 1],
  [53.55, 9.99, 'Hamburg', 1], [50.94, 6.96, 'Köln', 1], [51.23, 6.78, 'Düsseldorf', 1],
  [48.78, 9.18, 'Stuttgart', 1], [51.34, 12.37, 'Leipzig', 2], [51.05, 13.74, 'Dresden', 2],
  [52.27, 10.52, 'Braunschweig', 3], [49.45, 11.08, 'Nürnberg', 2], [53.08, 8.80, 'Bremen', 2],
  [52.38, 9.73, 'Hannover', 2], [49.99, 8.27, 'Mainz', 3], [54.32, 10.14, 'Kiel', 3],
  [54.09, 12.13, 'Rostock', 3], [49.01, 8.40, 'Karlsruhe', 3], [51.45, 7.01, 'Essen', 2],
  [51.51, 7.47, 'Dortmund', 2], [47.99, 7.85, 'Freiburg', 3], [50.78, 6.08, 'Aachen', 3],
  [49.24, 6.99, 'Saarbrücken', 3], [47.56, 9.69, 'Bregenz', 3],

  // Benelux
  [50.85, 4.35, 'Bruxelles', 1], [52.37, 4.90, 'Amsterdam', 1], [51.92, 4.48, 'Rotterdam', 2],
  [52.09, 5.12, 'Utrecht', 2], [51.44, 5.47, 'Eindhoven', 3], [53.22, 6.57, 'Groningen', 3],
  [49.60, 6.13, 'Luxembourg', 2], [50.63, 5.57, 'Liège', 3], [51.05, 3.72, 'Gent', 3],
  [51.22, 4.40, 'Antwerpen', 2], [51.99, 4.37, 'Den Haag', 2],

  // Switzerland & Austria
  [47.37, 8.54, 'Zürich', 1], [46.20, 6.14, 'Genève', 1], [46.95, 7.45, 'Bern', 2],
  [47.56, 7.59, 'Basel', 2], [46.52, 6.63, 'Lausanne', 2], [47.05, 8.31, 'Luzern', 3],
  [46.01, 8.96, 'Lugano', 3], [46.85, 9.53, 'Chur', 3],
  [48.21, 16.37, 'Wien', 1], [47.07, 15.44, 'Graz', 2], [47.26, 11.39, 'Innsbruck', 2],
  [47.80, 13.04, 'Salzburg', 2], [48.30, 14.29, 'Linz', 3], [46.62, 14.31, 'Klagenfurt', 3],

  // Iberian Peninsula
  [40.42, -3.70, 'Madrid', 1], [41.39, 2.17, 'Barcelona', 1], [39.47, -0.38, 'Valencia', 1],
  [37.39, -5.98, 'Sevilla', 2], [37.18, -3.60, 'Granada', 2], [36.72, -4.42, 'Málaga', 2],
  [43.26, -2.93, 'Bilbao', 2], [42.88, -8.54, 'Santiago', 3], [28.12, -15.43, 'Las Palmas', 2],
  [38.35, -0.48, 'Alicante', 3], [39.57, 2.65, 'Palma', 2], [28.47, -16.25, 'Tenerife', 2],
  [43.36, -8.41, 'A Coruña', 3], [37.88, -4.78, 'Córdoba', 3], [41.65, -0.89, 'Zaragoza', 2],
  [38.72, -9.14, 'Lisboa', 1], [41.16, -8.63, 'Porto', 1], [38.74, -9.15, 'Cascais', 3],
  [37.02, -7.94, 'Faro', 3], [32.65, -16.91, 'Funchal', 3], [37.75, -25.68, 'Ponta Delgada', 3],

  // Italy
  [45.46, 9.19, 'Milano', 1], [41.90, 12.50, 'Roma', 1], [43.77, 11.25, 'Firenze', 1],
  [40.85, 14.27, 'Napoli', 1], [45.44, 12.34, 'Venezia', 2], [44.49, 11.34, 'Bologna', 2],
  [45.07, 7.69, 'Torino', 2], [44.41, 8.95, 'Genova', 2], [40.64, 14.60, 'Amalfi', 3],
  [38.12, 13.36, 'Palermo', 2], [37.50, 15.09, 'Catania', 3], [39.22, 9.12, 'Cagliari', 3],
  [43.72, 10.40, 'Pisa', 3], [44.06, 12.57, 'Rimini', 3], [45.65, 13.78, 'Trieste', 3],
  [46.07, 11.12, 'Trento', 3], [40.68, 14.77, 'Positano', 3], [40.75, 14.49, 'Sorrento', 3],
  [45.40, 11.88, 'Verona', 2], [43.32, 11.33, 'Siena', 3],

  // Scandinavia
  [59.33, 18.07, 'Stockholm', 1], [59.91, 10.75, 'Oslo', 1], [55.68, 12.57, 'København', 1],
  [60.17, 24.94, 'Helsinki', 1], [57.71, 11.97, 'Göteborg', 2], [55.60, 13.00, 'Malmö', 2],
  [63.43, 10.39, 'Trondheim', 2], [69.65, 18.96, 'Tromsø', 3], [60.39, 5.32, 'Bergen', 2],
  [61.50, 23.79, 'Tampere', 3], [60.45, 22.27, 'Turku', 3], [66.50, 25.77, 'Rovaniemi', 3],
  [64.15, -21.94, 'Reykjavík', 1], [65.68, -18.09, 'Akureyri', 3],
  [62.00, 6.77, 'Tórshavn', 3], [56.16, 10.21, 'Aarhus', 2],

  // Eastern Europe & Balkans
  [50.08, 14.44, 'Praha', 1], [52.23, 21.01, 'Warszawa', 1], [47.50, 19.04, 'Budapest', 1],
  [44.43, 26.10, 'Bucureşti', 1], [42.70, 23.32, 'Sofia', 1], [44.82, 20.46, 'Beograd', 1],
  [45.81, 15.98, 'Zagreb', 2], [46.06, 14.51, 'Ljubljana', 2], [43.86, 18.41, 'Sarajevo', 2],
  [42.44, 19.26, 'Podgorica', 3], [41.33, 19.82, 'Tirana', 2], [42.00, 21.43, 'Skopje', 2],
  [43.21, 17.01, 'Dubrovnik', 3], [43.51, 16.44, 'Split', 3], [50.06, 19.94, 'Kraków', 2],
  [51.77, 19.46, 'Łódź', 3], [54.35, 18.65, 'Gdańsk', 2], [51.11, 17.04, 'Wrocław', 2],
  [46.77, 23.60, 'Cluj-Napoca', 3], [47.16, 27.58, 'Iaşi', 3],
  [56.95, 24.11, 'Riga', 1], [54.69, 25.28, 'Vilnius', 1], [59.44, 24.75, 'Tallinn', 1],

  // Russia & CIS
  [55.75, 37.62, 'Moscow', 1], [59.93, 30.32, 'St Petersburg', 1], [50.45, 30.52, 'Kyiv', 1],
  [53.90, 27.57, 'Minsk', 1], [56.85, 60.61, 'Yekaterinburg', 2], [55.03, 82.92, 'Novosibirsk', 2],
  [43.24, 76.95, 'Almaty', 2], [41.31, 69.28, 'Tashkent', 2], [51.17, 71.43, 'Astana', 2],
  [38.56, 68.77, 'Dushanbe', 3], [42.87, 74.59, 'Bishkek', 3], [37.94, 58.38, 'Ashgabat', 3],
  [41.69, 44.80, 'Tbilisi', 2], [40.18, 44.51, 'Yerevan', 2], [40.41, 49.87, 'Baku', 2],
  [48.47, 35.04, 'Dnipro', 3], [46.48, 30.73, 'Odesa', 2], [49.84, 24.03, 'Lviv', 2],
  [54.72, 55.95, 'Ufa', 3], [56.33, 43.99, 'Nizhny Novgorod', 2],
  [43.12, 131.87, 'Vladivostok', 2], [62.03, 129.73, 'Yakutsk', 3],

  // Greece & Cyprus
  [37.98, 23.73, 'Athina', 1], [40.64, 22.94, 'Thessaloniki', 2],
  [35.34, 25.13, 'Heraklion', 2], [36.39, 25.46, 'Santorini', 3], [37.44, 25.35, 'Mykonos', 3],
  [39.62, 19.92, 'Corfu', 3], [35.17, 33.36, 'Nicosia', 2], [34.68, 33.04, 'Limassol', 3],
  [36.72, 24.47, 'Milos', 3], [35.51, 24.02, 'Chania', 3],

  // Turkey
  [41.01, 28.98, 'İstanbul', 1], [39.92, 32.85, 'Ankara', 1], [38.42, 27.14, 'İzmir', 1],
  [36.90, 30.69, 'Antalya', 2], [37.00, 35.33, 'Adana', 2], [39.67, 27.88, 'Balıkesir', 3],
  [40.19, 29.06, 'Bursa', 2], [37.87, 32.49, 'Konya', 3], [38.73, 35.49, 'Kayseri', 3],
  [41.27, 36.34, 'Samsun', 3], [39.77, 30.52, 'Eskişehir', 3], [36.80, 34.63, 'Mersin', 3],
  [37.07, 37.38, 'Gaziantep', 2], [40.99, 39.72, 'Trabzon', 3],

  // ═══════════════════════════════════════════
  // NORTH AMERICA
  // ═══════════════════════════════════════════

  // USA — Major
  [40.71, -74.01, 'New York', 1], [34.05, -118.24, 'Los Angeles', 1], [41.88, -87.63, 'Chicago', 1],
  [29.76, -95.37, 'Houston', 1], [33.45, -112.07, 'Phoenix', 1], [39.74, -104.99, 'Denver', 1],
  [37.77, -122.42, 'San Francisco', 1], [47.61, -122.33, 'Seattle', 1], [25.76, -80.19, 'Miami', 1],
  [38.91, -77.04, 'Washington DC', 1], [42.36, -71.06, 'Boston', 1], [36.17, -115.14, 'Las Vegas', 1],
  [32.72, -117.16, 'San Diego', 1], [30.27, -97.74, 'Austin', 1],

  // USA — Secondary
  [39.95, -75.17, 'Philadelphia', 2], [35.23, -80.84, 'Charlotte', 2], [32.78, -96.80, 'Dallas', 2],
  [29.95, -90.07, 'New Orleans', 2], [35.15, -90.05, 'Memphis', 2], [36.16, -86.78, 'Nashville', 2],
  [33.75, -84.39, 'Atlanta', 1], [27.95, -82.46, 'Tampa', 2], [28.54, -81.38, 'Orlando', 2],
  [42.33, -83.05, 'Detroit', 2], [44.98, -93.27, 'Minneapolis', 2], [38.63, -90.20, 'St Louis', 2],
  [39.10, -94.58, 'Kansas City', 2], [41.26, -95.94, 'Omaha', 3], [45.52, -122.68, 'Portland OR', 2],
  [21.31, -157.86, 'Honolulu', 1], [37.34, -121.89, 'San Jose', 2], [36.74, -119.77, 'Fresno', 3],
  [47.66, -117.43, 'Spokane', 3], [46.87, -113.99, 'Missoula', 3], [43.62, -116.21, 'Boise', 3],
  [40.76, -111.89, 'Salt Lake City', 2], [35.08, -106.65, 'Albuquerque', 2], [32.22, -110.97, 'Tucson', 3],
  [26.12, -80.14, 'Fort Lauderdale', 3], [26.72, -80.05, 'West Palm Beach', 3],
  [35.47, -97.52, 'Oklahoma City', 3], [30.33, -81.66, 'Jacksonville', 3],
  [35.96, -83.92, 'Knoxville', 3], [38.25, -85.76, 'Louisville', 3],
  [39.77, -86.16, 'Indianapolis', 2], [43.04, -87.91, 'Milwaukee', 3],
  [40.44, -80.00, 'Pittsburgh', 2], [37.54, -77.44, 'Richmond', 3],
  [36.85, -75.98, 'Virginia Beach', 3], [33.52, -86.80, 'Birmingham AL', 3],
  [32.37, -86.30, 'Montgomery', 3], [31.97, -81.09, 'Savannah', 3],
  [34.00, -81.03, 'Columbia SC', 3], [32.78, -79.93, 'Charleston SC', 3],

  // Hawaii
  [21.31, -157.86, 'Honolulu', 1], [20.90, -156.47, 'Maui', 2], [19.73, -155.08, 'Hilo', 2],
  [19.92, -155.89, 'Kailua-Kona', 3], [21.97, -159.37, 'Kauai', 3], [22.20, -159.50, 'Lihue', 3],

  // Alaska
  [61.22, -149.90, 'Anchorage', 2], [64.84, -147.72, 'Fairbanks', 3], [58.30, -134.42, 'Juneau', 3],

  // Canada
  [45.50, -73.57, 'Montréal', 1], [43.65, -79.38, 'Toronto', 1], [49.28, -123.12, 'Vancouver', 1],
  [51.05, -114.07, 'Calgary', 1], [53.55, -113.49, 'Edmonton', 2], [45.42, -75.69, 'Ottawa', 2],
  [46.81, -71.21, 'Québec City', 2], [44.65, -63.57, 'Halifax', 2], [49.90, -97.14, 'Winnipeg', 2],
  [52.13, -106.67, 'Saskatoon', 3], [50.45, -104.62, 'Regina', 3], [47.56, -52.71, 'St John\'s', 3],
  [48.45, -89.23, 'Thunder Bay', 3], [62.45, -114.37, 'Yellowknife', 3],
  [60.72, -135.05, 'Whitehorse', 3], [63.75, -68.52, 'Iqaluit', 3],

  // Mexico
  [19.43, -99.13, 'México City', 1], [20.67, -103.35, 'Guadalajara', 1], [25.67, -100.31, 'Monterrey', 2],
  [21.16, -86.85, 'Cancún', 2], [20.97, -89.62, 'Mérida', 2], [19.18, -96.14, 'Veracruz', 3],
  [24.14, -110.31, 'La Paz', 3], [22.89, -109.92, 'Cabo San Lucas', 3],
  [32.52, -117.02, 'Tijuana', 2], [20.63, -87.08, 'Tulum', 3], [16.86, -99.88, 'Acapulco', 3],
  [17.06, -96.73, 'Oaxaca', 3], [22.15, -100.98, 'San Luis Potosí', 3],
  [20.21, -87.43, 'Playa del Carmen', 3], [16.75, -93.12, 'Tuxtla Gutiérrez', 3],

  // Central America & Caribbean
  [14.63, -90.51, 'Guatemala City', 1], [9.93, -84.08, 'San José CR', 1],
  [13.69, -89.19, 'San Salvador', 2], [14.07, -87.19, 'Tegucigalpa', 2],
  [12.11, -86.27, 'Managua', 2], [8.97, -79.53, 'Panama City', 1],
  [18.47, -69.90, 'Santo Domingo', 2], [23.14, -82.38, 'Havana', 1],
  [18.01, -76.79, 'Kingston', 2], [18.43, -66.07, 'San Juan', 2],
  [17.25, -88.77, 'Belize City', 3], [12.12, -68.88, 'Willemstad', 3],
  [10.50, -66.92, 'Caracas', 1], [6.23, -75.57, 'Medellín', 2],
  [17.99, -76.80, 'Montego Bay', 3], [13.16, -59.55, 'Bridgetown', 3],
  [14.62, -61.06, 'Fort-de-France', 3], [10.65, -61.50, 'Port of Spain', 3],

  // ═══════════════════════════════════════════
  // SOUTH AMERICA
  // ═══════════════════════════════════════════
  [4.71, -74.07, 'Bogotá', 1], [-0.18, -78.47, 'Quito', 1], [-12.05, -77.04, 'Lima', 1],
  [-33.45, -70.67, 'Santiago', 1], [-34.60, -58.38, 'Buenos Aires', 1],
  [-22.91, -43.17, 'Rio de Janeiro', 1], [-23.55, -46.63, 'São Paulo', 1],
  [-15.79, -47.88, 'Brasília', 1], [10.50, -66.92, 'Caracas', 1],
  [-16.50, -68.15, 'La Paz', 2], [-1.83, -79.53, 'Guayaquil', 2],
  [-3.74, -73.25, 'Iquitos', 3], [-13.52, -71.97, 'Cusco', 2],
  [-27.47, -58.83, 'Corrientes', 3], [-31.42, -64.18, 'Córdoba AR', 2],
  [-38.95, -68.07, 'Neuquén', 3], [-41.13, -71.31, 'Bariloche', 3],
  [-54.80, -68.30, 'Ushuaia', 3], [-51.62, -69.22, 'Río Gallegos', 3],
  [-2.50, -44.28, 'São Luís', 3], [-8.05, -34.87, 'Recife', 2],
  [-12.97, -38.51, 'Salvador', 2], [-3.72, -38.53, 'Fortaleza', 2],
  [-1.46, -48.50, 'Belém', 3], [-3.12, -60.02, 'Manaus', 2],
  [-25.43, -49.27, 'Curitiba', 2], [-30.03, -51.23, 'Porto Alegre', 2],
  [-19.92, -43.94, 'Belo Horizonte', 2], [-20.45, -54.62, 'Campo Grande', 3],
  [-22.32, -49.07, 'Bauru', 3], [-27.60, -48.55, 'Florianópolis', 3],
  [5.84, -55.20, 'Paramaribo', 3], [4.86, -52.33, 'Cayenne', 3],
  [6.80, -58.16, 'Georgetown', 3], [-25.26, -57.58, 'Asunción', 2],
  [-34.88, -56.16, 'Montevideo', 1], [-0.25, -79.17, 'Santo Domingo EC', 3],
  [3.44, -76.52, 'Cali', 2], [10.39, -75.51, 'Cartagena', 2],
  [7.12, -73.12, 'Bucaramanga', 3], [-17.39, -66.16, 'Cochabamba', 3],
  [-19.04, -65.26, 'Sucre', 3], [-33.03, -71.63, 'Valparaíso', 2],
  [-39.81, -73.24, 'Valdivia', 3], [-53.15, -70.92, 'Punta Arenas', 3],

  // ═══════════════════════════════════════════
  // MIDDLE EAST
  // ═══════════════════════════════════════════
  [35.69, 51.39, 'Tehran', 1], [33.31, 44.37, 'Baghdad', 1], [24.71, 46.68, 'Riyadh', 1],
  [25.20, 55.27, 'Dubai', 1], [21.42, 39.83, 'Mecca', 1], [31.95, 35.93, 'Amman', 1],
  [33.89, 35.50, 'Beirut', 1], [32.08, 34.78, 'Tel Aviv', 1],
  [31.77, 35.23, 'Jerusalem', 1], [25.29, 51.53, 'Doha', 2],
  [24.45, 54.65, 'Abu Dhabi', 2], [23.59, 58.38, 'Muscat', 2],
  [26.23, 50.59, 'Manama', 3], [29.38, 47.99, 'Kuwait City', 2],
  [15.35, 44.21, 'Sana\'a', 2], [12.78, 45.04, 'Aden', 3],
  [36.19, 44.01, 'Erbil', 3], [36.35, 43.16, 'Mosul', 3],
  [30.51, 47.81, 'Basra', 3], [34.73, 36.71, 'Homs', 3],
  [33.51, 36.31, 'Damascus', 1], [36.20, 37.16, 'Aleppo', 2],
  [32.92, 35.09, 'Haifa', 2], [34.44, 35.83, 'Tripoli LB', 3],
  [32.62, 44.02, 'Karbala', 3], [24.47, 39.61, 'Medina', 2],
  [21.49, 39.19, 'Jeddah', 2], [38.07, 46.30, 'Tabriz', 2],
  [32.65, 51.68, 'Isfahan', 2], [29.61, 52.53, 'Shiraz', 2],
  [36.30, 59.60, 'Mashhad', 2],

  // ═══════════════════════════════════════════
  // AFRICA
  // ═══════════════════════════════════════════
  [30.04, 31.24, 'Cairo', 1], [36.75, 3.04, 'Algiers', 1], [33.97, -6.85, 'Rabat', 1],
  [6.52, 3.38, 'Lagos', 1], [-1.29, 36.82, 'Nairobi', 1], [-33.92, 18.42, 'Cape Town', 1],
  [-26.20, 28.04, 'Johannesburg', 1], [9.02, 38.75, 'Addis Ababa', 1], [5.56, -0.19, 'Accra', 1],
  [33.59, -7.62, 'Casablanca', 1], [36.81, 10.18, 'Tunis', 1],
  [31.63, -8.01, 'Marrakech', 2], [34.02, -5.00, 'Fès', 3], [35.19, -3.93, 'Nador', 3],
  [32.88, 13.18, 'Tripoli', 2], [14.69, -17.44, 'Dakar', 1],
  [12.65, -8.00, 'Bamako', 2], [13.51, 2.13, 'Niamey', 3], [12.37, -1.52, 'Ouagadougou', 3],
  [6.69, -1.62, 'Kumasi', 3], [9.06, 7.49, 'Abuja', 2], [7.49, 3.90, 'Ibadan', 3],
  [4.05, 9.77, 'Douala', 2], [3.87, 11.52, 'Yaoundé', 2], [6.37, 2.43, 'Cotonou', 3],
  [6.13, 1.22, 'Lomé', 3], [5.32, -4.01, 'Abidjan', 2], [8.50, -13.27, 'Freetown', 3],
  [6.30, -10.80, 'Monrovia', 3], [0.39, 9.45, 'Libreville', 3],
  [-4.32, 15.31, 'Brazzaville', 2], [-4.27, 15.28, 'Kinshasa', 1],
  [-11.66, 27.48, 'Lubumbashi', 3], [-8.84, 13.23, 'Luanda', 2],
  [-15.42, 28.28, 'Lusaka', 2], [-17.83, 31.05, 'Harare', 2],
  [-25.97, 32.57, 'Maputo', 2], [-13.97, 33.79, 'Lilongwe', 3],
  [-6.17, 35.75, 'Dodoma', 3], [-6.80, 39.28, 'Dar es Salaam', 2],
  [-1.95, 30.06, 'Kigali', 2], [-3.38, 29.36, 'Bujumbura', 3],
  [0.35, 32.58, 'Kampala', 2], [15.60, 32.53, 'Khartoum', 2],
  [2.05, 45.32, 'Mogadishu', 2], [11.59, 43.15, 'Djibouti', 3],
  [15.34, 38.93, 'Asmara', 3], [-20.16, 57.50, 'Port Louis', 3],
  [-4.62, 55.45, 'Victoria SC', 3], [-21.12, 55.53, 'Saint-Denis', 3],
  [-18.91, 47.52, 'Antananarivo', 2], [-12.27, 44.29, 'Moroni', 3],
  [-25.74, 28.19, 'Pretoria', 2], [-29.86, 31.02, 'Durban', 2],
  [-33.96, 25.60, 'Port Elizabeth', 3], [24.09, 32.90, 'Luxor', 3],
  [27.18, 31.17, 'Asyut', 3], [31.20, 29.92, 'Alexandria', 2],

  // ═══════════════════════════════════════════
  // EAST ASIA
  // ═══════════════════════════════════════════
  [39.91, 116.39, 'Beijing', 1], [31.23, 121.47, 'Shanghai', 1], [22.32, 114.17, 'Hong Kong', 1],
  [23.13, 113.26, 'Guangzhou', 1], [30.57, 104.07, 'Chengdu', 1],
  [22.54, 114.06, 'Shenzhen', 1], [39.12, 117.20, 'Tianjin', 2],
  [29.56, 106.55, 'Chongqing', 2], [34.26, 108.94, 'Xi\'an', 2],
  [30.29, 120.15, 'Hangzhou', 2], [32.06, 118.78, 'Nanjing', 2],
  [36.07, 120.38, 'Qingdao', 2], [23.02, 113.75, 'Dongguan', 3],
  [22.28, 114.16, 'Kowloon', 3], [22.20, 113.55, 'Macau', 2],
  [45.75, 126.65, 'Harbin', 2], [43.88, 125.32, 'Changchun', 3],
  [41.80, 123.43, 'Shenyang', 2], [38.91, 121.60, 'Dalian', 3],
  [24.48, 118.09, 'Xiamen', 3], [26.07, 119.30, 'Fuzhou', 3],
  [28.68, 115.86, 'Nanchang', 3], [27.99, 120.70, 'Wenzhou', 3],
  [36.65, 116.98, 'Jinan', 3], [34.75, 113.65, 'Zhengzhou', 2],
  [30.58, 114.27, 'Wuhan', 2], [28.23, 112.94, 'Changsha', 2],
  [25.04, 102.71, 'Kunming', 2], [18.25, 109.50, 'Sanya', 3],
  [22.82, 108.32, 'Nanning', 3], [29.87, 121.55, 'Ningbo', 3],
  [47.35, 123.92, 'Daqing', 3], [43.80, 87.60, 'Ürümqi', 2],
  [36.62, 101.78, 'Xining', 3], [29.65, 91.11, 'Lhasa', 2],

  // Japan
  [35.68, 139.69, 'Tokyo', 1], [34.69, 135.50, 'Osaka', 1], [35.01, 135.77, 'Kyoto', 1],
  [35.18, 136.91, 'Nagoya', 2], [33.59, 130.40, 'Fukuoka', 2], [43.06, 141.35, 'Sapporo', 2],
  [38.27, 140.87, 'Sendai', 2], [34.39, 132.46, 'Hiroshima', 2],
  [35.66, 139.64, 'Yokohama', 2], [34.67, 135.19, 'Kobe', 2],
  [26.33, 127.80, 'Naha', 2], [36.56, 136.66, 'Kanazawa', 3],
  [32.75, 129.88, 'Nagasaki', 3], [42.92, 143.20, 'Obihiro', 3],
  [31.60, 130.56, 'Kagoshima', 3], [34.34, 134.04, 'Matsuyama', 3],

  // Korea
  [37.57, 126.98, 'Seoul', 1], [35.18, 129.08, 'Busan', 1],
  [35.87, 128.60, 'Daegu', 2], [35.16, 126.85, 'Gwangju', 2],
  [36.35, 127.38, 'Daejeon', 2], [37.46, 126.71, 'Incheon', 2],
  [33.49, 126.53, 'Jeju', 2], [37.87, 127.73, 'Chuncheon', 3],

  // Taiwan
  [25.03, 121.57, 'Taipei', 1], [22.63, 120.30, 'Kaohsiung', 2],
  [24.15, 120.67, 'Taichung', 2], [22.99, 120.21, 'Tainan', 3],
  [24.80, 120.97, 'Hsinchu', 3],

  // Mongolia
  [47.92, 106.92, 'Ulaanbaatar', 2],

  // ═══════════════════════════════════════════
  // SOUTH & SOUTHEAST ASIA
  // ═══════════════════════════════════════════
  [28.61, 77.21, 'Delhi', 1], [19.08, 72.88, 'Mumbai', 1], [12.97, 77.59, 'Bengaluru', 1],
  [22.57, 88.36, 'Kolkata', 1], [17.39, 78.49, 'Hyderabad', 2], [13.08, 80.27, 'Chennai', 2],
  [26.85, 80.95, 'Lucknow', 2], [23.03, 72.57, 'Ahmedabad', 2], [18.52, 73.86, 'Pune', 2],
  [26.91, 75.79, 'Jaipur', 2], [30.73, 76.78, 'Chandigarh', 3], [25.32, 82.99, 'Varanasi', 3],
  [11.02, 76.97, 'Coimbatore', 3], [9.93, 76.26, 'Kochi', 2], [8.52, 76.94, 'Thiruvananthapuram', 3],
  [15.49, 73.83, 'Goa', 2], [34.08, 74.80, 'Srinagar', 3], [32.27, 75.64, 'Jammu', 3],
  [21.17, 72.83, 'Surat', 2], [15.36, 75.12, 'Hubli', 3],
  [27.18, 84.99, 'Kathmandu', 1], [27.47, 89.64, 'Thimphu', 3],
  [33.69, 73.04, 'Islamabad', 1], [31.56, 74.35, 'Lahore', 2],
  [24.86, 67.01, 'Karachi', 1], [30.20, 71.45, 'Multan', 3],
  [34.01, 71.58, 'Peshawar', 3], [25.43, 68.37, 'Hyderabad PK', 3],
  [23.81, 90.41, 'Dhaka', 1], [22.34, 91.83, 'Chittagong', 2],
  [6.93, 79.84, 'Colombo', 1], [7.29, 80.64, 'Kandy', 3],
  [4.18, 73.51, 'Malé', 3],

  // Southeast Asia
  [1.35, 103.82, 'Singapore', 1], [13.76, 100.50, 'Bangkok', 1],
  [21.03, 105.85, 'Hanoi', 1], [10.82, 106.63, 'Ho Chi Minh City', 1],
  [14.60, 120.98, 'Manila', 1], [-6.21, 106.85, 'Jakarta', 1],
  [3.14, 101.69, 'Kuala Lumpur', 1],
  [11.56, 104.92, 'Phnom Penh', 2], [17.97, 102.63, 'Vientiane', 2],
  [16.87, 96.20, 'Yangon', 2], [19.77, 96.10, 'Mandalay', 3],
  [13.36, 103.86, 'Siem Reap', 3], [16.06, 108.22, 'Da Nang', 2],
  [7.88, 98.39, 'Phuket', 2], [18.79, 98.98, 'Chiang Mai', 2],
  [9.14, 99.33, 'Koh Samui', 3], [8.10, 98.90, 'Krabi', 3],
  [-8.65, 115.22, 'Bali', 1], [-7.80, 110.36, 'Yogyakarta', 2],
  [-7.25, 112.75, 'Surabaya', 2], [3.59, 98.67, 'Medan', 3],
  [5.42, 100.33, 'Penang', 2], [1.55, 110.35, 'Kuching', 3],
  [5.98, 116.07, 'Kota Kinabalu', 3], [4.94, 114.95, 'Bandar Seri Begawan', 3],
  [10.31, 123.89, 'Cebu', 2], [7.07, 125.61, 'Davao', 3],
  [-2.95, 104.75, 'Palembang', 3], [-5.15, 119.42, 'Makassar', 3],
  [-8.58, 116.12, 'Lombok', 3], [10.75, 106.67, 'Saigon', 3],

  // ═══════════════════════════════════════════
  // CENTRAL ASIA & AFGHANISTAN
  // ═══════════════════════════════════════════
  [34.53, 69.17, 'Kabul', 1], [31.63, 65.71, 'Kandahar', 3],
  [36.71, 67.11, 'Mazar-i-Sharif', 3], [34.34, 62.20, 'Herat', 3],

  // ═══════════════════════════════════════════
  // OCEANIA & PACIFIC
  // ═══════════════════════════════════════════
  [-33.87, 151.21, 'Sydney', 1], [-37.81, 144.96, 'Melbourne', 1],
  [-27.47, 153.03, 'Brisbane', 1], [-31.95, 115.86, 'Perth', 1],
  [-34.93, 138.60, 'Adelaide', 2], [-42.88, 147.33, 'Hobart', 3],
  [-12.46, 130.84, 'Darwin', 3], [-16.92, 145.77, 'Cairns', 2],
  [-28.02, 153.43, 'Gold Coast', 3], [-26.65, 153.07, 'Sunshine Coast', 3],
  [-23.70, 133.88, 'Alice Springs', 3], [-35.28, 149.13, 'Canberra', 2],
  [-36.85, 174.76, 'Auckland', 1], [-41.29, 174.78, 'Wellington', 2],
  [-43.53, 172.64, 'Christchurch', 2], [-45.03, 168.66, 'Queenstown', 3],
  [-46.41, 168.35, 'Invercargill', 3], [-37.79, 175.28, 'Hamilton NZ', 3],
  [-38.14, 176.25, 'Rotorua', 3],

  // Pacific Islands
  [-17.77, 177.96, 'Suva', 2], [-17.78, -177.95, 'Nadi', 3],
  [-13.83, -171.76, 'Apia', 3], [-21.21, -175.20, 'Nuku\'alofa', 3],
  [-22.28, 166.46, 'Nouméa', 3], [-17.73, 168.32, 'Port Vila', 3],
  [-9.48, 147.15, 'Port Moresby', 2], [7.50, 134.62, 'Koror', 3],
  [13.48, 144.78, 'Hagatna', 3], [-14.27, -170.70, 'Pago Pago', 3],
  [1.33, 172.98, 'Tarawa', 3], [-0.53, 166.93, 'Yaren', 3],
  [-8.52, 179.22, 'Funafuti', 3], [7.09, 171.38, 'Majuro', 3],
  [-29.04, 167.96, 'Kingston NI', 3], [-9.43, 159.96, 'Honiara', 3],
  [15.21, 145.75, 'Saipan', 3], [-21.13, -175.20, 'Tongatapu', 3],

  // Tahiti & French Polynesia
  [-17.53, -149.57, 'Papeete', 2], [-16.50, -151.76, 'Bora Bora', 3],
  [-23.13, -134.97, 'Rikitea', 3],

  // ═══════════════════════════════════════════
  // ATLANTIC & REMOTE ISLANDS
  // ═══════════════════════════════════════════
  [32.30, -64.78, 'Hamilton BM', 3], [64.13, -21.90, 'Keflavík', 3],
  [-7.93, -14.36, 'Georgetown AI', 3], [-15.93, -5.72, 'Jamestown', 3],
  [-37.07, 12.31, 'Tristan da Cunha', 3], [-54.28, -36.51, 'Grytviken', 3],
  [78.22, 15.63, 'Longyearbyen', 3],
  [38.72, -27.22, 'Angra do Heroísmo', 3],
];

// City → Country lookup (keyed by city name)
export const CITY_COUNTRY = {
  // UK & Ireland
  'London': 'UK', 'Manchester': 'UK', 'Edinburgh': 'UK', 'Bristol': 'UK', 'Birmingham': 'UK',
  'Liverpool': 'UK', 'Newcastle': 'UK', 'Leeds': 'UK', 'Bath': 'UK', 'Oxford': 'UK',
  'Cambridge': 'UK', 'Bournemouth': 'UK', 'Plymouth': 'UK', 'Dundee': 'UK', 'Aberdeen': 'UK',
  'Oban': 'UK', 'Glasgow': 'UK', 'Belfast': 'UK', 'Brighton': 'UK', 'Cardiff': 'UK',
  'Dublin': 'Ireland', 'Cork': 'Ireland', 'Limerick': 'Ireland', 'Galway': 'Ireland',
  // France
  'Paris': 'France', 'Marseille': 'France', 'Lyon': 'France', 'Toulouse': 'France', 'Nice': 'France',
  'Bordeaux': 'France', 'Nantes': 'France', 'Strasbourg': 'France', 'Montpellier': 'France',
  'Rennes': 'France', 'Angers': 'France', 'Brest': 'France', 'Poitiers': 'France',
  'St-Étienne': 'France', 'Rouen': 'France', 'Aix-en-Provence': 'France', 'Ajaccio': 'France',
  'Bastia': 'France', 'Reims': 'France', 'Lille': 'France',
  // Germany
  'Berlin': 'Germany', 'München': 'Germany', 'Frankfurt': 'Germany', 'Hamburg': 'Germany',
  'Köln': 'Germany', 'Düsseldorf': 'Germany', 'Stuttgart': 'Germany', 'Leipzig': 'Germany',
  'Dresden': 'Germany', 'Braunschweig': 'Germany', 'Nürnberg': 'Germany', 'Bremen': 'Germany',
  'Hannover': 'Germany', 'Mainz': 'Germany', 'Kiel': 'Germany', 'Rostock': 'Germany',
  'Karlsruhe': 'Germany', 'Essen': 'Germany', 'Dortmund': 'Germany', 'Freiburg': 'Germany',
  'Aachen': 'Germany', 'Saarbrücken': 'Germany', 'Bregenz': 'Austria',
  // Benelux
  'Bruxelles': 'Belgium', 'Amsterdam': 'Netherlands', 'Rotterdam': 'Netherlands',
  'Utrecht': 'Netherlands', 'Eindhoven': 'Netherlands', 'Groningen': 'Netherlands',
  'Luxembourg': 'Luxembourg', 'Liège': 'Belgium', 'Gent': 'Belgium', 'Antwerpen': 'Belgium',
  'Den Haag': 'Netherlands',
  // Switzerland & Austria
  'Zürich': 'Switzerland', 'Genève': 'Switzerland', 'Bern': 'Switzerland', 'Basel': 'Switzerland',
  'Lausanne': 'Switzerland', 'Luzern': 'Switzerland', 'Lugano': 'Switzerland', 'Chur': 'Switzerland',
  'Wien': 'Austria', 'Graz': 'Austria', 'Innsbruck': 'Austria', 'Salzburg': 'Austria',
  'Linz': 'Austria', 'Klagenfurt': 'Austria',
  // Iberian Peninsula
  'Madrid': 'Spain', 'Barcelona': 'Spain', 'Valencia': 'Spain', 'Sevilla': 'Spain',
  'Granada': 'Spain', 'Málaga': 'Spain', 'Bilbao': 'Spain', 'Santiago': 'Spain',
  'Las Palmas': 'Spain', 'Alicante': 'Spain', 'Palma': 'Spain', 'Tenerife': 'Spain',
  'A Coruña': 'Spain', 'Córdoba': 'Spain', 'Zaragoza': 'Spain',
  'Lisboa': 'Portugal', 'Porto': 'Portugal', 'Cascais': 'Portugal', 'Faro': 'Portugal',
  'Funchal': 'Portugal', 'Ponta Delgada': 'Portugal',
  // Italy
  'Milano': 'Italy', 'Roma': 'Italy', 'Firenze': 'Italy', 'Napoli': 'Italy', 'Venezia': 'Italy',
  'Bologna': 'Italy', 'Torino': 'Italy', 'Genova': 'Italy', 'Amalfi': 'Italy', 'Palermo': 'Italy',
  'Catania': 'Italy', 'Cagliari': 'Italy', 'Pisa': 'Italy', 'Rimini': 'Italy', 'Trieste': 'Italy',
  'Trento': 'Italy', 'Positano': 'Italy', 'Sorrento': 'Italy', 'Verona': 'Italy', 'Siena': 'Italy',
  // Scandinavia
  'Stockholm': 'Sweden', 'Oslo': 'Norway', 'København': 'Denmark', 'Helsinki': 'Finland',
  'Göteborg': 'Sweden', 'Malmö': 'Sweden', 'Trondheim': 'Norway', 'Tromsø': 'Norway',
  'Bergen': 'Norway', 'Tampere': 'Finland', 'Turku': 'Finland', 'Rovaniemi': 'Finland',
  'Reykjavík': 'Iceland', 'Akureyri': 'Iceland', 'Tórshavn': 'Faroe Islands', 'Aarhus': 'Denmark',
  // Eastern Europe & Balkans
  'Praha': 'Czechia', 'Warszawa': 'Poland', 'Budapest': 'Hungary', 'Bucureşti': 'Romania',
  'Sofia': 'Bulgaria', 'Beograd': 'Serbia', 'Zagreb': 'Croatia', 'Ljubljana': 'Slovenia',
  'Sarajevo': 'Bosnia', 'Podgorica': 'Montenegro', 'Tirana': 'Albania', 'Skopje': 'N. Macedonia',
  'Dubrovnik': 'Croatia', 'Split': 'Croatia', 'Kraków': 'Poland', 'Łódź': 'Poland',
  'Gdańsk': 'Poland', 'Wrocław': 'Poland', 'Cluj-Napoca': 'Romania', 'Iaşi': 'Romania',
  'Riga': 'Latvia', 'Vilnius': 'Lithuania', 'Tallinn': 'Estonia',
  // Russia & CIS
  'Moscow': 'Russia', 'St Petersburg': 'Russia', 'Kyiv': 'Ukraine', 'Minsk': 'Belarus',
  'Yekaterinburg': 'Russia', 'Novosibirsk': 'Russia', 'Almaty': 'Kazakhstan',
  'Tashkent': 'Uzbekistan', 'Astana': 'Kazakhstan', 'Dushanbe': 'Tajikistan',
  'Bishkek': 'Kyrgyzstan', 'Ashgabat': 'Turkmenistan', 'Tbilisi': 'Georgia',
  'Yerevan': 'Armenia', 'Baku': 'Azerbaijan', 'Dnipro': 'Ukraine', 'Odesa': 'Ukraine',
  'Lviv': 'Ukraine', 'Ufa': 'Russia', 'Nizhny Novgorod': 'Russia',
  'Vladivostok': 'Russia', 'Yakutsk': 'Russia',
  // Greece & Cyprus
  'Athina': 'Greece', 'Thessaloniki': 'Greece', 'Heraklion': 'Greece', 'Santorini': 'Greece',
  'Mykonos': 'Greece', 'Corfu': 'Greece', 'Nicosia': 'Cyprus', 'Limassol': 'Cyprus',
  'Milos': 'Greece', 'Chania': 'Greece',
  // Turkey
  'İstanbul': 'Turkey', 'Ankara': 'Turkey', 'İzmir': 'Turkey', 'Antalya': 'Turkey',
  'Adana': 'Turkey', 'Balıkesir': 'Turkey', 'Bursa': 'Turkey', 'Konya': 'Turkey',
  'Kayseri': 'Turkey', 'Samsun': 'Turkey', 'Eskişehir': 'Turkey', 'Mersin': 'Turkey',
  'Gaziantep': 'Turkey', 'Trabzon': 'Turkey',
  // USA
  'New York': 'USA', 'Los Angeles': 'USA', 'Chicago': 'USA', 'Houston': 'USA', 'Phoenix': 'USA',
  'Denver': 'USA', 'San Francisco': 'USA', 'Seattle': 'USA', 'Miami': 'USA',
  'Washington DC': 'USA', 'Boston': 'USA', 'Las Vegas': 'USA', 'San Diego': 'USA', 'Austin': 'USA',
  'Philadelphia': 'USA', 'Charlotte': 'USA', 'Dallas': 'USA', 'New Orleans': 'USA',
  'Memphis': 'USA', 'Nashville': 'USA', 'Atlanta': 'USA', 'Tampa': 'USA', 'Orlando': 'USA',
  'Detroit': 'USA', 'Minneapolis': 'USA', 'St Louis': 'USA', 'Kansas City': 'USA', 'Omaha': 'USA',
  'Portland OR': 'USA', 'Honolulu': 'USA', 'San Jose': 'USA', 'Fresno': 'USA', 'Spokane': 'USA',
  'Missoula': 'USA', 'Boise': 'USA', 'Salt Lake City': 'USA', 'Albuquerque': 'USA',
  'Tucson': 'USA', 'Fort Lauderdale': 'USA', 'West Palm Beach': 'USA', 'Oklahoma City': 'USA',
  'Jacksonville': 'USA', 'Knoxville': 'USA', 'Louisville': 'USA', 'Indianapolis': 'USA',
  'Milwaukee': 'USA', 'Pittsburgh': 'USA', 'Richmond': 'USA', 'Virginia Beach': 'USA',
  'Birmingham AL': 'USA', 'Montgomery': 'USA', 'Savannah': 'USA', 'Columbia SC': 'USA',
  'Charleston SC': 'USA', 'Maui': 'USA', 'Hilo': 'USA', 'Kailua-Kona': 'USA', 'Kauai': 'USA',
  'Lihue': 'USA', 'Anchorage': 'USA', 'Fairbanks': 'USA', 'Juneau': 'USA',
  // Canada
  'Montréal': 'Canada', 'Toronto': 'Canada', 'Vancouver': 'Canada', 'Calgary': 'Canada',
  'Edmonton': 'Canada', 'Ottawa': 'Canada', 'Québec City': 'Canada', 'Halifax': 'Canada',
  'Winnipeg': 'Canada', 'Saskatoon': 'Canada', 'Regina': 'Canada', "St John's": 'Canada',
  'Thunder Bay': 'Canada', 'Yellowknife': 'Canada', 'Whitehorse': 'Canada', 'Iqaluit': 'Canada',
  // Mexico
  'México City': 'Mexico', 'Guadalajara': 'Mexico', 'Monterrey': 'Mexico', 'Cancún': 'Mexico',
  'Mérida': 'Mexico', 'Veracruz': 'Mexico', 'La Paz': 'Mexico', 'Cabo San Lucas': 'Mexico',
  'Tijuana': 'Mexico', 'Tulum': 'Mexico', 'Acapulco': 'Mexico', 'Oaxaca': 'Mexico',
  'San Luis Potosí': 'Mexico', 'Playa del Carmen': 'Mexico', 'Tuxtla Gutiérrez': 'Mexico',
  // Central America & Caribbean
  'Guatemala City': 'Guatemala', 'San José CR': 'Costa Rica', 'San Salvador': 'El Salvador',
  'Tegucigalpa': 'Honduras', 'Managua': 'Nicaragua', 'Panama City': 'Panama',
  'Santo Domingo': 'Dominican Rep.', 'Havana': 'Cuba', 'Kingston': 'Jamaica',
  'San Juan': 'Puerto Rico', 'Belize City': 'Belize', 'Willemstad': 'Curaçao',
  'Caracas': 'Venezuela', 'Medellín': 'Colombia', 'Montego Bay': 'Jamaica',
  'Bridgetown': 'Barbados', 'Fort-de-France': 'Martinique', 'Port of Spain': 'Trinidad',
  // South America
  'Bogotá': 'Colombia', 'Quito': 'Ecuador', 'Lima': 'Peru', 'Santiago': 'Chile',
  'Buenos Aires': 'Argentina', 'Rio de Janeiro': 'Brazil', 'São Paulo': 'Brazil',
  'Brasília': 'Brazil', 'Guayaquil': 'Ecuador', 'Iquitos': 'Peru', 'Cusco': 'Peru',
  'Corrientes': 'Argentina', 'Córdoba AR': 'Argentina', 'Neuquén': 'Argentina',
  'Bariloche': 'Argentina', 'Ushuaia': 'Argentina', 'Río Gallegos': 'Argentina',
  'São Luís': 'Brazil', 'Recife': 'Brazil', 'Salvador': 'Brazil', 'Fortaleza': 'Brazil',
  'Belém': 'Brazil', 'Manaus': 'Brazil', 'Curitiba': 'Brazil', 'Porto Alegre': 'Brazil',
  'Belo Horizonte': 'Brazil', 'Campo Grande': 'Brazil', 'Bauru': 'Brazil',
  'Florianópolis': 'Brazil', 'Paramaribo': 'Suriname', 'Cayenne': 'Fr. Guiana',
  'Georgetown': 'Guyana', 'Asunción': 'Paraguay', 'Montevideo': 'Uruguay',
  'Santo Domingo EC': 'Ecuador', 'Cali': 'Colombia', 'Cartagena': 'Colombia',
  'Bucaramanga': 'Colombia', 'Cochabamba': 'Bolivia', 'Sucre': 'Bolivia',
  'Valparaíso': 'Chile', 'Valdivia': 'Chile', 'Punta Arenas': 'Chile',
  // Middle East
  'Tehran': 'Iran', 'Baghdad': 'Iraq', 'Riyadh': 'Saudi Arabia', 'Dubai': 'UAE',
  'Mecca': 'Saudi Arabia', 'Amman': 'Jordan', 'Beirut': 'Lebanon', 'Tel Aviv': 'Israel',
  'Jerusalem': 'Israel', 'Doha': 'Qatar', 'Abu Dhabi': 'UAE', 'Muscat': 'Oman',
  'Manama': 'Bahrain', 'Kuwait City': 'Kuwait', "Sana'a": 'Yemen', 'Aden': 'Yemen',
  'Erbil': 'Iraq', 'Mosul': 'Iraq', 'Basra': 'Iraq', 'Homs': 'Syria',
  'Damascus': 'Syria', 'Aleppo': 'Syria', 'Haifa': 'Israel', 'Tripoli LB': 'Lebanon',
  'Karbala': 'Iraq', 'Medina': 'Saudi Arabia', 'Jeddah': 'Saudi Arabia',
  'Tabriz': 'Iran', 'Isfahan': 'Iran', 'Shiraz': 'Iran', 'Mashhad': 'Iran',
  // Africa
  'Cairo': 'Egypt', 'Algiers': 'Algeria', 'Rabat': 'Morocco', 'Lagos': 'Nigeria',
  'Nairobi': 'Kenya', 'Cape Town': 'South Africa', 'Johannesburg': 'South Africa',
  'Addis Ababa': 'Ethiopia', 'Accra': 'Ghana', 'Casablanca': 'Morocco', 'Tunis': 'Tunisia',
  'Marrakech': 'Morocco', 'Fès': 'Morocco', 'Nador': 'Morocco', 'Tripoli': 'Libya',
  'Dakar': 'Senegal', 'Bamako': 'Mali', 'Niamey': 'Niger', 'Ouagadougou': 'Burkina Faso',
  'Kumasi': 'Ghana', 'Abuja': 'Nigeria', 'Ibadan': 'Nigeria', 'Douala': 'Cameroon',
  'Yaoundé': 'Cameroon', 'Cotonou': 'Benin', 'Lomé': 'Togo', 'Abidjan': 'Ivory Coast',
  'Freetown': 'Sierra Leone', 'Monrovia': 'Liberia', 'Libreville': 'Gabon',
  'Brazzaville': 'Congo', 'Kinshasa': 'DR Congo', 'Lubumbashi': 'DR Congo',
  'Luanda': 'Angola', 'Lusaka': 'Zambia', 'Harare': 'Zimbabwe', 'Maputo': 'Mozambique',
  'Lilongwe': 'Malawi', 'Dodoma': 'Tanzania', 'Dar es Salaam': 'Tanzania',
  'Kigali': 'Rwanda', 'Bujumbura': 'Burundi', 'Kampala': 'Uganda', 'Khartoum': 'Sudan',
  'Mogadishu': 'Somalia', 'Djibouti': 'Djibouti', 'Asmara': 'Eritrea',
  'Port Louis': 'Mauritius', 'Victoria SC': 'Seychelles', 'Saint-Denis': 'Réunion',
  'Antananarivo': 'Madagascar', 'Moroni': 'Comoros', 'Pretoria': 'South Africa',
  'Durban': 'South Africa', 'Port Elizabeth': 'South Africa', 'Luxor': 'Egypt',
  'Asyut': 'Egypt', 'Alexandria': 'Egypt',
  // East Asia
  'Beijing': 'China', 'Shanghai': 'China', 'Hong Kong': 'China', 'Guangzhou': 'China',
  'Chengdu': 'China', 'Shenzhen': 'China', 'Tianjin': 'China', 'Chongqing': 'China',
  "Xi'an": 'China', 'Hangzhou': 'China', 'Nanjing': 'China', 'Qingdao': 'China',
  'Dongguan': 'China', 'Kowloon': 'China', 'Macau': 'China', 'Harbin': 'China',
  'Changchun': 'China', 'Shenyang': 'China', 'Dalian': 'China', 'Xiamen': 'China',
  'Fuzhou': 'China', 'Nanchang': 'China', 'Wenzhou': 'China', 'Jinan': 'China',
  'Zhengzhou': 'China', 'Wuhan': 'China', 'Changsha': 'China', 'Kunming': 'China',
  'Sanya': 'China', 'Nanning': 'China', 'Ningbo': 'China', 'Daqing': 'China',
  'Ürümqi': 'China', 'Xining': 'China', 'Lhasa': 'China',
  // Japan
  'Tokyo': 'Japan', 'Osaka': 'Japan', 'Kyoto': 'Japan', 'Nagoya': 'Japan', 'Fukuoka': 'Japan',
  'Sapporo': 'Japan', 'Sendai': 'Japan', 'Hiroshima': 'Japan', 'Yokohama': 'Japan',
  'Kobe': 'Japan', 'Naha': 'Japan', 'Kanazawa': 'Japan', 'Nagasaki': 'Japan',
  'Obihiro': 'Japan', 'Kagoshima': 'Japan', 'Matsuyama': 'Japan',
  // Korea
  'Seoul': 'South Korea', 'Busan': 'South Korea', 'Daegu': 'South Korea',
  'Gwangju': 'South Korea', 'Daejeon': 'South Korea', 'Incheon': 'South Korea',
  'Jeju': 'South Korea', 'Chuncheon': 'South Korea',
  // Taiwan
  'Taipei': 'Taiwan', 'Kaohsiung': 'Taiwan', 'Taichung': 'Taiwan', 'Tainan': 'Taiwan',
  'Hsinchu': 'Taiwan',
  // Mongolia
  'Ulaanbaatar': 'Mongolia',
  // South Asia
  'Delhi': 'India', 'Mumbai': 'India', 'Bengaluru': 'India', 'Kolkata': 'India',
  'Hyderabad': 'India', 'Chennai': 'India', 'Lucknow': 'India', 'Ahmedabad': 'India',
  'Pune': 'India', 'Jaipur': 'India', 'Chandigarh': 'India', 'Varanasi': 'India',
  'Coimbatore': 'India', 'Kochi': 'India', 'Thiruvananthapuram': 'India', 'Goa': 'India',
  'Srinagar': 'India', 'Jammu': 'India', 'Surat': 'India', 'Hubli': 'India',
  'Kathmandu': 'Nepal', 'Thimphu': 'Bhutan',
  'Islamabad': 'Pakistan', 'Lahore': 'Pakistan', 'Karachi': 'Pakistan', 'Multan': 'Pakistan',
  'Peshawar': 'Pakistan', 'Hyderabad PK': 'Pakistan',
  'Dhaka': 'Bangladesh', 'Chittagong': 'Bangladesh',
  'Colombo': 'Sri Lanka', 'Kandy': 'Sri Lanka', 'Malé': 'Maldives',
  // Southeast Asia
  'Singapore': 'Singapore', 'Bangkok': 'Thailand', 'Hanoi': 'Vietnam',
  'Ho Chi Minh City': 'Vietnam', 'Manila': 'Philippines', 'Jakarta': 'Indonesia',
  'Kuala Lumpur': 'Malaysia', 'Phnom Penh': 'Cambodia', 'Vientiane': 'Laos',
  'Yangon': 'Myanmar', 'Mandalay': 'Myanmar', 'Siem Reap': 'Cambodia',
  'Da Nang': 'Vietnam', 'Phuket': 'Thailand', 'Chiang Mai': 'Thailand',
  'Koh Samui': 'Thailand', 'Krabi': 'Thailand', 'Bali': 'Indonesia',
  'Yogyakarta': 'Indonesia', 'Surabaya': 'Indonesia', 'Medan': 'Indonesia',
  'Penang': 'Malaysia', 'Kuching': 'Malaysia', 'Kota Kinabalu': 'Malaysia',
  'Bandar Seri Begawan': 'Brunei', 'Cebu': 'Philippines', 'Davao': 'Philippines',
  'Palembang': 'Indonesia', 'Makassar': 'Indonesia', 'Lombok': 'Indonesia', 'Saigon': 'Vietnam',
  // Central Asia & Afghanistan
  'Kabul': 'Afghanistan', 'Kandahar': 'Afghanistan', 'Mazar-i-Sharif': 'Afghanistan',
  'Herat': 'Afghanistan',
  // Oceania
  'Sydney': 'Australia', 'Melbourne': 'Australia', 'Brisbane': 'Australia', 'Perth': 'Australia',
  'Adelaide': 'Australia', 'Hobart': 'Australia', 'Darwin': 'Australia', 'Cairns': 'Australia',
  'Gold Coast': 'Australia', 'Sunshine Coast': 'Australia', 'Alice Springs': 'Australia',
  'Canberra': 'Australia', 'Auckland': 'New Zealand', 'Wellington': 'New Zealand',
  'Christchurch': 'New Zealand', 'Queenstown': 'New Zealand', 'Invercargill': 'New Zealand',
  'Hamilton NZ': 'New Zealand', 'Rotorua': 'New Zealand',
  // Pacific Islands
  'Suva': 'Fiji', 'Nadi': 'Fiji', 'Apia': 'Samoa', "Nuku'alofa": 'Tonga',
  'Nouméa': 'New Caledonia', 'Port Vila': 'Vanuatu', 'Port Moresby': 'Papua New Guinea',
  'Koror': 'Palau', 'Hagatna': 'Guam', 'Pago Pago': 'American Samoa',
  'Tarawa': 'Kiribati', 'Yaren': 'Nauru', 'Funafuti': 'Tuvalu', 'Majuro': 'Marshall Islands',
  'Kingston NI': 'Norfolk Island', 'Honiara': 'Solomon Islands', 'Saipan': 'N. Mariana Islands',
  'Tongatapu': 'Tonga', 'Papeete': 'Fr. Polynesia', 'Bora Bora': 'Fr. Polynesia',
  'Rikitea': 'Fr. Polynesia',
  // Atlantic & Remote
  'Hamilton BM': 'Bermuda', 'Keflavík': 'Iceland', 'Georgetown AI': 'Ascension Island',
  'Jamestown': 'St Helena', 'Tristan da Cunha': 'UK', 'Grytviken': 'South Georgia',
  'Longyearbyen': 'Svalbard', 'Angra do Heroísmo': 'Portugal',
};

// City → Continent lookup (keyed by city name)
export const CITY_CONTINENT = {
  // UK & Ireland
  'London': 'Europe', 'Manchester': 'Europe', 'Edinburgh': 'Europe', 'Bristol': 'Europe', 'Birmingham': 'Europe',
  'Liverpool': 'Europe', 'Newcastle': 'Europe', 'Leeds': 'Europe', 'Bath': 'Europe', 'Oxford': 'Europe',
  'Cambridge': 'Europe', 'Bournemouth': 'Europe', 'Plymouth': 'Europe', 'Dundee': 'Europe', 'Aberdeen': 'Europe',
  'Oban': 'Europe', 'Glasgow': 'Europe', 'Belfast': 'Europe', 'Brighton': 'Europe', 'Cardiff': 'Europe',
  'Dublin': 'Europe', 'Cork': 'Europe', 'Limerick': 'Europe', 'Galway': 'Europe',
  // France
  'Paris': 'Europe', 'Marseille': 'Europe', 'Lyon': 'Europe', 'Toulouse': 'Europe', 'Nice': 'Europe',
  'Bordeaux': 'Europe', 'Nantes': 'Europe', 'Strasbourg': 'Europe', 'Montpellier': 'Europe',
  'Rennes': 'Europe', 'Angers': 'Europe', 'Brest': 'Europe', 'Poitiers': 'Europe',
  'St-Étienne': 'Europe', 'Rouen': 'Europe', 'Aix-en-Provence': 'Europe', 'Ajaccio': 'Europe',
  'Bastia': 'Europe', 'Reims': 'Europe', 'Lille': 'Europe',
  // Germany
  'Berlin': 'Europe', 'München': 'Europe', 'Frankfurt': 'Europe', 'Hamburg': 'Europe',
  'Köln': 'Europe', 'Düsseldorf': 'Europe', 'Stuttgart': 'Europe', 'Leipzig': 'Europe',
  'Dresden': 'Europe', 'Braunschweig': 'Europe', 'Nürnberg': 'Europe', 'Bremen': 'Europe',
  'Hannover': 'Europe', 'Mainz': 'Europe', 'Kiel': 'Europe', 'Rostock': 'Europe',
  'Karlsruhe': 'Europe', 'Essen': 'Europe', 'Dortmund': 'Europe', 'Freiburg': 'Europe',
  'Aachen': 'Europe', 'Saarbrücken': 'Europe', 'Bregenz': 'Europe',
  // Benelux
  'Bruxelles': 'Europe', 'Amsterdam': 'Europe', 'Rotterdam': 'Europe',
  'Utrecht': 'Europe', 'Eindhoven': 'Europe', 'Groningen': 'Europe',
  'Luxembourg': 'Europe', 'Liège': 'Europe', 'Gent': 'Europe', 'Antwerpen': 'Europe',
  'Den Haag': 'Europe',
  // Switzerland & Austria
  'Zürich': 'Europe', 'Genève': 'Europe', 'Bern': 'Europe', 'Basel': 'Europe',
  'Lausanne': 'Europe', 'Luzern': 'Europe', 'Lugano': 'Europe', 'Chur': 'Europe',
  'Wien': 'Europe', 'Graz': 'Europe', 'Innsbruck': 'Europe', 'Salzburg': 'Europe',
  'Linz': 'Europe', 'Klagenfurt': 'Europe',
  // Iberian Peninsula
  'Madrid': 'Europe', 'Barcelona': 'Europe', 'Valencia': 'Europe', 'Sevilla': 'Europe',
  'Granada': 'Europe', 'Málaga': 'Europe', 'Bilbao': 'Europe', 'Santiago': 'Europe',
  'Las Palmas': 'Europe', 'Alicante': 'Europe', 'Palma': 'Europe', 'Tenerife': 'Europe',
  'A Coruña': 'Europe', 'Córdoba': 'Europe', 'Zaragoza': 'Europe',
  'Lisboa': 'Europe', 'Porto': 'Europe', 'Cascais': 'Europe', 'Faro': 'Europe',
  'Funchal': 'Europe', 'Ponta Delgada': 'Europe',
  // Italy
  'Milano': 'Europe', 'Roma': 'Europe', 'Firenze': 'Europe', 'Napoli': 'Europe', 'Venezia': 'Europe',
  'Bologna': 'Europe', 'Torino': 'Europe', 'Genova': 'Europe', 'Amalfi': 'Europe', 'Palermo': 'Europe',
  'Catania': 'Europe', 'Cagliari': 'Europe', 'Pisa': 'Europe', 'Rimini': 'Europe', 'Trieste': 'Europe',
  'Trento': 'Europe', 'Positano': 'Europe', 'Sorrento': 'Europe', 'Verona': 'Europe', 'Siena': 'Europe',
  // Scandinavia
  'Stockholm': 'Europe', 'Oslo': 'Europe', 'København': 'Europe', 'Helsinki': 'Europe',
  'Göteborg': 'Europe', 'Malmö': 'Europe', 'Trondheim': 'Europe', 'Tromsø': 'Europe',
  'Bergen': 'Europe', 'Tampere': 'Europe', 'Turku': 'Europe', 'Rovaniemi': 'Europe',
  'Reykjavík': 'Europe', 'Akureyri': 'Europe', 'Tórshavn': 'Europe', 'Aarhus': 'Europe',
  // Eastern Europe & Balkans
  'Praha': 'Europe', 'Warszawa': 'Europe', 'Budapest': 'Europe', 'Bucureşti': 'Europe',
  'Sofia': 'Europe', 'Beograd': 'Europe', 'Zagreb': 'Europe', 'Ljubljana': 'Europe',
  'Sarajevo': 'Europe', 'Podgorica': 'Europe', 'Tirana': 'Europe', 'Skopje': 'Europe',
  'Dubrovnik': 'Europe', 'Split': 'Europe', 'Kraków': 'Europe', 'Łódź': 'Europe',
  'Gdańsk': 'Europe', 'Wrocław': 'Europe', 'Cluj-Napoca': 'Europe', 'Iaşi': 'Europe',
  'Riga': 'Europe', 'Vilnius': 'Europe', 'Tallinn': 'Europe',
  // Russia & CIS — Europe
  'Moscow': 'Europe', 'St Petersburg': 'Europe', 'Kyiv': 'Europe', 'Minsk': 'Europe',
  'Yekaterinburg': 'Europe', 'Tbilisi': 'Europe', 'Yerevan': 'Europe', 'Baku': 'Europe',
  'Dnipro': 'Europe', 'Odesa': 'Europe', 'Lviv': 'Europe', 'Ufa': 'Europe', 'Nizhny Novgorod': 'Europe',
  // Russia & CIS — Asia
  'Novosibirsk': 'Asia', 'Almaty': 'Asia', 'Tashkent': 'Asia', 'Astana': 'Asia',
  'Dushanbe': 'Asia', 'Bishkek': 'Asia', 'Ashgabat': 'Asia', 'Vladivostok': 'Asia', 'Yakutsk': 'Asia',
  // Greece & Cyprus
  'Athina': 'Europe', 'Thessaloniki': 'Europe', 'Heraklion': 'Europe', 'Santorini': 'Europe',
  'Mykonos': 'Europe', 'Corfu': 'Europe', 'Nicosia': 'Europe', 'Limassol': 'Europe',
  'Milos': 'Europe', 'Chania': 'Europe',
  // Turkey
  'İstanbul': 'Europe', 'Ankara': 'Europe', 'İzmir': 'Europe', 'Antalya': 'Europe',
  'Adana': 'Europe', 'Balıkesir': 'Europe', 'Bursa': 'Europe', 'Konya': 'Europe',
  'Kayseri': 'Europe', 'Samsun': 'Europe', 'Eskişehir': 'Europe', 'Mersin': 'Europe',
  'Gaziantep': 'Europe', 'Trabzon': 'Europe',
  // USA
  'New York': 'North America', 'Los Angeles': 'North America', 'Chicago': 'North America',
  'Houston': 'North America', 'Phoenix': 'North America', 'Denver': 'North America',
  'San Francisco': 'North America', 'Seattle': 'North America', 'Miami': 'North America',
  'Washington DC': 'North America', 'Boston': 'North America', 'Las Vegas': 'North America',
  'San Diego': 'North America', 'Austin': 'North America', 'Philadelphia': 'North America',
  'Charlotte': 'North America', 'Dallas': 'North America', 'New Orleans': 'North America',
  'Memphis': 'North America', 'Nashville': 'North America', 'Atlanta': 'North America',
  'Tampa': 'North America', 'Orlando': 'North America', 'Detroit': 'North America',
  'Minneapolis': 'North America', 'St Louis': 'North America', 'Kansas City': 'North America',
  'Omaha': 'North America', 'Portland OR': 'North America', 'Honolulu': 'North America',
  'San Jose': 'North America', 'Fresno': 'North America', 'Spokane': 'North America',
  'Missoula': 'North America', 'Boise': 'North America', 'Salt Lake City': 'North America',
  'Albuquerque': 'North America', 'Tucson': 'North America', 'Fort Lauderdale': 'North America',
  'West Palm Beach': 'North America', 'Oklahoma City': 'North America',
  'Jacksonville': 'North America', 'Knoxville': 'North America', 'Louisville': 'North America',
  'Indianapolis': 'North America', 'Milwaukee': 'North America', 'Pittsburgh': 'North America',
  'Richmond': 'North America', 'Virginia Beach': 'North America',
  'Birmingham AL': 'North America', 'Montgomery': 'North America', 'Savannah': 'North America',
  'Columbia SC': 'North America', 'Charleston SC': 'North America',
  'Maui': 'North America', 'Hilo': 'North America', 'Kailua-Kona': 'North America',
  'Kauai': 'North America', 'Lihue': 'North America',
  'Anchorage': 'North America', 'Fairbanks': 'North America', 'Juneau': 'North America',
  // Canada
  'Montréal': 'North America', 'Toronto': 'North America', 'Vancouver': 'North America',
  'Calgary': 'North America', 'Edmonton': 'North America', 'Ottawa': 'North America',
  'Québec City': 'North America', 'Halifax': 'North America', 'Winnipeg': 'North America',
  'Saskatoon': 'North America', 'Regina': 'North America', "St John's": 'North America',
  'Thunder Bay': 'North America', 'Yellowknife': 'North America', 'Whitehorse': 'North America',
  'Iqaluit': 'North America',
  // Mexico
  'México City': 'North America', 'Guadalajara': 'North America', 'Monterrey': 'North America',
  'Cancún': 'North America', 'Mérida': 'North America', 'Veracruz': 'North America',
  'La Paz': 'North America', 'Cabo San Lucas': 'North America', 'Tijuana': 'North America',
  'Tulum': 'North America', 'Acapulco': 'North America', 'Oaxaca': 'North America',
  'San Luis Potosí': 'North America', 'Playa del Carmen': 'North America',
  'Tuxtla Gutiérrez': 'North America',
  // Central America & Caribbean
  'Guatemala City': 'North America', 'San José CR': 'North America',
  'San Salvador': 'North America', 'Tegucigalpa': 'North America',
  'Managua': 'North America', 'Panama City': 'North America',
  'Santo Domingo': 'North America', 'Havana': 'North America', 'Kingston': 'North America',
  'San Juan': 'North America', 'Belize City': 'North America', 'Willemstad': 'North America',
  'Montego Bay': 'North America', 'Bridgetown': 'North America',
  'Fort-de-France': 'North America', 'Port of Spain': 'North America',
  // South America (including Caracas & Medellín)
  'Caracas': 'South America', 'Medellín': 'South America',
  'Bogotá': 'South America', 'Quito': 'South America', 'Lima': 'South America',
  'Santiago': 'South America', 'Buenos Aires': 'South America',
  'Rio de Janeiro': 'South America', 'São Paulo': 'South America', 'Brasília': 'South America',
  'Guayaquil': 'South America', 'Iquitos': 'South America', 'Cusco': 'South America',
  'Corrientes': 'South America', 'Córdoba AR': 'South America', 'Neuquén': 'South America',
  'Bariloche': 'South America', 'Ushuaia': 'South America', 'Río Gallegos': 'South America',
  'São Luís': 'South America', 'Recife': 'South America', 'Salvador': 'South America',
  'Fortaleza': 'South America', 'Belém': 'South America', 'Manaus': 'South America',
  'Curitiba': 'South America', 'Porto Alegre': 'South America', 'Belo Horizonte': 'South America',
  'Campo Grande': 'South America', 'Bauru': 'South America', 'Florianópolis': 'South America',
  'Paramaribo': 'South America', 'Cayenne': 'South America', 'Georgetown': 'South America',
  'Asunción': 'South America', 'Montevideo': 'South America',
  'Santo Domingo EC': 'South America', 'Cali': 'South America', 'Cartagena': 'South America',
  'Bucaramanga': 'South America', 'Cochabamba': 'South America', 'Sucre': 'South America',
  'Valparaíso': 'South America', 'Valdivia': 'South America', 'Punta Arenas': 'South America',
  // Middle East
  'Tehran': 'Asia', 'Baghdad': 'Asia', 'Riyadh': 'Asia', 'Dubai': 'Asia',
  'Mecca': 'Asia', 'Amman': 'Asia', 'Beirut': 'Asia', 'Tel Aviv': 'Asia',
  'Jerusalem': 'Asia', 'Doha': 'Asia', 'Abu Dhabi': 'Asia', 'Muscat': 'Asia',
  'Manama': 'Asia', 'Kuwait City': 'Asia', "Sana'a": 'Asia', 'Aden': 'Asia',
  'Erbil': 'Asia', 'Mosul': 'Asia', 'Basra': 'Asia', 'Homs': 'Asia',
  'Damascus': 'Asia', 'Aleppo': 'Asia', 'Haifa': 'Asia', 'Tripoli LB': 'Asia',
  'Karbala': 'Asia', 'Medina': 'Asia', 'Jeddah': 'Asia',
  'Tabriz': 'Asia', 'Isfahan': 'Asia', 'Shiraz': 'Asia', 'Mashhad': 'Asia',
  // Africa
  'Cairo': 'Africa', 'Algiers': 'Africa', 'Rabat': 'Africa', 'Lagos': 'Africa',
  'Nairobi': 'Africa', 'Cape Town': 'Africa', 'Johannesburg': 'Africa',
  'Addis Ababa': 'Africa', 'Accra': 'Africa', 'Casablanca': 'Africa', 'Tunis': 'Africa',
  'Marrakech': 'Africa', 'Fès': 'Africa', 'Nador': 'Africa', 'Tripoli': 'Africa',
  'Dakar': 'Africa', 'Bamako': 'Africa', 'Niamey': 'Africa', 'Ouagadougou': 'Africa',
  'Kumasi': 'Africa', 'Abuja': 'Africa', 'Ibadan': 'Africa', 'Douala': 'Africa',
  'Yaoundé': 'Africa', 'Cotonou': 'Africa', 'Lomé': 'Africa', 'Abidjan': 'Africa',
  'Freetown': 'Africa', 'Monrovia': 'Africa', 'Libreville': 'Africa',
  'Brazzaville': 'Africa', 'Kinshasa': 'Africa', 'Lubumbashi': 'Africa',
  'Luanda': 'Africa', 'Lusaka': 'Africa', 'Harare': 'Africa', 'Maputo': 'Africa',
  'Lilongwe': 'Africa', 'Dodoma': 'Africa', 'Dar es Salaam': 'Africa',
  'Kigali': 'Africa', 'Bujumbura': 'Africa', 'Kampala': 'Africa', 'Khartoum': 'Africa',
  'Mogadishu': 'Africa', 'Djibouti': 'Africa', 'Asmara': 'Africa',
  'Port Louis': 'Africa', 'Victoria SC': 'Africa', 'Saint-Denis': 'Africa',
  'Antananarivo': 'Africa', 'Moroni': 'Africa', 'Pretoria': 'Africa',
  'Durban': 'Africa', 'Port Elizabeth': 'Africa', 'Luxor': 'Africa',
  'Asyut': 'Africa', 'Alexandria': 'Africa',
  // East Asia
  'Beijing': 'Asia', 'Shanghai': 'Asia', 'Hong Kong': 'Asia', 'Guangzhou': 'Asia',
  'Chengdu': 'Asia', 'Shenzhen': 'Asia', 'Tianjin': 'Asia', 'Chongqing': 'Asia',
  "Xi'an": 'Asia', 'Hangzhou': 'Asia', 'Nanjing': 'Asia', 'Qingdao': 'Asia',
  'Dongguan': 'Asia', 'Kowloon': 'Asia', 'Macau': 'Asia', 'Harbin': 'Asia',
  'Changchun': 'Asia', 'Shenyang': 'Asia', 'Dalian': 'Asia', 'Xiamen': 'Asia',
  'Fuzhou': 'Asia', 'Nanchang': 'Asia', 'Wenzhou': 'Asia', 'Jinan': 'Asia',
  'Zhengzhou': 'Asia', 'Wuhan': 'Asia', 'Changsha': 'Asia', 'Kunming': 'Asia',
  'Sanya': 'Asia', 'Nanning': 'Asia', 'Ningbo': 'Asia', 'Daqing': 'Asia',
  'Ürümqi': 'Asia', 'Xining': 'Asia', 'Lhasa': 'Asia',
  // Japan
  'Tokyo': 'Asia', 'Osaka': 'Asia', 'Kyoto': 'Asia', 'Nagoya': 'Asia', 'Fukuoka': 'Asia',
  'Sapporo': 'Asia', 'Sendai': 'Asia', 'Hiroshima': 'Asia', 'Yokohama': 'Asia',
  'Kobe': 'Asia', 'Naha': 'Asia', 'Kanazawa': 'Asia', 'Nagasaki': 'Asia',
  'Obihiro': 'Asia', 'Kagoshima': 'Asia', 'Matsuyama': 'Asia',
  // Korea
  'Seoul': 'Asia', 'Busan': 'Asia', 'Daegu': 'Asia',
  'Gwangju': 'Asia', 'Daejeon': 'Asia', 'Incheon': 'Asia',
  'Jeju': 'Asia', 'Chuncheon': 'Asia',
  // Taiwan
  'Taipei': 'Asia', 'Kaohsiung': 'Asia', 'Taichung': 'Asia', 'Tainan': 'Asia',
  'Hsinchu': 'Asia',
  // Mongolia
  'Ulaanbaatar': 'Asia',
  // South Asia
  'Delhi': 'Asia', 'Mumbai': 'Asia', 'Bengaluru': 'Asia', 'Kolkata': 'Asia',
  'Hyderabad': 'Asia', 'Chennai': 'Asia', 'Lucknow': 'Asia', 'Ahmedabad': 'Asia',
  'Pune': 'Asia', 'Jaipur': 'Asia', 'Chandigarh': 'Asia', 'Varanasi': 'Asia',
  'Coimbatore': 'Asia', 'Kochi': 'Asia', 'Thiruvananthapuram': 'Asia', 'Goa': 'Asia',
  'Srinagar': 'Asia', 'Jammu': 'Asia', 'Surat': 'Asia', 'Hubli': 'Asia',
  'Kathmandu': 'Asia', 'Thimphu': 'Asia',
  'Islamabad': 'Asia', 'Lahore': 'Asia', 'Karachi': 'Asia', 'Multan': 'Asia',
  'Peshawar': 'Asia', 'Hyderabad PK': 'Asia',
  'Dhaka': 'Asia', 'Chittagong': 'Asia',
  'Colombo': 'Asia', 'Kandy': 'Asia', 'Malé': 'Asia',
  // Southeast Asia
  'Singapore': 'Asia', 'Bangkok': 'Asia', 'Hanoi': 'Asia',
  'Ho Chi Minh City': 'Asia', 'Manila': 'Asia', 'Jakarta': 'Asia',
  'Kuala Lumpur': 'Asia', 'Phnom Penh': 'Asia', 'Vientiane': 'Asia',
  'Yangon': 'Asia', 'Mandalay': 'Asia', 'Siem Reap': 'Asia',
  'Da Nang': 'Asia', 'Phuket': 'Asia', 'Chiang Mai': 'Asia',
  'Koh Samui': 'Asia', 'Krabi': 'Asia', 'Bali': 'Asia',
  'Yogyakarta': 'Asia', 'Surabaya': 'Asia', 'Medan': 'Asia',
  'Penang': 'Asia', 'Kuching': 'Asia', 'Kota Kinabalu': 'Asia',
  'Bandar Seri Begawan': 'Asia', 'Cebu': 'Asia', 'Davao': 'Asia',
  'Palembang': 'Asia', 'Makassar': 'Asia', 'Lombok': 'Asia', 'Saigon': 'Asia',
  // Central Asia & Afghanistan
  'Kabul': 'Asia', 'Kandahar': 'Asia', 'Mazar-i-Sharif': 'Asia', 'Herat': 'Asia',
  // Oceania
  'Sydney': 'Oceania', 'Melbourne': 'Oceania', 'Brisbane': 'Oceania', 'Perth': 'Oceania',
  'Adelaide': 'Oceania', 'Hobart': 'Oceania', 'Darwin': 'Oceania', 'Cairns': 'Oceania',
  'Gold Coast': 'Oceania', 'Sunshine Coast': 'Oceania', 'Alice Springs': 'Oceania',
  'Canberra': 'Oceania', 'Auckland': 'Oceania', 'Wellington': 'Oceania',
  'Christchurch': 'Oceania', 'Queenstown': 'Oceania', 'Invercargill': 'Oceania',
  'Hamilton NZ': 'Oceania', 'Rotorua': 'Oceania',
  // Pacific Islands
  'Suva': 'Oceania', 'Nadi': 'Oceania', 'Apia': 'Oceania', "Nuku'alofa": 'Oceania',
  'Nouméa': 'Oceania', 'Port Vila': 'Oceania', 'Port Moresby': 'Oceania',
  'Koror': 'Oceania', 'Hagatna': 'Oceania', 'Pago Pago': 'Oceania',
  'Tarawa': 'Oceania', 'Yaren': 'Oceania', 'Funafuti': 'Oceania', 'Majuro': 'Oceania',
  'Kingston NI': 'Oceania', 'Honiara': 'Oceania', 'Saipan': 'Oceania',
  'Tongatapu': 'Oceania', 'Papeete': 'Oceania', 'Bora Bora': 'Oceania',
  'Rikitea': 'Oceania',
  // Atlantic & Remote
  'Hamilton BM': 'North America', 'Keflavík': 'Europe', 'Georgetown AI': 'Africa',
  'Jamestown': 'Africa', 'Tristan da Cunha': 'Africa', 'Grytviken': 'South America',
  'Longyearbyen': 'Europe', 'Angra do Heroísmo': 'Europe',
};

// For line detection we use all tiers
export const ALL_CITIES = CITIES.map(c => [c[0], c[1], c[2]]);

// Tiered cities for zoom-based display
export const CITIES_T1 = CITIES.filter(c => c[3] === 1).map(c => [c[0], c[1], c[2]]);
export const CITIES_T2 = CITIES.filter(c => c[3] <= 2).map(c => [c[0], c[1], c[2]]);
export const CITIES_T3 = CITIES.map(c => [c[0], c[1], c[2]]);

export default CITIES;

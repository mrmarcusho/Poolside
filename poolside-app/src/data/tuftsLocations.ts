export interface TuftsLocation {
  id: string;
  name: string;
  shortName?: string;
  emoji: string;
  category: LocationCategory;
}

export type LocationCategory =
  | 'dining'
  | 'academic'
  | 'student-life'
  | 'outdoor'
  | 'arts'
  | 'residence'
  | 'athletics'
  | 'cultural-centers'
  | 'special-interest';

export interface LocationCategoryInfo {
  id: LocationCategory;
  name: string;
  emoji: string;
}

export const LOCATION_CATEGORIES: LocationCategoryInfo[] = [
  { id: 'dining', name: 'Dining', emoji: '🍽️' },
  { id: 'academic', name: 'Academic', emoji: '📚' },
  { id: 'student-life', name: 'Student Life', emoji: '🎉' },
  { id: 'athletics', name: 'Athletics', emoji: '🏃' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'arts', name: 'Arts & Performance', emoji: '🎭' },
  { id: 'residence', name: 'Residence Halls', emoji: '🏘️' },
  { id: 'cultural-centers', name: 'Cultural Centers', emoji: '🌍' },
  { id: 'special-interest', name: 'Special Interest Houses', emoji: '🏠' },
];

export const TUFTS_LOCATIONS: TuftsLocation[] = [
  // ============================================
  // DINING (10 locations)
  // ============================================
  { id: 'dewick', name: 'Dewick-MacPhie Dining', shortName: 'Dewick', emoji: '🍴', category: 'dining' },
  { id: 'carmichael-dining', name: 'Fresh at Carmichael', shortName: 'Carm Dining', emoji: '🥗', category: 'dining' },
  { id: 'hodgdon', name: 'Hodgdon Food-on-the-Run', shortName: 'Hodgdon', emoji: '🥪', category: 'dining' },
  { id: 'hotung', name: 'Hotung Café', shortName: 'Hotung', emoji: '☕', category: 'dining' },
  { id: 'sink', name: 'The Sink', emoji: '🧋', category: 'dining' },
  { id: 'kindlevan', name: 'Kindlevan Café', shortName: 'Kindlevan', emoji: '☕', category: 'dining' },
  { id: 'tower-cafe', name: 'Tower Café', shortName: 'Tower', emoji: '🍵', category: 'dining' },
  { id: 'mugar-cafe', name: 'Mugar Café', shortName: 'Mugar', emoji: '☕', category: 'dining' },
  { id: 'commons', name: 'Commons Marketplace', shortName: 'Commons', emoji: '🍔', category: 'dining' },
  { id: 'pax-et-lox', name: 'Pax et Lox Kosher Deli', shortName: 'Pax et Lox', emoji: '🥯', category: 'dining' },

  // ============================================
  // ACADEMIC BUILDINGS (25 locations)
  // ============================================
  { id: 'tisch-library', name: 'Tisch Library', shortName: 'Tisch', emoji: '📖', category: 'academic' },
  { id: 'sec', name: 'Science & Engineering Complex', shortName: 'SEC', emoji: '🔬', category: 'academic' },
  { id: 'cummings', name: 'Joyce Cummings Center', shortName: 'Cummings', emoji: '💻', category: 'academic' },
  { id: 'clic', name: 'CLIC', emoji: '💡', category: 'academic' },
  { id: 'ballou', name: 'Ballou Hall', emoji: '🏛️', category: 'academic' },
  { id: 'barnum', name: 'Barnum Hall', emoji: '🧬', category: 'academic' },
  { id: 'eaton', name: 'Eaton Hall', emoji: '🏢', category: 'academic' },
  { id: 'anderson', name: 'Anderson Hall', emoji: '🎓', category: 'academic' },
  { id: 'bromfield', name: 'Bromfield-Pearson', emoji: '📐', category: 'academic' },
  { id: 'robinson', name: 'Robinson Hall', emoji: '⚙️', category: 'academic' },
  { id: 'curtis', name: 'Curtis Hall', emoji: '🏫', category: 'academic' },
  { id: 'goddard-hall', name: 'Goddard Hall', emoji: '🔭', category: 'academic' },
  { id: 'goddard-chapel', name: 'Goddard Chapel', emoji: '⛪', category: 'academic' },
  { id: 'paige', name: 'Paige Hall', emoji: '📚', category: 'academic' },
  { id: 'miner', name: 'Miner Hall', emoji: '🤔', category: 'academic' },
  { id: 'packard', name: 'Packard Hall', emoji: '🎒', category: 'academic' },
  { id: 'east-hall', name: 'East Hall', emoji: '🏢', category: 'academic' },
  { id: 'halligan', name: 'Halligan Hall', shortName: 'Halligan', emoji: '🖥️', category: 'academic' },
  { id: 'pearson-chem', name: 'Pearson Chemical Lab', shortName: 'Pearson', emoji: '⚗️', category: 'academic' },
  { id: 'olin', name: 'Olin Center', emoji: '🔧', category: 'academic' },
  { id: 'braker', name: 'Braker Hall', emoji: '🏢', category: 'academic' },
  { id: 'dowling', name: 'Dowling Hall', emoji: '🏬', category: 'academic' },
  { id: 'bendetson', name: 'Bendetson Hall', shortName: 'Admissions', emoji: '🎓', category: 'academic' },
  { id: 'cabot', name: 'Cabot Intercultural Center', shortName: 'Cabot', emoji: '🌐', category: 'academic' },
  { id: 'fletcher', name: 'Fletcher School', emoji: '🌎', category: 'academic' },

  // ============================================
  // STUDENT LIFE (8 locations)
  // ============================================
  { id: 'campus-center', name: 'Mayer Campus Center', shortName: 'Campus Center', emoji: '🏠', category: 'student-life' },
  { id: 'health-services', name: 'Health Services', emoji: '🏥', category: 'student-life' },
  { id: 'interfaith', name: 'Interfaith Center', emoji: '🙏', category: 'student-life' },
  { id: 'hillel', name: 'Granoff Family Hillel Center', shortName: 'Hillel', emoji: '✡️', category: 'student-life' },
  { id: 'bookstore', name: 'Tufts Bookstore', shortName: 'Bookstore', emoji: '📕', category: 'student-life' },
  { id: 'tufts-international', name: 'Tufts International Center', shortName: 'Intl Center', emoji: '🌍', category: 'student-life' },
  { id: 'career-center', name: 'Career Center', emoji: '💼', category: 'student-life' },
  { id: 'student-services', name: 'Dowling Hall Student Services', shortName: 'Dowling', emoji: '📝', category: 'student-life' },

  // ============================================
  // ATHLETICS (18 locations)
  // ============================================
  { id: 'tisch-fitness', name: 'Steve Tisch Sports & Fitness Center', shortName: 'Tisch Fitness', emoji: '💪', category: 'athletics' },
  { id: 'cousens', name: 'Cousens Gym', emoji: '🏀', category: 'athletics' },
  { id: 'gantcher', name: 'Gantcher Center', shortName: 'Gantcher', emoji: '🏊', category: 'athletics' },
  { id: 'hamilton-pool', name: 'Hamilton Pool', emoji: '🏊‍♂️', category: 'athletics' },
  { id: 'ellis-oval', name: 'Ellis Oval / Zimman Field', shortName: 'Ellis Oval', emoji: '🏈', category: 'athletics' },
  { id: 'kraft-field', name: 'Kraft Field', emoji: '⚽', category: 'athletics' },
  { id: 'bello-field', name: 'Bello Field', emoji: '🥍', category: 'athletics' },
  { id: 'spicer-field', name: 'Spicer Field', emoji: '⚾', category: 'athletics' },
  { id: 'ounjian-field', name: 'Ounjian Field', emoji: '🥎', category: 'athletics' },
  { id: 'dussault-track', name: 'Dussault Track', emoji: '🏃', category: 'athletics' },
  { id: 'tennis-center', name: 'Vouté Tennis Courts', shortName: 'Tennis Courts', emoji: '🎾', category: 'athletics' },
  { id: 'squash-center', name: 'Tufts Squash Center', shortName: 'Squash', emoji: '🎾', category: 'athletics' },
  { id: 'shoemaker', name: 'Shoemaker Boathouse', shortName: 'Boathouse', emoji: '🚣', category: 'athletics' },
  { id: 'bacow-sailing', name: 'Bacow Sailing Pavilion', shortName: 'Sailing', emoji: '⛵', category: 'athletics' },
  { id: 'gittleman-park', name: 'Sol Gittleman Park', emoji: '🏟️', category: 'athletics' },
  { id: 'indoor-track', name: 'Indoor Track', emoji: '🏃‍♀️', category: 'athletics' },
  { id: 'carzo-cage', name: 'Carzo Cage', emoji: '🏋️', category: 'athletics' },
  { id: 'varsity-weight', name: 'Varsity Weight Room', emoji: '🏋️‍♂️', category: 'athletics' },

  // ============================================
  // OUTDOOR SPACES (10 locations)
  // ============================================
  { id: 'res-quad', name: 'Residential Quad', shortName: 'Res Quad', emoji: '🌿', category: 'outdoor' },
  { id: 'academic-quad', name: 'Academic Quad', emoji: '🏫', category: 'outdoor' },
  { id: 'prez-lawn', name: "President's Lawn", shortName: 'Prez Lawn', emoji: '🌺', category: 'outdoor' },
  { id: 'memorial-steps', name: 'Memorial Steps', emoji: '🪜', category: 'outdoor' },
  { id: 'fletcher-quad', name: 'Fletcher Quad', emoji: '🌲', category: 'outdoor' },
  { id: 'library-lawn', name: 'Library Lawn', emoji: '🌳', category: 'outdoor' },
  { id: 'professors-row', name: 'Professors Row', emoji: '🚶', category: 'outdoor' },
  { id: 'latin-way-green', name: 'Latin Way Green', emoji: '🌱', category: 'outdoor' },
  { id: 'boston-ave', name: 'Boston Avenue', emoji: '🛤️', category: 'outdoor' },
  { id: 'college-ave', name: 'College Avenue', emoji: '🚶‍♂️', category: 'outdoor' },

  // ============================================
  // ARTS & PERFORMANCE (6 locations)
  // ============================================
  { id: 'granoff', name: 'Granoff Music Center', shortName: 'Granoff', emoji: '🎵', category: 'arts' },
  { id: 'aidekman', name: 'Aidekman Arts Center', shortName: 'Aidekman', emoji: '🎨', category: 'arts' },
  { id: 'cohen', name: 'Cohen Auditorium', shortName: 'Cohen', emoji: '🎤', category: 'arts' },
  { id: 'balch', name: 'Balch Arena Theater', shortName: 'Balch Arena', emoji: '🎬', category: 'arts' },
  { id: 'alumnae', name: 'Alumnae Hall', emoji: '🎭', category: 'arts' },
  { id: 'breed', name: 'Breed Memorial Hall', shortName: 'Breed Hall', emoji: '🎹', category: 'arts' },

  // ============================================
  // RESIDENCE HALLS (28 locations)
  // ============================================
  // First-Year Halls
  { id: 'houston', name: 'Houston Hall', shortName: 'Houston', emoji: '🏠', category: 'residence' },
  { id: 'hill', name: 'Hill Hall', emoji: '🏠', category: 'residence' },
  { id: 'haskell', name: 'Haskell Hall', shortName: 'Haskell', emoji: '🏚️', category: 'residence' },
  { id: 'tilton', name: 'Tilton Hall', shortName: 'Tilton', emoji: '🏘️', category: 'residence' },
  { id: 'carmichael-hall', name: 'Carmichael Hall', shortName: 'Carmichael', emoji: '🏢', category: 'residence' },
  { id: 'miller', name: 'Miller Hall', shortName: 'Miller', emoji: '🏡', category: 'residence' },
  { id: 'bush', name: 'Bush Hall', shortName: 'Bush', emoji: '🏗️', category: 'residence' },
  { id: 'metcalf', name: 'Metcalf Hall', shortName: 'Metcalf', emoji: '🏠', category: 'residence' },
  { id: 'hodgdon-hall', name: 'Hodgdon Hall', emoji: '🏢', category: 'residence' },
  { id: 'richardson', name: 'Richardson House', shortName: 'Richardson', emoji: '🏡', category: 'residence' },
  { id: 'wilson', name: 'Wilson House', shortName: 'Wilson', emoji: '🏠', category: 'residence' },
  { id: 'wren', name: 'Wren Hall', emoji: '🏘️', category: 'residence' },
  { id: 'court', name: 'Court at Professors Row', shortName: 'The Court', emoji: '🏛️', category: 'residence' },
  // Upperclassman Halls
  { id: 'lewis', name: 'Lewis Hall', shortName: 'Lewis', emoji: '🏢', category: 'residence' },
  { id: 'harleston', name: 'Harleston Hall', shortName: 'Harleston', emoji: '🏠', category: 'residence' },
  { id: 'stratton', name: 'Stratton Hall', shortName: 'Stratton', emoji: '🏢', category: 'residence' },
  { id: 'west-hall', name: 'West Hall', emoji: '🏡', category: 'residence' },
  { id: 'latin-way', name: 'Latin Way Apartments', shortName: 'Latin Way', emoji: '🏘️', category: 'residence' },
  { id: 'hillsides', name: 'Hillsides Apartments', shortName: 'Hillsides', emoji: '🏢', category: 'residence' },
  { id: 'sophia-gordon', name: 'Sophia Gordon Hall', shortName: 'Sophia Gordon', emoji: '🏛️', category: 'residence' },
  { id: 'south-hall', name: 'South Hall', emoji: '🏠', category: 'residence' },
  { id: 'coho', name: 'CoHo Houses', shortName: 'CoHo', emoji: '🏡', category: 'residence' },
  { id: 'tousey', name: 'Tousey House', emoji: '🏠', category: 'residence' },
  { id: 'mccollester', name: 'McCollester House', shortName: 'McCollester', emoji: '🏡', category: 'residence' },
  { id: 'milne', name: 'Milne House', emoji: '🏠', category: 'residence' },
  { id: 'chandler', name: 'Chandler House', emoji: '🏡', category: 'residence' },
  { id: 'hallowell', name: 'Hallowell Hall', shortName: 'Hallowell', emoji: '🏘️', category: 'residence' },
  { id: 'start-house', name: 'Start House', emoji: '🏠', category: 'residence' },

  // ============================================
  // CULTURAL CENTERS (6 locations)
  // ============================================
  { id: 'africana', name: 'Africana Center', emoji: '🌍', category: 'cultural-centers' },
  { id: 'latino', name: 'Latinx Center', emoji: '🌎', category: 'cultural-centers' },
  { id: 'lgbt', name: 'LGBT Center', emoji: '🏳️‍🌈', category: 'cultural-centers' },
  { id: 'asian-american', name: 'Asian American Center', emoji: '🌏', category: 'cultural-centers' },
  { id: 'womens-center', name: "Women's Center", emoji: '♀️', category: 'cultural-centers' },
  { id: 'first-center', name: 'FIRST Center', emoji: '🌟', category: 'cultural-centers' },

  // ============================================
  // SPECIAL INTEREST HOUSES (18 locations)
  // ============================================
  { id: 'crafts-house', name: 'Crafts House', emoji: '🎨', category: 'special-interest' },
  { id: 'art-haus', name: 'Art Haus', emoji: '🖼️', category: 'special-interest' },
  { id: 'intl-house', name: 'International House', shortName: 'I-House', emoji: '🌐', category: 'special-interest' },
  { id: 'first-house', name: 'FIRST House', emoji: '🌟', category: 'special-interest' },
  { id: 'la-casa', name: 'La Casa Latinx', shortName: 'La Casa', emoji: '🌺', category: 'special-interest' },
  { id: 'qmunity', name: "Q'Munity House", shortName: 'QMunity', emoji: '🏳️‍🌈', category: 'special-interest' },
  { id: 'asian-am-house', name: 'Asian American House', emoji: '🏮', category: 'special-interest' },
  { id: 'substance-free', name: 'Substance Free House', emoji: '💚', category: 'special-interest' },
  { id: 'green-house', name: 'Green House', emoji: '♻️', category: 'special-interest' },
  { id: 'muslim-house', name: 'Muslim House', emoji: '☪️', category: 'special-interest' },
  { id: 'hive', name: 'The HIVE', emoji: '🐝', category: 'special-interest' },
  { id: 'ethno-house', name: 'Ethnomusicology House', shortName: 'Ethno House', emoji: '🎸', category: 'special-interest' },
  { id: 'spanish-house', name: 'Spanish Language House', shortName: 'Spanish House', emoji: '🇪🇸', category: 'special-interest' },
  { id: 'french-house', name: 'Francophone House', shortName: 'French House', emoji: '🇫🇷', category: 'special-interest' },
  { id: 'german-house', name: 'German Language House', shortName: 'German House', emoji: '🇩🇪', category: 'special-interest' },
  { id: 'chinese-house', name: 'Chinese Language House', shortName: 'Chinese House', emoji: '🇨🇳', category: 'special-interest' },
  { id: 'japanese-house', name: 'Japanese Language House', shortName: 'Japanese House', emoji: '🇯🇵', category: 'special-interest' },
  { id: 'russian-house', name: 'Russian/Slavic Culture House', shortName: 'Russian House', emoji: '🇷🇺', category: 'special-interest' },
];

// Helper function to get locations by category
export const getLocationsByCategory = (category: LocationCategory): TuftsLocation[] => {
  return TUFTS_LOCATIONS.filter(loc => loc.category === category);
};

// Helper function to search locations
export const searchLocations = (query: string): TuftsLocation[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return TUFTS_LOCATIONS;

  return TUFTS_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(lowerQuery) ||
    (loc.shortName && loc.shortName.toLowerCase().includes(lowerQuery)) ||
    loc.id.toLowerCase().includes(lowerQuery)
  );
};

// Get category info by id
export const getCategoryInfo = (categoryId: LocationCategory): LocationCategoryInfo | undefined => {
  return LOCATION_CATEGORIES.find(cat => cat.id === categoryId);
};

// Get popular/commonly used locations for quick access
export const getPopularLocations = (): TuftsLocation[] => {
  const popularIds = [
    'tisch-library', 'dewick', 'carmichael-dining', 'campus-center',
    'tisch-fitness', 'res-quad', 'academic-quad', 'prez-lawn',
    'cummings', 'sec', 'hotung', 'sink'
  ];
  return TUFTS_LOCATIONS.filter(loc => popularIds.includes(loc.id));
};

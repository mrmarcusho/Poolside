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
  | 'residence';

export interface LocationCategoryInfo {
  id: LocationCategory;
  name: string;
  emoji: string;
}

export const LOCATION_CATEGORIES: LocationCategoryInfo[] = [
  { id: 'dining', name: 'Dining', emoji: '🍽️' },
  { id: 'academic', name: 'Academic', emoji: '📚' },
  { id: 'student-life', name: 'Student Life', emoji: '🎉' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'arts', name: 'Arts & Performance', emoji: '🎭' },
  { id: 'residence', name: 'Residence Halls', emoji: '🏘️' },
];

export const TUFTS_LOCATIONS: TuftsLocation[] = [
  // Dining
  { id: 'dewick', name: 'Dewick-MacPhie', emoji: '🍴', category: 'dining' },
  { id: 'carmichael-dining', name: 'Carmichael Dining', shortName: 'Carmichael', emoji: '🥗', category: 'dining' },
  { id: 'hodgdon', name: 'Hodgdon Food-on-the-Run', shortName: 'Hodgdon', emoji: '🥪', category: 'dining' },
  { id: 'hotung', name: 'Hotung Cafe', shortName: 'Hotung', emoji: '☕', category: 'dining' },
  { id: 'sink', name: 'The Sink', emoji: '🧋', category: 'dining' },

  // Academic
  { id: 'tisch-library', name: 'Tisch Library', emoji: '📖', category: 'academic' },
  { id: 'sec', name: 'SEC', emoji: '🔬', category: 'academic' },
  { id: 'ballou', name: 'Ballou Hall', emoji: '🏛️', category: 'academic' },
  { id: 'barnum', name: 'Barnum Hall', emoji: '🧬', category: 'academic' },
  { id: 'eaton', name: 'Eaton Hall', emoji: '🏢', category: 'academic' },
  { id: 'clic', name: 'CLIC', emoji: '💡', category: 'academic' },
  { id: 'bromfield', name: 'Bromfield-Pearson', emoji: '📐', category: 'academic' },
  { id: 'anderson', name: 'Anderson Hall', emoji: '🎓', category: 'academic' },

  // Student Life
  { id: 'campus-center', name: 'Campus Center', emoji: '🏠', category: 'student-life' },
  { id: 'tisch-fitness', name: 'Tisch Fitness', emoji: '💪', category: 'student-life' },
  { id: 'cousens', name: 'Cousens Gym', emoji: '🏀', category: 'student-life' },
  { id: 'gantcher', name: 'Gantcher Center', shortName: 'Gantcher', emoji: '🏊', category: 'student-life' },

  // Outdoor
  { id: 'res-quad', name: 'Residential Quad', shortName: 'Res Quad', emoji: '🌿', category: 'outdoor' },
  { id: 'academic-quad', name: 'Academic Quad', emoji: '🏫', category: 'outdoor' },
  { id: 'prez-lawn', name: "President's Lawn", shortName: 'Prez Lawn', emoji: '🌺', category: 'outdoor' },
  { id: 'memorial-steps', name: 'Memorial Steps', emoji: '🪜', category: 'outdoor' },
  { id: 'fletcher-quad', name: 'Fletcher Quad', emoji: '🌲', category: 'outdoor' },

  // Arts & Performance
  { id: 'granoff', name: 'Granoff Music Center', shortName: 'Granoff', emoji: '🎵', category: 'arts' },
  { id: 'aidekman', name: 'Aidekman Arts Center', shortName: 'Aidekman', emoji: '🎨', category: 'arts' },
  { id: 'cohen', name: 'Cohen Auditorium', shortName: 'Cohen', emoji: '🎤', category: 'arts' },
  { id: 'balch', name: 'Balch Arena Theater', shortName: 'Balch Arena', emoji: '🎬', category: 'arts' },

  // Residence Halls
  { id: 'carmichael-hall', name: 'Carmichael Hall', shortName: 'Carmichael', emoji: '🏢', category: 'residence' },
  { id: 'houston', name: 'Houston Hall', shortName: 'Houston', emoji: '🏠', category: 'residence' },
  { id: 'miller', name: 'Miller Hall', shortName: 'Miller', emoji: '🏡', category: 'residence' },
  { id: 'tilton', name: 'Tilton Hall', shortName: 'Tilton', emoji: '🏘️', category: 'residence' },
  { id: 'bush', name: 'Bush Hall', shortName: 'Bush', emoji: '🏗️', category: 'residence' },
  { id: 'haskell', name: 'Haskell Hall', shortName: 'Haskell', emoji: '🏚️', category: 'residence' },
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
    (loc.shortName && loc.shortName.toLowerCase().includes(lowerQuery))
  );
};

// Get category info by id
export const getCategoryInfo = (categoryId: LocationCategory): LocationCategoryInfo | undefined => {
  return LOCATION_CATEGORIES.find(cat => cat.id === categoryId);
};

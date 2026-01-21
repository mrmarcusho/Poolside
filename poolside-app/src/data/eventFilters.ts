// Event filter constants for the Poolside app

export interface EventTagData {
  id: string;
  label: string;
  emoji: string;
}

export const EVENT_TAGS: EventTagData[] = [
  { id: 'Sports', label: 'Sports', emoji: '🏀' },
  { id: 'Music', label: 'Music', emoji: '🎵' },
  { id: 'Social', label: 'Social', emoji: '🎉' },
  { id: 'Academic', label: 'Academic', emoji: '📚' },
  { id: 'Food', label: 'Food', emoji: '🍕' },
  { id: 'Arts', label: 'Arts', emoji: '🎨' },
  { id: 'Outdoors', label: 'Outdoors', emoji: '🌳' },
  { id: 'Games', label: 'Games', emoji: '🎮' },
  { id: 'Wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'Career', label: 'Career', emoji: '💼' },
];

export type ClassYearId = 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR';

export interface ClassYearData {
  id: ClassYearId;
  label: string;
}

export const CLASS_YEARS: ClassYearData[] = [
  { id: 'FRESHMAN', label: 'Freshmen' },
  { id: 'SOPHOMORE', label: 'Sophomores' },
  { id: 'JUNIOR', label: 'Juniors' },
  { id: 'SENIOR', label: 'Seniors' },
];

export type DateFilterId = 'today' | 'tomorrow' | 'this-week';

export interface DateFilterData {
  id: DateFilterId;
  label: string;
  emoji: string;
}

export const DATE_FILTERS: DateFilterData[] = [
  { id: 'today', label: 'Today', emoji: '📅' },
  { id: 'tomorrow', label: 'Tomorrow', emoji: '🌅' },
  { id: 'this-week', label: 'This Week', emoji: '🗓️' },
];

// Filter state interface
export interface EventFilterState {
  tags: string[];
  classYears: ClassYearId[];
  dateFilter: DateFilterId | null;
  happeningNow: boolean;
}

// Default filter state
export const DEFAULT_FILTER_STATE: EventFilterState = {
  tags: [],
  classYears: [],
  dateFilter: null,
  happeningNow: false,
};

// Helper to count active filters
export const countActiveFilters = (filters: EventFilterState): number => {
  let count = 0;
  if (filters.tags.length > 0) count += filters.tags.length;
  if (filters.classYears.length > 0) count += filters.classYears.length;
  if (filters.dateFilter) count += 1;
  // Note: happeningNow is separate from the modal count
  return count;
};

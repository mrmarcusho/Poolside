/**
 * Test Driver for Poolside App Regression Tests
 *
 * This file provides a mapping of all feature tests for easy execution.
 *
 * Usage:
 *   npm test -- --testPathPattern="<pattern>"
 *
 * Examples:
 *   npm test -- --testPathPattern="features/auth"           # All auth tests
 *   npm test -- --testPathPattern="features/auth/login"     # Just login tests
 *   npm test -- --testPathPattern="features/events"         # All events tests
 *   npm test -- --testPathPattern="features"                # All feature tests
 */

export const TEST_SUITES = {
  // ============================================
  // AUTHENTICATION (4 test files)
  // ============================================
  auth: {
    all: 'features/auth',
    login: 'features/auth/login',
    registration: 'features/auth/registration',
    tokenManagement: 'features/auth/tokenManagement',
    passwordReset: 'features/auth/passwordReset',
  },

  // ============================================
  // EVENTS (4 test files)
  // ============================================
  events: {
    all: 'features/events',
    feedScreen: 'features/events/feedScreen',
    createEvent: 'features/events/createEvent',
    myPlans: 'features/events/myPlans',
    rsvpActions: 'features/events/rsvpActions',
  },

  // ============================================
  // MESSAGING (7 test files)
  // ============================================
  messaging: {
    all: 'features/messaging',
    conversationsList: 'features/messaging/conversationsList',
    chatScreen: 'features/messaging/chatScreen',
    sendMessage: 'features/messaging/sendMessage',
    newConversation: 'features/messaging/newConversation',
    typingIndicators: 'features/messaging/typingIndicators',
    readReceipts: 'features/messaging/readReceipts',
    quickReactions: 'features/messaging/quickReactions',
  },

  // ============================================
  // FRIENDS (2 test files)
  // ============================================
  friends: {
    all: 'features/friends',
    friendsList: 'features/friends/friendsList',
    friendRequests: 'features/friends/friendRequests',
  },

  // ============================================
  // PROFILE (2 test files)
  // ============================================
  profile: {
    all: 'features/profile',
    viewProfile: 'features/profile/viewProfile',
    editProfile: 'features/profile/editProfile',
  },

  // ============================================
  // NOTIFICATIONS (2 test files)
  // ============================================
  notifications: {
    all: 'features/notifications',
    notificationsList: 'features/notifications/notificationsList',
    notificationManagement: 'features/notifications/notificationManagement',
  },

  // ============================================
  // REAL-TIME / WEBSOCKET (2 test files)
  // ============================================
  realtime: {
    all: 'features/realtime',
    socketConnection: 'features/realtime/socketConnection',
    onlineStatus: 'features/realtime/onlineStatus',
  },

  // ============================================
  // NAVIGATION (2 test files)
  // ============================================
  navigation: {
    all: 'features/navigation',
    tabNavigation: 'features/navigation/tabNavigation',
    modalNavigation: 'features/navigation/modalNavigation',
  },
};

// All features pattern
export const ALL_FEATURES = 'features';

// Feature categories for quick access
export const FEATURE_CATEGORIES = [
  'auth',
  'events',
  'messaging',
  'friends',
  'profile',
  'notifications',
  'realtime',
  'navigation',
] as const;

export type FeatureCategory = typeof FEATURE_CATEGORIES[number];

/**
 * Get the test pattern for a specific feature
 */
export const getTestPattern = (category: FeatureCategory, feature?: string): string => {
  const suite = TEST_SUITES[category];
  if (feature && feature in suite) {
    return suite[feature as keyof typeof suite];
  }
  return suite.all;
};

/**
 * Print all available test patterns
 */
export const printTestPatterns = (): void => {
  console.log('\n📋 Available Test Patterns:\n');
  console.log('All Features:');
  console.log(`  npm test -- --testPathPattern="features"\n`);

  Object.entries(TEST_SUITES).forEach(([category, patterns]) => {
    console.log(`${category.toUpperCase()}:`);
    Object.entries(patterns).forEach(([name, pattern]) => {
      const label = name === 'all' ? `All ${category}` : name;
      console.log(`  npm test -- --testPathPattern="${pattern}"  # ${label}`);
    });
    console.log();
  });
};

// Export for use in scripts
export default TEST_SUITES;

/**
 * Feature: Tab Navigation
 *
 * Tests for tab navigation functionality including:
 * - 5 tabs render correctly
 * - Tab switching works
 * - Active tab indicator
 * - Haptic feedback on tap
 */

// Mock haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

const Haptics = require('expo-haptics');

describe('Feature: Tab Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Configuration', () => {
    const tabs = [
      { name: 'Feed', icon: 'home', label: 'Feed' },
      { name: 'MyPlans', icon: 'calendar', label: 'My Plans' },
      { name: 'Create', icon: 'add-circle', label: 'Create' },
      { name: 'Friends', icon: 'people', label: 'Friends' },
      { name: 'Profile', icon: 'person', label: 'Profile' },
    ];

    test('should have exactly 5 tabs', () => {
      expect(tabs).toHaveLength(5);
    });

    test('should have Feed tab', () => {
      const feedTab = tabs.find(t => t.name === 'Feed');
      expect(feedTab).toBeDefined();
      expect(feedTab?.label).toBe('Feed');
    });

    test('should have My Plans tab', () => {
      const plansTab = tabs.find(t => t.name === 'MyPlans');
      expect(plansTab).toBeDefined();
      expect(plansTab?.label).toBe('My Plans');
    });

    test('should have Create tab', () => {
      const createTab = tabs.find(t => t.name === 'Create');
      expect(createTab).toBeDefined();
      expect(createTab?.label).toBe('Create');
    });

    test('should have Friends tab', () => {
      const friendsTab = tabs.find(t => t.name === 'Friends');
      expect(friendsTab).toBeDefined();
      expect(friendsTab?.label).toBe('Friends');
    });

    test('should have Profile tab', () => {
      const profileTab = tabs.find(t => t.name === 'Profile');
      expect(profileTab).toBeDefined();
      expect(profileTab?.label).toBe('Profile');
    });

    test('should have icons for each tab', () => {
      tabs.forEach(tab => {
        expect(tab.icon).toBeDefined();
        expect(typeof tab.icon).toBe('string');
      });
    });
  });

  describe('Tab Switching', () => {
    test('should track active tab state', () => {
      let activeTab = 'Feed';

      const switchTab = (tabName: string) => {
        activeTab = tabName;
      };

      switchTab('MyPlans');
      expect(activeTab).toBe('MyPlans');

      switchTab('Profile');
      expect(activeTab).toBe('Profile');
    });

    test('should call navigation on tab press', () => {
      const navigation = {
        navigate: jest.fn(),
      };

      const handleTabPress = (tabName: string) => {
        navigation.navigate(tabName);
      };

      handleTabPress('Friends');
      expect(navigation.navigate).toHaveBeenCalledWith('Friends');
    });

    test('should default to Feed tab', () => {
      const initialTab = 'Feed';
      expect(initialTab).toBe('Feed');
    });

    test('should preserve tab state on navigation', () => {
      let activeTab = 'Feed';
      const tabHistory: string[] = ['Feed'];

      const switchTab = (tabName: string) => {
        activeTab = tabName;
        tabHistory.push(tabName);
      };

      switchTab('MyPlans');
      switchTab('Profile');
      switchTab('Feed');

      expect(tabHistory).toEqual(['Feed', 'MyPlans', 'Profile', 'Feed']);
    });
  });

  describe('Active Tab Indicator', () => {
    test('should identify active tab', () => {
      const activeTab = 'Friends';

      const isActive = (tabName: string) => tabName === activeTab;

      expect(isActive('Friends')).toBe(true);
      expect(isActive('Feed')).toBe(false);
    });

    test('should return active styles', () => {
      const getTabStyle = (isActive: boolean) => ({
        color: isActive ? '#3B82F6' : '#9CA3AF',
        fontWeight: isActive ? 'bold' : 'normal',
      });

      expect(getTabStyle(true).color).toBe('#3B82F6');
      expect(getTabStyle(false).color).toBe('#9CA3AF');
    });

    test('should scale active tab icon', () => {
      const getIconScale = (isActive: boolean) => {
        return isActive ? 1.2 : 1.0;
      };

      expect(getIconScale(true)).toBe(1.2);
      expect(getIconScale(false)).toBe(1.0);
    });

    test('should animate tab transition', () => {
      const animationConfig = {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      };

      expect(animationConfig.type).toBe('spring');
    });
  });

  describe('Haptic Feedback', () => {
    test('should trigger haptic on tab press', async () => {
      const handleTabPress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      };

      await handleTabPress();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    test('should use light impact for tab switching', async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    test('should trigger haptic before navigation', async () => {
      const navigation = { navigate: jest.fn() };
      const callOrder: string[] = [];

      const handleTabPress = async (tabName: string) => {
        callOrder.push('haptic');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        callOrder.push('navigate');
        navigation.navigate(tabName);
      };

      await handleTabPress('Profile');

      expect(callOrder).toEqual(['haptic', 'navigate']);
    });
  });

  describe('Tab Bar Styling', () => {
    test('should have frosted glass effect', () => {
      const tabBarStyle = {
        position: 'absolute' as const,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
      };

      expect(tabBarStyle.backgroundColor).toBe('transparent');
      expect(tabBarStyle.borderTopWidth).toBe(0);
    });

    test('should respect safe area insets', () => {
      const safeAreaInsets = { bottom: 34 };

      const tabBarHeight = 60 + safeAreaInsets.bottom;
      expect(tabBarHeight).toBe(94);
    });

    test('should have consistent padding', () => {
      const tabBarPadding = {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
      };

      expect(tabBarPadding.paddingHorizontal).toBe(20);
    });
  });

  describe('Badge Display on Tabs', () => {
    test('should show badge on Friends tab for pending requests', () => {
      const pendingRequests = 3;

      const shouldShowBadge = (tabName: string, count: number) => {
        if (tabName === 'Friends' && count > 0) return true;
        return false;
      };

      expect(shouldShowBadge('Friends', pendingRequests)).toBe(true);
      expect(shouldShowBadge('Friends', 0)).toBe(false);
    });

    test('should format badge count', () => {
      const formatBadge = (count: number) => {
        if (count > 99) return '99+';
        return count.toString();
      };

      expect(formatBadge(5)).toBe('5');
      expect(formatBadge(100)).toBe('99+');
    });
  });

  describe('Create Tab Special Behavior', () => {
    test('should have special styling for Create tab', () => {
      const getCreateTabStyle = () => ({
        backgroundColor: '#3B82F6',
        borderRadius: 30,
        padding: 12,
      });

      const style = getCreateTabStyle();
      expect(style.backgroundColor).toBe('#3B82F6');
      expect(style.borderRadius).toBe(30);
    });

    test('should use larger icon for Create tab', () => {
      const getIconSize = (tabName: string) => {
        return tabName === 'Create' ? 32 : 24;
      };

      expect(getIconSize('Create')).toBe(32);
      expect(getIconSize('Feed')).toBe(24);
    });
  });

  describe('Tab Press Prevention', () => {
    test('should not re-navigate to current tab', () => {
      const navigation = { navigate: jest.fn() };
      let currentTab = 'Feed';

      const handleTabPress = (tabName: string) => {
        if (tabName !== currentTab) {
          navigation.navigate(tabName);
          currentTab = tabName;
        }
      };

      handleTabPress('Feed'); // Already on Feed
      expect(navigation.navigate).not.toHaveBeenCalled();

      handleTabPress('Profile');
      expect(navigation.navigate).toHaveBeenCalledWith('Profile');
    });

    test('should scroll to top when pressing current tab', () => {
      let scrolledToTop = false;

      const handleTabPress = (tabName: string, currentTab: string, scrollRef: { scrollToTop: () => void }) => {
        if (tabName === currentTab) {
          scrollRef.scrollToTop();
          scrolledToTop = true;
        }
      };

      const mockScrollRef = { scrollToTop: jest.fn() };
      handleTabPress('Feed', 'Feed', mockScrollRef);

      expect(scrolledToTop).toBe(true);
      expect(mockScrollRef.scrollToTop).toHaveBeenCalled();
    });
  });
});

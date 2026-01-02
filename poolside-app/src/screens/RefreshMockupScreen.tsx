import React from 'react';
import { RefreshMockup } from '../components/RefreshMockup';

/**
 * Temporary screen to preview the refresh animation mockup
 *
 * To view this mockup, temporarily replace a tab in TabNavigator.tsx:
 *
 * 1. Import this screen:
 *    import { RefreshMockupScreen } from '../screens/RefreshMockupScreen';
 *
 * 2. Replace one of the Tab.Screen components temporarily:
 *    <Tab.Screen name="Mockup" component={RefreshMockupScreen} ... />
 *
 * Or run it standalone by modifying App.tsx temporarily.
 */
export const RefreshMockupScreen: React.FC = () => {
  return <RefreshMockup />;
};

export default RefreshMockupScreen;

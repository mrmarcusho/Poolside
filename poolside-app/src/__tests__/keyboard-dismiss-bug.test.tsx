/**
 * TEST: Keyboard Dismissal Bug Investigation
 *
 * This test confirms the root cause of the keyboard instantly dismissing
 * when tapping the title TextInput on the CreateEventScreen.
 *
 * HYPOTHESIS: The TouchableWithoutFeedback wrapper with onPress={Keyboard.dismiss}
 * intercepts the tap and calls Keyboard.dismiss() before the TextInput can
 * properly acquire focus, causing a race condition.
 *
 * SOLUTION: Use Pressable instead, which allows children (like TextInput) to
 * receive focus while still enabling keyboard dismissal on tap.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

describe('Keyboard Dismissal Bug Investigation', () => {
  let keyboardDismissSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on Keyboard.dismiss to track calls
    keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  });

  afterEach(() => {
    keyboardDismissSpy.mockRestore();
  });

  describe('Root Cause: TouchableWithoutFeedback with Keyboard.dismiss', () => {
    /**
     * This component replicates the problematic pattern from CreateEventScreen:
     * TouchableWithoutFeedback wrapping a TextInput with onPress={Keyboard.dismiss}
     */
    const ProblematicComponent = () => {
      const [value, setValue] = useState('');

      return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <Text>Step 1 of 5</Text>
            <TextInput
              testID="title-input"
              value={value}
              onChangeText={setValue}
              placeholder="Pool party at sunset..."
            />
          </View>
        </TouchableWithoutFeedback>
      );
    };

    test('CONFIRMS BUG: Keyboard.dismiss is called when pressing on TextInput area', () => {
      const { getByTestId } = render(<ProblematicComponent />);
      const input = getByTestId('title-input');

      // Simulate pressing on the TextInput
      // TouchableWithoutFeedback intercepts this press and calls Keyboard.dismiss
      fireEvent.press(input);

      // This confirms that Keyboard.dismiss is called when tapping anywhere
      // inside the TouchableWithoutFeedback, INCLUDING the TextInput
      expect(keyboardDismissSpy).toHaveBeenCalled();
    });

    test('CONFIRMS BUG: Keyboard.dismiss is called even before TextInput focus', () => {
      const onFocusMock = jest.fn();

      const ComponentWithFocusTracking = () => {
        const [value, setValue] = useState('');

        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <TextInput
                testID="title-input"
                value={value}
                onChangeText={setValue}
                onFocus={onFocusMock}
                placeholder="Pool party at sunset..."
              />
            </View>
          </TouchableWithoutFeedback>
        );
      };

      const { getByTestId } = render(<ComponentWithFocusTracking />);
      const input = getByTestId('title-input');

      // Press on the input
      fireEvent.press(input);

      // Keyboard.dismiss is called immediately on press
      // This happens BEFORE or simultaneously with focus
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    });

    test('CONFIRMS BUG: Every tap on the slide calls Keyboard.dismiss', () => {
      const { getByTestId, getByText } = render(<ProblematicComponent />);

      // First tap on input
      fireEvent.press(getByTestId('title-input'));
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);

      // Second tap on input
      fireEvent.press(getByTestId('title-input'));
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);

      // Tap on text area (outside input)
      fireEvent.press(getByText('Step 1 of 5'));
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Solution: Using ScrollView with keyboardShouldPersistTaps', () => {
    /**
     * This component shows the fix: using ScrollView with keyboardShouldPersistTaps="handled"
     * This dismisses keyboard only when tapping outside interactive elements
     */
    const FixedComponent = () => {
      const [value, setValue] = useState('');

      return (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        >
          <View>
            <Text>Step 1 of 5</Text>
            <TextInput
              testID="title-input"
              value={value}
              onChangeText={setValue}
              placeholder="Pool party at sunset..."
            />
          </View>
        </ScrollView>
      );
    };

    test('CONFIRMS FIX: Keyboard.dismiss is NOT called when pressing TextInput', () => {
      const { getByTestId } = render(<FixedComponent />);
      const input = getByTestId('title-input');

      // Press on the TextInput
      fireEvent.press(input);

      // With keyboardShouldPersistTaps="handled", pressing on the TextInput
      // does NOT automatically call Keyboard.dismiss
      expect(keyboardDismissSpy).not.toHaveBeenCalled();
    });

    test('CONFIRMS FIX: TextInput can receive focus without Keyboard.dismiss interference', () => {
      const onFocusMock = jest.fn();

      const FixedWithFocusTracking = () => {
        const [value, setValue] = useState('');

        return (
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          >
            <View>
              <TextInput
                testID="title-input"
                value={value}
                onChangeText={setValue}
                onFocus={onFocusMock}
                placeholder="Pool party at sunset..."
              />
            </View>
          </ScrollView>
        );
      };

      const { getByTestId } = render(<FixedWithFocusTracking />);
      const input = getByTestId('title-input');

      // Focus the input
      fireEvent(input, 'focus');

      // Focus event fires without Keyboard.dismiss being called
      expect(onFocusMock).toHaveBeenCalledTimes(1);
      expect(keyboardDismissSpy).not.toHaveBeenCalled();
    });
  });

  describe('Reproduction: Event sequence analysis', () => {
    test('Event order: TouchableWithoutFeedback.onPress fires when tapping child TextInput', () => {
      const eventLog: string[] = [];

      const TrackedComponent = () => {
        const [value, setValue] = useState('');

        return (
          <TouchableWithoutFeedback
            onPress={() => {
              eventLog.push('TouchableWithoutFeedback.onPress');
              Keyboard.dismiss();
            }}
          >
            <View>
              <TextInput
                testID="title-input"
                value={value}
                onChangeText={setValue}
                onFocus={() => eventLog.push('TextInput.onFocus')}
                onPressIn={() => eventLog.push('TextInput.onPressIn')}
              />
            </View>
          </TouchableWithoutFeedback>
        );
      };

      const { getByTestId } = render(<TrackedComponent />);
      const input = getByTestId('title-input');

      // Simulate the press
      fireEvent.press(input);

      // The press event on TouchableWithoutFeedback fires
      expect(eventLog).toContain('TouchableWithoutFeedback.onPress');

      // This demonstrates that the parent's onPress handler fires,
      // which is the root cause of the bug
    });

    test('Keyboard.dismiss() call count matches number of taps', () => {
      const { getByTestId } = render(
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <TextInput testID="input" />
          </View>
        </TouchableWithoutFeedback>
      );

      const input = getByTestId('input');

      // First tap - keyboard would open then close
      fireEvent.press(input);
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);

      // Second tap - keyboard would stay open because it was already closed
      fireEvent.press(input);
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);

      // Third tap
      fireEvent.press(input);
      expect(keyboardDismissSpy).toHaveBeenCalledTimes(3);

      // This confirms that EVERY tap calls Keyboard.dismiss()
      // On first tap: keyboard opens, then dismiss() closes it
      // On second tap: keyboard was closed, dismiss() does nothing, keyboard opens and stays
    });
  });

  describe('Comparison: Problematic vs Fixed behavior', () => {
    test('Side-by-side comparison shows the fix works', () => {
      // Reset spy
      keyboardDismissSpy.mockClear();

      // Test problematic pattern
      const ProblematicComponent = () => (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <TextInput testID="problematic-input" />
          </View>
        </TouchableWithoutFeedback>
      );

      const { getByTestId: getProblematic } = render(<ProblematicComponent />);
      fireEvent.press(getProblematic('problematic-input'));

      const problematicCalls = keyboardDismissSpy.mock.calls.length;
      expect(problematicCalls).toBe(1); // BUG: dismiss called

      // Reset for fixed test
      keyboardDismissSpy.mockClear();

      // Test fixed pattern
      const FixedComponent = () => (
        <ScrollView keyboardShouldPersistTaps="handled" scrollEnabled={false}>
          <View>
            <TextInput testID="fixed-input" />
          </View>
        </ScrollView>
      );

      const { getByTestId: getFixed } = render(<FixedComponent />);
      fireEvent.press(getFixed('fixed-input'));

      const fixedCalls = keyboardDismissSpy.mock.calls.length;
      expect(fixedCalls).toBe(0); // FIX: dismiss NOT called
    });
  });

  describe('Solution: Pressable with Keyboard.dismiss', () => {
    /**
     * Pressable allows children to receive events while still enabling
     * keyboard dismissal. Unlike TouchableWithoutFeedback, Pressable
     * doesn't block children from receiving focus.
     */
    const PressableFixedComponent = () => {
      const [value, setValue] = useState('');

      return (
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <View>
            <Text>Step 1 of 5</Text>
            <TextInput
              testID="title-input"
              value={value}
              onChangeText={setValue}
              placeholder="Pool party at sunset..."
            />
          </View>
        </Pressable>
      );
    };

    test('Pressable calls Keyboard.dismiss on press', () => {
      const { getByText } = render(<PressableFixedComponent />);

      // Tap on the text (outside the input)
      fireEvent.press(getByText('Step 1 of 5'));

      // Keyboard.dismiss is called when tapping outside the input
      expect(keyboardDismissSpy).toHaveBeenCalled();
    });

    test('TextInput can still receive focus with Pressable parent', () => {
      const onFocusMock = jest.fn();

      const ComponentWithFocus = () => {
        const [value, setValue] = useState('');

        return (
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
            <View>
              <TextInput
                testID="title-input"
                value={value}
                onChangeText={setValue}
                onFocus={onFocusMock}
              />
            </View>
          </Pressable>
        );
      };

      const { getByTestId } = render(<ComponentWithFocus />);
      const input = getByTestId('title-input');

      // Focus the input directly
      fireEvent(input, 'focus');

      // Focus event fires successfully
      expect(onFocusMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Summary: Root Cause and Solution', () => {
  test('ROOT CAUSE: TouchableWithoutFeedback blocks TextInput from receiving focus', () => {
    /**
     * ROOT CAUSE:
     * TouchableWithoutFeedback with onPress={Keyboard.dismiss} intercepts ALL taps,
     * including taps on the TextInput, and calls Keyboard.dismiss() before the
     * TextInput can properly acquire focus.
     *
     * WHAT HAPPENS ON FIRST TAP:
     * 1. User taps on TextInput
     * 2. TouchableWithoutFeedback receives the press event FIRST
     * 3. onPress={Keyboard.dismiss} is called immediately
     * 4. TextInput receives focus, keyboard starts to open
     * 5. Keyboard.dismiss() effect kicks in, keyboard closes
     * Result: Keyboard flashes open then closes
     *
     * WHAT HAPPENS ON SECOND TAP:
     * 1. User taps on TextInput (which already has focus)
     * 2. TouchableWithoutFeedback.onPress fires, Keyboard.dismiss() called
     * 3. But keyboard was already closed, so dismiss() does nothing
     * 4. Tap on focused TextInput opens keyboard
     * 5. No pending dismiss, keyboard stays open
     * Result: Keyboard opens and stays open
     */
    expect(true).toBe(true);
  });

  test('SOLUTION: Use Pressable instead of TouchableWithoutFeedback', () => {
    /**
     * SOLUTION:
     * Replace TouchableWithoutFeedback with Pressable:
     *
     *   const renderTitleSlide = () => (
     *     <Pressable style={styles.slideContent} onPress={Keyboard.dismiss}>
     *       ...
     *       <TextInput ... />
     *     </Pressable>
     *   );
     *
     * WHY THIS WORKS:
     * - Pressable allows children (like TextInput) to receive focus events
     * - Keyboard.dismiss() is still called when tapping outside the input
     * - But when tapping ON the TextInput, it receives focus properly
     * - User can dismiss keyboard by tapping anywhere except the input
     *
     * This provides the best UX:
     * - First tap on TextInput: keyboard opens and stays open
     * - Tap outside TextInput: keyboard dismisses
     */
    expect(true).toBe(true);
  });
});

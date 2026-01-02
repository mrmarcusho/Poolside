import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { LayoutRectangle } from 'react-native';

interface EventPreviewData {
  title: string;
  dateTime: string;
  location: string;
  coverColor: string;
  coverImage: string | null;
}

interface AnimationState {
  isAnimating: boolean;
  startPosition: LayoutRectangle | null;
  targetPosition: LayoutRectangle | null;
  eventData: EventPreviewData | null;
}

interface EventCreationAnimationContextType {
  animationState: AnimationState;
  feedTabRef: React.RefObject<any>;
  triggerAnimation: (
    startPosition: LayoutRectangle,
    eventData: EventPreviewData
  ) => void;
  setTargetPosition: (position: LayoutRectangle) => void;
  onAnimationComplete: () => void;
}

const EventCreationAnimationContext = createContext<EventCreationAnimationContextType | null>(null);

export const useEventCreationAnimation = () => {
  const context = useContext(EventCreationAnimationContext);
  if (!context) {
    throw new Error('useEventCreationAnimation must be used within EventCreationAnimationProvider');
  }
  return context;
};

export const EventCreationAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    startPosition: null,
    targetPosition: null,
    eventData: null,
  });

  const feedTabRef = useRef<any>(null);

  const triggerAnimation = useCallback((
    startPosition: LayoutRectangle,
    eventData: EventPreviewData
  ) => {
    setAnimationState(prev => ({
      ...prev,
      isAnimating: true,
      startPosition,
      eventData,
    }));
  }, []);

  const setTargetPosition = useCallback((position: LayoutRectangle) => {
    setAnimationState(prev => ({
      ...prev,
      targetPosition: position,
    }));
  }, []);

  const onAnimationComplete = useCallback(() => {
    setAnimationState({
      isAnimating: false,
      startPosition: null,
      targetPosition: null,
      eventData: null,
    });
  }, []);

  return (
    <EventCreationAnimationContext.Provider
      value={{
        animationState,
        feedTabRef,
        triggerAnimation,
        setTargetPosition,
        onAnimationComplete,
      }}
    >
      {children}
    </EventCreationAnimationContext.Provider>
  );
};

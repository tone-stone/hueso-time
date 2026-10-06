import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/components/ui';

type ToastState = { message: string; id: number } | null;

let pushToast: ((message: string) => void) | null = null;

/** Call from anywhere after UI is mounted. */
export function showToast(message: string) {
  pushToast?.(message);
}

export function ToastHost() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const idRef = useRef(0);

  useEffect(() => {
    pushToast = (message: string) => {
      const id = ++idRef.current;
      setToast({ message, id });
      AccessibilityInfo.announceForAccessibility(message);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast((cur) => (cur?.id === toast.id ? null : cur));
    });
  }, [toast, opacity]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity,
          bottom: 104 + insets.bottom,
          backgroundColor: c.surfaceElevated,
          borderColor: c.tint,
          pointerEvents: 'none',
        },
      ]}>
      <Text style={{ color: c.text, fontSize: 15, textAlign: 'center' }}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    zIndex: 100,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

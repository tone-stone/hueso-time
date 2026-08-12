import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/components/ui';

type ToastState = { message: string; id: number } | null;

let pushToast: ((message: string) => void) | null = null;

/** Call from anywhere after UI is mounted. */
export function showToast(message: string) {
  pushToast?.(message);
}

export function ToastHost() {
  const c = useThemeColors();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const idRef = useRef(0);

  useEffect(() => {
    pushToast = (message: string) => {
      const id = ++idRef.current;
      setToast({ message, id });
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
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast((cur) => (cur?.id === toast.id ? null : cur));
    });
  }, [toast, opacity]);

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity,
          backgroundColor: c.surfaceElevated,
          borderColor: c.tint,
        },
      ]}>
      <Text style={{ color: c.text, fontWeight: '700', textAlign: 'center' }}>
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

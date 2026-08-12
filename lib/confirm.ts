import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
};

/** Confirm destructive action. Uses window.confirm on web (Alert.alert is unreliable there). */
export function confirmDestructive({
  title,
  message = '',
  cancelLabel,
  confirmLabel,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    const ok =
      typeof window !== 'undefined' &&
      window.confirm(message ? `${title}\n\n${message}` : title);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

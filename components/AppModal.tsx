import { KeyboardAvoidingView, Modal as NativeModal, Platform, StyleSheet, View, Text, Pressable, type ModalProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/components/ui';

/** Native Back, keyboard clearance and bounded tablet forms shared by every dialog. */
export function AppModal({ children, transparent, onRequestClose, error, ...props }: Omit<ModalProps, 'onRequestClose'> & { onRequestClose: () => void; error?: string | null }) {
  const c = useThemeColors();
  const { t } = useTranslation();
  return (
    <NativeModal {...props} transparent={transparent} onRequestClose={onRequestClose}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']}
        style={[styles.root, !transparent && { backgroundColor: c.backgroundAlt }]}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View accessibilityViewIsModal onAccessibilityEscape={onRequestClose}
            style={[styles.root, !transparent && styles.panel]}>
            {!transparent ? <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')}
              onPress={onRequestClose} style={{ minWidth: 48, minHeight: 48, alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: c.textMuted, fontSize: 26 }}>×</Text>
            </Pressable> : null}
            {children}
            {error ? <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 15, padding: 16 }}>{error}</Text> : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NativeModal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: { width: '100%', maxWidth: 720, alignSelf: 'center' },
});

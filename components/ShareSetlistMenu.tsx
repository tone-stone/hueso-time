import { Platform, Share, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppModal } from '@/components/AppModal';
import { Body, PrimaryButton, GhostButton, Screen, Subtitle, Title } from '@/components/ui';
import { formatSetlistCsv, formatSetlistHtml, formatSetlistShareText } from '@/lib/exportSetlist';
import { shareTextFile } from '@/lib/shareFile';
import { useAsyncAction } from '@/lib/useAsyncAction';
import type { Setlist, Song } from '@/types/models';

export function ShareSetlistMenu({ visible, onClose, setlist, songsById }: {
  visible: boolean; onClose: () => void; setlist: Setlist | null; songsById: Map<string, Song>;
}) {
  const { t } = useTranslation();
  const { busy, error, run, retry } = useAsyncAction();
  const setLabel = (n: number, name: string) => name || t('setlists.setLabel', { n });
  const options = { total: t('setlists.totalShow'), set: setLabel, bpm: 'BPM' };
  const filename = `${setlist?.name.replace(/[^\w\-]+/g, '_') || 'setlist'}.csv`;
  async function exportPdf() {
    if (!setlist) return;
    const html = formatSetlistHtml(setlist, songsById, options);
    if (Platform.OS === 'web') {
      const win = window.open('', '_blank');
      if (!win) throw new Error(t('toast.shareFailed'));
      win.document.write(html); win.document.close(); win.focus(); win.print();
    } else {
      if (!await Sharing.isAvailableAsync()) throw new Error(t('ux.shareUnavailable'));
      const result = await Print.printToFileAsync({ html, base64: true });
      if (!result.base64) throw new Error(t('toast.shareFailed'));
      // Write into the scoped cache used by Sharing, including inside Expo Go.
      const pdf = new File(Paths.cache, filename.replace(/\.csv$/, '.pdf'));
      pdf.create({ overwrite: true });
      pdf.write(result.base64, { encoding: 'base64' });
      await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: setlist.name });
    }
  }
  return (
    <AppModal visible={visible} animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
      <Screen safeTop={false}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Title>{t('setlists.share')}</Title>
          <Subtitle>{setlist?.name}</Subtitle>
          <Body muted>{t('setlists.shareHint')}</Body>
          {busy ? <View accessibilityLiveRegion="polite"><Body muted>{t('ux.exportBusy')}</Body></View> : null}
          {error ? <View><Body>{error}</Body><GhostButton label={t('ux.retry')} onPress={retry} disabled={busy} /></View> : null}
          <PrimaryButton label={t('setlists.shareSend')} disabled={busy || !setlist} onPress={() => void run(async () => {
            if (setlist) await Share.share({ message: formatSetlistShareText(setlist, songsById, options), title: setlist.name });
          })} />
          <PrimaryButton label={t('setlists.shareCsv')} disabled={busy || !setlist} onPress={() => void run(async () => {
            if (setlist) await shareTextFile('\uFEFF' + formatSetlistCsv(setlist, songsById, { set: setLabel }), filename, 'text/csv');
          })} />
          <PrimaryButton label={t('setlists.sharePdf')} disabled={busy || !setlist} onPress={() => void run(exportPdf)} />
          <GhostButton label={t('common.cancel')} disabled={busy} onPress={onClose} />
        </ScrollView>
      </Screen>
    </AppModal>
  );
}

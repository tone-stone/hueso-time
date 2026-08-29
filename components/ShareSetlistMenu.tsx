import { Modal, Platform, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/Toast';
import { GhostButton, ListGroup, ListRow, Screen, Subtitle, Title } from '@/components/ui';
import {
  formatSetlistCsv,
  formatSetlistHtml,
  formatSetlistShareText,
} from '@/lib/exportSetlist';
import type { Setlist, Song } from '@/types/models';

/** Bottom-sheet with the ways to get a setlist out of the app: send, CSV export, PDF. */
export function ShareSetlistMenu({
  visible,
  onClose,
  setlist,
  songsById,
}: {
  visible: boolean;
  onClose: () => void;
  setlist: Setlist | null;
  songsById: Map<string, Song>;
}) {
  const { t } = useTranslation();

  const setLabel = (n: number, name: string) => name || t('setlists.setLabel', { n });

  async function handleSend() {
    if (!setlist) return;
    const message = formatSetlistShareText(setlist, songsById, {
      total: t('setlists.totalShow'),
      set: setLabel,
      bpm: 'BPM',
    });
    try {
      await Share.share({ message, title: setlist.name });
    } catch {
      showToast(t('toast.shareFailed'));
    }
    onClose();
  }

  async function handleCsv() {
    if (!setlist) return;
    const csv = formatSetlistCsv(setlist, songsById, { set: setLabel });
    const filename = `${setlist.name.replace(/[^\w\-]+/g, '_') || 'setlist'}.csv`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('toast.csvExported'));
    } else {
      try {
        await Share.share({ message: csv, title: filename });
      } catch {
        showToast(t('toast.shareFailed'));
      }
    }
    onClose();
  }

  function handlePdf() {
    if (!setlist) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const html = formatSetlistHtml(setlist, songsById, {
        total: t('setlists.totalShow'),
        set: setLabel,
        bpm: 'BPM',
      });
      const win = window.open('', '_blank');
      if (!win) {
        showToast(t('toast.shareFailed'));
        onClose();
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } else {
      showToast(t('toast.pdfWebOnly'));
    }
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <Screen safeTop={false}>
        <View style={{ padding: 16, flex: 1 }}>
          <Title>{t('setlists.share')}</Title>
          <Subtitle>{t('setlists.shareHint')}</Subtitle>

          <ListGroup style={{ marginTop: 8 }}>
            <ListRow
              icon={<Text style={{ fontSize: 17 }}>↗</Text>}
              label={t('setlists.shareSend')}
              onPress={() => void handleSend()}
            />
            <ListRow
              icon={<Text style={{ fontSize: 17 }}>📊</Text>}
              label={t('setlists.shareCsv')}
              onPress={() => void handleCsv()}
            />
            <ListRow
              icon={<Text style={{ fontSize: 17 }}>📄</Text>}
              label={t('setlists.sharePdf')}
              last
              onPress={handlePdf}
            />
          </ListGroup>

          <View style={{ marginTop: 16 }}>
            <GhostButton label={t('common.cancel')} onPress={onClose} />
          </View>
        </View>
      </Screen>
    </Modal>
  );
}

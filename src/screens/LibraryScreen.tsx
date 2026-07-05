import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SongList } from '../components/SongList';
import { usePlayer } from '../store/PlayerStore';
import { colors } from '../theme';

export function LibraryScreen() {
  const { songs, loading, permission, requestAndScan, rescan, scanProgress } =
    usePlayer();

  const renderBody = () => {
    if (loading) {
      return (
        <EmptyState
          icon="sync"
          loading
          title="Scanning your library…"
          message={`${scanProgress} songs found so far`}
        />
      );
    }
    if (permission === 'denied') {
      return (
        <EmptyState
          icon="lock-closed"
          title="Storage access needed"
          message="Enable audio permission in system settings so the player can find your music."
          actionLabel="Try again"
          onAction={requestAndScan}
        />
      );
    }
    if (songs.length === 0) {
      return (
        <EmptyState
          icon="musical-notes"
          title="No music yet"
          message="Grant access to scan your device storage for audio files."
          actionLabel="Scan device"
          onAction={requestAndScan}
        />
      );
    }
    return <SongList songs={songs} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Your Library"
        subtitle={songs.length ? `${songs.length} tracks on device` : undefined}
        actions={[{ icon: 'refresh', onPress: rescan }]}
      />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});

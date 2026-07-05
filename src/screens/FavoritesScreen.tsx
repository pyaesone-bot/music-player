import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SongList } from '../components/SongList';
import { usePlayer } from '../store/PlayerStore';
import { colors } from '../theme';

export function FavoritesScreen() {
  const { songs, favorites } = usePlayer();

  const favoriteSongs = useMemo(() => {
    const set = new Set(favorites);
    return songs.filter((s) => set.has(s.id));
  }, [songs, favorites]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Favorites"
        subtitle={favoriteSongs.length ? `${favoriteSongs.length} loved tracks` : undefined}
      />
      <View style={styles.body}>
        <SongList
          songs={favoriteSongs}
          searchable={favoriteSongs.length > 0}
          emptyComponent={
            <EmptyState
              icon="heart"
              title="No favorites yet"
              message="Tap the heart on any song to add it here."
            />
          }
        />
      </View>
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

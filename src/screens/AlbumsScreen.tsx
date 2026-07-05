import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArtCover } from '../components/ArtCover';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import type { RootStackParamList } from '../navigation';
import { usePlayer } from '../store/PlayerStore';
import { colors, spacing } from '../theme';
import type { AlbumGroup } from '../types';

export function AlbumsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { songs } = usePlayer();

  const albums = useMemo<AlbumGroup[]>(() => {
    const map = new Map<string, AlbumGroup>();
    for (const song of songs) {
      const id = song.albumId ?? song.album;
      const existing = map.get(id);
      if (existing) existing.songs.push(song);
      else map.set(id, { id, name: song.album, songs: [song] });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Albums" subtitle={albums.length ? `${albums.length} albums` : undefined} />
      <FlatList
        data={albums}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('AlbumDetail', {
                albumId: item.id,
                albumName: item.name,
              })
            }
          >
            <ArtCover seed={item.name} size={CARD} rounded={16} />
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.count}>{item.songs.length} songs</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="albums"
            title="No albums"
            message="Scan your device from the Library tab to see albums here."
          />
        }
      />
    </SafeAreaView>
  );
}

const CARD = 165;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing(4),
    paddingBottom: 140,
  },
  column: {
    justifyContent: 'space-between',
    marginBottom: spacing(5),
  },
  card: {
    width: CARD,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: spacing(2),
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useActiveTrack } from 'react-native-track-player';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';
import type { Song } from '../types';
import { AddToPlaylistSheet } from './AddToPlaylistSheet';
import { TrackRow } from './TrackRow';

type Props = {
  songs: Song[];
  searchable?: boolean;
  showActions?: boolean;
  emptyComponent?: React.ReactElement;
  headerExtra?: React.ReactElement;
  onRemove?: (songId: string) => void;
};

export function SongList({
  songs,
  searchable = true,
  showActions = true,
  emptyComponent,
  headerExtra,
}: Props) {
  const { playQueue, toggleFavorite, isFavorite } = usePlayer();
  const activeTrack = useActiveTrack();
  const [query, setQuery] = useState('');
  const [sheetSongId, setSheetSongId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q),
    );
  }, [songs, query]);

  const header = (
    <View>
      {headerExtra}
      {searchable ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs, artists…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable hitSlop={10} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {showActions && filtered.length > 0 ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.playAll}
            onPress={() => playQueue(filtered, 0)}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.playAllText}>Play all</Text>
          </Pressable>
          <Pressable
            style={styles.shuffleAll}
            onPress={() =>
              playQueue(filtered, Math.floor(Math.random() * filtered.length))
            }
          >
            <Ionicons name="shuffle" size={18} color={colors.primary} />
            <Text style={styles.shuffleAllText}>Shuffle</Text>
          </Pressable>
          <Text style={styles.count}>{filtered.length} songs</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={14}
        windowSize={11}
        renderItem={({ item, index }) => (
          <TrackRow
            song={item}
            isActive={activeTrack?.id === item.id}
            isFavorite={isFavorite(item.id)}
            onPress={() => playQueue(filtered, index)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onMore={() => setSheetSongId(item.id)}
          />
        )}
        ListEmptyComponent={emptyComponent}
      />
      <AddToPlaylistSheet
        songId={sheetSongId}
        onClose={() => setSheetSongId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.card,
    marginHorizontal: spacing(4),
    marginBottom: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing(3),
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(3),
  },
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.primary,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
  },
  playAllText: {
    color: '#fff',
    fontWeight: '700',
  },
  shuffleAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.card,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
  },
  shuffleAllText: {
    color: colors.primary,
    fontWeight: '700',
  },
  count: {
    marginLeft: 'auto',
    color: colors.textFaint,
    fontSize: 12,
  },
});

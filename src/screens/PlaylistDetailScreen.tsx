import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SongList } from '../components/SongList';
import type { RootStackParamList } from '../navigation';
import { usePlayer } from '../store/PlayerStore';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaylistDetail'>;

export function PlaylistDetailScreen({ route, navigation }: Props) {
  const { playlistId } = route.params;
  const { playlists, songById } = usePlayer();

  const playlist = playlists.find((p) => p.id === playlistId);

  const songs = useMemo(() => {
    if (!playlist) return [];
    return playlist.songIds
      .map((id) => songById.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [playlist, songById]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title={playlist?.name ?? 'Playlist'}
        subtitle={`${songs.length} songs`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <SongList
          songs={songs}
          searchable={false}
          emptyComponent={
            <EmptyState
              icon="list"
              title="Empty playlist"
              message="Add songs using the ⋮ menu next to any track."
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

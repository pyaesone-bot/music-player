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

type Props = NativeStackScreenProps<RootStackParamList, 'AlbumDetail'>;

export function AlbumDetailScreen({ route, navigation }: Props) {
  const { albumId, albumName } = route.params;
  const { songs } = usePlayer();

  const albumSongs = useMemo(
    () => songs.filter((s) => (s.albumId ?? s.album) === albumId),
    [songs, albumId],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title={albumName}
        subtitle={`${albumSongs.length} songs`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <SongList
          songs={albumSongs}
          searchable={false}
          emptyComponent={<EmptyState icon="disc" title="Empty album" />}
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

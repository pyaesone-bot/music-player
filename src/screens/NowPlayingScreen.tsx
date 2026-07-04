import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrackPlayer, {
  RepeatMode,
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';
import { ArtCover } from '../components/ArtCover';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../lib/format';
import type { RootStackParamList } from '../navigation';
import { usePlayer } from '../store/PlayerStore';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NowPlaying'>;

export function NowPlayingScreen({ navigation }: Props) {
  const track = useActiveTrack();
  const { playing } = useIsPlaying();
  const { position, duration } = useProgress(400);
  const {
    shuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    toggleFavorite,
    isFavorite,
  } = usePlayer();

  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const displayValue = seeking ? seekValue : position;

  if (!track) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="musical-note" title="Nothing playing" />
      </SafeAreaView>
    );
  }

  const trackId = track.id as string;
  const total = duration || (track.duration as number) || 0;
  const repeatActive = repeatMode !== RepeatMode.Off;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Now Playing</Text>
        <Pressable hitSlop={12} onPress={() => toggleFavorite(trackId)}>
          <Ionicons
            name={isFavorite(trackId) ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite(trackId) ? colors.accent : colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.artWrap}>
        <ArtCover
          seed={`${track.album ?? ''}${track.title ?? ''}`}
          size={300}
          rounded={28}
          iconRatio={0.34}
        />
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>
          {track.title ?? 'Unknown'}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {track.artist ?? 'Unknown artist'}
        </Text>
      </View>

      <View style={styles.sliderWrap}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={total > 0 ? total : 1}
          value={displayValue}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          onSlidingStart={() => setSeeking(true)}
          onValueChange={setSeekValue}
          onSlidingComplete={async (v) => {
            await TrackPlayer.seekTo(v);
            setSeeking(false);
          }}
        />
        <View style={styles.times}>
          <Text style={styles.time}>{formatDuration(displayValue)}</Text>
          <Text style={styles.time}>{formatDuration(total)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable hitSlop={10} onPress={toggleShuffle}>
          <Ionicons
            name="shuffle"
            size={26}
            color={shuffle ? colors.primary : colors.textMuted}
          />
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() => TrackPlayer.skipToPrevious().catch(() => {})}
        >
          <Ionicons name="play-skip-back" size={34} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.playBtn}
          onPress={() => (playing ? TrackPlayer.pause() : TrackPlayer.play())}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={36}
            color="#fff"
            style={playing ? undefined : styles.playOffset}
          />
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() => TrackPlayer.skipToNext().catch(() => {})}
        >
          <Ionicons name="play-skip-forward" size={34} color={colors.text} />
        </Pressable>
        <Pressable hitSlop={10} onPress={cycleRepeat} style={styles.repeatWrap}>
          <Ionicons
            name="repeat"
            size={26}
            color={repeatActive ? colors.primary : colors.textMuted}
          />
          {repeatMode === RepeatMode.Track ? (
            <View style={styles.repeatBadge}>
              <Text style={styles.repeatBadgeText}>1</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing(6),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
  },
  topTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  artWrap: {
    alignItems: 'center',
    marginTop: spacing(6),
    marginBottom: spacing(8),
  },
  meta: {
    alignItems: 'center',
    gap: spacing(1),
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  artist: {
    color: colors.textMuted,
    fontSize: 16,
  },
  sliderWrap: {
    marginTop: spacing(8),
  },
  slider: {
    width: '100%',
    height: 40,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing(1),
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(8),
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  playOffset: {
    marginLeft: 4,
  },
  repeatWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  repeatBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TrackPlayer, {
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';
import { colors, radius, spacing } from '../theme';

export function MiniPlayer({ onPress }: { onPress: () => void }) {
  const track = useActiveTrack();
  const { playing } = useIsPlaying();
  const { position, duration } = useProgress(500);

  if (!track) return null;
  const pct = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <Pressable
        style={styles.body}
        onPress={onPress}
        android_ripple={{ color: colors.cardAlt }}
      >
        <Ionicons name="musical-note" size={20} color={colors.primary} />
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title ?? 'Unknown'}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist ?? 'Unknown artist'}
          </Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => (playing ? TrackPlayer.pause() : TrackPlayer.play())}
          style={styles.ctrl}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={24} color={colors.text} />
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => TrackPlayer.skipToNext().catch(() => {})}
          style={styles.ctrl}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing(2),
    right: spacing(2),
    bottom: spacing(2),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    elevation: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.bgElevated,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(3),
    gap: spacing(3),
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  artist: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  ctrl: {
    paddingHorizontal: spacing(1),
  },
});

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '../lib/format';
import { colors, spacing } from '../theme';
import type { Song } from '../types';
import { ArtCover } from './ArtCover';

type Props = {
  song: Song;
  isActive?: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  onMore?: () => void;
};

function TrackRowBase({
  song,
  isActive,
  isFavorite,
  onPress,
  onToggleFavorite,
  onMore,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.cardAlt }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <ArtCover seed={song.album + song.title} size={52} />
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={[styles.title, isActive && styles.titleActive]}
        >
          {song.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {song.artist} {song.ext ? `· ${song.ext.toUpperCase()}` : ''}
        </Text>
      </View>
      {isActive ? (
        <Ionicons
          name="volume-medium"
          size={18}
          color={colors.primary}
          style={styles.playingIcon}
        />
      ) : null}
      <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
      {onToggleFavorite ? (
        <Pressable hitSlop={10} onPress={onToggleFavorite} style={styles.iconBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.accent : colors.textFaint}
          />
        </Pressable>
      ) : null}
      {onMore ? (
        <Pressable hitSlop={10} onPress={onMore} style={styles.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    gap: spacing(3),
  },
  pressed: {
    backgroundColor: colors.bgElevated,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  titleActive: {
    color: colors.primary,
  },
  artist: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginTop: 2,
  },
  playingIcon: {
    marginRight: 2,
  },
  duration: {
    color: colors.textFaint,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  iconBtn: {
    padding: 2,
  },
});

export const TrackRow = memo(TrackRowBase);

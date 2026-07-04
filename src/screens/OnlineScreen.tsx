import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveTrack } from 'react-native-track-player';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { formatDuration } from '../lib/format';
import { searchOnline, trendingOnline } from '../lib/youtube';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';
import type { OnlineTrack } from '../types';

export function OnlineScreen() {
  const { playOnline, downloadTrack } = usePlayer();
  const activeTrack = useActiveTrack();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OnlineTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preparing, setPreparing] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async (q: string) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const data = q.trim() ? await searchOnline(q) : await trendingOnline();
      if (id === reqId.current) setResults(data);
    } catch (e) {
      if (id === reqId.current) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        setResults([]);
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(query), query ? 400 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  const onPlay = async (track: OnlineTrack, index: number) => {
    setPreparing(track.id);
    try {
      await playOnline(results, index);
    } catch (e) {
      Alert.alert(
        "Couldn't play track",
        e instanceof Error ? e.message : 'Could not extract an audio stream.',
      );
    } finally {
      setPreparing(null);
    }
  };

  const onDownload = async (track: OnlineTrack) => {
    setDownloading(track.id);
    try {
      const res = await downloadTrack(track);
      if (res.ok) {
        Alert.alert(
          'Downloaded',
          res.savedToLibrary
            ? `"${track.title}" was saved to your device library.`
            : `"${track.title}" was downloaded to the app.`,
        );
      } else {
        Alert.alert('Download failed', res.error);
      }
    } finally {
      setDownloading(null);
    }
  };

  const renderBody = () => {
    if (loading && results.length === 0) {
      return <EmptyState icon="cloud-download" loading title="Searching…" />;
    }
    if (error) {
      return (
        <EmptyState
          icon="cloud-offline"
          title="Couldn't reach the catalogue"
          message={error}
          actionLabel="Retry"
          onAction={() => void load(query)}
        />
      );
    }
    if (results.length === 0) {
      return (
        <EmptyState
          icon="search"
          title="No results"
          message="Try another search term."
        />
      );
    }
    return (
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.row}
            android_ripple={{ color: colors.cardAlt }}
            onPress={() => onPlay(item, index)}
          >
            {item.artwork ? (
              <Image source={{ uri: item.artwork }} style={styles.art} />
            ) : (
              <View style={[styles.art, styles.artFallback]}>
                <Ionicons name="musical-note" size={22} color={colors.textMuted} />
              </View>
            )}
            {preparing === item.id ? (
              <View style={[styles.art, styles.artOverlay]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : null}
            <View style={styles.meta}>
              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  activeTrack?.id === `yt:${item.id}` && styles.titleActive,
                ]}
              >
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {item.artist} · {formatDuration(item.duration)}
              </Text>
            </View>
            <Pressable
              hitSlop={10}
              style={styles.dl}
              onPress={() => onDownload(item)}
              disabled={downloading === item.id}
            >
              {downloading === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={22} color={colors.textMuted} />
              )}
            </Pressable>
          </Pressable>
        )}
        ListFooterComponent={
          <Text style={styles.attribution}>
            YouTube · on-device via youtubei.js (open-source)
          </Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Online" subtitle="Search & stream music from YouTube" />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search YouTube…"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => void load(query)}
        />
        {query ? (
          <Pressable hitSlop={10} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
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
  list: {
    paddingBottom: 140,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  art: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
  },
  artFallback: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artOverlay: {
    position: 'absolute',
    left: spacing(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
  dl: {
    padding: spacing(1),
    width: 34,
    alignItems: 'center',
  },
  attribution: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing(5),
  },
});

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import { setupPlayer } from '../playback/setup';
import { ensurePermission, scanAudio, type PermissionState } from '../library/scan';
import {
  loadFavorites,
  loadPlaylists,
  saveFavorites,
  savePlaylists,
} from './playlists';
import { songToTrack, type Playlist, type Song } from '../types';

type PlayerContextValue = {
  ready: boolean;
  songs: Song[];
  songById: Map<string, Song>;
  loading: boolean;
  scanProgress: number;
  permission: PermissionState;
  playlists: Playlist[];
  favorites: string[];
  shuffle: boolean;
  repeatMode: RepeatMode;
  requestAndScan: () => Promise<void>;
  rescan: () => Promise<void>;
  playQueue: (list: Song[], startIndex: number) => Promise<void>;
  playNext: (song: Song) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  cycleRepeat: () => Promise<void>;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);

  const sourceRef = useRef<Song[]>([]);

  useEffect(() => {
    (async () => {
      await setupPlayer();
      const [pl, fav] = await Promise.all([loadPlaylists(), loadFavorites()]);
      setPlaylists(pl);
      setFavorites(fav);
      setReady(true);
    })();
  }, []);

  const songById = useMemo(
    () => new Map(songs.map((s) => [s.id, s])),
    [songs],
  );

  const runScan = useCallback(async () => {
    setLoading(true);
    setScanProgress(0);
    try {
      const found = await scanAudio((count) => setScanProgress(count));
      setSongs(found);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestAndScan = useCallback(async () => {
    const state = await ensurePermission();
    setPermission(state);
    if (state === 'granted') {
      await runScan();
    }
  }, [runScan]);

  const rescan = useCallback(async () => {
    if (permission === 'granted') {
      await runScan();
    } else {
      await requestAndScan();
    }
  }, [permission, runScan, requestAndScan]);

  const playQueue = useCallback(
    async (list: Song[], startIndex: number) => {
      if (list.length === 0) return;
      sourceRef.current = list;
      const start = list[startIndex] ?? list[0];
      let ordered = list;
      let index = startIndex;
      if (shuffle) {
        const rest = shuffleInPlace(list.filter((s) => s.id !== start.id));
        ordered = [start, ...rest];
        index = 0;
      }
      await TrackPlayer.reset();
      await TrackPlayer.add(ordered.map(songToTrack));
      if (index > 0) await TrackPlayer.skip(index);
      await TrackPlayer.play();
    },
    [shuffle],
  );

  const playNext = useCallback(async (song: Song) => {
    const queue = await TrackPlayer.getQueue();
    if (queue.length === 0) {
      sourceRef.current = [song];
      await TrackPlayer.reset();
      await TrackPlayer.add([songToTrack(song)]);
      await TrackPlayer.play();
      return;
    }
    const activeIndex = (await TrackPlayer.getActiveTrackIndex()) ?? -1;
    await TrackPlayer.add([songToTrack(song)], activeIndex + 1);
  }, []);

  const toggleShuffle = useCallback(async () => {
    const next = !shuffle;
    setShuffle(next);
    const source = sourceRef.current;
    if (source.length === 0) return;
    const active = await TrackPlayer.getActiveTrack();
    const currentId = active?.id as string | undefined;
    const position = await TrackPlayer.getProgress().then((p) => p.position);
    let ordered = [...source];
    if (next && currentId) {
      const current = source.find((s) => s.id === currentId);
      const rest = shuffleInPlace(source.filter((s) => s.id !== currentId));
      ordered = current ? [current, ...rest] : rest;
    }
    const newIndex = currentId
      ? Math.max(0, ordered.findIndex((s) => s.id === currentId))
      : 0;
    await TrackPlayer.reset();
    await TrackPlayer.add(ordered.map(songToTrack));
    if (newIndex > 0) await TrackPlayer.skip(newIndex);
    if (position > 0) await TrackPlayer.seekTo(position);
    await TrackPlayer.play();
  }, [shuffle]);

  const cycleRepeat = useCallback(async () => {
    const order = [RepeatMode.Off, RepeatMode.Queue, RepeatMode.Track];
    const idx = order.indexOf(repeatMode);
    const next = order[(idx + 1) % order.length];
    setRepeatMode(next);
    await TrackPlayer.setRepeatMode(next);
  }, [repeatMode]);

  const persistFavorites = useCallback((ids: string[]) => {
    setFavorites(ids);
    void saveFavorites(ids);
  }, []);

  const toggleFavorite = useCallback(
    (songId: string) => {
      persistFavorites(
        favorites.includes(songId)
          ? favorites.filter((id) => id !== songId)
          : [songId, ...favorites],
      );
    },
    [favorites, persistFavorites],
  );

  const isFavorite = useCallback(
    (songId: string) => favorites.includes(songId),
    [favorites],
  );

  const persistPlaylists = useCallback((next: Playlist[]) => {
    setPlaylists(next);
    void savePlaylists(next);
  }, []);

  const createPlaylist = useCallback(
    (name: string): Playlist => {
      const playlist: Playlist = {
        id: uid(),
        name: name.trim() || 'New Playlist',
        songIds: [],
        createdAt: Date.now(),
      };
      persistPlaylists([playlist, ...playlists]);
      return playlist;
    },
    [playlists, persistPlaylists],
  );

  const deletePlaylist = useCallback(
    (id: string) => persistPlaylists(playlists.filter((p) => p.id !== id)),
    [playlists, persistPlaylists],
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) =>
      persistPlaylists(
        playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
      ),
    [playlists, persistPlaylists],
  );

  const addToPlaylist = useCallback(
    (playlistId: string, songId: string) =>
      persistPlaylists(
        playlists.map((p) =>
          p.id === playlistId && !p.songIds.includes(songId)
            ? { ...p, songIds: [...p.songIds, songId] }
            : p,
        ),
      ),
    [playlists, persistPlaylists],
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, songId: string) =>
      persistPlaylists(
        playlists.map((p) =>
          p.id === playlistId
            ? { ...p, songIds: p.songIds.filter((id) => id !== songId) }
            : p,
        ),
      ),
    [playlists, persistPlaylists],
  );

  const value: PlayerContextValue = {
    ready,
    songs,
    songById,
    loading,
    scanProgress,
    permission,
    playlists,
    favorites,
    shuffle,
    repeatMode,
    requestAndScan,
    rescan,
    playQueue,
    playNext,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    isFavorite,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}

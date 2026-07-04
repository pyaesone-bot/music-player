import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import type { OnlineTrack } from '../types';

/**
 * Minimal client for the Audius public API — a legal, royalty-free catalogue of
 * music that artists have made available for streaming and download.
 * Docs: https://docs.audius.org/developers/api/
 */

const APP_NAME = 'ExpoMusicPlayer';

const FALLBACK_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
];

let hostPromise: Promise<string> | null = null;

async function getHost(): Promise<string> {
  if (!hostPromise) {
    hostPromise = (async () => {
      try {
        const res = await fetch('https://api.audius.co');
        const json = (await res.json()) as { data?: string[] };
        const hosts = json.data ?? [];
        if (hosts.length > 0) {
          return hosts[Math.floor(Math.random() * hosts.length)];
        }
      } catch {
        // Fall through to the hard-coded hosts below.
      }
      return FALLBACK_HOSTS[0];
    })();
  }
  return hostPromise;
}

type AudiusArtwork = { '150x150'?: string; '480x480'?: string; '1000x1000'?: string };
type AudiusTrack = {
  id: string;
  title: string;
  duration?: number;
  is_streamable?: boolean;
  user?: { name?: string; handle?: string };
  artwork?: AudiusArtwork | null;
};

function streamUrl(host: string, id: string): string {
  return `${host}/v1/tracks/${id}/stream?app_name=${APP_NAME}`;
}

function mapTrack(host: string, t: AudiusTrack): OnlineTrack {
  return {
    id: t.id,
    title: t.title,
    artist: t.user?.name || t.user?.handle || 'Unknown artist',
    artwork: t.artwork?.['480x480'] ?? t.artwork?.['150x150'],
    duration: t.duration ?? 0,
    streamUrl: streamUrl(host, t.id),
  };
}

export async function searchOnline(query: string): Promise<OnlineTrack[]> {
  const q = query.trim();
  if (!q) return [];
  const host = await getHost();
  const url = `${host}/v1/tracks/search?query=${encodeURIComponent(
    q,
  )}&app_name=${APP_NAME}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = (await res.json()) as { data?: AudiusTrack[] };
  return (json.data ?? [])
    .filter((t) => t.is_streamable !== false)
    .map((t) => mapTrack(host, t));
}

export async function trendingOnline(): Promise<OnlineTrack[]> {
  const host = await getHost();
  const url = `${host}/v1/tracks/trending?app_name=${APP_NAME}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = (await res.json()) as { data?: AudiusTrack[] };
  return (json.data ?? [])
    .filter((t) => t.is_streamable !== false)
    .map((t) => mapTrack(host, t));
}

function safeFileName(track: OnlineTrack): string {
  const base = `${track.artist} - ${track.title}`.replace(/[^\w\-. ]+/g, '_');
  return `${base}.mp3`.slice(0, 120);
}

export type DownloadResult = { ok: true; savedToLibrary: boolean } | { ok: false; error: string };

/**
 * Downloads a track's MP3 to a local file and registers it with the device
 * MediaStore so it shows up in the on-device library after a rescan.
 */
export async function downloadOnline(track: OnlineTrack): Promise<DownloadResult> {
  try {
    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) return { ok: false, error: 'No writable directory available' };
    const target = dir + safeFileName(track);
    const { uri, status } = await FileSystem.downloadAsync(track.streamUrl, target);
    if (status >= 400) return { ok: false, error: `Download failed (${status})` };

    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.granted) {
        await MediaLibrary.createAssetAsync(uri);
        return { ok: true, savedToLibrary: true };
      }
    } catch {
      // Saving to the shared library is best-effort; the file is still cached.
    }
    return { ok: true, savedToLibrary: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import { Innertube, YTNodes } from 'youtubei.js';
import type { OnlineTrack } from '../types';

/**
 * On-device YouTube client powered by the open-source **youtubei.js** library.
 *
 * Search and audio-stream extraction both run directly on the device against
 * YouTube's Innertube API — there is no server or third-party instance in the
 * middle. Because requests originate from the phone's own IP, this is far less
 * likely to be blocked by YouTube's anti-bot checks than server-side extractors
 * (Piped / Invidious / Cobalt), which run on data-center IPs.
 *
 * Note: signature deciphering and network I/O rely on the polyfills installed in
 * `src/polyfills.ts`, which must be imported before this module loads.
 */

/** A popular search used to seed the screen before the user types anything. */
const DEFAULT_QUERY = 'lofi hip hop';

let clientPromise: Promise<Innertube> | null = null;

async function client(): Promise<Innertube> {
  if (!clientPromise) {
    clientPromise = Innertube.create({ generate_session_locally: true });
  }
  return clientPromise;
}

export async function searchOnline(query: string): Promise<OnlineTrack[]> {
  const q = query.trim();
  if (!q) return [];
  const yt = await client();
  const search = await yt.search(q, { type: 'video' });
  const out: OnlineTrack[] = [];
  for (const v of search.results.filterType(YTNodes.Video)) {
    if (v.is_live) continue;
    const seconds = v.duration?.seconds ?? 0;
    if (!seconds) continue; // skip live / unknown-length items
    out.push({
      id: v.video_id,
      title: v.title.text || 'Unknown title',
      artist: v.author?.name || 'YouTube',
      artwork: v.best_thumbnail?.url ?? v.thumbnails?.[0]?.url,
      duration: seconds,
    });
  }
  return out;
}

export async function trendingOnline(): Promise<OnlineTrack[]> {
  return searchOnline(DEFAULT_QUERY);
}

/**
 * Innertube clients tried in order. Different clients expose streaming data
 * under different anti-bot conditions, so we fall back through several to
 * maximise the chance of getting a playable audio format.
 */
const STREAM_CLIENTS = ['IOS', 'ANDROID', 'TV_EMBEDDED', 'MWEB', 'WEB'] as const;

/**
 * Resolves a directly-playable audio URL for a YouTube video id. Returns null
 * when no suitable audio stream could be extracted.
 */
export async function resolveStreamUrl(videoId: string): Promise<string | null> {
  const yt = await client();
  let lastError: unknown = null;
  for (const c of STREAM_CLIENTS) {
    try {
      const info = await yt.getBasicInfo(videoId, { client: c });
      if (!info.streaming_data) continue;
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      const url = await format.decipher(yt.session.player);
      if (url) return url;
    } catch (e) {
      lastError = e; // try the next client
    }
  }
  if (lastError) throw lastError instanceof Error ? lastError : new Error(String(lastError));
  return null;
}

function safeFileName(track: OnlineTrack): string {
  const base = `${track.artist} - ${track.title}`.replace(/[^\w\-. ]+/g, '_');
  return `${base}.m4a`.slice(0, 120);
}

export type DownloadResult =
  | { ok: true; savedToLibrary: boolean }
  | { ok: false; error: string };

/**
 * Extracts the audio stream, downloads it to a local file, and registers it with
 * the device MediaStore so it appears in the on-device library after a rescan.
 */
export async function downloadOnline(track: OnlineTrack): Promise<DownloadResult> {
  try {
    const url = await resolveStreamUrl(track.id);
    if (!url) return { ok: false, error: 'Could not extract an audio stream for this track.' };

    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) return { ok: false, error: 'No writable directory available' };
    const target = dir + safeFileName(track);
    const { uri, status } = await FileSystem.downloadAsync(url, target);
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

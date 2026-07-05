import * as MediaLibrary from 'expo-media-library/legacy';
import type { Song } from '../types';

export const AUDIO_EXTENSIONS = [
  'mp3',
  'm4a',
  'aac',
  'flac',
  'wav',
  'ogg',
  'oga',
  'opus',
  'wma',
  'aiff',
  'aif',
  'alac',
  '3gp',
  'mid',
  'amr',
];

const PAGE_SIZE = 200;

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return '';
  return filename.slice(dot + 1).toLowerCase();
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot < 0 ? filename : filename.slice(0, dot);
}

/**
 * Derives a human-friendly title and artist from a filename.
 * Handles the common "Artist - Title" and "NN. Title" naming conventions.
 */
function parseNameParts(filename: string): { title: string; artist: string } {
  const base = stripExtension(filename).trim();
  const cleaned = base.replace(/^\s*\d{1,3}\s*[-.\)]\s*/, '').trim();
  const dash = cleaned.split(/\s+-\s+/);
  if (dash.length >= 2) {
    const artist = dash[0].trim();
    const title = dash.slice(1).join(' - ').trim();
    if (artist && title) return { title, artist };
  }
  return { title: cleaned || base, artist: 'Unknown artist' };
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function ensurePermission(): Promise<PermissionState> {
  const current = await MediaLibrary.getPermissionsAsync(false, ['audio']);
  if (current.granted) return 'granted';
  if (current.canAskAgain) {
    const req = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
    if (req.granted) return 'granted';
    return req.canAskAgain ? 'undetermined' : 'denied';
  }
  return 'denied';
}

/**
 * Scans the device's media storage for every audio asset and maps it to a Song.
 * Paginates through the full MediaStore so large libraries are fully covered.
 */
export async function scanAudio(
  onProgress?: (count: number) => void,
): Promise<Song[]> {
  const songs: Song[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    for (const asset of page.assets) {
      const ext = extensionOf(asset.filename);
      if (ext && !AUDIO_EXTENSIONS.includes(ext)) continue;
      const { title, artist } = parseNameParts(asset.filename);
      songs.push({
        id: asset.id,
        url: asset.uri,
        title,
        artist,
        album: 'Unknown album',
        albumId: asset.albumId,
        duration: asset.duration ?? 0,
        filename: asset.filename,
        ext,
      });
    }

    onProgress?.(songs.length);
    hasNextPage = page.hasNextPage;
    after = page.endCursor;
  }

  await annotateAlbums(songs);
  return songs;
}

/** Attaches album names to songs using the MediaStore album grouping. */
async function annotateAlbums(songs: Song[]): Promise<void> {
  try {
    const albums = await MediaLibrary.getAlbumsAsync();
    const byId = new Map(albums.map((a) => [a.id, a.title]));
    for (const song of songs) {
      if (song.albumId && byId.has(song.albumId)) {
        song.album = byId.get(song.albumId) as string;
      }
    }
  } catch {
    // Album metadata is best-effort; ignore failures.
  }
}

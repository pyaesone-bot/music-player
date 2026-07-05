import type { Track as RNTPTrack } from 'react-native-track-player';

export type Song = {
  id: string;
  url: string;
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  duration: number;
  filename: string;
  ext: string;
  artwork?: string;
  /** HTTP headers required to fetch a remote URL (e.g. YouTube media servers). */
  headers?: Record<string, string>;
  /** User-Agent required to fetch a remote URL. */
  userAgent?: string;
};

export type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
};

export type AlbumGroup = {
  id: string;
  name: string;
  songs: Song[];
};

/** Auto start/stop of playback after a chosen duration. */
export type SleepTimer = {
  endsAt: number;
  action: 'pause' | 'stop';
};

export type ScheduleAction = 'play' | 'stop';

/**
 * A time-of-day rule that plays or stops audio — e.g. a school bell.
 * `days` uses JS weekday numbers (0=Sun … 6=Sat); an empty array means every day.
 */
export type Schedule = {
  id: string;
  label: string;
  time: string; // "HH:MM" 24-hour
  days: number[];
  action: ScheduleAction;
  songId?: string;
  enabled: boolean;
  createdAt: number;
};

/** A track from YouTube (via the open-source Piped search API). */
export type OnlineTrack = {
  id: string; // YouTube video id
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
};

export function songToTrack(song: Song): RNTPTrack {
  return {
    id: song.id,
    url: song.url,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    artwork: song.artwork,
    ...(song.userAgent ? { userAgent: song.userAgent } : {}),
    ...(song.headers ? { headers: song.headers } : {}),
  };
}

export function onlineToSong(
  t: OnlineTrack,
  url: string,
  extras?: { headers?: Record<string, string>; userAgent?: string },
): Song {
  return {
    id: `yt:${t.id}`,
    url,
    title: t.title,
    artist: t.artist,
    album: 'YouTube',
    duration: t.duration,
    filename: `${t.artist} - ${t.title}.m4a`,
    ext: 'm4a',
    artwork: t.artwork,
    headers: extras?.headers,
    userAgent: extras?.userAgent,
  };
}

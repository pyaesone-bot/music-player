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

/** A streamable track from the online (Audius) catalogue. */
export type OnlineTrack = {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  streamUrl: string;
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
  };
}

export function onlineToSong(t: OnlineTrack): Song {
  return {
    id: `audius:${t.id}`,
    url: t.streamUrl,
    title: t.title,
    artist: t.artist,
    album: 'Audius',
    duration: t.duration,
    filename: `${t.artist} - ${t.title}.mp3`,
    ext: 'mp3',
    artwork: t.artwork,
  };
}

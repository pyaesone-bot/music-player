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

export function songToTrack(song: Song): RNTPTrack {
  return {
    id: song.id,
    url: song.url,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
  };
}

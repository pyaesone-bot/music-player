import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Songs: undefined;
  Albums: undefined;
  Online: undefined;
  Bell: undefined;
  Playlists: undefined;
  Favorites: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  NowPlaying: undefined;
  PlaylistDetail: { playlistId: string };
  AlbumDetail: { albumId: string; albumName: string };
};

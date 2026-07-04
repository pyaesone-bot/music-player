import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { MiniPlayer } from '../components/MiniPlayer';
import type { RootStackParamList, TabsParamList } from '../navigation';
import { colors } from '../theme';
import { AlbumsScreen } from './AlbumsScreen';
import { FavoritesScreen } from './FavoritesScreen';
import { LibraryScreen } from './LibraryScreen';
import { PlaylistsScreen } from './PlaylistsScreen';

const Tab = createBottomTabNavigator<TabsParamList>();

const ICONS: Record<keyof TabsParamList, keyof typeof Ionicons.glyphMap> = {
  Songs: 'musical-notes',
  Albums: 'albums',
  Playlists: 'list',
  Favorites: 'heart',
};

export function MainTabs() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const screenOptions = ({
    route,
  }: {
    route: { name: keyof TabsParamList };
  }): BottomTabNavigationOptions => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textFaint,
    tabBarStyle: {
      backgroundColor: colors.bgElevated,
      borderTopColor: colors.border,
      height: 62,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    tabBarIcon: ({ color, size }) => (
      <Ionicons name={ICONS[route.name]} size={size} color={color} />
    ),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Songs" component={LibraryScreen} />
        <Tab.Screen name="Albums" component={AlbumsScreen} />
        <Tab.Screen name="Playlists" component={PlaylistsScreen} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
      </Tab.Navigator>
      <View style={miniWrap}>
        <MiniPlayer onPress={() => navigation.navigate('NowPlaying')} />
      </View>
    </View>
  );
}

const miniWrap = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 62,
};

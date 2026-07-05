import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/navigation';
import { AlbumDetailScreen } from './src/screens/AlbumDetailScreen';
import { MainTabs } from './src/screens/MainTabs';
import { NowPlayingScreen } from './src/screens/NowPlayingScreen';
import { PlaylistDetailScreen } from './src/screens/PlaylistDetailScreen';
import { YtHelperWebView } from './src/lib/ytwebview';
import { PlayerProvider, usePlayer } from './src/store/PlayerStore';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

/** Kicks off an automatic device scan as soon as the player is ready. */
function AutoScanner() {
  const { ready, requestAndScan } = usePlayer();
  useEffect(() => {
    if (ready) void requestAndScan();
  }, [ready, requestAndScan]);
  return null;
}

export default function App() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <PlayerProvider>
          <AutoScanner />
          <YtHelperWebView />
          <StatusBar style="light" />
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="Tabs" component={MainTabs} />
              <Stack.Screen
                name="NowPlaying"
                component={NowPlayingScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
              <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PlayerProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

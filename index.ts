import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Registers the background playback service so lockscreen / notification controls
// keep working while the app is backgrounded.
TrackPlayer.registerPlaybackService(
  () => require('./src/playback/service').default,
);

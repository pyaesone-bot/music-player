import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { hueFromString } from '../lib/format';
import { radius } from '../theme';

type Props = {
  seed: string;
  size: number;
  rounded?: number;
  iconRatio?: number;
};

export function ArtCover({ seed, size, rounded, iconRatio = 0.42 }: Props) {
  const hue = hueFromString(seed);
  const c1 = `hsl(${hue}, 70%, 58%)`;
  const c2 = `hsl(${(hue + 40) % 360}, 72%, 42%)`;
  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cover,
        { width: size, height: size, borderRadius: rounded ?? radius.md },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name="musical-notes"
          size={size * iconRatio}
          color="rgba(255,255,255,0.92)"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

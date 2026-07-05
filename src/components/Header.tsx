import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: Action[];
};

export function Header({ title, subtitle, onBack, actions }: Props) {
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable hitSlop={12} onPress={onBack} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {actions?.map((a, i) => (
          <Pressable
            key={i}
            hitSlop={10}
            onPress={a.onPress}
            style={styles.actionBtn}
          >
            <Ionicons
              name={a.icon}
              size={22}
              color={a.active ? colors.primary : colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
    paddingBottom: spacing(3),
    gap: spacing(2),
  },
  back: {
    marginLeft: -6,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing(4),
    alignItems: 'center',
  },
  actionBtn: {
    padding: 2,
  },
});

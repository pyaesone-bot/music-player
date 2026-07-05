import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';

const PRESETS = [5, 10, 15, 30, 45, 60];

function remainingLabel(endsAt: number): string {
  const ms = Math.max(0, endsAt - Date.now());
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SleepTimerSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { sleepTimer, startSleepTimer, cancelSleepTimer } = usePlayer();
  const [action, setAction] = useState<'pause' | 'stop'>('pause');
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!sleepTimer) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [sleepTimer]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.heading}>Sleep timer</Text>

          {sleepTimer ? (
            <View style={styles.active}>
              <Ionicons name="moon" size={28} color={colors.primary} />
              <Text style={styles.activeTime}>{remainingLabel(sleepTimer.endsAt)}</Text>
              <Text style={styles.activeSub}>
                {sleepTimer.action === 'stop' ? 'Stops' : 'Pauses'} when it ends
              </Text>
              <Pressable style={styles.cancelBtn} onPress={cancelSleepTimer}>
                <Text style={styles.cancelText}>Cancel timer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.segment}>
                <Pressable
                  style={[styles.segBtn, action === 'pause' && styles.segBtnActive]}
                  onPress={() => setAction('pause')}
                >
                  <Text
                    style={[styles.segText, action === 'pause' && styles.segTextActive]}
                  >
                    Pause
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segBtn, action === 'stop' && styles.segBtnActive]}
                  onPress={() => setAction('stop')}
                >
                  <Text
                    style={[styles.segText, action === 'stop' && styles.segTextActive]}
                  >
                    Stop
                  </Text>
                </Pressable>
              </View>
              <View style={styles.grid}>
                {PRESETS.map((m) => (
                  <Pressable
                    key={m}
                    style={styles.chip}
                    onPress={() => {
                      startSleepTimer(m, action);
                      onClose();
                    }}
                  >
                    <Text style={styles.chipText}>{m} min</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing(5),
    paddingBottom: spacing(10),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing(4),
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing(4),
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing(4),
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.primary,
  },
  segText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  segTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(3),
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3.5),
    borderRadius: radius.md,
    minWidth: 92,
    alignItems: 'center',
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  active: {
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(4),
  },
  activeTime: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  activeSub: {
    color: colors.textMuted,
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: spacing(4),
    backgroundColor: colors.card,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: radius.pill,
  },
  cancelText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});

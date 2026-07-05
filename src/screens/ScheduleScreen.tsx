import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';
import type { Schedule, ScheduleAction } from '../types';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysSummary(days: number[]): string {
  if (days.length === 0) return 'Every day';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join(',') === '1,2,3,4,5') return 'Weekdays';
  if (sorted.join(',') === '0,6') return 'Weekends';
  return sorted.map((d) => DAY_NAMES[d]).join(' ');
}

export function ScheduleScreen() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, toggleSchedule } =
    usePlayer();
  const [editing, setEditing] = useState<Schedule | 'new' | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Schedule"
        subtitle="School bell & timed playback"
        actions={[{ icon: 'add-circle', onPress: () => setEditing('new') }]}
      />
      <FlatList
        data={schedules}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setEditing(item)}>
            <View style={styles.timeWrap}>
              <Text style={[styles.time, !item.enabled && styles.dim]}>{item.time}</Text>
              <View
                style={[
                  styles.tag,
                  item.action === 'play' ? styles.tagPlay : styles.tagStop,
                ]}
              >
                <Ionicons
                  name={item.action === 'play' ? 'play' : 'stop'}
                  size={10}
                  color="#fff"
                />
                <Text style={styles.tagText}>{item.action === 'play' ? 'Play' : 'Stop'}</Text>
              </View>
            </View>
            <View style={styles.meta}>
              <Text numberOfLines={1} style={[styles.label, !item.enabled && styles.dim]}>
                {item.label || 'Bell'}
              </Text>
              <Text style={styles.days}>{daysSummary(item.days)}</Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleSchedule(item.id)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="alarm"
            title="No schedules"
            message="Add a schedule to play or stop audio at set times — perfect for a school bell."
            actionLabel="Add schedule"
            onAction={() => setEditing('new')}
          />
        }
      />
      {editing ? (
        <ScheduleEditor
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  deleteSchedule(editing.id);
                  setEditing(null);
                }
          }
          onSave={(draft) => {
            if (editing === 'new') addSchedule(draft);
            else updateSchedule(editing.id, draft);
            setEditing(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

type Draft = {
  label: string;
  time: string;
  days: number[];
  action: ScheduleAction;
  songId?: string;
};

function ScheduleEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Schedule | null;
  onSave: (draft: Draft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const { songs, songById } = usePlayer();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [hour, setHour] = useState(initial ? parseInt(initial.time.split(':')[0], 10) : 8);
  const [minute, setMinute] = useState(
    initial ? parseInt(initial.time.split(':')[1], 10) : 0,
  );
  const [days, setDays] = useState<number[]>(initial?.days ?? []);
  const [action, setAction] = useState<ScheduleAction>(initial?.action ?? 'play');
  const [songId, setSongId] = useState<string | undefined>(initial?.songId);
  const [picking, setPicking] = useState(false);

  const selectedSong = songId ? songById.get(songId) : undefined;

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );

  const step = (setter: (fn: (v: number) => number) => void, delta: number, mod: number) =>
    setter((v) => (v + delta + mod) % mod);

  const save = () =>
    onSave({
      label: label.trim(),
      time: `${pad2(hour)}:${pad2(minute)}`,
      days,
      action,
      songId: action === 'play' ? songId : undefined,
    });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.heading}>{initial ? 'Edit schedule' : 'New schedule'}</Text>

          <View style={styles.clock}>
            <Stepper
              value={hour}
              onUp={() => step(setHour, 1, 24)}
              onDown={() => step(setHour, -1, 24)}
            />
            <Text style={styles.colon}>:</Text>
            <Stepper
              value={minute}
              onUp={() => step(setMinute, 1, 60)}
              onDown={() => step(setMinute, -1, 60)}
            />
          </View>

          <View style={styles.dayRow}>
            {DAY_LABELS.map((d, i) => (
              <Pressable
                key={i}
                style={[styles.dayChip, days.includes(i) && styles.dayChipActive]}
                onPress={() => toggleDay(i)}
              >
                <Text
                  style={[styles.dayText, days.includes(i) && styles.dayTextActive]}
                >
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>{daysSummary(days)}</Text>

          <View style={styles.segment}>
            {(['play', 'stop'] as const).map((a) => (
              <Pressable
                key={a}
                style={[styles.segBtn, action === a && styles.segBtnActive]}
                onPress={() => setAction(a)}
              >
                <Ionicons
                  name={a === 'play' ? 'play' : 'stop'}
                  size={15}
                  color={action === a ? '#fff' : colors.textMuted}
                />
                <Text style={[styles.segText, action === a && styles.segTextActive]}>
                  {a === 'play' ? 'Play audio' : 'Stop audio'}
                </Text>
              </Pressable>
            ))}
          </View>

          {action === 'play' ? (
            <Pressable style={styles.trackBtn} onPress={() => setPicking(true)}>
              <Ionicons name="musical-note" size={18} color={colors.primary} />
              <Text numberOfLines={1} style={styles.trackText}>
                {selectedSong ? selectedSong.title : 'Whole library'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}

          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Label (e.g. Period 1 bell)"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <View style={styles.footer}>
            {onDelete ? (
              <Pressable style={styles.deleteBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            ) : null}
            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>

          <Modal visible={picking} transparent animationType="slide">
            <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
              <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                <View style={styles.handle} />
                <Text style={styles.heading}>Choose track</Text>
                <Pressable
                  style={styles.pickRow}
                  onPress={() => {
                    setSongId(undefined);
                    setPicking(false);
                  }}
                >
                  <Ionicons name="albums" size={20} color={colors.textMuted} />
                  <Text style={styles.pickText}>Whole library</Text>
                </Pressable>
                <FlatList
                  data={songs}
                  keyExtractor={(s) => s.id}
                  style={styles.pickList}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.pickRow}
                      onPress={() => {
                        setSongId(item.id);
                        setPicking(false);
                      }}
                    >
                      <Ionicons name="musical-note" size={20} color={colors.textMuted} />
                      <Text numberOfLines={1} style={styles.pickText}>
                        {item.title}
                      </Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.pickEmpty}>No local songs found yet.</Text>
                  }
                />
              </Pressable>
            </Pressable>
          </Modal>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({
  value,
  onUp,
  onDown,
}: {
  value: number;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={8} onPress={onUp}>
        <Ionicons name="chevron-up" size={26} color={colors.textMuted} />
      </Pressable>
      <Text style={styles.stepValue}>{pad2(value)}</Text>
      <Pressable hitSlop={8} onPress={onDown}>
        <Ionicons name="chevron-down" size={26} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 140,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  timeWrap: {
    alignItems: 'center',
    gap: spacing(1),
    width: 74,
  },
  time: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dim: {
    opacity: 0.4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagPlay: {
    backgroundColor: colors.primary,
  },
  tagStop: {
    backgroundColor: colors.danger,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  days: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
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
    maxHeight: '88%',
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
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
    marginBottom: spacing(5),
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(5),
    gap: spacing(1),
  },
  stepValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  dayTextActive: {
    color: '#fff',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(3),
    borderRadius: radius.pill,
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
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    marginBottom: spacing(4),
  },
  trackText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing(4),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(4),
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  pickList: {
    marginTop: spacing(2),
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
  },
  pickText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  pickEmpty: {
    color: colors.textMuted,
    paddingVertical: spacing(4),
  },
});

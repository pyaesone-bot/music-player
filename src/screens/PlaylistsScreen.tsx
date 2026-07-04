import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import type { RootStackParamList } from '../navigation';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';

export function PlaylistsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playlists, createPlaylist, deletePlaylist } = usePlayer();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    if (name.trim()) createPlaylist(name);
    setName('');
    setCreating(false);
  };

  const confirmDelete = (id: string, label: string) => {
    Alert.alert('Delete playlist', `Delete "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Playlists"
        actions={[{ icon: 'add-circle', onPress: () => setCreating((v) => !v) }]}
      />
      {creating ? (
        <View style={styles.createRow}>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="Playlist name"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            onSubmitEditing={submit}
          />
          <Pressable style={styles.createBtn} onPress={submit}>
            <Text style={styles.createBtnText}>Create</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            android_ripple={{ color: colors.cardAlt }}
            onPress={() =>
              navigation.navigate('PlaylistDetail', { playlistId: item.id })
            }
            onLongPress={() => confirmDelete(item.id, item.name)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="musical-notes" size={22} color={colors.primary} />
            </View>
            <View style={styles.meta}>
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
              <Text style={styles.count}>{item.songIds.length} songs</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => confirmDelete(item.id, item.name)}>
              <Ionicons name="trash-outline" size={20} color={colors.textFaint} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="list"
            title="No playlists"
            message="Create a playlist, then add songs from the song menu."
            actionLabel="New playlist"
            onAction={() => setCreating(true)}
          />
        }
      />
    </SafeAreaView>
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
  createRow: {
    flexDirection: 'row',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(3),
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: colors.text,
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  count: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginTop: 2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePlayer } from '../store/PlayerStore';
import { colors, radius, spacing } from '../theme';

type Props = {
  songId: string | null;
  onClose: () => void;
};

export function AddToPlaylistSheet({ songId, onClose }: Props) {
  const { playlists, addToPlaylist, createPlaylist } = usePlayer();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const visible = songId !== null;

  const handleAdd = (playlistId: string) => {
    if (songId) addToPlaylist(playlistId, songId);
    onClose();
  };

  const handleCreate = () => {
    const pl = createPlaylist(name);
    if (songId) addToPlaylist(pl.id, songId);
    setName('');
    setCreating(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.heading}>Add to playlist</Text>

          {creating ? (
            <View style={styles.createRow}>
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="Playlist name"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                onSubmitEditing={handleCreate}
              />
              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.newRow} onPress={() => setCreating(true)}>
              <View style={styles.newIcon}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.newText}>New playlist</Text>
            </Pressable>
          )}

          <FlatList
            data={playlists}
            keyExtractor={(p) => p.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => handleAdd(item.id)}>
                <Ionicons name="list" size={20} color={colors.textMuted} />
                <Text style={styles.rowText}>{item.name}</Text>
                <Text style={styles.count}>{item.songIds.length}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              creating ? null : (
                <Text style={styles.empty}>No playlists yet — create one above.</Text>
              )
            }
          />
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
    maxHeight: '70%',
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
    marginBottom: spacing(3),
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
  },
  newIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  createRow: {
    flexDirection: 'row',
    gap: spacing(2),
    alignItems: 'center',
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
    paddingVertical: spacing(3),
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    marginTop: spacing(2),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
  },
  rowText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  count: {
    color: colors.textFaint,
    fontSize: 13,
  },
  empty: {
    color: colors.textMuted,
    paddingVertical: spacing(4),
  },
});
